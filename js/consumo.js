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

    let iconoHtml = "", colorFondo = "", colorTexto = "text-white";
    if (rolUsuario === "profesores") { iconoHtml = '<i class="bi bi-person-workspace"></i>'; colorFondo = "#0d6efd"; if (etiquetaRolEl) etiquetaRolEl.textContent = "Profesor"; }
    else if (rolUsuario === "alumnos") { iconoHtml = '<i class="bi bi-mortarboard-fill"></i>'; colorFondo = "#ffc107"; colorTexto = "text-dark"; if (etiquetaRolEl) etiquetaRolEl.textContent = "Alumno"; }
    else if (rolUsuario === "administrativos") { iconoHtml = '<i class="bi bi-person-badge-fill"></i>'; colorFondo = "#198754"; if (etiquetaRolEl) etiquetaRolEl.textContent = "Administrativo"; }
    else { iconoHtml = '<i class="bi bi-person-fill"></i>'; colorFondo = "#6c757d"; if (etiquetaRolEl) etiquetaRolEl.textContent = "Personal"; }

    if (nombrePersonaEl) nombrePersonaEl.textContent = nombreUsuario;
    if (avatarFondoEl) {
        avatarFondoEl.style.backgroundColor = colorFondo;
        avatarFondoEl.innerHTML = `<span class="fs-5 ${colorTexto}" style="line-height: 1;">${iconoHtml}</span>`;
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
    const productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];

    const fechaHoy = new Date();
    if (fechaConsumo) fechaConsumo.valueAsDate = fechaHoy;
    if (fechaAbono) fechaAbono.valueAsDate = fechaHoy;

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
    if (mesFiltro) mesFiltro.value = fechaHoy.getMonth().toString();

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
                        li.innerHTML = `<a class="dropdown-item d-flex justify-content-between" href="#"><span>${p.nombre}</span><small>S/ ${p.precio.toFixed(2)}</small></a>`;
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

        let consumidoMostrar = 0;
        let pagadoMostrar = 0;

        if (mesSeleccionado === "todos") {
            tituloEstadoMes.innerHTML = "ESTADO DE CUENTA: HISTÓRICO GENERAL";
            if (btnMarcarMesPagado) btnMarcarMesPagado.style.display = "none";
            consumidoMostrar = historialConsumos.reduce((acc, r) => acc + r.precio, 0);
            pagadoMostrar = historialPagos.reduce((acc, p) => acc + p.monto, 0);
        } else {
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            tituloEstadoMes.innerHTML = `ESTADO DE GESTIÓN: ${nombreMes}`;
            if (btnMarcarMesPagado) btnMarcarMesPagado.style.display = "inline-block";

            const consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            const pagosDelMes = historialPagos.filter(p => {
                let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : new Date(p.fecha + 'T00:00:00').getMonth().toString();
                return mesDelPago === mesSeleccionado;
            });

            let totalConsumoBruto = 0;
            let consumoSemanasPagadas = 0;

            consumosDelMes.forEach(r => {
                totalConsumoBruto += r.precio;
                let fechaObj = new Date(r.fecha + 'T00:00:00');
                let nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSemana = obtenerSemanaDelMes(fechaObj);
                let idGrupo = `${nombreMesConsumo}_${numSemana}`;
                
                if (semanasPagadas.some(s => s.idGrupo === idGrupo)) {
                    consumoSemanasPagadas += r.precio;
                }
            });

            consumidoMostrar = totalConsumoBruto - consumoSemanasPagadas;
            let totalPagosBruto = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
            pagadoMostrar = totalPagosBruto - consumoSemanasPagadas;
            if (pagadoMostrar < 0) pagadoMostrar = 0; 
        }

        if (estadoCuentaGlobalVisual) estadoCuentaGlobalVisual.style.display = "none";

        const saldo = pagadoMostrar - consumidoMostrar;

        let badgeHTML = "";
        if (saldo < -0.01) {
            badgeHTML = `<span class="badge bg-danger px-4 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;"><i class="bi bi-exclamation-triangle-fill me-1"></i> DEUDA: S/ ${Math.abs(saldo).toFixed(2)}</span>`;
        } else if (saldo > 0.01) {
            badgeHTML = `<span class="badge bg-success px-4 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;"><i class="bi bi-check-circle-fill me-1"></i> A FAVOR: S/ ${saldo.toFixed(2)}</span>`;
        } else {
            badgeHTML = `<span class="badge bg-secondary px-4 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;"><i class="bi bi-shield-check me-1"></i> PAGADO AL DÍA</span>`;
        }

        estadoCuentaMesVisual.innerHTML = `
            <div class="d-inline-flex bg-white px-4 py-3 rounded-4 shadow-sm border border-light mb-3 w-100 justify-content-center" style="max-width: 320px;">
                <div class="pe-4 border-end w-50 text-center">
                    <span class="d-block text-muted" style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px;">POR CANCELAR</span>
                    <span class="fw-bold text-dark lh-1" style="font-size: 1.4rem;">S/ ${consumidoMostrar.toFixed(2)}</span>
                </div>
                <div class="ps-4 w-50 text-center">
                    <span class="d-block text-muted" style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.5px;">PAGO:</span>
                    <span class="fw-bold text-success lh-1" style="font-size: 1.4rem;">S/ ${pagadoMostrar.toFixed(2)}</span>
                </div>
            </div>
            <div class="text-center mt-1">
                ${badgeHTML}
            </div>
        `;
    }

    if (btnMarcarMesPagado) {
        btnMarcarMesPagado.onclick = async () => {
            const mesSeleccionado = mesFiltro.value;
            if (mesSeleccionado === "todos") return;
            
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            if (!confirm(`¿Deseas marcar TODO EL MES DE ${nombreMes} como cancelado?\n\nEsto saldará todas las semanas pendientes de este mes.`)) return;

            const consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            const gruposSemanas = [...new Set(consumosDelMes.map(r => {
                let f = new Date(r.fecha + 'T00:00:00');
                return `${f.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()}_${obtenerSemanaDelMes(f)}`;
            }))];

            if (gruposSemanas.length === 0) {
                alert("No hay consumos en este mes para marcar.");
                return;
            }

            try {
                btnMarcarMesPagado.disabled = true;
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
            } catch (e) {
                alert("Error al marcar el mes: " + e.message);
            } finally {
                btnMarcarMesPagado.disabled = false;
            }
        };
    }

    window.modoEdicionActiva = null; 

    window.editarRegistro = (id, productoActual, precioActual, fechaDB) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (fechaConsumo) fechaConsumo.value = fechaDB;
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

        let nuevoMontoStr = prompt("1. EDITAR MONTO DEL ABONO (S/):", montoActual);
        if (nuevoMontoStr === null) return;
        let nuevoMonto = parseFloat(nuevoMontoStr.replace(',', '.'));
        if (isNaN(nuevoMonto) || nuevoMonto <= 0) { alert("Monto inválido"); return; }

        let nuevaFechaUser = prompt("2. EDITAR FECHA (DD-MM-YYYY):", fechaUser);
        if (!nuevaFechaUser) return;
        if (!/^\d{2}-\d{2}-\d{4}$/.test(nuevaFechaUser)) { alert("Formato de fecha incorrecto."); return; }
        const partes = nuevaFechaUser.split('-');
        const nuevaFechaDB = `${partes[2]}-${partes[1]}-${partes[0]}`;

        let nuevoMetodo = prompt("3. EDITAR MÉTODO (Escribe 'Yape' o 'Efectivo'):", metodoActual || "Efectivo");
        if (nuevoMetodo === null) return;
        nuevoMetodo = nuevoMetodo.trim();
        if (nuevoMetodo.toLowerCase() !== 'yape' && nuevoMetodo.toLowerCase() !== 'efectivo') {
            nuevoMetodo = "Efectivo"; 
        } else {
            nuevoMetodo = nuevoMetodo.charAt(0).toUpperCase() + nuevoMetodo.slice(1).toLowerCase();
        }

        let nuevoPagador = prompt("4. EDITAR NOMBRE DE QUIEN PAGÓ (Opcional):", pagadorActual || "");
        if (nuevoPagador === null) return;

        try {
            await updateDoc(doc(db, "pagos", id), {
                monto: nuevoMonto,
                fecha: nuevaFechaDB,
                metodo: nuevoMetodo,
                pagador: nuevoPagador.trim()
            });
        } catch (e) { alert("Error al editar el pago: " + e.message); }
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
            
            const textoPagador = pago.pagador ? `<br><small class="text-secondary fw-bold"><i class="bi bi-person me-1"></i>${pago.pagador}</small>` : "";

            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center px-3 py-3 border-bottom";
            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style="width: 35px; height: 35px; background-color: ${colorMetodo}; color: white;">
                        <i class="bi ${iconoMetodo}" style="font-size: 1rem;"></i>
                    </div>
                    <div>
                        <span class="d-block text-dark fw-bold" style="font-size: 0.95rem;">S/ ${pago.monto.toFixed(2)} <span class="badge ms-1" style="background-color: ${colorMetodo}; font-size: 0.65rem; padding: 0.25em 0.5em;">${metodo}</span></span>
                        <small class="text-muted" style="font-size: 0.8rem;">Abonado el ${d}/${m}/${y}</small>${textoPagador}
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

    window.toggleSemanaPagada = async (idGrupo, estaPagada) => {
        const docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
        
        try {
            if (estaPagada) {
                if(confirm("¿Desmarcar esta semana? Sus montos volverán a sumarse a la deuda actual del mes.")) {
                    await deleteDoc(doc(db, "semanas_pagadas", docId));
                }
            } else {
                if(confirm("¿Marcar esta semana como CANCELADA?\n\nAl confirmar, los consumos de esta semana se restarán de la deuda activa.")) {
                    await setDoc(doc(db, "semanas_pagadas", docId), {
                        nombreUsuario: nombreUsuario,
                        idGrupo: idGrupo,
                        timestamp: Date.now()
                    });
                }
            }
        } catch (e) {
            alert("Error al actualizar la semana: " + e.message);
        }
    };

    function renderizarConsumos() {
        if (!tablaConsumos) return;
        tablaConsumos.innerHTML = "";
        let total = 0; 
        const mes = mesFiltro.value; 
        const filtrados = historialConsumos.filter(r => mes === "todos" || new Date(r.fecha + 'T00:00:00').getMonth() == mes);

        if (filtrados.length === 0) {
            tablaConsumos.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No hay consumos en este mes.</td></tr>';
            totalAcumulado.textContent = "S/ 0.00";
            return;
        }

        let grupoActual = ""; 

        filtrados.forEach(r => {
            const fechaObj = new Date(r.fecha + 'T00:00:00');
            const nombreMesConsumo = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
            
            let numSemana = obtenerSemanaDelMes(fechaObj);
            const identificadorGrupo = `${nombreMesConsumo}_${numSemana}`;

            const estaPagada = semanasPagadas.some(s => s.idGrupo === identificadorGrupo);

            if (identificadorGrupo !== grupoActual) {
                grupoActual = identificadorGrupo;
                
                const textoCabecera = mes === "todos" 
                    ? `${nombreMesConsumo} - SEMANA 0${numSemana}` 
                    : `SEMANA 0${numSemana}`;

                let colorFondo = estaPagada ? '#d1e7dd' : '#f0f7ff';
                let colorBorde = estaPagada ? '#198754' : '#0d6efd';
                let colorTexto = estaPagada ? 'text-success' : 'text-primary';
                let botonAccion = estaPagada 
                    ? `<button class="btn btn-sm btn-success rounded-pill fw-bold py-0 shadow-sm" onclick="window.toggleSemanaPagada('${identificadorGrupo}', true)"><i class="bi bi-check-circle-fill me-1"></i> Cancelada</button>`
                    : `<button class="btn btn-sm btn-outline-primary rounded-pill fw-bold bg-white py-0 shadow-sm" onclick="window.toggleSemanaPagada('${identificadorGrupo}', false)"><i class="bi bi-wallet2 me-1"></i> Marcar pagada</button>`;

                const trSemana = document.createElement("tr");
                trSemana.innerHTML = `
                    <td colspan="4" class="fw-bold py-2 ps-4 ${colorTexto}" style="background-color: ${colorFondo}; border-left: 5px solid ${colorBorde}; font-size: 0.9rem;">
                        <div class="d-flex justify-content-between align-items-center pe-2">
                            <span><i class="bi bi-calendar3 me-2"></i> ${textoCabecera}</span>
                            ${botonAccion}
                        </div>
                    </td>
                `;
                tablaConsumos.appendChild(trSemana);
            }

            if (!estaPagada) {
                total += r.precio;
            }
            
            const f = fechaObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
            const tr = document.createElement("tr");
            const nombreSeguro = r.productoNombre.replace(/'/g, "\\'");
            
            const tachado = estaPagada ? "text-decoration: line-through; opacity: 0.6;" : "";

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
        totalAcumulado.textContent = `S/ ${total.toFixed(2)}`;
    }

    if (mesFiltro) {
        mesFiltro.addEventListener("change", () => {
            renderizarConsumos();
            recalcularSaldoGlobal();
            renderizarListaPagos(); 
        });
    }

    window.eliminarRegistro = async (id) => { if (confirm("¿Borrar este consumo?")) await deleteDoc(doc(db, "consumos", id)); };
    window.eliminarPago = async (id) => { if (confirm("¿Estás seguro de anular este abono? El saldo de deuda/favor se recalculará automáticamente.")) await deleteDoc(doc(db, "pagos", id)); };

    if (formConsumo) {
        formConsumo.onsubmit = async (e) => {
            e.preventDefault();
            const btn = formConsumo.querySelector("button[type='submit']");
            const fecha = fechaConsumo.value;
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
                    alert(`El producto "${nombreLimpio}" NO EXISTE en tu inventario.\nPor favor, selecciónalo de la lista desplegable.`);
                    return;
                }

                let precioDelProducto = 0;
                let nombreParaHistorial = nombreLimpio;

                if (precioPersonalizado !== null) {
                    precioDelProducto = precioPersonalizado;
                    nombreParaHistorial = `${nombreLimpio} (S/ ${precioDelProducto.toFixed(2)})`;
                } else {
                    precioDelProducto = productoEncontrado.precio;
                    nombreParaHistorial = productoEncontrado.nombre;

                    let cat = (productoEncontrado.categoria || "").toLowerCase();
                    let nom = productoEncontrado.nombre.toLowerCase();
                    if (cat === "comida" || cat === "menu" || cat === "menú" || nom.includes("comida") || nom.includes("menu")) {
                        let precioIngresado = prompt(`Ingrese el precio para el plato "${productoEncontrado.nombre}":\n(Ej: 5, 7.50)`, productoEncontrado.precio);
                        if (precioIngresado === null || precioIngresado.trim() === "" || isNaN(parseFloat(precioIngresado.replace(',', '.')))) {
                            alert("Registro cancelado. Debe ingresar un precio válido.");
                            return;
                        }
                        precioDelProducto = parseFloat(precioIngresado.replace(',', '.'));
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
                            precio: precioTotalFinal
                        });
                    }
                }

                inputProducto.value = ""; 
                inputCantidad.value = "1"; 
                inputProducto.focus();

            } catch (e) { alert("Error: " + e.message); }
            finally { 
                btn.disabled = false; 
                btn.innerHTML = '<i class="bi bi-plus-lg"></i> Agregar al carrito del día'; 
            }
        };
    }

    const guardarAbono = async (metodo) => {
        if (!montoAbono) return;
        let monto = parseFloat(montoAbono.value);
        if (isNaN(monto) || monto <= 0) {
            alert("Por favor, ingresa un monto válido (Ejemplo: 15.50).");
            return;
        }

        const fechaVal = fechaAbono.value;
        if (!fechaVal) {
            alert("Por favor, selecciona una fecha.");
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
            alert("Error al registrar abono: " + e.message); 
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

            if (consumosDelMes.length === 0) { alert("No hay consumos registrados en este mes para enviar."); return; }

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
        btnExportarPDF.addEventListener("click", () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMesHeader = mesFiltro.options[mesFiltro.selectedIndex].text;

            if (mesSeleccionado === "todos") {
                alert("Por favor, selecciona un mes específico en el filtro arriba para descargar el reporte.");
                return;
            }

            const seleccion = prompt(
                "¿Qué periodo deseas descargar en el PDF?\n\n" +
                "1 - Semana 01\n" +
                "2 - Semana 02\n" +
                "3 - Semana 03\n" +
                "4 - Semana 04\n" +
                "5 - TODO EL MES (Excluye montos cancelados)", "5"
            );

            if (!seleccion || !["1", "2", "3", "4", "5"].includes(seleccion)) return;

            let consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);

            if (seleccion !== "5") {
                consumosDelMes = consumosDelMes.filter(r => {
                    let numSem = obtenerSemanaDelMes(new Date(r.fecha + 'T00:00:00'));
                    return numSem == seleccion;
                });
            }

            if (consumosDelMes.length === 0) { alert("No hay datos para exportar en el periodo seleccionado."); return; }

            // ALERTA INTELIGENTE ANTES DEL PDF
            let sumaTotalPDF_Test = 0;
            consumosDelMes.forEach((r) => {
                const fechaObj = new Date(r.fecha + 'T00:00:00');
                const nombreMesR = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSem = obtenerSemanaDelMes(fechaObj);
                const idGrupo = `${nombreMesR}_${numSem}`;
                const estaPagada = semanasPagadas.some(s => s.idGrupo === idGrupo);
                if (!estaPagada) sumaTotalPDF_Test += r.precio;
            });

            const ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';
            const tituloPeriodo = seleccion === "5" ? `MES DE ${nombreMesHeader}` : `SEMANA 0${seleccion} - ${nombreMesHeader}`;
            const tituloTotal = seleccion === "5" ? "TOTAL PENDIENTE" : `TOTAL SEMANA 0${seleccion}`;

            if (sumaTotalPDF_Test === 0) {
                if (!confirm(`El periodo seleccionado (${tituloPeriodo}) ya se encuentra totalmente CANCELADO.\n\n¿Deseas descargar el reporte de todas formas como comprobante?`)) {
                    return; 
                }
            }

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i>...';
            btnExportarPDF.disabled = true;

            let grupoActualPDF = "";
            let filasHtml = "";
            let sumaTotalPDF = 0;

            consumosDelMes.forEach((r, index) => {
                const fechaObj = new Date(r.fecha + 'T00:00:00');
                const [y, m, d] = r.fecha.split('-');
                const nombreMesR = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                let numSem = obtenerSemanaDelMes(fechaObj);
                const idGrupo = `${nombreMesR}_${numSem}`;

                const estaPagada = semanasPagadas.some(s => s.idGrupo === idGrupo);

                if (idGrupo !== grupoActualPDF) {
                    grupoActualPDF = idGrupo;
                    const textoCab = mesSeleccionado === "todos" ? `${nombreMesR} - SEMANA 0${numSem}` : `SEMANA 0${numSem}`;
                    const badgePDF = estaPagada 
                        ? `<span style="color: #198754; font-size: 11px;">(✅ CANCELADA)</span>` 
                        : `<span style="color: #dc3545; font-size: 11px;">(⏳ PENDIENTE)</span>`;

                    filasHtml += `
                        <tr style="background-color: #f0f7ff; page-break-after: avoid;">
                            <td colspan="4" style="padding: 10px 15px; border-bottom: 1px solid #dee2e6; color: #0d6efd; font-weight: bold; font-size: 13px;">
                                <span style="margin-right: 10px;">📅</span> ${textoCab} ${badgePDF}
                            </td>
                        </tr>
                    `;
                }

                if (!estaPagada) {
                    sumaTotalPDF += r.precio;
                }

                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                const bgFila = index % 2 === 0 ? "#ffffff" : "#fcfcfc";
                const tachado = estaPagada ? "text-decoration: line-through; color: #6c757d !important;" : "";

                filasHtml += `
                    <tr style="background-color: ${bgFila}; page-break-inside: avoid;">
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #000000; font-weight: bold; text-align: left; width: 10%; ${tachado}">${diasCortos[fechaObj.getDay()]}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #495057; text-align: left; width: 15%; ${tachado}">${d}/${m}/${y}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; text-align: left; width: 55%; font-size: 14px; ${tachado}">${r.productoNombre}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; width: 20%;">
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
                <div style="width: 1120px; padding: 20px 40px; box-sizing: border-box; font-family: Arial, sans-serif; background-color: white;">
                    <div style="text-align: center; border-bottom: 3px solid #0d6efd; padding-bottom: 10px; margin-bottom: 15px;">
                        <h1 style="color: #0d6efd; margin: 0; font-size: 28px; font-weight: 900;">Quiosco</h1>
                        <h3 style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase;">REPORTE DE CONSUMO - ${tituloPeriodo}</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
                        <tr style="text-align: center;">
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>CLIENTE:</strong><br>${nombreUsuario}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>OCUPACIÓN:</strong><br>${ocupacionTexto}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>PERIODO:</strong><br>${tituloPeriodo}</td>
                            <td style="padding: 15px 10px; width: 25%;"><strong>EMISIÓN:</strong><br>${new Date().toLocaleDateString('es-PE')}</td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <thead>
                            <tr style="background-color: #0d6efd; color: white;">
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
                                    <table style="width: 100%; background: #742384; border-radius: 12px; color: white; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="padding: 20px; vertical-align: middle; text-align: left;">
                                                <div style="font-size: 20px; font-weight: 900;">YAPE</div>
                                                <p style="margin: 0; font-size: 14px;">TITULAR: ROSA RO***</p>
                                            </td>
                                            <td style="padding: 20px; vertical-align: middle; text-align: right; width: 110px;">
                                                <table style="background: white; border-radius: 8px; width: 90px; height: 90px; border-collapse: collapse; margin-left: auto;">
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
                                                <p style="margin: 0 0 5px 0; color: #212529; font-weight: 900; font-size: 18px; letter-spacing: 0.5px; text-transform: uppercase;">${tituloTotal}</p>
                                                <h2 style="margin: 0; font-size: 42px; color: #0d6efd; font-weight: 900;">S/ ${sumaTotalPDF.toFixed(2)}</h2>
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