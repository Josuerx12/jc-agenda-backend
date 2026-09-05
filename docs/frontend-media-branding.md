# Contrato frontend: imagens e identidade visual

Este documento descreve o contrato que o frontend deve implementar para
imagens de catálogo, profissionais e identidade visual da empresa.

## Convenções

- Rotas de escrita exigem `Authorization: Bearer <jwt>` e `x-company-id`.
- Uploads usam `multipart/form-data` com um único campo chamado `file`.
- Não defina manualmente o header `Content-Type` no upload; o navegador precisa
  incluir o `boundary` gerado pelo `FormData`.
- JPEG, PNG e WebP são aceitos. O limite padrão é 5 MiB por arquivo.
- Cada produto, serviço, profissional e empresa possui uma imagem principal.
  Um novo `PUT` substitui a anterior.
- URLs de mídia são relativas à origem da API. Converta com
  `new URL(media.url, API_BASE_URL).toString()` quando necessário.
- A leitura de mídia é pública para permitir imagens na página pública de
  agendamento. Não existe rota para listar arquivos nem acesso direto à pasta.

## Modelo de referência

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
```

Resposta de qualquer upload:

```json
{
  "id": "a428e4d7-2194-4533-95c2-9c7ebea5bce3",
  "url": "/media/a428e4d7-2194-4533-95c2-9c7ebea5bce3",
  "downloadUrl": "/media/a428e4d7-2194-4533-95c2-9c7ebea5bce3?download=true",
  "originalName": "imagem.webp",
  "mimeType": "image/webp",
  "sizeBytes": 245760
}
```

## Rotas de imagem

| Recurso              | Upload/substituição            | Remoção                           | Campo nas consultas |
| -------------------- | ------------------------------ | --------------------------------- | ------------------- |
| Produto              | `PUT /products/:id/image`      | `DELETE /products/:id/image`      | `image`             |
| Serviço              | `PUT /services/:id/image`      | `DELETE /services/:id/image`      | `image`             |
| Usuário/profissional | `PUT /company-user/:id/avatar` | `DELETE /company-user/:id/avatar` | `avatar`            |
| Logo                 | `PUT /company/settings/logo`   | `DELETE /company/settings/logo`   | `logo`              |

Uploads retornam `200 OK` com `StoredMedia`. Remoções retornam
`204 No Content`. Produtos, serviços e usuários retornam `MediaReference | null`
nos campos indicados tanto na consulta individual quanto nas listagens. `GET
/me` também retorna `avatar`.

Para exibição e download:

```http
GET /media/:id
GET /media/:id?download=true
```

A primeira forma usa disposição `inline`; a segunda usa `attachment`.

## Identidade visual

Consulta privada completa:

```http
GET /company/settings
```

Atualização parcial:

```http
PATCH /company/settings
Content-Type: application/json
```

```ts
export interface UpdateCompanySettings {
  timezone?: string;
  slotIntervalMinutes?: 15 | 30 | 60;
  primaryColor?: `#${string}`;
  secondaryColor?: `#${string}`;
  accentColor?: `#${string}`;
  backgroundColor?: `#${string}`;
  surfaceColor?: `#${string}`;
  textColor?: `#${string}`;
  fontFamily?: 'INTER' | 'ROBOTO' | 'POPPINS' | 'MONTSERRAT';
  borderRadius?: 'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE';
  welcomeMessage?: string | null;
  showCompanyName?: boolean;
}
```

As cores precisam estar no formato exato `#RRGGBB`. A resposta contém os mesmos
campos, além de `logoImageId` e `logo: MediaReference | null`.

Consulta pública, sem JWT:

```http
GET /company/branding/:slug
```

```ts
export interface CompanyBranding {
  companyId: string;
  slug: string;
  trandingName: string;
  logo: MediaReference | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: 'INTER' | 'ROBOTO' | 'POPPINS' | 'MONTSERRAT';
  borderRadius: 'NONE' | 'SMALL' | 'MEDIUM' | 'LARGE';
  welcomeMessage: string | null;
  showCompanyName: boolean;
}
```

`GET /company/resolve/:slug` continua disponível e agora também inclui esse
objeto no campo `branding`.

## Mapeamento visual sugerido

Use variáveis CSS na raiz da página da empresa:

```css
--brand-primary: primaryColor;
--brand-secondary: secondaryColor;
--brand-accent: accentColor;
--brand-background: backgroundColor;
--brand-surface: surfaceColor;
--brand-text: textColor;
```

Mapeie `borderRadius` para tokens do design system, por exemplo: `NONE = 0`,
`SMALL = 0.375rem`, `MEDIUM = 0.75rem`, `LARGE = 1.25rem`. Carregue somente a
fonte selecionada e mantenha uma fonte de sistema como fallback.

Na tela administrativa, ofereça preview responsivo, restauração visual dos
valores padrão, validação de contraste e fallback quando logo/imagem/avatar for
`null`. Após um upload, use imediatamente a nova URL retornada; o UUID muda na
substituição e evita problemas com cache.

## Erros a tratar

- `400`: arquivo ausente, assinatura inválida, formato não suportado ou payload
  de configuração inválido.
- `403`: usuário sem permissão para alterar o recurso.
- `404`: produto, serviço, profissional ou mídia inexistente.
- `413`: arquivo acima do limite ou cota de armazenamento da empresa atingida.

Para avatar, o próprio usuário pode alterar sua imagem. Alterações em logo,
produto, serviço ou avatar de outra pessoa exigem perfil de dono/administrador.
