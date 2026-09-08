# Ajuste frontend: agendamento orientado por serviços

Este documento trata exclusivamente da mudança do fluxo público de
agendamento para começar pelo catálogo de serviços. Ele não substitui os
contratos administrativos ou de atendimento.

## Novo fluxo

1. Resolver a empresa e aplicar seu branding.
2. Listar categorias disponíveis para agendamento.
3. Buscar e selecionar um ou mais serviços.
4. Listar profissionais que executem todos os serviços selecionados.
5. Escolher o profissional, a data e o horário.
6. Identificar ou cadastrar o cliente pelo telefone.
7. Revisar e criar o agendamento.

Todas as rotas deste documento são públicas e exigem:

```http
x-company-id: <uuid-da-empresa>
```

## Tipos

```ts
interface BookingCategory {
  id: string;
  name: string;
  description: string | null;
  serviceCount: number;
}

interface BookingService {
  id: string;
  categoryId: string;
  category: { id: string; name: string };
  name: string;
  description: string | null;
  price: number;
  durationInMinutes: number;
  image: MediaReference | null;
}

interface BookingProfessional {
  id: string;
  firstName: string;
  lastName: string;
  avatar: MediaReference | null;
}

interface BookingServicesPage {
  data: BookingService[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}
```

## 1. Categorias disponíveis

```http
GET /appointments/service-categories
GET /appointments/service-categories?search=cab
```

A resposta é `BookingCategory[]`, ordenada por nome e limitada a 50 itens. A
API usa `INNER JOIN` e retorna somente categorias que tenham pelo menos um
serviço associado a algum profissional ativo da empresa.

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

Use categorias expansíveis, tabs ou combobox pesquisável. A categoria é um
filtro de navegação e não precisa ser armazenada na confirmação final.

## 2. Catálogo paginado de serviços

```http
GET /appointments/services?categoryId=<uuid>&search=corte&page=1&limit=20
```

| Parâmetro    | Obrigatório | Regra                       |
| ------------ | ----------- | --------------------------- |
| `categoryId` | Não         | UUID da categoria           |
| `search`     | Não         | Busca por nome ou descrição |
| `page`       | Não         | Padrão 1                    |
| `limit`      | Não         | Padrão 20, máximo 50        |

A API retorna apenas serviços que estejam associados a pelo menos um
profissional ativo do tenant. Use paginação ou scroll infinito e debounce de
300 a 500 ms na busca. Não carregue todas as categorias ou páginas em paralelo.

Permita múltipla seleção. Serviços selecionados devem permanecer em uma seção
de resumo mesmo quando o usuário trocar a categoria, busca ou página. Use o ID
como identidade e impeça duplicidade.

```ts
const selectedServices = new Map<string, BookingService>();
```

Ao remover ou adicionar serviços, invalide o profissional e o horário já
selecionados, pois a compatibilidade e a duração total mudaram.

## 3. Profissionais compatíveis com todos os serviços

```http
GET /appointments/services/professionals?serviceIds=<id-1>,<id-2>
```

`serviceIds` aceita UUIDs separados por vírgula ou parâmetros repetidos. Deve
conter pelo menos um ID e não aceita duplicados.

A resposta é `BookingProfessional[]`. O backend agrupa os vínculos e aplica
`HAVING COUNT(DISTINCT service.id) = quantidadeSelecionada`; portanto cada
profissional retornado executa todos os serviços escolhidos, não apenas um
deles.

```json
[
  {
    "id": "uuid-do-profissional",
    "firstName": "Ana",
    "lastName": "Silva",
    "avatar": {
      "id": "uuid-da-midia",
      "url": "/media/uuid-da-midia",
      "downloadUrl": "/media/uuid-da-midia?download=true"
    }
  }
]
```

Se a resposta estiver vazia, informe que nenhum profissional executa a
combinação completa e permita remover um serviço. Não dispare uma requisição
por profissional e não faça a interseção no frontend.

## 4. Disponibilidade

Depois de escolher o profissional e uma data:

```http
GET /appointments/availability?date=2026-09-10&professionalId=<uuid>&serviceIds=<id-1>,<id-2>
```

Envie exatamente os mesmos `serviceIds` usados para encontrar os profissionais.
A API revalida os vínculos, calcula duração/preço e retorna `availableSlots`.
Ao confirmar, envie o `startAt` original do slot, sem reconstruir fuso ou hora.

## 5. Cliente e confirmação

Após escolher o slot:

```http
GET  /clients/by-phone?phone=<telefone>
POST /clients
POST /appointments
```

Se a busca retornar `null`, cadastre o cliente no tenant. Se o cadastro retornar
`409`, refaça a busca pelo telefone e reutilize o registro encontrado.

Criação final:

```json
{
  "clientId": "uuid-do-cliente",
  "professionalId": "uuid-do-profissional",
  "serviceIds": ["uuid-1", "uuid-2"],
  "startAt": "2026-09-10T12:00:00.000Z"
}
```

Se retornar `409` porque o horário foi ocupado, preserve serviços e
profissional, limpe somente o slot e consulte novamente a disponibilidade.

## Estado e invalidação

```ts
interface ServicesFirstBookingDraft {
  companyId: string;
  services: BookingService[];
  professional: BookingProfessional | null;
  date: string | null;
  slot: AvailabilitySlot | null;
  client: ClientReference | null;
}
```

Regras de dependência:

- troca de tenant limpa todo o fluxo;
- mudança de serviços limpa profissional, data e slot;
- mudança de profissional limpa data e slot;
- mudança de data limpa slot;
- resultado de disponibilidade nunca deve ser reutilizado entre combinações de
  serviços;
- depois da criação, invalide a disponibilidade daquele profissional/data.

Chaves sugeridas:

```ts
const bookingCatalogKeys = {
  categories: (companyId: string, search: string) =>
    ['booking-categories', companyId, search] as const,
  services: (
    companyId: string,
    categoryId: string | null,
    search: string,
    page: number,
  ) => ['booking-services', companyId, categoryId, search, page] as const,
  professionals: (companyId: string, serviceIds: string[]) =>
    ['booking-professionals', companyId, [...serviceIds].sort()] as const,
};
```

## Compatibilidade

As rotas orientadas pelo profissional continuam disponíveis para o atendimento
interno:

```http
GET /appointments/professionals/:professionalId/service-categories
GET /appointments/professionals/:professionalId/services
```

Não use essas duas rotas no novo fluxo público. Elas servem para o profissional
localizar serviços adicionais durante um atendimento já iniciado.

## Checklist de aceite

- [ ] A primeira seleção do catálogo é categoria/serviço, não profissional.
- [ ] Categorias vazias ou sem profissional ativo não aparecem.
- [ ] Catálogo usa paginação e busca com debounce.
- [ ] Serviços escolhidos permanecem visíveis ao trocar filtro ou página.
- [ ] O frontend chama uma única rota para profissionais compatíveis.
- [ ] Todos os profissionais exibidos executam todos os serviços selecionados.
- [ ] Mudanças de serviços invalidam profissional e horário.
- [ ] Estado vazio permite ajustar a combinação de serviços.
- [ ] Disponibilidade usa os mesmos IDs da seleção.
- [ ] Telefone e cadastro do cliente ocorrem depois da escolha do horário.
- [ ] Criação trata conflito de horário sem perder o catálogo selecionado.
- [ ] Cache está sempre isolado por `companyId`.
