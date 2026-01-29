# 🚀 Sistema de PQRS - HB Transporte

Aplicación web completa para la gestión de Peticiones, Quejas, Reclamos y Sugerencias (PQRS) para empresas de transporte, desarrollada con Firebase.

## 📋 Características Principales

### 🎯 Formulario Público
- **5 tipos de reporte**: Quejas, Peticiones, Reclamos, Felicitaciones, Sugerencias
- **Formularios dinámicos**: Campos específicos según el tipo de reporte
- **Diseño responsive**: Optimizado para móviles y escritorio
- **Validación en tiempo real**: Comprobación de datos antes del envío
- **Confirmación por correo**: Notificación automática al usuario

### 🔐 Panel de Administración
- **Autenticación segura**: Acceso restringido con Firebase Auth
- **Gestión completa**: Ver, filtrar, editar y eliminar reportes
- **Estadísticas avanzadas**: Gráficos y análisis con Chart.js
- **Exportación de datos**: CSV, Excel y PDF (básico)
- **Notificaciones en tiempo real**: Sistema de alertas integrado
- **Comentarios internos**: Sistema de comunicación entre administradores

### 📧 Notificaciones Automáticas
- **Confirmación al usuario**: Al crear un reporte
- **Alerta al administrador**: Nuevos reportes
- **Actualizaciones de estado**: Cuando cambia el estado de un reporte
- **Reportes diarios**: Resumen estadístico automático
- **Sistema de reintentos**: Para casos de fallo en envío

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Firebase SDK v8 (Auth, Realtime Database)
- Chart.js para gráficos estadísticos
- Font Awesome para iconos
- Diseño responsive con CSS Grid y Flexbox

### Backend
- Firebase Realtime Database
- Firebase Authentication
- Cloud Functions (Node.js)
- Nodemailer para envío de correos

### Hosting
- Firebase Hosting
- Dominio personalizado (opcional)

## 📁 Estructura del Proyecto
