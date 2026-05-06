document.addEventListener("DOMContentLoaded", () => {
    const formProducto = document.getElementById("formProducto");
    const tablaProductos = document.getElementById("tablaProductos");
    const buscadorProductos = document.getElementById("buscadorProductos");

    if (!formProducto || !tablaProductos) {
        console.error("Error: No se encontraron los elementos del formulario en el HTML.");
        return;
    }

    let productosDB = [];
    try {
        const guardado = JSON.parse(localStorage.getItem("base_productos"));
        if (Array.isArray(guardado)) {
            productosDB = guardado;
        } else {
            productosDB = [];
        }
    } catch (e) {
        productosDB = [];
    }

    function renderizarProductos(productosAMostrar = productosDB) {
        tablaProductos.innerHTML = "";

        if (productosAMostrar.length === 0) {
            tablaProductos.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-4 d-block mb-2"></i> No hay productos registrados aún.
                    </td>
                </tr>`;
            return;
        }

        productosAMostrar.forEach((prod) => {
            const originalIndex = productosDB.indexOf(prod);

            // --- MAGIA VISUAL: Usamos los mismos Emojis exactos del menú ---
            let emoji = "📦";
            const cat = prod.categoria || "otro";

            switch (cat) {
                case "comida": emoji = "🍛"; break;
                case "bebida": emoji = "🥤"; break;
                case "pan": emoji = "🥖"; break;
                case "galleta": emoji = "🍪"; break;
                case "keke": emoji = "🧁"; break;
                case "postre": emoji = "🍮"; break;
                case "dulce": emoji = "🍬"; break;
                case "snack": emoji = "🍟"; break;
                case "utiles": emoji = "✏️"; break;
                default: emoji = "📦"; break;
            }

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-center">
                    <div class="bg-white border rounded d-inline-flex shadow-sm fs-4" style="width: 40px; height: 40px; align-items: center; justify-content: center; line-height: 1;">
                        ${emoji}
                    </div>
                </td>
                <td class="fw-bold text-dark">${prod.nombre}</td>
                <td class="text-success fw-bold">S/ ${parseFloat(prod.precio).toFixed(2)}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-outline-warning me-2" onclick="editarPrecio(${originalIndex})" title="Editar Precio">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${originalIndex})" title="Eliminar Producto">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            `;
            tablaProductos.appendChild(tr);
        });
    }

    if (buscadorProductos) {
        buscadorProductos.addEventListener("input", (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            const productosFiltrados = productosDB.filter(prod =>
                prod.nombre.toLowerCase().includes(textoBusqueda)
            );
            renderizarProductos(productosFiltrados);
        });
    }

    formProducto.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = document.getElementById("prodNombre").value.trim();
        const precio = parseFloat(document.getElementById("prodPrecio").value);
        const categoria = document.getElementById("prodCategoria").value;

        if (nombre !== "" && !isNaN(precio) && categoria !== "") {
            productosDB.push({
                nombre: nombre,
                precio: precio,
                categoria: categoria
            });

            localStorage.setItem("base_productos", JSON.stringify(productosDB));
            formProducto.reset();

            if (buscadorProductos) buscadorProductos.value = "";
            renderizarProductos();
        } else {
            alert("Por favor, asegúrate de llenar el nombre, el precio y seleccionar una categoría.");
        }
    });

    window.editarPrecio = (index) => {
        const productoActual = productosDB[index];
        const nuevoPrecioStr = prompt(`Ingresa el nuevo precio para "${productoActual.nombre}":`, productoActual.precio);

        if (nuevoPrecioStr !== null) {
            const nuevoPrecio = parseFloat(nuevoPrecioStr);

            if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                productosDB[index].precio = nuevoPrecio;
                localStorage.setItem("base_productos", JSON.stringify(productosDB));

                if (buscadorProductos && buscadorProductos.value !== "") {
                    buscadorProductos.dispatchEvent(new Event('input'));
                } else {
                    renderizarProductos();
                }
            } else {
                alert("Por favor, ingresa un número válido.");
            }
        }
    };

    window.eliminarProducto = (index) => {
        if (confirm(`¿Estás seguro de eliminar "${productosDB[index].nombre}"?`)) {
            productosDB.splice(index, 1);
            localStorage.setItem("base_productos", JSON.stringify(productosDB));

            if (buscadorProductos && buscadorProductos.value !== "") {
                buscadorProductos.dispatchEvent(new Event('input'));
            } else {
                renderizarProductos();
            }
        }
    };

    renderizarProductos();
});