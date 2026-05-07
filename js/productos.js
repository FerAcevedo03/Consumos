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
    const formProducto = document.getElementById("formProducto");
    const inputNombre = document.getElementById("nombreProducto");
    const inputPrecio = document.getElementById("precioProducto");
    const selectCategoria = document.getElementById("categoriaProducto");
    const tablaInventario = document.getElementById("tablaInventario");
    const buscadorProductos = document.getElementById("buscadorProductos");

    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
    const tituloFormulario = document.getElementById("tituloFormulario");

    let productos = [];
    let idEdicionActual = null; // Variable para saber si estamos editando o creando nuevo

    // --- LECTURA EN TIEMPO REAL DESDE FIREBASE ---
    onSnapshot(collection(db, "productos"), (snapshot) => {
        productos = [];
        snapshot.forEach((doc) => {
            productos.push({ id: doc.id, ...doc.data() });
        });

        // **VITAL:** Guardamos una copia en el localStorage de la PC/Celular actual 
        // para que la página de consumos sepa qué cobrar sin tener que buscar en internet.
        localStorage.setItem("base_productos", JSON.stringify(productos));

        // Aplicamos el buscador si hay texto escrito
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
                <td class="text-center">
                    <button class="btn btn-outline-warning btn-sm me-2" onclick="editarProducto('${prod.id}')" title="Editar">
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

    function obtenerEmoji(cat) {
        if (cat === "menu" || cat === "comida") return "🍲";
        if (cat === "bebida") return "🧃";
        return "🍞";
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
                // Modo Edición: Actualizar en Firebase
                await updateDoc(doc(db, "productos", idEdicionActual), {
                    nombre: nombre,
                    precio: precio,
                    categoria: categoria
                });
                salirModoEdicion();
            } else {
                // Modo Creación: Añadir nuevo a Firebase
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
            selectCategoria.value = prod.categoria || "snack";

            idEdicionActual = idFirebase;

            tituloFormulario.textContent = "Editar Producto";
            btnGuardar.textContent = "Actualizar";
            btnGuardar.classList.replace("btn-info", "btn-warning"); // Cambia de color para que sea evidente
            btnGuardar.style.backgroundColor = "#ffc107";
            btnCancelarEdicion.classList.remove("d-none");

            inputNombre.focus();
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube la pantalla al formulario
        }
    };

    btnCancelarEdicion.addEventListener("click", salirModoEdicion);

    function salirModoEdicion() {
        formProducto.reset();
        idEdicionActual = null;
        tituloFormulario.textContent = "Agregar Nuevo Producto o Comida";
        btnGuardar.textContent = "Guardar";
        btnGuardar.style.backgroundColor = "#00bcd4";
        btnCancelarEdicion.classList.add("d-none");
    }

    // --- ELIMINAR PRODUCTO ---
    window.eliminarProducto = async (idFirebase) => {
        if (confirm("¿Estás seguro de eliminar este producto del inventario de la nube?")) {
            try {
                await deleteDoc(doc(db, "productos", idFirebase));
                if (idEdicionActual === idFirebase) salirModoEdicion(); // Si borra lo que estaba editando
            } catch (error) {
                alert("Error al eliminar: " + error.message);
            }
        }
    };
});