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

        if (mesSeleccionado === "todos") {
            tituloEstadoMes.innerHTML = "ESTADO DE CUENTA (TODOS LOS MESES)";
            estadoCuentaGlobalVisual.style.display = "none";
        } else {
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            tituloEstadoMes.innerHTML = `ESTADO DE CUENTA: ${nombreMes}`;
            estadoCuentaGlobalVisual.style.display = "block";
        }

        const totalConsumidoHistorico = historialConsumos.reduce((acc, r) => acc + r.precio, 0);
        const totalPagadoHistorico = historialPagos.reduce((acc, p) => acc + p.monto, 0);
        const saldoGlobal = totalPagadoHistorico - totalConsumidoHistorico;

        let totalConsumidoMes = 0;
        let totalPagadoMes = 0;

        if (mesSeleccionado === "todos") {
            totalConsumidoMes = totalConsumidoHistorico;
            totalPagadoMes = totalPagadoHistorico;
        } else {
            const consumosDelMes = historialConsumos.filter(r => new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            const pagosDelMes = historialPagos.filter(p => new Date(p.fecha + 'T00:00:00').getMonth() == mesSeleccionado);
            totalConsumidoMes = consumosDelMes.reduce((acc, r) => acc + r.precio, 0);
            totalPagadoMes = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
        }

        const saldoMes = totalPagadoMes - totalConsumidoMes;

        if (saldoMes < -0.01) {
            estadoCuentaMesVisual.innerHTML = `<span class="text-danger"><i class="bi bi-exclamation-circle-fill"></i> DEUDA DEL MES: S/ ${Math.abs(saldoMes).toFixed(2)}</span>`;
        } else if (saldoMes > 0.01) {
            estadoCuentaMesVisual.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> A FAVOR DEL MES: S/ ${saldoMes.toFixed(2)}</span>`;
        } else {
            estadoCuentaMesVisual.innerHTML = `<span class="text-muted"><i class="bi bi-shield-check"></i> MES CANCELADO AL DÍA</span>`;
        }

        if (mesSeleccionado !== "todos") {
            if (saldoGlobal < -0.01) {
                estadoCuentaGlobalVisual.innerHTML = `<strong class="text-danger">Deuda total (Suma de los pagos pendientes de todos los meses): S/ ${Math.abs(saldoGlobal).toFixed(2)}</strong>`;
            } else if (saldoGlobal > 0.01) {
                estadoCuentaGlobalVisual.innerHTML = `<strong class="text-success">Total general a favor (Sumando todos los meses): S/ ${saldoGlobal.toFixed(2)}</strong>`;
            } else {
                estadoCuentaGlobalVisual.innerHTML = `<strong class="text-secondary">Total general histórico: No hay deudas pendientes</strong>`;
            }
        }
    }

    function renderizarListaPagos() {
        if (!contenedorHistorialPagos || !listaPagosVisual) return;
        listaPagosVisual.innerHTML = "";
        if (historialPagos.length === 0) {
            contenedorHistorialPagos.classList.add("d-none");
            return;
        }
        contenedorHistorialPagos.classList.remove("d-none");
        historialPagos.forEach((pago) => {
            const [y, m, d] = pago.fecha.split('-');
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent px-0 py-1";
            li.innerHTML = `
                <span class="text-dark" style="font-size: 0.9rem;"><i class="bi bi-arrow-down-right-circle text-success me-1"></i> Abono registrado el ${d}/${m}/${y}</span>
                <div>
                    <span class="fw-bold text-success me-3">S/ ${pago.monto.toFixed(2)}</span>
                    <button class="btn btn-sm btn-outline-danger border-0 py-0 px-1" onclick="eliminarPago('${pago.id}')" title="Anular este pago"><i class="bi bi-x fs-5"></i></button>
                </div>
            `;
            listaPagosVisual.appendChild(li);
        });
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

        filtrados.forEach(r => {
            total += r.precio;
            const f = new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
            const tr = document.createElement("tr");
            tr.innerHTML = `<td class="ps-4 text-muted small">${f.charAt(0).toUpperCase() + f.slice(1)}</td><td class="fw-bold text-dark">${r.productoNombre}</td><td class="text-center fw-bold text-dark">S/ ${r.precio.toFixed(2)}</td><td class="text-center"><button class="btn btn-sm btn-outline-danger rounded-1" onclick="eliminarRegistro('${r.id}')"><i class="bi bi-x"></i></button></td>`;
            tablaConsumos.appendChild(tr);
        });
        totalAcumulado.textContent = `S/ ${total.toFixed(2)}`;
    }

    if (mesFiltro) {
        mesFiltro.addEventListener("change", () => {
            renderizarConsumos();
            recalcularSaldoGlobal();
        });
    }

    window.eliminarRegistro = async (id) => { if (confirm("¿Borrar este consumo?")) await deleteDoc(doc(db, "consumos", id)); };
    window.eliminarPago = async (id) => { if (confirm("¿Estás seguro de anular este abono? El saldo de deuda/favor se recalculará automáticamente.")) await deleteDoc(doc(db, "pagos", id)); };

    // Guardar consumo
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
            let precioTotalBase = 0;
            let nombresValidados = [];

            for (let nombre of nombresSeparados) {
                const productoEncontrado = productosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

                if (!productoEncontrado) {
                    alert(`El producto "${nombre}" NO EXISTE en tu inventario.\nPor favor, selecciónalo de la lista desplegable.`);
                    return;
                }

                let precioDelProducto = productoEncontrado.precio;
                let nombreParaHistorial = productoEncontrado.nombre;

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

                precioTotalBase += precioDelProducto;
                nombresValidados.push(nombreParaHistorial);
            }

            const precioTotalFinal = precioTotalBase * cant;
            let itemsDeEstePedido = [];
            for (let nombre of nombresValidados) {
                for (let i = 0; i < cant; i++) itemsDeEstePedido.push(nombre);
            }
            let textoNuevoPedido = itemsDeEstePedido.join(" + ");

            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-cloud-arrow-up"></i> Guardando...';

            try {
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
                        productoNombre: agruparTextos(textoNuevoPedido),
                        precio: precioTotalFinal
                    });
                }
                inputProducto.value = ""; inputCantidad.value = "1"; inputProducto.focus();
            } catch (e) { alert("Error: " + e.message); }
            finally { btn.disabled = false; btn.innerHTML = '<i class="bi bi-plus-lg"></i> Agregar al carrito del día'; }
        };
    }

    // Registrar pago
    if (btnRegistrarPago) {
        btnRegistrarPago.addEventListener("click", async () => {
            let monto = prompt(`¿Cuánto dinero está entregando ${nombreUsuario} hoy?\n\n(Ejemplo: 20, 50.50)`);
            if (!monto) return;
            monto = parseFloat(monto.replace(',', '.'));

            if (isNaN(monto) || monto <= 0) { alert("Monto inválido."); return; }

            btnRegistrarPago.disabled = true;
            btnRegistrarPago.innerHTML = "⏳ Guardando...";
            try {
                const f = new Date();
                const fechaStr = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
                await addDoc(collection(db, "pagos"), {
                    nombreUsuario: nombreUsuario, monto: monto, fecha: fechaStr, timestamp: Date.now()
                });
            } catch (e) { alert("Error: " + e.message); }
            finally { btnRegistrarPago.disabled = false; btnRegistrarPago.innerHTML = '<i class="bi bi-cash-coin me-1"></i> Registrar Pago'; }
        });
    }

    // Exportaciones (WhatsApp y PDF)
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

// =========================================================
    // EXPORTACIÓN A PDF: HORIZONTAL, DÍAS INCLUIDOS Y ALINEADO
    // =========================================================
    const btnExportarPDF = document.getElementById("btnExportarPDF");

    if (btnExportarPDF) {
        btnExportarPDF.addEventListener("click", () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;

            const consumosDelMes = historialConsumos.filter(r =>
                mesSeleccionado === "todos" ||
                new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado
            );

            if (consumosDelMes.length === 0) {
                alert("No hay consumos en este mes para exportar.");
                return;
            }

            const sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            const ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
            btnExportarPDF.disabled = true;

            // 1. GENERAMOS LAS FILAS CON 4 COLUMNAS (Incluyendo el Día y el Importe alineado)
            const filasHtml = consumosDelMes.map((r, index) => {
                const [y, m, d] = r.fecha.split('-');
                
                // Cálculo del día
                const fBonita = new Date(r.fecha + 'T00:00:00');
                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                const nombreDia = diasCortos[fBonita.getDay()];

                const bgFila = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
                let detalleLimpio = r.productoNombre
                    .split(/<br>\s*\+?|<br>|\n/)
                    .map(item => item.trim().replace(/^\+\s*/, ''))
                    .filter(item => item !== '')
                    .join(" + ");

                // Alineamos explícitamente a la izquierda (text-align: left) el detalle y usamos flex para el importe
                return `
                    <tr style="background-color: ${bgFila}; page-break-inside: avoid;">
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #000000; font-weight: bold; text-align: left;">${nombreDia}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #495057; text-align: left;">${d}/${m}/${y}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529; text-align: left;">${detalleLimpio}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212529;">
                            <div style="display: flex; justify-content: space-between; width: 75px; margin-left: auto; font-weight: bold;">
                                <span>S/</span>
                                <span>${r.precio.toFixed(2)}</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // 2. CREAMOS EL HTML EN MEMORIA CON LAS 4 COLUMNAS EN EL ENCABEZADO
            const reciboPDF = document.createElement("div");
            
            reciboPDF.innerHTML = `
                <div style="width: 1120px; padding: 20px 40px; box-sizing: border-box; font-family: Arial, sans-serif; background-color: white;">
                    
                    <div style="text-align: center; border-bottom: 3px solid #0d6efd; padding-bottom: 10px; margin-bottom: 15px;">
                        <h1 style="color: #0d6efd; margin: 0; font-size: 28px; font-weight: 900;">Quiosco</h1>
                        <h3 style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase;">Registro de consumo semanal y/o mensual de ${nombreMes}</h3>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #dee2e6;">
                        <tr style="text-align: center;">
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;">
                                <strong style="font-size: 13px; color: #000000; text-transform: uppercase;">CLIENTE:</strong> 
                                <span style="font-size: 15px; color: #212529; font-weight: normal; margin-left: 8px;">${nombreUsuario}</span>
                            </td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;">
                                <strong style="font-size: 13px; color: #000000; text-transform: uppercase;">OCUPACIÓN:</strong> 
                                <span style="font-size: 15px; color: #212529; font-weight: normal; margin-left: 8px;">${ocupacionTexto}</span>
                            </td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;">
                                <strong style="font-size: 13px; color: #000000; text-transform: uppercase;">MES:</strong> 
                                <span style="font-size: 15px; color: #212529; font-weight: normal; margin-left: 8px;">${nombreMes}</span>
                            </td>
                            <td style="padding: 15px 10px; width: 25%;">
                                <strong style="font-size: 13px; color: #000000; text-transform: uppercase;">EMISIÓN:</strong> 
                                <span style="font-size: 15px; color: #212529; font-weight: normal; margin-left: 8px;">${new Date().toLocaleDateString('es-PE')}</span>
                            </td>
                        </tr>
                    </table>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <thead>
                            <tr style="background-color: #0d6efd; color: white;">
                                <th style="padding: 12px 15px; text-align: left; font-size: 14px; width: 10%;">Día</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 14px; width: 15%;">Fecha</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 14px; width: 55%;">Detalle de Consumo</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 14px; width: 20%;">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasHtml}
                        </tbody>
                    </table>

                    <div style="page-break-inside: avoid;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 48%; padding-right: 15px; vertical-align: top;">
                                    <table style="width: 100%; background: #742384; border-radius: 12px; color: white; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="padding: 20px; vertical-align: middle;">
                                                <div style="font-size: 24px; font-weight: 900; margin-bottom: 5px; letter-spacing: 1px;">YAPE</div>
                                                <p style="margin: 0 0 5px 0; font-size: 14px;">Escanea para pagar a:</p>
                                                <p style="margin: 0; font-size: 16px; font-weight: bold;">ROSA RO***</p>
                                            </td>
                                            <td style="padding: 20px; vertical-align: middle; text-align: right; width: 120px;">
                                                <div style="background-color: white; padding: 8px; border-radius: 8px; display: inline-block; width: 100px; height: 100px; box-sizing: border-box;">
                                                    <img src="yape.png" alt="QR Yape" style="width: 100%; height: 100%; object-fit: contain;">
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td style="width: 52%; padding-left: 15px; vertical-align: top;">
                                    <table style="width: 100%; background-color: #e9ecef; border-radius: 12px; border: 1px solid #dee2e6; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="padding: 20px; text-align: center; vertical-align: middle;">
                                                <p style="margin: 0 0 5px 0; font-size: 16px; color: #495057; font-weight: bold; text-transform: uppercase;">TOTAL A PAGAR DEL MES</p>
                                                <h2 style="margin: 0; font-size: 40px; font-weight: 900; color: #0d6efd;">S/ ${sumaTotal.toFixed(2)}</h2>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <div style="text-align: center; color: #adb5bd; font-size: 14px; margin-top: 25px;">
                            <p>¡Gracias por su preferencia! Se agradece el pronto pago.</p>
                        </div>
                    </div>
                </div>
            `;

            // 3. LA SOLUCIÓN AL CORTE: ANULAR LAS COORDENADAS FANTASMAS DE LA LIBRERÍA
            const opcionesPDF = { 
                margin: [5, 0, 10, 0], 
                filename: `Consumo_${nombreUsuario.replace(/ /g, "_")}_${nombreMes}.pdf`, 
                image: { type: 'jpeg', quality: 1.0 }, 
                html2canvas: { 
                    scale: 2, 
                    useCORS: true,
                    width: 1120,      
                    windowWidth: 1120,
                    x: 0,           
                    y: 0,           
                    scrollX: 0,     
                    scrollY: 0      
                }, 
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } 
            };

            html2pdf().set(opcionesPDF).from(reciboPDF).save().then(() => {
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
            }).catch(error => {
                console.error("ERROR PDF:", error);
                alert("Error al generar PDF.");
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
            });
        });
    }
});
