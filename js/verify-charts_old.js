// js/verify-charts.js
console.log('=== VERIFICACIÓN DE GRÁFICOS ===');

// Verificar Chart.js
console.log('Chart.js disponible:', typeof Chart !== 'undefined');

// Verificar canvas
const canvasIds = ['typeChart', 'statusChart', 'trendChart', 'clientsChart'];
canvasIds.forEach(id => {
    const canvas = document.getElementById(id);
    console.log(`Canvas "${id}":`, canvas ? 'OK' : 'NO ENCONTRADO');
});

// Verificar datos
console.log('Datos disponibles (allReports):', window.allReports ? window.allReports.length : 0);

// Verificar funciones
const requiredFunctions = [
    'loadChartsData',
    'toggleChartsSection',
    'updateChartsWithFilteredData'
];

requiredFunctions.forEach(funcName => {
    console.log(`Función "${funcName}":`, typeof window[funcName] === 'function' ? 'OK' : 'NO DISPONIBLE');
});

console.log('=== FIN VERIFICACIÓN ===');