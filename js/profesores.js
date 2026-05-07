import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBuXHMvdHZbJLoo-SakENFEcUvlECJvTRA",
    authDomain: "quiosco-nobel-school.firebaseapp.com",
    projectId: "quiosco-nobel-school",
    storageBucket: "quiosco-nobel-school.firebasestorage.app",
    messagingSenderId: "448413136914",
    appId: "1:448413136914:web:426e8fc48a8e24ea96c0cb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    const formRegistro = document.getElementById("formRegistro");
    const inputNombre = document.getElementById("inputNombre");
    const listaPersonas = document.getElementById("listaPersonas");

    onSnapshot(collection(db, "profesores"), (snapshot) => {
        const profesores = [];
        snapshot.forEach((doc) => {
            profesores.push({ id: doc.id, ...doc.data() });
        });
        renderizarLista(profesores);
    });

    function renderizarLista(lista) {
        listaPersonas.innerHTML = "";
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach((profe) => {
            const div = document.createElement("div");
            div.className = "col-12 col-md-6 col-lg-4 mb-3";
            div.innerHTML = `
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <a href="consumo.html?nombre=${encodeURIComponent(profe.nombre)}&rol=profesores" class="text-decoration-none text-dark fw-bold flex-grow-1">
                            <i class="bi bi-person-workspace text-primary me-2"></i> ${profe.nombre}
                        </a>
                        <button class="btn btn-outline-danger btn-sm border-0" onclick="eliminarPersona('${profe.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            listaPersonas.appendChild(div);
        });
    }

    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = inputNombre.value.trim();
        if (!nombre) return;
        try {
            await addDoc(collection(db, "profesores"), { nombre: nombre });
            inputNombre.value = "";
        } catch (error) { console.error(error); }
    });

    window.eliminarPersona = async (id) => {
        if (confirm("¿Eliminar a este profesor?")) {
            await deleteDoc(doc(db, "profesores", id));
        }
    };
});