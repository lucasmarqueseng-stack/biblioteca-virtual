# 📚 Biblioteca Virtual

Sistema de biblioteca virtual pessoal em **Python + Streamlit** para catalogar
livros, acompanhar status de leitura, registrar avaliações e acompanhar metas
anuais com dashboards interativos.

> Stack: Python 3.8+, Streamlit, SQLAlchemy, SQLite, Pandas, Plotly.

## ✨ Funcionalidades

- **Gerenciamento de livros** (CRUD completo) com título, autores (múltiplos),
  ano, gênero, descrição, capa (URL ou upload), classificação inicial, total
  de páginas e páginas lidas.
- **Status de leitura**: "Não lido", "Lendo", "Lido", "Tenho" (coleção
  física) — com filtros por status e gênero.
- **Avaliações** (1 a 5 estrelas + comentário) restritas a livros marcados
  como *Lido*, com cálculo automático da média.
- **Metas anuais de leitura** com:
  - Meta por livros e/ou páginas;
  - Associação de livros à meta;
  - Rastreamento de páginas lidas, páginas/dia necessárias, alertas para
    metas atrasadas;
  - Gráficos mensais de livros concluídos e páginas acumuladas (Plotly).
- **Busca** por título ou autor, **ordenação** por ano/classificação e
  **exportação** da lista em CSV ou JSON.
- **Dashboard geral** com distribuição de status, livros por gênero e
  progresso do ano corrente.

## 🗂 Estrutura do projeto

```
biblioteca-virtual/
├── app.py                      # Entrada do Streamlit
├── src/biblioteca/
│   ├── database.py             # Engine/Session SQLAlchemy
│   ├── models.py               # ORM (Book, Author, Review, ReadingGoal)
│   ├── services/               # Regras de negócio (CRUD + metas + seed)
│   ├── ui/                     # Páginas e componentes Streamlit
│   └── utils/                  # Validadores e exportação CSV/JSON
├── tests/                      # Testes pytest com SQLite em memória
├── data/covers/                # Capas enviadas por upload (ignoradas no git)
├── requirements.txt            # Dependências de execução
├── requirements-dev.txt        # Dependências adicionais de desenvolvimento
└── pyproject.toml              # Configuração de projeto, pytest e ruff
```

## 🚀 Como rodar localmente

### 1. Pré-requisitos

- Python 3.8 ou superior (testado em 3.12).
- `pip` (ou `uv`/`pipx`, se preferir).

### 2. Instalação

```bash
git clone https://github.com/lucasmarqueseng-stack/biblioteca-virtual.git
cd biblioteca-virtual

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Executando a aplicação

```bash
streamlit run app.py
```

A aplicação abrirá em `http://localhost:8501`. Na primeira execução o banco
`biblioteca.db` é criado automaticamente e populado com livros, avaliações e
uma meta de exemplo (via `biblioteca.services.seed`). Para começar com o
banco vazio, basta apagar o arquivo `biblioteca.db` antes de subir o app.

### 4. Usando PostgreSQL (opcional)

A URL do banco é lida da variável de ambiente `BIBLIOTECA_DB_URL`. Exemplo:

```bash
export BIBLIOTECA_DB_URL="postgresql+psycopg2://user:pass@localhost/biblioteca"
streamlit run app.py
```

## 🧪 Testes e qualidade

Os testes usam um SQLite em memória por teste e cobrem o CRUD de livros,
avaliações e o cálculo de progresso das metas.

```bash
pip install -r requirements-dev.txt
pytest -q              # testes
ruff check .           # lint (estilo e bugs básicos)
```

## 🖥 Páginas do app

| Página | O que faz |
| --- | --- |
| **Dashboard** | Métricas gerais, pizza de status, barras por gênero, progresso do ano corrente. |
| **Biblioteca** | Lista os livros com filtros, busca, ordenação, exportação CSV/JSON e acesso ao detalhe. |
| **Adicionar livro** | Formulário com validação de campos e upload opcional da capa. |
| **Detalhes do livro** | Edição completa, mudança de status, registro de páginas lidas, avaliações e exclusão segura com confirmação pelo título. |
| **Metas de leitura** | Define meta (livros e/ou páginas), associa/desassocia livros, exibe progresso, dias restantes, páginas/dia necessárias e gráficos mensais. |

## ☁️ Deploy

### Streamlit Community Cloud

1. Faça push deste repositório no GitHub.
2. Acesse [streamlit.io/cloud](https://streamlit.io/cloud) e aponte para
   `app.py`.
3. Se quiser persistência em produção, configure `BIBLIOTECA_DB_URL`
   apontando para um PostgreSQL hospedado (Supabase, Neon, etc.).

### Heroku / Railway / Render

Adicione um `Procfile` com:

```
web: streamlit run app.py --server.port $PORT --server.address 0.0.0.0
```

e configure a variável `BIBLIOTECA_DB_URL` conforme o provedor.

## 🔒 Segurança e validações

- Inputs obrigatórios (título, autores) são validados tanto na UI quanto na
  camada de serviços — não é possível salvar sem eles.
- Avaliações só são permitidas para livros com status **Lido**.
- Exclusão de livros exige digitar o título exato como confirmação.
- Todas as interações com o banco passam por SQLAlchemy ORM, evitando SQL
  injection.
- Uploads de capa são salvos em `data/covers/` com nome saneado.

## 📄 Licença

Livre para uso pessoal e educacional. Ajuste para a licença de sua
preferência antes de publicar.
