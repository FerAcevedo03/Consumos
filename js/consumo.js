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

    // Formularios 
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
    // autocompletado
   
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

    // lectura de consumos
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

    // cuentas
    function recalcularSaldoGlobal() {
        if (!estadoCuentaMesVisual) return;
        
        const mesSeleccionado = mesFiltro.value;

        // 1. Títulos dinámicos
        if (mesSeleccionado === "todos") {
            tituloEstadoMes.innerHTML = "ESTADO DE CUENTA (TODOS LOS MESES)";
            estadoCuentaGlobalVisual.style.display = "none"; 
        } else {
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            tituloEstadoMes.innerHTML = `ESTADO DE CUENTA: ${nombreMes}`;
            estadoCuentaGlobalVisual.style.display = "block";
        }

        // 2. Cálculo Global 
        const totalConsumidoHistorico = historialConsumos.reduce((acc, r) => acc + r.precio, 0);
        const totalPagadoHistorico = historialPagos.reduce((acc, p) => acc + p.monto, 0);
        const saldoGlobal = totalPagadoHistorico - totalConsumidoHistorico;

        // 3. Cálculo Específico del Mes
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

        // 
        if (saldoMes < -0.01) {
            estadoCuentaMesVisual.innerHTML = `<span class="text-danger"><i class="bi bi-exclamation-circle-fill"></i> DEUDA DEL MES: S/ ${Math.abs(saldoMes).toFixed(2)}</span>`;
        } else if (saldoMes > 0.01) {
            estadoCuentaMesVisual.innerHTML = `<span class="text-success"><i class="bi bi-check-circle-fill"></i> A FAVOR DEL MES: S/ ${saldoMes.toFixed(2)}</span>`;
        } else {
            estadoCuentaMesVisual.innerHTML = `<span class="text-muted"><i class="bi bi-shield-check"></i> PAGOS AL DÍA</span>`;
        }

        // Render Global (Letras pequeñas debajo, solo si no estás viendo "Todos")
        if (mesSeleccionado !== "todos") {
            if (saldoGlobal < -0.01) {
                estadoCuentaGlobalVisual.innerHTML = `<strong class="text-danger">Deuda total (Suma de los pagos pendientes de todos los meses): S/ ${Math.abs(saldoGlobal).toFixed(2)}</strong>`;
            } else if (saldoGlobal > 0.01) {
                estadoCuentaGlobalVisual.innerHTML = `<strong class="text-success">Total general a favor (Sumando todos los meses): S/ ${saldoGlobal.toFixed(2)}</strong>`;
            } else {
                estadoCuentaGlobalVisual.innerHTML = `<strong class="text-secondary">Total general mensual: No hay deudas pendientes</strong>`;
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

    // Sincronizar el select de meses con ambas listas
    if (mesFiltro) {
        mesFiltro.addEventListener("change", () => {
            renderizarConsumos();
            recalcularSaldoGlobal();
        });
    }

    window.eliminarRegistro = async (id) => { if (confirm("¿Borrar este consumo?")) await deleteDoc(doc(db, "consumos", id)); };
    window.eliminarPago = async (id) => { if (confirm("¿Estás seguro de anular este abono? El saldo de deuda/favor se recalculará automáticamente.")) await deleteDoc(doc(db, "pagos", id)); };

    // guardar el consumo
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

            // validar si el precio existe o no 
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

    // registrar el pago 
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

    // exportaciones
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
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;
            const consumosDelMes = historialConsumos.filter(r => mesSeleccionado === "todos" || new Date(r.fecha + 'T00:00:00').getMonth() == mesSeleccionado);

            if (consumosDelMes.length === 0) { alert("No hay consumos en este mes para exportar."); return; }

            const sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            const ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';

            const contenedorOculto = document.createElement("div");
            contenedorOculto.style.position = "absolute";
            contenedorOculto.style.left = "-9999px";
            contenedorOculto.style.top = "0";
            contenedorOculto.style.width = "700px"; 
            document.body.appendChild(contenedorOculto);

            const reciboPDF = document.createElement("div");
            reciboPDF.style.width = "700px"; 
            reciboPDF.style.boxSizing = "border-box"; 
            reciboPDF.style.padding = "30px 40px";
            reciboPDF.style.backgroundColor = "white";
            reciboPDF.style.fontFamily = "Arial, sans-serif";
            reciboPDF.style.color = "#212529";
            
            contenedorOculto.appendChild(reciboPDF);

            let htmlContenido = `
                <div style="text-align: center; padding-bottom: 15px; margin-bottom: 25px; border-bottom: 2px solid #eef0f2;">
                    <h1 style="color: #0d6efd; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">Cuenta del Quiosco</h1>
                    <h3 style="color: #8fa0ab; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Registro de consumo mensual</h3>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8f9fa; border-radius: 12px;">
                    <tr>
                        <td style="width: 50%; padding: 20px; border-right: 1px solid #dee2e6; vertical-align: top;">
                            <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold;">Cliente</p>
                            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #212529;">${nombreUsuario}</p>
                            <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold;">Ocupación</p>
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #495057;">${ocupacionTexto}</p>
                        </td>
                        <td style="width: 50%; padding: 20px; vertical-align: top; padding-left: 25px;">
                            <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold;">Mes</p>
                            <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #212529;">${nombreMes}</p>
                            <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold;">Fecha de Emisión</p>
                            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #495057;">${new Date().toLocaleDateString('es-PE')}</p>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                    <thead>
                        <tr>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #212529; color: #495057; width: 12%;">Día</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #212529; color: #495057; width: 18%;">Fecha</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #212529; color: #495057; width: 50%;">Detalle de Consumo</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #212529; color: #495057; width: 20%;">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            consumosDelMes.forEach((registro, index) => {
                const [y, m, d] = registro.fecha.split('-');
                const fBonita = new Date(registro.fecha + 'T00:00:00');
                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                let detalleLimpio = registro.productoNombre.split(/<br>\s*\+?|<br>|\n/).map(item => item.trim().replace(/^\+\s*/, '')).filter(item => item !== '').join(" + ");
                let bgFila = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
                
                htmlContenido += `
                    <tr style="background-color: ${bgFila}; page-break-inside: avoid;">
                        <td style="padding: 12px 8px; border-bottom: 1px solid #eef0f2; color: #6c757d; font-weight: bold;">${diasCortos[fBonita.getDay()]}</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #eef0f2; color: #495057;">${d}/${m}/${y}</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #eef0f2; color: #212529; word-break: break-word;">${detalleLimpio}</td>
                        <td style="padding: 12px 8px; border-bottom: 1px solid #eef0f2; text-align: right; font-weight: bold; color: #212529;">S/ ${registro.precio.toFixed(2)}</td>
                    </tr>
                `;
            });

            htmlContenido += `
                    </tbody>
                </table>
                <div style="page-break-inside: avoid;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <tr>
                            <td style="width: 50%;"></td>
                            <td style="width: 50%; background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                                <table style="width: 100%; border: none;">
                                    <tr>
                                        <td style="text-align: left; font-size: 15px; color: #6c757d; font-weight: bold;">TOTAL A PAGAR DEL MES</td>
                                        <td style="text-align: right; font-size: 22px; font-weight: 900; color: #0d6efd;">S/ ${sumaTotal.toFixed(2)}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    <table style="width: 100%; max-width: 450px; margin: 0 auto; background: #742384; border-radius: 12px; color: white; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 15px 20px; vertical-align: middle; width: 65%;">
                                <div style="font-size: 26px; font-weight: 900; margin-bottom: 5px; letter-spacing: 1px;">YAPE</div>
                                <p style="margin: 0 0 5px 0; font-size: 14px; opacity: 0.9;">Escanea para pagar:</p>
                                <p style="margin: 0; font-size: 16px; font-weight: bold;">TITULAR: ROSA RO***</p>
                            </td>
                            <td style="padding: 15px; vertical-align: middle; text-align: right; width: 35%;">
                                <div style="background-color: white; padding: 5px; border-radius: 8px; display: inline-block; width: 100px; height: 100px; box-sizing: border-box;">
                                    <img src="yape.png" alt="QR Yape" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none';">
                                </div>
                            </td>
                        </tr>
                    </table>
                    <div style="text-align: center; color: #adb5bd; font-size: 13px; margin-top: 25px;">
                        <p>Se agradece el pronto pago de su cuenta. ¡Que tenga un excelente día!</p>
                    </div>
                </div>
            `;

            reciboPDF.innerHTML = htmlContenido;
            
            const opcionesPDF = { 
                margin: 0.4, 
                filename: `Consumo_${nombreUsuario.replace(/ /g, "_")}_${nombreMes}.pdf`, 
                image: { type: 'jpeg', quality: 0.98 }, 
                html2canvas: { scale: 2, useCORS: true }, 
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
            btnExportarPDF.disabled = true;

            html2pdf().set(opcionesPDF).from(reciboPDF).save().then(() => {
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
                document.body.removeChild(contenedorOculto); 
            }).catch(error => {
                alert("Hubo un problema al generar el PDF.");
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
                if (document.body.contains(contenedorOculto)) document.body.removeChild(contenedorOculto);
            });
        });
    }
});
