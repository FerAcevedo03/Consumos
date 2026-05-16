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
    
    // 1. FECHA Y SALUDO GRANDES EN EL PANEL
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

    // 2. CONTADORES DE TARJETAS
    const countProfesores = document.getElementById("count-profesores");
    const countAdministrativos = document.getElementById("count-administrativos");
    const countAlumnos = document.getElementById("count-alumnos");
    const countProductos = document.getElementById("count-productos");

    function escucharColeccion(col, elemento, formatoFn) {
        if (!elemento) return;
        onSnapshot(collection(db, col), (snap) => { 
            elemento.innerHTML = formatoFn(snap.size); 
        }, () => {
            elemento.innerHTML = `<i class="bi bi-wifi-off me-1"></i> Sin conexión`;
        });
    }

    escucharColeccion("profesores", countProfesores, (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} profesores registrados`);
    escucharColeccion("administrativos", countAdministrativos, (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} de personal registrado`);
    escucharColeccion("alumnos", countAlumnos, (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} alumnos registrados`);
    escucharColeccion("productos", countProductos, (n) => `<i class="bi bi-graph-up-arrow me-1"></i> Hay ${n} productos en catálogo`);

    // 3. BUSCADOR GLOBAL MODO DIOS
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
                if(doc.data().nombre) sacoPersonas.push({ nombre: doc.data().nombre, rol: col.id, icon: col.icon, color: col.color });
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

    // 4. LÓGICA FINANCIERA Y GRÁFICO
    const elDineroMes = document.getElementById("dineroMes");
    const elDeudaGlobal = document.getElementById("deudaGlobal");
    const feed = document.getElementById("feed-actividad");
    
    let logsConsumo = [];
    let logsPago = [];
    let logsSemanas = [];
    let miGrafico = null;

    onSnapshot(collection(db, "semanas_pagadas"), (snap) => { logsSemanas = snap.docs.map(d => d.data()); procesarTodo(); });
    onSnapshot(collection(db, "consumos"), (snap) => { logsConsumo = snap.docs.map(d => d.data()); procesarTodo(); });
    onSnapshot(collection(db, "pagos"), (snap) => { logsPago = snap.docs.map(d => d.data()); procesarTodo(); });

    function procesarTodo() {
        const hoy = new Date();
        const mesAct = hoy.getMonth();
        const anioAct = hoy.getFullYear();
        
        const recaudado = logsPago.filter(p => {
            const f = p.mesAplicado !== undefined ? parseInt(p.mesAplicado) : new Date(p.fecha + 'T00:00:00').getMonth();
            return f === mesAct;
        }).reduce((acc, curr) => acc + curr.monto, 0);
        
        if (elDineroMes) elDineroMes.textContent = `S/ ${recaudado.toFixed(2)}`;

        let deudaTotal = 0;
        logsConsumo.forEach(r => {
            const f = new Date(r.fecha + 'T00:00:00');
            const numSem = Math.ceil((f.getDate() + (new Date(f.getFullYear(), f.getMonth(), 1).getDay() === 0 ? 6 : new Date(f.getFullYear(), f.getMonth(), 1).getDay() - 1)) / 7);
            const idG = `${f.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()}_${numSem}`;
            const sDoc = logsSemanas.find(s => s.idGrupo === idG && s.nombreUsuario === r.nombreUsuario);
            if (!(sDoc && (!r.timestamp || r.timestamp <= sDoc.timestamp))) deudaTotal += r.precio;
        });
        const abonosTotales = logsPago.reduce((acc, p) => acc + p.monto, 0);
        const deudaFinal = deudaTotal - abonosTotales;
        if (elDeudaGlobal) elDeudaGlobal.textContent = `S/ ${(deudaFinal < 0 ? 0 : deudaFinal).toFixed(2)}`;

        if (feed) {
            const mix = [...logsConsumo.map(c => ({...c, tipo: 'c'})), ...logsPago.map(p => ({...p, tipo: 'p'}))]
                .sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15);
            
            feed.innerHTML = mix.map(item => {
                const isP = item.tipo === 'p';
                return `<div class="list-group-item d-flex justify-content-between align-items-center py-3 border-0 border-bottom mx-3 px-0 bg-transparent">
                    <div class="d-flex align-items-center">
                        <div class="rounded-circle d-flex justify-content-center align-items-center me-3 ${isP ? 'bg-success text-success' : 'bg-danger text-danger'} bg-opacity-10" style="width: 40px; height: 40px;">
                            <i class="bi ${isP ? 'bi-cash-coin' : 'bi-cart-check'}"></i>
                        </div>
                        <div class="lh-sm">
                            <p class="mb-0 fw-bold small text-body">${item.nombreUsuario}</p>
                            <small class="text-muted" style="font-size: 0.7rem;">${isP ? 'Abonó con ' + item.metodo : 'Consumió ' + item.productoNombre}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <p class="mb-0 fw-bold small ${isP ? 'text-success' : 'text-danger'}">${isP ? '+' : '-'} S/ ${(isP ? item.monto : item.precio).toFixed(2)}</p>
                    </div>
                </div>`;
            }).join("");
        }

        const ctxElement = document.getElementById('graficoDashboard');
        if (ctxElement) {
            const ctx = ctxElement.getContext('2d');
            const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const dataIngresos = new Array(12).fill(0);

            logsPago.forEach(p => {
                const f = new Date(p.fecha + 'T00:00:00');
                let mesDelPago = (p.mesAplicado !== undefined && p.mesAplicado !== "todos") ? parseInt(p.mesAplicado) : f.getMonth();
                if (f.getFullYear() === anioAct) {
                    dataIngresos[mesDelPago] += p.monto;
                }
            });

            const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
            const textColor = isDark ? '#e0e0e0' : '#6c757d';
            
            if (miGrafico) miGrafico.destroy();
            miGrafico = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ingresos',
                        data: dataIngresos,
                        backgroundColor: '#198754',
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, 
                            ticks: { color: textColor, font: { size: 10 } } 
                        },
                        x: { 
                            grid: { display: false }, 
                            ticks: { color: textColor, font: { size: 11, weight: 'bold' } } 
                        }
                    }
                }
            });
        }
    }
});