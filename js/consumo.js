import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, doc, updateDoc, deleteDoc, onSnapshot, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

function obtenerSemanaDelMes(fechaObj) {
    const primerDia = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), 1);
    let ajuste = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1; 
    return Math.ceil((fechaObj.getDate() + ajuste) / 7);
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const nombreUsuario = params.get("nombre") || "Usuario Desconocido";
    const rolUsuario = params.get("rol") || "index";

    const nombrePersonaEl = document.getElementById("nombrePersona");
    const etiquetaRolEl = document.getElementById("etiquetaRol");
    const avatarFondoEl = document.getElementById("avatarFondo");

    if (rolUsuario === "profesores") { if (etiquetaRolEl) etiquetaRolEl.textContent = "Profesor"; }
    else if (rolUsuario === "alumnos") { if (etiquetaRolEl) etiquetaRolEl.textContent = "Alumno"; }
    else if (rolUsuario === "administrativos") { if (etiquetaRolEl) etiquetaRolEl.textContent = "Administrativo"; }
    else { if (etiquetaRolEl) etiquetaRolEl.textContent = "Personal"; }

    if (nombrePersonaEl) nombrePersonaEl.textContent = nombreUsuario;

    if (avatarFondoEl) {
        const coloresAvatar = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#0097a7', '#00897b', '#43a047', '#689f38', '#ef6c00', '#e65100', '#f4511e'];
        let sumaLetras = 0;
        for (let i = 0; i < nombreUsuario.length; i++) {
            sumaLetras += nombreUsuario.charCodeAt(i);
        }
        const colorAsignado = coloresAvatar[sumaLetras % coloresAvatar.length];
        const inicial = nombreUsuario.charAt(0).toUpperCase();

        avatarFondoEl.style.backgroundColor = colorAsignado;
        avatarFondoEl.innerHTML = `<span class="fw-bold text-white shadow-sm" style="font-size: 1.1rem; line-height: 1; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${inicial}</span>`;
    }

    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) btnVolver.onclick = () => window.location.href = `${rolUsuario}.html`;

    const inputProducto = document.getElementById("inputProducto");
    const inputCantidad = document.getElementById("inputCantidad");
    const listaSugerencias = document.getElementById("listaSugerencias");
    const fechaConsumo = document.getElementById("fechaConsumo");
    const formConsumo = document.getElementById("formConsumo");
    const tablaConsumos = document.getElementById("tablaConsumos");
    const totalAcumulado = document.getElementById("totalAcumulado");
    
    const mesFiltro = document.getElementById("mesFiltro");
    const textoMesVisual = document.getElementById("textoMesVisual");
    const listaMesesUI = document.getElementById("listaMesesUI");

    const inputBusquedaTabla = document.getElementById("inputBusquedaTabla");

    const tituloEstadoMes = document.getElementById("tituloEstadoMes");
    const estadoCuentaMesVisual = document.getElementById("estadoCuentaMesVisual");
    const btnMarcarMesPagado = document.getElementById("btnMarcarMesPagado");
    
    const montoAbono = document.getElementById("montoAbono");
    const fechaAbono = document.getElementById("fechaAbono");
    const inputPagador = document.getElementById("inputPagador"); 
    const btnAbonoYape = document.getElementById("btnAbonoYape");
    const btnAbonoEfectivo = document.getElementById("btnAbonoEfectivo");

    const contenedorHistorialPagos = document.getElementById("contenedorHistorialPagos");
    const listaPagosVisual = document.getElementById("listaPagosVisual");

    let historialConsumos = [];
    let historialPagos = [];
    let semanasPagadas = []; 
    
    let productosDB = [];
    onSnapshot(collection(db, "productos"), (snap) => {
        if (!snap.empty) {
            productosDB = [];
            snap.forEach(doc => productosDB.push({ id: doc.id, ...doc.data() }));
        } else {
            productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];
        }
    });

    if (fechaConsumo) {
        flatpickr(fechaConsumo, {
            locale: "es",
            defaultDate: "today",
            disableMobile: true,
            altInput: true,
            altFormat: "d-m-Y",
            dateFormat: "Y-m-d"
        });
    }
    if (fechaAbono) {
        flatpickr(fechaAbono, {
            locale: "es",
            defaultDate: "today",
            disableMobile: true,
            altInput: true,
            altFormat: "d-m-Y",
            dateFormat: "Y-m-d"
        });
    }

    if (listaMesesUI) {
        listaMesesUI.addEventListener("click", (e) => {
            const item = e.target.closest(".dropdown-item");
            if (!item) return;
            e.preventDefault();
            const valor = item.getAttribute("data-val");
            if (mesFiltro.value !== valor) {
                mesFiltro.value = valor;
                mesFiltro.dispatchEvent(new Event('change'));
            }
        });
    }

    if (mesFiltro) {
        mesFiltro.addEventListener("change", () => {
            if (textoMesVisual) {
                textoMesVisual.textContent = mesFiltro.options[mesFiltro.selectedIndex].text;
            }
            renderizarConsumos();
            recalcularSaldoGlobal();
            renderizarListaPagos(); 
        });
    }

    if (fechaConsumo && mesFiltro) {
        fechaConsumo.addEventListener("change", () => {
            if (!fechaConsumo.value) return; 
            const fechaSeleccionada = new Date(fechaConsumo.value + 'T00:00:00');
            const mesDeLaFecha = fechaSeleccionada.getMonth().toString();

            if (mesFiltro.value !== mesDeLaFecha) {
                mesFiltro.value = mesDeLaFecha;
                mesFiltro.dispatchEvent(new Event('change'));
            }
        });
    }
    
    const fechaHoy = new Date();
    if (mesFiltro) {
        mesFiltro.value = fechaHoy.getMonth().toString();
        if (textoMesVisual) {
            textoMesVisual.textContent = mesFiltro.options[mesFiltro.selectedIndex].text;
        }
    }

    if (inputBusquedaTabla) {
        inputBusquedaTabla.addEventListener("input", () => {
            renderizarConsumos();
        });
    }

    let indiceSeleccionado = -1;
    if (inputProducto) {
        inputProducto.addEventListener("input", () => {
            const val = inputProducto.value.toLowerCase();
            const partes = val.split("+");
            const ult = partes[partes.length - 1].trim();
            listaSugerencias.innerHTML = "";
            indiceSeleccionado = -1;

            if (ult.length > 0) {
                const f = productosDB.filter(p => p.nombre.toLowerCase().includes(ult));
                if (f.length > 0) {
                    listaSugerencias.classList.add("show");
                    f.forEach(p => {
                        const li = document.createElement("li");
                        li.innerHTML = `<a class="dropdown-item d-flex justify-content-between" href="#"><span>${p.nombre}</span><small>S/ ${parseFloat(p.precio).toFixed(2)}</small></a>`;
                        li.onmousedown = (e) => { e.preventDefault(); seleccionar(p.nombre); };
                        listaSugerencias.appendChild(li);
                    });
                } else listaSugerencias.classList.remove("show");
            } else listaSugerencias.classList.remove("show");
        });

        inputProducto.addEventListener("keydown", (e) => {
            const items = listaSugerencias.querySelectorAll("a.dropdown-item");
            if (!listaSugerencias.classList.contains("show") || items.length === 0) return;
            if (e.key === "ArrowDown") {
                e.preventDefault(); indiceSeleccionado++; if (indiceSeleccionado >= items.length) indiceSeleccionado = 0; actSel(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault(); indiceSeleccionado--; if (indiceSeleccionado < 0) indiceSeleccionado = items.length - 1; actSel(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (indiceSeleccionado > -1) seleccionar(items[indiceSeleccionado].querySelector("span").textContent);
                else if (items.length > 0) seleccionar(items[0].querySelector("span").textContent);
            }
        });

        function actSel(items) {
            items.forEach((item, i) => {
                if (i === indiceSeleccionado) { item.classList.add("active"); item.style.backgroundColor = "#0d6efd"; item.style.color = "white"; item.scrollIntoView({ block: "nearest" }); }
                else { item.classList.remove("active"); item.style.backgroundColor = ""; item.style.color = ""; }
            });
        }
        function seleccionar(n) {
            const p = inputProducto.value.split("+");
            p[p.length - 1] = ` ${n} `;
            inputProducto.value = p.join("+").trim() + " + ";
            listaSugerencias.classList.remove("show");
            inputProducto.focus();
        }
    }

    onSnapshot(query(collection(db, "consumos"), where("nombreUsuario", "==", nombreUsuario)), (snap) => {
        historialConsumos = [];
        snap.forEach(doc => historialConsumos.push({ id: doc.id, ...doc.data() }));
        historialConsumos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        renderizarConsumos();
        recalcularSaldoGlobal();
    });

    onSnapshot(query(collection(db, "pagos"), where("nombreUsuario", "==", nombreUsuario)), (snap) => {
        historialPagos = [];
        snap.forEach(doc => historialPagos.push({ id: doc.id, ...doc.data() }));
        historialPagos.sort((a, b) => b.timestamp - a.timestamp);
        recalcularSaldoGlobal();
        renderizarListaPagos();
    });

    onSnapshot(query(collection(db, "semanas_pagadas"), where("nombreUsuario", "==", nombreUsuario)), (snap) => {
        semanasPagadas = [];
        snap.forEach(doc => semanasPagadas.push({ id: doc.id, ...doc.data() }));
        renderizarConsumos(); 
        recalcularSaldoGlobal(); 
    });

    function recalcularSaldoGlobal() {
        if (!estadoCuentaMesVisual) return;

        const mesSeleccionado = mesFiltro.value;

        let totalConsumoBruto = 0;
        let consumoSemanasPagadas = 0;
        let totalPagosBruto = 0;
        
        let consumosDelMes = [];

        if (mesSeleccionado === "todos") {
            tituloEstadoMes.innerHTML = "ESTADO DE CUENTA: HISTÓRICO GENERAL";
            if (btnMarcarMesPagado) btnMarcarMesPagado.style.display = "none";
            
            totalConsumoBruto = historialConsumos.reduce((acc, r) => acc + r.precio, 0);
            totalPagosBruto = historialPagos.reduce((acc, p) => acc + p.monto, 0);
            
            historialConsumos.forEach(r => {
                let fechaObj = new Date(r.fecha + 'T00:00:00');
                let nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSemana = obtenerSemanaDelMes(fechaObj);
                let idGrupo = `${nombreMesConsumo}_${numSemana}`;
                
                let semana = semanasPagadas.find(s => s.idGrupo === idGrupo);
                if (semana && (!r.timestamp || r.timestamp <= semana.timestamp)) {
                    consumoSemanasPagadas += r.precio;
                }
            });
            
        } else {
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            tituloEstadoMes.innerHTML = `ESTADO DE GESTIÓN: ${nombreMes}`;
            if (btnMarcarMesPagado) btnMarcarMesPagado.style.display = "inline-block";

            consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            const pagosDelMes = historialPagos.filter(p => {
                let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : new Date(p.fecha + 'T00:00:00').getMonth().toString();
                return mesDelPago === mesSeleccionado;
            });

            consumosDelMes.forEach(r => {
                totalConsumoBruto += r.precio;
                let fechaObj = new Date(r.fecha + 'T00:00:00');
                let nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSemana = obtenerSemanaDelMes(fechaObj);
                let idGrupo = `${nombreMesConsumo}_${numSemana}`;
                
                let semana = semanasPagadas.find(s => s.idGrupo === idGrupo);
                if (semana && (!r.timestamp || r.timestamp <= semana.timestamp)) {
                    consumoSemanasPagadas += r.precio;
                }
            });

            totalPagosBruto = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
        }

        let deudaActiva = totalConsumoBruto - totalPagosBruto;
        if (deudaActiva < 0) deudaActiva = 0;
        
        let saldoAFavor = totalPagosBruto - totalConsumoBruto;
        if (saldoAFavor < 0) saldoAFavor = 0;

        const saldoFinal = saldoAFavor - deudaActiva;

        let badgeHTML = "";
        if (saldoFinal < -0.01) {
            badgeHTML = `<span class="badge bg-danger px-4 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;"><i class="bi bi-exclamation-triangle-fill me-1"></i> FALTA PAGAR: S/ ${Math.abs(saldoFinal).toFixed(2)}</span>`;
        } else if (saldoFinal > 0.01) {
            badgeHTML = `<span class="badge bg-success px-4 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;"><i class="bi bi-gift-fill me-1"></i> A FAVOR: S/ ${saldoFinal.toFixed(2)}</span>`;
        } else {
            badgeHTML = `<span class="badge bg-secondary px-4 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;"><i class="bi bi-shield-check me-1"></i> PAGADO AL DÍA</span>`;
        }

        if (estadoCuentaGlobalVisual) estadoCuentaGlobalVisual.style.display = "none";

        estadoCuentaMesVisual.innerHTML = `
            <div class="d-inline-flex bg-white px-4 py-3 rounded-4 shadow-sm border border-light mb-3 w-100 justify-content-center" style="max-width: 350px;">
                <div class="pe-4 border-end w-50 text-center">
                    <span class="d-block text-muted" style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px;">PAGO PENDIENTE:</span>
                    <span class="fw-bold text-dark lh-1" style="font-size: 1.4rem;">S/ ${deudaActiva.toFixed(2)}</span>
                </div>
                <div class="ps-4 w-50 text-center">
                    <span class="d-block text-muted" style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px;">CANCELÓ:</span>
                    <span class="fw-bold text-success lh-1" style="font-size: 1.4rem;">S/ ${totalPagosBruto.toFixed(2)}</span>
                </div>
            </div>
            <div class="text-center mt-1">
                ${badgeHTML}
            </div>
        `;

        const inputBusquedaTabla = document.getElementById("inputBusquedaTabla");
        if(totalAcumulado && (!inputBusquedaTabla || inputBusquedaTabla.value.trim() === "")) {
            totalAcumulado.textContent = `S/ ${deudaActiva.toFixed(2)}`;
        }

        if (btnMarcarMesPagado && mesSeleccionado !== "todos") {
            let todosSemanasPagadas = false;
            
            if (consumosDelMes.length > 0) {
                todosSemanasPagadas = consumosDelMes.every(r => {
                    let fechaObj = new Date(r.fecha + 'T00:00:00');
                    let nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                    let numSemana = obtenerSemanaDelMes(fechaObj);
                    let idGrupo = `${nombreMesConsumo}_${numSemana}`;
                    return semanasPagadas.some(s => s.idGrupo === idGrupo);
                });
            }

            if (todosSemanasPagadas && consumosDelMes.length > 0) {
                btnMarcarMesPagado.innerHTML = '<i class="bi bi-x-circle"></i> DESMARCAR MES';
                btnMarcarMesPagado.className = "btn btn-sm btn-outline-danger fw-bold py-1 px-2 shadow-sm bg-white";
                btnMarcarMesPagado.setAttribute("data-estado", "pagado");
            } else {
                btnMarcarMesPagado.innerHTML = '<i class="bi bi-check-all"></i> TODO EL MES PAGADO';
                btnMarcarMesPagado.className = "btn btn-sm btn-outline-success fw-bold py-1 px-2 shadow-sm bg-white";
                btnMarcarMesPagado.setAttribute("data-estado", "pendiente");
            }
        }
    }

    if (btnMarcarMesPagado) {
        btnMarcarMesPagado.onclick = async () => {
            const mesSeleccionado = mesFiltro.value;
            if (mesSeleccionado === "todos") return;
            
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            const consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            const estado = btnMarcarMesPagado.getAttribute("data-estado");

            if (estado === "pagado") {
                Swal.fire({
                    title: '¿Desmarcar mes completo?',
                    html: `Las semanas de <b>${nombreMes}</b> volverán a estar activas y pendientes.<br><br><small class="text-danger fw-bold">Ojo: Si se generó un pago automático, tendrás que anularlo manualmente en el historial de abajo.</small>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, desmarcar',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const gruposSemanas = [...new Set(consumosDelMes.map(r => {
                            let f = new Date(r.fecha + 'T00:00:00');
                            return `${f.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()}_${obtenerSemanaDelMes(f)}`;
                        }))];

                        if (gruposSemanas.length > 0) {
                            try {
                                btnMarcarMesPagado.disabled = true;
                                const batch = writeBatch(db);
                                
                                gruposSemanas.forEach(idGrupo => {
                                    const docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
                                    const docRef = doc(db, "semanas_pagadas", docId);
                                    batch.delete(docRef); 
                                });
                                await batch.commit();
                                Swal.fire('Revertido', `El mes de ${nombreMes} vuelve a estar pendiente.`, 'info');
                            } catch (e) {
                                Swal.fire('Error', e.message, 'error');
                            } finally {
                                btnMarcarMesPagado.disabled = false;
                            }
                        }
                    }
                });
                return; 
            }

            const pagosDelMes = historialPagos.filter(p => {
                let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : new Date(p.fecha + 'T00:00:00').getMonth().toString();
                return mesDelPago === mesSeleccionado;
            });
            
            let totalConsumoMes = consumosDelMes.reduce((acc, r) => acc + r.precio, 0);
            let totalPagosMes = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
            
            let deudaFaltante = totalConsumoMes - totalPagosMes;

            if (deudaFaltante > 0.01) {
                window.abonoRapidoSemana(deudaFaltante, `Mes de ${nombreMes}`);
            } else {
                Swal.fire({
                    title: 'Mes sin deudas',
                    text: `El mes de ${nombreMes} ya está completamente pagado. ¿Deseas marcar todas las semanas visualmente como canceladas?`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#198754',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, tachar semanas',
                    cancelButtonText: 'Cancelar'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        const gruposSemanas = [...new Set(consumosDelMes.map(r => {
                            let f = new Date(r.fecha + 'T00:00:00');
                            return `${f.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()}_${obtenerSemanaDelMes(f)}`;
                        }))];

                        const batch = writeBatch(db);
                        gruposSemanas.forEach(idGrupo => {
                            const docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
                            const docRef = doc(db, "semanas_pagadas", docId);
                            batch.set(docRef, {
                                nombreUsuario: nombreUsuario,
                                idGrupo: idGrupo,
                                timestamp: Date.now()
                            });
                        });
                        await batch.commit();
                        Swal.fire('¡Listo!', 'Semanas marcadas como canceladas.', 'success');
                    }
                });
            }
        };
    }

    window.modoEdicionActiva = null; 

    window.editarRegistro = (id, productoActual, precioActual, fechaDB) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (fechaConsumo) {
            fechaConsumo.value = fechaDB;
            if (fechaConsumo._flatpickr) fechaConsumo._flatpickr.setDate(fechaDB);
        }
        if (inputProducto) inputProducto.value = productoActual + " + ";
        if (inputCantidad) inputCantidad.value = 1;

        window.modoEdicionActiva = { id: id };

        const btnSubmit = formConsumo.querySelector("button[type='submit']");
        if (btnSubmit) {
            btnSubmit.innerHTML = '<i class="bi bi-save"></i> Guardar Edición';
            btnSubmit.classList.remove("btn-primary");
            btnSubmit.classList.add("btn-success"); 
        }
        
        inputProducto.focus();
    };

    window.editarPago = async (id, montoActual, fechaDB, metodoActual, pagadorActual) => {
        const p = fechaDB.split('-');
        const fechaUser = `${p[2]}-${p[1]}-${p[0]}`;

        const { value: formValues } = await Swal.fire({
            title: 'Editar Pago',
            html: `
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Monto (S/)</label>
                    <input id="swal-monto" type="number" step="0.01" class="form-control form-control-lg" value="${montoActual}">
                </div>
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Fecha del Pago</label>
                    <input id="swal-fecha" type="date" class="form-control" value="${fechaDB}">
                </div>
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Medio de Pago</label>
                    <select id="swal-metodo" class="form-select">
                        <option value="Efectivo" ${metodoActual === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                        <option value="Yape" ${metodoActual === 'Yape' ? 'selected' : ''}>Yape</option>
                    </select>
                </div>
                <div class="mb-1 text-start">
                    <label class="form-label fw-bold small text-muted">Concepto / Pagador</label>
                    <input id="swal-pagador" type="text" class="form-control" placeholder="Ej: Pago de Sem 2" value="${pagadorActual || ''}">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    monto: document.getElementById('swal-monto').value,
                    fecha: document.getElementById('swal-fecha').value,
                    metodo: document.getElementById('swal-metodo').value,
                    pagador: document.getElementById('swal-pagador').value
                }
            }
        });

        if (formValues) {
            let nuevoMonto = parseFloat(formValues.monto);
            if (isNaN(nuevoMonto) || nuevoMonto <= 0) { 
                Swal.fire('Error', 'El monto ingresado es inválido.', 'error'); 
                return; 
            }
            if (!formValues.fecha) { 
                Swal.fire('Error', 'Debes seleccionar una fecha.', 'error'); 
                return; 
            }

            try {
                await updateDoc(doc(db, "pagos", id), {
                    monto: nuevoMonto,
                    fecha: formValues.fecha,
                    metodo: formValues.metodo,
                    pagador: formValues.pagador.trim()
                });
                Swal.fire('¡Actualizado!', 'El pago ha sido modificado correctamente.', 'success');
            } catch (e) { 
                Swal.fire('Error al editar', e.message, 'error'); 
            }
        }
    };

    function renderizarListaPagos() {
        if (!contenedorHistorialPagos || !listaPagosVisual) return;
        listaPagosVisual.innerHTML = "";

        const mesSeleccionado = mesFiltro.value;

        const pagosFiltrados = historialPagos.filter(p => {
            if (mesSeleccionado === "todos") return true;
            let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : new Date(p.fecha + 'T00:00:00').getMonth().toString();
            return mesDelPago === mesSeleccionado;
        });

        if (pagosFiltrados.length === 0) {
            contenedorHistorialPagos.classList.add("d-none");
            return;
        }

        contenedorHistorialPagos.classList.remove("d-none");
        pagosFiltrados.forEach((pago) => {
            const [y, m, d] = pago.fecha.split('-');
            
            const metodo = pago.metodo || "Efectivo";
            const colorMetodo = metodo === "Yape" ? "#742384" : "#198754";
            const iconoMetodo = metodo === "Yape" ? "bi-qr-code" : "bi-cash-stack";
            
            const textoPagador = pago.pagador ? `<br><small class="text-secondary fw-bold"><i class="bi bi-chat-left-text me-1"></i>${pago.pagador}</small>` : "";

            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center px-3 py-3 border-bottom";
            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm flex-shrink-0" style="width: 35px; height: 35px; background-color: ${colorMetodo}; color: white;">
                        <i class="bi ${iconoMetodo}" style="font-size: 1rem;"></i>
                    </div>
                    <div>
                        <span class="d-block text-dark fw-bold" style="font-size: 0.95rem;">S/ ${pago.monto.toFixed(2)} <span class="badge ms-1" style="background-color: ${colorMetodo}; font-size: 0.65rem; padding: 0.25em 0.5em;">${metodo}</span></span>
                        <small class="text-muted" style="font-size: 0.8rem;">Pagado el ${d}-${m}-${y}</small>${textoPagador}
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm text-primary p-0 me-3" onclick="window.editarPago('${pago.id}', ${pago.monto}, '${pago.fecha}', '${metodo}', '${pago.pagador || ''}')"><i class="bi bi-pencil-square fs-5"></i></button>
                    <button class="btn btn-sm text-danger p-0" onclick="eliminarPago('${pago.id}')"><i class="bi bi-x-lg fs-5"></i></button>
                </div>
            `;
            listaPagosVisual.appendChild(li);
        });
    }

    window.abonoRapidoSemana = (monto, textoSemana) => {
        const montoAbono = document.getElementById("montoAbono");
        const inputPagador = document.getElementById("inputPagador");
        
        if (montoAbono) {
            montoAbono.value = monto.toFixed(2);
            if(inputPagador) {
                inputPagador.value = `Pago de ${textoSemana}`; 
            }
            
            montoAbono.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                montoAbono.focus();
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: 'success',
                    title: `S/ ${monto.toFixed(2)} listos para abonar.`
                });
            }, 500);
        }
    };

    window.toggleSemanaPagada = (idGrupo, estaPagada) => {
        const docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
        
        let titulo = estaPagada ? '¿Desmarcar semana?' : '¿Marcar como cancelada?';
        let texto = estaPagada 
            ? 'La semana volverá a mostrarse activa (No altera la deuda global).' 
            : 'La semana se tachará visualmente (No altera la deuda global).';
        let icon = estaPagada ? 'warning' : 'question';
        let confirmColor = estaPagada ? '#dc3545' : '#198754';

        Swal.fire({
            title: titulo,
            text: texto,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: confirmColor,
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, confirmar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (estaPagada) {
                        await deleteDoc(doc(db, "semanas_pagadas", docId));
                    } else {
                        await setDoc(doc(db, "semanas_pagadas", docId), {
                            nombreUsuario: nombreUsuario,
                            idGrupo: idGrupo,
                            timestamp: Date.now()
                        });
                    }
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    function renderizarConsumos() {
        if (!tablaConsumos) return;
        tablaConsumos.innerHTML = "";
        let totalBusqueda = 0; 
        const mes = mesFiltro.value; 
        
        const textoBusqueda = inputBusquedaTabla ? inputBusquedaTabla.value.toLowerCase() : "";

        const filtrados = historialConsumos.filter(r => {
            const coincideMes = (mes === "todos" || new Date(r.fecha + 'T00:00:00').getMonth() == mes);
            const coincideBusqueda = r.productoNombre.toLowerCase().includes(textoBusqueda);
            return coincideMes && coincideBusqueda;
        });

        if (filtrados.length === 0) {
            tablaConsumos.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron registros en este periodo/búsqueda.</td></tr>';
            if (totalAcumulado) totalAcumulado.textContent = "S/ 0.00";
            return;
        }

        let totalesPorGrupo = {};
        let consumosPorGrupo = {}; 

        filtrados.forEach(r => {
            const fechaObj = new Date(r.fecha + 'T00:00:00');
            const nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
            let numSemana = obtenerSemanaDelMes(fechaObj);
            const idGrupo = `${nombreMesConsumo}_${numSemana}`;
            
            if (!totalesPorGrupo[idGrupo]) totalesPorGrupo[idGrupo] = 0;
            if (!consumosPorGrupo[idGrupo]) consumosPorGrupo[idGrupo] = [];
            
            totalesPorGrupo[idGrupo] += r.precio;
            consumosPorGrupo[idGrupo].push(r);
        });

        let grupoActual = ""; 

        filtrados.forEach(r => {
            const fechaObj = new Date(r.fecha + 'T00:00:00');
            const nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
            let numSemana = obtenerSemanaDelMes(fechaObj);
            const identificadorGrupo = `${nombreMesConsumo}_${numSemana}`;

            let semanaDoc = semanasPagadas.find(s => s.idGrupo === identificadorGrupo);
            let itemPagado = false;
            if (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp)) {
                itemPagado = true;
            }

            if (identificadorGrupo !== grupoActual) {
                grupoActual = identificadorGrupo;
                
                let todosPagados = consumosPorGrupo[identificadorGrupo].every(item => {
                    let sDoc = semanasPagadas.find(s => s.idGrupo === identificadorGrupo);
                    return sDoc && (!item.timestamp || item.timestamp <= sDoc.timestamp);
                });

                let deudaSemana = consumosPorGrupo[identificadorGrupo]
                    .filter(item => {
                        let sDoc = semanasPagadas.find(s => s.idGrupo === identificadorGrupo);
                        return !(sDoc && (!item.timestamp || item.timestamp <= sDoc.timestamp));
                    })
                    .reduce((acc, curr) => acc + curr.precio, 0);

                const textoCabecera = mes === "todos" 
                    ? `${nombreMesConsumo} - SEMANA 0${numSemana}` 
                    : `SEMANA 0${numSemana}`;

                let colorFondo = todosPagados ? '#d1e7dd' : '#f0f7ff';
                let colorBorde = todosPagados ? '#198754' : '#0d6efd';
                let colorTexto = todosPagados ? 'text-success' : 'text-primary';

                let badgeTotal = todosPagados ? '' : `<span class="badge bg-danger rounded-pill shadow-sm px-2 ms-2" style="font-size: 0.75rem;">S/ ${deudaSemana.toFixed(2)}</span>`;

                let btnAbonoRapido = todosPagados 
                    ? '' 
                    : `<button class="btn btn-sm btn-warning text-dark fw-bold rounded-pill py-0 px-3 shadow-sm border-0" style="font-size: 0.75rem;" onclick="window.abonoRapidoSemana(${deudaSemana}, '${textoCabecera}')"><i class="bi bi-lightning-charge-fill me-1"></i>Pagar exacto</button>`;

                let botonAccion = todosPagados 
                    ? `<button class="btn btn-sm btn-success rounded-pill fw-bold py-0 shadow-sm border-0" style="font-size: 0.75rem;" onclick="window.toggleSemanaPagada('${identificadorGrupo}', true)"><i class="bi bi-check-circle-fill me-1"></i>Cancelada</button>`
                    : `<button class="btn btn-sm btn-outline-primary rounded-pill fw-bold bg-white py-0 shadow-sm" style="font-size: 0.75rem; border-width: 1.5px;" onclick="window.toggleSemanaPagada('${identificadorGrupo}', false)"><i class="bi bi-check2-circle me-1"></i>Marcar pagada</button>`;

                const trSemana = document.createElement("tr");
                trSemana.innerHTML = `
                    <td colspan="4" class="py-2 ps-3 ps-md-4" style="background-color: ${colorFondo}; border-left: 5px solid ${colorBorde}; border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pe-2">
                            <div class="d-flex align-items-center flex-wrap">
                                <span class="fw-bold ${colorTexto}" style="font-size: 0.9rem; letter-spacing: 0.5px;"><i class="bi bi-calendar3 me-2"></i>${textoCabecera}</span>
                                ${badgeTotal}
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                ${btnAbonoRapido}
                                ${botonAccion}
                            </div>
                        </div>
                    </td>
                `;
                tablaConsumos.appendChild(trSemana);
            }

            if (!itemPagado) {
                totalBusqueda += r.precio;
            }
            
            const f = fechaObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
            const tr = document.createElement("tr");
            const nombreSeguro = r.productoNombre.replace(/'/g, "\\'");
            
            const tachado = itemPagado ? "text-decoration: line-through; opacity: 0.6;" : "";

            tr.innerHTML = `
                <td class="ps-4 text-muted small" style="${tachado}">${f.charAt(0).toUpperCase() + f.slice(1)}</td>
                <td class="fw-bold text-dark" style="${tachado}">${r.productoNombre}</td>
                <td class="text-center fw-bold text-dark" style="${tachado}">S/ ${r.precio.toFixed(2)}</td>
                <td class="text-center" style="white-space: nowrap;">
                    <button class="btn btn-sm btn-outline-primary rounded-1 me-1" onclick="window.editarRegistro('${r.id}', '${nombreSeguro}', ${r.precio}, '${r.fecha}')" title="Editar consumo">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-1" onclick="eliminarRegistro('${r.id}')" title="Eliminar registro">
                        <i class="bi bi-x"></i>
                    </button>
                </td>
            `;
            tablaConsumos.appendChild(tr);
        });

        if (textoBusqueda !== "") {
            if (totalAcumulado) totalAcumulado.textContent = `S/ ${totalBusqueda.toFixed(2)} (Buscando)`;
        } else {
            recalcularSaldoGlobal();
        }
    }

    if (mesFiltro) {
        mesFiltro.addEventListener("change", () => {
            renderizarConsumos();
            recalcularSaldoGlobal();
            renderizarListaPagos(); 
        });
    }

    window.eliminarRegistro = (id) => { 
        Swal.fire({
            title: '¿Borrar este consumo?',
            text: "No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteDoc(doc(db, "consumos", id));
            }
        });
    };
    
    window.eliminarPago = (id) => { 
        Swal.fire({
            title: '¿Anular este pago?',
            text: "La deuda se recalculará automáticamente.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteDoc(doc(db, "pagos", id));
            }
        });
    };

    if (formConsumo) {
        formConsumo.onsubmit = async (e) => {
            e.preventDefault();
            const btn = formConsumo.querySelector("button[type='submit']");
            const fechaVal = fechaConsumo._flatpickr ? fechaConsumo.value : fechaConsumo.value; 
            const fecha = fechaVal;
            
            let prodCrudo = inputProducto.value.trim();
            if (prodCrudo.endsWith("+")) prodCrudo = prodCrudo.slice(0, -1).trim();
            const cant = parseInt(inputCantidad.value);

            if (!prodCrudo || cant < 1) return;

            const nombresSeparados = prodCrudo.split("+").map(n => n.trim()).filter(n => n !== "");
            let precioTotalFinal = 0;
            let itemsDeEstePedido = [];

            for (let rawName of nombresSeparados) {
                let nombreLimpio = rawName;
                let cantidadLocal = 1;
                let precioPersonalizado = null;

                const matchPrecio = rawName.match(/^(.*?)\s*\(\s*S\/\s*([\d.]+)\s*\)$/i);
                if (matchPrecio) {
                    nombreLimpio = matchPrecio[1].trim();
                    precioPersonalizado = parseFloat(matchPrecio[2]);
                } else {
                    const matchCant = rawName.match(/^(.*?)\s*\(\s*(\d+)\s*\)$/);
                    if (matchCant) {
                        nombreLimpio = matchCant[1].trim();
                        cantidadLocal = parseInt(matchCant[2], 10);
                    }
                }

                const productoEncontrado = productosDB.find(p => p.nombre.toLowerCase() === nombreLimpio.toLowerCase());

                if (!productoEncontrado && precioPersonalizado === null) {
                    Swal.fire('Producto no encontrado', `El producto "${nombreLimpio}" NO EXISTE en tu inventario. Selecciónalo de la lista.`, 'error');
                    return;
                }

                let precioDelProducto = 0;
                let nombreParaHistorial = nombreLimpio;

                if (precioPersonalizado !== null) {
                    precioDelProducto = precioPersonalizado;
                    nombreParaHistorial = `${nombreLimpio} (S/ ${precioDelProducto.toFixed(2)})`;
                } else {
                    precioDelProducto = parseFloat(productoEncontrado.precio); 
                    nombreParaHistorial = productoEncontrado.nombre;

                    let cat = (productoEncontrado.categoria || "").toLowerCase();
                    let nom = productoEncontrado.nombre.toLowerCase();
                    if (cat === "comida" || cat === "menu" || cat === "menú" || nom.includes("comida") || nom.includes("menu")) {
                        
                        const { value: precioIngresado } = await Swal.fire({
                            title: `Precio del plato`,
                            text: `Ingresa el precio de cobro para "${productoEncontrado.nombre}":`,
                            input: 'number',
                            inputValue: productoEncontrado.precio,
                            inputAttributes: { step: '0.01' },
                            showCancelButton: true,
                            confirmButtonText: 'Confirmar',
                            cancelButtonText: 'Cancelar'
                        });

                        if (!precioIngresado) return; 
                        
                        precioDelProducto = parseFloat(precioIngresado);
                        nombreParaHistorial = `${productoEncontrado.nombre} (S/ ${precioDelProducto.toFixed(2)})`;
                    }
                }

                precioTotalFinal += (precioDelProducto * cantidadLocal);
                for (let i = 0; i < cantidadLocal; i++) itemsDeEstePedido.push(nombreParaHistorial);
            }

            precioTotalFinal = precioTotalFinal * cant;
            let textoAgrupadoSinFinal = [];
            for (let i = 0; i < cant; i++) textoAgrupadoSinFinal.push(...itemsDeEstePedido);

            function agruparTextos(texto) {
                let pts = texto.split(/(?:<br>|\+)/).map(p => p.trim()).filter(p => p !== "");
                let mapa = new Map();
                pts.forEach(p => {
                    let n = p, c = 1, match = p.match(/^(.*?)\s*\(\s*(\d+)\s*\)$/);
                    if (match && !p.includes("S/")) { n = match[1].trim(); c = parseInt(match[2], 10); }
                    mapa.set(n, (mapa.get(n) || 0) + c);
                });
                let res = [];
                mapa.forEach((c, n) => { res.push(c > 1 ? `${n} (${c})` : n); });
                return res.join(" + ");
            }

            let textoNuevoPedido = agruparTextos(textoAgrupadoSinFinal.join(" + "));

            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-cloud-arrow-up"></i> Guardando...';

            try {
                if (window.modoEdicionActiva) {
                    await updateDoc(doc(db, "consumos", window.modoEdicionActiva.id), {
                        productoNombre: textoNuevoPedido,
                        precio: precioTotalFinal,
                        fecha: fecha
                    });
                    
                    window.modoEdicionActiva = null;
                    btn.classList.remove("btn-success");
                    btn.classList.add("btn-primary");
                } else {
                    const indexExistente = historialConsumos.findIndex(r => r.fecha === fecha);
                    if (indexExistente !== -1) {
                        let reg = historialConsumos[indexExistente];
                        await updateDoc(doc(db, "consumos", reg.id), {
                            productoNombre: agruparTextos(reg.productoNombre + " + " + textoNuevoPedido),
                            precio: reg.precio + precioTotalFinal
                        });
                    } else {
                        await addDoc(collection(db, "consumos"), {
                            nombreUsuario: nombreUsuario,
                            fecha: fecha,
                            productoNombre: textoNuevoPedido,
                            precio: precioTotalFinal,
                            timestamp: Date.now() 
                        });
                    }
                }

                inputProducto.value = ""; 
                inputCantidad.value = "1"; 
                inputProducto.focus();

            } catch (e) { Swal.fire('Error', e.message, 'error'); }
            finally { 
                btn.disabled = false; 
                btn.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Agregar al registro de consumo'; 
            }
        };
    }

    const guardarAbono = async (metodo) => {
        if (!montoAbono) return;
        let monto = parseFloat(montoAbono.value);
        if (isNaN(monto) || monto <= 0) {
            Swal.fire('Cuidado', 'Por favor, ingresa un monto válido (Ejemplo: 15.50).', 'warning');
            return;
        }

        const fechaVal = fechaAbono.value;
        if (!fechaVal) {
            Swal.fire('Cuidado', 'Por favor, selecciona una fecha.', 'warning');
            return;
        }

        let pagador = "";
        if (inputPagador) {
            pagador = inputPagador.value.trim();
        }

        let mesDestino = mesFiltro.value;
        if (mesDestino === "todos") {
            mesDestino = new Date().getMonth().toString();
        }

        try {
            if (btnAbonoYape) btnAbonoYape.disabled = true;
            if (btnAbonoEfectivo) btnAbonoEfectivo.disabled = true;

            await addDoc(collection(db, "pagos"), {
                nombreUsuario: nombreUsuario,
                monto: monto,
                fecha: fechaVal,
                metodo: metodo, 
                pagador: pagador, 
                mesAplicado: mesDestino, 
                timestamp: Date.now()
            });

            montoAbono.value = ""; 
            if (inputPagador) inputPagador.value = "";
            montoAbono.focus();

        } catch (e) { 
            Swal.fire('Error', 'Error al registrar pago: ' + e.message, 'error');
        } finally { 
            if (btnAbonoYape) btnAbonoYape.disabled = false;
            if (btnAbonoEfectivo) btnAbonoEfectivo.disabled = false;
        }
    };

    if (btnAbonoYape) btnAbonoYape.addEventListener("click", () => guardarAbono("Yape"));
    if (btnAbonoEfectivo) btnAbonoEfectivo.addEventListener("click", () => guardarAbono("Efectivo"));

    const btnWhatsApp = document.getElementById("btnWhatsApp");
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener("click", () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;
            const consumosDelMes = historialConsumos.filter(r => mesSeleccionado === "todos" || new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);

            if (consumosDelMes.length === 0) { Swal.fire('Vacío', 'No hay consumos registrados en este mes para enviar.', 'info'); return; }

            const sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            const horaActual = new Date().getHours();
            let saludo = horaActual < 12 ? "Buenos días" : horaActual < 19 ? "Buenas tardes" : "Buenas noches";

            let mensaje = `*REGISTRO DE CONSUMO EN EL QUIOSCO*\n\n`;

            if (rolUsuario === "alumnos") {
                mensaje += `¡${saludo}! Esperamos que se encuentren muy bien.\nLe hacemos entrega del detalle de los consumos recientes de su niño(a) *${nombreUsuario}* correspondientes al mes de ${nombreMes}:\n\n`;
            } else {
                mensaje += `¡${saludo} *${nombreUsuario}*!\nLe compartimos el resumen de sus consumos realizados en el quiosco durante el mes de ${nombreMes}:\n\n`;
            }

            consumosDelMes.forEach(registro => {
                const [y, m, d] = registro.fecha.split('-');
                const fBonita = new Date(registro.fecha + 'T00:00:00');
                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                let detalleLimpio = registro.productoNombre.split(/<br>\s*\+?|<br>|\n/).map(item => item.trim().replace(/^\+\s*/, '')).filter(item => item !== '').join(" + ");
                mensaje += `- ${diasCortos[fBonita.getDay()]} ${d}/${m}: ${detalleLimpio} (S/ ${registro.precio.toFixed(2)})\n`;
            });

            mensaje += `\n*TOTAL A PAGAR DEL MES: S/ ${sumaTotal.toFixed(2)}*\n\n*Datos para realizar el pago (Yape):*\n- Titular: Rosa Ro***\n\nLe agradecemos el envío de la captura del pago por este medio. ¡Muchas gracias y que tenga un buen día!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
        });
    }

    const btnExportarPDF = document.getElementById("btnExportarPDF");

    if (btnExportarPDF) {
        btnExportarPDF.addEventListener("click", async () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMesHeader = mesFiltro.options[mesFiltro.selectedIndex].text;

            let consumosExportar = [];
            let tituloPeriodo = "";

            if (mesSeleccionado === "todos") {
                const { isConfirmed } = await Swal.fire({
                    title: 'Reporte Global',
                    text: 'Vas a descargar el historial de TODOS los meses registrados. ¿Deseas continuar?',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: '<i class="bi bi-file-pdf"></i> Sí, descargar todo',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#0d6efd'
                });
                
                if (!isConfirmed) return;
                
                consumosExportar = historialConsumos;
                tituloPeriodo = "HISTÓRICO COMPLETO";
                
            } else {
                const { value: seleccion } = await Swal.fire({
                    title: 'Descargar Reporte PDF',
                    text: `Mes seleccionado: ${nombreMesHeader}`,
                    input: 'select',
                    inputOptions: {
                        '5': 'Todo el mes',
                        '1': 'Solo Semana 01',
                        '2': 'Solo Semana 02',
                        '3': 'Solo Semana 03',
                        '4': 'Solo Semana 04'
                    },
                    inputValue: '5',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: '<i class="bi bi-file-pdf"></i> Generar PDF',
                    cancelButtonText: 'Cancelar'
                });

                if (!seleccion) return;

                let consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);

                if (seleccion !== "5") {
                    consumosDelMes = consumosDelMes.filter(r => obtenerSemanaDelMes(new Date(r.fecha + 'T00:00:00')) == seleccion);
                    tituloPeriodo = `SEMANA 0${seleccion} - ${nombreMesHeader}`;
                } else {
                    tituloPeriodo = `MES DE ${nombreMesHeader}`;
                }
                
                consumosExportar = consumosDelMes;
            }

            if (consumosExportar.length === 0) { 
                Swal.fire('Vacío', 'No hay datos para exportar en el periodo seleccionado.', 'info'); 
                return; 
            }

            let sumaTotalPDF_Test = 0;
            consumosExportar.forEach((r) => {
                const fechaObj = new Date(r.fecha + 'T00:00:00');
                const nombreMesR = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSem = obtenerSemanaDelMes(fechaObj);
                const idGrupo = `${nombreMesR}_${numSem}`;
                
                let semanaDoc = semanasPagadas.find(s => s.idGrupo === idGrupo);
                let itemPagado = false;
                if (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp)) {
                    itemPagado = true;
                }
                
                if (!itemPagado) sumaTotalPDF_Test += r.precio;
            });

            const ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';
            const tituloTotal = "TOTAL PENDIENTE";

            if (sumaTotalPDF_Test === 0) {
                const confZero = await Swal.fire({
                    title: 'Periodo Cancelado',
                    text: `El periodo seleccionado (${tituloPeriodo}) ya no tiene deudas pendientes. ¿Deseas descargar el reporte de todas formas como comprobante?`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#0d6efd',
                    confirmButtonText: 'Sí, descargar',
                    cancelButtonText: 'Cancelar'
                });
                if (!confZero.isConfirmed) return;
            }

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i>...';
            btnExportarPDF.disabled = true;

            let grupoActualPDF = "";
            let filasHtml = "";

            consumosExportar.forEach((r, index) => {
                const fechaObj = new Date(r.fecha + 'T00:00:00');
                const [y, m, d] = r.fecha.split('-');
                const nombreMesR = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSem = obtenerSemanaDelMes(fechaObj);
                const idGrupo = `${nombreMesR}_${numSem}`;

                let semanaDoc = semanasPagadas.find(s => s.idGrupo === idGrupo);
                let itemPagado = false;
                if (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp)) {
                    itemPagado = true;
                }

                if (idGrupo !== grupoActualPDF) {
                    grupoActualPDF = idGrupo;
                    
                    let itemsGrupo = consumosExportar.filter(x => {
                        const fO = new Date(x.fecha + 'T00:00:00');
                        return `${fO.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()}_${obtenerSemanaDelMes(fO)}` === idGrupo;
                    });
                    
                    let todosPagadosPDF = itemsGrupo.every(x => {
                        let s = semanasPagadas.find(sw => sw.idGrupo === idGrupo);
                        return s && (!x.timestamp || x.timestamp <= s.timestamp);
                    });

                    const badgePDF = todosPagadosPDF 
                        ? `<span style="color: #198754; font-size: 11px;">(✅ CANCELADA)</span>` 
                        : `<span style="color: #dc3545; font-size: 11px;">(⏳ PENDIENTE)</span>`;

                    filasHtml += `
                        <tr style="background-color: #f0f7fe; page-break-after: avoid;">
                            <td colspan="4" style="padding: 10px 15px; border-bottom: 1px solid #dee2e6; color: #0d6efd; font-weight: bold; font-size: 13px;">
                                <span style="margin-right: 10px;">📅</span> ${nombreMesR} - SEMANA 0${numSem} ${badgePDF}
                            </td>
                        </tr>
                    `;
                }

                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                const bgFila = index % 2 === 0 ? "#fffffe" : "#fcfcfb";
                const tachado = itemPagado ? "text-decoration: line-through; color: #6c757c !important;" : "";

                filasHtml += `
                    <tr style="background-color: ${bgFila}; page-break-inside: avoid;">
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #000001; font-weight: bold; text-align: left; width: 10%; ${tachado}">${diasCortos[fechaObj.getDay()]}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #495057; text-align: left; width: 15%; ${tachado}">${d}/${m}/${y}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212528; text-align: left; width: 55%; font-size: 14px; ${tachado}">${r.productoNombre}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212528; width: 20%;">
                            <div style="display: flex; justify-content: space-between; width: 85px; margin-left: auto; font-weight: bold; font-size: 15px; ${tachado}">
                                <span>S/</span>
                                <span>${r.precio.toFixed(2)}</span>
                            </div>
                        </td>
                    </tr>
                `;
            });

            const reciboPDF = document.createElement("div");
            reciboPDF.innerHTML = `
                <div style="width: 1120px; padding: 20px 40px; box-sizing: border-box; font-family: Arial, sans-serif; background-color: #fffffe; color: #000001;">
                    <div style="text-align: center; border-bottom: 3px solid #0d6efd; padding-bottom: 10px; margin-bottom: 15px;">
                        <div style="color: #0d6efd; margin: 0; font-size: 32px; font-weight: 900;">Quiosco</div>
                        <div style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; font-weight: bold;">REPORTE DE CONSUMO - ${tituloPeriodo}</div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8f9fb; border: 1px solid #dee2e6; color: #212528;">
                        <tr style="text-align: center;">
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>CLIENTE:</strong><br>${nombreUsuario}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>OCUPACIÓN:</strong><br>${ocupacionTexto}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>PERIODO:</strong><br>${tituloPeriodo}</td>
                            <td style="padding: 15px 10px; width: 25%;"><strong>EMISIÓN:</strong><br>${new Date().toLocaleDateString('es-PE')}</td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <thead>
                            <tr style="background-color: #0d6efd; color: #fffffe;">
                                <th style="padding: 12px 15px; text-align: left; width: 10%;">Día</th>
                                <th style="padding: 12px 15px; text-align: left; width: 15%;">Fecha</th>
                                <th style="padding: 12px 15px; text-align: left; width: 55%;">Detalle de Consumo</th>
                                <th style="padding: 12px 15px; text-align: right; width: 20%;">Importe</th>
                            </tr>
                        </thead>
                        <tbody>${filasHtml}</tbody>
                    </table>
                    <div style="page-break-inside: avoid;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 48%; padding-right: 15px;">
                                    <table style="width: 100%; background: #742384; border-radius: 12px; color: #fffffe; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="padding: 20px; vertical-align: middle; text-align: left;">
                                                <div style="font-size: 20px; font-weight: 900;">YAPE</div>
                                                <p style="margin: 0; font-size: 14px;">TITULAR: ROSA RO***</p>
                                            </td>
                                            <td style="padding: 20px; vertical-align: middle; text-align: right; width: 110px;">
                                                <table style="background: #fffffe; border-radius: 8px; width: 90px; height: 90px; border-collapse: collapse; margin-left: auto;">
                                                    <tr>
                                                        <td style="text-align: center; vertical-align: middle; padding: 0;">
                                                            <img src="yape.png" style="width: 75px; height: 75px; display: block; margin: 0 auto;">
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td style="width: 52%; padding-left: 15px;">
                                    <table style="width: 100%; background-color: #e9ecef; border-radius: 12px; border: 1px solid #dee2e6; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="text-align: center; vertical-align: middle; padding: 20px;">
                                                <div style="margin: 0 0 5px 0; color: #212528; font-weight: 900; font-size: 18px; letter-spacing: 0.5px; text-transform: uppercase;">${tituloTotal}</div>
                                                <div style="margin: 0; font-size: 42px; color: #0d6efd; font-weight: 900;">S/ ${sumaTotalPDF_Test.toFixed(2)}</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <div style="text-align: center; color: #495057; font-size: 15px; margin-top: 25px; font-weight: bold; font-style: italic;">
                            <p>Se agradece el pronto pago de su cuenta, Tenga un excelente día.</p>
                        </div>
                    </div>
                </div>
            `;

            const opcionesPDF = {
                margin: [5, 0, 10, 0],
                filename: `Consumo_${nombreUsuario.replace(/ /g, "_")}_${tituloPeriodo.replace(/ /g, "_")}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { scale: 2, useCORS: true, width: 1120, windowWidth: 1120, x: 0, y: 0, scrollX: 0, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opcionesPDF).from(reciboPDF).save().then(() => {
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
            }).catch(error => {
                console.error("ERROR PDF:", error);
                btnExportarPDF.disabled = false;
            });
        });
    }

    const btnEstadisticas = document.getElementById("btnEstadisticas");
    if (btnEstadisticas) {
        btnEstadisticas.addEventListener("click", () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;
            const consumosDelMes = historialConsumos.filter(r => mesSeleccionado === "todos" || new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);

            if (consumosDelMes.length === 0) {
                Swal.fire('Sin datos', 'No hay consumos registrados para generar un gráfico.', 'info');
                return;
            }

            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            let gastosPorDia = { 'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0 };

            consumosDelMes.forEach(r => {
                const f = new Date(r.fecha + 'T00:00:00');
                const nombreDia = dias[f.getDay()];
                if(gastosPorDia[nombreDia] !== undefined) {
                    gastosPorDia[nombreDia] += r.precio;
                }
            });

            const labels = Object.keys(gastosPorDia);
            const data = Object.values(gastosPorDia);

            const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';

            Swal.fire({
                title: `Gastos de ${nombreMes}`,
                html: '<canvas id="miGrafico" style="width:100%; max-height:300px;"></canvas>',
                width: 600,
                background: isDark ? '#1e1e1e' : '#ffffff', 
                color: isDark ? '#f8f9fa' : '#212529', 
                showConfirmButton: true,
                confirmButtonText: '<i class="bi bi-check-lg"></i> Entendido',
                confirmButtonColor: '#0d6efd',
                didOpen: () => {
                    const ctx = document.getElementById('miGrafico').getContext('2d');
                    const textColor = isDark ? '#e0e0e0' : '#6c757d';

                    new Chart(ctx, {
                        type: 'bar', 
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Total Gastado (S/)',
                                data: data,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.7)',
                                    'rgba(54, 162, 235, 0.7)',
                                    'rgba(255, 206, 86, 0.7)',
                                    'rgba(75, 192, 192, 0.7)',
                                    'rgba(153, 102, 255, 0.7)',
                                    'rgba(255, 159, 64, 0.7)'
                                ],
                                borderColor: [
                                    'rgba(255, 99, 132, 1)',
                                    'rgba(54, 162, 235, 1)',
                                    'rgba(255, 206, 86, 1)',
                                    'rgba(75, 192, 192, 1)',
                                    'rgba(153, 102, 255, 1)',
                                    'rgba(255, 159, 64, 1)'
                                ],
                                borderWidth: 1,
                                borderRadius: 6
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { labels: { color: textColor } }
                            },
                            scales: { 
                                y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: isDark ? '#333' : '#e9ecef' } },
                                x: { ticks: { color: textColor }, grid: { display: false } }
                            }
                        }
                    });
                }
            });
        });
    }

    const navbar = document.getElementById("main-navbar");
    let ultimoScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (navbar) {
        window.addEventListener("scroll", () => {
            let scrollActual = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollActual > ultimoScroll && scrollActual > 60) {
                navbar.style.top = `-${navbar.offsetHeight}px`; 
            }
            else {
                navbar.style.top = "0"; 
            }
            ultimoScroll = scrollActual <= 0 ? 0 : scrollActual; 
        });
    }
});