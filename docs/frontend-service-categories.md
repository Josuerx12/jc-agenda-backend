# Contrato frontend: categorias e seleção de serviços

Este documento orienta as alterações no painel administrativo e no fluxo de
agendamento após a introdução de categorias de serviço. O objetivo é evitar o
carregamento de catálogos grandes e permitir seleção progressiva por
profissional, categoria e busca.

## Mudança de contrato

Todo serviço agora pertence obrigatoriamente a uma categoria do mesmo tenant.
Após a migração, serviços existentes ficam na categoria `Geral` de sua empresa.

`GET /appointments/professionals` tornou-se leve e não retorna mais `services`:

```ts
interface ProfessionalOption {
  id: string;
  firstName: string;
  lastName: string;
  avatar: MediaReference | null;
}
```

Serviços devem ser buscados somente depois da escolha do profissional.

## Tipos

```ts
interface ServiceCategory {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ServiceCategoryOption {
  id: string;
  name: string;
  description: string | null;
  serviceCount: number;
}

interface ProfessionalServiceOption {
  id: string;
  categoryId: string;
  category: { id: string; name: string };
  name: string;
  description: string | null;
  price: number;
  durationInMinutes: number;
  image: MediaReference | null;
}

interface ProfessionalServicesResponse {
  data: ProfessionalServiceOption[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}
```

## Painel administrativo: categorias

Todas as rotas exigem JWT e `x-company-id`. Leituras são permitidas para
membros autenticados; criação, edição e exclusão exigem dono ou administrador.

| Ação             | Rota                                  |
| ---------------- | ------------------------------------- |
| Criar            | `POST /service-categories`            |
| Listar           | `GET /service-categories`             |
| Listagem simples | `GET /service-categories/simple-list` |
| Consultar        | `GET /service-categories/:id`         |
| Editar           | `PATCH /service-categories/:id`       |
| Excluir          | `DELETE /service-categories/:id`      |

Criação:

```json
{
  "name": "Cabelo",
  "description": "Cortes, tratamentos e coloração"
}
```

`name` é obrigatório, possui no máximo 100 caracteres e é único na empresa sem
diferenciar maiúsculas de minúsculas. `description` é opcional e possui no
máximo 255 caracteres. Não envie `companyId` no corpo.

A listagem usa o mesmo contrato paginado dos produtos e serviços. Aceita
`page`, `limit`, `search`, `sortBy=name:ASC` e `filter.name=$ilike:texto`.
`simple-list` retorna `{ id, name }[]` ordenado pelo nome e deve alimentar o
select dos formulários.

Exclusão bem-sucedida retorna `204`. Se houver algum serviço vinculado, retorna
`409 A categoria possui serviços vinculados`. Nesse caso, direcione o usuário
para filtrar os serviços da categoria e movê-los antes de tentar novamente.

## Painel administrativo: serviços

Adicione `categoryId` aos contratos de criação e edição:

```ts
interface CreateServiceInput {
  categoryId: string;
  name: string;
  price: number;
  description: string;
  durationInMinutes: number;
}

type UpdateServiceInput = Partial<CreateServiceInput>;
```

`POST /services` exige `categoryId`. `PATCH /services/:id` aceita a troca de
categoria. A API responde `404 Categoria de serviço não encontrada` quando a
categoria não existe no tenant.

As respostas de `GET /services`, `GET /services/:id` e
`GET /services/simple-list` incluem `categoryId` e `category: { id, name }`.
A listagem também permite:

```http
GET /services?filter.categoryId=$eq:<category-id>
GET /services?search=cabelo&sortBy=category.name:ASC
```

Na tela administrativa:

- carregue `GET /service-categories/simple-list` ao abrir o formulário;
- torne categoria um select obrigatório;
- ofereça filtro por categoria na tabela de serviços;
- mostre a categoria como coluna ou badge;
- mantenha uma ação para administrar categorias próxima ao select;
- ao criar a primeira categoria personalizada, permita mover serviços de
  `Geral` por edição individual ou ação em lote futura.

## Agendamento público: seleção progressiva

As rotas abaixo são públicas, mas exigem `x-company-id`.

### 1. Profissional

```http
GET /appointments/professionals
```

Renderize apenas os profissionais. Não espere mais um array `services` nessa
resposta. Ao trocar o profissional, limpe categoria, busca, serviços
selecionados, data e horário.

### 2. Dropdown de categoria

```http
GET /appointments/professionals/:professionalId/service-categories
GET /appointments/professionals/:professionalId/service-categories?search=cab
```

Retorna até 50 categorias ordenadas por nome. A consulta usa `INNER JOIN` e
retorna somente categorias que possuam pelo menos um serviço associado ao
profissional ativo selecionado.

```json
[
  {
    "id": "uuid-da-categoria",
    "name": "Cabelo",
    "description": "Cortes e tratamentos",
    "serviceCount": 12
  }
]
```

Use um combobox pesquisável. Para catálogos pequenos, carregue ao abrir; para
muitos itens, aplique debounce de 300 a 500 ms no parâmetro `search`. Mostre
`serviceCount` como informação auxiliar.

### 3. Serviços associados

```http
GET /appointments/professionals/:professionalId/services?categoryId=<uuid>&search=corte&page=1&limit=20
```

Parâmetros:

| Campo        | Regra                               |
| ------------ | ----------------------------------- |
| `categoryId` | opcional; UUID da categoria         |
| `search`     | opcional; busca em nome e descrição |
| `page`       | padrão 1                            |
| `limit`      | padrão 20, máximo 50                |

A consulta usa `INNER JOIN` entre vínculo do profissional, serviço e categoria.
Assim, nunca retorna serviço de outro profissional ou tenant. Use paginação ou
scroll infinito; não carregue todas as páginas antecipadamente.

Permita múltipla seleção. Ao mudar a categoria, preserve serviços já escolhidos
em outras categorias em uma área de resumo, mas limpe resultados e página da
busca atual. Ao mudar o texto, volte para `page=1`.

Depois da seleção, `GET /appointments/availability` continua recebendo somente
`date`, `professionalId` e `serviceIds`. A resposta contém
`selectedServices`, totais e horários; não contém mais o catálogo completo em
`services`.

## Atendimento em andamento

Para adicionar um serviço durante o atendimento, reutilize a mesma consulta:

```http
GET  /appointments/professionals/:professionalId/service-categories
GET  /appointments/professionals/:professionalId/services?categoryId=<uuid>&search=<texto>
POST /appointments/:appointmentId/attendance/services
```

O `professionalId` vem do `AttendanceDetail`. Remova dos resultados os IDs já
presentes em `attendance.services`. O `POST` recebe:

```json
{ "serviceIds": ["uuid-do-servico"] }
```

Serviços existentes são ignorados pelo backend, e somente serviços atualmente
associados ao profissional podem ser adicionados.

## Cache

```ts
const serviceSelectionKeys = {
  categories: (companyId: string, professionalId: string, search: string) =>
    ['service-categories', companyId, professionalId, search] as const,
  services: (
    companyId: string,
    professionalId: string,
    categoryId: string | null,
    search: string,
    page: number,
  ) =>
    [
      'professional-services',
      companyId,
      professionalId,
      categoryId,
      search,
      page,
    ] as const,
};
```

Inclua sempre empresa e profissional nas chaves. Após alterar categoria,
serviço ou vínculos do profissional, invalide categorias e serviços públicos
relacionados.

## Erros e estados

- `400`: UUID, paginação ou payload inválido;
- `401`: sessão ausente no painel administrativo;
- `403`: sem permissão administrativa;
- `404`: categoria não encontrada ou não pertencente à empresa;
- `409`: nome duplicado ou tentativa de excluir categoria em uso;
- `429`: excesso de buscas; aguarde antes do retry.

Implemente loading, vazio e retry independentes para profissionais, categorias
e serviços. Uma categoria sem resultados na busca não significa que o
profissional não tenha serviços em outras categorias.

## Checklist

- [ ] Cadastro e edição de serviço exigem categoria.
- [ ] Painel possui CRUD de categorias e trata exclusão bloqueada.
- [ ] Lista de serviços filtra e exibe categoria.
- [ ] Agendamento não depende mais de serviços dentro do profissional.
- [ ] Dropdown mostra apenas categorias associadas ao profissional.
- [ ] Serviços usam busca paginada e `INNER JOIN` no backend.
- [ ] Troca de profissional limpa toda a seleção dependente.
- [ ] Serviços já selecionados permanecem visíveis no resumo.
- [ ] Atendimento reutiliza categoria e busca para serviços adicionais.
- [ ] Cache permanece isolado por empresa e profissional.
