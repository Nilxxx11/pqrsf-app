// REEMPLAZAR/AGREGAR al inicio de admin.js:

// Sistema de notificaciones internas
const notificationSystem = {
    notifications: [],
    isPanelOpen: false,

    init: function() {
        // Cargar notificaciones guardadas
        this.loadFromStorage();

        // Escuchar nuevos reportes
        database.ref('pqrs_reports').on('child_added', (snapshot) => {
            const report = snapshot.val();
            this.addNotification({
                type: 'new_report',
                title: '📋 Nuevo Reporte',
                message: `Se ha creado un nuevo ${report.tipo_reporte} de ${report.cliente}`,
                reportId: snapshot.key,
                timestamp: new Date().toISOString(),
                icon: 'fa-file-alt',
                color: '#3b82f6'
            });
        });

        // Escuchar cambios de estado
        database.ref('pqrs_reports').on('child_changed', (snapshot) => {
            const newData = snapshot.val();
            const oldData = snapshot.previous.val();

            if (newData.estado !== oldData?.estado) {
                this.addNotification({
                    type: 'status_change',
                    title: '🔄 Estado Actualizado',
                    message: `Reporte ${snapshot.key.substring(0, 8)}: ${oldData?.estado} → ${newData.estado}`,
                    reportId: snapshot.key,
                    timestamp: new Date().toISOString(),
                    icon: 'fa-exchange-alt',
                    color: '#10b981'
                });
            }
        });
    },

    addNotification: function(notification) {
        notification.id = Date.now();
        notification.read = false;

        this.notifications.unshift(notification);

        // Mantener máximo 50
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }

        this.saveToStorage();
        this.updateBadge();

        // Mostrar toast si el panel no está abierto
        if (!this.isPanelOpen) {
            this.showToast(notification);
        }
    },

    showToast: function(notification) {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon" style="background: ${notification.color}20; color: ${notification.color}">
                <i class="fas ${notification.icon}"></i>
            </div>
            <div class="toast-content">
                <strong>${notification.title}</strong>
                <p>${notification.message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(toast);

        // Animación
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-remover
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    updateBadge: function() {
        const unread = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationCount');

        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? 'inline-block' : 'none';
        }
    },

    loadFromStorage: function() {
        const saved = localStorage.getItem('pqrs_notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
            this.updateBadge();
        }
    },

    saveToStorage: function() {
        localStorage.setItem('pqrs_notifications', JSON.stringify(this.notifications));
    },

    markAllAsRead: function() {
        this.notifications.forEach(n => n.read = true);
        this.saveToStorage();
        this.updateBadge();
        this.renderList();
    },

    clearAll: function() {
        this.notifications = [];
        this.saveToStorage();
        this.updateBadge();
        this.renderList();
    },

    renderList: function() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay notificaciones</p>
                </div>
            `;
            return;
        }

        const html = this.notifications.map(notif => `
            <div class="notification-item ${notif.read ? '' : 'unread'}"
                 onclick="notificationSystem.openNotification('${notif.id}')">
                <div class="notification-content">
                    <div class="notification-icon" style="background: ${notif.color}20; color: ${notif.color}">
                        <i class="fas ${notif.icon}"></i>
                    </div>
                    <div class="notification-text">
                        <h4>${notif.title}</h4>
                        <p>${notif.message}</p>
                        <div class="notification-time">
                            ${this.formatTimeAgo(notif.timestamp)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    openNotification: function(notificationId) {
        const notif = this.notifications.find(n => n.id == notificationId);
        if (!notif) return;

        notif.read = true;
        this.saveToStorage();
        this.updateBadge();
        this.renderList();

        // Si es de un reporte, abrir detalles
        if (notif.reportId) {
            viewReportDetails(notif.reportId);
            this.togglePanel();
        }
    },

    togglePanel: function() {
        const panel = document.getElementById('notificationsPanel');
        this.isPanelOpen = !this.isPanelOpen;

        if (this.isPanelOpen) {
            panel.classList.add('show');
            this.renderList();
            this.markAllAsRead();
        } else {
            panel.classList.remove('show');
        }
    },

    formatTimeAgo: function(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;

        return date.toLocaleDateString('es-CO', {
            month: 'short',
            day: 'numeric'
        });
    }
};

// Inicializar cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    notificationSystem.init();
});

// ================================
// CONFIGURACIÓN Y CONSTANTES
// ================================

const CONFIG = {
    ADMIN_EMAIL: 'admin@transportehb.com.co',
    ADMIN_PASSWORD: 'AdminHB2026',
    ITEMS_PER_PAGE: 20,
    MAX_EXPORT_ROWS: 1000
};

const ESTADOS = ['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'];

const TIPOS_REPORTE = [
    'Queja', 'Petición', 'Reclamo', 'Felicitaciones', 'Sugerencia'
];

const CLIENTES = [
    'Argos', 'Ecopetrol', 'Puerto Bahía', 'Contecar', 'Italco',
    'Americas', 'Hotel Hilton', 'Cementos País', 'Ajover', 'Cimaco',
    'Proelectrica', 'Axalta', 'Counques'
];

// ================================
// VARIABLES GLOBALES
// ================================

let currentUser = null;
let reportsData = [];
let filteredReports = [];
let currentPage = 1;
let totalPages = 1;
let activeFilters = {};
let currentReportId = null;
let notifications = [];

// ================================
// INICIALIZACIÓN
// ================================

document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    setupEventListeners();
    loadNotifications();

    // Inicializar gráficas cuando sea necesario
    initializeChartsOnDemand();
});

function checkAuthState() {
    auth.onAuthStateChanged(function(user) {
        if (user && user.email === CONFIG.ADMIN_EMAIL) {
            currentUser = user;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminInterface').style.display = 'block';
            document.getElementById('adminUser').textContent = user.email;
            initializeAdminPanel();
        } else {
            currentUser = null;
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('adminInterface').style.display = 'none';
        }
    });
}

function setupEventListeners() {
    // Filtros
    document.getElementById('filterTipo')?.addEventListener('change', updateFilters);
    document.getElementById('filterCliente')?.addEventListener('change', updateFilters);
    document.getElementById('filterEstado')?.addEventListener('change', updateFilters);
    document.getElementById('filterFechaDesde')?.addEventListener('change', updateFilters);
    document.getElementById('filterFechaHasta')?.addEventListener('change', updateFilters);
    document.getElementById('filterTexto')?.addEventListener('input', debounce(updateFilters, 300));

    // Export options
    document.querySelectorAll('input[name="exportType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const rangeOptions = document.getElementById('exportRangeOptions');
            if (this.value === 'range') {
                rangeOptions.style.display = 'block';
            } else {
                rangeOptions.style.display = 'none';
            }
        });
    });

    // Modal clicks
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
                closeStatusModal();
                closeCommentModal();
                closeExportModal();
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl + F = Focus search
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            document.getElementById('filterTexto')?.focus();
        }

        // Ctrl + R = Refresh
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            loadReports();
        }

        // Escape = Close modals
        if (event.key === 'Escape') {
            closeModal();
            closeStatusModal();
            closeCommentModal();
            closeExportModal();
        }
    });
}

function initializeAdminPanel() {
    loadReports();
    setupRealtimeUpdates();
    updateDashboardStats();
    setInterval(updateDashboardStats, 60000); // Actualizar cada minuto
}

// ================================
// AUTENTICACIÓN
// ================================

async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');

    if (!email || !password) {
        errorElement.textContent = 'Por favor complete todos los campos';
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;

        // Registrar acceso en auditoría
        await firebaseUtils.logAuditAction('admin_login', {
            email: email,
            timestamp: new Date().toISOString()
        }, currentUser.uid);

        errorElement.textContent = '';
        console.log('✅ Login exitoso');

    } catch (error) {
        console.error('Error en login:', error);
        errorElement.textContent = getLoginErrorMessage(error);
    }
}

function getLoginErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Correo electrónico inválido';
        case 'auth/user-disabled':
            return 'Usuario deshabilitado';
        case 'auth/user-not-found':
            return 'Usuario no encontrado';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Intente más tarde';
        default:
            return 'Error de autenticación';
    }
}

async function logout() {
    try {
        // Registrar logout en auditoría
        if (currentUser) {
            await firebaseUtils.logAuditAction('admin_logout', {
                timestamp: new Date().toISOString()
            }, currentUser.uid);
        }

        await auth.signOut();
        currentUser = null;
        console.log('✅ Logout exitoso');
    } catch (error) {
        console.error('Error en logout:', error);
    }
}

// ================================
// CARGA Y GESTIÓN DE REPORTES
// ================================

async function loadReports(filters = activeFilters) {
    showLoading(true);

    try {
        let ref = database.ref('pqrs_reports');

        const snapshot = await ref.once('value');
        reportsData = [];

        snapshot.forEach((childSnapshot) => {
            const report = childSnapshot.val();
            report.id = childSnapshot.key;
            reportsData.push(report);
        });

        // Ordenar por fecha más reciente primero
        reportsData.sort((a, b) => {
            return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
        });

        // Aplicar filtros
        filteredReports = applyFiltersToData(reportsData, filters);

        // Actualizar paginación
        updatePagination();

        // Renderizar tabla
        renderReportsTable();

        // Actualizar dashboard
        updateDashboardStats();

        console.log(`✅ ${filteredReports.length} reportes cargados`);

    } catch (error) {
        console.error('Error cargando reportes:', error);
        showNotification('Error cargando reportes', 'error');
    } finally {
        showLoading(false);
    }
}

function applyFiltersToData(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
        return data;
    }

    return data.filter(report => {
        // Filtro por tipo
        if (filters.tipos && filters.tipos.length > 0) {
            if (!filters.tipos.includes(report.tipo_reporte)) {
                return false;
            }
        }

        // Filtro por cliente
        if (filters.clientes && filters.clientes.length > 0) {
            if (!filters.clientes.includes(report.cliente)) {
                return false;
            }
        }

        // Filtro por estado
        if (filters.estados && filters.estados.length > 0) {
            if (!filters.estados.includes(report.estado)) {
                return false;
            }
        }

        // Filtro por fecha
        if (filters.fechaDesde) {
            const reportDate = new Date(report.fecha_reporte);
            const desde = new Date(filters.fechaDesde);
            if (reportDate < desde) {
                return false;
            }
        }

        if (filters.fechaHasta) {
            const reportDate = new Date(report.fecha_reporte);
            const hasta = new Date(filters.fechaHasta);
            hasta.setHours(23, 59, 59, 999);
            if (reportDate > hasta) {
                return false;
            }
        }

        // Filtro por texto
        if (filters.texto && filters.texto.trim() !== '') {
            const searchText = filters.texto.toLowerCase();
            const searchFields = [
                report.nombre_reportante,
                report.correo_reportante,
                report.placa_vehiculo,
                report.nombre_conductor,
                report.descripcion,
                report.mensaje
            ];

            const matches = searchFields.some(field =>
                field && field.toLowerCase().includes(searchText)
            );

            if (!matches) {
                return false;
            }
        }

        return true;
    });
}

function updateFilters() {
    const filters = {
        tipos: getSelectedValues('filterTipo'),
        clientes: getSelectedValues('filterCliente'),
        estados: getSelectedValues('filterEstado'),
        fechaDesde: document.getElementById('filterFechaDesde')?.value || '',
        fechaHasta: document.getElementById('filterFechaHasta')?.value || '',
        texto: document.getElementById('filterTexto')?.value || ''
    };

    activeFilters = filters;
    currentPage = 1;
    loadReports(filters);
}

function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];

    return Array.from(select.selectedOptions).map(option => option.value);
}

function applyFilters() {
    updateFilters();
}

function resetFilters() {
    // Limpiar selects múltiples
    ['filterTipo', 'filterCliente', 'filterEstado'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            Array.from(select.options).forEach(option => {
                option.selected = false;
            });
        }
    });

    // Limpiar otros campos
    document.getElementById('filterFechaDesde').value = '';
    document.getElementById('filterFechaHasta').value = '';
    document.getElementById('filterTexto').value = '';

    activeFilters = {};
    currentPage = 1;
    loadReports();
}

// ================================
// RENDERIZADO DE TABLA
// ================================

function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    if (!tbody) return;

    // Calcular índices para paginación
    const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const endIndex = startIndex + CONFIG.ITEMS_PER_PAGE;
    const pageReports = filteredReports.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (pageReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <div>
                        <h4>No hay reportes</h4>
                        <p>${filteredReports.length === 0 ? 'No se encontraron reportes' : 'Intente cambiar los filtros'}</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    pageReports.forEach((report, index) => {
        const row = document.createElement('tr');
        row.innerHTML = generateReportRowHTML(report, startIndex + index + 1);
        tbody.appendChild(row);
    });

    // Actualizar información de paginación
    updateTableInfo();
}

function generateReportRowHTML(report, index) {
    const fecha = formatDateForTable(report.fecha_reporte);
    const estadoBadge = getEstadoBadge(report.estado);
    const tipoBadge = getTipoBadge(report.tipo_reporte);

    return `
        <td>${report.id.substring(0, 8)}</td>
        <td>${tipoBadge}</td>
        <td>${report.cliente}</td>
        <td>
            <div class="reportante-info">
                <strong>${report.nombre_reportante}</strong>
                <small>${report.correo_reportante}</small>
            </div>
        </td>
        <td>${fecha}</td>
        <td>${estadoBadge}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-view" onclick="viewReportDetails('${report.id}')"
                        title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-edit" onclick="openStatusModal('${report.id}')"
                        title="Cambiar estado">
                    <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="btn-comment" onclick="openCommentModal('${report.id}')"
                        title="Agregar comentario">
                    <i class="fas fa-comment-medical"></i>
                </button>
                ${report.estado !== 'Cerrado' ? `
                <button class="btn-delete" onclick="closeReport('${report.id}')"
                        title="Cerrar reporte">
                    <i class="fas fa-lock"></i>
                </button>
                ` : ''}
            </div>
        </td>
    `;
}

function formatDateForTable(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return `<span class="date-today">Hoy</span>`;
    } else if (date.toDateString() === yesterday.toDateString()) {
        return `<span class="date-yesterday">Ayer</span>`;
    }

    return date.toLocaleDateString('es-CO', {
        month: 'short',
        day: 'numeric'
    });
}

function getEstadoBadge(estado) {
    const estados = {
        'Pendiente': 'status-pendiente',
        'En proceso': 'status-proceso',
        'Resuelto': 'status-resuelto',
        'Cerrado': 'status-cerrado'
    };

    return `<span class="status-badge ${estados[estado] || ''}">${estado}</span>`;
}

function getTipoBadge(tipo) {
    const tipos = {
        'Queja': 'badge-queja',
        'Reclamo': 'badge-reclamo',
        'Petición': 'badge-peticion',
        'Felicitaciones': 'badge-felicitacion',
        'Sugerencia': 'badge-sugerencia'
    };

    return `<span class="type-badge ${tipos[tipo] || ''}">${tipo}</span>`;
}

// ================================
// PAGINACIÓN
// ================================

function updatePagination() {
    totalPages = Math.ceil(filteredReports.length / CONFIG.ITEMS_PER_PAGE);

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    if (pageInfo) {
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

function changePage(direction) {
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderReportsTable();
        updatePagination();

        // Scroll a la parte superior de la tabla
        document.querySelector('.reports-section').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function updateTableInfo() {
    const startIndex = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * CONFIG.ITEMS_PER_PAGE, filteredReports.length);
    const total = filteredReports.length;

    const element = document.getElementById('tableCount');
    if (element) {
        element.textContent = `Mostrando ${startIndex}-${endIndex} de ${total} reportes`;
    }
}

// ================================
// MODALES Y DETALLES
// ================================

async function viewReportDetails(reportId) {
    showLoading(true);
    currentReportId = reportId;

    try {
        const snapshot = await database.ref(`pqrs_reports/${reportId}`).once('value');
        const report = snapshot.val();

        if (!report) {
            throw new Error('Reporte no encontrado');
        }

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = generateReportDetailsHTML(report, reportId);

        // Mostrar modal
        document.getElementById('detailModal').classList.add('show');

        // Registrar vista en auditoría
        await firebaseUtils.logAuditAction('view_report_details', {
            reportId: reportId,
            tipo: report.tipo_reporte
        }, currentUser.uid);

    } catch (error) {
        console.error('Error cargando detalles:', error);
        showNotification('Error cargando detalles del reporte', 'error');
    } finally {
        showLoading(false);
    }
}

function generateReportDetailsHTML(report, reportId) {
    const fechaCreacion = formatDateTime(report.fecha_creacion);
    const fechaActualizacion = report.fecha_actualizacion ?
        formatDateTime(report.fecha_actualizacion) : 'No actualizado';

    return `
        <div class="report-details">
            <div class="detail-section">
                <h3><i class="fas fa-info-circle"></i> Información General</h3>
                <div class="detail-row">
                    <span class="detail-label">ID:</span>
                    <span class="detail-value"><code>${reportId.substring(0, 8)}</code></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tipo:</span>
                    <span class="detail-value">${getTipoBadge(report.tipo_reporte)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cliente:</span>
                    <span class="detail-value">${report.cliente}</span>
                </div>
                ${report.lugar_hechos ? `
<div class="detail-row">
    <span class="detail-label">Lugar de los hechos:</span>
    <span class="detail-value">${report.lugar_hechos}</span>
</div>
` : ''}

                <div class="detail-row">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">${getEstadoBadge(report.estado)}</span>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-user-circle"></i> Información del Reportante</h3>
                <div class="detail-row">
                    <span class="detail-label">Nombre:</span>
                    <span class="detail-value">${report.nombre_reportante}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Correo:</span>
                    <span class="detail-value">
                        <a href="mailto:${report.correo_reportante}">${report.correo_reportante}</a>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fecha Reporte:</span>
                    <span class="detail-value">${formatDate(report.fecha_reporte)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Mecanismo:</span>
                    <span class="detail-value">
                        ${report.mecanismo_reporte}
                        ${report.otro_mecanismo ? `(${report.otro_mecanismo})` : ''}
                    </span>
                </div>
            </div>

            <div class="detail-section">
                <h3><i class="fas fa-truck"></i> Información del Servicio</h3>
                <div class="detail-row">
                    <span class="detail-label">Placa Vehículo:</span>
                    <span class="detail-value">${report.placa_vehiculo || 'No especificada'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Conductor:</span>
                    <span class="detail-value">${report.nombre_conductor || 'No especificado'}</span>
                </div>
            </div>

            ${generateDetailsContent(report)}

            <div class="detail-section">
                <h3><i class="fas fa-history"></i> Historial</h3>
                <div class="detail-row">
                    <span class="detail-label">Creado:</span>
                    <span class="detail-value">${fechaCreacion}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Última Actualización:</span>
                    <span class="detail-value">${fechaActualizacion}</span>
                </div>
                ${report.comentarios_internos && report.comentarios_internos.length > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">Comentarios:</span>
                    <div class="detail-value">
                        ${report.comentarios_internos.map(comentario => `
                            <div class="comment-item">
                                <strong>${comentario.usuario || 'Sistema'}</strong>
                                <small>${formatDateTime(comentario.fecha)}</small>
                                <p>${comentario.comentario}</p>
                                ${comentario.prioridad ? `<span class="priority-badge priority-${comentario.prioridad}">${comentario.prioridad}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function generateDetailsContent(report) {
    const tipo = report.tipo_reporte.toLowerCase();

    if (tipo === 'felicitaciones' || tipo === 'sugerencia') {
        return `
            <div class="detail-section">
                <h3><i class="fas ${tipo === 'felicitaciones' ? 'fa-trophy' : 'fa-lightbulb'}"></i> ${report.tipo_reporte}</h3>
                <div class="detail-row full-width">
                    <span class="detail-label">Mensaje:</span>
                    <div class="detail-value message-content">
                        ${report.mensaje || 'No especificado'}
                    </div>
                </div>
            </div>
        `;
    } else if (tipo === 'queja' || tipo === 'reclamo') {
        return `
            <div class="detail-section">
                <h3><i class="fas ${tipo === 'queja' ? 'fa-exclamation-triangle' : 'fa-balance-scale'}"></i> ${report.tipo_reporte}</h3>

                ${report.categoria_conductor && report.categoria_conductor.length > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">Conductor:</span>
                    <div class="detail-value">
                        ${report.categoria_conductor.map(cat =>
                            `<span class="category-tag">${cat}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}

                ${report.categoria_vehiculo && report.categoria_vehiculo.length > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">Vehículo:</span>
                    <div class="detail-value">
                        ${report.categoria_vehiculo.map(cat =>
                            `<span class="category-tag">${cat}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="detail-row full-width">
                    <span class="detail-label">Descripción:</span>
                    <div class="detail-value message-content">
                        ${report.descripcion || 'No especificado'}
                    </div>
                </div>
            </div>
        `;
    } else if (tipo === 'petición') {
        return `
            <div class="detail-section">
                <h3><i class="fas fa-question-circle"></i> Petición</h3>

                ${report.categoria_peticion && report.categoria_peticion.length > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">Tipo:</span>
                    <div class="detail-value">
                        ${report.categoria_peticion.map(cat =>
                            `<span class="category-tag">${cat}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="detail-row full-width">
                    <span class="detail-label">Descripción:</span>
                    <div class="detail-value message-content">
                        ${report.descripcion || 'No especificado'}
                    </div>
                </div>
            </div>
        `;
    }

    return '';
}

function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
    currentReportId = null;
}

// ================================
// GESTIÓN DE ESTADOS
// ================================

function openStatusModal(reportId) {
    currentReportId = reportId;
    document.getElementById('statusReportId').textContent = reportId.substring(0, 8);
    document.getElementById('statusModal').classList.add('show');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('show');
    currentReportId = null;
    document.getElementById('statusComment').value = '';
}

async function updateReportStatus() {
    const newStatus = document.querySelector('input[name="newStatus"]:checked')?.value;
    const comment = document.getElementById('statusComment').value;

    if (!newStatus || !currentReportId) {
        showNotification('Seleccione un estado válido', 'warning');
        return;
    }

    showLoading(true);

    try {
        const updates = {
            estado: newStatus,
            fecha_actualizacion: new Date().toISOString()
        };

        // Agregar comentario si existe
        if (comment.trim()) {
            const commentData = {
                comentario: comment,
                usuario: currentUser.email,
                fecha: new Date().toISOString(),
                tipo: 'cambio_estado'
            };

            await database.ref(`pqrs_reports/${currentReportId}/comentarios_internos`).push(commentData);
        }

        // Actualizar estado
        await database.ref(`pqrs_reports/${currentReportId}`).update(updates);

        enviarCorreo(
  report.correo_reportante,
  `Actualización de su PQRS (${nuevoEstado})`,
  `
Hola ${report.nombre_reportante},

Su PQRS con ID ${report.id} ha sido actualizada.

Nuevo estado: ${nuevoEstado}

Comentario:
${comentario || "Sin comentarios adicionales"}

HB Transporte
`
);


        // Registrar en auditoría
        await firebaseUtils.logAuditAction('update_report_status', {
            reportId: currentReportId,
            oldStatus: 'Desconocido', // Podríamos obtener el estado anterior
            newStatus: newStatus,
            comment: comment
        }, currentUser.uid);

        showNotification('Estado actualizado correctamente', 'success');
        closeStatusModal();
        loadReports();

    } catch (error) {
        console.error('Error actualizando estado:', error);
        showNotification('Error actualizando estado', 'error');
    } finally {
        showLoading(false);
    }
}

async function closeReport(reportId) {
    if (!confirm('¿Está seguro de cerrar este reporte? Esta acción no se puede deshacer.')) {
        return;
    }

    showLoading(true);

    try {
        const updates = {
            estado: 'Cerrado',
            fecha_actualizacion: new Date().toISOString()
        };

        await database.ref(`pqrs_reports/${reportId}`).update(updates);

        // Registrar en auditoría
        await firebaseUtils.logAuditAction('close_report', {
            reportId: reportId
        }, currentUser.uid);

        showNotification('Reporte cerrado correctamente', 'success');
        loadReports();

    } catch (error) {
        console.error('Error cerrando reporte:', error);
        showNotification('Error cerrando reporte', 'error');
    } finally {
        showLoading(false);
    }
}

// ================================
// COMENTARIOS INTERNOS
// ================================

function openCommentModal(reportId) {
    currentReportId = reportId;
    document.getElementById('commentReportId').textContent = reportId.substring(0, 8);
    document.getElementById('commentModal').classList.add('show');
}

function closeCommentModal() {
    document.getElementById('commentModal').classList.remove('show');
    currentReportId = null;
    document.getElementById('internalComment').value = '';
    document.getElementById('commentPriority').value = 'normal';
}

async function saveInternalComment() {
    const comment = document.getElementById('internalComment').value;
    const priority = document.getElementById('commentPriority').value;

    if (!comment.trim()) {
        showNotification('El comentario no puede estar vacío', 'warning');
        return;
    }

    if (!currentReportId) {
        showNotification('No hay un reporte seleccionado', 'error');
        return;
    }

    showLoading(true);

    try {
        const commentData = {
            comentario: comment,
            usuario: currentUser.email,
            fecha: new Date().toISOString(),
            prioridad: priority,
            tipo: 'comentario_interno'
        };

        await database.ref(`pqrs_reports/${currentReportId}/comentarios_internos`).push(commentData);

        // Actualizar fecha de actualización
        await database.ref(`pqrs_reports/${currentReportId}`).update({
            fecha_actualizacion: new Date().toISOString()
        });

        // Registrar en auditoría
        await firebaseUtils.logAuditAction('add_internal_comment', {
            reportId: currentReportId,
            priority: priority
        }, currentUser.uid);

        showNotification('Comentario agregado correctamente', 'success');
        closeCommentModal();

        // Recargar detalles si el modal está abierto
        if (document.getElementById('detailModal').classList.contains('show')) {
            viewReportDetails(currentReportId);
        }

    } catch (error) {
        console.error('Error agregando comentario:', error);
        showNotification('Error agregando comentario', 'error');
    } finally {
        showLoading(false);
    }
}

// ================================
// EXPORTACIÓN DE DATOS
// ================================

function openExportModal() {
    document.getElementById('exportModal').classList.add('show');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('show');
}

async function exportToCSV() {
    openExportModal();
}

async function confirmExport() {
    const exportType = document.querySelector('input[name="exportType"]:checked')?.value;
    const exportFormat = document.querySelector('input[name="exportFormat"]:checked')?.value;

    if (exportType === 'range') {
        const desde = document.getElementById('exportFechaDesde').value;
        const hasta = document.getElementById('exportFechaHasta').value;

        if (!desde || !hasta) {
            showNotification('Seleccione un rango de fechas válido', 'warning');
            return;
        }
    }

    showLoading(true);

    try {
        let dataToExport = [];

        if (exportType === 'current') {
            dataToExport = filteredReports;
        } else if (exportType === 'all') {
            dataToExport = reportsData;
        } else if (exportType === 'range') {
            const desde = document.getElementById('exportFechaDesde').value;
            const hasta = document.getElementById('exportFechaHasta').value;

            dataToExport = reportsData.filter(report => {
                const reportDate = new Date(report.fecha_reporte);
                const desdeDate = new Date(desde);
                const hastaDate = new Date(hasta);
                hastaDate.setHours(23, 59, 59, 999);

                return reportDate >= desdeDate && reportDate <= hastaDate;
            });
        }

        // Limitar cantidad de registros para exportación
        if (dataToExport.length > CONFIG.MAX_EXPORT_ROWS) {
            dataToExport = dataToExport.slice(0, CONFIG.MAX_EXPORT_ROWS);
            showNotification(`Exportando ${CONFIG.MAX_EXPORT_ROWS} registros (máximo permitido)`, 'info');
        }

        if (exportFormat === 'csv') {
            await exportAsCSV(dataToExport);
        } else if (exportFormat === 'excel') {
            await exportAsExcel(dataToExport);
        } else if (exportFormat === 'pdf') {
            await exportAsPDF(dataToExport);
        }

        // Registrar en auditoría
        await firebaseUtils.logAuditAction('export_data', {
            format: exportFormat,
            type: exportType,
            records: dataToExport.length
        }, currentUser.uid);

        closeExportModal();

    } catch (error) {
        console.error('Error exportando datos:', error);
        showNotification('Error exportando datos', 'error');
    } finally {
        showLoading(false);
    }
}

async function exportAsCSV(data) {
    const headers = [
        'ID', 'Tipo', 'Cliente', 'Reportante', 'Correo', 'Fecha Reporte',
        'Placa', 'Conductor', 'Estado', 'Mecanismo', 'Descripción',
        'Fecha Creación', 'Fecha Actualización'
    ];

    const rows = data.map(report => [
        report.id?.substring(0, 8) || '',
        report.tipo_reporte || '',
        report.cliente || '',
        report.nombre_reportante || '',
        report.correo_reportante || '',
        report.fecha_reporte || '',
        report.placa_vehiculo || '',
        report.nombre_conductor || '',
        report.estado || '',
        `${report.mecanismo_reporte} ${report.otro_mecanismo ? `(${report.otro_mecanismo})` : ''}`,
        report.descripcion || report.mensaje || '',
        formatDateTime(report.fecha_creacion),
        report.fecha_actualizacion ? formatDateTime(report.fecha_actualizacion) : ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `pqrs_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Exportados ${data.length} registros a CSV`, 'success');
}

async function exportAsExcel(data) {
    // Implementación básica - en producción usar una librería como SheetJS
    showNotification('Exportación Excel no implementada en esta versión', 'info');
    // Para implementación completa, usar: https://github.com/SheetJS/sheetjs
}

async function exportAsPDF(data) {
    // Implementación básica - en producción usar una librería como jsPDF
    showNotification('Exportación PDF no implementada en esta versión', 'info');
    // Para implementación completa, usar: https://github.com/parallax/jsPDF
}

// ================================
// ESTADÍSTICAS Y GRÁFICOS
// ================================
// ================================
// GRÁFICAS - FUNCIONES CORREGIDAS
// ================================

let charts = {
    tipo: null,
    estado: null,
    cliente: null
};

function initializeCharts() {
    console.log('📊 Inicializando gráficas...');

    // Destruir gráficas existentes si las hay
    destroyCharts();

    // Configuración común para todas las gráficas
    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            }
        }
    };

    // Gráfico de tipos (PIE)
    const tipoCanvas = document.getElementById('chartTipo');
    if (tipoCanvas) {
        const tipoCtx = tipoCanvas.getContext('2d');
        charts.tipo = new Chart(tipoCtx, {
            type: 'pie',
            data: {
                labels: ['Queja', 'Petición', 'Reclamo', 'Felicitaciones', 'Sugerencia'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#ef4444', // Rojo para quejas
                        '#3b82f6', // Azul para peticiones
                        '#f59e0b', // Naranja para reclamos
                        '#10b981', // Verde para felicitaciones
                        '#8b5cf6'  // Violeta para sugerencias
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...chartConfig,
                plugins: {
                    ...chartConfig.plugins,
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        console.error('❌ No se encontró el canvas para gráfico de tipos');
    }

    // Gráfico de estados (BAR)
    const estadoCanvas = document.getElementById('chartEstado');
    if (estadoCanvas) {
        const estadoCtx = estadoCanvas.getContext('2d');
        charts.estado = new Chart(estadoCtx, {
            type: 'bar',
            data: {
                labels: ['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'],
                datasets: [{
                    label: 'Cantidad de Reportes',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#f59e0b', // Pendiente - Naranja
                        '#3b82f6', // En proceso - Azul
                        '#10b981', // Resuelto - Verde
                        '#6b7280'  // Cerrado - Gris
                    ],
                    borderWidth: 1,
                    borderColor: '#e5e7eb'
                }]
            },
            options: {
                ...chartConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: '#e5e7eb'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    ...chartConfig.plugins,
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.error('❌ No se encontró el canvas para gráfico de estados');
    }

    // Gráfico de clientes (HORIZONTAL BAR)
    const clienteCanvas = document.getElementById('chartCliente');
    if (clienteCanvas) {
        const clienteCtx = clienteCanvas.getContext('2d');
        charts.cliente = new Chart(clienteCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Reportes',
                    data: [],
                    backgroundColor: '#0d9488',
                    borderWidth: 1,
                    borderColor: '#0d9488'
                }]
            },
            options: {
                ...chartConfig,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: '#e5e7eb'
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    ...chartConfig.plugins,
                    legend: {
                        display: false
                    }
                }
            }
        });
    } else {
        console.error('❌ No se encontró el canvas para gráfico de clientes');
    }

    console.log('✅ Gráficas inicializadas');
}

function destroyCharts() {
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
            charts[key] = null;
        }
    });
}

function updateStatistics() {
    console.log('📈 Actualizando estadísticas...');

    if (!reportsData || reportsData.length === 0) {
        console.log('ℹ️ No hay datos para mostrar en gráficas');
        showEmptyCharts();
        updatePerformanceMetrics([]);
        return;
    }

    // Estadísticas por tipo
    const tipoStats = {
        'Queja': 0,
        'Petición': 0,
        'Reclamo': 0,
        'Felicitaciones': 0,
        'Sugerencia': 0
    };

    reportsData.forEach(report => {
        if (tipoStats.hasOwnProperty(report.tipo_reporte)) {
            tipoStats[report.tipo_reporte]++;
        }
    });

    // Actualizar gráfico de tipos
    if (charts.tipo) {
        charts.tipo.data.datasets[0].data = [
            tipoStats['Queja'],
            tipoStats['Petición'],
            tipoStats['Reclamo'],
            tipoStats['Felicitaciones'],
            tipoStats['Sugerencia']
        ];
        charts.tipo.update('none');
    }

    // Estadísticas por estado
    const estadoStats = {
        'Pendiente': 0,
        'En proceso': 0,
        'Resuelto': 0,
        'Cerrado': 0
    };

    reportsData.forEach(report => {
        if (estadoStats.hasOwnProperty(report.estado)) {
            estadoStats[report.estado]++;
        }
    });

    // Actualizar gráfico de estados
    if (charts.estado) {
        charts.estado.data.datasets[0].data = [
            estadoStats['Pendiente'],
            estadoStats['En proceso'],
            estadoStats['Resuelto'],
            estadoStats['Cerrado']
        ];
        charts.estado.update('none');
    }

    // Estadísticas por cliente
    const clienteStats = {};
    reportsData.forEach(report => {
        if (report.cliente) {
            clienteStats[report.cliente] = (clienteStats[report.cliente] || 0) + 1;
        }
    });

    // Ordenar clientes por cantidad (descendente)
    const topClientes = Object.entries(clienteStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Actualizar gráfico de clientes
    if (charts.cliente) {
        if (topClientes.length > 0) {
            charts.cliente.data.labels = topClientes.map(c => c[0]);
            charts.cliente.data.datasets[0].data = topClientes.map(c => c[1]);
            charts.cliente.data.datasets[0].backgroundColor = generateColorGradient(
                '#0d9488',
                topClientes.length
            );
        } else {
            charts.cliente.data.labels = ['Sin datos'];
            charts.cliente.data.datasets[0].data = [0];
        }
        charts.cliente.update('none');
    }

    // Actualizar métricas de rendimiento
    updatePerformanceMetrics(reportsData);

    // Actualizar tabla de resumen mensual
    updateMonthlyStatsTable();

    console.log('✅ Estadísticas actualizadas');
}

function updatePerformanceMetrics(data) {
    if (!data || data.length === 0) {
        document.getElementById('avgResponseTime').textContent = '0 días';
        document.getElementById('resolutionRate').textContent = '0%';
        document.getElementById('activeClients').textContent = '0';
        return;
    }

    // Calcular tiempo promedio de respuesta
    const resolvedReports = data.filter(r => r.estado === 'Resuelto' && r.fecha_creacion && r.fecha_actualizacion);
    let totalDays = 0;

    resolvedReports.forEach(report => {
        const start = new Date(report.fecha_creacion);
        const end = new Date(report.fecha_actualizacion);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        totalDays += days;
    });

    const avgDays = resolvedReports.length > 0 ? Math.round(totalDays / resolvedReports.length) : 0;
    document.getElementById('avgResponseTime').textContent = `${avgDays} días`;

    // Calcular tasa de resolución
    const totalReports = data.length;
    const resolvedCount = data.filter(r => r.estado === 'Resuelto' || r.estado === 'Cerrado').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0;
    document.getElementById('resolutionRate').textContent = `${resolutionRate}%`;

    // Calcular clientes activos (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeClients = new Set();
    data.forEach(report => {
        const reportDate = new Date(report.fecha_creacion);
        if (reportDate >= thirtyDaysAgo && report.cliente) {
            activeClients.add(report.cliente);
        }
    });

    document.getElementById('activeClients').textContent = activeClients.size;
}

function showEmptyCharts() {
    // Mostrar mensaje de datos vacíos en gráficos
    if (charts.tipo) {
        charts.tipo.data.datasets[0].data = [1];
        charts.tipo.data.labels = ['Sin datos'];
        charts.tipo.data.datasets[0].backgroundColor = ['#e5e7eb'];
        charts.tipo.update('none');
    }

    if (charts.estado) {
        charts.estado.data.datasets[0].data = [0, 0, 0, 0];
        charts.estado.update('none');
    }

    if (charts.cliente) {
        charts.cliente.data.labels = ['Sin datos'];
        charts.cliente.data.datasets[0].data = [0];
        charts.cliente.update('none');
    }
}

function generateColorGradient(baseColor, count) {
    // Generar gradiente de colores para el gráfico de clientes
    const colors = [];
    const base = hexToRgb(baseColor);

    for (let i = 0; i < count; i++) {
        const factor = 1 - (i * 0.15);
        const r = Math.round(base.r * factor);
        const g = Math.round(base.g * factor);
        const b = Math.round(base.b * factor);
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colors;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function toggleStats() {
    const statsSection = document.getElementById('statsSection');
    const statsBtn = document.querySelector('.btn-stats');

    if (statsSection.style.display === 'none' || !statsSection.style.display) {
        statsSection.style.display = 'block';

        // Asegurarse de que las gráficas estén inicializadas
        if (!charts.tipo || !charts.estado || !charts.cliente) {
            initializeCharts();
        }

        // Actualizar estadísticas con datos actuales
        updateStatistics();

        // Forzar redimensionamiento
        setTimeout(() => {
            Object.keys(charts).forEach(key => {
                if (charts[key]) {
                    charts[key].resize();
                }
            });
        }, 100);

        if (statsBtn) {
            statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Ocultar Estadísticas';
        }
    } else {
        statsSection.style.display = 'none';
        if (statsBtn) {
            statsBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Estadísticas';
        }
    }
}

// ================================
// MODIFICAR LA FUNCIÓN loadReports
// ================================

// En la función loadReports, AGREGAR esto al final:
async function loadReports(filters = activeFilters) {
    showLoading(true);

    try {
        // ... (código existente de loadReports) ...

        // DESPUÉS de cargar los datos, agregar esto:
        updateDashboardStats();

        // Si la sección de estadísticas está visible, actualizar gráficas
        const statsSection = document.getElementById('statsSection');
        if (statsSection && statsSection.style.display === 'block') {
            updateStatistics();
        }

    } catch (error) {
        console.error('Error cargando reportes:', error);
        showNotification('Error cargando reportes', 'error');
    } finally {
        showLoading(false);
    }
}

function initializeChartsOnDemand() {
    // Observar cuando se muestre la sección de estadísticas
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const statsSection = document.getElementById('statsSection');
                if (statsSection.style.display === 'block') {
                    if (!charts.tipo) {
                        initializeCharts();
                        updateStatistics();
                    }
                }
            }
        });
    });

    const statsSection = document.getElementById('statsSection');
    if (statsSection) {
        observer.observe(statsSection, { attributes: true });
    }
}

// ================================
// ACTUALIZACIÓN DEL DASHBOARD
// ================================

function updateDashboardStats() {
    if (!reportsData || reportsData.length === 0) {
        // Mostrar ceros si no hay datos
        document.getElementById('totalReports').textContent = '0';
        document.getElementById('pendingReports').textContent = '0';
        document.getElementById('processReports').textContent = '0';
        document.getElementById('resolvedReports').textContent = '0';
        document.getElementById('complaintReports').textContent = '0';
        document.getElementById('suggestionReports').textContent = '0';
        return;
    }

    // Totales
    document.getElementById('totalReports').textContent = reportsData.length;
    document.getElementById('pendingReports').textContent =
        reportsData.filter(r => r.estado === 'Pendiente').length;
    document.getElementById('processReports').textContent =
        reportsData.filter(r => r.estado === 'En proceso').length;
    document.getElementById('resolvedReports').textContent =
        reportsData.filter(r => r.estado === 'Resuelto').length;
    document.getElementById('complaintReports').textContent =
        reportsData.filter(r => r.tipo_reporte === 'Queja').length;
    document.getElementById('suggestionReports').textContent =
        reportsData.filter(r => r.tipo_reporte === 'Sugerencia').length;
}

// ================================
// ACTUALIZAR LOAD REPORTS
// ================================

// En la función loadReports, agregar al final:
async function loadReports(filters = activeFilters) {
    showLoading(true);

    try {
        // ... código existente de loadReports ...

        // Después de cargar los datos, actualizar estadísticas
        updateDashboardStats();

        // Si la sección de estadísticas está visible, actualizar gráficas
        const statsSection = document.getElementById('statsSection');
        if (statsSection && statsSection.style.display === 'block') {
            updateStatistics();
        }

    } catch (error) {
        console.error('Error cargando reportes:', error);
        showNotification('Error cargando reportes', 'error');
    } finally {
        showLoading(false);
    }
}

// ================================
// NOTIFICACIONES
// ================================

function loadNotifications() {
    // Cargar notificaciones desde Firebase o localStorage
    const savedNotifications = localStorage.getItem('pqrs_notifications');
    if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
        updateNotificationCount();
    }

    // Escuchar nuevas notificaciones en tiempo real
    setupNotificationListener();
}

function setupNotificationListener() {
    // Escuchar nuevos reportes
    database.ref('pqrs_reports')
        .orderByChild('fecha_creacion')
        .limitToLast(1)
        .on('child_added', (snapshot) => {
            const report = snapshot.val();
            addNotification({
                id: Date.now(),
                type: 'new_report',
                title: 'Nuevo Reporte',
                message: `Se ha creado un nuevo ${report.tipo_reporte.toLowerCase()} de ${report.cliente}`,
                timestamp: new Date().toISOString(),
                read: false,
                data: { reportId: snapshot.key }
            });
        });

    // Escuchar cambios de estado
    database.ref('pqrs_reports')
        .on('child_changed', (snapshot) => {
            const newData = snapshot.val();
            const oldData = snapshot.previous.val();

            if (newData.estado !== oldData?.estado) {
                addNotification({
                    id: Date.now(),
                    type: 'status_change',
                    title: 'Estado Actualizado',
                    message: `El reporte ${snapshot.key.substring(0, 8)} cambió a ${newData.estado}`,
                    timestamp: new Date().toISOString(),
                    read: false,
                    data: {
                        reportId: snapshot.key,
                        oldStatus: oldData?.estado,
                        newStatus: newData.estado
                    }
                });
            }
        });
}

function addNotification(notification) {
    notifications.unshift(notification);

    // Mantener máximo 50 notificaciones
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
    }

    // Guardar en localStorage
    localStorage.setItem('pqrs_notifications', JSON.stringify(notifications));

    // Actualizar UI
    updateNotificationCount();

    // Mostrar notificación en tiempo real si el panel está cerrado
    if (!document.getElementById('notificationsPanel').classList.contains('show')) {
        showRealTimeNotification(notification);
    }
}

function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const countElement = document.getElementById('notificationCount');

    if (countElement) {
        countElement.textContent = unreadCount;
        countElement.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('show');

    if (panel.classList.contains('show')) {
        renderNotificationsList();
        markAllAsRead();
    }
}

function renderNotificationsList() {
    const listElement = document.getElementById('notificationsList');
    if (!listElement) return;

    if (notifications.length === 0) {
        listElement.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No hay notificaciones</p>
            </div>
        `;
        return;
    }

    const notificationsHTML = notifications.map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}"
             onclick="openNotification('${notification.id}')">
            <div class="notification-content">
                <div class="notification-icon ${notification.type}">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-text">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <div class="notification-time">
                        ${formatTimeAgo(notification.timestamp)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    listElement.innerHTML = notificationsHTML;
}

function getNotificationIcon(type) {
    switch (type) {
        case 'new_report': return 'fa-file-alt';
        case 'status_change': return 'fa-exchange-alt';
        case 'comment': return 'fa-comment';
        default: return 'fa-bell';
    }
}

function openNotification(notificationId) {
    const notification = notifications.find(n => n.id == notificationId);
    if (!notification) return;

    // Marcar como leída
    notification.read = true;
    localStorage.setItem('pqrs_notifications', JSON.stringify(notifications));
    updateNotificationCount();

    // Acción según tipo
    if (notification.data?.reportId) {
        viewReportDetails(notification.data.reportId);
        toggleNotifications();
    }
}

function markAllAsRead() {
    let updated = false;

    notifications.forEach(notification => {
        if (!notification.read) {
            notification.read = true;
            updated = true;
        }
    });

    if (updated) {
        localStorage.setItem('pqrs_notifications', JSON.stringify(notifications));
        updateNotificationCount();
        renderNotificationsList();
    }
}

function clearNotifications() {
    if (!confirm('¿Eliminar todas las notificaciones?')) return;

    notifications = [];
    localStorage.setItem('pqrs_notifications', JSON.stringify(notifications));
    updateNotificationCount();
    renderNotificationsList();
}

function showRealTimeNotification(notification) {
    // Mostrar toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="toast-content">
            <strong>${notification.title}</strong>
            <p>${notification.message}</p>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(toast);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// ================================
// UTILIDADES
// ================================

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateString) {
    if (!dateString) return 'No especificada';

    const [year, month, day] = dateString.split('-');

    return new Date(year, month - 1, day).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}


function formatTimeAgo(dateString) {
    if (!dateString || !dateString.includes('T')) {
        return formatDate(dateString);
    }

    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;

    return formatDateTime(dateString);
}


function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    // Implementar sistema de notificaciones toast
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' :
                      type === 'error' ? 'fa-exclamation-circle' :
                      type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Mostrar
    setTimeout(() => notification.classList.add('show'), 10);

    // Ocultar después de 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function printTable() {
    const printWindow = window.open('', '_blank');
    const table = document.getElementById('reportsTable').cloneNode(true);

    // Remover botones de acciones
    const actionCells = table.querySelectorAll('td:last-child');
    actionCells.forEach(cell => cell.remove());

    // Remover header de acciones
    const actionHeader = table.querySelector('th:last-child');
    if (actionHeader) actionHeader.remove();

    printWindow.document.write(`
        <html>
            <head>
                <title>Reportes PQRS - ${new Date().toLocaleDateString()}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    th { background-color: #f4f4f4; }
                    .status-badge { padding: 2px 6px; border-radius: 3px; font-size: 12px; }
                    .status-pendiente { background: #fef3c7; }
                    .status-proceso { background: #dbeafe; }
                    .status-resuelto { background: #d1fae5; }
                    .status-cerrado { background: #e5e7eb; }
                </style>
            </head>
            <body>
                <h1>Reportes PQRS - HB Transporte</h1>
                <p>Generado: ${new Date().toLocaleDateString('es-CO')}</p>
                ${table.outerHTML}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
}

function printReport() {
    if (!currentReportId) return;

    const printWindow = window.open('', '_blank');
    const modalContent = document.getElementById('modalContent').cloneNode(true);

    printWindow.document.write(`
        <html>
            <head>
                <title>Reporte PQRS - ${currentReportId.substring(0, 8)}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .report-details { max-width: 800px; margin: 0 auto; }
                    .detail-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
                    .detail-row { margin-bottom: 10px; }
                    .detail-label { font-weight: bold; min-width: 150px; display: inline-block; }
                    h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Reporte PQRS - HB Transporte</h1>
                <p><strong>ID:</strong> ${currentReportId.substring(0, 8)}</p>
                <p><strong>Generado:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
                <hr>
                ${modalContent.outerHTML}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
}

// ================================
// ACTUALIZACIONES EN TIEMPO REAL
// ================================

function setupRealtimeUpdates() {
    // Escuchar nuevos reportes
    database.ref('pqrs_reports').on('child_added', (snapshot) => {
        const newReport = snapshot.val();
        newReport.id = snapshot.key;

        // Agregar al principio del array
        reportsData.unshift(newReport);

        // Actualizar solo si aplica a filtros actuales
        if (applyFiltersToData([newReport], activeFilters).length > 0) {
            filteredReports.unshift(newReport);
            renderReportsTable();
            updateDashboardStats();
        }
    });

    // Escuchar cambios en reportes existentes
    database.ref('pqrs_reports').on('child_changed', (snapshot) => {
        const updatedReport = snapshot.val();
        updatedReport.id = snapshot.key;

        // Actualizar en arrays
        const index = reportsData.findIndex(r => r.id === snapshot.key);
        if (index !== -1) {
            reportsData[index] = updatedReport;
        }

        const filteredIndex = filteredReports.findIndex(r => r.id === snapshot.key);
        if (filteredIndex !== -1) {
            filteredReports[filteredIndex] = updatedReport;
            renderReportsTable();
            updateDashboardStats();
        }
    });

    // Escuchar eliminaciones
    database.ref('pqrs_reports').on('child_removed', (snapshot) => {
        const reportId = snapshot.key;

        // Remover de arrays
        reportsData = reportsData.filter(r => r.id !== reportId);
        filteredReports = filteredReports.filter(r => r.id !== reportId);

        renderReportsTable();
        updateDashboardStats();
    });
}

// ================================
// EXPORTAR FUNCIONES
// ================================

// Hacer funciones disponibles globalmente
window.adminFunctions = {
    adminLogin,
    logout,
    loadReports,
    applyFilters,
    resetFilters,
    viewReportDetails,
    openStatusModal,
    openCommentModal,
    exportToCSV,
    toggleStats,
    toggleNotifications,
    printTable
};

// ================================
// INICIALIZACIÓN ADICIONAL
// ================================

// Agregar estilos para notificaciones toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .notification-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 9999;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        max-width: 400px;
    }

    .notification-toast.show {
        transform: translateX(0);
    }

    .notification-success {
        border-left: 4px solid #10b981;
        background: #d1fae5;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
        background: #fee2e2;
    }

    .notification-warning {
        border-left: 4px solid #f59e0b;
        background: #fef3c7;
    }

    .notification-info {
        border-left: 4px solid #3b82f6;
        background: #dbeafe;
    }

    .toast-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 9998;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    }

    @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }

    .toast-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e0f2fe;
        color: #1e3a8a;
    }

    .toast-content {
        flex: 1;
    }

    .toast-close {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 0.25rem;
    }
`;

document.head.appendChild(toastStyles);
