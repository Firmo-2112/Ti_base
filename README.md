# 🚀 Setor de TI — Deploy no Railway (MySQL)

## Estrutura do Projeto

```
/
├── server.js          ← Backend Node.js/Express (API REST)
├── package.json       ← Dependências npm
├── railway.toml       ← Config de deploy Railway
├── .env               ← Variáveis de ambiente (local)
└── public/
    ├── index.html     ← Frontend (sem alteração)
    ├── styles.css     ← Estilos (sem alteração)
    └── app.js         ← Frontend reescrito (usa API ao invés de localStorage)
```

---

## Como fazer o deploy no Railway

### 1. Estrutura de arquivos no GitHub

Suba **todos** os arquivos para o repositório GitHub (Ti_base) mantendo a estrutura acima.
O `server.js` deve ficar na raiz. O `index.html`, `styles.css` e `app.js` dentro de `public/`.

### 2. Variáveis de Ambiente no Railway

No painel do seu serviço **Ti_base** no Railway, vá em **Variables** e adicione:

| Chave           | Valor                          |
|-----------------|--------------------------------|
| MYSQLHOST       | mysql.railway.internal         |
| MYSQLPORT       | 3306                           |
| MYSQLUSER       | root                           |
| MYSQLPASSWORD   | OhogquOKFnLPXoQPaHKLyuSVOUUhQZqa |
| MYSQLDATABASE   | railway                        |

> O `PORT` é definido automaticamente pelo Railway — não precisa adicionar.

### 3. Como funciona

- O Railway sobe o `server.js` com `node server.js`
- O Express serve os arquivos de `public/` como site estático
- O frontend (`app.js`) faz chamadas para `/api/*` no mesmo domínio
- O backend conecta ao MySQL interno do Railway via `mysql.railway.internal`

---

## API Endpoints

| Método | Rota                        | Descrição                  |
|--------|-----------------------------|----------------------------|
| POST   | /api/login                  | Autenticação               |
| GET    | /api/dashboard              | Resumo + atividades        |
| GET    | /api/estoque                | Listar itens               |
| POST   | /api/estoque                | Adicionar item             |
| PUT    | /api/estoque/:id            | Editar item                |
| DELETE | /api/estoque/:id            | Excluir item (soft delete) |
| GET    | /api/snippets               | Listar snippets            |
| POST   | /api/snippets               | Adicionar snippet          |
| PUT    | /api/snippets/:id           | Editar snippet             |
| DELETE | /api/snippets/:id           | Excluir snippet            |
| GET    | /api/servicos               | Listar serviços            |
| POST   | /api/servicos               | Adicionar serviço          |
| PUT    | /api/servicos/:id           | Editar serviço             |
| PATCH  | /api/servicos/:id/concluir  | Marcar como concluído      |
| DELETE | /api/servicos/:id           | Excluir serviço            |
| GET    | /api/configuracoes          | Carregar configurações     |
| PUT    | /api/configuracoes/:chave   | Salvar configuração        |
