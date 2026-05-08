import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Tu llave pública (Es seguro tenerla aquí porque ya echamos el candado en Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyBuXHMvdHZbJLoo-SakENFEcUvlECJvTRA",
    authDomain: "quiosco-nobel-school.firebaseapp.com",
    projectId: "quiosco-nobel-school",
    storageBucket: "quiosco-nobel-school.firebasestorage.app",
    messagingSenderId: "448413136914",
    appId: "1:448413136914:web:426e8fc48a8e24ea96c0cb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// EL GUARDIÁN: Revisa constantemente si el usuario tiene permiso
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Si no hay usuario registrado, lo patea a la pantalla de login sin preguntar
        window.location.replace("login.html");
    }
});

// Función para poder cerrar sesión cuando terminas de trabajar
window.cerrarSesion = () => {
    if(confirm("¿Estás seguro de que deseas salir del sistema?")) {
        signOut(auth).then(() => {
            window.location.replace("login.html");
        });
    }
};