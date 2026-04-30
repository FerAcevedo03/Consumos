document.addEventListener("DOMContentLoaded", () => {
    const formProducto = document.getElementById("formProducto");
    const tablaProductos = document.getElementById("tablaProductos");
    const buscadorProductos = document.getElementById("buscadorProductos");

    // 1. BLINDAJE: Verificar que el HTML esté correcto
    if (!formProducto || !tablaProductos) {
        console.error("Error: No se encontraron los elementos del formulario de productos en el HTML.");
        return;
    }

    // 2. BLINDAJE ANTI-DATOS CORRUPTOS
    let productosDB = [];
    try {
        const guardado = JSON.parse(localStorage.getItem("base_productos"));
        if (Array.isArray(guardado)) {
            productosDB = guardado;
        } else {
            productosDB = []; // Limpiar si hay basura
        }
    } catch (e) {
        productosDB = []; // Limpiar si el formato se rompió
    }

    // Función para mostrar los productos en formato de lista (Tabla)
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
            // Encontrar el índice original en la base de datos general
            const originalIndex = productosDB.indexOf(prod);
            
            // Si no hay imagen, usamos un cuadro de imagen por defecto
            const imagenSrc = prod.imagen ? prod.imagen : "https://via.placeholder.com/50?text=Img";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-center">
                    <img src="${imagenSrc}" alt="${prod.nombre}" class="img-thumbnail rounded" style="width: 45px; height: 45px; object-fit: cover;">
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

    // Evento del buscador en tiempo real
    if (buscadorProductos) {
        buscadorProductos.addEventListener("input", (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            const productosFiltrados = productosDB.filter(prod => 
                prod.nombre.toLowerCase().includes(textoBusqueda)
            );
            renderizarProductos(productosFiltrados);
        });
    }

    // Evento al enviar el formulario (Agregar nuevo producto)
    formProducto.addEventListener("submit", (e) => {
        e.preventDefault(); 

        const nombre = document.getElementById("prodNombre").value.trim();
        const precio = parseFloat(document.getElementById("prodPrecio").value);
        const imagen = document.getElementById("prodImagen").value.trim();

        if (nombre !== "" && !isNaN(precio)) {
            productosDB.push({
                nombre: nombre,
                precio: precio,
                imagen: imagen
            });

            // Forzamos el guardado en memoria
            localStorage.setItem("base_productos", JSON.stringify(productosDB));
            formProducto.reset();
            
            // Limpiamos el buscador si agregamos algo nuevo para que se vea completo
            if (buscadorProductos) buscadorProductos.value = ""; 
            renderizarProductos();
        } else {
            alert("Por favor, asegúrate de poner un nombre y un precio válido.");
        }
    });

    // Función para editar el precio de un producto existente
    window.editarPrecio = (index) => {
        const productoActual = productosDB[index];
        const nuevoPrecioStr = prompt(`Ingresa el nuevo precio para "${productoActual.nombre}":`, productoActual.precio);
        
        if (nuevoPrecioStr !== null) { // Si el usuario no canceló
            const nuevoPrecio = parseFloat(nuevoPrecioStr);
            
            if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                productosDB[index].precio = nuevoPrecio; 
                localStorage.setItem("base_productos", JSON.stringify(productosDB)); 
                
                // Actualizar vista
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

    // Función para eliminar un producto
    window.eliminarProducto = (index) => {
        if (confirm(`¿Estás seguro de eliminar "${productosDB[index].nombre}"?`)) {
            productosDB.splice(index, 1);
            localStorage.setItem("base_productos", JSON.stringify(productosDB));
            
            // Actualizar vista
            if (buscadorProductos && buscadorProductos.value !== "") {
                buscadorProductos.dispatchEvent(new Event('input'));
            } else {
                renderizarProductos();
            }
        }
    };

    // Renderizar la tabla la primera vez que carga la página
    renderizarProductos();
});