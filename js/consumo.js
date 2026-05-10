import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
    const params = new URLSearchParams(window.location.search);
    const nombreUsuario = params.get("nombre") || "Usuario Desconocido";
    const rolUsuario = params.get("rol") || "index";

    // Elementos visuales superiores
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

    // Formularios y DOM
    const inputProducto = document.getElementById("inputProducto");
    const inputCantidad = document.getElementById("inputCantidad");
    const listaSugerencias = document.getElementById("listaSugerencias");
    const fechaConsumo = document.getElementById("fechaConsumo");
    const formConsumo = document.getElementById("formConsumo");
    const tablaConsumos = document.getElementById("tablaConsumos");
    const totalAcumulado = document.getElementById("totalAcumulado");
    const mesFiltro = document.getElementById("mesFiltro");

    // Elementos Estado Cuenta Dual
    const tituloEstadoMes = document.getElementById("tituloEstadoMes");
    const estadoCuentaMesVisual = document.getElementById("estadoCuentaMesVisual");
    const estadoCuentaGlobalVisual = document.getElementById("estadoCuentaGlobalVisual");
    const btnRegistrarPago = document.getElementById("btnRegistrarPago");
    const contenedorHistorialPagos = document.getElementById("contenedorHistorialPagos");
    const listaPagosVisual = document.getElementById("listaPagosVisual");

    let historialConsumos = [];
    let historialPagos = [];
    const productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];

    const fechaHoy = new Date();
    if (fechaConsumo) fechaConsumo.valueAsDate = fechaHoy;
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

    // Autocompletado
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

    // Lectura en tiempo real (Consumos y Pagos)
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

    // Cálculos de cuentas (Mes vs Global)
    function recalcularSaldoGlobal() {
        if (!estadoCuentaMesVisual) return;

        const mesSeleccionado = mesFiltro.value;
        const totalConsumidoHistorico = historialConsumos.reduce((acc, r) => acc + r.precio, 0);
        const totalPagadoHistorico = historialPagos.reduce((acc, p) => acc + p.monto, 0);

        let consumidoMostrar = 0;
        let pagadoMostrar = 0;

        if (mesSeleccionado === "todos") {
            tituloEstadoMes.innerHTML = "ESTADO DE CUENTA: HISTÓRICO GENERAL";
            consumidoMostrar = totalConsumidoHistorico;
            pagadoMostrar = totalPagadoHistorico;
        } else {
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            tituloEstadoMes.innerHTML = `CUENTA INDEPENDIENTE: ${nombreMes}`;

            const consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            
            // FILTRO INTELIGENTE: Filtra por "mesAplicado" si existe, sino por fecha normal
            const pagosDelMes = historialPagos.filter(p => {
                let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : new Date(p.fecha + 'T00:00:00').getMonth().toString();
                return mesDelPago === mesSeleccionado;
            });

            consumidoMostrar = consumosDelMes.reduce((acc, r) => acc + r.precio, 0);
            pagadoMostrar = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
        }

        if (estadoCuentaGlobalVisual) estadoCuentaGlobalVisual.style.display = "none";

        const saldo = pagadoMostrar - consumidoMostrar;

        let badgeHTML = "";
        if (saldo < -0.01) {
            badgeHTML = `<span class="badge bg-danger fs-6 px-4 py-2 rounded-pill shadow-sm"><i class="bi bi-exclamation-triangle-fill me-1"></i> DEUDA: S/ ${Math.abs(saldo).toFixed(2)}</span>`;
        } else if (saldo > 0.01) {
            badgeHTML = `<span class="badge bg-success fs-6 px-4 py-2 rounded-pill shadow-sm"><i class="bi bi-check-circle-fill me-1"></i> A FAVOR: S/ ${saldo.toFixed(2)}</span>`;
        } else {
            badgeHTML = `<span class="badge bg-secondary fs-6 px-4 py-2 rounded-pill shadow-sm"><i class="bi bi-shield-check me-1"></i> CANCELADO AL DÍA</span>`;
        }

        estadoCuentaMesVisual.innerHTML = `
            <div class="d-flex flex-wrap align-items-center gap-3 mt-2 font-sans">
                <div class="d-flex bg-white px-3 py-2 rounded-3 shadow-sm border border-light">
                    <div class="pe-3 border-end">
                        <span class="d-block text-muted" style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px;">TOTAL CONSUMIDO</span>
                        <span class="fs-5 fw-bold text-dark lh-1">S/ ${consumidoMostrar.toFixed(2)}</span>
                    </div>
                    <div class="ps-3">
                        <span class="d-block text-muted" style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px;">TOTAL ABONADO</span>
                        <span class="fs-5 fw-bold text-success lh-1">S/ ${pagadoMostrar.toFixed(2)}</span>
                    </div>
                </div>
                <div>
                    ${badgeHTML}
                </div>
            </div>
        `;
    }

    // =========================================================
    // FUNCIONES DE EDICIÓN
    // =========================================================
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

    window.editarPago = async (id, montoActual, fechaDB) => {
        const p = fechaDB.split('-');
        const fechaUser = `${p[2]}-${p[1]}-${p[0]}`;

        let nuevoMontoStr = prompt("EDITAR MONTO DEL ABONO:", montoActual);
        if (nuevoMontoStr === null) return;
        let nuevoMonto = parseFloat(nuevoMontoStr.replace(',', '.'));

        let nuevaFechaUser = prompt("EDITAR FECHA DEL ABONO (DD-MM-YYYY):", fechaUser);
        if (!nuevaFechaUser) return;

        if (!/^\d{2}-\d{2}-\d{4}$/.test(nuevaFechaUser)) {
            alert("Formato de fecha incorrecto.");
            return;
        }

        const partes = nuevaFechaUser.split('-');
        const nuevaFechaDB = `${partes[2]}-${partes[1]}-${partes[0]}`;

        try {
            await updateDoc(doc(db, "pagos", id), {
                monto: nuevoMonto,
                fecha: nuevaFechaDB
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
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-1";
            li.innerHTML = `
                <span class="text-dark" style="font-size: 0.9rem;"><i class="bi bi-arrow-down-right-circle text-success me-1"></i> Abono del ${d}-${m}-${y}</span>
                <div>
                    <span class="fw-bold text-success me-3">S/ ${pago.monto.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-primary border-0 py-0 px-1 me-1" onclick="window.editarPago('${pago.id}', ${pago.monto}, '${pago.fecha}')"><i class="bi bi-pencil-square fs-5"></i></button>
                    <button class="btn btn-sm btn-outline-danger border-0 py-0 px-1" onclick="eliminarPago('${pago.id}')"><i class="bi bi-x fs-5"></i></button>
                </div>
            `;
            listaPagosVisual.appendChild(li);
        });
    }

    // MATEMÁTICA DE CALENDARIO REAL (Lunes a Domingo)
    function obtenerSemanaDelMes(fechaObj) {
        const primerDia = new Date(fechaObj.getFullYear(), fechaObj.getMonth(), 1);
        let ajuste = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1; // Ajuste para que Lunes sea 0 y Domingo 6
        return Math.ceil((fechaObj.getDate() + ajuste) / 7);
    }

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
            
            // Calculamos la semana real del calendario (empieza los lunes)
            let numSemana = obtenerSemanaDelMes(fechaObj);

            const identificadorGrupo = `${nombreMesConsumo}_${numSemana}`;

            if (identificadorGrupo !== grupoActual) {
                grupoActual = identificadorGrupo;
                
                const textoCabecera = mes === "todos" 
                    ? `${nombreMesConsumo} - SEMANA 0${numSemana}` 
                    : `SEMANA 0${numSemana}`;

                const trSemana = document.createElement("tr");
                trSemana.innerHTML = `
                    <td colspan="4" class="fw-bold py-2 ps-4 text-primary" style="background-color: #f0f7ff; border-left: 5px solid #0d6efd; font-size: 0.9rem;">
                        <i class="bi bi-calendar3 me-2"></i> ${textoCabecera}
                    </td>
                `;
                tablaConsumos.appendChild(trSemana);
            }

            total += r.precio;
            
            const f = fechaObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
            const tr = document.createElement("tr");
            
            const nombreSeguro = r.productoNombre.replace(/'/g, "\\'");

            tr.innerHTML = `
                <td class="ps-4 text-muted small">${f.charAt(0).toUpperCase() + f.slice(1)}</td>
                <td class="fw-bold text-dark">${r.productoNombre}</td>
                <td class="text-center fw-bold text-dark">S/ ${r.precio.toFixed(2)}</td>
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

    // =========================================================
    // GUARDADO INTELIGENTE (Modo Nuevo y Modo Edición)
    // =========================================================
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

    // =========================================================
    // REGISTRAR PAGO CON ANCLAJE DE MES
    // =========================================================
    if (btnRegistrarPago) {
        btnRegistrarPago.addEventListener("click", async () => {
            let monto = prompt(`1. ¿Cuánto dinero está entregando ${nombreUsuario} hoy?\n\n(Ejemplo: 20, 50.50)`);
            if (!monto) return;
            monto = parseFloat(monto.replace(',', '.'));

            if (isNaN(monto) || monto <= 0) { alert("Monto inválido."); return; }

            const f = new Date();
            const fechaHoyUser = `${String(f.getDate()).padStart(2, '0')}-${String(f.getMonth() + 1).padStart(2, '0')}-${f.getFullYear()}`;

            let fechaIngresada = prompt(`2. Ingresa la fecha real del abono.\n\nFormato: DÍA-MES-AÑO (Ejemplo: 15-04-2026):`, fechaHoyUser);
            if (!fechaIngresada) return;
            fechaIngresada = fechaIngresada.trim();

            if (!/^\d{2}-\d{2}-\d{4}$/.test(fechaIngresada)) {
                alert("Formato de fecha incorrecto. Debe tener los guiones y ser DÍA-MES-AÑO. Cancelado.");
                return;
            }

            const partes = fechaIngresada.split('-');
            const fechaDB = `${partes[2]}-${partes[1]}-${partes[0]}`;

            // Anclar el pago al mes que se está visualizando en el filtro
            let mesDestino = mesFiltro.value;
            if (mesDestino === "todos") {
                mesDestino = new Date().getMonth().toString();
            }

            btnRegistrarPago.disabled = true;
            btnRegistrarPago.innerHTML = "⏳ Guardando...";
            try {
                await addDoc(collection(db, "pagos"), {
                    nombreUsuario: nombreUsuario,
                    monto: monto,
                    fecha: fechaDB,
                    mesAplicado: mesDestino, 
                    timestamp: Date.now()
                });
            } catch (e) { alert("Error: " + e.message); }
            finally { btnRegistrarPago.disabled = false; btnRegistrarPago.innerHTML = '<i class="bi bi-cash-coin me-1"></i> Registrar Pago'; }
        });
    }

    // =========================================================
    // EXPORTACIONES (WHATSAPP Y PDF)
    // =========================================================
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

            const consumosDelMes = historialConsumos.filter(r =>
                mesSeleccionado === "todos" ||
                new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado
            );

            if (consumosDelMes.length === 0) { alert("No hay datos para exportar."); return; }

            const sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            const ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i>...';
            btnExportarPDF.disabled = true;

            let grupoActualPDF = "";
            let filasHtml = "";

            consumosDelMes.forEach((r, index) => {
                const fechaObj = new Date(r.fecha + 'T00:00:00');
                const [y, m, d] = r.fecha.split('-');
                
                const nombreMesR = fechaObj.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
                
                // Aplicamos la misma lógica real de semanas al PDF
                let numSem = obtenerSemanaDelMes(fechaObj);
                const idGrupo = `${nombreMesR}_${numSem}`;

                if (idGrupo !== grupoActualPDF) {
                    grupoActualPDF = idGrupo;
                    const textoCab = mesSeleccionado === "todos" ? `${nombreMesR} - SEMANA 0${numSem}` : `SEMANA 0${numSem}`;
                    filasHtml += `
                        <tr style="background-color: #f0f7ff; page-break-after: avoid;">
                            <td colspan="4" style="padding: 10px 15px; border-bottom: 1px solid #dee2e6; color: #0d6efd; font-weight: bold; font-size: 13px;">
                                <span style="margin-right: 10px;">📅</span> ${textoCab}
                            </td>
                        </tr>
                    `;
                }

                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                const nombreDia = diasCortos[fechaObj.getDay()];
                const bgFila = index % 2 === 0 ? "#ffffff" : "#fcfcfc";

                filasHtml += `
                    <tr style="background-color: ${bgFila}; page-break-inside: avoid;">
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #000000; font-weight: bold; text-align: left; width: 10%;">${nombreDia}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #495057; text-align: left; width: 15%;">${d}/${m}/${y}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; text-align: left; width: 55%; font-size: 14px;">${r.productoNombre}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; width: 20%;">
                            <div style="display: flex; justify-content: space-between; width: 85px; margin-left: auto; font-weight: bold; font-size: 15px;">
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
                        <h3 style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase;">Registro de consumo - ${nombreMesHeader}</h3>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
                        <tr style="text-align: center;">
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>CLIENTE:</strong><br>${nombreUsuario}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>OCUPACIÓN:</strong><br>${ocupacionTexto}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>MES:</strong><br>${nombreMesHeader}</td>
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
                                    <div style="background: #742384; border-radius: 12px; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
                                        <div><div style="font-size: 20px; font-weight: 900;">YAPE</div><p style="margin: 0; font-size: 14px;">ROSA RO***</p></div>
                                        <div style="background: white; padding: 5px; border-radius: 5px;"><img src="yape.png" style="width: 80px; height: 80px;"></div>
                                    </div>
                                </td>
                                <td style="width: 52%; padding-left: 15px;">
                                    <div style="background-color: #e9ecef; border-radius: 12px; border: 1px solid #dee2e6; padding: 20px; text-align: center;">
                                        <p style="margin: 0; color: #495057; font-weight: bold;">TOTAL DEL MES</p>
                                        <h2 style="margin: 0; font-size: 35px; color: #0d6efd;">S/ ${sumaTotal.toFixed(2)}</h2>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            `;

            const opcionesPDF = {
                margin: [5, 0, 10, 0],
                filename: `Consumo_${nombreUsuario.replace(/ /g, "_")}_${nombreMesHeader}.pdf`,
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
});