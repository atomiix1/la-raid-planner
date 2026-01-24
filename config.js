// Configuración de Firebase
// IMPORTANTE: Reemplaza esto con tus credenciales de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC61vsWUjfVHQOFuejgmXl9Lk4ZEKNQr04",
    authDomain: "la-planner.firebaseapp.com",
    databaseURL: "https://la-planner-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "la-planner",
    storageBucket: "la-planner.firebasestorage.app",
    messagingSenderId: "922350103987",
    appId: "1:922350103987:web:a546e04e3b57b867bc6fc6"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
