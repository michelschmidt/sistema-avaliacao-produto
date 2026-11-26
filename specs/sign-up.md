# Sign-up (Criação de conta)

## Escopo
Front-End, Back-End, Banco de Dados

## Contexto
Precisamos implementar o fluxo para a criação de contas na plataforma, as pessoas precisarão fornecer:
- Primeiro nome
- Sobrenome
- Email
- Senha
- Confirmação de senha

## Requisitos funcionais
1. Precisamos adicionar validação no formulário na camada de cliente
   1. Caso o formulário esteja válido podemos enviar a requisição para a API
   2. A mesma validação (schema Zod compartilhado) é aplicada novamente na API
2. Os campos de nome e sobrenome devem ser separados
3. Precisamos criar uma nova conta no banco de dados na tabela de `accounts`
    1. `id`: text (nanoid, gerado com `nanoid` na camada de API)
    2. `first_name`: text
    3. `last_name`: text
    4. `created_at`: timestamptz
    5. `updated_at`: timestamptz
    6. `active`: boolean
    7. `email`: text
    8. `password`: text (hash bcrypt — o salt já fica embutido no hash, por isso não há coluna `salt`)
4. A requisição deve ser um `POST` para `/api/v1/sign-up` e receber os dados como JSON no `body`
    1. Esse endpoint REST é um adaptador fino sobre a procedure tRPC `auth.signUp`
    2. A interface (`/auth/sign-up`) consome a procedure `auth.signUp` via cliente tRPC + React Query
5. Caso tudo dê certo retornar `200` ou erros de acordo com a validação:
     1. `400`: Má formatação de dados
     2. `500`: Erro inesperado no servidor (sem expor detalhes internos)

## Regras de validação (schema Zod compartilhado)
- `firstName` / `lastName`: obrigatórios, sem espaços nas pontas, 1–100 caracteres
- `email`: obrigatório, formato válido, normalizado em minúsculas
- `password`: obrigatória, mínimo 8 caracteres
- `confirmPassword`: obrigatória, deve ser igual a `password` (validada no cliente e na API, nunca persistida)

## Requisitos não funcionais
- Segurança: Precisamos salvar as senhas de forma segura no banco de dados
    - Hash com bcrypt (`bcryptjs`, custo 10)
    - Precisamos receber os dados do cliente de forma segura usando HTTPS (para prevenir network sniffing)
    - A senha/hash nunca é retornada na resposta da API
- UI/UX: Boa experiência de uso através de uma interface bonita, elegante, moderna
- Performance: O processo de criação de conta precisa ser rápido

## Você deve
- Criar a base do projeto com um endpoint inicial para criação da conta
- Criar a base do projeto com uma página inicial para a interface de criação de conta
- Configurar as bibliotecas

## Você não deve
- Implementar qualquer outra funcionalidade que não esteja relacionada com sign-up (Criação de Conta)
- Não vamos realizar nenhum envio de email no momento, apenas processar a requisição, salvar no banco de dados e retornar sucesso
- Não vamos tratar email duplicado neste momento (projeto de estudo)

## Melhorias futuras
- Constraint `UNIQUE` em `accounts.email` e retorno `409 Conflict` para email já cadastrado

## Tecnologias (Stack)
React.js, Next.js, React Hook Form, Zod, shadcn/ui, TailwindCSS, TanStack Query, tRPC, Supabase (PostgreSQL), bcryptjs, nanoid, Bun

## Critérios de aceitação
- Temos uma página para criar a nova conta em `/auth/sign-up`
- A página contém um formulário com validação
- A plataforma consegue se comunicar com a API para enviar os dados e receber uma resposta
- Estamos informando os possíveis erros:
    - Mostrar um alert em vermelho no formulário
- Estamos informando o sucesso de criação da conta:
    - Navegar para `/auth/sign-up/success`

## Resultado
Pessoas conseguem criar uma nova conta na plataforma
