// ==========================================
// SETOR DE TI - BACKEND SERVER
// Node.js + Express + MySQL (Railway)
// ==========================================

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

const dbConfig = {
    host:             process.env.MYSQLHOST     || 'mysql.railway.internal',
    port:             parseInt(process.env.MYSQLPORT) || 3306,
    user:             process.env.MYSQLUSER     || 'root',
    password:         process.env.MYSQLPASSWORD || 'OhogquOKFnLPXoQPaHKLyuSVOUUhQZqa',
    database:         process.env.MYSQLDATABASE || 'railway',
    waitForConnections: true,
    connectionLimit:  10,
    queueLimit:       0
};

const pool = mysql.createPool(dbConfig);

async function runMigrations() {
    const cols = [
        `ALTER TABLE atividades ADD COLUMN IF NOT EXISTS usuario_id   INT          DEFAULT NULL`,
        `ALTER TABLE atividades ADD COLUMN IF NOT EXISTS usuario_nome VARCHAR(100) DEFAULT NULL`,
        `ALTER TABLE atividades ADD COLUMN IF NOT EXISTS snapshot     JSON         DEFAULT NULL`,
        `ALTER TABLE servicos   ADD COLUMN IF NOT EXISTS criado_por    VARCHAR(100) DEFAULT NULL`,
        `ALTER TABLE servicos   ADD COLUMN IF NOT EXISTS modificado_por VARCHAR(100) DEFAULT NULL`,
        `ALTER TABLE servicos   ADD COLUMN IF NOT EXISTS usuario_id    INT          DEFAULT NULL`,
    ];
    for (const sql of cols) {
        try { await pool.execute(sql); } catch (e) {}
    }
    console.log('Migracoes aplicadas.');
}

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

function requireAuth(req, res, next) {
    if (req.headers['x-auth-token'] === 'setor-ti-authenticated') return next();
    res.status(401).json({ error: 'Nao autorizado' });
}

function getUserNome(req) {
    const h = req.headers['x-user-nome'];
    return h ? decodeURIComponent(h) : null;
}
function getUserId(req) {
    const id = req.headers['x-user-id'];
    return id ? parseInt(id) : null;
}

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM usuarios WHERE usuario = ? AND ativo = 1', [usuario]);
        if (!rows.length) return res.status(401).json({ error: 'usuario', message: 'O usuário está errado!!' });
        const user = rows[0];
        if (user.senha !== senha) return res.status(401).json({ error: 'senha', message: 'A senha está errada!!' });
        res.json({ success: true, token: 'setor-ti-authenticated',
                   user: { id: user.id, usuario: user.usuario, nome: user.nome_completo } });
    } catch (err) { res.status(500).json({ error: 'Erro interno' }); }
});

// --- DASHBOARD ---
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const [summary]         = await pool.execute('SELECT * FROM dashboard_resumo');
        const [recentInventory] = await pool.execute(
            'SELECT * FROM atividades WHERE tipo = ? ORDER BY data_atividade DESC LIMIT 10', ['inventory']);
        const [recentServices]  = await pool.execute(
            'SELECT * FROM atividades WHERE tipo = ? ORDER BY data_atividade DESC LIMIT 10', ['services']);
        recentServices.forEach(a => {
            if (a.snapshot && typeof a.snapshot === 'string') {
                try { a.snapshot = JSON.parse(a.snapshot); } catch(e) { a.snapshot = null; }
            }
        });
        res.json({ summary: summary[0] || {}, recentInventory, recentServices });
    } catch (err) { res.status(500).json({ error: 'Erro ao carregar dashboard' }); }
});

// --- ESTOQUE ---
app.get('/api/estoque', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM estoque_itens WHERE ativo = 1 ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'Erro ao listar estoque' }); }
});

app.post('/api/estoque', requireAuth, async (req, res) => {
    const { nome, categoria, quantidade, estoque_minimo, localizacao, descricao } = req.body;
    if (!nome || !categoria) return res.status(400).json({ error: 'Nome e categoria obrigatorios' });
    try {
        const [result] = await pool.execute(
            'INSERT INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, localizacao, descricao) VALUES (?,?,?,?,?,?)',
            [nome, categoria, quantidade||0, estoque_minimo||5, localizacao||'', descricao||'']
        );
        await logActivity('inventory','add','Adicionado: '+nome, getUserNome(req), getUserId(req), null);
        const [item] = await pool.execute('SELECT * FROM estoque_itens WHERE id=?',[result.insertId]);
        res.status(201).json(item[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao adicionar item' }); }
});

app.put('/api/estoque/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { nome, categoria, quantidade, estoque_minimo, localizacao, descricao } = req.body;
    try {
        await pool.execute(
            'UPDATE estoque_itens SET nome=?,categoria=?,quantidade=?,estoque_minimo=?,localizacao=?,descricao=? WHERE id=? AND ativo=1',
            [nome, categoria, quantidade, estoque_minimo, localizacao||'', descricao||'', id]
        );
        await logActivity('inventory','edit','Editado: '+nome, getUserNome(req), getUserId(req), null);
        const [updated] = await pool.execute('SELECT * FROM estoque_itens WHERE id=?',[id]);
        res.json(updated[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao editar item' }); }
});

app.delete('/api/estoque/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [item] = await pool.execute('SELECT nome FROM estoque_itens WHERE id=?',[id]);
        await pool.execute('UPDATE estoque_itens SET ativo=0 WHERE id=?',[id]);
        if (item[0]) await logActivity('inventory','delete','Excluído: '+item[0].nome, getUserNome(req), getUserId(req), null);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Erro ao excluir item' }); }
});

// --- SNIPPETS ---
app.get('/api/snippets', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM snippets WHERE ativo=1 ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'Erro ao listar snippets' }); }
});

app.post('/api/snippets', requireAuth, async (req, res) => {
    const { titulo, categoria, tipo, tags, descricao, codigo } = req.body;
    if (!titulo||!categoria||!tipo||!codigo) return res.status(400).json({ error: 'Campos obrigatorios faltando' });
    try {
        const [result] = await pool.execute(
            'INSERT INTO snippets (titulo,categoria,tipo,tags,descricao,codigo) VALUES (?,?,?,?,?,?)',
            [titulo, categoria, tipo, tags||'', descricao||'', codigo]
        );
        const [s] = await pool.execute('SELECT * FROM snippets WHERE id=?',[result.insertId]);
        res.status(201).json(s[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao adicionar snippet' }); }
});

app.put('/api/snippets/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { titulo, categoria, tipo, tags, descricao, codigo } = req.body;
    try {
        await pool.execute(
            'UPDATE snippets SET titulo=?,categoria=?,tipo=?,tags=?,descricao=?,codigo=? WHERE id=? AND ativo=1',
            [titulo, categoria, tipo, tags||'', descricao||'', codigo, id]
        );
        const [u] = await pool.execute('SELECT * FROM snippets WHERE id=?',[id]);
        res.json(u[0]);
    } catch (err) { res.status(500).json({ error: 'Erro ao editar snippet' }); }
});

app.delete('/api/snippets/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('UPDATE snippets SET ativo=0 WHERE id=?',[id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Erro ao excluir snippet' }); }
});

// --- SERVIÇOS ---
app.get('/api/servicos', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM servicos ORDER BY data_criacao DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'Erro ao listar servicos' }); }
});

app.post('/api/servicos', requireAuth, async (req, res) => {
    const { titulo, cliente_setor, prioridade, data_servico, descricao, relatorio } = req.body;
    if (!titulo||!descricao) return res.status(400).json({ error: 'Titulo e descricao obrigatorios' });
    const nomeUsr = getUserNome(req);
    const idUsr   = getUserId(req);
    try {
        const [result] = await pool.execute(
            'INSERT INTO servicos (titulo,cliente_setor,prioridade,data_servico,descricao,relatorio,status,criado_por,usuario_id) VALUES (?,?,?,?,?,?,?,?,?)',
            [titulo, cliente_setor||'', prioridade||'media', data_servico||null, descricao, relatorio||'', 'pending', nomeUsr, idUsr]
        );
        await logActivity('services','add','Adicionado serviço: '+titulo, nomeUsr, idUsr, null);
        const [s] = await pool.execute('SELECT * FROM servicos WHERE id=?',[result.insertId]);
        res.status(201).json(s[0]);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao adicionar servico' }); }
});

app.put('/api/servicos/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { titulo, cliente_setor, prioridade, data_servico, descricao, relatorio } = req.body;
    const nomeUsr = getUserNome(req);
    const idUsr   = getUserId(req);
    try {
        const [existing] = await pool.execute('SELECT criado_por,usuario_id FROM servicos WHERE id=?',[id]);
        if (!existing.length) return res.status(404).json({ error: 'Servico nao encontrado' });
        if (existing[0].usuario_id && existing[0].usuario_id !== idUsr)
            return res.status(403).json({ error: 'Apenas o responsável pode editar este serviço.' });
        await pool.execute(
            'UPDATE servicos SET titulo=?,cliente_setor=?,prioridade=?,data_servico=?,descricao=?,relatorio=?,modificado_por=? WHERE id=?',
            [titulo, cliente_setor||'', prioridade||'media', data_servico||null, descricao, relatorio||'', nomeUsr, id]
        );
        await logActivity('services','edit','Editado serviço: '+titulo, nomeUsr, idUsr, null);
        const [u] = await pool.execute('SELECT * FROM servicos WHERE id=?',[id]);
        res.json(u[0]);
    } catch (err) {
        if (err.status === 403) return res.status(403).json(err);
        res.status(500).json({ error: 'Erro ao editar servico' });
    }
});

app.patch('/api/servicos/:id/concluir', requireAuth, async (req, res) => {
    const { id } = req.params;
    const nomeUsr = getUserNome(req);
    const idUsr   = getUserId(req);
    try {
        const [existing] = await pool.execute('SELECT criado_por,usuario_id,titulo FROM servicos WHERE id=?',[id]);
        if (!existing.length) return res.status(404).json({ error: 'Servico nao encontrado' });
        if (existing[0].usuario_id && existing[0].usuario_id !== idUsr)
            return res.status(403).json({ error: 'Apenas o responsável pode concluir este serviço.' });
        await pool.execute(
            'UPDATE servicos SET status=?,data_conclusao=NOW(),modificado_por=? WHERE id=?',
            ['completed', nomeUsr, id]
        );
        await logActivity('services','complete','Concluído: '+existing[0].titulo, nomeUsr, idUsr, null);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Erro ao concluir servico' }); }
});

app.delete('/api/servicos/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const nomeUsr = getUserNome(req);
    const idUsr   = getUserId(req);
    try {
        const [rows] = await pool.execute('SELECT * FROM servicos WHERE id=?',[id]);
        if (!rows.length) return res.status(404).json({ error: 'Servico nao encontrado' });
        const svc = rows[0];
        if (svc.usuario_id && svc.usuario_id !== idUsr)
            return res.status(403).json({ error: 'Apenas o responsável pode excluir este serviço.' });
        const snapshot = {
            titulo: svc.titulo, cliente_setor: svc.cliente_setor,
            prioridade: svc.prioridade, status: svc.status,
            descricao: svc.descricao, relatorio: svc.relatorio,
            criado_por: svc.criado_por, data_servico: svc.data_servico
        };
        await pool.execute('DELETE FROM servicos WHERE id=?',[id]);
        await logActivity('services','delete','Excluído: '+svc.titulo, nomeUsr, idUsr, snapshot);
        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Erro ao excluir servico' }); }
});

// --- CONFIGURAÇÕES ---
app.get('/api/configuracoes', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM configuracoes');
        const config = {};
        rows.forEach(r => { config[r.chave] = r.valor; });
        res.json(config);
    } catch (err) { res.status(500).json({ error: 'Erro ao carregar configuracoes' }); }
});

app.put('/api/configuracoes/:chave', requireAuth, async (req, res) => {
    const { chave } = req.params;
    const { valor } = req.body;
    try {
        await pool.execute(
            'INSERT INTO configuracoes (chave,valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?',
            [chave, valor, valor]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Erro ao salvar configuracao' }); }
});

// --- HELPER LOG ---
async function logActivity(tipo, acao, detalhes, usuarioNome, usuarioId, snapshot) {
    try {
        await pool.execute(
            'INSERT INTO atividades (tipo,acao,detalhes,usuario_nome,usuario_id,snapshot) VALUES (?,?,?,?,?,?)',
            [tipo, acao, detalhes, usuarioNome||null, usuarioId||null, snapshot ? JSON.stringify(snapshot) : null]
        );
    } catch (err) { console.error('Erro ao registrar atividade:', err); }
}

// --- ESTÁTICOS ---
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- START ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log('Setor de TI rodando na porta ' + PORT);
    try {
        const conn = await pool.getConnection();
        console.log('Conectado ao MySQL (Railway)');
        conn.release();
        await runMigrations();
    } catch (err) {
        console.error('Banco indisponivel:', err.message);
    }
});
