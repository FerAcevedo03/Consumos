document.addEventListener("DOMContentLoaded", () => {
    const formProducto = document.getElementById("formProducto");
    const tablaProductos = document.getElementById("tablaProductos");
    const buscadorProductos = document.getElementById("buscadorProductos");

    // Cargar productos de localStorage o crear un array vacío
    let productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];

    // Función para mostrar los productos en formato de lista (Tabla)
    // Recibe un array; por defecto será toda la base de datos si no hay filtro
    function renderizarProductos(productosAMostrar = productosDB) {
        tablaProductos.innerHTML = "";

        if (productosAMostrar.length === 0) {
            tablaProductos.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-4">
                        <i class="bi bi-search fs-4 d-block mb-2"></i> No se encontraron productos.
                    </td>
                </tr>`;
            return;
        }

        productosAMostrar.forEach((prod) => {
            // Encontrar el índice original en la base de datos general
            // Vital para editar/eliminar el correcto cuando la lista está filtrada
            const originalIndex = productosDB.indexOf(prod);

            // Si no hay imagen, usamos un cuadro de imagen por defecto
            const imagenSrc = prod.imagen ? prod.imagen : "https://via.placeholder.com/50?text=Img";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-center">
                    <img src="${imagenSrc}" alt="${prod.nombre}" class="img-thumbnail rounded" style="width: 45px; height: 45px; object-fit: cover;">
                </td>
                <td class="fw-bold text-dark">${prod.nombre}</td>
                <td class="text-success fw-bold">S/ ${prod.precio.toFixed(2)}</td>
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

    // Evento del buscador en tiempo real
    buscadorProductos.addEventListener("input", (e) => {
        const textoBusqueda = e.target.value.toLowerCase().trim();

        // Filtramos los productos que contengan el texto escrito
        const productosFiltrados = productosDB.filter(prod =>
            prod.nombre.toLowerCase().includes(textoBusqueda)
        );

        // Renderizamos solo los que pasaron el filtro
        renderizarProductos(productosFiltrados);
    });

    // Evento al enviar el formulario (Agregar nuevo producto)
    formProducto.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = document.getElementById("prodNombre").value.trim();
        const precio = parseFloat(document.getElementById("prodPrecio").value);
        const imagen = document.getElementById("prodImagen").value.trim();

        if (nombre && !isNaN(precio)) {
            productosDB.push({
                nombre: nombre,
                precio: precio,
                imagen: imagen
            });

            localStorage.setItem("base_productos", JSON.stringify(productosDB));
            formProducto.reset();

            // Limpiamos el buscador si agregamos algo nuevo para que se vea completo
            buscadorProductos.value = "";
            renderizarProductos();
        }
    });

    // Función para editar el precio de un producto existente
    window.editarPrecio = (index) => {
        const productoActual = productosDB[index];
        const nuevoPrecioStr = prompt(`Ingresa el nuevo precio para "${productoActual.nombre}":`, productoActual.precio);

        if (nuevoPrecioStr !== null) { // Si el usuario no canceló
            const nuevoPrecio = parseFloat(nuevoPrecioStr);

            if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                productosDB[index].precio = nuevoPrecio; // Actualizamos el valor
                localStorage.setItem("base_productos", JSON.stringify(productosDB)); // Guardamos

                // Si el usuario estaba buscando, forzamos la actualización manteniendo el filtro
                buscadorProductos.dispatchEvent(new Event('input'));
            } else {
                alert("Por favor, ingresa un número válido.");
            }
        }
    };

    // Función para eliminar un producto
    window.eliminarProducto = (index) => {
        if (confirm(`¿Estás seguro de eliminar "${productosDB[index].nombre}"?`)) {
            productosDB.splice(index, 1);
            localStorage.setItem("base_productos", JSON.stringify(productosDB));

            // Actualizamos manteniendo la búsqueda activa
            buscadorProductos.dispatchEvent(new Event('input'));
        }
    };

    // Renderizar la tabla la primera vez que carga la página
    renderizarProductos();
});