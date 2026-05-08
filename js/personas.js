import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// config de fire base
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

    // 1. BLINDAJE
    if (!listaPersonas || !btnAgregar || !inputNuevo) {
        console.error("Error: No se encontraron los campos en el HTML.");
        return; 
    }

    // 2. Detectar en qué página estamos (Profes, Alumnos o Admin)
    let tipo = document.body.getAttribute("data-tipo");
    if (!tipo) {
        if (window.location.href.includes("alumnos")) tipo = "alumnos";
        else if (window.location.href.includes("administrativos")) tipo = "administrativos";
        else tipo = "profesores"; 
    }

    // adaptacion de colores segun el rol designado
    let colorClase = "text-warning";
    let btnClase = "btn-primary"; // Botón de consumos
    let iconoClase = "bi-mortarboard-fill";
    
    if (tipo === "profesores") {
        colorClase = "text-primary";
        btnClase = "btn-primary";
        iconoClase = "bi-person-workspace";
    } else if (tipo === "administrativos") {
        colorClase = "text-success";
        btnClase = "btn-success";
        iconoClase = "bi-person-badge-fill";
    }

    let personas = [];

    // lectura en la base de datos en tiempo real 
    onSnapshot(collection(db, tipo), (snapshot) => {
        personas = [];
        snapshot.forEach((doc) => {
            personas.push({ id: doc.id, nombre: doc.data().nombre });
        });
        
        personas.sort((a, b) => a.nombre.localeCompare(b.nombre));

        if (buscadorNombres && buscadorNombres.value.trim() !== "") {
            const textoBusqueda = buscadorNombres.value.toLowerCase().trim();
            const personasFiltradas = personas.filter(p => p.nombre.toLowerCase().includes(textoBusqueda));
            mostrarPersonas(personasFiltradas);
        } else {
            mostrarPersonas(personas);
        }
    });

    // funcion para las tarjetas
    function mostrarPersonas(personasAMostrar = personas) {
        listaPersonas.innerHTML = "";

        if (personasAMostrar.length === 0) {
            listaPersonas.innerHTML = `<div class="col-12 text-center text-muted mt-4"><i class="bi bi-search fs-3 d-block mb-2"></i> No se encontraron registros.</div>`;
            return;
        }

        personasAMostrar.forEach((persona) => {
            let col = document.createElement("div");
            col.className = "col-12 col-md-6 col-lg-4 mb-3";
            col.innerHTML = `
                <div class="card card-persona shadow-sm border-0 h-100 rounded-4">
                    <div class="card-body p-4 position-relative">
                        <button class="btn btn-sm btn-light position-absolute top-0 end-0 mt-2 me-2 rounded-circle shadow-sm text-primary" 
                                onclick="editarNombrePersona('${persona.id}', '${persona.nombre}')" title="Modificar Nombre">
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <div class="d-flex align-items-center mb-3">
                            <div class="icono-avatar me-3 shadow-sm" style="background-color: #f8f9fa;">
                                <i class="bi ${iconoClase} ${colorClase}"></i>
                            </div>
                            <div>
                                <h5 class="fw-bold mb-0 text-dark text-capitalize lh-1" style="font-size: 1.15rem;">${persona.nombre}</h5>
                                <small class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-check-circle-fill text-success me-1"></i>Registrado en sistema</small>
                            </div>
                        </div>
                        
                        <div class="d-flex justify-content-between gap-2 mt-3 pt-3 border-top" style="border-color: #f1f5f9 !important;">
                            <button class="btn ${btnClase} btn-sm rounded-3 px-3 flex-grow-1 fw-bold shadow-sm" onclick="verConsumo('${persona.nombre}', '${tipo}')">
                                <i class="bi bi-bar-chart-fill me-1"></i> Consumos
                            </button>
                            <button class="btn btn-outline-danger btn-sm rounded-3 px-3 fw-bold" onclick="eliminarPersona('${persona.id}', '${persona.nombre}')" title="Eliminar">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            listaPersonas.appendChild(col);
        });
    }

    // buscador en tiempo real
    if (buscadorNombres) {
        buscadorNombres.addEventListener("input", (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            const personasFiltradas = personas.filter(p => p.nombre.toLowerCase().includes(textoBusqueda));
            mostrarPersonas(personasFiltradas);
        });
    }

    // agregar a nuevos usuarios 
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

    // editacion de nombre
    window.editarNombrePersona = async (idDocumento, nombreAntiguo) => {
        const nuevoNombre = prompt(
            `Editando a: ${nombreAntiguo}\n\nEscribe el nuevo nombre exacto. \n(El sistema actualizará todos sus recibos y pagos antiguos a este nuevo nombre de forma segura):`, 
            nombreAntiguo
        );

        if (!nuevoNombre || nuevoNombre.trim() === "" || nuevoNombre.trim() === nombreAntiguo) {
            return;
        }

        const nombreFinal = nuevoNombre.trim();

        if (confirm(`¿Confirmas que deseas cambiar a "${nombreAntiguo}" por "${nombreFinal}"?`)) {
            try {
                // 1. se actualiza el nombre
                await updateDoc(doc(db, tipo, idDocumento), { nombre: nombreFinal });

                // 2. se busca y actualiza sus consumos
                const qConsumos = query(collection(db, "consumos"), where("nombreUsuario", "==", nombreAntiguo));
                const snapConsumos = await getDocs(qConsumos);
                snapConsumos.forEach(async (docSnap) => {
                    await updateDoc(doc(db, "consumos", docSnap.id), { nombreUsuario: nombreFinal });
                });

                // 3. busca y actualiza pagos
                const qPagos = query(collection(db, "pagos"), where("nombreUsuario", "==", nombreAntiguo));
                const snapPagos = await getDocs(qPagos);
                snapPagos.forEach(async (docSnap) => {
                    await updateDoc(doc(db, "pagos", docSnap.id), { nombreUsuario: nombreFinal });
                });

                
            } catch (error) {
                alert("Ocurrió un error al actualizar los datos: " + error.message);
            }
        }
    };

    // eliminar persona de Firebase
    window.eliminarPersona = async (idFirebase, nombre) => {
        if(confirm(`¿Seguro que deseas eliminar a ${nombre} de esta lista?\n(Se mantendrá su historial de consumos guardado en la base de datos)`)) {
            try {
                await deleteDoc(doc(db, tipo, idFirebase));
            } catch (error) {
                alert("Error al eliminar: " + error.message);
            }
        }
    };

    // redirigir a consumos
    window.verConsumo = (nombre, rol) => {
        window.location.href = `consumo.html?nombre=${encodeURIComponent(nombre)}&rol=${encodeURIComponent(rol)}`;
    };
});
