import { database } from './firebase-config.js';
import { ref, onValue, update, get, query, orderByChild, equalTo } from 'firebase/database';

let reportsTable;
let allReports = [];

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar DataTable
    reportsTable = $('#reportsTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/es-ES.json'
        },
        pageLength: 10,
        responsive: true
    });

    // Cargar reportes
    cargarReportes();

    // Configurar filtros
    document.getElementById('btnAplicarFiltros').addEventListener('click', aplicarFiltros);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltros);

    // Configurar botones de exportación
    document.getElementById('btnExportPDF').addEventListener('click', exportarPDF);
    document.getElementById('btnExportCSV').addEventListener('click', exportarCSV);
    document.getElementById('btnExportExcel').addEventListener('click', exportarExcel);

    // Configurar navegación
    document.getElementById('btnReportes').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarSeccion('reports');
    });

    document.getElementById('btnEstadisticas').addEventListener('click', (e) => {
        e.preventDefault();
        mostrarSeccion('stats');
        actualizarEstadisticas();
    });

    // Configurar modal
    const modal = document.getElementById('detailModal');
    const closeModal = document.querySelector('#detailModal .close-modal');

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

async function cargarReportes() {
    const reportsRef = ref(database, 'pqrs_reports');
    
    onValue(reportsRef, (snapshot) => {
        allReports = [];
        reportsTable.clear();

        snapshot.forEach((childSnapshot) => {
            const report = {
                id: childSnapshot.key,
                ...childSnapshot.val()
            };
            allReports.push(report);

            // Agregar fila a la tabla
            reportsTable.row.add([
                report.id.substring(0, 8) + '...',
                obtenerIconoTipo(report.tipo_reporte) + ' ' + report.tipo_reporte,
                report.cliente,
                report.nombre_reportante,
                new Date(report.fecha_creacion).toLocaleDateString('es-ES'),
                report.placa_vehiculo,
                report.nombre_conductor,
                obtenerBadgeEstado(report.estado),
                generarBotonesAccion(report.id)
            ]);
        });

        reportsTable.draw();
        actualizarEstadisticas();
    });
}

function obtenerIconoTipo(tipo) {
    const iconos = {
        'Queja': '⚠️',
        'Peticion': '❓',
        'Reclamo': '🚨',
        'Felicitaciones': '⭐',
        'Sugerencia': '💡'
    };
    return iconos[tipo] || '📄';
}

function obtenerBadgeEstado(estado) {
    const colores = {
        'Pendiente': '#e74c3c',
        'En proceso': '#f39c12',
        'Resuelto': '#27ae60',
        'Cerrado': '#7f8c8d'
    };
    
    return `<span class="estado-badge" style="background: ${colores[estado]}">${estado}</span>`;
}

function generarBotonesAccion(id) {
    return `
        <div class="action-buttons">
            <button class="btn-action btn-view" onclick="verDetalles('${id}')" title="Ver detalles">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-action btn-edit" onclick="editarEstado('${id}')" title="Cambiar estado">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action btn-comment" onclick="agregarComentario('${id}')" title="Agregar comentario">
                <i class="fas fa-comment"></i>
            </button>
        </div>
    `;
}

function aplicarFiltros() {
    const tipo = document.getElementById('filterTipo').value;
    const cliente = document.getElementById('filterCliente').value;
    const estado = document.getElementById('filterEstado').value;
    const fechaDesde = document.getElementById('filterFechaDesde').value;
    const fechaHasta = document.getElementById('filterFechaHasta').value;

    reportsTable.search('').draw();

    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            const report = allReports[dataIndex];
            
            // Filtrar por tipo
            if (tipo && report.tipo_reporte !== tipo) return false;
            
            // Filtrar por cliente
            if (cliente && report.cliente !== cliente) return false;
            
            // Filtrar por estado
            if (estado && report.estado !== estado) return false;
            
            // Filtrar por fecha
            if (fechaDesde || fechaHasta) {
                const fechaReporte = new Date(report.fecha_creacion);
                const desde = fechaDesde ? new Date(fechaDesde) : null;
                const hasta = fechaHasta ? new Date(fechaHasta) : null;
                
                if (desde && fechaReporte < desde) return false;
                if (hasta && fechaReporte > hasta) return false;
            }
            
            return true;
        }
    );
    
    reportsTable.draw();
}

function limpiarFiltros() {
    document.getElementById('filterTipo').value = '';
    document.getElementById('filterCliente').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterFechaDesde').value = '';
    document.getElementById('filterFechaHasta').value = '';
    
    $.fn.dataTable.ext.search.pop();
    reportsTable.search('').draw();
}

async function verDetalles(id) {
    const report = allReports.find(r => r.id === id);
    if (!report) return;

    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    let detallesHTML = `
        <h2>Detalles del Reporte #${id.substring(0, 8)}</h2>
        
        <div class="detail-section">
            <h3><i class="fas fa-info-circle"></i> Información General</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Tipo de Reporte:</strong>
                    <span>${report.tipo_reporte}</span>
                </div>
                <div class="detail-item">
                    <strong>Cliente:</strong>
                    <span>${report.cliente}</span>
                </div>
                <div class="detail-item">
                    <strong>Reportante:</strong>
                    <span>${report.nombre_reportante}</span>
                </div>
                <div class="detail-item">
                    <strong>Fecha Reporte:</strong>
                    <span>${report.fecha_reporte}</span>
                </div>
                <div class="detail-item">
                    <strong>Estado:</strong>
                    <span class="estado-badge" style="background: ${obtenerColorEstado(report.estado)}">
                        ${report.estado}
                    </span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3><i class="fas fa-truck"></i> Información del Servicio</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Placa Vehículo:</strong>
                    <span>${report.placa_vehiculo}</span>
                </div>
                <div class="detail-item">
                    <strong>Nombre Conductor:</strong>
                    <span>${report.nombre_conductor}</span>
                </div>
            </div>
        </div>
    `;

    // Agregar detalles específicos según el tipo de reporte
    switch(report.tipo_reporte) {
        case 'Queja':
            detallesHTML += generarDetallesQueja(report);
            break;
        case 'Reclamo':
            detallesHTML += generarDetallesReclamo(report);
            break;
        case 'Peticion':
            detallesHTML += generarDetallesPeticion(report);
            break;
        case 'Felicitaciones':
        case 'Sugerencia':
            detallesHTML += `
                <div class="detail-section">
                    <h3><i class="fas fa-comment"></i> Mensaje</h3>
                    <div class="message-box">
                        ${report.mensaje || report.descripcion}
                    </div>
                </div>
            `;
            break;
    }

    // Agregar comentarios internos
    if (report.comentarios_internos) {
        detallesHTML += `
            <div class="detail-section">
                <h3><i class="fas fa-sticky-note"></i> Comentarios Internos</h3>
                <div class="comments-box">
                    ${report.comentarios_internos}
                </div>
            </div>
        `;
    }

    modalContent.innerHTML = detallesHTML;
    modal.style.display = 'flex';
}

async function editarEstado(id) {
    const report = allReports.find(r => r.id === id);
    if (!report) return;

    const nuevoEstado = prompt(
        'Seleccione el nuevo estado:\n1. Pendiente\n2. En proceso\n3. Resuelto\n4. Cerrado',
        report.estado
    );

    if (nuevoEstado && ['Pendiente', 'En proceso', 'Resuelto', 'Cerrado'].includes(nuevoEstado)) {
        try {
            const reportRef = ref(database, `pqrs_reports/${id}`);
            await update(reportRef, {
                estado: nuevoEstado,
                fecha_actualizacion: new Date().toISOString()
            });
            alert('Estado actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado');
        }
    }
}

async function agregarComentario(id) {
    const comentario = prompt('Ingrese el comentario interno:');
    if (comentario) {
        try {
            const reportRef = ref(database, `pqrs_reports/${id}`);
            await update(reportRef, {
                comentarios_internos: comentario,
                fecha_actualizacion: new Date().toISOString()
            });
            alert('Comentario agregado correctamente');
        } catch (error) {
            console.error('Error al agregar comentario:', error);
            alert('Error al agregar el comentario');
        }
    }
}

function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Reportes PQRS', 20, 20);
    
    // Crear tabla
    doc.autoTable({
        head: [['ID', 'Tipo', 'Cliente', 'Reportante', 'Fecha', 'Placa', 'Conductor', 'Estado']],
        body: allReports.map(report => [
            report.id.substring(0, 8),
            report.tipo_reporte,
            report.cliente,
            report.nombre_reportante,
            new Date(report.fecha_creacion).toLocaleDateString('es-ES'),
            report.placa_vehiculo,
            report.nombre_conductor,
            report.estado
        ]),
        startY: 30
    });
    
    doc.save('reportes_pqrs.pdf');
}

function exportarCSV() {
    let csv = 'ID,Tipo,Cliente,Reportante,Fecha,Placa,Conductor,Estado\n';
    
    allReports.forEach(report => {
        csv += `"${report.id}","${report.tipo_reporte}","${report.cliente}","${report.nombre_reportante}","${new Date(report.fecha_creacion).toLocaleDateString('es-ES')}","${report.placa_vehiculo}","${report.nombre_conductor}","${report.estado}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reportes_pqrs.csv';
    a.click();
}

function exportarExcel() {
    // Similar a CSV pero con formato Excel
    exportarCSV(); // Para simplificar, usamos CSV
}

function mostrarSeccion(seccion) {
    const reportsSection = document.querySelector('.reports-section');
    const statsSection = document.getElementById('statsSection');
    
    if (seccion === 'reports') {
        reportsSection.style.display = 'block';
        statsSection.style.display = 'none';
    } else if (seccion === 'stats') {
        reportsSection.style.display = 'none';
        statsSection.style.display = 'block';
    }
}

function actualizarEstadisticas() {
    const totalQuejas = allReports.filter(r => r.tipo_reporte === 'Queja').length;
    const totalPeticiones = allReports.filter(r => r.tipo_reporte === 'Peticion').length;
    const totalReclamos = allReports.filter(r => r.tipo_reporte === 'Reclamo').length;
    const totalFelicitaciones = allReports.filter(r => r.tipo_reporte === 'Felicitaciones').length;
    
    document.getElementById('totalQuejas').textContent = totalQuejas;
    document.getElementById('totalPeticiones').textContent = totalPeticiones;
    document.getElementById('totalReclamos').textContent = totalReclamos;
    document.getElementById('totalFelicitaciones').textContent = totalFelicitaciones;
}

// Funciones globales para los botones
window.verDetalles = verDetalles;
window.editarEstado = editarEstado;
window.agregarComentario = agregarComentario;