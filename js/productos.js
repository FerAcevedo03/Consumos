import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

    onSnapshot(collection(db, "productos"), (snapshot) => {
        productos = [];
        snapshot.forEach((doc) => {
            productos.push({ id: doc.id, ...doc.data() });
        });
        localStorage.setItem("base_productos", JSON.stringify(productos));
        filtrarYRenderizar();
    });

    function renderizarTabla(lista) {
        tablaInventario.innerHTML = "";
        if (lista.length === 0) {
            tablaInventario.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron productos.</td></tr>`;
            return;
        }

        // ordenar por categoria y nombre
        lista.sort((a, b) => {
            const catA = (a.categoria || "otro").toLowerCase();
            const catB = (b.categoria || "otro").toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            return a.nombre.localeCompare(b.nombre);
        }).forEach((prod) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-center"><span class="fs-4">${obtenerEmoji(prod.categoria)}</span></td>
                <td class="fw-bold text-dark">${prod.nombre}</td>
                <td class="text-success fw-bold">S/ ${parseFloat(prod.precio).toFixed(2)}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-outline-warning btn-sm me-1" onclick="editarProducto('${prod.id}')">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="eliminarProducto('${prod.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tablaInventario.appendChild(tr);
        });
    }

    function obtenerEmoji(cat) {
        const emojis = {
            comida: "🍛", bebida: "🥤", pan: "🥖", galleta: "🍪", 
            keke: "🧁", postre: "🍮", dulce: "🍬", snack: "🍟", utiles: "✏️", otro: "📦"
        };
        return emojis[cat] || "📦";
    }

    function filtrarYRenderizar() {
        const texto = buscadorProductos ? buscadorProductos.value.toLowerCase().trim() : "";
        const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(texto));
        renderizarTabla(filtrados);
    }

    if (buscadorProductos) buscadorProductos.addEventListener("input", filtrarYRenderizar);

    formProducto.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nombre = inputNombre.value.trim();
        const precio = parseFloat(inputPrecio.value);
        const categoria = selectCategoria.value;

        if (!nombre || isNaN(precio) || !categoria) return;

        btnGuardar.disabled = true;
        btnGuardar.innerHTML = "⏳...";

        try {
            if (idEdicionActual) {
                await updateDoc(doc(db, "productos", idEdicionActual), { nombre, precio, categoria });
                salirModoEdicion();
            } else {
                await addDoc(collection(db, "productos"), { nombre, precio, categoria });
                formProducto.reset();
            }
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = idEdicionActual ? "Actualizar" : "Guardar";
        }
    });

    window.editarProducto = (id) => {
        const prod = productos.find(p => p.id === id);
        if (prod) {
            inputNombre.value = prod.nombre;
            inputPrecio.value = prod.precio;
            selectCategoria.value = prod.categoria;
            idEdicionActual = id;
            tituloFormulario.textContent = "Editar Producto";
            btnGuardar.textContent = "Actualizar";
            btnCancelarEdicion.classList.remove("d-none");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    btnCancelarEdicion.addEventListener("click", salirModoEdicion);

    function salirModoEdicion() {
        formProducto.reset();
        idEdicionActual = null;
        tituloFormulario.textContent = "Agregar Nuevo Producto o Comida";
        btnGuardar.textContent = "Guardar";
        btnCancelarEdicion.classList.add("d-none");
    }

    window.eliminarProducto = async (id) => {
        if (confirm("¿Eliminar de la nube?")) {
            await deleteDoc(doc(db, "productos", id));
        }
    };
});
