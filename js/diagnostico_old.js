// js/diagnostico.js
console.log('🔍 ===== DIAGNÓSTICO COMPLETO =====');

// 1. Verificar Firebase
console.log('1. Firebase:');
console.log('   - firebase.app:', typeof firebase !== 'undefined' ? '✅ OK' : '❌ NO');
console.log('   - firebase.database:', firebase.database ? '✅ OK' : '❌ NO');
console.log('   - firebase.auth:', firebase.auth ? '✅ OK' : '❌ NO');

// 2. Verificar Chart.js
console.log('2. Chart.js:', typeof Chart !== 'undefined' ? '✅ OK' : '❌ NO');

// 3. Verificar funciones globales
console.log('3. Funciones globales:');
console.log('   - loadReports:', typeof loadReports === 'function' ? '✅ OK' : '❌ NO');
console.log('   - loadChartsData:', typeof loadChartsData === 'function' ? '✅ OK' : '❌ NO');
console.log('   - allReports:', window.allReports ? `✅ ${window.allReports.length} items` : '❌ NO');

// 4. Verificar elementos DOM críticos
console.log('4. Elementos DOM:');
const criticalElements = ['reportsBody', 'toggleCharts', 'chartsSection'];
criticalElements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`   - ${id}:`, el ? '✅ OK' : '❌ NO ENCONTRADO');
});

// 5. Intentar cargar datos manualmente si no hay
if (!window.allReports || window.allReports.length === 0) {
    console.log('5. ⚠️ No hay datos. Intentando cargar manualmente...');
    
    // Función para cargar datos manualmente
    function cargarDatosManual() {
        firebase.database().ref('pqrs_reports').once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    const reports = [];
                    snapshot.forEach(child => {
                        reports.push({ id: child.key, ...child.val() });
                    });
                    console.log(`✅ Datos cargados manualmente: ${reports.length} reportes`);
                    
                    // Asignar a variable global
                    window.allReports = reports;
                    
                    // Si hay función loadChartsData, llamarla
                    if (typeof loadChartsData === 'function') {
                        loadChartsData(reports);
                    }
                    
                    // Recargar la página si hay función loadReports
                    if (typeof loadReports === 'function') {
                        loadReports();
                    }
                } else {
                    console.log('ℹ️ No hay datos en Firebase');
                }
            })
            .catch(error => {
                console.error('❌ Error cargando datos manualmente:', error);
            });
    }
    
    // Ejecutar después de 2 segundos
    setTimeout(cargarDatosManual, 2000);
}

console.log('🔍 ===== FIN DIAGNÓSTICO =====');

// Comandos útiles para la consola
console.log('\n💡 COMANDOS ÚTILES:');
console.log('1. Recargar datos: loadReports()');
console.log('2. Ver datos: console.log(window.allReports)');
console.log('3. Forzar gráficos: if (loadChartsData) loadChartsData(window.allReports || [])');
console.log('4. Recargar página: location.reload()');