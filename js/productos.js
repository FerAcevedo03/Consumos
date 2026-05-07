import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Tu configuración de Firebase
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
    // Referencias exactas a tus IDs del HTML
    const formProducto = document.getElementById("formProducto");
    const inputNombre = document.getElementById("prodNombre");
    const inputPrecio = document.getElementById("prodPrecio");
    const selectCategoria = document.getElementById("prodCategoria");
    const tablaInventario = document.getElementById("tablaProductos");
    const buscadorProductos = document.getElementById("buscadorProductos");

    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
    const tituloFormulario = document.getElementById("tituloFormulario");

    let productos = [];
    let idEdicionActual = null;

    // --- LECTURA EN TIEMPO REAL DESDE FIREBASE ---
    onSnapshot(collection(db, "productos"), (snapshot) => {
        productos = [];
        snapshot.forEach((doc) => {
            productos.push({ id: doc.id, ...doc.data() });
        });

        localStorage.setItem("base_productos", JSON.stringify(productos));
        filtrarYRenderizar();
    });

    // --- FUNCIÓN PARA MOSTRAR LA TABLA ---
    function renderizarTabla(lista) {
        tablaInventario.innerHTML = "";

        if (lista.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron productos.</td></tr>`;
            return;
        }

        // Ordenar alfabéticamente
        lista.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach((prod) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-center"><span class="fs-4">${obtenerEmoji(prod.categoria)}</span></td>
                <td class="fw-bold text-dark">${prod.nombre}</td>
                <td class="text-success fw-bold">S/ ${parseFloat(prod.precio).toFixed(2)}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-outline-warning btn-sm me-1" onclick="editarProducto('${prod.id}')" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto('${prod.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tablaInventario.appendChild(tr);
        });
    }

    // Lógica ampliada para tus iconos originales
    function obtenerEmoji(cat) {
        const emojis = {
            comida: "🍛", bebida: "🥤", pan: "🥖", 
            galleta: "🍪", keke: "🧁", postre: "🍮", 
            dulce: "🍬", snack: "🍟", utiles: "✏️", otro: "📦", menu: "🍛"
        };
        return emojis[cat] || "📦";
    }

    function filtrarYRenderizar() {
        const textoBusqueda = buscadorProductos ? buscadorProductos.value.toLowerCase().trim() : "";
        const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(textoBusqueda));
        renderizarTabla(filtrados);
    }

    if (buscadorProductos) {
        buscadorProductos.addEventListener("input", filtrarYRenderizar);
    }

    // --- GUARDAR / ACTUALIZAR PRODUCTO ---
    formProducto.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = inputNombre.value.trim();
        const precio = parseFloat(inputPrecio.value);
        const categoria = selectCategoria.value;

        if (!nombre || isNaN(precio) || !categoria) {
            alert("Completa todos los campos correctamente.");
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = "⏳...";

        try {
            if (idEdicionActual) {
                await updateDoc(doc(db, "productos", idEdicionActual), {
                    nombre: nombre,
                    precio: precio,
                    categoria: categoria
                });
                salirModoEdicion();
            } else {
                await addDoc(collection(db, "productos"), {
                    nombre: nombre,
                    precio: precio,
                    categoria: categoria
                });
                formProducto.reset();
            }
        } catch (error) {
            alert("Error al conectar con la Nube: " + error.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = idEdicionActual ? "Actualizar" : "Guardar";
            inputNombre.focus();
        }
    });

    // --- MODO EDICIÓN ---
    window.editarProducto = (idFirebase) => {
        const prod = productos.find(p => p.id === idFirebase);
        if (prod) {
            inputNombre.value = prod.nombre;
            inputPrecio.value = prod.precio;
            selectCategoria.value = prod.categoria || "otro";

            idEdicionActual = idFirebase;

            tituloFormulario.textContent = "Editar Producto";
            btnGuardar.textContent = "Actualizar";
            btnGuardar.classList.replace("btn-info", "btn-warning"); 
            btnCancelarEdicion.classList.remove("d-none");

            inputNombre.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }
    };

    btnCancelarEdicion.addEventListener("click", salirModoEdicion);

    function salirModoEdicion() {
        formProducto.reset();
        idEdicionActual = null;
        tituloFormulario.textContent = "Agregar Nuevo Producto o Comida";
        btnGuardar.textContent = "Guardar";
        btnGuardar.classList.replace("btn-warning", "btn-info");
        btnCancelarEdicion.classList.add("d-none");
    }

    // --- ELIMINAR PRODUCTO ---
    window.eliminarProducto = async (idFirebase) => {
        if (confirm("¿Estás seguro de eliminar este producto del inventario de la nube?")) {
            try {
                await deleteDoc(doc(db, "productos", idFirebase));
                if (idEdicionActual === idFirebase) salirModoEdicion();
            } catch (error) {
                alert("Error al eliminar: " + error.message);
            }
        }
    };
});