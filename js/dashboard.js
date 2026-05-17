import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

    const fechaActualEl = document.getElementById("fechaActual");
    if (fechaActualEl) {
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaString = new Date().toLocaleDateString('es-PE', opcionesFecha);
        fechaActualEl.innerHTML = `<i class="bi bi-calendar3 me-2"></i> Hoy es ${fechaString.charAt(0).toUpperCase() + fechaString.slice(1)}`;
    }

    const saludoUsuarioEl = document.getElementById("saludoUsuario");
    if (saludoUsuarioEl) {
        const hora = new Date().getHours();
        let saludo = "¡Buenas noches!";
        let icono = "bi-moon-stars-fill text-warning";

        if (hora >= 6 && hora < 12) {
            saludo = "¡Buenos días!";
            icono = "bi-brightness-alt-high-fill text-warning";
        } else if (hora >= 12 && hora < 19) {
            saludo = "¡Buenas tardes!";
            icono = "bi-sun-fill text-warning";
        }

        saludoUsuarioEl.innerHTML = `<i class="bi ${icono} me-2"></i>${saludo}, Bienvenido(a) de vuelta.`;
    }

    function escucharColeccion(col, elemento, formatoFn) {
        if (!elemento) return;
        onSnapshot(collection(db, col), (snap) => {
            elemento.innerHTML = formatoFn(snap.size);
        }, () => {
            elemento.innerHTML = `<i class="bi bi-wifi-off me-1"></i> Error`;
        });
    }

    escucharColeccion("profesores", document.getElementById("count-profesores"), (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} profesores registrados`);
    escucharColeccion("administrativos", document.getElementById("count-administrativos"), (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} de personal registrado`);
    escucharColeccion("alumnos", document.getElementById("count-alumnos"), (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} alumnos registrados`);
    escucharColeccion("productos", document.getElementById("count-productos"), (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} productos en catálogo`);

    const buscadorGlobal = document.getElementById("buscadorGlobal");
    const listaResultadosGlobal = document.getElementById("listaResultadosGlobal");
    let sacoPersonas = [];

    const colecciones = [
        { id: 'alumnos', icon: 'bi-mortarboard-fill', color: 'text-warning' },
        { id: 'profesores', icon: 'bi-person-workspace', color: 'text-primary' },
        { id: 'administrativos', icon: 'bi-person-badge-fill', color: 'text-success' }
    ];

    colecciones.forEach(col => {
        onSnapshot(collection(db, col.id), (snap) => {
            sacoPersonas = sacoPersonas.filter(p => p.rol !== col.id);
            snap.forEach(doc => {
                if (doc.data().nombre) sacoPersonas.push({ nombre: doc.data().nombre, rol: col.id, icon: col.icon, color: col.color });
            });
            sacoPersonas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        });
    });

    if (buscadorGlobal && listaResultadosGlobal) {
        document.addEventListener("click", (e) => {
            if (!buscadorGlobal.contains(e.target) && !listaResultadosGlobal.contains(e.target)) listaResultadosGlobal.style.display = "none";
        });

        buscadorGlobal.addEventListener("input", () => {
            const txt = buscadorGlobal.value.toLowerCase().trim();
            listaResultadosGlobal.innerHTML = "";
            if (txt.length === 0) { listaResultadosGlobal.style.display = "none"; return; }
            const f = sacoPersonas.filter(p => p.nombre.toLowerCase().includes(txt)).slice(0, 8);
            if (f.length > 0) {
                listaResultadosGlobal.style.display = "block";
                f.forEach(p => {
                    const li = document.createElement("li");
                    li.innerHTML = `<a class="dropdown-item d-flex align-items-center py-2" href="consumo.html?nombre=${encodeURIComponent(p.nombre)}&rol=${p.rol}"><i class="bi ${p.icon} ${p.color} me-3 fs-5"></i><div><p class="mb-0 fw-bold text-white">${p.nombre}</p><small class="text-white-50 text-uppercase">${p.rol}</small></div></a>`;
                    listaResultadosGlobal.appendChild(li);
                });
            } else {
                listaResultadosGlobal.style.display = "block";
                listaResultadosGlobal.innerHTML = '<li class="px-3 py-3 text-white-50 small text-center"><i class="bi bi-search d-block fs-3 mb-2"></i>No se encontró a nadie con ese nombre</li>';
            }
        });
    }

    const btnBoveda = document.getElementById("btnBoveda");
    if (btnBoveda) {
        btnBoveda.addEventListener("click", async (e) => {
            e.preventDefault();

            const { value: password } = await Swal.fire({
                title: 'Acceso Restringido',
                text: 'Ingresa la contraseña maestra para ver las finanzas.',
                input: 'password',
                inputPlaceholder: 'Contraseña',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                showCancelButton: true,
                confirmButtonColor: '#198754',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="bi bi-unlock-fill me-1"></i> Desbloquear',
                cancelButtonText: 'Cancelar'
            });

            if (password) {
                if (password === '75992939') {
                    window.location.href = 'finanzas.html';
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Acceso Denegado',
                        text: 'La contraseña es incorrecta.',
                        confirmButtonColor: '#dc3545'
                    });
                }
            }
        });
    }

    const navbar = document.getElementById("main-navbar");
    let ultimoScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (navbar) {
        window.addEventListener("scroll", () => {
            let scrollActual = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollActual > ultimoScroll && scrollActual > 60) {
                navbar.style.top = `-${navbar.offsetHeight}px`;
            }
            else {
                navbar.style.top = "0";
            }
            ultimoScroll = scrollActual <= 0 ? 0 : scrollActual;
        });
    }
});