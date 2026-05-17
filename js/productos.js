import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
    const tablaProductos = document.getElementById("tablaProductos");
    const buscadorProductos = document.getElementById("buscadorProductos");
    const btnAgregarModal = document.getElementById("btnAgregarModal");

    let productosDB = [];

    // LECTURA EN TIEMPO REAL DESDE FIREBASE
    onSnapshot(query(collection(db, "productos")), (snap) => {
        productosDB = [];
        snap.forEach(doc => productosDB.push({ id: doc.id, ...doc.data() }));
        
        localStorage.setItem("base_productos", JSON.stringify(productosDB));
        
        // TU ORDEN LÓGICO ORIGINAL INTACTO
        const ordenCategorias = {
            "comida": 1,
            "bebida": 2,
            "pan": 3,
            "keke": 4,
            "postre": 5,
            "galleta": 6,
            "snack": 7,
            "dulce": 8,
            "utiles": 9,
            "otro": 10
        };

        productosDB.sort((a, b) => {
            let catA = ordenCategorias[a.categoria] || 99;
            let catB = ordenCategorias[b.categoria] || 99;
            
            if (catA === catB) {
                const nombreA = a.nombre || "";
                const nombreB = b.nombre || "";
                return nombreA.localeCompare(nombreB);
            }
            return catA - catB;
        });

        renderizarProductos();
    }, (error) => {
        Swal.fire('Error de conexión', 'No se pudo conectar con el inventario.', 'error');
        if(tablaProductos) tablaProductos.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-5">Error al cargar inventario</td></tr>`;
    });

    if (buscadorProductos) {
        buscadorProductos.addEventListener("input", renderizarProductos);
    }

    function renderizarProductos() {
        if (!tablaProductos) return;
        tablaProductos.innerHTML = "";
        
        const textoBusqueda = buscadorProductos ? buscadorProductos.value.toLowerCase() : "";
        const filtrados = productosDB.filter(p => (p.nombre || "").toLowerCase().includes(textoBusqueda));

        if (filtrados.length === 0) {
            tablaProductos.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-5"><i class="bi bi-search fs-1"></i><p class="mt-2">No se encontraron productos.</p></td></tr>`;
            return;
        }

        const iconos = {
            comida: "🍛", bebida: "🥤", pan: "🥖", galleta: "🍪", keke: "🧁", 
            postre: "🍮", dulce: "🍬", snack: "🍟", utiles: "✏️", otro: "📦"
        };

        const nombresCategorias = {
            comida: "🍛 COMIDA (MENÚ)", bebida: "🥤 BEBIDAS", pan: "🥖 PAN / SÁNDWICH", 
            galleta: "🍪 GALLETAS", keke: "🧁 KEKES / PORCIONES", postre: "🍮 POSTRES", 
            dulce: "🍬 DULCES", snack: "🍟 SNACKS", utiles: "✏️ ÚTILES", otro: "📦 OTROS"
        };

        let categoriaActual = "";

        filtrados.forEach(p => {
            let catLimpia = p.categoria || "otro";

            // AQUÍ ESTÁ LA MAGIA: Si cambia la categoría, dibujamos una fila separadora
            if (catLimpia !== categoriaActual) {
                categoriaActual = catLimpia;
                let nombreMostrado = nombresCategorias[catLimpia] || "📦 OTROS";
                
                const trHeader = document.createElement("tr");
                trHeader.innerHTML = `
                    <td colspan="4" class="py-2 px-4 shadow-sm" style="background-color: var(--bs-secondary-bg); border-bottom: 2px solid #0dcaf0;">
                        <span class="fw-bold text-body-emphasis" style="letter-spacing: 1px; font-size: 0.85rem;">${nombreMostrado}</span>
                    </td>
                `;
                tablaProductos.appendChild(trHeader);
            }

            const tr = document.createElement("tr");
            let icono = iconos[catLimpia] || "📦";
            
            // FILA CORREGIDA: text-end para alinear, y d-flex gap-2 para los botones
            tr.innerHTML = `
                <td class="text-center ps-4 fs-4 align-middle">${icono}</td>
                <td class="fw-bold text-body-emphasis align-middle">${p.nombre}</td>
                <td class="fw-bold text-success text-end pe-4 align-middle text-nowrap">S/ ${parseFloat(p.precio).toFixed(2)}</td>
                <td class="text-end pe-4 align-middle">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-primary rounded-2 shadow-sm d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;" onclick="window.editarProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, '${p.categoria}')" title="Editar"><i class="bi bi-pencil-square"></i></button>
                        <button class="btn btn-sm btn-outline-danger rounded-2 shadow-sm d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;" onclick="window.eliminarProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" title="Eliminar"><i class="bi bi-trash3"></i></button>
                    </div>
                </td>
            `;
            tablaProductos.appendChild(tr);
        });
    }

    // TUS VENTANAS ORIGINALES DE SWEET ALERT
    if (btnAgregarModal) {
        btnAgregarModal.onclick = async () => {
            const { value: formValues } = await Swal.fire({
                title: 'Nuevo Producto',
                html: `
                    <div class="mb-3 text-start">
                        <label class="form-label fw-bold small text-muted">Nombre del Producto</label>
                        <input id="swal-prod-nombre" class="form-control form-control-lg" placeholder="Ej: Arroz con Pollo" autocomplete="off">
                    </div>
                    <div class="mb-3 text-start">
                        <label class="form-label fw-bold small text-muted">Precio (S/)</label>
                        <input id="swal-prod-precio" type="number" step="0.10" min="0" class="form-control form-control-lg" placeholder="0.00">
                    </div>
                    <div class="mb-1 text-start">
                        <label class="form-label fw-bold small text-muted">Categoría</label>
                        <select id="swal-prod-cat" class="form-select form-select-lg">
                            <option value="" selected disabled>Elegir...</option>
                            <option value="comida">🍛 Comida (Menú)</option>
                            <option value="bebida">🥤 Bebidas</option>
                            <option value="pan">🥖 Pan / Sándwich</option>
                            <option value="galleta">🍪 Galletas</option>
                            <option value="keke">🧁 Kekes / Porciones</option>
                            <option value="postre">🍮 Postres</option>
                            <option value="dulce">🍬 Dulces</option>
                            <option value="snack">🍟 Snacks</option>
                            <option value="utiles">✏️ Útiles</option>
                            <option value="otro">📦 Otro</option>
                        </select>
                    </div>
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonColor: '#0dcaf0',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="bi bi-save text-dark"></i> <span class="text-dark fw-bold">Guardar</span>',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    return {
                        nombre: document.getElementById('swal-prod-nombre').value,
                        precio: document.getElementById('swal-prod-precio').value,
                        categoria: document.getElementById('swal-prod-cat').value
                    }
                }
            });

            if (formValues) {
                if (!formValues.nombre.trim() || !formValues.precio || !formValues.categoria) {
                    Swal.fire('Campos Incompletos', 'Por favor, llena todos los datos del producto.', 'warning');
                    return;
                }

                let nombreLimpio = formValues.nombre.trim();
                nombreLimpio = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);
                
                const existe = productosDB.some(p => (p.nombre || "").toLowerCase() === nombreLimpio.toLowerCase());
                if (existe) {
                    Swal.fire('Atención', `El producto <b>${nombreLimpio}</b> ya existe en tu inventario.`, 'warning');
                    return;
                }

                try {
                    await addDoc(collection(db, "productos"), {
                        nombre: nombreLimpio,
                        precio: parseFloat(formValues.precio),
                        categoria: formValues.categoria
                    });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto añadido', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        };
    }

    window.eliminarProducto = (id, nombre) => {
        Swal.fire({
            title: '¿Eliminar producto?',
            html: `¿Estás seguro de que deseas borrar <b>${nombre}</b> del catálogo?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-trash3-fill"></i> Sí, borrar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "productos", id));
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Borrado', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    window.editarProducto = async (id, nombreViejo, precioViejo, catVieja) => {
        const { value: formValues } = await Swal.fire({
            title: 'Editar Producto',
            html: `
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Nombre del Producto</label>
                    <input id="swal-edit-nombre" class="form-control form-control-lg" value="${nombreViejo}" autocomplete="off">
                </div>
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Precio (S/)</label>
                    <input id="swal-edit-precio" type="number" step="0.10" min="0" class="form-control form-control-lg" value="${precioViejo}">
                </div>
                <div class="mb-1 text-start">
                    <label class="form-label fw-bold small text-muted">Categoría</label>
                    <select id="swal-edit-cat" class="form-select form-select-lg">
                        <option value="comida" ${catVieja === 'comida' ? 'selected' : ''}>🍛 Comida (Menú)</option>
                        <option value="bebida" ${catVieja === 'bebida' ? 'selected' : ''}>🥤 Bebidas</option>
                        <option value="pan" ${catVieja === 'pan' ? 'selected' : ''}>🥖 Pan / Sándwich</option>
                        <option value="galleta" ${catVieja === 'galleta' ? 'selected' : ''}>🍪 Galletas</option>
                        <option value="keke" ${catVieja === 'keke' ? 'selected' : ''}>🧁 Kekes / Porciones</option>
                        <option value="postre" ${catVieja === 'postre' ? 'selected' : ''}>🍮 Postres</option>
                        <option value="dulce" ${catVieja === 'dulce' ? 'selected' : ''}>🍬 Dulces</option>
                        <option value="snack" ${catVieja === 'snack' ? 'selected' : ''}>🍟 Snacks</option>
                        <option value="utiles" ${catVieja === 'utiles' ? 'selected' : ''}>✏️ Útiles</option>
                        <option value="otro" ${catVieja === 'otro' ? 'selected' : ''}>📦 Otro</option>
                    </select>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonColor: '#0dcaf0',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-save text-dark"></i> <span class="text-dark fw-bold">Actualizar</span>',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    nombre: document.getElementById('swal-edit-nombre').value,
                    precio: document.getElementById('swal-edit-precio').value,
                    categoria: document.getElementById('swal-edit-cat').value
                }
            }
        });

        if (formValues) {
            if (!formValues.nombre.trim() || !formValues.precio) return;

            let nombreLimpio = formValues.nombre.trim();
            nombreLimpio = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);
            
            const existe = productosDB.some(p => (p.nombre || "").toLowerCase() === nombreLimpio.toLowerCase() && p.id !== id);
            if (existe) {
                Swal.fire('Atención', `Ya existe otro producto llamado <b>${nombreLimpio}</b>.`, 'warning');
                return;
            }

            try {
                await updateDoc(doc(db, "productos", id), {
                    nombre: nombreLimpio,
                    precio: parseFloat(formValues.precio),
                    categoria: formValues.categoria
                });
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto actualizado', showConfirmButton: false, timer: 2000 });
            } catch (e) {
                Swal.fire('Error', e.message, 'error');
            }
        }
    };
});