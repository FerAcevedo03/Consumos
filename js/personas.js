import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tu configuración de Firebase
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
    const listaPersonas = document.getElementById("listaPersonas");
    const btnAgregar = document.getElementById("btnAgregar");
    const inputNuevo = document.getElementById("nuevoNombre");
    const buscadorNombres = document.getElementById("buscadorNombres"); 

    // 1. BLINDAJE: Verificamos que los botones existan en el HTML
    if (!listaPersonas || !btnAgregar || !inputNuevo) {
        console.error("Error: No se encontraron los campos en el HTML.");
        return; 
    }

    // 2. Detectar en qué página estamos (Profes, Alumnos o Admin)
    let tipo = document.body.getAttribute("data-tipo");
    
    // Si el HTML no tiene el data-tipo, lo deducimos por el nombre del archivo (Respaldo)
    if (!tipo) {
        if (window.location.href.includes("alumnos")) tipo = "alumnos";
        else if (window.location.href.includes("administrativos")) tipo = "administrativos";
        else tipo = "profesores"; 
    }

    let personas = [];

    // --- LECTURA EN TIEMPO REAL DESDE FIREBASE ---
    onSnapshot(collection(db, tipo), (snapshot) => {
        personas = [];
        snapshot.forEach((doc) => {
            // Guardamos el ID de Firebase y el nombre
            personas.push({ id: doc.id, nombre: doc.data().nombre });
        });
        
        // Ordenamos alfabéticamente
        personas.sort((a, b) => a.nombre.localeCompare(b.nombre));

        // Si hay texto en el buscador, mantenemos el filtro visual
        if (buscadorNombres && buscadorNombres.value.trim() !== "") {
            const textoBusqueda = buscadorNombres.value.toLowerCase().trim();
            const personasFiltradas = personas.filter(p => p.nombre.toLowerCase().includes(textoBusqueda));
            mostrarPersonas(personasFiltradas);
        } else {
            mostrarPersonas(personas);
        }
    });

    // Función para mostrar las tarjetas con tu diseño original
    function mostrarPersonas(personasAMostrar = personas) {
        listaPersonas.innerHTML = "";

        if (personasAMostrar.length === 0) {
            listaPersonas.innerHTML = `<div class="col-12 text-center text-muted mt-4"><i class="bi bi-search fs-3 d-block mb-2"></i> No se encontraron registros.</div>`;
            return;
        }

        personasAMostrar.forEach((persona) => {
            let col = document.createElement("div");
            col.className = "col-md-4";
            col.innerHTML = `
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-dark">${persona.nombre}</h5>
                        <p class="card-text flex-grow-1 text-muted small">Registrado en sistema.</p>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-primary btn-sm" onclick="verConsumo('${persona.nombre}', '${tipo}')"><i class="bi bi-bar-chart-fill"></i> Consumos</button>
                            <button class="btn btn-outline-danger btn-sm" onclick="eliminarPersona('${persona.id}')"><i class="bi bi-trash"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            listaPersonas.appendChild(col);
        });
    }

    // Evento del buscador en tiempo real
    if (buscadorNombres) {
        buscadorNombres.addEventListener("input", (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            const personasFiltradas = personas.filter(p => p.nombre.toLowerCase().includes(textoBusqueda));
            mostrarPersonas(personasFiltradas);
        });
    }

    // Agregar nueva persona a Firebase
    btnAgregar.addEventListener("click", agregarPersona);
    inputNuevo.addEventListener("keypress", (e) => { if (e.key === "Enter") agregarPersona(); });

    async function agregarPersona() {
        const nombre = inputNuevo.value.trim();
        if (nombre !== "") {
            btnAgregar.disabled = true;
            btnAgregar.innerHTML = "⏳...";

            try {
                await addDoc(collection(db, tipo), { nombre: nombre });
                inputNuevo.value = "";
                if (buscadorNombres) buscadorNombres.value = ""; 
            } catch (error) {
                alert("Error al conectar con la Nube: " + error.message);
            } finally {
                btnAgregar.disabled = false;
                btnAgregar.innerHTML = "➕ Añadir";
                inputNuevo.focus();
            }
        } else {
            alert("Por favor escribe un nombre válido.");
        }
    }

    // Eliminar persona de Firebase
    window.eliminarPersona = async (idFirebase) => {
        if(confirm("¿Seguro que deseas eliminar este registro? (Se mantendrá su historial de consumos guardado)")) {
            try {
                await deleteDoc(doc(db, tipo, idFirebase));
            } catch (error) {
                alert("Error al eliminar: " + error.message);
            }
        }
    };

    // Redirigir a consumos
    window.verConsumo = (nombre, rol) => {
        window.location.href = `consumo.html?nombre=${encodeURIComponent(nombre)}&rol=${encodeURIComponent(rol)}`;
    };
});