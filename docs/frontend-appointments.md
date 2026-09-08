# Contrato frontend: agendamentos

Este documento é o handoff para implementar o fluxo público de agendamento e
a consulta interna da agenda. O fluxo começa identificando o cliente pelo
telefone dentro da empresa selecionada e termina com a criação do agendamento.

A seleção escalável por categoria substitui o catálogo embutido no profissional
e está documentada em
[`frontend-service-categories.md`](frontend-service-categories.md).

## Escopo da interface

O frontend público deve oferecer:

- resolução da empresa pelo slug e aplicação da identidade visual;
- identificação do cliente pelo telefone;
- cadastro do cliente quando o telefone ainda não existir naquele tenant;
- escolha do profissional e dos serviços realizados por ele;
- escolha da data e de um horário realmente disponível;
- revisão dos dados antes da confirmação;
- confirmação final com preço, duração, profissional, serviços e horário;
- tratamento de concorrência quando outro usuário ocupar o horário escolhido.

A área autenticada pode complementar esse fluxo com consulta da agenda por
período e atualização do status dos agendamentos.

## Rotas e autenticação

As rotas do fluxo público não exigem JWT. Depois de resolver o slug, as rotas
de cliente e agendamento exigem o header da empresa:

```http
x-company-id: <uuid-da-empresa>
```

| Etapa                     | Método e rota                     | JWT | `x-company-id` |
| ------------------------- | --------------------------------- | --- | -------------- |
| Identidade da empresa     | `GET /company/branding/:slug`     | Não | Não            |
| Buscar cliente            | `GET /clients/by-phone`           | Não | Sim            |
| Cadastrar cliente         | `POST /clients`                   | Não | Sim            |
| Listar profissionais      | `GET /appointments/professionals` | Não | Sim            |
| Consultar disponibilidade | `GET /appointments/availability`  | Não | Sim            |
| Criar agendamento         | `POST /appointments`              | Não | Sim            |
| Consultar agenda interna  | `GET /appointments`               | Sim | Sim            |
| Alterar status            | `PATCH /appointments/:id/status`  | Sim | Sim            |
| Operar atendimento        | `/appointments/:id/attendance/*`  | Sim | Sim            |

Primeiro obtenha o `companyId` usando o slug da página:

```http
GET /company/branding/minha-empresa
```

Essa resposta também fornece logo, cores, fonte e demais tokens visuais. O
contrato completo está em
[`frontend-media-branding.md`](frontend-media-branding.md).

O `companyId` é público nesse contexto, mas precisa ficar isolado no estado e
nas chaves de cache. Ao trocar de empresa, limpe cliente, profissional,
serviços, data, horário e todas as consultas do fluxo anterior.

## Tipos TypeScript

Colunas `decimal` do PostgreSQL podem chegar como string. Os endpoints de
profissionais e disponibilidade convertem preços para número, mas as respostas
de agendamento podem conter `number | string`.

```ts
export interface ClientReference {
  id: string;
  name: string;
  phone: string;
}

export interface Client extends ClientReference {
  companyId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProfessionalServiceOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationInMinutes: number;
}

export interface ProfessionalOption {
  id: string;
  firstName: string;
  lastName: string;
  avatar: MediaReference | null;
}

export interface AvailabilityService {
  id: string;
  name: string;
  price: number;
  durationInMinutes: number;
}

export interface AvailabilitySlot {
  startAt: string; // instante ISO em UTC
  endAt: string; // instante ISO em UTC
  localStart: string; // YYYY-MM-DDTHH:mm no fuso da empresa
  localEnd: string; // YYYY-MM-DDTHH:mm no fuso da empresa
}

export interface AvailabilityResponse {
  professional: {
    id: string;
    firstName: string;
    lastName: string;
  };
  selectedServices: AvailabilityService[];
  totalDurationMinutes: number;
  totalPrice: number;
  timezone: string;
  availableSlots: AvailabilitySlot[];
}

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

export interface AppointmentServiceSnapshot {
  id: string;
  appointmentId: string;
  serviceId: string;
  name: string;
  price: number | string;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Appointment {
  id: string;
  companyId: string;
  professionalId: string;
  clientId: string;
  startAt: string;
  endAt: string;
  startedAt: string | null;
  completedAt: string | null;
  totalDurationMinutes: number;
  totalPrice: number | string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  client: Client;
  professional: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  services: AppointmentServiceSnapshot[];
}

export interface CreateAppointmentInput {
  clientId: string;
  professionalId: string;
  serviceIds: string[];
  startAt: string;
}
```

Os itens em `Appointment.services` são snapshots. Nome, preço e duração ficam
preservados como estavam no momento da reserva, mesmo que o serviço seja
alterado posteriormente.

## Estado sugerido para o fluxo público

```ts
export interface BookingDraft {
  companyId: string;
  client: ClientReference | null;
  professional: ProfessionalOption | null;
  serviceIds: string[];
  date: string | null; // YYYY-MM-DD da empresa
  availability: AvailabilityResponse | null;
  slot: AvailabilitySlot | null;
}
```

Não persista esse objeto entre empresas. Se for necessário restaurar um rascunho
após recarregar a página, associe-o obrigatoriamente ao `companyId` e nunca
considere o horário persistido como ainda disponível sem consultar a API.

## 1. Buscar o cliente pelo telefone

Aceite telefone com máscara, mas normalize para decidir quando disparar a
consulta:

```ts
const normalizePhone = (value: string) => value.replace(/\D/g, '');
```

O backend remove todos os caracteres não numéricos e aceita de 10 a 13 dígitos.
Faça a busca apenas quando o número estiver completo segundo a máscara adotada.
Não consulte a API a cada tecla; use botão `Continuar` ou debounce.

```http
GET /clients/by-phone?phone=%2811%29%2099999-9999
x-company-id: <company-id>
```

Use `params` do cliente HTTP para codificar o telefone:

```ts
const client = await api.get<ClientReference | null>('/clients/by-phone', {
  params: { phone: form.phone },
  headers: { 'x-company-id': companyId },
});
```

Resultados possíveis:

- `200` com `ClientReference`: mantenha o `id` no rascunho e mostre o nome para
  confirmação;
- `200` com `null`: abra o campo de nome para cadastrar o cliente;
- `400`: telefone ausente, com menos de 10 ou mais de 13 dígitos.

O telefone é único somente dentro da empresa. O mesmo número pode representar
clientes distintos em tenants diferentes.

## 2. Cadastrar o cliente quando necessário

```http
POST /clients
Content-Type: application/json
x-company-id: <company-id>
```

```json
{
  "name": "Maria Silva",
  "phone": "(11) 99999-9999"
}
```

Resposta: `201 Created` com `Client`.

Regras:

- `name` é obrigatório, texto e possui no máximo 150 caracteres;
- `phone` é obrigatório e precisa resultar em 10 a 13 dígitos;
- o backend salva o telefone somente com números;
- não envie `companyId`; ele vem do header.

Envie nome sem espaços nas extremidades:

```ts
const payload = {
  name: form.name.trim(),
  phone: form.phone,
};
```

Pode ocorrer uma corrida entre a busca e o cadastro. Se `POST /clients`
responder `409 Cliente já cadastrado com este telefone`, execute novamente
`GET /clients/by-phone`, use o cliente encontrado e permita que o fluxo
continue. Não crie um segundo cadastro com outra formatação do mesmo telefone.

## 3. Listar profissionais e serviços

```http
GET /appointments/professionals
x-company-id: <company-id>
```

Resposta: `200 OK` com `ProfessionalOption[]`.

```json
[
  {
    "id": "uuid-do-profissional",
    "firstName": "Ana",
    "lastName": "Silva",
    "avatar": null
  }
]
```

Somente profissionais marcados como profissionais, ativos e não bloqueados são
retornados. Os serviços não são mais embutidos nessa resposta.

O contrato atual funciona melhor nesta ordem:

1. escolher o profissional;
2. buscar suas categorias associadas;
3. buscar e escolher serviços por categoria;
4. escolher a data e consultar os horários.

É possível montar uma interface que comece pelo serviço agrupando os dados no
frontend, mas a API não possui hoje a opção “qualquer profissional”. Sempre será
necessário escolher um `professionalId` antes de consultar disponibilidade.

O contrato e os endpoints dessa seleção estão em
[`frontend-service-categories.md`](frontend-service-categories.md). Ao trocar o
profissional, limpe categoria, serviços, data, disponibilidade e horário.

## 4. Consultar disponibilidade

Envie a data civil no formato `YYYY-MM-DD`, sem convertê-la para UTC. Para
`serviceIds`, prefira uma lista separada por vírgula.

```http
GET /appointments/availability?date=2026-09-10&professionalId=<uuid>&serviceIds=<uuid-1>,<uuid-2>
x-company-id: <company-id>
```

Também são aceitos parâmetros `serviceIds` repetidos. Evite a serialização
`serviceIds[]=...`, pois esse nome de parâmetro não faz parte do contrato.

Resposta: `200 OK` com `AvailabilityResponse`.

```json
{
  "professional": {
    "id": "uuid-do-profissional",
    "firstName": "Ana",
    "lastName": "Silva"
  },
  "selectedServices": [
    {
      "id": "uuid-do-servico",
      "name": "Corte",
      "price": 50,
      "durationInMinutes": 60
    }
  ],
  "totalDurationMinutes": 60,
  "totalPrice": 50,
  "timezone": "America/Sao_Paulo",
  "availableSlots": [
    {
      "startAt": "2026-09-10T12:00:00.000Z",
      "endAt": "2026-09-10T13:00:00.000Z",
      "localStart": "2026-09-10T09:00",
      "localEnd": "2026-09-10T10:00"
    }
  ]
}
```

A API calcula os horários usando:

- fuso e intervalo de slots configurados pela empresa;
- expediente e horário de almoço do profissional;
- feriados da empresa;
- folgas do profissional;
- agendamentos existentes, exceto os cancelados;
- soma da duração de todos os serviços selecionados;
- somente horários futuros.

`availableSlots: []` é um resultado válido. Mostre um estado vazio e ofereça
outras datas, sem tratá-lo como erro.

Use `localStart` e `localEnd` para os rótulos da interface. Para criar o
agendamento, guarde e envie exatamente o `startAt` do slot retornado. Não
reconstrua o instante a partir de `date` e hora, porque isso pode aplicar o fuso
do dispositivo do cliente.

Exemplo de rótulo sem conversão de fuso:

```ts
const slotLabel = `${slot.localStart.slice(11, 16)} – ${slot.localEnd.slice(
  11,
  16,
)}`;
```

Para uma exibição posterior baseada em `startAt`, use o fuso devolvido pela API:

```ts
const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: availability.timezone,
});

formatter.format(new Date(slot.startAt));
```

## 5. Revisar antes de confirmar

A etapa de revisão deve exibir:

- nome do cliente e telefone mascarado;
- profissional;
- serviços selecionados;
- data e intervalo no fuso da empresa;
- duração total;
- preço total;
- aviso de que o horário só é garantido após a confirmação da API.

Use `selectedServices`, `totalDurationMinutes` e `totalPrice` da última resposta
de disponibilidade. Esses valores são recalculados no backend ao criar a
reserva; os valores montados pelo frontend são apenas informativos.

Antes de enviar, confirme que `client`, `professional`, `serviceIds` e `slot`
pertencem ao mesmo `companyId`. Desabilite o botão enquanto a requisição estiver
em andamento para evitar duplo clique.

## 6. Criar o agendamento

```http
POST /appointments
Content-Type: application/json
x-company-id: <company-id>
```

```json
{
  "clientId": "uuid-do-cliente",
  "professionalId": "uuid-do-profissional",
  "serviceIds": ["uuid-do-servico"],
  "startAt": "2026-09-10T12:00:00.000Z"
}
```

`startAt` precisa ser o valor ISO retornado em `availableSlots` e conter `Z` ou
offset explícito. A API rejeita horários no passado e valida novamente cliente,
profissional, serviços e disponibilidade dentro de uma transação.

Resposta: `201 Created` com `Appointment`. O status inicial é sempre
`SCHEDULED`.

```json
{
  "id": "uuid-do-agendamento",
  "companyId": "uuid-da-empresa",
  "professionalId": "uuid-do-profissional",
  "clientId": "uuid-do-cliente",
  "startAt": "2026-09-10T12:00:00.000Z",
  "endAt": "2026-09-10T13:00:00.000Z",
  "totalDurationMinutes": 60,
  "totalPrice": "50.00",
  "status": "SCHEDULED",
  "client": {
    "id": "uuid-do-cliente",
    "name": "Maria Silva",
    "phone": "11999999999"
  },
  "professional": {
    "id": "uuid-do-profissional",
    "user": {
      "id": "uuid-do-usuario",
      "firstName": "Ana",
      "lastName": "Silva"
    }
  },
  "services": [
    {
      "id": "uuid-do-item",
      "appointmentId": "uuid-do-agendamento",
      "serviceId": "uuid-do-servico",
      "name": "Corte",
      "price": "50.00",
      "durationMinutes": 60
    }
  ]
}
```

Na tela de sucesso, use a resposta do `POST`, não apenas o rascunho. Mostre o
código do agendamento, os dados finais e uma ação clara para encerrar ou iniciar
um novo agendamento.

### Horário ocupado durante a confirmação

Mesmo que o horário tenha aparecido como disponível, outra pessoa pode reservá-lo
antes da confirmação. Nesse caso a API responde:

```json
{
  "statusCode": 409,
  "message": "O horário selecionado não está mais disponível",
  "error": "Conflict"
}
```

Ao receber esse conflito:

1. preserve cliente, profissional, serviços e data;
2. limpe somente o slot selecionado;
3. consulte novamente `GET /appointments/availability`;
4. informe que o horário foi ocupado e peça a escolha de outro.

Não trate o agendamento como criado e não repita automaticamente o mesmo
`POST`.

## Cache e invalidação

Uma sugestão de chaves:

```ts
const bookingKeys = {
  branding: (slug: string) => ['branding', slug] as const,
  clientByPhone: (companyId: string, phone: string) =>
    ['clients', companyId, 'phone', normalizePhone(phone)] as const,
  professionals: (companyId: string) =>
    ['appointments', companyId, 'professionals'] as const,
  availability: (
    companyId: string,
    professionalId: string,
    serviceIds: string[],
    date: string,
  ) =>
    [
      'appointments',
      companyId,
      'availability',
      professionalId,
      [...serviceIds].sort(),
      date,
    ] as const,
};
```

Disponibilidade muda rapidamente. Evite considerá-la fresca por períodos
longos, refaça a consulta ao voltar para a etapa de horários e invalide a data
após um agendamento criado. A criação sempre faz a validação final no servidor.

Após cadastrar um cliente, grave a resposta no cache da busca pelo telefone.
Não mantenha resultados de busca de cliente fora do tenant correspondente.

## Agenda interna autenticada

### Operação do atendimento pelo profissional

Somente o profissional responsável pode operar o atendimento; ser apenas dono
ou administrador não concede essa permissão. Todas as rotas exigem JWT e
`x-company-id`. O detalhe é separado da agenda para manter as listagens leves:

```http
GET /appointments/:id/attendance
```

```ts
export interface AppointmentProductLine {
  id: string;
  appointmentId: string;
  productId: string;
  name: string;
  unitPrice: number | string;
  quantity: number;
  totalPrice: number | string;
}

export interface AttendanceDetail {
  id: string;
  companyId: string;
  professionalId: string;
  clientId: string;
  startAt: string;
  endAt: string;
  startedAt: string | null;
  completedAt: string | null;
  status: AppointmentStatus;
  totalDurationMinutes: number;
  serviceTotal: number;
  productTotal: number;
  totalPrice: number;
  client: ClientReference;
  professional: { id: string; firstName: string; lastName: string };
  services: AppointmentServiceSnapshot[];
  products: AppointmentProductLine[];
}
```

#### Iniciar atendimento

```http
POST /appointments/:id/attendance/start
```

Aceita `SCHEDULED` ou `CONFIRMED`, registra `startedAt` e muda para
`IN_PROGRESS`. Repetir enquanto estiver em andamento é idempotente.

#### Adicionar serviços executados

```http
POST /appointments/:id/attendance/services
Content-Type: application/json

{ "serviceIds": ["uuid-do-servico-adicional"] }
```

Somente serviços vinculados ao profissional são aceitos. IDs já presentes são
ignorados para permitir retry seguro. Use os serviços do profissional em
`GET /appointments/professionals` e remova das opções os já incluídos.

#### Adicionar, alterar ou remover produto

Consulte o catálogo em `GET /products`. O `PUT` define a quantidade total da
linha e é idempotente:

```http
PUT /appointments/:id/attendance/products/:productId
Content-Type: application/json

{ "quantity": 2 }
```

A quantidade deve ser inteira entre 1 e 999. Nome e preço são congelados como
snapshot. Para remover, use:

```http
DELETE /appointments/:id/attendance/products/:productId
```

#### Finalizar atendimento

```http
POST /appointments/:id/attendance/complete
```

Só finaliza `IN_PROGRESS`. A API recalcula os totais, registra `completedAt` e
muda para `COMPLETED`. Todas as mutações retornam `AttendanceDetail`; substitua
o detalhe local pela resposta e invalide a agenda. Depois da conclusão,
desabilite alterações de serviços e produtos.

Durante a reserva, `totalPrice` contém os serviços agendados. A partir do
atendimento, ele representa o total geral de serviços e produtos; use
`serviceTotal` e `productTotal` quando precisar apresentar o detalhamento.

### Consultar por período

```http
GET /appointments?from=2026-09-01T00:00:00-03:00&to=2026-09-30T23:59:59-03:00
Authorization: Bearer <jwt>
x-company-id: <company-id>
```

Parâmetros obrigatórios:

- `from`: início ISO do período;
- `to`: fim ISO do período.

Parâmetros opcionais:

- `professionalId`: filtra pelo profissional;
- `status`: `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED` ou
  `NO_SHOW`.

Resposta: `200 OK` com `Appointment[]`, sem paginação, ordenado por `startAt`.
O intervalo é inclusivo. Se `from` for posterior a `to`, a API responde `400`.

Donos e administradores podem consultar toda a empresa ou filtrar um
profissional. Profissionais sem esses perfis consultam apenas a própria agenda.
Outros membros recebem `403`.

### Atualizar status

```http
PATCH /appointments/:id/status
Authorization: Bearer <jwt>
x-company-id: <company-id>
Content-Type: application/json
```

```json
{
  "status": "CONFIRMED"
}
```

Donos, administradores e o profissional responsável podem alterar o status.
Uma atualização para o status atual é idempotente.

| Status atual  | Próximos status permitidos                                      |
| ------------- | --------------------------------------------------------------- |
| `SCHEDULED`   | `CONFIRMED`, `CANCELED` ou `NO_SHOW`                            |
| `CONFIRMED`   | `CANCELED` ou `NO_SHOW`                                         |
| `IN_PROGRESS` | `CANCELED`; conclusão usa a rota própria                        |
| Terminal      | Nenhuma alteração; repetir o mesmo status continua sendo aceito |

`NO_SHOW` só pode ser aplicado depois do horário inicial. `IN_PROGRESS` só é
definido pela rota de início e `COMPLETED` pela rota de finalização. `CANCELED`,
`COMPLETED` e `NO_SHOW` são terminais.

Traduções sugeridas:

```ts
export const appointmentStatusLabel: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Cliente não compareceu',
};
```

## Erros

Erros de validação dos DTOs seguem este formato:

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Um ou mais campos são inválidos",
  "errors": {
    "clientId": ["clientId must be a UUID"],
    "startAt": ["startAt deve conter o fuso horário"]
  }
}
```

Exceções de regra de negócio usam normalmente:

```json
{
  "statusCode": 400,
  "message": "Informe ao menos um serviço",
  "error": "Bad Request"
}
```

Trate ainda:

- `400`: header ausente/inválido, telefone inválido, data ou serviço inválido,
  período inválido ou transição de status inválida;
- `401`: sessão ausente ou expirada nas rotas da agenda interna;
- `403`: usuário autenticado sem acesso à agenda ou ao agendamento;
- `404`: empresa, cliente, profissional ou agendamento não encontrado;
- `409`: telefone já cadastrado ou horário que deixou de estar disponível;
- `429`: limite de requisições atingido; aguarde antes de tentar novamente;
- `5xx`: falha inesperada; preserve o rascunho e permita retry seguro.

Ao ocorrer falha de rede durante `POST /appointments`, não afirme sucesso sem
resposta da API. Preserve a revisão e permita uma nova tentativa consciente.

## Limitações atuais da API

O frontend não deve prometer recursos que ainda não possuem rota:

- não existe seleção automática de “qualquer profissional”;
- não existe consulta pública de um agendamento pelo ID ou telefone;
- não existe cancelamento público pelo cliente;
- não existe remarcação ou edição de data, profissional e serviços;
- não existe exclusão de agendamento;
- a lista pública de profissionais não retorna avatar nem imagem do serviço;
- a agenda interna não é paginada.

Cancelamento interno é feito alterando o status para `CANCELED`. Uma remarcação
exigirá um contrato próprio no backend; não simule remarcação cancelando e
criando outra reserva sem uma decisão explícita de produto.

## Observação de segurança do contrato atual

`GET /clients/by-phone` é público e, apenas com o tenant e o telefone, retorna
`id`, nome e telefone do cliente. Isso permite enumeração de dados e não pode ser
corrigido somente no frontend. Antes de produção, considere comprovação de posse
do telefone por OTP ou uma sessão pública de agendamento de curta duração,
resposta minimizada e rate limit específico. `POST /clients` também deve ser
protegido contra cadastros automatizados.

As respostas de criação e listagem carregam a relação interna
`professional.user`. O frontend deve tipar e consumir somente os campos
necessários apresentados neste documento. Antes de produção, o backend deve
serializar essa resposta por um DTO dedicado; omitir campos apenas no TypeScript
do frontend não protege dados enviados pela rede.

## Checklist de aceite

- [ ] O slug é resolvido e o `companyId` correto acompanha todas as etapas.
- [ ] Estado e cache são descartados ao trocar de tenant.
- [ ] O telefone é validado com 10 a 13 dígitos após normalização.
- [ ] Cliente encontrado é reutilizado; cliente ausente pode ser cadastrado.
- [ ] Conflito no cadastro refaz a busca em vez de duplicar o cliente.
- [ ] Serviços exibidos pertencem ao profissional selecionado.
- [ ] Mudanças de profissional, serviços ou data limpam o slot antigo.
- [ ] Estado sem horários oferece mudança de data e não aparece como erro.
- [ ] Horários são exibidos no fuso da empresa.
- [ ] O `startAt` enviado é exatamente o valor retornado pela disponibilidade.
- [ ] A revisão exibe cliente, profissional, serviços, duração, preço e horário.
- [ ] O botão de confirmação fica bloqueado durante o envio.
- [ ] Um `409` de horário atualiza os slots e preserva o restante do rascunho.
- [ ] A tela final usa os valores retornados pelo agendamento criado.
- [ ] A área interna respeita permissões e transições de status.
- [ ] Apenas o profissional responsável opera o atendimento.
- [ ] Início, serviços adicionais, produtos e finalização atualizam os totais.
- [ ] Quantidade de produto usa `PUT` e não duplica em retries.
- [ ] Loading, vazio, erro, retry e validações por campo foram implementados.
- [ ] Toda a interface utiliza os tokens visuais da empresa.
