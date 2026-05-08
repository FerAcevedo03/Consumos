import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Llave publica por el candado de fire base
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

// revisar si el usuario tiene permiso 
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // si no hay usuario lo regresa a la pag principal
        window.location.replace("login.html");
    }
});

// cerrar sesion 
window.cerrarSesion = () => {
    if(confirm("¿Estás seguro de que deseas salir del sistema?")) {
        signOut(auth).then(() => {
            window.location.replace("login.html");
        });
    }
};
