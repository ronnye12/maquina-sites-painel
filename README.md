# Painel Maquina de Sites Internacional

Painel de operacao da Maquina de Sites: CRM do funil de prospeccao, controle de clientes pagantes e area do cliente. Next.js 16 + Supabase, pronto para subir na Vercel.

## O que o painel faz

O painel tem cinco abas e uma area publica:

- **Analise**: KPIs do funil (prospectados, enviados, aberturas, respostas, fechados, assinaturas), receita unica, MRR e alertas automaticos do que travou na semana.
- **Funil DE**: kanban dos leads da Alemanha, do status "prospectado" ate "publicado" ou "descartado". Arraste o card entre colunas, copie o link da area do cliente, exclua o lead.
- **Funil UK**: mesmo kanban, para o Reino Unido (UK e UK Saude).
- **Clientes**: quem pagou ou assinou, com os dados de onboarding preenchidos pelo cliente (dominio, registrador, textos, anexos).
- **Solicitacoes**: pedidos de alteracao e cancelamento enviados pelos clientes, com status aberta, em andamento ou concluida.
- **Area do cliente** (`/c/{token}`): pagina publica, sem login, trilingue (DE, EN, PT). O cliente ve a previa do site, escolhe o plano (pagamento unico ou mensal), preenche o onboarding, anexa arquivos e abre solicitacoes. Cada lead tem um token unico gerado no banco.

O login do painel usa Supabase Auth (email e senha). As rotas `/api/*` autenticam no servidor com o mesmo usuario, lendo `PAINEL_EMAIL` e `PAINEL_PW`.

## Pre-requisitos

- Node.js 20 ou superior
- Um projeto Supabase com o schema `maquina_sites` criado (tabelas `leads`, `onboarding`, `solicitacoes`, `metricas_dia`, bucket publico `client-uploads`). O SQL do schema esta no modulo de banco do produto.
- Uma conta na Vercel (plano gratuito basta)

## Rodar local

```bash
npm install
cp .env.example .env.local
# preencha .env.local (no minimo Supabase, PAINEL_EMAIL, PAINEL_PW e NEXT_PUBLIC_MARCA)
npm run dev
```

Abra http://localhost:3000. Voce sera redirecionado para `/login`.

## Criar o usuario de login no Supabase Auth

1. Supabase > Authentication > Users > Add user > Create new user.
2. Informe email e senha. Marque "Auto Confirm User".
3. Use esse mesmo email e senha em `PAINEL_EMAIL` e `PAINEL_PW` no `.env.local` e na Vercel.
4. As politicas de RLS do schema `maquina_sites` liberam leitura e escrita apenas para usuarios autenticados. Sem esse usuario o painel abre mas nao carrega dados.

## Subir na Vercel

1. Suba esta pasta para um repositorio Git (GitHub, GitLab ou Bitbucket).
2. Na Vercel: Add New > Project > importe o repositorio. O framework Next.js e detectado sozinho.
3. Antes de clicar em Deploy, abra Environment Variables e cole todas as variaveis do `.env.example` com os seus valores. As `NEXT_PUBLIC_*` precisam estar la no momento do build.
4. Deploy. Em um ou dois minutos o painel esta no ar em `https://seu-projeto.vercel.app`.
5. Preencha `NEXT_PUBLIC_PAINEL_URL` com essa URL (ou com o dominio proprio) e faca um redeploy para os links da area do cliente saírem corretos.

Sempre que mudar uma variavel na Vercel, faca Redeploy (Deployments > ... > Redeploy).

## Apontar dominio proprio

1. Vercel > Project > Settings > Domains > Add. Digite o dominio, por exemplo `painel.suaagencia.com`.
2. No seu registrador de dominio, crie o registro que a Vercel indicar:
   - subdominio: CNAME apontando para `cname.vercel-dns.com`
   - dominio raiz: registro A apontando para `76.76.21.21`
3. Aguarde a propagacao (minutos a algumas horas). A Vercel emite o certificado SSL automaticamente.
4. Atualize `NEXT_PUBLIC_PAINEL_URL` com o novo dominio e faca redeploy.

## Estrutura

```
app/
  page.tsx              painel principal (abas)
  login/page.tsx        login Supabase Auth
  c/[token]/page.tsx    area publica do cliente
  components/           Dashboard, Kanban, Clientes, Solicitacoes
  api/cliente/          GET dados do cliente, POST onboarding e solicitacoes
  api/upload/           upload de anexos para o bucket client-uploads
  api/excluir-lead/     apaga projeto Vercel e repo GitHub do site do lead (opcional)
lib/
  supabaseClient.ts     cliente no navegador
  serverSupabase.ts     cliente no servidor (login com PAINEL_EMAIL / PAINEL_PW)
  tipos.ts              tipos, colunas do kanban, precos e links de checkout
  i18n.ts               textos da area do cliente em DE, EN e PT
  css.ts                estilos do painel e da area do cliente
```

## Personalizacao

- Marca, email e tagline: `NEXT_PUBLIC_MARCA`, `NEXT_PUBLIC_EMAIL_CONTATO`, `NEXT_PUBLIC_TAGLINE`.
- Precos e links de checkout: variaveis `NEXT_PUBLIC_PRECO_*` e `NEXT_PUBLIC_CHECKOUT_*`.
- Colunas do funil: array `COLS` em `lib/tipos.ts`.
- Textos da area do cliente: `lib/i18n.ts`.
