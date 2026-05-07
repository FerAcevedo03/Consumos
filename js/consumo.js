// 1. IMPORTACIONES DE FIREBASE (Desde la nube de Google)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBuXHMvdHZbJLoo-SakENFEcUvlECJvTRA",
  authDomain: "quiosco-nobel-school.firebaseapp.com",
  projectId: "quiosco-nobel-school",
  storageBucket: "quiosco-nobel-school.firebasestorage.app",
  messagingSenderId: "448413136914",
  appId: "1:448413136914:web:426e8fc48a8e24ea96c0cb"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
    // Obtener datos de la URL
    const params = new URLSearchParams(window.location.search);
    const nombreUsuario = params.get("nombre") || "Usuario Desconocido";
    const rolUsuario = params.get("rol") || "index";

    // Elementos visuales
    const nombrePersonaEl = document.getElementById("nombrePersona");
    const etiquetaRolEl = document.getElementById("etiquetaRol");
    const avatarFondoEl = document.getElementById("avatarFondo");

    let iconoHtml = "";
    let colorFondo = "";
    let colorTexto = "text-white";

    if (rolUsuario === "profesores") {
        iconoHtml = '<i class="bi bi-person-workspace"></i>';
        colorFondo = "#0d6efd";
        if (etiquetaRolEl) etiquetaRolEl.textContent = "Profesor";
    } else if (rolUsuario === "alumnos") {
        iconoHtml = '<i class="bi bi-mortarboard-fill"></i>';
        colorFondo = "#ffc107";
        colorTexto = "text-dark";
        if (etiquetaRolEl) etiquetaRolEl.textContent = "Alumno";
    } else if (rolUsuario === "administrativos") {
        iconoHtml = '<i class="bi bi-person-badge-fill"></i>';
        colorFondo = "#198754";
        if (etiquetaRolEl) etiquetaRolEl.textContent = "Administrativo";
    } else {
        iconoHtml = '<i class="bi bi-person-fill"></i>';
        colorFondo = "#6c757d";
        if (etiquetaRolEl) etiquetaRolEl.textContent = "Personal";
    }

    if (nombrePersonaEl) nombrePersonaEl.textContent = nombreUsuario;
    if (avatarFondoEl) {
        avatarFondoEl.style.backgroundColor = colorFondo;
        avatarFondoEl.innerHTML = `<span class="fs-5 ${colorTexto}" style="line-height: 1;">${iconoHtml}</span>`;
    }

    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            window.location.href = `${rolUsuario}.html`;
        });
    }

    // Elementos del DOM
    const inputProducto = document.getElementById("inputProducto");
    const inputCantidad = document.getElementById("inputCantidad");
    const listaSugerencias = document.getElementById("listaSugerencias");
    const fechaConsumo = document.getElementById("fechaConsumo");
    const formConsumo = document.getElementById("formConsumo");
    const tablaConsumos = document.getElementById("tablaConsumos");
    const totalAcumulado = document.getElementById("totalAcumulado");
    const mesFiltro = document.getElementById("mesFiltro");
    const btnExportarPDF = document.getElementById("btnExportarPDF");
    const btnWhatsApp = document.getElementById("btnWhatsApp");

    if (!formConsumo) return;

    const fechaHoy = new Date();
    fechaConsumo.valueAsDate = fechaHoy;
    mesFiltro.value = fechaHoy.getMonth().toString();

    // PRODUCTOS (Por ahora se leen de forma local)
    const productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];
    let indiceSeleccionado = -1;

    if (inputProducto && listaSugerencias) {
        inputProducto.addEventListener("input", () => {
            const valorInput = inputProducto.value.toLowerCase();
            const partes = valorInput.split("+");
            const ultimaPalabra = partes[partes.length - 1].trim();

            listaSugerencias.innerHTML = "";
            indiceSeleccionado = -1;

            if (ultimaPalabra.length > 0) {
                const filtrados = productosDB.filter(p => p.nombre.toLowerCase().includes(ultimaPalabra));

                if (filtrados.length > 0) {
                    listaSugerencias.classList.add("show");
                    filtrados.forEach((prod) => {
                        const li = document.createElement("li");
                        const a = document.createElement("a");
                        a.className = "dropdown-item d-flex justify-content-between";
                        a.href = "#";
                        a.setAttribute("data-nombre", prod.nombre);
                        a.innerHTML = `<span>${prod.nombre}</span> <span class="text-muted small">S/ ${prod.precio.toFixed(2)}</span>`;
                        
                        a.addEventListener("mousedown", (e) => {
                            e.preventDefault();
                            seleccionarProducto(prod.nombre);
                        });
                        
                        li.appendChild(a);
                        listaSugerencias.appendChild(li);
                    });
                } else {
                    listaSugerencias.classList.remove("show");
                }
            } else {
                listaSugerencias.classList.remove("show");
            }
        });

        inputProducto.addEventListener("keydown", (e) => {
            const items = listaSugerencias.querySelectorAll("a.dropdown-item");
            if (!listaSugerencias.classList.contains("show") || items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                indiceSeleccionado++;
                if (indiceSeleccionado >= items.length) indiceSeleccionado = 0;
                actualizarSeleccion(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                indiceSeleccionado--;
                if (indiceSeleccionado < 0) indiceSeleccionado = items.length - 1;
                actualizarSeleccion(items);
            } else if (e.key === "Enter") {
                e.preventDefault(); 
                if (indiceSeleccionado > -1) {
                    seleccionarProducto(items[indiceSeleccionado].getAttribute("data-nombre"));
                } else if (items.length > 0) {
                    seleccionarProducto(items[0].getAttribute("data-nombre"));
                }
            }
        });

        function actualizarSeleccion(items) {
            items.forEach((item, index) => {
                if (index === indiceSeleccionado) {
                    item.classList.add("active");
                    item.style.backgroundColor = "#0d6efd";
                    item.style.color = "white";
                    item.scrollIntoView({ block: "nearest" }); 
                } else {
                    item.classList.remove("active");
                    item.style.backgroundColor = "";
                    item.style.color = "";
                }
            });
        }

        function seleccionarProducto(nombre) {
            const partes = inputProducto.value.split("+");
            partes[partes.length - 1] = ` ${nombre} `;
            inputProducto.value = partes.join("+").trim() + " + ";
            listaSugerencias.classList.remove("show");
            inputProducto.focus();
        }

        document.addEventListener("click", (e) => {
            if (!inputProducto.contains(e.target) && !listaSugerencias.contains(e.target)) {
                listaSugerencias.classList.remove("show");
            }
        });
    }

    function agruparConsumosTexto(textoHistorial) {
        let partes = textoHistorial.split(/(?:<br>|\+)/).map(p => p.trim()).filter(p => p !== "");
        let mapaProductos = new Map();
        
        partes.forEach(p => {
            let nombre = p;
            let cantidad = 1;
            let match = p.match(/^(.*?)\s*\(\s*(\d+)\s*\)$/);
            
            if (match && !p.includes("S/")) {
                nombre = match[1].trim();
                cantidad = parseInt(match[2], 10);
            }
            
            if (mapaProductos.has(nombre)) {
                mapaProductos.set(nombre, mapaProductos.get(nombre) + cantidad);
            } else {
                mapaProductos.set(nombre, cantidad);
            }
        });
        
        let resultado = [];
        mapaProductos.forEach((cantidad, nombre) => {
            if (cantidad > 1) {
                resultado.push(`${nombre} (${cantidad})`);
            } else {
                resultado.push(nombre);
            }
        });
        return resultado.join(" + ");
    }

    // --- MAGIA DE FIREBASE: LECTURA EN TIEMPO REAL ---
    let historialConsumos = [];
    const consultaConsumos = query(collection(db, "consumos"), where("nombreUsuario", "==", nombreUsuario));

    onSnapshot(consultaConsumos, (snapshot) => {
        historialConsumos = [];
        snapshot.forEach((doc) => {
            // Guardamos el ID único de Firebase para poder borrar o actualizar
            historialConsumos.push({ id: doc.id, ...doc.data() });
        });
        historialConsumos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        renderizarConsumos();
    });

    function renderizarConsumos() {
        tablaConsumos.innerHTML = "";
        let sumaTotal = 0;
        const mesSeleccionado = mesFiltro.value;

        const consumosFiltrados = historialConsumos.filter(registro => {
            if (mesSeleccionado === "todos") return true;
            const [y, m, d] = registro.fecha.split('-');
            const dateObj = new Date(y, m - 1, d);
            return dateObj.getMonth() == mesSeleccionado;
        });

        if (consumosFiltrados.length === 0) {
            tablaConsumos.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No hay consumos en este mes.</td></tr>`;
            totalAcumulado.textContent = "S/ 0.00";
            return;
        }

        consumosFiltrados.forEach((registro) => {
            sumaTotal += registro.precio;
            const [y, m, d] = registro.fecha.split('-');
            const dateObj = new Date(y, m - 1, d);

            const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
            let fechaBonita = dateObj.toLocaleDateString('es-PE', opcionesFecha);
            fechaBonita = fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="ps-4 text-muted">${fechaBonita}</td>
                <td class="text-dark fw-bold">${registro.productoNombre}</td>
                <td class="text-center text-dark fw-bold">S/ ${registro.precio.toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-outline-danger btn-eliminar-img rounded-1" onclick="eliminarRegistro('${registro.id}')" title="Eliminar">
                        <i class="bi bi-x"></i>
                    </button>
                </td>
            `;
            tablaConsumos.appendChild(tr);
        });

        totalAcumulado.textContent = `S/ ${sumaTotal.toFixed(2)}`;
    }

    mesFiltro.addEventListener("change", renderizarConsumos);

    // ELIMINAR DE FIREBASE
    window.eliminarRegistro = async (idFirebase) => {
        if (confirm("¿Borrar todos los consumos de este día?")) {
            try {
                await deleteDoc(doc(db, "consumos", idFirebase));
            } catch (error) {
                alert("Error al eliminar: " + error.message);
            }
        }
    };

    // --- GUARDAR EN FIREBASE ---
    formConsumo.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btnSubmit = formConsumo.querySelector("button[type='submit']");
        
        const fecha = fechaConsumo.value;
        if (!fecha) return;
        const [y, m, d] = fecha.split('-');
        const dateObj = new Date(y, m - 1, d);

        if (dateObj.getDay() === 0) {
            alert("No se permiten registros los domingos.");
            return;
        }

        let inputCrudo = inputProducto.value.trim();
        if (inputCrudo.endsWith("+")) inputCrudo = inputCrudo.slice(0, -1).trim();

        const cantidad = parseInt(inputCantidad.value);
        if (inputCrudo === "" || cantidad <= 0) return;

        const nombresSeparados = inputCrudo.split("+").map(n => n.trim()).filter(n => n !== "");
        let precioTotalBase = 0;
        let nombresValidados = [];

        for (let nombre of nombresSeparados) {
            const productoEncontrado = productosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

            if (!productoEncontrado) {
                alert(`El producto "${nombre}" no existe en tu inventario.`);
                return;
            }

            let precioDelProducto = productoEncontrado.precio;
            let nombreParaHistorial = productoEncontrado.nombre;

            let esMenuPrincipal = false;
            let catLimpia = productoEncontrado.categoria ? productoEncontrado.categoria.toLowerCase() : "";
            let nomLimpio = productoEncontrado.nombre.toLowerCase();

            if (catLimpia === "menu" || catLimpia === "menú" || catLimpia === "comida") {
                esMenuPrincipal = true;
            } else if (nomLimpio.includes("comida") || nomLimpio.includes("menu") || nomLimpio.includes("menú") || nomLimpio.includes("almuerzo")) {
                esMenuPrincipal = true;
            }

            if (esMenuPrincipal) {
                let precioIngresado = prompt(`Precio del plato "${productoEncontrado.nombre}":\n\n(Ej: 5, 7, 8, 10)`, productoEncontrado.precio);
                if (precioIngresado !== null) precioIngresado = precioIngresado.replace(',', '.');
                
                if (precioIngresado === null || precioIngresado.trim() === "" || isNaN(parseFloat(precioIngresado)) || parseFloat(precioIngresado) < 0) {
                    alert("Cancelado.");
                    return; 
                }
                
                precioDelProducto = parseFloat(precioIngresado);
                nombreParaHistorial = `${productoEncontrado.nombre} (S/ ${precioDelProducto.toFixed(2)})`;
            }

            precioTotalBase += precioDelProducto;
            nombresValidados.push(nombreParaHistorial);
        }

        const precioTotal = precioTotalBase * cantidad;

        let itemsDeEstePedido = [];
        for (let nombre of nombresValidados) {
            for (let i = 0; i < cantidad; i++) itemsDeEstePedido.push(nombre);
        }
        let textoNuevoPedido = itemsDeEstePedido.join(" + ");

        // UI Feedback: Cambiar botón mientras guarda en la nube
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="bi bi-cloud-arrow-up"></i> Guardando...';

        try {
            const indexExistente = historialConsumos.findIndex(registro => registro.fecha === fecha);

            if (indexExistente !== -1) {
                // ACTUALIZAR DOC EXISTENTE
                let registroExistente = historialConsumos[indexExistente];
                let textoCombinado = registroExistente.productoNombre + " + " + textoNuevoPedido;
                
                await updateDoc(doc(db, "consumos", registroExistente.id), {
                    productoNombre: agruparConsumosTexto(textoCombinado),
                    precio: registroExistente.precio + precioTotal
                });
            } else {
                // CREAR DOC NUEVO
                await addDoc(collection(db, "consumos"), {
                    nombreUsuario: nombreUsuario,
                    fecha: fecha,
                    productoNombre: agruparConsumosTexto(textoNuevoPedido),
                    precio: precioTotal
                });
            }

            if (mesFiltro.value !== "todos" && mesFiltro.value != dateObj.getMonth()) {
                mesFiltro.value = dateObj.getMonth().toString();
            }
            inputProducto.value = "";
            inputCantidad.value = "1";
            inputProducto.focus();

        } catch (error) {
            alert("Error al conectar con la Nube: " + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="bi bi-plus-lg"></i> Agregar al carrito del día';
        }
    });

    // 6. EXPORTAR A WHATSAPP
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener("click", () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;

            const consumosDelMes = historialConsumos.filter(registro => {
                if (mesSeleccionado === "todos") return true;
                const [y, m, d] = registro.fecha.split('-');
                return new Date(y, m - 1, d).getMonth() == mesSeleccionado;
            });

            if (consumosDelMes.length === 0) {
                alert("No hay consumos registrados para enviar.");
                return;
            }

            const sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            const horaActual = new Date().getHours();
            let saludoTiempo = "Hola";
            if (horaActual >= 6 && horaActual < 12) saludoTiempo = "Buenos dias";
            else if (horaActual >= 12 && horaActual < 19) saludoTiempo = "Buenas tardes";
            else saludoTiempo = "Buenas noches";

            const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
            let mensaje = `*REGISTRO DE CONSUMO EN EL QUIOSCO*\n\n`;

            if (rolUsuario === "alumnos") {
                mensaje += `${saludoTiempo}, esperamos que se encuentren muy bien.\n`;
                mensaje += `Le hacemos entrega del detalle de los consumos recientes de su niño(a) *${nombreUsuario}* correspondientes al mes de ${nombreMes}:\n\n`;
            } else {
                mensaje += `¡${saludoTiempo} *${nombreUsuario}*!\n`;
                mensaje += `Le compartimos el resumen de sus consumos realizados en el quiosco durante el mes de ${nombreMes}:\n\n`;
            }

            consumosDelMes.forEach(registro => {
                const [y, m, d] = registro.fecha.split('-');
                const dateObj = new Date(y, m - 1, d);
                const nombreDiaCorto = diasCortos[dateObj.getDay()];

                let fechaCorta = `${nombreDiaCorto} ${d}/${m}`;
                let detalleParaWA = registro.productoNombre.split(/<br>\s*\+?|<br>|\n/).map(item => item.trim().replace(/^\+\s*/, '')).filter(item => item !== '').join(" + ");
                mensaje += `- *${fechaCorta}*: ${detalleParaWA} (S/ ${registro.precio.toFixed(2)})\n`;
            });

            mensaje += `\n*TOTAL A PAGAR: S/ ${sumaTotal.toFixed(2)}*\n\n`;
            mensaje += `*Datos para realizar el pago (Yape):*\n`;
            mensaje += `- Titular: Rosa Ro***\n\n`;
            mensaje += `Le agradecemos el envio de la captura del pago por este medio. ¡Muchas gracias y que tenga un buen dia!`;

            const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
            window.open(urlWhatsApp, '_blank');
        });
    }

    // 7. EXPORTAR A PDF
    if (btnExportarPDF) {
        btnExportarPDF.addEventListener("click", () => {
            const mesSeleccionado = mesFiltro.value;
            const nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;
            
            const consumosDelMes = historialConsumos.filter(registro => {
                if (mesSeleccionado === "todos") return true;
                const [y, m, d] = registro.fecha.split('-');
                return new Date(y, m - 1, d).getMonth() == mesSeleccionado;
            });

            if (consumosDelMes.length === 0) {
                alert("No hay consumos en este mes para exportar.");
                return;
            }

            const sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            const ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';

            const reciboPDF = document.createElement("div");
            reciboPDF.style.padding = "40px";
            reciboPDF.style.fontFamily = "Arial, sans-serif";
            reciboPDF.style.color = "#212529";

            let htmlContenido = `
                <div style="text-align: center; padding-bottom: 15px; margin-bottom: 25px; border-bottom: 2px solid #eef0f2;">
                    <h1 style="color: #0d6efd; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Cuenta del Quiosco</h1>
                    <h3 style="color: #8fa0ab; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Registro de consumo mensual</h3>
                </div>
                
                <div style="background-color: #f8f9fa; border-radius: 12px; padding: 15px 20px; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse; border: none;">
                        <tr>
                            <td style="width: 50%; border-right: 1px solid #dee2e6; vertical-align: top;">
                                <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Cliente</p>
                                <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #212529;">${nombreUsuario}</p>
                                <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Ocupación</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #495057;">${ocupacionTexto}</p>
                            </td>
                            <td style="width: 50%; padding-left: 20px; vertical-align: top;">
                                <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Mes</p>
                                <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #212529;">${nombreMes}</p>
                                <p style="margin: 0 0 4px 0; font-size: 11px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Fecha de Emisión</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #495057;">${new Date().toLocaleDateString('es-PE')}</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                    <thead>
                        <tr>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #212529; color: #495057; width: 15%;">Día</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #212529; color: #495057; width: 20%;">Fecha</th>
                            <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #212529; color: #495057; width: 45%;">Detalle de Consumo</th>
                            <th style="padding: 10px 8px; text-align: right; border-bottom: 2px solid #212529; color: #495057; width: 20%;">Importe</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            let bgFila = "#ffffff";
            consumosDelMes.forEach((registro, index) => {
                const [y, m, d] = registro.fecha.split('-');
                const dateObj = new Date(y, m - 1, d);
                const diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                const nombreDiaCorto = diasCortos[dateObj.getDay()];
                const fechaNumerica = `${d}/${m}/${y}`;
                
                let detalleParaPDF = registro.productoNombre.split(/<br>\s*\+?|<br>|\n/).map(item => item.trim().replace(/^\+\s*/, '')).filter(item => item !== '').join(" + ");

                bgFila = index % 2 === 0 ? "#ffffff" : "#f8f9fa";
                htmlContenido += `
                    <tr style="background-color: ${bgFila};">
                        <td style="padding: 10px 8px; border-bottom: 1px solid #eef0f2; color: #6c757d; font-weight: bold;">${nombreDiaCorto}</td>
                        <td style="padding: 10px 8px; border-bottom: 1px solid #eef0f2; color: #495057;">${fechaNumerica}</td>
                        <td style="padding: 10px 8px; border-bottom: 1px solid #eef0f2; color: #212529;">${detalleParaPDF}</td>
                        <td style="padding: 10px 8px; border-bottom: 1px solid #eef0f2; text-align: right; font-weight: bold; color: #212529;">S/ ${registro.precio.toFixed(2)}</td>
                    </tr>
                `;
            });

            htmlContenido += `
                    </tbody>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="width: 60%;"></td>
                        <td style="width: 40%; background-color: #f8f9fa; border-radius: 8px; padding: 15px;">
                            <table style="width: 100%; border: none;">
                                <tr>
                                    <td style="text-align: left; font-size: 14px; color: #6c757d; font-weight: bold;">TOTAL A PAGAR</td>
                                    <td style="text-align: right; font-size: 20px; font-weight: 900; color: #0d6efd;">S/ ${sumaTotal.toFixed(2)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; max-width: 350px; margin: 20px auto; background: #742384; border-radius: 12px; color: white; border-collapse: collapse; box-shadow: 0 4px 8px rgba(116, 35, 132, 0.2);">
                    <tr>
                        <td style="padding: 15px 20px; vertical-align: middle; width: 60%;">
                            <div style="font-size: 24px; font-weight: 900; margin-bottom: 5px; letter-spacing: 1px;">YAPE</div>
                            <p style="margin: 0 0 5px 0; font-size: 13px; opacity: 0.9;">Escanea para pagar:</p>
                            <p style="margin: 0; font-size: 14px; font-weight: bold;">TITULAR: ROSA RO***</p>
                        </td>
                        <td style="padding: 15px; vertical-align: middle; text-align: right; width: 40%;">
                            <div style="background-color: white; padding: 5px; border-radius: 8px; display: inline-block; width: 90px; height: 90px; box-sizing: border-box;">
                                <img src="yape.png" alt="QR Yape" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\'color:#742384; font-size:11px; margin-top:25px; font-weight:bold; text-align:center;\\'>Falta QR<br>yape.png</div>';">
                            </div>
                        </td>
                    </tr>
                </table>
                
                <div style="text-align: center; color: #adb5bd; font-size: 11px; margin-top: 25px;">
                    <p>Se agradece el pronto pago de su cuenta. ¡Que tenga un excelente día!</p>
                </div>
            `;

            reciboPDF.innerHTML = htmlContenido;
            const opcionesPDF = { margin: [0.5, 0.5, 0.5, 0.5], filename: `Consumo_${nombreUsuario.replace(/ /g, "_")}_${nombreMes}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
            btnExportarPDF.disabled = true;

            html2pdf().set(opcionesPDF).from(reciboPDF).save().then(() => {
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
            }).catch(error => {
                alert("Hubo un pequeño problema al generar el PDF. Verifica tu conexión a internet.");
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
            });
        });
    }
});