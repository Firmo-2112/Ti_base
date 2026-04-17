// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================
// Objeto que armazena todos os dados da aplicação em memória
const AppState = {
    inventory: [],           // Itens do estoque
    snippets: [],            // Códigos CMD/PowerShell/Batch
    services: [],            // Serviços/atividades
    inventoryActivities: [], // Histórico de atividades do estoque
    servicesActivities: [],  // Histórico de atividades dos serviços
    settings: {
        theme: 'dark'        // Tema atual (dark/light)
    }
};

// ==========================================
// GERENCIADOR DE LOGIN
// ==========================================
const LoginManager = {
    inactivityTimer: null,
    INACTIVITY_TIMEOUT: 3600000, // 1 hora (3600000 ms)

    init() {
        this.setupEventListeners();
        this.checkSession();
    },

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const passwordToggle = document.getElementById('passwordToggle');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        passwordToggle.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Limpar erro ao digitar
        document.getElementById('loginUser').addEventListener('input', () => {
            this.hideError();
        });
        document.getElementById('loginPassword').addEventListener('input', () => {
            this.hideError();
        });

        // Botão de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    },

    checkSession() {
        const isLoggedIn = sessionStorage.getItem('setorTI_logged');
        if (isLoggedIn === 'true') {
            this.showApp();
        }
    },

    handleLogin() {
        const user = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPassword').value;

        const userCorrect = user === 'Admin';
        const passwordCorrect = password === 'Administracao@1';

        if (userCorrect && passwordCorrect) {
            sessionStorage.setItem('setorTI_logged', 'true');
            this.showApp();
            Toast.show('Login realizado com sucesso!', 'success');
        } else {
            let message = 'Usuário ou senha inválidos!';
            
            if (!userCorrect && !passwordCorrect) {
                message = 'O usuário e senha estão errados!!';
            } else if (!userCorrect) {
                message = 'O usuário está errado!!';
            } else {
                message = 'A senha está errada!!';
            }
            
            this.showError(message);
        }
    },

    logout() {
        sessionStorage.removeItem('setorTI_logged');
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        appContainer.style.display = 'none';
        loginScreen.style.display = 'flex';
        
        // Limpar formulário de login
        document.getElementById('loginForm').reset();
        this.hideError();
        
        Toast.show('Logout realizado com sucesso!', 'info');
    },

    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.inactivityTimer = setTimeout(() => {
            Toast.show('Sessão expirada por inatividade!', 'info');
            this.logout();
        }, this.INACTIVITY_TIMEOUT);
    },

    showError(message) {
        const errorEl = document.getElementById('loginError');
        const messageEl = document.getElementById('loginErrorMessage');
        
        if (message) {
            messageEl.textContent = message;
        }
        
        errorEl.classList.add('visible');
        
        // Animar o erro
        errorEl.style.animation = 'none';
        errorEl.offsetHeight; // Trigger reflow
        errorEl.style.animation = 'shake 0.3s ease';
    },

    hideError() {
        const errorEl = document.getElementById('loginError');
        errorEl.classList.remove('visible');
    },

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('loginPassword');
        const toggleBtn = document.getElementById('passwordToggle');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        } else {
            passwordInput.type = 'password';
            toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
    },

    showApp() {
        const loginScreen = document.getElementById('loginScreen');
        const appContainer = document.getElementById('appContainer');
        
        loginScreen.style.display = 'none';
        appContainer.style.display = 'flex';
        
        // Iniciar timer de inatividade
        this.resetInactivityTimer();
        
        // Resetar timer em qualquer atividade do usuário
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
        });
        
        // Inicializar o aplicativo
        this.initializeApp();
    },

    initializeApp() {
        // Carregar dados do localStorage
        StorageManager.load();
        
        // Carregar dados de exemplo se vazio
        SampleData.load();
        
        // Configurar tema
        const themeToggle = document.getElementById('themeToggle');
        
        if (AppState.settings.theme === 'light') {
            themeToggle.checked = true;
            document.documentElement.setAttribute('data-theme', 'light');
        }

        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.documentElement.setAttribute('data-theme', 'light');
                AppState.settings.theme = 'light';
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                AppState.settings.theme = 'dark';
            }
            StorageManager.save();
        });

        Navigation.init();
        Dashboard.update();
        Dashboard.setupQuickActions();
        Inventory.init();
        Snippets.init();
        Services.init();
        ActivityLogger.renderInventory();
        ActivityLogger.renderServices();

        console.log('Setor de TI initialized successfully!');
    }
};

// ==========================================
// GERENCIADOR DE ARMAZENAMENTO LOCAL
// ==========================================
// Este gerenciador salva os dados no localStorage
const StorageManager = {
    // Salva estado atual no localStorage
    save() {
        try {
            localStorage.setItem('setorTI', JSON.stringify(AppState));
        } catch (e) {
            console.error('Erro ao salvar dados:', e);
        }
    },

    // Carrega dados do localStorage
    load() {
        try {
            const data = localStorage.getItem('setorTI');
            if (data) {
                const parsed = JSON.parse(data);
                Object.assign(AppState, parsed);
            }
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
        }
    },

    clear() {
        localStorage.removeItem('setorTI');
        location.reload();
    },

    export() {
        const dataStr = JSON.stringify(AppState, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'setor-ti-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    import(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    Object.assign(AppState, data);
                    this.save();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};

// ==========================================
// SISTEMA DE NOTIFICAÇÕES
// ==========================================
const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;

        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };

        toast.innerHTML = '<div class="toast-icon">' + icons[type] + '</div><span class="toast-message">' + message + '</span><button class="toast-close">&times;</button>';

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));

        setTimeout(() => this.remove(toast), 4000);
    },

    remove(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }
};

// ==========================================
// SISTEMA DE MODAIS
// ==========================================
const Modal = {
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
        }
    },

    closeAll() {
        document.querySelectorAll('.modal-overlay.visible').forEach(modal => {
            modal.classList.remove('visible');
        });
        document.body.style.overflow = '';
    },

    confirm(title, message, callback) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        const confirmBtn = document.getElementById('confirmAction');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        
        newBtn.addEventListener('click', () => {
            callback();
            this.close('confirmModal');
        });
        
        this.open('confirmModal');
    }
};

// ==========================================
// REGISTRADOR DE ATIVIDADES
// ==========================================
const ActivityLogger = {
    log(type, action, details) {
        const activity = {
            id: Date.now(),
            action,
            details,
            timestamp: new Date().toISOString()
        };
        
        if (type === 'inventory') {
            AppState.inventoryActivities.unshift(activity);
            if (AppState.inventoryActivities.length > 50) {
                AppState.inventoryActivities = AppState.inventoryActivities.slice(0, 50);
            }
            this.renderInventory();
        } else if (type === 'services') {
            AppState.servicesActivities.unshift(activity);
            if (AppState.servicesActivities.length > 50) {
                AppState.servicesActivities = AppState.servicesActivities.slice(0, 50);
            }
            this.renderServices();
        }
        
        StorageManager.save();
    },

    renderInventory() {
        const container = document.getElementById('inventoryActivityList');
        
        if (AppState.inventoryActivities.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>Nenhuma atividade recente</p></div>';
            return;
        }

        const icons = {
            add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
        };

        container.innerHTML = AppState.inventoryActivities.slice(0, 10).map(activity => {
            const time = this.formatTime(activity.timestamp);
            return '<div class="activity-item"><div class="activity-icon ' + activity.action + '">' + icons[activity.action] + '</div><div class="activity-content"><span class="activity-text">' + activity.details + '</span><span class="activity-time">' + time + '</span></div></div>';
        }).join('');
    },

    renderServices() {
        const container = document.getElementById('servicesActivityList');
        
        if (AppState.servicesActivities.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><p>Nenhuma atividade recente</p></div>';
            return;
        }

        const icons = {
            add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
            edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            complete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
        };

        container.innerHTML = AppState.servicesActivities.slice(0, 10).map(activity => {
            const time = this.formatTime(activity.timestamp);
            return '<div class="activity-item"><div class="activity-icon ' + activity.action + '">' + icons[activity.action] + '</div><div class="activity-content"><span class="activity-text">' + activity.details + '</span><span class="activity-time">' + time + '</span></div></div>';
        }).join('');
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Agora mesmo';
        if (diff < 3600000) return 'Há ' + Math.floor(diff / 60000) + ' min';
        if (diff < 86400000) return 'Há ' + Math.floor(diff / 3600000) + ' horas';
        return date.toLocaleDateString('pt-BR');
    }
};

// ==========================================
// DASHBOARD
// ==========================================
const Dashboard = {
    update() {
        document.getElementById('totalItems').textContent = AppState.inventory.length;
        document.getElementById('totalSnippets').textContent = AppState.snippets.length;
        
        const pendingServices = AppState.services.filter(s => s.status === 'pending').length;
        document.getElementById('pendingServices').textContent = pendingServices;
        
        const lowStock = AppState.inventory.filter(item => {
            const qty = parseInt(item.quantity) || 0;
            const min = parseInt(item.minStock) || 5;
            return qty <= min;
        }).length;
        document.getElementById('lowStockItems').textContent = lowStock;
        document.getElementById('inventoryBadge').textContent = lowStock;
        document.getElementById('inventoryBadge').style.display = lowStock > 0 ? 'inline' : 'none';
        
        document.getElementById('servicesBadge').textContent = pendingServices;
        document.getElementById('servicesBadge').style.display = pendingServices > 0 ? 'inline' : 'none';
    },

    setupQuickActions() {
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                switch (action) {
                    case 'add-item':
                        Inventory.openAddModal();
                        break;
                    case 'add-snippet':
                        Snippets.openAddModal();
                        break;
                    case 'add-service':
                        Services.openAddModal();
                        break;
                    case 'export-data':
                        StorageManager.export();
                        Toast.show('Dados exportados com sucesso!', 'success');
                        break;
                }
            });
        });
    }
};

// ==========================================
// GERENCIADOR DE ESTOQUE
// ==========================================
const Inventory = {
    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        document.getElementById('addItemBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('addFirstItemBtn').addEventListener('click', () => this.openAddModal());

        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        document.getElementById('inventorySearch').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.render(document.getElementById('inventorySearch').value, e.target.value);
        });
    },

    openAddModal() {
        document.getElementById('itemModalTitle').textContent = 'Adicionar Item';
        document.getElementById('itemForm').reset();
        document.getElementById('itemId').value = '';
        document.getElementById('itemQuantity').value = '1';
        document.getElementById('itemMinStock').value = '5';
        Modal.open('itemModal');
    },

    openEditModal(id) {
        const item = AppState.inventory.find(i => i.id === id);
        if (!item) return;

        document.getElementById('itemModalTitle').textContent = 'Editar Item';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemQuantity').value = item.quantity;
        document.getElementById('itemMinStock').value = item.minStock || 5;
        document.getElementById('itemLocation').value = item.location || '';
        document.getElementById('itemDescription').value = item.description || '';
        
        Modal.open('itemModal');
    },

    saveItem() {
        const id = document.getElementById('itemId').value;
        const itemData = {
            name: document.getElementById('itemName').value.trim(),
            category: document.getElementById('itemCategory').value,
            quantity: parseInt(document.getElementById('itemQuantity').value) || 0,
            minStock: parseInt(document.getElementById('itemMinStock').value) || 5,
            location: document.getElementById('itemLocation').value.trim(),
            description: document.getElementById('itemDescription').value.trim()
        };

        if (!itemData.name || !itemData.category) {
            Toast.show('Preencha os campos obrigatórios!', 'error');
            return;
        }

        if (id) {
            const index = AppState.inventory.findIndex(i => i.id === id);
            if (index !== -1) {
                AppState.inventory[index] = { ...AppState.inventory[index], ...itemData };
                ActivityLogger.log('inventory', 'edit', 'Editado: ' + itemData.name);
                Toast.show('Item atualizado com sucesso!', 'success');
            }
        } else {
            itemData.id = Date.now().toString();
            itemData.createdAt = new Date().toISOString();
            AppState.inventory.push(itemData);
            ActivityLogger.log('inventory', 'add', 'Adicionado: ' + itemData.name);
            Toast.show('Item adicionado com sucesso!', 'success');
        }

        StorageManager.save();
        Modal.close('itemModal');
        this.render();
        Dashboard.update();
    },

    deleteItem(id) {
        const item = AppState.inventory.find(i => i.id === id);
        if (!item) return;

        Modal.confirm(
            'Excluir Item',
            'Tem certeza que deseja excluir "' + item.name + '"?',
            () => {
                AppState.inventory = AppState.inventory.filter(i => i.id !== id);
                ActivityLogger.log('inventory', 'delete', 'Excluído: ' + item.name);
                StorageManager.save();
                this.render();
                Dashboard.update();
                Toast.show('Item excluído com sucesso!', 'success');
            }
        );
    },

    getStockStatus(item) {
        const qty = parseInt(item.quantity) || 0;
        const min = parseInt(item.minStock) || 5;
        
        if (qty === 0) return { class: 'out', text: 'Esgotado' };
        if (qty <= min) return { class: 'low', text: 'Baixo (' + qty + ')' };
        return { class: 'ok', text: 'OK' };
    },

    getCategoryLabel(category) {
        const labels = {
            hardware: 'Hardware',
            software: 'Software',
            perifericos: 'Periféricos',
            cabos: 'Cabos',
            rede: 'Rede',
            outros: 'Outros'
        };
        return labels[category] || category;
    },

    render(searchTerm = '', categoryFilter = '') {
        const tbody = document.getElementById('inventoryBody');
        const emptyState = document.getElementById('inventoryEmpty');
        const table = document.getElementById('inventoryTable');

        let items = [...AppState.inventory];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.name.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term)
            );
        }

        if (categoryFilter) {
            items = items.filter(item => item.category === categoryFilter);
        }

        if (items.length === 0) {
            table.style.display = 'none';
            emptyState.classList.add('visible');
        } else {
            table.style.display = 'table';
            emptyState.classList.remove('visible');

            tbody.innerHTML = items.map(item => {
                const status = this.getStockStatus(item);
                return '<tr><td><strong>' + this.escapeHtml(item.name) + '</strong>' + (item.description ? '<br><small style="color: var(--text-muted)">' + this.escapeHtml(item.description.substring(0, 50)) + '...</small>' : '') + '</td><td><span class="snippet-tag">' + this.getCategoryLabel(item.category) + '</span></td><td>' + item.quantity + '</td><td>' + (item.location || '-') + '</td><td><span class="stock-status ' + status.class + '">' + status.text + '</span></td><td><div class="action-buttons"><button class="btn btn-sm btn-secondary btn-icon" onclick="Inventory.openEditModal(\'' + item.id + '\')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn btn-sm btn-danger btn-icon" onclick="Inventory.deleteItem(\'' + item.id + '\')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></td></tr>';
            }).join('');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==========================================
// GERENCIADOR DE CÓDIGOS (SNIPPETS)
// ==========================================
const Snippets = {
    currentViewSnippet: null,

    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        document.getElementById('addSnippetBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('addFirstSnippetBtn').addEventListener('click', () => this.openAddModal());

        document.getElementById('snippetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSnippet();
        });

        document.getElementById('snippetsSearch').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        document.getElementById('snippetCategoryFilter').addEventListener('change', () => {
            this.render(document.getElementById('snippetsSearch').value, document.getElementById('snippetCategoryFilter').value, document.getElementById('snippetTypeFilter').value);
        });

        document.getElementById('snippetTypeFilter').addEventListener('change', () => {
            this.render(document.getElementById('snippetsSearch').value, document.getElementById('snippetCategoryFilter').value, document.getElementById('snippetTypeFilter').value);
        });

        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            if (this.currentViewSnippet) {
                navigator.clipboard.writeText(this.currentViewSnippet.code).then(() => {
                    Toast.show('Código copiado!', 'success');
                });
            }
        });
    },

    openAddModal() {
        document.getElementById('snippetModalTitle').textContent = 'Adicionar Código';
        document.getElementById('snippetForm').reset();
        document.getElementById('snippetId').value = '';
        Modal.open('snippetModal');
    },

    openEditModal(id) {
        const snippet = AppState.snippets.find(s => s.id === id);
        if (!snippet) return;

        document.getElementById('snippetModalTitle').textContent = 'Editar Código';
        document.getElementById('snippetId').value = snippet.id;
        document.getElementById('snippetTitle').value = snippet.title;
        document.getElementById('snippetCategory').value = snippet.category;
        document.getElementById('snippetType').value = snippet.type;
        document.getElementById('snippetTags').value = snippet.tags || '';
        document.getElementById('snippetDescription').value = snippet.description || '';
        document.getElementById('snippetCode').value = snippet.code;
        
        Modal.open('snippetModal');
    },

    viewSnippet(id) {
        const snippet = AppState.snippets.find(s => s.id === id);
        if (!snippet) return;

        this.currentViewSnippet = snippet;
        
        document.getElementById('viewSnippetTitle').textContent = snippet.title;
        document.getElementById('viewSnippetType').textContent = snippet.type.toUpperCase();
        
        const codeElement = document.getElementById('viewSnippetCode');
        codeElement.textContent = snippet.code;
        
        const metaElement = document.getElementById('viewSnippetMeta');
        const categoryLabels = { sistema: 'Sistema', impressora: 'Impressora', rede: 'Rede' };
        const tags = snippet.tags ? snippet.tags.split(',').map(t => '<span class="snippet-tag">' + t.trim() + '</span>').join('') : '';
        metaElement.innerHTML = '<span class="snippet-type-badge ' + snippet.type + '">' + snippet.type.toUpperCase() + '</span><span class="snippet-tag">' + (categoryLabels[snippet.category] || snippet.category) + '</span>' + tags;
        
        Modal.open('viewSnippetModal');
    },

    saveSnippet() {
        const id = document.getElementById('snippetId').value;
        const snippetData = {
            title: document.getElementById('snippetTitle').value.trim(),
            category: document.getElementById('snippetCategory').value,
            type: document.getElementById('snippetType').value,
            tags: document.getElementById('snippetTags').value.trim(),
            description: document.getElementById('snippetDescription').value.trim(),
            code: document.getElementById('snippetCode').value
        };

        if (!snippetData.title || !snippetData.category || !snippetData.type || !snippetData.code) {
            Toast.show('Preencha os campos obrigatórios!', 'error');
            return;
        }

        if (id) {
            const index = AppState.snippets.findIndex(s => s.id === id);
            if (index !== -1) {
                AppState.snippets[index] = { ...AppState.snippets[index], ...snippetData };
                Toast.show('Código atualizado com sucesso!', 'success');
            }
        } else {
            snippetData.id = Date.now().toString();
            snippetData.createdAt = new Date().toISOString();
            AppState.snippets.push(snippetData);
            Toast.show('Código adicionado com sucesso!', 'success');
        }

        StorageManager.save();
        Modal.close('snippetModal');
        this.render();
        Dashboard.update();
    },

    deleteSnippet(id) {
        const snippet = AppState.snippets.find(s => s.id === id);
        if (!snippet) return;

        Modal.confirm(
            'Excluir Código',
            'Tem certeza que deseja excluir "' + snippet.title + '"?',
            () => {
                AppState.snippets = AppState.snippets.filter(s => s.id !== id);
                StorageManager.save();
                this.render();
                Dashboard.update();
                Toast.show('Código excluído com sucesso!', 'success');
            }
        );
    },

    getTypeLabel(type) {
        return type.toUpperCase();
    },

    getCategoryLabel(category) {
        const labels = { sistema: 'Sistema', impressora: 'Impressora', rede: 'Rede' };
        return labels[category] || category;
    },

    render(searchTerm = '', categoryFilter = '', typeFilter = '') {
        const grid = document.getElementById('snippetsGrid');
        const emptyState = document.getElementById('snippetsEmpty');

        let snippets = [...AppState.snippets];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            snippets = snippets.filter(snippet => 
                snippet.title.toLowerCase().includes(term) ||
                snippet.description.toLowerCase().includes(term) ||
                snippet.tags.toLowerCase().includes(term) ||
                snippet.code.toLowerCase().includes(term)
            );
        }

        if (categoryFilter) {
            snippets = snippets.filter(snippet => snippet.category === categoryFilter);
        }

        if (typeFilter) {
            snippets = snippets.filter(snippet => snippet.type === typeFilter);
        }

        if (snippets.length === 0) {
            grid.style.display = 'none';
            emptyState.classList.add('visible');
        } else {
            grid.style.display = 'grid';
            emptyState.classList.remove('visible');

            grid.innerHTML = snippets.map(snippet => {
                const tags = snippet.tags ? snippet.tags.split(',').slice(0, 3).map(t => '<span class="snippet-tag">' + t.trim() + '</span>').join('') : '';
                const codePreview = snippet.code.split('\n')[0] ? snippet.code.split('\n')[0].substring(0, 60) : '';

                return '<div class="snippet-card" onclick="Snippets.viewSnippet(\'' + snippet.id + '\')"><div class="snippet-card-header"><h4 class="snippet-title">' + Inventory.escapeHtml(snippet.title) + '</h4><span class="snippet-type-badge ' + snippet.type + '">' + snippet.type.toUpperCase() + '</span><span class="snippet-tag">' + this.getCategoryLabel(snippet.category) + '</span></div>' + (snippet.description ? '<p class="snippet-description">' + Inventory.escapeHtml(snippet.description) + '</p>' : '') + (tags ? '<div class="snippet-tags">' + tags + '</div>' : '') + '<div class="snippet-preview">' + Inventory.escapeHtml(codePreview) + '...</div><div class="snippet-card-actions" onclick="event.stopPropagation()"><button class="btn btn-sm btn-secondary" onclick="Snippets.openEditModal(\'' + snippet.id + '\')">Editar</button><button class="btn btn-sm btn-danger" onclick="Snippets.deleteSnippet(\'' + snippet.id + '\')">Excluir</button></div></div>';
            }).join('');
        }
    }
};

// ==========================================
// GERENCIADOR DE SERVIÇOS
// ==========================================
const Services = {
    currentViewService: null,

    init() {
        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        document.getElementById('addServiceBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('addFirstServiceBtn').addEventListener('click', () => this.openAddModal());

        document.getElementById('serviceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveService();
        });

        document.getElementById('servicesSearch').addEventListener('input', (e) => {
            this.render(e.target.value);
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.render(document.getElementById('servicesSearch').value, e.target.value);
        });

        document.getElementById('editFromViewBtn').addEventListener('click', () => {
            if (this.currentViewService) {
                Modal.close('viewServiceModal');
                this.openEditModal(this.currentViewService.id);
            }
        });
    },

    openAddModal() {
        document.getElementById('serviceModalTitle').textContent = 'Adicionar Serviço';
        document.getElementById('serviceForm').reset();
        document.getElementById('serviceId').value = '';
        document.getElementById('serviceDate').value = new Date().toISOString().split('T')[0];
        Modal.open('serviceModal');
    },

    openEditModal(id) {
        const service = AppState.services.find(s => s.id === id);
        if (!service) return;

        document.getElementById('serviceModalTitle').textContent = 'Editar Serviço';
        document.getElementById('serviceId').value = service.id;
        document.getElementById('serviceTitle').value = service.title;
        document.getElementById('serviceClient').value = service.client || '';
        document.getElementById('servicePriority').value = service.priority || 'media';
        document.getElementById('serviceDate').value = service.date || '';
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('serviceReport').value = service.report || '';
        
        Modal.open('serviceModal');
    },

    viewService(id) {
        const service = AppState.services.find(s => s.id === id);
        if (!service) return;

        this.currentViewService = service;
        
        document.getElementById('viewServiceTitle').textContent = service.title;
        
        const statusLabel = service.status === 'pending' ? 'Pendente' : 'Concluído';
        const priorityLabels = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
        
        document.getElementById('viewServiceMeta').innerHTML = '<span class="service-status-badge ' + service.status + '">' + statusLabel + '</span><span class="service-priority ' + service.priority + '">' + priorityLabels[service.priority] + '</span>' + (service.client ? '<span>' + Inventory.escapeHtml(service.client) + '</span>' : '') + (service.date ? '<span>' + new Date(service.date).toLocaleDateString('pt-BR') + '</span>' : '');
        
        document.getElementById('viewServiceDescription').textContent = service.description;
        document.getElementById('viewServiceReport').textContent = service.report || 'Nenhum relatório registrado.';
        
        Modal.open('viewServiceModal');
    },

    saveService() {
        const id = document.getElementById('serviceId').value;
        const serviceData = {
            title: document.getElementById('serviceTitle').value.trim(),
            client: document.getElementById('serviceClient').value.trim(),
            priority: document.getElementById('servicePriority').value,
            date: document.getElementById('serviceDate').value,
            description: document.getElementById('serviceDescription').value.trim(),
            report: document.getElementById('serviceReport').value.trim()
        };

        if (!serviceData.title || !serviceData.description) {
            Toast.show('Preencha os campos obrigatórios!', 'error');
            return;
        }

        if (id) {
            const index = AppState.services.findIndex(s => s.id === id);
            if (index !== -1) {
                AppState.services[index] = { ...AppState.services[index], ...serviceData };
                ActivityLogger.log('services', 'edit', 'Editado serviço: ' + serviceData.title);
                Toast.show('Serviço atualizado com sucesso!', 'success');
            }
        } else {
            serviceData.id = Date.now().toString();
            serviceData.status = 'pending';
            serviceData.createdAt = new Date().toISOString();
            AppState.services.push(serviceData);
            ActivityLogger.log('services', 'add', 'Adicionado serviço: ' + serviceData.title);
            Toast.show('Serviço adicionado com sucesso!', 'success');
        }

        StorageManager.save();
        Modal.close('serviceModal');
        this.render();
        Dashboard.update();
    },

    completeService(id) {
        const service = AppState.services.find(s => s.id === id);
        if (!service) return;

        service.status = 'completed';
        service.completedAt = new Date().toISOString();
        ActivityLogger.log('services', 'complete', 'Concluído: ' + service.title);
        StorageManager.save();
        this.render();
        Dashboard.update();
        Toast.show('Serviço concluído com sucesso!', 'success');
    },

    getStatusLabel(status) {
        return status === 'pending' ? 'Pendente' : 'Concluído';
    },

    getPriorityLabel(priority) {
        const labels = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
        return labels[priority] || priority;
    },

    render(searchTerm = '', statusFilter = '') {
        const list = document.getElementById('servicesList');
        const emptyState = document.getElementById('servicesEmpty');

        let services = [...AppState.services];

        services.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            services = services.filter(service => 
                service.title.toLowerCase().includes(term) ||
                service.description.toLowerCase().includes(term) ||
                service.client.toLowerCase().includes(term) ||
                service.report.toLowerCase().includes(term)
            );
        }

        if (statusFilter) {
            services = services.filter(service => service.status === statusFilter);
        }

        if (services.length === 0) {
            list.style.display = 'none';
            emptyState.classList.add('visible');
        } else {
            list.style.display = 'flex';
            emptyState.classList.remove('visible');

            list.innerHTML = services.map(service => {
                const statusLabel = this.getStatusLabel(service.status);
                const priorityLabel = this.getPriorityLabel(service.priority);
                const date = service.date ? new Date(service.date).toLocaleDateString('pt-BR') : '-';

                let actionsHtml = '<div class="service-card-actions" onclick="event.stopPropagation()">';
                actionsHtml += '<button class="btn btn-sm btn-secondary" onclick="Services.openEditModal(\'' + service.id + '\')">Editar</button>';
                
                if (service.status === 'pending') {
                    actionsHtml += '<button class="btn btn-sm btn-primary" onclick="Services.completeService(\'' + service.id + '\')">Concluir</button>';
                }
                
                actionsHtml += '</div>';

                return '<div class="service-card" onclick="Services.viewService(\'' + service.id + '\')"><div class="service-card-header"><h4 class="service-title">' + Inventory.escapeHtml(service.title) + '</h4><span class="service-status-badge ' + service.status + '">' + statusLabel + '</span></div><div class="service-meta">' + (service.client ? '<span>' + Inventory.escapeHtml(service.client) + '</span>' : '') + '<span class="service-priority ' + service.priority + '">' + priorityLabel + '</span><span>' + date + '</span></div><p class="service-description">' + Inventory.escapeHtml(service.description) + '</p>' + actionsHtml + '</div>';
            }).join('');
        }
    }
};

// ==========================================
// DADOS DE EXEMPLO
// ==========================================
const SampleData = {
    load() {
        if (AppState.inventory.length === 0) {
            AppState.inventory = [
                { id: '1', name: 'Mouse USB Logitech', category: 'perifericos', quantity: 15, minStock: 5, location: 'Armário A-01', description: 'Mouse USB com fio, DPI ajustável', createdAt: new Date().toISOString() },
                { id: '2', name: 'Teclado ABNT2', category: 'perifericos', quantity: 8, minStock: 5, location: 'Armário A-02', description: 'Teclado padrão brasileiro com fio', createdAt: new Date().toISOString() },
                { id: '3', name: 'Cabo de Rede CAT6 5m', category: 'cabos', quantity: 25, minStock: 10, location: 'Prateleira B-01', description: 'Cabo de rede azul 5 metros', createdAt: new Date().toISOString() },
                { id: '4', name: 'Memória RAM 8GB DDR4', category: 'hardware', quantity: 3, minStock: 5, location: 'Gaveta C-01', description: 'Memória RAM 8GB 3200MHz', createdAt: new Date().toISOString() }
            ];
        }

        if (AppState.snippets.length === 0) {
            AppState.snippets = [
                { id: '1', title: 'Limpar Cache DNS', category: 'rede', type: 'cmd', tags: 'dns, cache, rede', description: 'Limpa o cache de DNS do Windows', code: 'ipconfig /flushdns', createdAt: new Date().toISOString() },
                { id: '2', title: 'Verificar Integridade do Sistema', category: 'sistema', type: 'cmd', tags: 'sistema, reparo, sfc', description: 'Verifica e repara arquivos do sistema Windows', code: 'sfc /scannow', createdAt: new Date().toISOString() },
                { id: '3', title: 'Listar Processos', category: 'sistema', type: 'powershell', tags: 'processos, sistema', description: 'Lista processos em execução ordenados por memória', code: 'Get-Process | Sort-Object WS -Descending | Select-Object -First 10 Name, Id, WS, CPU', createdAt: new Date().toISOString() },
                { id: '4', title: 'Resetar Configurações de Rede', category: 'rede', type: 'batch', tags: 'rede, reset, tcp', description: 'Script para resetar configurações de rede', code: '@echo off\nipconfig /release\nipconfig /renew\nipconfig /flushdns\nnetsh winsock reset\nnetsh int ip reset\necho Concluido!\npause', createdAt: new Date().toISOString() },
                { id: '5', title: 'Verificar Espaço em Disco', category: 'sistema', type: 'cmd', tags: 'disco, espaço', description: 'Mostra espaço disponível em disco', code: 'wmic logicaldisk get size,freespace,caption', createdAt: new Date().toISOString() },
                { id: '6', title: 'Liberar IP', category: 'rede', type: 'cmd', tags: 'ip, rede, dhcp', description: 'Libera e renova endereço IP', code: 'ipconfig /release\nipconfig /renew', createdAt: new Date().toISOString() },
                { id: '7', title: 'Verificar Drivers de Impressora', category: 'impressora', type: 'powershell', tags: 'impressora, driver', description: 'Lista drivers de impressora instalados', code: 'Get-PrinterDriver | Select-Object Name, Manufacturer, Version', createdAt: new Date().toISOString() },
                { id: '8', title: 'Limpar Fila de Impressão', category: 'impressora', type: 'batch', tags: 'impressora, fila, spooler', description: 'Para e reinicia o spooler de impressão', code: 'net stop spooler\ndel /Q /F %systemroot%\\System32\\spool\\printers\\*\nnet start spooler\necho Fila de impressao limpa!\npause', createdAt: new Date().toISOString() },
                { id: '9', title: 'Testar Conexão de Rede', category: 'rede', type: 'cmd', tags: 'rede, ping, teste', description: 'Testa conectividade de rede', code: 'ping 8.8.8.8 -n 4\nping google.com -n 4', createdAt: new Date().toISOString() },
                { id: '10', title: 'Verificar Temperatura do Sistema', category: 'sistema', type: 'powershell', tags: 'temperatura, hardware', description: 'Verifica temperatura do processador', code: 'Get-WmiObject MSAcpi_ThermalZoneTemperature -Namespace "root/wmi" | ForEach-Object { $temp = ($_.CurrentTemperature - 2732) / 10; Write-Host "Temperatura: $temp °C" }', createdAt: new Date().toISOString() },
                { id: '11', title: 'Configurar Impressora Padrão', category: 'impressora', type: 'powershell', tags: 'impressora, padrao', description: 'Define impressora como padrão', code: 'Get-Printer -Name "Nome da Impressora" | Set-Printer -Shared $true', createdAt: new Date().toISOString() },
                { id: '12', title: 'Verificar Portas de Rede', category: 'rede', type: 'cmd', tags: 'portas, rede, netstat', description: 'Lista portas de rede abertas', code: 'netstat -an | findstr LISTENING', createdAt: new Date().toISOString() },
                { id: '13', title: 'Reparar Imagem do Windows', category: 'sistema', type: 'cmd', tags: 'sistema, dism, reparo', description: 'Repara imagem do Windows usando DISM', code: 'DISM /Online /Cleanup-Image /RestoreHealth', createdAt: new Date().toISOString() },
                { id: '14', title: 'Listar Serviços do Windows', category: 'sistema', type: 'cmd', tags: 'servicos, sistema', description: 'Lista todos os serviços do Windows', code: 'sc query type= service state= all', createdAt: new Date().toISOString() },
                { id: '15', title: 'Verificar Ativação do Windows', category: 'sistema', type: 'cmd', tags: 'ativacao, windows, licença', description: 'Verifica status de ativação do Windows', code: 'slmgr /xpr', createdAt: new Date().toISOString() },
                { id: '16', title: 'Reiniciar Spooler de Impressão', category: 'impressora', type: 'cmd', tags: 'impressora, spooler, reiniciar', description: 'Reinicia o serviço de spooler', code: 'net stop spooler\nnet start spooler', createdAt: new Date().toISOString() },
                { id: '17', title: 'Listar Impressoras Instaladas', category: 'impressora', type: 'cmd', tags: 'impressora, listar', description: 'Lista todas as impressoras instaladas', code: 'wmic printer get name,portname', createdAt: new Date().toISOString() },
                { id: '18', title: 'Testar Porta de Impressora', category: 'impressora', type: 'powershell', tags: 'impressora, porta, teste', description: 'Testa conectividade com porta de impressora', code: 'Test-NetConnection -ComputerName 192.168.1.100 -Port 9100', createdAt: new Date().toISOString() },
                { id: '19', title: 'Verificar Tabela de Roteamento', category: 'rede', type: 'cmd', tags: 'rede, rota, tabela', description: 'Mostra tabela de roteamento do Windows', code: 'route print', createdAt: new Date().toISOString() },
                { id: '20', title: 'Liberar e Renovar IP Completo', category: 'rede', type: 'batch', tags: 'ip, dhcp, rede', description: 'Script completo para renovar IP', code: '@echo off\necho Liberando IP...\nipconfig /release\necho Renovando IP...\nipconfig /renew\necho Limpando DNS...\nipconfig /flushdns\necho Concluido!\npause', createdAt: new Date().toISOString() },
                { id: '21', title: 'Verificar Adaptadores de Rede', category: 'rede', type: 'cmd', tags: 'rede, adaptador, placa', description: 'Mostra todas as interfaces de rede', code: 'ipconfig /all', createdAt: new Date().toISOString() },
                { id: '22', title: 'Limpar Arquivos Temporários', category: 'sistema', type: 'batch', tags: 'limpeza, temporario, disco', description: 'Limpa arquivos temporários do sistema', code: '@echo off\ndel /q /f %temp%\\*\nrd /s /q %temp%\necho Arquivos temporarios limpos!\npause', createdAt: new Date().toISOString() },
                { id: '23', title: 'Verificar Uso de Disco', category: 'sistema', type: 'powershell', tags: 'disco, uso, armazenamento', description: 'Mostra uso de espaço em disco', code: 'Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="Free(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}', createdAt: new Date().toISOString() },
                { id: '24', title: 'Resetar Pilha TCP/IP', category: 'rede', type: 'cmd', tags: 'rede, tcp/ip, reset', description: 'Reseta configurações TCP/IP', code: 'netsh int ip reset\nnetsh winsock reset', createdAt: new Date().toISOString() },
                { id: '25', title: 'Verificar Eventos de Erro', category: 'sistema', type: 'powershell', tags: 'evento, erro, log', description: 'Lista últimos erros do sistema', code: 'Get-EventLog -LogName System -EntryType Error -Newest 10 | Format-Table TimeGenerated, Source, Message -AutoSize', createdAt: new Date().toISOString() },
                { id: '26', title: 'Testar Velocidade de Rede', category: 'rede', type: 'powershell', tags: 'rede, velocidade, teste', description: 'Testa latência de rede', code: 'Measure-Command { ping -n 10 8.8.8.8 }', createdAt: new Date().toISOString() },
                { id: '27', title: 'Remover Impressora por Nome', category: 'impressora', type: 'powershell', tags: 'impressora, remover, excluir', description: 'Remove impressora específica', code: 'Remove-Printer -Name "Nome da Impressora"', createdAt: new Date().toISOString() },
                { id: '28', title: 'Verificar Memória RAM', category: 'sistema', type: 'cmd', tags: 'memoria, ram, hardware', description: 'Mostra informações da memória RAM', code: 'wmic memorychip get capacity,speed,manufacturer', createdAt: new Date().toISOString() },
                { id: '29', title: 'Mapear Unidade de Rede', category: 'rede', type: 'cmd', tags: 'rede, mapear, unidade', description: 'Mapeia pasta de rede como unidade', code: 'net use Z: \\\\servidor\\pasta /persistent:yes', createdAt: new Date().toISOString() },
                { id: '30', title: 'Verificar Saúde do Disco', category: 'sistema', type: 'powershell', tags: 'disco, saude, smart', description: 'Verifica saúde do disco via SMART', code: 'Get-PhysicalDisk | Select-Object FriendlyName, HealthStatus, OperationalStatus', createdAt: new Date().toISOString() }
            ];
        }

        if (AppState.services.length === 0) {
            AppState.services = [
                { id: '1', title: 'Manutenção Preventiva - PC Financeiro', status: 'completed', client: 'Setor Financeiro', priority: 'media', date: new Date().toISOString().split('T')[0], description: 'Realizar manutenção preventiva no computador do setor financeiro, incluindo limpeza física e lógica.', report: 'Limpeza física realizada com sucesso. Troca de pasta térmica. Sistema operacional atualizado. Backup realizado.', createdAt: new Date().toISOString(), completedAt: new Date().toISOString() },
                { id: '2', title: 'Instalação de Impressora de Rede', status: 'pending', client: 'Recursos Humanos', priority: 'alta', date: new Date().toISOString().split('T')[0], description: 'Instalar e configurar impressora de rede no setor de RH.', report: '', createdAt: new Date().toISOString() }
            ];
        }

        StorageManager.save();
    }
};

// ==========================================
// NAVEGAÇÃO
// ==========================================
const Navigation = {
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = item.dataset.tab;
                this.switchTab(tabId);
            });
        });

        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                Modal.close(btn.dataset.close);
            });
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    Modal.closeAll();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Modal.closeAll();
            }
        });
    },

    switchTab(tabId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = document.getElementById(tabId + '-tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }

        switch (tabId) {
            case 'dashboard':
                Dashboard.update();
                ActivityLogger.renderInventory();
                ActivityLogger.renderServices();
                break;
            case 'inventory':
                Inventory.render();
                break;
            case 'snippets':
                Snippets.render();
                break;
            case 'services':
                Services.render();
                break;
        }
    }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema de login
    LoginManager.init();
});