# Contrato frontend: produtos

Este documento é o handoff para implementar o módulo de produtos no frontend.
Ele descreve o contrato atual da API, os fluxos recomendados e os estados que a
interface deve tratar.

## Escopo da interface

O módulo deve oferecer:

- listagem paginada em tabela ou cards;
- busca por nome e descrição;
- ordenação e filtros;
- cadastro e edição de produto;
- imagem principal com preview, substituição, remoção e download;
- confirmação antes da exclusão;
- estados de carregamento, vazio, erro e retry;
- feedback de validação por campo.

Cada produto possui no máximo uma imagem principal. O upload de uma nova imagem
substitui a anterior.

## Autenticação e tenant

Todas as rotas de produto exigem:

```http
Authorization: Bearer <jwt>
x-company-id: <uuid-da-empresa>
```

O `x-company-id` precisa ser a mesma empresa presente na sessão autenticada.
Listagens e consultas podem ser realizadas por membros autenticados. Criação,
edição, exclusão e alterações de imagem exigem dono ou administrador da empresa.

## Tipos TypeScript

O PostgreSQL pode devolver colunas `numeric` como string. Portanto, aceite os
dois formatos na resposta e normalize somente na camada de apresentação.

```ts
export interface MediaReference {
  id: string;
  url: string;
  downloadUrl: string;
}

export interface StoredMedia extends MediaReference {
  originalName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  price: number | string;
  description: string | null;
  imageId: string | null;
  image: MediaReference | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProductSimple {
  id: string;
  companyId: string;
  name: string;
  imageId: string | null;
  image: MediaReference | null;
}

export interface CreateProductInput {
  name: string;
  price: number;
  description: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    itemsPerPage: number;
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    sortBy: Array<[string, 'ASC' | 'DESC']>;
    searchBy: string[];
    search: string;
    select: string[];
    filter?: Record<string, string | string[]>;
  };
  links: {
    first?: string;
    previous?: string;
    current: string;
    next?: string;
    last?: string;
  };
}
```

Para cálculos, converta o preço de forma explícita:

```ts
const numericPrice = Number(product.price);
const formattedPrice = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(numericPrice);
```

## Criar produto

```http
POST /products
Content-Type: application/json
```

```json
{
  "name": "Shampoo profissional",
  "price": 49.9,
  "description": "Shampoo para uso diário."
}
```

Resposta: `201 Created` com `Product`. `companyId` não deve ser enviado no
payload; ele é obtido pelo backend a partir do header.

Regras atuais:

- `name` é obrigatório e precisa ser texto;
- `price` é obrigatório, precisa ser número JSON e aceita até duas casas
  decimais;
- `description` é obrigatória e precisa ser texto;
- use no máximo 255 caracteres no nome, conforme o limite do banco;
- no frontend, restrinja o preço a valores positivos e ao máximo de
  `99999999.99`.

Não envie o preço como string:

```ts
const payload: CreateProductInput = {
  name: form.name.trim(),
  price: Number(form.price),
  description: form.description.trim(),
};
```

## Listar produtos

```http
GET /products
```

Sem parâmetros, a API retorna 10 registros, ordenados por `name:ASC`. O limite
máximo por página é 100.

Parâmetros disponíveis:

| Parâmetro          | Exemplo                            | Comportamento                     |
| ------------------ | ---------------------------------- | --------------------------------- |
| `page`             | `page=2`                           | Página baseada em 1               |
| `limit`            | `limit=20`                         | Quantidade por página, máximo 100 |
| `search`           | `search=shampoo`                   | Busca em nome e descrição         |
| `sortBy`           | `sortBy=price:DESC`                | Ordenação                         |
| `filter.name`      | `filter.name=$ilike:shampoo`       | Nome contendo texto               |
| `filter.price`     | `filter.price=$gte:10`             | Preço mínimo                      |
| `filter.price`     | `filter.price=$lte:100`            | Preço máximo                      |
| `filter.price`     | `filter.price=$btw:10,100`         | Faixa de preço                    |
| `filter.createdAt` | `filter.createdAt=$gte:2026-01-01` | Data inicial                      |
| `filter.createdAt` | `filter.createdAt=$lte:2026-12-31` | Data final                        |

Colunas permitidas em `sortBy`:

- `name`;
- `price`;
- `createdAt`;
- `updatedAt`.

Exemplo:

```http
GET /products?page=1&limit=20&search=shampoo&sortBy=price:ASC&filter.price=$btw:10,100
```

Use o mecanismo de query params do cliente HTTP para fazer o encode dos valores.
Ao mudar busca, filtro ou ordenação, volte para `page=1`. Para busca digitada,
aplique debounce entre 300 e 500 ms.

Exemplo de resposta:

```json
{
  "data": [
    {
      "id": "uuid-do-produto",
      "companyId": "uuid-da-empresa",
      "name": "Shampoo profissional",
      "price": "49.90",
      "description": "Shampoo para uso diário.",
      "imageId": "uuid-da-imagem",
      "image": {
        "id": "uuid-da-imagem",
        "url": "/media/uuid-da-imagem",
        "downloadUrl": "/media/uuid-da-imagem?download=true"
      },
      "createdAt": "2026-09-05T12:00:00.000Z",
      "updatedAt": "2026-09-05T12:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "itemsPerPage": 20,
    "totalItems": 1,
    "currentPage": 1,
    "totalPages": 1,
    "sortBy": [["price", "ASC"]],
    "searchBy": ["name", "description"],
    "search": "shampoo",
    "select": []
  },
  "links": {
    "current": "/products?page=1&limit=20"
  }
}
```

## Listagem simples

```http
GET /products/simple-list
```

Resposta: `200 OK` com `ProductSimple[]`. Use somente em selects, autocomplete
ou referências rápidas. Essa rota não retorna preço, descrição ou paginação.

## Consultar produto

```http
GET /products/:id
```

Resposta: `200 OK` com `Product`. No contrato atual, um ID inexistente retorna
`200 OK` com corpo `null`; trate `null` como produto não encontrado.

## Editar produto

```http
PATCH /products/:id
Content-Type: application/json
```

Envie somente os campos alterados:

```json
{
  "name": "Shampoo profissional 500 ml",
  "price": 54.9
}
```

Resposta: `200 OK` com o `Product` atualizado. As mesmas validações do cadastro
são aplicadas aos campos presentes. A imagem não faz parte desse payload.

## Excluir produto

```http
DELETE /products/:id
```

A exclusão é lógica e remove também a imagem física vinculada. No contrato
atual, a rota responde `200 OK`; após o sucesso, remova o item do cache/listagem
e mostre feedback ao usuário.

Antes de chamar a rota, abra uma confirmação contendo o nome do produto. Não use
atualização otimista para exclusão sem manter uma forma simples de rollback.

## Imagem do produto

### Upload ou substituição

```http
PUT /products/:id/image
Content-Type: multipart/form-data
```

```ts
const formData = new FormData();
formData.append('file', file);

// Não configure Content-Type manualmente.
const media = await api.put<StoredMedia>(
  `/products/${productId}/image`,
  formData,
);
```

Resposta: `200 OK` com `StoredMedia`. Formatos aceitos: JPEG, PNG e WebP. O
limite padrão é 5 MiB. Valide formato e tamanho no frontend para feedback rápido,
mas preserve o tratamento da validação do servidor.

Para preview local antes do envio:

```ts
const previewUrl = URL.createObjectURL(file);

// Ao trocar a imagem ou desmontar o componente:
URL.revokeObjectURL(previewUrl);
```

Depois do upload, substitua `product.image` pela referência retornada ou invalide
a consulta do produto. A URL muda a cada substituição, portanto não acrescente
parâmetros manuais para evitar cache.

### Remover imagem

```http
DELETE /products/:id/image
```

Resposta: `204 No Content`. Depois do sucesso, defina `image` e `imageId` como
`null` no estado local ou invalide a consulta.

### Exibir ou baixar

O campo `image.url` exibe a imagem e `image.downloadUrl` força download. As URLs
são relativas à API:

```ts
const imageUrl = product.image
  ? new URL(product.image.url, API_ORIGIN).toString()
  : FALLBACK_PRODUCT_IMAGE;
```

Sempre renderize fallback quando `image` for `null` e preencha um texto
alternativo usando o nome do produto.

## Fluxos recomendados

### Cadastro com imagem opcional

1. Validar os campos e a imagem localmente.
2. Executar `POST /products` com JSON.
3. Se existir imagem, executar `PUT /products/:id/image` com o ID retornado.
4. Se o upload falhar, manter o produto criado e oferecer `Tentar novamente`.
5. Invalidar a listagem e navegar ou fechar o formulário.

O cadastro e o upload são requisições independentes. Não mostre que todo o fluxo
falhou se apenas a segunda requisição falhar.

### Edição

1. Executar `PATCH /products/:id` quando houver mudanças textuais.
2. Executar o upload somente se o usuário tiver selecionado uma nova imagem.
3. Executar `DELETE /products/:id/image` somente quando ele confirmar a remoção.
4. Invalidar a consulta individual e a listagem ao concluir.

## Estado e cache

Uma sugestão de chaves, independentemente da biblioteca utilizada:

```ts
const productKeys = {
  all: ['products'] as const,
  list: (companyId: string, query: ProductListQuery) =>
    ['products', companyId, query] as const,
  detail: (companyId: string, id: string) =>
    ['products', companyId, id] as const,
  simple: (companyId: string) => ['products', companyId, 'simple'] as const,
};
```

Inclua o `companyId` nas chaves para nunca reaproveitar cache entre empresas.
Invalide listagens após criar, editar ou excluir. Após alterar uma imagem,
invalide detalhe, listagens e listagem simples.

## Erros

Erros de validação retornam:

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Um ou mais campos são inválidos",
  "errors": {
    "name": ["O nome do produto é obrigatório"],
    "price": [
      "O preço do produto deve ser um valor numérico com até 2 casas decimais"
    ]
  }
}
```

Mapeie `errors.<campo>` diretamente para o formulário. Também trate:

- `401`: sessão ausente ou expirada;
- `403`: usuário sem permissão ou empresa diferente da sessão;
- `404`: produto não encontrado em edição, exclusão ou alteração de imagem;
- `413`: imagem acima do limite ou cota de mídia da empresa atingida;
- `5xx`: erro inesperado; preserve os dados digitados e ofereça retry.

## Checklist de aceite

- [ ] Toda requisição envia JWT e `x-company-id`.
- [ ] A listagem possui loading, empty state, erro e retry.
- [ ] Busca usa debounce e volta para a primeira página.
- [ ] Filtros e ordenação são refletidos na URL da tela.
- [ ] Preço é enviado como número e formatado como BRL na exibição.
- [ ] Cadastro e edição exibem erros por campo.
- [ ] A imagem possui preview, fallback, substituição, remoção e download.
- [ ] O frontend não define manualmente `Content-Type` do `FormData`.
- [ ] Falha no upload não descarta um produto criado com sucesso.
- [ ] Exclusão exige confirmação.
- [ ] Cache é isolado por empresa e invalidado após mutações.
- [ ] Cores e componentes usam os tokens da identidade visual da empresa.
