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

    // Configuración de temas
    let colorFondo = "#ffc107", colorIcono = "#000", iconoHtml = "bi-mortarboard-fill", btnTheme = "btn-warning";
    let textColor = "color: #000000 !important;"; // Texto negro por defecto (para alumnos)

    if (tipo === "profesores") {
        colorFondo = "#0d6efd"; colorIcono = "#fff"; iconoHtml = "bi-person-workspace"; btnTheme = "btn-primary";
        textColor = "color: #ffffff !important;"; // Texto blanco para profesores
    }
    else if (tipo === "administrativos") {
        colorFondo = "#198754"; colorIcono = "#fff"; iconoHtml = "bi-person-badge-fill"; btnTheme = "btn-success";
        textColor = "color: #ffffff !important;"; // Texto blanco para personal
    }

    onSnapshot(query(collection(db, tipo)), (snap) => {
        personasDB = [];
        snap.forEach(doc => personasDB.push({ id: doc.id, ...doc.data() }));

        personasDB.sort((a, b) => {
            const nombreA = a.nombre || "";
            const nombreB = b.nombre || "";
            return nombreA.localeCompare(nombreB);
        });

        renderizarPersonas();
    }, (error) => {
        Swal.fire({
            icon: 'error',
            title: '<h3 class="fw-bold">Error de conexión</h3>',
            text: 'No se pudo conectar con la base de datos.',
            confirmButtonColor: '#dc3545'
        });
        if (listaPersonas) listaPersonas.innerHTML = `<div class="col-12 text-center py-5 text-danger"><i class="bi bi-x-circle fs-1"></i><p class="mt-2 fs-5">Error al cargar datos.</p></div>`;
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
            listaPersonas.innerHTML = `<div class="col-12 text-center py-5 text-muted"><i class="bi bi-search" style="font-size: 3rem;"></i><p class="mt-3 fs-5">No se encontraron resultados.</p></div>`;
            return;
        }

        filtrados.forEach(p => {
            const div = document.createElement("div");
            div.className = "col-12 col-md-6 col-lg-4";

            div.innerHTML = `
              <div class="card h-100 border-0 rounded-4 card-persona transition-all hover-lift">
                <div class="card-body p-4 d-flex flex-column position-relative">
                  
                  <button class="btn btn-sm btn-soft-edit position-absolute top-0 end-0 m-3 rounded-circle d-flex align-items-center justify-content-center border-0" onclick="window.editarPersona('${p.id}', '${p.nombre}')" style="width: 42px; height: 42px; z-index: 2;" title="Editar Nombre">
                    <i class="bi bi-pencil-fill fs-5"></i>
                  </button>

                  <div class="d-flex align-items-center mb-4 mt-1 pe-5">
                    <div class="rounded-circle d-flex justify-content-center align-items-center me-4 flex-shrink-0 avatar-glow" style="width: 65px; height: 65px; background-color: ${colorFondo}; color: ${colorIcono};">
                      <i class="${iconoHtml} fs-2"></i>
                    </div>
                    <div style="min-width: 0;">
                      <!-- Se fuerza que en modo oscuro el texto principal no se pierda -->
                      <h4 class="fw-bolder mb-1 text-truncate" style="letter-spacing: -0.5px; color: var(--bs-body-color);">${p.nombre}</h4>
                      <div class="d-flex align-items-center mt-1">
                        <span class="status-dot me-2"></span>
                        <span class="text-muted fw-semibold" style="font-size: 0.9rem;">En sistema</span>
                      </div>
                    </div>
                  </div>

                  <div class="d-flex gap-2 mt-auto">
                    <!-- Se inyecta la variable textColor directamente al atributo style -->
                    <button class="btn ${btnTheme} w-100 fw-bold rounded-pill py-2 fs-5 shadow-sm btn-consumos-hover" style="${textColor}" onclick="window.irAConsumo('${p.nombre}', '${tipo}')">
                        <i class="bi bi-bar-chart-fill me-1"></i> Consumos
                    </button>
                    <button class="btn btn-soft-danger rounded-circle flex-shrink-0 d-flex align-items-center justify-content-center border-0" style="width: 50px; height: 50px;" onclick="window.eliminarPersona('${p.id}', '${p.nombre}')" title="Eliminar">
                        <i class="bi bi-trash3-fill fs-5"></i>
                    </button>
                  </div>

                </div>
              </div>
            `;
            listaPersonas.appendChild(div);
        });
    }

    // AÑADIR USUARIO
    if (btnAgregarModal) {
        btnAgregarModal.onclick = async () => {
            const { value: nombreNuevo } = await Swal.fire({
                title: `<h2 class="fw-bold mb-0">Añadir registro</h2>`,
                html: `
                    <p class="text-muted fs-5 mb-4">Ingresa el nombre completo:</p>
                    <input id="swal-input-nombre" class="swal2-input w-75 rounded-4 fs-4 fw-medium text-center" autocomplete="off" placeholder="Nombre completo...">
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: `<i class="bi bi-save me-2"></i><span class="fs-5">Guardar</span>`,
                cancelButtonText: '<span class="fs-5">Cancelar</span>',
                customClass: {
                    popup: 'rounded-4 shadow-lg py-4',
                    confirmButton: 'btn btn-lg rounded-pill px-5 fw-bold border-0',
                    cancelButton: 'btn btn-lg rounded-pill px-5 fw-bold border-0'
                },
                didOpen: () => {
                    const confirmBtn = Swal.getConfirmButton();
                    confirmBtn.style.cssText = `background-color: ${colorFondo} !important; ${textColor}`;
                },
                preConfirm: () => {
                    const inputVal = document.getElementById('swal-input-nombre').value.trim();
                    if (!inputVal) {
                        Swal.showValidationMessage('Se requiere un nombre válido');
                    }
                    return inputVal;
                }
            });

            if (nombreNuevo) {
                let nombreFormateado = nombreNuevo.trim().split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');

                const existe = personasDB.some(p => (p.nombre || "").toLowerCase() === nombreFormateado.toLowerCase());
                if (existe) {
                    Swal.fire({
                        icon: 'warning',
                        title: '<h3 class="fw-bold">Registro duplicado</h3>',
                        html: `<p class="fs-5">El nombre <b>${nombreFormateado}</b> ya figura en el sistema.</p>`,
                        customClass: { confirmButton: 'btn btn-lg rounded-pill px-5 fw-bold border-0' },
                        didOpen: () => {
                            const confirmBtn = Swal.getConfirmButton();
                            confirmBtn.style.cssText = `background-color: ${colorFondo} !important; ${textColor}`;
                        }
                    });
                    return;
                }

                try {
                    await addDoc(collection(db, tipo), { nombre: nombreFormateado, timestamp: Date.now() });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro completado', showConfirmButton: false, timer: 2500 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        };
    }

    window.irAConsumo = (nombre, rol) => {
        window.location.href = `consumo.html?nombre=${encodeURIComponent(nombre)}&rol=${encodeURIComponent(rol)}`;
    };

    // ELIMINAR USUARIO
    window.eliminarPersona = (id, nombre) => {
        Swal.fire({
            title: `<h2 class="fw-bold text-danger mb-0">Confirmar eliminación</h2>`,
            html: `<p class="fs-5 mt-3">Estás a punto de borrar el registro de <b>${nombre}</b>.</p>
                   <small class="text-danger fw-bold">El historial de consumos previos no se verá afectado.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-trash3-fill me-2"></i><span class="fs-5">Proceder</span>',
            cancelButtonText: '<span class="fs-5">Descartar</span>',
            customClass: {
                popup: 'rounded-4 shadow-lg py-4',
                confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0',
                cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0'
            },
            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                confirmBtn.style.cssText = `background-color: #dc3545 !important; color: #ffffff !important;`;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, tipo, id));
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro eliminado', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    // EDITAR USUARIO
    window.editarPersona = async (id, nombreViejo) => {
        const { value: nombreEditado } = await Swal.fire({
            title: `<h2 class="fw-bold mb-0">Modificar registro</h2>`,
            html: `
                <input id="swal-input-editar" class="swal2-input w-75 rounded-4 fs-4 fw-medium text-center mt-4" value="${nombreViejo}" autocomplete="off">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: `<i class="bi bi-save me-2"></i><span class="fs-5">Actualizar</span>`,
            cancelButtonText: '<span class="fs-5">Cancelar</span>',
            customClass: {
                popup: 'rounded-4 shadow-lg py-4',
                confirmButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0',
                cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0'
            },
            didOpen: () => {
                const confirmBtn = Swal.getConfirmButton();
                confirmBtn.style.cssText = `background-color: ${colorFondo} !important; ${textColor}`;
            },
            preConfirm: () => {
                const inputVal = document.getElementById('swal-input-editar').value.trim();
                if (!inputVal) {
                    Swal.showValidationMessage('Se requiere un nombre válido');
                }
                return inputVal;
            }
        });

        if (nombreEditado && nombreEditado.trim() !== nombreViejo) {
            let nombreFormateado = nombreEditado.trim().split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');

            const existe = personasDB.some(p => (p.nombre || "").toLowerCase() === nombreFormateado.toLowerCase() && p.id !== id);
            if (existe) {
                Swal.fire({
                    icon: 'warning',
                    title: '<h3 class="fw-bold">Conflicto de registro</h3>',
                    html: `<p class="fs-5">El sistema indica que <b>${nombreFormateado}</b> ya está ingresado.</p>`,
                    customClass: { confirmButton: 'btn btn-lg rounded-pill px-5 fw-bold border-0' },
                    didOpen: () => {
                        const confirmBtn = Swal.getConfirmButton();
                        confirmBtn.style.cssText = `background-color: ${colorFondo} !important; ${textColor}`;
                    }
                });
                return;
            }

            try {
                await updateDoc(doc(db, tipo, id), { nombre: nombreFormateado });
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cambios guardados', showConfirmButton: false, timer: 2000 });
            } catch (e) {
                Swal.fire('Error', e.message, 'error');
            }
        }
    };
});