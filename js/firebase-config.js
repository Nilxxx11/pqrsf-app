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

// Referencias globales
const database = firebase.database();
const auth = firebase.auth();

// Credenciales del administrador predefinido
const ADMIN_CREDENTIALS = {
    email: "admin@empresa.com",
    password: "Admin123!"
};
