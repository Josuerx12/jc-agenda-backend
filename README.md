<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Busca de endereço por CEP

Use o endpoint abaixo para buscar o endereço completo, incluindo cidade e estado:

```http
GET /addresses?cep=01001000
```

O CEP também pode ser enviado com pontuação:

```http
GET /addresses?cep=01001-000
```

Exemplo de resposta:

```json
{
  "zipCode": "01001000",
  "street": "Praça da Sé",
  "complement": "lado ímpar",
  "neighborhood": "Sé",
  "city": {
    "id": "uuid-da-cidade",
    "name": "São Paulo"
  },
  "state": {
    "id": "uuid-do-estado",
    "name": "São Paulo",
    "code": "SP"
  }
}
```

Quando o CEP for inválido ou não estiver cadastrado, a API responde com status
`200 OK` e corpo `null`.

A documentação interativa da rota também está disponível em:

```text
http://localhost:3000/docs
```

## Project setup

```bash
$ yarn install
```

## E-mail e recuperação de senha

Configure um SMTP transacional (Amazon SES, Postmark, SendGrid, Resend SMTP ou
equivalente) antes de iniciar a aplicação:

Use `.env.example` como base. Para desenvolvimento local, `REDIS_PASSWORD` pode
ficar vazio; no ambiente de produção ele deve receber a senha do Redis gerenciado.

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=usuario
SMTP_PASSWORD=senha
EMAIL_FROM="JC Agenda <no-reply@jcagenda.com.br>"
PLATFORM_URL_PATTERN=https://{slug}.jcagenda.com.br
PASSWORD_RESET_URL_PATTERN=https://app.jcagenda.com.br/reset-password?token={token}
PASSWORD_RESET_EXPIRES_MINUTES=30
PASSWORD_RESET_COOLDOWN_SECONDS=60
EMAIL_OUTBOX_INTERVAL_MS=3000
EMAIL_OUTBOX_BATCH_SIZE=100
EMAIL_QUEUE_MAX_ATTEMPTS=8
EMAIL_QUEUE_CONCURRENCY=5
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false
REDIS_QUEUE_PREFIX=jc-agenda
JWT_SECRET=gere-um-segredo-aleatorio-com-no-minimo-32-caracteres
CORS_ORIGINS=https://app.jcagenda.com.br,https://admin.jcagenda.com.br
RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_REQUESTS=100
ENABLE_SWAGGER=false
```

Os e-mails são persistidos primeiro em uma outbox no PostgreSQL, dentro da mesma
transação que cria ou altera o usuário. Um dispatcher publica somente o UUID da
mensagem no BullMQ/Redis; o worker consulta o conteúdo no banco e envia pelo
SMTP com concorrência configurável, retentativas e backoff exponencial. Essa
combinação evita perder e-mails caso o Redis esteja indisponível durante o
commit da operação principal.

Execute `yarn migration:run` no deploy para criar as tabelas da outbox e dos
tokens de recuperação. Em produção, `REDIS_PASSWORD` e `SMTP_HOST` são
obrigatórios e impedem a inicialização quando ausentes. Em desenvolvimento, a
senha Redis pode ficar vazia. O `docker-compose.yml` habilita `requirepass`
automaticamente apenas quando `REDIS_PASSWORD` possuir valor.

Fluxos públicos de senha:

```http
POST /forgot-password
POST /reset-password
```

Corpos esperados:

```json
{ "email": "usuario@empresa.com.br" }
```

```json
{ "token": "token-recebido-por-email", "password": "nova-senha" }
```

Ambos retornam `204 No Content` quando concluídos. A solicitação sempre retorna
o mesmo status, inclusive para e-mails inexistentes. Tokens expiram, são de uso
único e uma nova solicitação por conta só é enfileirada após o cooldown. Após a
troca, todas as sessões JWT anteriores são invalidadas e o usuário recebe uma
notificação por e-mail.

O frontend da redefinição deve usar HTTPS e definir `Referrer-Policy:
no-referrer` para impedir que o token da URL seja enviado a terceiros.

O cadastro em `POST /company-user` não recebe mais `password`: uma senha
temporária forte é criada no servidor e enviada ao novo usuário.

Em produção, `JWT_SECRET` com menos de 32 caracteres, URLs de e-mail sem HTTPS
ou ausência de `CORS_ORIGINS` impedem a inicialização. O rate limit embutido é
por instância; em múltiplas réplicas, mantenha também limitação no gateway/WAF
ou configure um storage compartilhado para o Throttler.

A documentação Swagger fica habilitada automaticamente apenas em `MODE=DEV`.
Em produção, use `ENABLE_SWAGGER=true` somente quando houver controle de acesso
na borda. A API aplica cabeçalhos de segurança com Helmet.

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
