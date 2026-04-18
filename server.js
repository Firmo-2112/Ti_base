// ==========================================
// SETOR DE TI - BACKEND SERVER
// Node.js + Express + MySQL (Railway)
// ==========================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// CONEXÃO COM O BANCO DE DADOS
// ==========================================
const dbConfig = {
    host: process.env.MYSQLHOST || 'mysql.railway.internal',
    port: parseInt(process.env.MYSQLPORT) || 3306,
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'OhogquOKFnLPXoQPaHKLyuSVOUUhQZqa',
    database: process.env.MYSQLDATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// ==========================================
// HEALTHCHECK — Railway precisa deste endpoint
// ==========================================
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO (SESSÃO SIMPLES)
// ==========================================
// Nota: Em produção, use JWT ou sessions com secret seguro
function requireAuth(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (token === 'setor-ti-authenticated') {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM usuarios WHERE usuario = ? AND ativo = 1',
            [usuario]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: 'usuario', message: 'O usuário está errado!!' });
        }
        const user = rows[0];
        if (user.senha !== senha) {
            return res.status(401).json({ error: 'senha', message: 'A senha está errada!!' });
        }
        res.json({
            success: true,
            token: 'setor-ti-authenticated',
            user: { id: user.id, usuario: user.usuario, nome: user.nome_completo }
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ==========================================
// ROTAS DE DASHBOARD
// ==========================================
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const [summary] = await pool.execute('SELECT * FROM dashboard_resumo');
        const [recentInventory] = await pool.execute(
            'SELECT * FROM atividades WHERE tipo = ? ORDER BY data_atividade DESC LIMIT 10',
            ['inventory']
        );
        const [recentServices] = await pool.execute(
            'SELECT * FROM atividades WHERE tipo = ? ORDER BY data_atividade DESC LIMIT 10',
            ['services']
        );
        res.json({
            summary: summary[0] || {},
            recentInventory,
            recentServices
        });
    } catch (err) {
        console.error('Erro no dashboard:', err);
        res.status(500).json({ error: 'Erro ao carregar dashboard' });
    }
});

// ==========================================
// ROTAS DE ESTOQUE
// ==========================================
app.get('/api/estoque', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM estoque_itens WHERE ativo = 1 ORDER BY data_criacao DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar estoque:', err);
        res.status(500).json({ error: 'Erro ao listar estoque' });
    }
});

app.post('/api/estoque', requireAuth, async (req, res) => {
    const { nome, categoria, quantidade, estoque_minimo, localizacao, descricao } = req.body;
    if (!nome || !categoria) {
        return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });
    }
    try {
        const [result] = await pool.execute(
            'INSERT INTO estoque_itens (nome, categoria, quantidade, estoque_minimo, localizacao, descricao) VALUES (?, ?, ?, ?, ?, ?)',
            [nome, categoria, quantidade || 0, estoque_minimo || 5, localizacao || '', descricao || '']
        );
        await logActivity('inventory', 'add', 'Adicionado: ' + nome, pool);
        const [newItem] = await pool.execute('SELECT * FROM estoque_itens WHERE id = ?', [result.insertId]);
        res.status(201).json(newItem[0]);
    } catch (err) {
        console.error('Erro ao adicionar item:', err);
        res.status(500).json({ error: 'Erro ao adicionar item' });
    }
});

app.put('/api/estoque/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { nome, categoria, quantidade, estoque_minimo, localizacao, descricao } = req.body;
    try {
        await pool.execute(
            'UPDATE estoque_itens SET nome=?, categoria=?, quantidade=?, estoque_minimo=?, localizacao=?, descricao=? WHERE id=? AND ativo=1',
            [nome, categoria, quantidade, estoque_minimo, localizacao || '', descricao || '', id]
        );
        await logActivity('inventory', 'edit', 'Editado: ' + nome, pool);
        const [updated] = await pool.execute('SELECT * FROM estoque_itens WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('Erro ao editar item:', err);
        res.status(500).json({ error: 'Erro ao editar item' });
    }
});

app.delete('/api/estoque/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [item] = await pool.execute('SELECT nome FROM estoque_itens WHERE id = ?', [id]);
        await pool.execute('UPDATE estoque_itens SET ativo = 0 WHERE id = ?', [id]);
        if (item[0]) await logActivity('inventory', 'delete', 'Excluído: ' + item[0].nome, pool);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir item:', err);
        res.status(500).json({ error: 'Erro ao excluir item' });
    }
});

// ==========================================
// ROTAS DE SNIPPETS
// ==========================================
app.get('/api/snippets', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM snippets WHERE ativo = 1 ORDER BY data_criacao DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar snippets:', err);
        res.status(500).json({ error: 'Erro ao listar snippets' });
    }
});

app.post('/api/snippets', requireAuth, async (req, res) => {
    const { titulo, categoria, tipo, tags, descricao, codigo } = req.body;
    if (!titulo || !categoria || !tipo || !codigo) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    try {
        const [result] = await pool.execute(
            'INSERT INTO snippets (titulo, categoria, tipo, tags, descricao, codigo) VALUES (?, ?, ?, ?, ?, ?)',
            [titulo, categoria, tipo, tags || '', descricao || '', codigo]
        );
        const [newSnippet] = await pool.execute('SELECT * FROM snippets WHERE id = ?', [result.insertId]);
        res.status(201).json(newSnippet[0]);
    } catch (err) {
        console.error('Erro ao adicionar snippet:', err);
        res.status(500).json({ error: 'Erro ao adicionar snippet' });
    }
});

app.put('/api/snippets/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { titulo, categoria, tipo, tags, descricao, codigo } = req.body;
    try {
        await pool.execute(
            'UPDATE snippets SET titulo=?, categoria=?, tipo=?, tags=?, descricao=?, codigo=? WHERE id=? AND ativo=1',
            [titulo, categoria, tipo, tags || '', descricao || '', codigo, id]
        );
        const [updated] = await pool.execute('SELECT * FROM snippets WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('Erro ao editar snippet:', err);
        res.status(500).json({ error: 'Erro ao editar snippet' });
    }
});

app.delete('/api/snippets/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('UPDATE snippets SET ativo = 0 WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir snippet:', err);
        res.status(500).json({ error: 'Erro ao excluir snippet' });
    }
});

// ==========================================
// ROTAS DE SERVIÇOS
// ==========================================
app.get('/api/servicos', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM servicos ORDER BY data_criacao DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar serviços:', err);
        res.status(500).json({ error: 'Erro ao listar serviços' });
    }
});

app.post('/api/servicos', requireAuth, async (req, res) => {
    const { titulo, cliente_setor, prioridade, data_servico, descricao, relatorio } = req.body;
    if (!titulo || !descricao) {
        return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }
    try {
        const [result] = await pool.execute(
            'INSERT INTO servicos (titulo, cliente_setor, prioridade, data_servico, descricao, relatorio, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [titulo, cliente_setor || '', prioridade || 'media', data_servico || null, descricao, relatorio || '', 'pending']
        );
        await logActivity('services', 'add', 'Adicionado serviço: ' + titulo, pool);
        const [newService] = await pool.execute('SELECT * FROM servicos WHERE id = ?', [result.insertId]);
        res.status(201).json(newService[0]);
    } catch (err) {
        console.error('Erro ao adicionar serviço:', err);
        res.status(500).json({ error: 'Erro ao adicionar serviço' });
    }
});

app.put('/api/servicos/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { titulo, cliente_setor, prioridade, data_servico, descricao, relatorio } = req.body;
    try {
        await pool.execute(
            'UPDATE servicos SET titulo=?, cliente_setor=?, prioridade=?, data_servico=?, descricao=?, relatorio=? WHERE id=?',
            [titulo, cliente_setor || '', prioridade || 'media', data_servico || null, descricao, relatorio || '', id]
        );
        await logActivity('services', 'edit', 'Editado serviço: ' + titulo, pool);
        const [updated] = await pool.execute('SELECT * FROM servicos WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('Erro ao editar serviço:', err);
        res.status(500).json({ error: 'Erro ao editar serviço' });
    }
});

app.patch('/api/servicos/:id/concluir', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute(
            'UPDATE servicos SET status = ?, data_conclusao = NOW() WHERE id = ?',
            ['completed', id]
        );
        const [service] = await pool.execute('SELECT titulo FROM servicos WHERE id = ?', [id]);
        if (service[0]) await logActivity('services', 'complete', 'Concluído: ' + service[0].titulo, pool);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao concluir serviço:', err);
        res.status(500).json({ error: 'Erro ao concluir serviço' });
    }
});

app.delete('/api/servicos/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const [service] = await pool.execute('SELECT titulo FROM servicos WHERE id = ?', [id]);
        await pool.execute('DELETE FROM servicos WHERE id = ?', [id]);
        if (service[0]) await logActivity('services', 'delete', 'Excluído: ' + service[0].titulo, pool);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir serviço:', err);
        res.status(500).json({ error: 'Erro ao excluir serviço' });
    }
});

// ==========================================
// ROTAS DE CONFIGURAÇÕES
// ==========================================
app.get('/api/configuracoes', requireAuth, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM configuracoes');
        const config = {};
        rows.forEach(row => { config[row.chave] = row.valor; });
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
});

app.put('/api/configuracoes/:chave', requireAuth, async (req, res) => {
    const { chave } = req.params;
    const { valor } = req.body;
    try {
        await pool.execute(
            'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?',
            [chave, valor, valor]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar configuração' });
    }
});

// ==========================================
// HELPER: REGISTRAR ATIVIDADE
// ==========================================
async function logActivity(tipo, acao, detalhes, pool) {
    try {
        await pool.execute(
            'INSERT INTO atividades (tipo, acao, detalhes) VALUES (?, ?, ?)',
            [tipo, acao, detalhes]
        );
    } catch (err) {
        console.error('Erro ao registrar atividade:', err);
    }
}

// ==========================================
// FALLBACK PARA SPA
// ==========================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// INICIAR SERVIDOR
// Railway exige bind em 0.0.0.0 e usa PORT dinamicamente
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Setor de TI rodando na porta ${PORT}`);

    // Testar conexão com o banco APÓS o servidor HTTP estar pronto
    pool.getConnection()
        .then(conn => {
            console.log('✅ Conectado ao banco de dados MySQL (Railway)');
            conn.release();
        })
        .catch(err => {
            console.error('⚠️  Banco de dados indisponível no momento:', err.message);
            console.error('   O servidor HTTP continua rodando. Verifique as variáveis de ambiente.');
        });
});
