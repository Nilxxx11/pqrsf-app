// js/admin-charts.js - VERSIÓN SIMPLIFICADA
console.log('📊 admin-charts.js cargado');

let charts = {};
let chartData = [];

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    console.log('📈 Sistema de gráficos inicializando...');
    
    // Configurar botón de gráficos
    const toggleBtn = document.getElementById('toggleCharts');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCharts);
        console.log('✅ Botón de gráficos configurado');
    }
    
    // Si ya hay datos disponibles, cargarlos
    if (window.allReports && window.allReports.length > 0) {
        console.log('📥 Datos encontrados al cargar, actualizando gráficos...');
        loadChartsData(window.allReports);
    }
});

// Cargar datos en gráficos
function loadChartsData(reports) {
    console.log(`📥 Cargando ${reports?.length || 0} reportes en gráficos`);
    
    if (!reports || !Array.isArray(reports)) {
        console.error('❌ Datos inválidos para gráficos');
        return;
    }
    
    chartData = reports;
    
    // Si los gráficos están visibles, actualizarlos
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection && chartsSection.style.display !== 'none') {
        console.log('🎨 Gráficos visibles, renderizando...');
        renderAllCharts();
    }
}

// Mostrar/ocultar gráficos
function toggleCharts() {
    const section = document.getElementById('chartsSection');
    const btn = document.getElementById('toggleCharts');
    
    if (!section || !btn) return;
    
    if (section.style.display === 'none' || !section.style.display) {
        // Mostrar
        section.style.display = 'grid';
        btn.innerHTML = '<i class="fas fa-chart-bar"></i> Ocultar Gráficos';
        
        // Renderizar gráficos si hay datos
        if (chartData.length > 0) {
            setTimeout(() => renderAllCharts(), 100);
        } else {
            showChartMessage('Esperando datos...');
        }
    } else {
        // Ocultar
        section.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-chart-bar"></i> Mostrar Gráficos';
    }
}

// Renderizar todos los gráficos
function renderAllCharts() {
    console.log('🎨 Renderizando 4 gráficos...');
    
    if (chartData.length === 0) {
        showChartMessage('No hay datos para mostrar');
        return;
    }
    
    // Destruir gráficos anteriores
    Object.values(charts).forEach(chart => {
        if (chart && chart.destroy) chart.destroy();
    });
    charts = {};
    
    // Crear gráficos
    createChart('typeChart', 'pie', 'Tipos de Reporte', countBy('tipo_reporte'));
    createChart('statusChart', 'bar', 'Estados de Reporte', countBy('estado'));
    createChart('trendChart', 'line', 'Tendencia Mensual', countByMonth());
    createChart('clientsChart', 'doughnut', 'Top 5 Clientes', countClients(5));
}

// Función auxiliar: contar por campo
function countBy(field) {
    const counts = {};
    chartData.forEach(item => {
        const value = item[field] || 'No especificado';
        counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
}

// Contar por mes
function countByMonth() {
    const counts = {};
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    chartData.forEach(item => {
        if (item.fecha_creacion) {
            try {
                const date = new Date(item.fecha_creacion);
                const key = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
                counts[key] = (counts[key] || 0) + 1;
            } catch (e) {
                // Ignorar errores de fecha
            }
        }
    });
    
    return counts;
}

// Contar clientes (top N)
function countClients(limit = 5) {
    const counts = {};
    chartData.forEach(item => {
        const cliente = item.cliente || 'No especificado';
        counts[cliente] = (counts[cliente] || 0) + 1;
    });
    
    // Ordenar y limitar
    const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    
    const result = {};
    sorted.forEach(([key, value]) => {
        result[key] = value;
    });
    
    return result;
}

// Crear un gráfico
function createChart(canvasId, type, title, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`❌ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    if (labels.length === 0) {
        canvas.parentElement.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-chart-${type === 'pie' ? 'pie' : type === 'bar' ? 'bar' : 'line'}"></i>
                <p>No hay datos para ${title}</p>
            </div>
        `;
        return;
    }
    
    // Colores
    const colors = generateColors(labels.length);
    
    try {
        charts[canvasId] = new Chart(canvas.getContext('2d'), {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        });
        
        console.log(`✅ Gráfico ${canvasId} creado`);
    } catch (error) {
        console.error(`❌ Error creando gráfico ${canvasId}:`, error);
    }
}

// Generar colores
function generateColors(count) {
    const baseColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(201, 203, 207, 0.7)'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// Mostrar mensaje
function showChartMessage(message) {
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(container => {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="fas fa-info-circle"></i>
                <p>${message}</p>
            </div>
        `;
    });
}

// Hacer funciones disponibles globalmente
window.loadChartsData = loadChartsData;
window.toggleCharts = toggleCharts;