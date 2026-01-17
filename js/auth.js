import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Verificar autenticación al cargar la página
onAuthStateChanged(auth, (user) => {
    if (window.location.pathname.includes('admin.html')) {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            document.getElementById('userEmail').textContent = user.email;
        }
    }
});

// Función para iniciar sesión
export async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Función para cerrar sesión
export async function logout() {
    try {
        await signOut(auth);
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Configurar botón de logout
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});