// ================================
// CONFIGURACIÓN FIREBASE V8
// ================================

// Configuración de Firebase para el proyecto PQRS
const firebaseConfig = {
    apiKey: "AIzaSyATgK5vpZ5Kr2X9b-iXibqwoF4VBX2bh1U",
    authDomain: "pqrs-457c0.firebaseapp.com",
    databaseURL: "https://pqrs-457c0-default-rtdb.firebaseio.com",
    projectId: "pqrs-457c0",
    storageBucket: "pqrs-457c0.firebasestorage.app",
    messagingSenderId: "291174163284",
    appId: "1:291174163284:web:b9d637ca17503617d9dec1",
    measurementId: "G-KFGX77GGHX"
};

// Inicializar Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (error) {
    console.error("Error inicializando Firebase:", error);
}

// Obtener referencias a los servicios
const database = firebase.database();
const auth = firebase.auth();

// ================================
// UTILIDADES FIREBASE
// ================================

/**
 * Función para verificar la conexión a Firebase
 */
async function checkFirebaseConnection() {
    try {
        const connectedRef = database.ref(".info/connected");
        connectedRef.on("value", function(snap) {
            if (snap.val() === true) {
                console.log("✅ Conectado a Firebase");
                updateConnectionStatus(true);
            } else {
                console.log("⚠️ Desconectado de Firebase");
                updateConnectionStatus(false);
            }
        });

        return true;
    } catch (error) {
        console.error("❌ Error de conexión Firebase:", error);
        updateConnectionStatus(false);
        return false;
    }
}

/**
 * Actualizar estado de conexión en la interfaz
 */
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = connected ? '🟢 Conectado' : '🔴 Desconectado';
        statusElement.className = connected ? 'status-connected' : 'status-disconnected';
    }
}

/**
 * Función para obtener timestamp de Firebase
 */
function getFirebaseTimestamp() {
    return firebase.database.ServerValue.TIMESTAMP;
}

/**
 * Función para generar un ID único
 */
function generateUniqueId() {
    return database.ref().push().key;
}

/**
 * Validar estructura de datos antes de guardar
 */
function validateReportData(data) {
    const requiredFields = [
        'tipo_reporte',
        'cliente',
        'nombre_reportante',
        'correo_reportante',
        'fecha_reporte'
    ];

    const errors = [];

    // Verificar campos requeridos
    requiredFields.forEach(field => {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`El campo ${field} es requerido`);
        }
    });

    // Validar formato de email
    if (data.correo_reportante) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.correo_reportante)) {
            errors.push('El correo electrónico no tiene un formato válido');
        }
    }

    // Validar fecha (no puede ser futura)
    if (data.fecha_reporte) {
        const reportDate = new Date(data.fecha_reporte);
        const today = new Date();
        if (reportDate > today) {
            errors.push('La fecha del reporte no puede ser futura');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Formatear datos para Firebase
 */
function formatDataForFirebase(data) {
    return {
        ...data,
        fecha_creacion: getFirebaseTimestamp(),
        fecha_actualizacion: getFirebaseTimestamp(),
        estado: data.estado || 'Pendiente',
        notificaciones: {
            admin_notificado: false,
            usuario_notificado: false,
            intentos: 0
        }
    };
}

/**
 * Manejar errores de Firebase
 */
function handleFirebaseError(error, context = '') {
    console.error(`❌ Error Firebase ${context}:`, error);

    const errorMessages = {
        'permission-denied': 'No tiene permisos para realizar esta acción',
        'unavailable': 'El servicio no está disponible. Intente nuevamente',
        'network-error': 'Error de red. Verifique su conexión a internet',
        'invalid-argument': 'Datos inválidos proporcionados',
        'not-found': 'El recurso solicitado no existe',
        'already-exists': 'El registro ya existe',
        'resource-exhausted': 'Límite de recursos excedido',
        'failed-precondition': 'Operación no permitida en este estado',
        'aborted': 'Operación cancelada',
        'out-of-range': 'Valor fuera de rango',
        'unimplemented': 'Operación no implementada',
        'internal': 'Error interno del servidor',
        'data-loss': 'Pérdida de datos',
        'unauthenticated': 'No autenticado. Inicie sesión nuevamente'
    };

    const message = errorMessages[error.code] || error.message || 'Error desconocido';

    return {
        success: false,
        error: message,
        code: error.code
    };
}

/**
 * Log de auditoría
 */
async function logAuditAction(action, details = {}, userId = null) {
    try {
        const auditData = {
            action: action,
            details: details,
            userId: userId || (auth.currentUser ? auth.currentUser.uid : 'anonymous'),
            timestamp: getFirebaseTimestamp(),
            userAgent: navigator.userAgent,
            ip: '127.0.0.1' // En producción esto vendría del servidor
        };

        await database.ref('audit_logs').push(auditData);
        console.log(`📝 Auditoría registrada: ${action}`);
    } catch (error) {
        console.error('Error registrando auditoría:', error);
    }
}

/**
 * Limpiar datos antiguos (más de 2 años)
 */
async function cleanupOldData() {
    try {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const reportsRef = database.ref('pqrs_reports');
        const snapshot = await reportsRef
            .orderByChild('fecha_creacion')
            .endAt(twoYearsAgo.getTime())
            .once('value');

        const updates = {};
        snapshot.forEach((childSnapshot) => {
            updates[`archived_reports/${childSnapshot.key}`] = childSnapshot.val();
            updates[`pqrs_reports/${childSnapshot.key}`] = null;
        });

        if (Object.keys(updates).length > 0) {
            await database.ref().update(updates);
            console.log(`🗑️ Archivos antiguos limpiados: ${Object.keys(updates).length / 2} registros`);
        }
    } catch (error) {
        console.error('Error limpiando datos antiguos:', error);
    }
}

/**
 * Función para backup de datos
 */
async function createBackup() {
    try {
        const reportsRef = database.ref('pqrs_reports');
        const snapshot = await reportsRef.once('value');
        const data = snapshot.val();

        // Crear backup en storage
        const backupData = {
            data: data,
            timestamp: getFirebaseTimestamp(),
            totalRecords: snapshot.numChildren()
        };

        await database.ref('backups').push(backupData);
        console.log('✅ Backup creado exitosamente');

        return {
            success: true,
            totalRecords: snapshot.numChildren(),
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error creando backup:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Configurar listeners para cambios en tiempo real
 */
function setupRealtimeListeners(callbacks = {}) {
    const listeners = {};

    // Listener para nuevos reportes
    if (callbacks.onNewReport) {
        listeners.reports = database.ref('pqrs_reports')
            .orderByChild('fecha_creacion')
            .limitToLast(1)
            .on('child_added', (snapshot) => {
                callbacks.onNewReport(snapshot.val(), snapshot.key);
            });
    }

    // Listener para cambios de estado
    if (callbacks.onStatusChange) {
        listeners.status = database.ref('pqrs_reports')
            .on('child_changed', (snapshot) => {
                const newData = snapshot.val();
                const oldData = snapshot.previous.val();

                if (newData.estado !== oldData?.estado) {
                    callbacks.onStatusChange(newData, oldData, snapshot.key);
                }
            });
    }

    // Listener para contador de reportes
    if (callbacks.onCountUpdate) {
        listeners.count = database.ref('pqrs_reports')
            .on('value', (snapshot) => {
                callbacks.onCountUpdate(snapshot.numChildren());
            });
    }

    return listeners;
}

/**
 * Remover listeners
 */
function removeRealtimeListeners(listeners) {
    Object.keys(listeners).forEach(key => {
        if (listeners[key]) {
            database.ref('pqrs_reports').off(listeners[key]);
        }
    });
}

/**
 * Verificar si el usuario es administrador
 */
function isAdminUser(user) {
    const adminEmails = [
        'admin@transportehb.com.co',
        'supervisor@transportehb.com.co',
        'gerencia@transportehb.com.co'
    ];

    return user && user.email && adminEmails.includes(user.email);
}

/**
 * Middleware para operaciones admin
 */
async function requireAdmin(callback) {
    const user = auth.currentUser;

    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    if (!isAdminUser(user)) {
        throw new Error('Permisos insuficientes');
    }

    try {
        return await callback(user);
    } catch (error) {
        throw error;
    }
}

// ================================
// EXPORTAR FUNCIONES
// ================================

// Hacer funciones disponibles globalmente
window.firebaseUtils = {
    checkFirebaseConnection,
    getFirebaseTimestamp,
    generateUniqueId,
    validateReportData,
    formatDataForFirebase,
    handleFirebaseError,
    logAuditAction,
    cleanupOldData,
    createBackup,
    setupRealtimeListeners,
    removeRealtimeListeners,
    isAdminUser,
    requireAdmin
};

// ================================
// INICIALIZACIÓN
// ================================

// Verificar conexión al cargar
document.addEventListener('DOMContentLoaded', function() {
    checkFirebaseConnection();

    // Configurar reconexión automática
    setInterval(checkFirebaseConnection, 30000); // Cada 30 segundos
});

// Manejar errores globales de Firebase
window.addEventListener('firebase-error', function(event) {
    console.error('Error global Firebase:', event.detail);

    // Mostrar notificación al usuario
    if (typeof showNotification === 'function') {
        showNotification('Error del sistema: ' + event.detail.message, 'error');
    }
});

const ADMIN_EMAIL = "pqrsf@transportehb.com.co";
