# RVN Fácil — Relatório de Viagem Nacional (SCDP)

Aplicativo que gera o **Relatório de Viagem Nacional (RVN/PCDP)** no modelo
oficial, pronto para imprimir, assinar e anexar à prestação de contas no SCDP.

Stack: Next.js 16 · PostgreSQL · Drizzle ORM · Tailwind CSS 4

---

## Cabeçalho oficial do documento

Todo RVN sai com as 5 linhas institucionais, nesta ordem:

```
MINISTÉRIO DA DEFESA
EXÉRCITO BRASILEIRO
3º BATALHÃO DE ENGENHARIA DE CONSTRUÇÃO
(1º BATALHÃO DE ENGENHARIA/1942)
“BATALHÃO VISCONDE DA PARNAÍBA”
```

- O padrão fica em [`src/lib/org.ts`](src/lib/org.ts) (também usado como valor
  inicial das colunas no banco).
- Linha deixada em branco volta automaticamente a esse padrão — relatórios
  antigos, criados antes do cabeçalho completo, também passam a exibi-lo.
- Para outra OM, ajuste as linhas no **painel → Perfil → Cabeçalho do
  documento** (já vale para os próximos relatórios) ou, em um relatório
  específico, no **editor → seção “H”**.

---

## Hospedando o app (grátis) — Vercel + Neon

Caminho recomendado: **Vercel** (hospeda o Next.js) + **Neon** (hospeda o
PostgreSQL). Ambos têm plano gratuito mais que suficiente para uso pessoal.

### 1. Suba o código para o GitHub (repositório PRIVADO)

> O app guarda CPF e dados bancários — mantenha o repositório **privado**.

```bash
git init
git add .
git commit -m "RVN Fácil"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/rvn-facil.git
git push -u origin main
```

### 2. Crie o banco de dados (Neon)

1. Acesse [neon.tech](https://neon.tech) e crie conta (grátis).
2. Crie um projeto (qualquer nome, ex.: `rvn-facil`).
3. Copie a **connection string** oferecida:
   `postgresql://usuario:senha@ep-xxx.aws.neon.tech/neondb?sslmode=require`

### 3. Crie as tabelas no banco hospedado

No seu computador, dentro da pasta do projeto, rode **uma única vez**:

```bash
DATABASE_URL="postgresql://usuario:senha@ep-xxx.aws.neon.tech/neondb?sslmode=require" npx drizzle-kit push
```

(Windows PowerShell: `$env:DATABASE_URL="..."; npx drizzle-kit push`)

Isso cria as tabelas `profiles`, `reports` e `bilhetes` no Neon.

### 4. Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com), entre com o GitHub.
2. **Add New → Project** → importe o repositório `rvn-facil`.
3. Em **Environment Variables**, adicione:

   | Nome          | Valor                                        |
   | ------------- | -------------------------------------------- |
   | `DATABASE_URL`| a connection string do Neon (passo 2)        |
   | `APP_USER`    | um usuário de sua escolha                    |
   | `APP_PASSWORD`| uma senha forte de sua escolha               |

4. Clique em **Deploy**. Em ~1 minuto seu app estará no ar em
   `https://seu-projeto.vercel.app` (você pode trocar o domínio depois).

### 5. Primeiro acesso

1. Abra o endereço → o navegador pedirá usuário e senha (os do passo 4).
2. Preencha o **Perfil do beneficiário** no painel e salve.
3. **Arraste o bookmarklet "Capturar do SCDP" novamente** para a barra de
   favoritos (ele é gerado a partir do endereço atual do app, então o antigo
   apontava para a máquina local).

Pronto. Seus relatórios ficam salvos no Neon e acessíveis de qualquer lugar.

---

## Alternativa: Railway (tudo em um só lugar)

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub**.
2. **Add → Database → PostgreSQL**.
3. Nas variáveis do serviço web: reference `DATABASE_URL` do Postgres
   (`${{Postgres.DATABASE_URL}}`), adicione `APP_USER` e `APP_PASSWORD`.
4. Para criar as tabelas: **Settings → Deploy Command** do serviço:
   `npx drizzle-kit push` — ou rode o comando do passo 3 com a URL pública
   do banco (aba *Connect*).

---

## Variáveis de ambiente

| Variável        | Obrigatória | Função                                       |
| --------------- | ----------- | -------------------------------------------- |
| `DATABASE_URL`  | sim         | Conexão PostgreSQL                           |
| `APP_USER`      | recomendado | Usuário do Basic Auth (sem ele = app aberto) |
| `APP_PASSWORD`  | recomendado | Senha do Basic Auth                          |

## Rodando localmente

```bash
npm install
# crie .env com DATABASE_URL=postgresql://... do seu Postgres local
npx drizzle-kit push
npm run dev
```

## Atualizações

Cada `git push` para o `main` dispara um novo deploy automático na Vercel.
Se o schema do banco mudar, rode novamente o `drizzle-kit push` com a URL
de produção.
