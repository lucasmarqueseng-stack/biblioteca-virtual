# 📚 Biblioteca Virtual (v2)

Sistema web de biblioteca pessoal inspirado em Skoob/Skeelo, construído com Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM e Recharts.

Permite catalogar livros, acompanhar progresso de leitura, registrar avaliações e gerir metas anuais.

> **Nota sobre versões**
> A v1 em Python/Streamlit está preservada no branch `devin/1776470693-biblioteca-virtual`. A v2 (este branch) é uma reescrita completa com uma stack web moderna.

## ✨ Funcionalidades

- **CRUD de livros** com título, autores (múltiplos), ano, gênero, descrição, capa (URL), avaliação inicial e total de páginas
- **Status de leitura**: Não lido, Lendo, Lido, Tenho — filtros e badges coloridos
- **Progresso por livro**: quantas páginas já lidas + porcentagem
- **Avaliações com estrelas** (1-5) + comentários, apenas para livros marcados como "Lido"
- **Metas anuais** por ano: livros e páginas alvo, progresso, páginas/dia necessárias, gráficos mensais
- **Busca, filtros e ordenação** na biblioteca (por título, autor, status, gênero, avaliação, ano)
- **Dashboard** com KPIs, gráfico de status (pizza), top gêneros, progresso de meta e últimos livros
- **Exportação** da biblioteca em CSV ou JSON
- **Seed de demonstração** com 7 livros + meta anual

## 🛠️ Stack

- **Next.js 16** (App Router, Server Actions, SSR)
- **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (base-ui/react)
- **Prisma ORM 6** + **SQLite** (dev) / **PostgreSQL** (produção)
- **Recharts** para gráficos
- **Lucide** para ícones
- **Zod** para validação
- **sonner** para toasts

## 🚀 Rodando localmente

Pré-requisitos: **Node.js 20+** e **npm**.

```bash
# 1. Clonar e entrar na pasta
git clone https://github.com/lucasmarqueseng-stack/biblioteca-virtual.git
cd biblioteca-virtual

# 2. Mudar para o branch da v2
git checkout devin/1776473808-biblioteca-virtual-v2

# 3. Instalar dependências
npm install

# 4. Copiar o arquivo de variáveis de ambiente (define DATABASE_URL para o SQLite)
cp .env.example .env                # Linux/macOS
# copy .env.example .env            # Windows (cmd)
# Copy-Item .env.example .env       # Windows (PowerShell)

# 5. Criar o banco SQLite e popular com dados de exemplo
npx prisma migrate dev --name init
npx prisma db seed

# 6. Iniciar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O banco `prisma/dev.db` é criado automaticamente.

### Scripts úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot-reload (Turbopack) |
| `npm run build` | Build de produção |
| `npm start` | Inicia o build de produção |
| `npm run lint` | Lint com ESLint |
| `npm run db:migrate` | Aplica/cria migrations (dev) |
| `npm run db:push` | Push do schema sem gerar migration |
| `npm run db:studio` | Abre o Prisma Studio no browser |
| `npm run db:seed` | Popula o banco com dados de exemplo |

## 🧭 Estrutura do projeto

```
biblioteca-virtual/
├── prisma/
│   ├── schema.prisma       # Modelos (Book, Author, Review, ReadingGoal)
│   └── seed.ts             # Dados iniciais
├── src/
│   ├── app/                # Rotas (App Router)
│   │   ├── page.tsx        # Dashboard
│   │   ├── livros/         # Biblioteca, detalhes, novo, editar
│   │   ├── metas/          # Metas anuais
│   │   ├── api/export/     # Exportação CSV/JSON
│   │   └── layout.tsx      # Layout raiz com Navbar
│   ├── actions/            # Server actions (books, reviews, goals)
│   ├── components/         # Componentes (UI + domínio)
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── charts/         # Gráficos Recharts
│   └── lib/                # constants, validations, prisma, goals, export
└── public/
```

## ☁️ Deploy no Vercel + Neon (grátis)

1. **Criar banco Postgres no [Neon](https://neon.tech)** (grátis) e copiar a `DATABASE_URL`.
2. No [Vercel](https://vercel.com/new), importar este repositório e configurar:
   - Framework: **Next.js** (autodetectado)
   - Environment Variable: `DATABASE_URL` com o valor do Neon
3. No arquivo `prisma/schema.prisma`, trocar o provider para Postgres antes do deploy:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Rodar as migrations contra o Neon antes do primeiro deploy:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   DATABASE_URL="postgresql://..." npx prisma db seed   # opcional
   ```
5. Push no branch — o Vercel faz deploy automático e gera uma URL de preview.

O script de build já roda `prisma generate` antes do `next build`, então a Vercel vai funcionar sem configuração extra.

## 📝 Modelo de dados (resumo)

- **Author**: `id`, `name` (unique)
- **Book**: `id`, `title`, `year`, `genre`, `description`, `coverUrl`, `status`, `initialRating`, `pages`, `pagesRead`, `authors`, `reviews`, `goals`
- **Review**: `id`, `bookId`, `rating` (1-5), `comment`, `createdAt`
- **ReadingGoal**: `id`, `year` (unique), `targetBooks`, `targetPages`, `books`

## 🗺️ Roadmap

- [ ] Autenticação multiusuário (Clerk / Auth.js)
- [ ] Upload de capas para CDN (Cloudinary/Supabase Storage)
- [ ] Listas personalizadas / prateleiras
- [ ] App mobile com Expo compartilhando API
- [ ] Importação do Goodreads
- [ ] Recomendações

## 📄 Licença

MIT.
