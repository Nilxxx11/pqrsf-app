// Configuración de Firebase
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
firebase.initializeApp(firebaseConfig);

// Referencias a los servicios de Firebase
const auth = firebase.auth();
const database = firebase.database();

// Verificar estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('login.html')) {
        // Si está autenticado y en la página de login, redirigir al admin
        window.location.href = 'admin.html';
    } else if (!user && window.location.pathname.includes('admin.html')) {
        // Si no está autenticado y en el admin, redirigir al login
        window.location.href = 'login.html';
    }
});