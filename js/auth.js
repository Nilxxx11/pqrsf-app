// Manejo de autenticación
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // Iniciar sesión con Firebase Auth
                await auth.signInWithEmailAndPassword(email, password);
                
                // Redirigir al panel de administración
                window.location.href = 'admin.html';
                
            } catch (error) {
                // Mostrar mensaje de error
                let errorMsg = 'Error al iniciar sesión. ';
                
                switch(error.code) {
                    case 'auth/user-not-found':
                        errorMsg += 'Usuario no encontrado.';
                        break;
                    case 'auth/wrong-password':
                        errorMsg += 'Contraseña incorrecta.';
                        break;
                    case 'auth/invalid-email':
                        errorMsg += 'Correo electrónico no válido.';
                        break;
                    case 'auth/user-disabled':
                        errorMsg += 'Esta cuenta ha sido deshabilitada.';
                        break;
                    default:
                        errorMsg += error.message;
                }
                
                errorText.textContent = errorMsg;
                errorMessage.style.display = 'block';
                
                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 5000);
            }
        });
    }
});

// Función para cerrar sesión
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error al cerrar sesión:', error);
        });
}