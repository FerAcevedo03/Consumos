document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener datos de la URL
    const params = new URLSearchParams(window.location.search);
    const nombreUsuario = params.get("nombre") || "Usuario Desconocido";
    const rolUsuario = params.get("rol") || "index";

    // Elementos visuales
    const nombrePersonaEl = document.getElementById("nombrePersona");
    const etiquetaRolEl = document.getElementById("etiquetaRol");
    const avatarFondoEl = document.getElementById("avatarFondo");

    // Íconos de Bootstrap
    let iconoHtml = "";
    let colorFondo = "";
    let colorTexto = "text-white";

    if (rolUsuario === "profesores") {
        iconoHtml = '<i class="bi bi-person-workspace"></i>';
        colorFondo = "#0d6efd";
        colorTexto = "text-white";
        if (etiquetaRolEl) etiquetaRolEl.textContent = "Profesor";
    } else if (rolUsuario === "alumnos") {
        iconoHtml = '<i class="bi bi-mortarboard-fill"></i>';
        colorFondo = "#ffc107";
        colorTexto = "text-dark";
        if (etiquetaRolEl) etiquetaRolEl.textContent = "Alumno";
    } else if (rolUsuario === "administrativos") {
        iconoHtml = '<i class="bi bi-person-badge-fill"></i>';
        colorFondo = "#198754";
        colorTexto = "text-white";
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

    // 2. Elementos del DOM
    const inputProducto = document.getElementById("inputProducto");
    const inputCantidad = document.getElementById("inputCantidad");
    const sugerenciasProductos = document.getElementById("sugerenciasProductos");
    const fechaConsumo = document.getElementById("fechaConsumo");
    const formConsumo = document.getElementById("formConsumo");
    const tablaConsumos = document.getElementById("tablaConsumos");
    const totalAcumulado = document.getElementById("totalAcumulado");
    const mesFiltro = document.getElementById("mesFiltro");
    const btnExportarPDF = document.getElementById("btnExportarPDF");
    const btnWhatsApp = document.getElementById("btnWhatsApp");
    const listaSugerencias = document.getElementById("listaSugerencias");

    if (!formConsumo) return;

    const fechaHoy = new Date();
    fechaConsumo.valueAsDate = fechaHoy;
    mesFiltro.value = fechaHoy.getMonth().toString();

    // 3. LÓGICA DE BÚSQUEDA INTELIGENTE CON "+" AUTOMÁTICO Y TECLADO
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
                const filtrados = productosDB.filter(p => 
                    p.nombre.toLowerCase().includes(ultimaPalabra)
                );

                if (filtrados.length > 0) {
                    listaSugerencias.classList.add("show");
                    filtrados.forEach((prod, index) => {
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

        // MANEJO DEL TECLADO CORREGIDO
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

    // --- FUNCIÓN MATEMÁTICA PARA AGRUPAR EN PARÉNTESIS ---
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
    // -----------------------------------------------------

    // 4. Gestión de los consumos
    const storageKey = `consumos_${nombreUsuario}`;
    let historialConsumos = JSON.parse(localStorage.getItem(storageKey)) || [];

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
            tablaConsumos.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No hay consumos registrados en este mes.</td></tr>`;
            totalAcumulado.textContent = "S/ 0.00";
            return;
        }

        consumosFiltrados.forEach((registro) => {
            sumaTotal += registro.precio;
            const originalIndex = historialConsumos.indexOf(registro);
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
                    <button class="btn btn-outline-danger btn-eliminar-img rounded-1" onclick="eliminarRegistro(${originalIndex})" title="Eliminar todo el día">
                        <i class="bi bi-x"></i>
                    </button>
                </td>
            `;
            tablaConsumos.appendChild(tr);
        });

        totalAcumulado.textContent = `S/ ${sumaTotal.toFixed(2)}`;
    }

    mesFiltro.addEventListener("change", renderizarConsumos);

    window.eliminarRegistro = (index) => {
        if (confirm("¿Borrar todos los consumos de este día? Se descontará del total del mes.")) {
            historialConsumos.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(historialConsumos));
            renderizarConsumos();
        }
    };

    // 5. Agregar consumo
    formConsumo.addEventListener("submit", (e) => {
        e.preventDefault();

        const fecha = fechaConsumo.value;
        if (!fecha) return;
        const [y, m, d] = fecha.split('-');
        const dateObj = new Date(y, m - 1, d);

        if (dateObj.getDay() === 0) {
            alert("No se permiten registros los domingos. Solo trabajamos de Lunes a Sábado.");
            return;
        }

        let inputCrudo = inputProducto.value.trim();
        if (inputCrudo.endsWith("+")) {
            inputCrudo = inputCrudo.slice(0, -1).trim();
        }

        const cantidad = parseInt(inputCantidad.value);
        if (inputCrudo === "" || cantidad <= 0) return;

        const nombresSeparados = inputCrudo.split("+").map(n => n.trim()).filter(n => n !== "");
        let precioTotalBase = 0;
        let nombresValidados = [];

        for (let nombre of nombresSeparados) {
            const productoEncontrado = productosDB.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

            if (!productoEncontrado) {
                alert(`El producto "${nombre}" no existe en tu inventario. Por favor revisa si está bien escrito.`);
                return;
            }

            let precioDelProducto = productoEncontrado.precio;
            let nombreParaHistorial = productoEncontrado.nombre;

            if (productoEncontrado.nombre.toLowerCase().includes("comida")) {
                let precioIngresado = prompt(`¿Qué precio tiene la Comida hoy?\n\nIngresa el monto (Ej: 5, 7, 8, 10):`, productoEncontrado.precio);
                
                if (precioIngresado === null || precioIngresado.trim() === "" || isNaN(parseFloat(precioIngresado)) || parseFloat(precioIngresado) < 0) {
                    alert("Registro cancelado. Debes ingresar un precio válido.");
                    return; 
                }
                
                precioDelProducto = parseFloat(precioIngresado);
                nombreParaHistorial = `Comida (S/ ${precioDelProducto.toFixed(2)})`;
            }

            precioTotalBase += precioDelProducto;
            nombresValidados.push(nombreParaHistorial);
        }

        const precioTotal = precioTotalBase * cantidad;

        let itemsDeEstePedido = [];
        for (let nombre of nombresValidados) {
            for (let i = 0; i < cantidad; i++) {
                itemsDeEstePedido.push(nombre);
            }
        }
        let textoNuevoPedido = itemsDeEstePedido.join(" + ");

        const indexExistente = historialConsumos.findIndex(registro => registro.fecha === fecha);

        if (indexExistente !== -1) {
            let textoCombinado = historialConsumos[indexExistente].productoNombre + " + " + textoNuevoPedido;
            historialConsumos[indexExistente].productoNombre = agruparConsumosTexto(textoCombinado);
            historialConsumos[indexExistente].precio += precioTotal;
        } else {
            historialConsumos.push({
                fecha: fecha,
                productoNombre: agruparConsumosTexto(textoNuevoPedido),
                precio: precioTotal
            });
        }

        historialConsumos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        localStorage.setItem(storageKey, JSON.stringify(historialConsumos));

        if (mesFiltro.value !== "todos" && mesFiltro.value != dateObj.getMonth()) {
            mesFiltro.value = dateObj.getMonth().toString();
        }

        inputProducto.value = "";
        inputCantidad.value = "1";
        inputProducto.focus();

        renderizarConsumos();
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

            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

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
                const nombreDia = diasSemana[dateObj.getDay()];

                let fechaCorta = `${nombreDia} ${d}/${m}`;
                
                let detalleParaWA = registro.productoNombre.split(/<br>\s*\+?|<br>|\n/)
                    .map(item => item.trim().replace(/^\+\s*/, ''))
                    .filter(item => item !== '')
                    .join(" + ");

                mensaje += `- *${fechaCorta}*: ${detalleParaWA} (S/ ${registro.precio.toFixed(2)})\n`;
            });

            mensaje += `\n*TOTAL A PAGAR: S/ ${sumaTotal.toFixed(2)}*\n\n`;

            mensaje += `*Datos para realizar el pago (Yape):*\n`;
            mensaje += `- Numero: 949 563 910\n`;
            mensaje += `- Titular: Rosa Ro***\n\n`;
            mensaje += `Le agradecemos el envio de la captura del pago por este medio. ¡Muchas gracias y que tenga un buen dia!`;

            const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
            window.open(urlWhatsApp, '_blank');
        });
    }

    // 7. EXPORTAR A PDF - NUEVO DISEÑO CALCO DE LA IMAGEN
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
            reciboPDF.style.color = "#333";

            let htmlContenido = `
                <div style="text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 15px; margin-bottom: 25px;">
                    <h1 style="color: #0d6efd; margin: 0; font-size: 28px; font-weight: bold;">Nobel School</h1>
                    <h3 style="color: #6c757d; margin: 5px 0 0 0; font-size: 18px;">Estado de Cuenta - Consumo mensual en el quiosco</h3>
                </div>
                
                <div style="border: 1px solid #eef0f2; border-radius: 10px; background-color: #fcfcfc; margin-bottom: 25px; padding: 20px; box-sizing: border-box;">
                    <table style="width: 100%; border-collapse: collapse; border: none;">
                        <tr>
                            <td style="width: 50%; padding-right: 20px; border-right: 1px solid #eef0f2; vertical-align: top;">
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Nombre</p>
                                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #2b3035;">${nombreUsuario}</p>
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Ocupación</p>
                                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #2b3035;">${ocupacionTexto}</p>
                            </td>
                            <td style="width: 50%; padding-left: 25px; vertical-align: top;">
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Mes</p>
                                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #2b3035;">${nombreMes}</p>
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: #8fa0ab; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">Fecha de Emisión</p>
                                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #2b3035;">${new Date().toLocaleDateString('es-PE')}</p>
                            </td>
                        </tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 15px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Fecha</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Detalle de Consumo</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Importe (S/)</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            consumosDelMes.forEach(registro => {
                const [y, m, d] = registro.fecha.split('-');
                const dateObj = new Date(y, m - 1, d);
                
                const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
                let fechaBonita = dateObj.toLocaleDateString('es-PE', opcionesFecha);
                fechaBonita = fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1);

                htmlContenido += `
                    <tr>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; vertical-align: top;">${fechaBonita}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; vertical-align: top;">${registro.productoNombre}</td>
                        <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right; vertical-align: top;">S/ ${registro.precio.toFixed(2)}</td>
                    </tr>
                `;
            });

            htmlContenido += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px;">TOTAL A PAGAR:</td>
                            <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #198754;">S/ ${sumaTotal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <table style="width: 100%; max-width: 400px; margin: 25px auto 10px auto; background-color: #742384; border-radius: 16px; color: white; border-collapse: collapse; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 20px 10px 20px 25px; vertical-align: middle; width: 55%;">
                            <div style="font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px;">YAPE</div>
                            <p style="margin: 0 0 4px 0; font-size: 13px; opacity: 0.9;">Escanea o yapea al número:</p>
                            <p style="margin: 0 0 4px 0; font-size: 19px; font-weight: bold; letter-spacing: 1px;">949 563 910</p>
                            <p style="margin: 0; font-size: 13px;">TITULAR: ROSA RO***</p>
                        </td>
                        <td style="padding: 20px 25px 20px 10px; vertical-align: middle; text-align: right; width: 45%;">
                            <div style="background-color: white; padding: 6px; border-radius: 12px; display: inline-block; width: 120px; height: 120px; box-sizing: border-box;">
                                <img src="yape.png" alt="QR" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.style.display='none'; this.parentNode.innerHTML='<div style=\\'color:#742384; font-size:12px; margin-top:40px; font-weight:bold; line-height:1.2; text-align:center;\\'>Falta QR</div>';">
                            </div>
                        </td>
                    </tr>
                </table>
                
                <div style="text-align: center; color: #6c757d; font-size: 11px; margin-top: 15px; margin-bottom: 15px;">
                    <p>Se agradece el pronto pago de su cuenta, tenga un buen dia</p>
                </div>
            `;

            reciboPDF.innerHTML = htmlContenido;

            const opcionesPDF = {
                margin:       [0.5, 0.5, 0.5, 0.5],
                filename:     `Consumo_${nombreUsuario.replace(/ /g, "_")}_${nombreMes}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

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

    renderizarConsumos();
});