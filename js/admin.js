// js/admin.js - VERSIÓN SIMPLIFICADA Y FUNCIONAL
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel iniciando...');
    
    // Inicializar variables
    window.allReports = [];
    let filteredReports = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    
    // Referencias a elementos DOM
    const elements = {
        logoutBtn: document.getElementById('logoutBtn'),
        exportBtn: document.getElementById('exportBtn'),
        applyFilters: document.getElementById('applyFilters'),
        clearFilters: document.getElementById('clearFilters'),
        refreshBtn: document.getElementById('refreshBtn'),
        reportsBody: document.getElementById('reportsBody'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        pageNumbers: document.querySelector('.page-numbers'),
        totalReports: document.getElementById('totalReports'),
        pendingReports: document.getElementById('pendingReports'),
        inProgressReports: document.getElementById('inProgressReports'),
        resolvedReports: document.getElementById('resolvedReports'),
        totalChange: document.getElementById('totalChange')
    };
    
    // Inicializar
    setupEventListeners();
    loadReports();
    
    // Configurar event listeners
    function setupEventListeners() {
        console.log('Configurando event listeners...');
        
        if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
        if (elements.exportBtn) elements.exportBtn.addEventListener('click', exportToCSV);
        if (elements.applyFilters) elements.applyFilters.addEventListener('click', applyFilters);
        if (elements.clearFilters) elements.clearFilters.addEventListener('click', clearFilters);
        if (elements.refreshBtn) elements.refreshBtn.addEventListener('click', loadReports);
        if (elements.prevPage) elements.prevPage.addEventListener('click', goToPrevPage);
        if (elements.nextPage) elements.nextPage.addEventListener('click', goToNextPage);
        
        // Configurar fechas por defecto en filtros
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        const fechaDesde = document.getElementById('filterFechaDesde');
        const fechaHasta = document.getElementById('filterFechaHasta');
        
        if (fechaDesde) fechaDesde.valueAsDate = oneMonthAgo;
        if (fechaHasta) fechaHasta.valueAsDate = today;
    }
    
    // ========== FUNCIÓN PRINCIPAL PARA CARGAR REPORTES ==========
    async function loadReports() {
        console.log('Iniciando carga de reportes desde Firebase...');
        
        try {
            // Mostrar estado de carga
            showLoadingState();
            
            // Obtener datos de Firebase
            const snapshot = await firebase.database().ref('pqrs_reports').once('value');
            
            if (!snapshot.exists()) {
                console.log('No se encontraron reportes en Firebase');
                window.allReports = [];
                showNoDataState();
            } else {
                window.allReports = [];
                snapshot.forEach((childSnapshot) => {
                    const report = childSnapshot.val();
                    report.id = childSnapshot.key;
                    window.allReports.push(report);
                });
                
                console.log(`✅ Se cargaron ${window.allReports.length} reportes de Firebase`);
                
                // Ordenar por fecha (más reciente primero)
                window.allReports.sort((a, b) => {
                    const dateA = a.fecha_creacion ? new Date(a.fecha_creacion) : new Date(0);
                    const dateB = b.fecha_creacion ? new Date(b.fecha_creacion) : new Date(0);
                    return dateB - dateA;
                });
            }
            
            // Actualizar dashboard
            updateDashboard();
            
            // Aplicar filtros (mostrar todos inicialmente)
            applyFilters();
            
            // Notificar a gráficos si la función existe
            if (typeof window.loadChartsData === 'function') {
                console.log('Notificando a gráficos sobre nuevos datos...');
                window.loadChartsData(window.allReports);
            }
            
            // Actualizar botón de refresh
            if (elements.refreshBtn) {
                elements.refreshBtn.innerHTML = '<i class="fas fa-check"></i> Actualizado';
                setTimeout(() => {
                    elements.refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
                }, 2000);
            }
            
        } catch (error) {
            console.error('❌ Error crítico al cargar reportes:', error);
            showErrorState(error);
        }
    }
    
    // Mostrar estado de carga
    function showLoadingState() {
        if (elements.reportsBody) {
            elements.reportsBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 50px;">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin fa-3x" style="color: var(--secondary-color);"></i>
                            <p style="margin-top: 20px; font-size: 1.1rem;">Cargando reportes desde Firebase...</p>
                            <p style="margin-top: 10px; color: var(--gray-color); font-size: 0.9rem;">
                                Conectando a la base de datos
                            </p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    // Mostrar estado sin datos
    function showNoDataState() {
        if (elements.reportsBody) {
            elements.reportsBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 60px;">
                        <i class="fas fa-inbox fa-3x" style="color: var(--gray-color); opacity: 0.5;"></i>
                        <p style="margin-top: 20px; font-size: 1.1rem; color: var(--dark-color);">
                            No hay reportes registrados
                        </p>
                        <p style="margin-top: 10px; color: var(--gray-color);">
                            Los reportes aparecerán aquí cuando los usuarios los envíen
                        </p>
                        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
        
        // Actualizar dashboard con ceros
        updateDashboard();
    }
    
    // Mostrar estado de error
    function showErrorState(error) {
        console.error('Mostrando estado de error:', error);
        
        if (elements.reportsBody) {
            elements.reportsBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 50px; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <p style="margin-top: 20px; font-size: 1.1rem;">
                            Error al cargar los reportes
                        </p>
                        <p style="margin-top: 10px; font-size: 0.9rem; color: #c0392b;">
                            ${error.message || 'Error desconocido'}
                        </p>
                        <div style="margin-top: 20px;">
                            <button onclick="loadReports()" class="btn btn-primary">
                                <i class="fas fa-redo"></i> Reintentar
                            </button>
                            <button onclick="location.reload()" class="btn btn-secondary" style="margin-left: 10px;">
                                <i class="fas fa-sync-alt"></i> Recargar página
                            </button>
                        </div>
                        <p style="margin-top: 20px; font-size: 0.8rem; color: var(--gray-color);">
                            Si el problema persiste, verifica tu conexión a Internet
                        </p>
                    </td>
                </tr>
            `;
        }
    }
    
    // Actualizar dashboard
    function updateDashboard() {
        console.log('Actualizando dashboard...');
        
        const total = window.allReports.length;
        const pending = window.allReports.filter(r => r.estado === 'Pendiente').length;
        const inProgress = window.allReports.filter(r => r.estado === 'En proceso').length;
        const resolved = window.allReports.filter(r => r.estado === 'Resuelto' || r.estado === 'Cerrado').length;
        
        // Actualizar elementos del DOM
        if (elements.totalReports) elements.totalReports.textContent = total;
        if (elements.pendingReports) elements.pendingReports.textContent = pending;
        if (elements.inProgressReports) elements.inProgressReports.textContent = inProgress;
        if (elements.resolvedReports) elements.resolvedReports.textContent = resolved;
        
        // Calcular tendencia
        if (elements.totalChange && total > 0) {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const recentReports = window.allReports.filter(report => {
                try {
                    const reportDate = report.fecha_creacion ? new Date(report.fecha_creacion) : new Date(0);
                    return reportDate >= oneWeekAgo;
                } catch (e) {
                    return false;
                }
            }).length;
            
            const olderReports = Math.max(1, total - recentReports);
            const percentage = Math.round((recentReports / olderReports) * 100);
            
            if (percentage > 120) {
                elements.totalChange.innerHTML = `<i class="fas fa-arrow-up"></i> +${Math.round(percentage - 100)}% esta semana`;
                elements.totalChange.className = 'stat-change positive';
            } else if (percentage < 80) {
                elements.totalChange.innerHTML = `<i class="fas fa-arrow-down"></i> ${Math.round(100 - percentage)}% esta semana`;
                elements.totalChange.className = 'stat-change negative';
            } else {
                elements.totalChange.innerHTML = `<i class="fas fa-minus"></i> Similar esta semana`;
                elements.totalChange.className = 'stat-change';
            }
        }
        
        console.log(`Dashboard: Total=${total}, Pendientes=${pending}, EnProceso=${inProgress}, Resueltos=${resolved}`);
    }
    
    // ========== FUNCIONES DE FILTRADO Y TABLA ==========
    function applyFilters() {
        console.log('Aplicando filtros...');
        
        // Obtener valores de filtros
        const filters = {
            tipo: document.getElementById('filterTipo')?.value || '',
            cliente: document.getElementById('filterCliente')?.value || '',
            estado: document.getElementById('filterEstado')?.value || '',
            fechaDesde: document.getElementById('filterFechaDesde')?.value || '',
            fechaHasta: document.getElementById('filterFechaHasta')?.value || ''
        };
        
        console.log('Filtros activos:', filters);
        
        // Filtrar reportes
        filteredReports = window.allReports.filter(report => {
            // Filtro por tipo
            if (filters.tipo && report.tipo_reporte !== filters.tipo) {
                return false;
            }
            
            // Filtro por cliente
            if (filters.cliente && report.cliente !== filters.cliente) {
                return false;
            }
            
            // Filtro por estado
            if (filters.estado && report.estado !== filters.estado) {
                return false;
            }
            
            // Filtro por fecha
            if (filters.fechaDesde && report.fecha_reporte) {
                const reportDate = new Date(report.fecha_reporte);
                const filterDate = new Date(filters.fechaDesde);
                if (reportDate < filterDate) return false;
            }
            
            if (filters.fechaHasta && report.fecha_reporte) {
                const reportDate = new Date(report.fecha_reporte);
                const filterDate = new Date(filters.fechaHasta);
                filterDate.setDate(filterDate.getDate() + 1); // Incluir el día completo
                if (reportDate >= filterDate) return false;
            }
            
            return true;
        });
        
        console.log(`Resultado del filtro: ${filteredReports.length} reportes`);
        
        // Reiniciar paginación
        currentPage = 1;
        
        // Renderizar tabla
        renderTable();
        
        // Actualizar gráficos si están visibles
        if (typeof window.updateChartsWithFilteredData === 'function') {
            window.updateChartsWithFilteredData(filteredReports);
        }
    }
    
    function clearFilters() {
        console.log('Limpiando filtros...');
        
        // Limpiar campos
        document.getElementById('filterTipo').value = '';
        document.getElementById('filterCliente').value = '';
        document.getElementById('filterEstado').value = '';
        
        // Restaurar fechas por defecto
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        document.getElementById('filterFechaDesde').valueAsDate = oneMonthAgo;
        document.getElementById('filterFechaHasta').valueAsDate = today;
        
        // Aplicar filtros vacíos
        applyFilters();
    }
    
    function renderTable() {
        console.log(`Renderizando tabla (página ${currentPage})...`);
        
        if (!elements.reportsBody) return;
        
        if (filteredReports.length === 0) {
            elements.reportsBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 40px;">
                        <i class="fas fa-search fa-2x" style="color: var(--gray-color); opacity: 0.5;"></i>
                        <p style="margin-top: 15px; color: var(--dark-color);">
                            No se encontraron reportes con los filtros aplicados
                        </p>
                        <button onclick="clearFilters()" class="btn btn-secondary" style="margin-top: 10px;">
                            <i class="fas fa-times"></i> Limpiar filtros
                        </button>
                    </td>
                </tr>
            `;
            
            // Ocultar paginación
            if (elements.prevPage) elements.prevPage.style.display = 'none';
            if (elements.nextPage) elements.nextPage.style.display = 'none';
            if (elements.pageNumbers) elements.pageNumbers.style.display = 'none';
            
            return;
        }
        
        // Calcular paginación
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredReports.length);
        const pageReports = filteredReports.slice(startIndex, endIndex);
        
        console.log(`Mostrando reportes ${startIndex + 1} a ${endIndex} de ${filteredReports.length}`);
        
        // Generar HTML de la tabla
        let tableHTML = '';
        
        pageReports.forEach((report, index) => {
            const rowNumber = startIndex + index + 1;
            
            // Determinar clase CSS para el tipo
            let typeClass = '';
            switch(report.tipo_reporte) {
                case 'Queja': typeClass = 'type-queja'; break;
                case 'Reclamo': typeClass = 'type-reclamo'; break;
                case 'Peticion': typeClass = 'type-peticion'; break;
                case 'Felicitaciones': typeClass = 'type-felicitaciones'; break;
                case 'Sugerencia': typeClass = 'type-sugerencia'; break;
            }
            
            // Determinar clase CSS para el estado
            let statusClass = '';
            switch(report.estado) {
                case 'Pendiente': statusClass = 'status-pendiente'; break;
                case 'En proceso': statusClass = 'status-proceso'; break;
                case 'Resuelto': statusClass = 'status-resuelto'; break;
                case 'Cerrado': statusClass = 'status-cerrado'; break;
            }
            
            tableHTML += `
                <tr data-report-id="${report.id}">
                    <td>${rowNumber}</td>
                    <td>
                        <span class="report-type ${typeClass}">
                            <i class="fas fa-file-alt"></i>
                            ${report.tipo_reporte || 'Sin tipo'}
                        </span>
                    </td>
                    <td>${report.cliente || '-'}</td>
                    <td>${report.nombre_reportante || '-'}</td>
                    <td>${report.fecha_reporte || '-'}</td>
                    <td>${report.placa_vehiculo || '-'}</td>
                    <td>${report.nombre_conductor || '-'}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${report.estado || 'Pendiente'}
                        </span>
                    </td>
                    <td>${formatDate(report.fecha_creacion)}</td>
                    <td class="actions-cell">
                        <button class="action-btn action-btn-view" onclick="viewReportDetails('${report.id}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="action-btn action-btn-edit" onclick="changeReportStatus('${report.id}')">
                            <i class="fas fa-edit"></i> Estado
                        </button>
                    </td>
                </tr>
            `;
        });
        
        elements.reportsBody.innerHTML = tableHTML;
        
        // Actualizar paginación
        updatePagination(totalPages);
    }
    
    function updatePagination(totalPages) {
        console.log(`Actualizando paginación: ${totalPages} páginas totales`);
        
        // Mostrar/ocultar botones de paginación
        if (elements.prevPage) {
            elements.prevPage.style.display = currentPage > 1 ? 'flex' : 'none';
            elements.prevPage.disabled = currentPage === 1;
        }
        
        if (elements.nextPage) {
            elements.nextPage.style.display = currentPage < totalPages ? 'flex' : 'none';
            elements.nextPage.disabled = currentPage === totalPages;
        }
        
        // Actualizar números de página
        if (elements.pageNumbers) {
            elements.pageNumbers.style.display = totalPages > 1 ? 'flex' : 'none';
            
            let pageHTML = '';
            const maxVisiblePages = 5;
            
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                pageHTML += `
                    <span class="page-number ${i === currentPage ? 'active' : ''}" 
                          onclick="goToPage(${i})">
                        ${i}
                    </span>
                `;
            }
            
            elements.pageNumbers.innerHTML = pageHTML;
        }
    }
    
    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    }
    
    function goToNextPage() {
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    }
    
    function goToPage(page) {
        const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            currentPage = page;
            renderTable();
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    // ========== HACER FUNCIONES DISPONIBLES GLOBALMENTE ==========
    window.loadReports = loadReports;
    window.goToPage = goToPage;
    window.viewReportDetails = viewReportDetails;
    window.changeReportStatus = changeReportStatus;
    window.addInternalComment = addInternalComment;
    window.applyFilters = applyFilters;
    window.clearFilters = clearFilters;
    
    console.log('✅ Admin panel completamente inicializado');
});

// ========== FUNCIONES DE MODALES (mantener existentes) ==========
async function viewReportDetails(reportId) {
    try {
        const snapshot = await firebase.database().ref(`pqrs_reports/${reportId}`).once('value');
        const report = snapshot.val();
        report.id = reportId;
        
        createDetailModal(report);
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        alert('Error al cargar los detalles del reporte.');
    }
}

function changeReportStatus(reportId) {
    const newStatus = prompt('Ingrese el nuevo estado (Pendiente, En proceso, Resuelto, Cerrado):');
    
    if (!newStatus || !['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'].includes(newStatus)) {
        alert('Estado no válido. Debe ser: Pendiente, En proceso, Resuelto o Cerrado.');
        return;
    }
    
    firebase.database().ref(`pqrs_reports/${reportId}`).update({
        estado: newStatus,
        fecha_actualizacion: new Date().toISOString()
    })
    .then(() => {
        alert('Estado actualizado correctamente.');
        location.reload();
    })
    .catch((error) => {
        console.error('Error al actualizar estado:', error);
        alert('Error al actualizar el estado.');
    });
}

function addInternalComment(reportId) {
    const comment = prompt('Ingrese el comentario interno:');
    
    if (!comment) return;
    
    firebase.database().ref(`pqrs_reports/${reportId}`).once('value')
        .then((snapshot) => {
            const report = snapshot.val();
            let comments = report.comentarios_internos || [];
            const newComment = {
                author: 'Administrador',
                date: new Date().toISOString(),
                text: comment
            };
            
            if (typeof comments === 'string' && comments.trim()) {
                comments = [{
                    author: 'Sistema',
                    date: report.fecha_creacion,
                    text: comments
                }, newComment];
            } else if (Array.isArray(comments)) {
                comments.push(newComment);
            } else {
                comments = [newComment];
            }
            
            return firebase.database().ref(`pqrs_reports/${reportId}`).update({
                comentarios_internos: comments,
                fecha_actualizacion: new Date().toISOString()
            });
        })
        .then(() => {
            alert('Comentario agregado correctamente.');
            location.reload();
        })
        .catch((error) => {
            console.error('Error al agregar comentario:', error);
            alert('Error al agregar el comentario.');
        });
}

function exportToCSV() {
    if (!window.allReports || window.allReports.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    
    const headers = [
        'ID', 'Tipo', 'Cliente', 'Reportante', 'Correo', 'Fecha Reporte',
        'Placa', 'Conductor', 'Estado', 'Fecha Creación', 'Descripción'
    ];
    
    const rows = window.allReports.map(report => {
        return [
            report.id,
            report.tipo_reporte || '',
            report.cliente || '',
            report.nombre_reportante || '',
            report.correo_reportante || '',
            report.fecha_reporte || '',
            report.placa_vehiculo || '',
            report.nombre_conductor || '',
            report.estado || 'Pendiente',
            report.fecha_creacion || '',
            report.descripcion || report.mensaje || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `reportes_pqrs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error al cerrar sesión:', error);
        });
}