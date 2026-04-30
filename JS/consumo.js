document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtener datos de la URL
    const params = new URLSearchParams(window.location.search);
    const nombreUsuario = params.get("nombre") || "Usuario Desconocido";
    const rolUsuario = params.get("rol") || "index"; 
    
    document.getElementById("nombrePersona").textContent = nombreUsuario;
    document.getElementById("btnVolver").addEventListener("click", () => {
        window.location.href = `${rolUsuario}.html`;
    });

    // 2. Elementos del DOM
    const inputProducto = document.getElementById("inputProducto");
    const inputCantidad = document.getElementById("inputCantidad");
    const sugerenciasProductos = document.getElementById("sugerenciasProductos");
    const fechaConsumo = document.getElementById("fechaConsumo");
    const formConsumo = document.getElementById("formConsumo");
    const tablaConsumos = document.getElementById("tablaConsumos");
    const totalAcumulado = document.getElementById("totalAcumulado");
    const mesFiltro = document.getElementById("mesFiltro");

    // Seleccionar por defecto el mes actual y la fecha de hoy
    const fechaHoy = new Date();
    fechaConsumo.valueAsDate = fechaHoy;
    mesFiltro.value = fechaHoy.getMonth().toString();

    // 3. Cargar base de datos de productos para autocompletar
    const productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];
    
    productosDB.forEach(prod => {
        let option = document.createElement("option");
        option.value = prod.nombre;
        sugerenciasProductos.appendChild(option);
    });

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
            
            const opcionesFecha = { weekday: 'short', day: 'numeric', month: 'short' };
            let fechaBonita = dateObj.toLocaleDateString('es-PE', opcionesFecha);
            fechaBonita = fechaBonita.charAt(0).toUpperCase() + fechaBonita.slice(1);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="ps-4 text-muted">${fechaBonita}.</td>
                <td class="fw-bold text-dark">${registro.productoNombre}</td>
                <td class="text-center text-dark">S/ ${registro.precio.toFixed(2)}</td>
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

    // 5. Agregar un nuevo consumo con CANTIDAD MULTIPLICADA
    formConsumo.addEventListener("submit", (e) => {
        e.preventDefault();

        const fecha = fechaConsumo.value;
        const [y, m, d] = fecha.split('-');
        const dateObj = new Date(y, m - 1, d);

        if (dateObj.getDay() === 0) {
            alert("No se permiten registros los domingos. Solo trabajamos de Lunes a Sábado.");
            return; 
        }

        const nombreProd = inputProducto.value.trim(); 
        const cantidad = parseInt(inputCantidad.value);
        
        // Buscamos el producto en el inventario
        const productoEncontrado = productosDB.find(p => p.nombre.toLowerCase() === nombreProd.toLowerCase());

        if (!productoEncontrado) {
            alert(`El producto "${nombreProd}" no existe en tu inventario.`);
            return;
        }

        // MÁGIA AQUÍ: Multiplicamos el precio por la cantidad
        const precioTotal = productoEncontrado.precio * cantidad;
        
        // Formateamos el texto. Si es más de 1, le pone el (x). Ej: "pan con pollo(2)"
        // Usamos el nombre exacto de la base de datos (productoEncontrado.nombre) para respetar mayúsculas/minúsculas
        const nombreFinal = cantidad > 1 ? `${productoEncontrado.nombre}(${cantidad})` : productoEncontrado.nombre;

        if (nombreProd !== "" && cantidad > 0 && fecha) {
            
            const indexExistente = historialConsumos.findIndex(registro => registro.fecha === fecha);

            if (indexExistente !== -1) {
                // Se agrupa con lo que ya compraste ese día
                historialConsumos[indexExistente].productoNombre += " + " + nombreFinal;
                historialConsumos[indexExistente].precio += precioTotal;
            } else {
                // Se crea un registro nuevo para ese día
                historialConsumos.push({
                    fecha: fecha,
                    productoNombre: nombreFinal,
                    precio: precioTotal
                });
            }

            historialConsumos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            localStorage.setItem(storageKey, JSON.stringify(historialConsumos));
            
            if (mesFiltro.value !== "todos" && mesFiltro.value != dateObj.getMonth()) {
                mesFiltro.value = dateObj.getMonth().toString();
            }

            // Limpiar campos y devolver la cantidad a 1 por defecto
            inputProducto.value = "";
            inputCantidad.value = "1";
            inputProducto.focus(); 
            
            renderizarConsumos();
        }
    });

    window.eliminarRegistro = (index) => {
        if(confirm("¿Borrar este registro completo? Se descontará del total del mes.")) {
            historialConsumos.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(historialConsumos));
            renderizarConsumos();
        }
    };

    renderizarConsumos();
});