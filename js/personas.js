import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
    const tipo = document.body.getAttribute("data-tipo") || "alumnos";
    const listaPersonas = document.getElementById("listaPersonas");
    const buscadorNombres = document.getElementById("buscadorNombres");
    const btnAgregarModal = document.getElementById("btnAgregarModal");

    let personasDB = [];

    // Configuramos colores según si es alumno, profesor o administrativo
    let colorFondo = "#ffc107", colorIcono = "#000", iconoHtml = "bi-mortarboard-fill", btnTheme = "btn-warning";
    if (tipo === "profesores") { colorFondo = "#0d6efd"; colorIcono = "#fff"; iconoHtml = "bi-person-workspace"; btnTheme = "btn-primary"; }
    else if (tipo === "administrativos") { colorFondo = "#198754"; colorIcono = "#fff"; iconoHtml = "bi-person-badge-fill"; btnTheme = "btn-success"; }

    // 1. LECTURA EN TIEMPO REAL DESDE FIREBASE
    onSnapshot(query(collection(db, tipo)), (snap) => {
        personasDB = [];
        snap.forEach(doc => personasDB.push({ id: doc.id, ...doc.data() }));
        
        // SOLUCIÓN AL CARGADO INFINITO: Evitar que choque si un documento no tiene nombre
        personasDB.sort((a, b) => {
            const nombreA = a.nombre || "";
            const nombreB = b.nombre || "";
            return nombreA.localeCompare(nombreB);
        });

        renderizarPersonas();
    }, (error) => {
        Swal.fire('Error de conexión', 'No se pudo conectar con la base de datos.', 'error');
        if (listaPersonas) listaPersonas.innerHTML = `<div class="col-12 text-center py-5 text-danger"><i class="bi bi-x-circle fs-1"></i><p class="mt-2">Error al cargar datos.</p></div>`;
    });

    if (buscadorNombres) {
        buscadorNombres.addEventListener("input", renderizarPersonas);
    }

    function renderizarPersonas() {
        if (!listaPersonas) return;
        listaPersonas.innerHTML = "";
        
        const textoBusqueda = buscadorNombres ? buscadorNombres.value.toLowerCase() : "";
        const filtrados = personasDB.filter(p => (p.nombre || "").toLowerCase().includes(textoBusqueda));

        if (filtrados.length === 0) {
            listaPersonas.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-search fs-1"></i><p class="mt-2">No se encontraron resultados en esta lista.</p></div>`;
            return;
        }

        filtrados.forEach(p => {
            const div = document.createElement("div");
            div.className = "col-12 col-md-6 col-lg-4";
            div.innerHTML = `
              <div class="card h-100 shadow-sm border-0 rounded-4 card-persona" style="background-color: var(--bs-card-bg);">
                <div class="card-body p-4 position-relative">
                  <button class="btn btn-sm text-primary position-absolute top-0 end-0 m-3 bg-light rounded-circle shadow-sm d-flex align-items-center justify-content-center" onclick="window.editarPersona('${p.id}', '${p.nombre}')" style="width: 32px; height: 32px; border: 1px solid #dee2e6;"><i class="bi bi-pencil-fill"></i></button>

                  <div class="d-flex align-items-center mb-4 mt-2">
                    <div class="rounded-circle d-flex justify-content-center align-items-center me-3 shadow-sm flex-shrink-0" style="width: 48px; height: 48px; background-color: ${colorFondo}; color: ${colorIcono};">
                      <i class="${iconoHtml} fs-4"></i>
                    </div>
                    <div>
                      <h5 class="fw-bold mb-0 text-body-emphasis text-truncate" style="max-width: 180px;">${p.nombre}</h5>
                      <small class="text-success fw-bold d-flex align-items-center" style="font-size: 0.75rem;"><i class="bi bi-check-circle-fill me-1"></i>Registrado en sistema</small>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button class="btn ${btnTheme} w-100 fw-bold shadow-sm rounded-pill py-2" onclick="window.irAConsumo('${p.nombre}', '${tipo}')"><i class="bi bi-bar-chart-fill me-1"></i> Consumos</button>
                    <button class="btn btn-outline-danger shadow-sm rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;" onclick="window.eliminarPersona('${p.id}', '${p.nombre}')"><i class="bi bi-trash3-fill"></i></button>
                  </div>
                </div>
              </div>
            `;
            listaPersonas.appendChild(div);
        });
    }

    // 2. AÑADIR NUEVO CON ALERTA ANIMADA (SWEETALERT2)
    if (btnAgregarModal) {
        btnAgregarModal.onclick = async () => {
            const { value: nombreNuevo } = await Swal.fire({
                title: `Añadir Nuevo`,
                text: "Escribe el nombre completo",
                input: 'text',
                inputPlaceholder: 'Ej: Juan Pérez',
                icon: 'person-add',
                showCancelButton: true,
                confirmButtonColor: colorFondo,
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="bi bi-save"></i> Guardar',
                cancelButtonText: 'Cancelar',
                customClass: { confirmButton: tipo === 'alumnos' ? 'text-dark' : 'text-white' },
                inputValidator: (value) => {
                    if (!value || value.trim() === '') return '¡Necesitas escribir un nombre!';
                }
            });

            if (nombreNuevo) {
                let nombreFormateado = nombreNuevo.trim().split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');
                
                const existe = personasDB.some(p => (p.nombre || "").toLowerCase() === nombreFormateado.toLowerCase());
                if (existe) {
                    Swal.fire('Atención', `<b>${nombreFormateado}</b> ya está registrado.`, 'warning');
                    return;
                }

                try {
                    await addDoc(collection(db, tipo), { nombre: nombreFormateado, timestamp: Date.now() });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registrado con éxito', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        };
    }

    window.irAConsumo = (nombre, rol) => {
        window.location.href = `consumo.html?nombre=${encodeURIComponent(nombre)}&rol=${encodeURIComponent(rol)}`;
    };

    // 3. ELIMINAR CON ALERTA ANIMADA DE CONFIRMACIÓN
    window.eliminarPersona = (id, nombre) => {
        Swal.fire({
            title: '¿Eliminar persona?',
            html: `¿Estás seguro de que deseas eliminar a <b>${nombre}</b>?<br><small class="text-danger">Se borrará de esta lista, pero sus consumos en el historial se mantendrán a salvo.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash3-fill"></i> Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, tipo, id));
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Eliminado', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    // 4. EDITAR CON ALERTA ANIMADA
    window.editarPersona = async (id, nombreViejo) => {
        const { value: nombreEditado } = await Swal.fire({
            title: `Editar Nombre`,
            input: 'text',
            inputValue: nombreViejo,
            showCancelButton: true,
            confirmButtonColor: '#0d6efd',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-save"></i> Actualizar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value || value.trim() === '') return '¡El nombre no puede estar vacío!'
            }
        });

        if (nombreEditado && nombreEditado.trim() !== nombreViejo) {
            let nombreFormateado = nombreEditado.trim().split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');
            
            const existe = personasDB.some(p => (p.nombre || "").toLowerCase() === nombreFormateado.toLowerCase() && p.id !== id);
            if (existe) {
                Swal.fire('Atención', `Ya existe otra persona llamada <b>${nombreFormateado}</b>.`, 'warning');
                return;
            }

            try {
                await updateDoc(doc(db, tipo, id), { nombre: nombreFormateado });
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Nombre actualizado', showConfirmButton: false, timer: 2000 });
            } catch (e) {
                Swal.fire('Error', e.message, 'error');
            }
        }
    };
});