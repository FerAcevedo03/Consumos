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
    
    // MODO PRIVACIDAD
    let modoPrivado = localStorage.getItem("modoPrivado") === "true";
    const btnPrivacidad = document.getElementById("btnPrivacidad");
    const contenedorGrafico = document.getElementById("contenedorGrafico");
    
    function actualizarVistaPrivacidad() {
        if (!btnPrivacidad) return;
        if (modoPrivado) {
            btnPrivacidad.innerHTML = '<i class="bi bi-eye-fill me-2"></i>Mostrar Saldos';
            btnPrivacidad.classList.replace("btn-outline-secondary", "btn-primary");
            if (contenedorGrafico) contenedorGrafico.style.filter = "blur(8px)";
        } else {
            btnPrivacidad.innerHTML = '<i class="bi bi-eye-slash-fill me-2"></i>Ocultar Saldos';
            btnPrivacidad.classList.replace("btn-primary", "btn-outline-secondary");
            if (contenedorGrafico) contenedorGrafico.style.filter = "none";
        }
        procesarFinanzas();
    }

    if (btnPrivacidad) {
        btnPrivacidad.addEventListener("click", () => {
            modoPrivado = !modoPrivado;
            localStorage.setItem("modoPrivado", modoPrivado);
            actualizarVistaPrivacidad();
        });
    }

    let usuariosPorColeccion = { alumnos: {}, profesores: {}, administrativos: {} };
    let diccionarioUsuarios = {};
    
    const colecciones = [
        { id: 'alumnos' },
        { id: 'profesores' },
        { id: 'administrativos' }
    ];

    colecciones.forEach(col => {
        onSnapshot(collection(db, col.id), (snap) => {
            usuariosPorColeccion[col.id] = {}; 
            snap.forEach(doc => {
                if(doc.data().nombre) {
                    usuariosPorColeccion[col.id][doc.data().nombre] = col.id;
                }
            });
            diccionarioUsuarios = { ...usuariosPorColeccion.alumnos, ...usuariosPorColeccion.profesores, ...usuariosPorColeccion.administrativos };
            procesarFinanzas(); 
        });
    });

    const elDineroMes = document.getElementById("dineroMes");
    const elDeudaGlobal = document.getElementById("deudaGlobal");
    
    const listaAlumnos = document.getElementById("listaDeudoresAlumnos");
    const listaProfesores = document.getElementById("listaDeudoresProfesores");
    const listaPersonal = document.getElementById("listaDeudoresPersonal");

    // Etiquetas de subtotales
    const subtotalAlumnos = document.getElementById("subtotalAlumnos");
    const subtotalProfesores = document.getElementById("subtotalProfesores");
    const subtotalPersonal = document.getElementById("subtotalPersonal");
    
    let logsConsumo = [];
    let logsPago = [];
    let logsSemanas = [];
    let miGrafico = null;

    onSnapshot(collection(db, "semanas_pagadas"), (snap) => { logsSemanas = snap.docs.map(d => d.data()); procesarFinanzas(); });
    onSnapshot(collection(db, "consumos"), (snap) => { logsConsumo = snap.docs.map(d => d.data()); procesarFinanzas(); });
    onSnapshot(collection(db, "pagos"), (snap) => { logsPago = snap.docs.map(d => d.data()); procesarFinanzas(); });

    function procesarFinanzas() {
        const hoy = new Date();
        const mesAct = hoy.getMonth();
        const anioAct = hoy.getFullYear();
        
        const recaudado = logsPago.filter(p => {
            const f = p.mesAplicado !== undefined ? parseInt(p.mesAplicado) : new Date(p.fecha + 'T00:00:00').getMonth();
            return f === mesAct;
        }).reduce((acc, curr) => acc + curr.monto, 0);
        
        if (elDineroMes) elDineroMes.textContent = modoPrivado ? "S/ ***.**" : `S/ ${recaudado.toFixed(2)}`;

        let deudaTotalGlobal = 0;
        let deudaPorUsuario = {};

        logsConsumo.forEach(r => {
            const f = new Date(r.fecha + 'T00:00:00');
            const numSem = Math.ceil((f.getDate() + (new Date(f.getFullYear(), f.getMonth(), 1).getDay() === 0 ? 6 : new Date(f.getFullYear(), f.getMonth(), 1).getDay() - 1)) / 7);
            const idG = `${f.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase()}_${numSem}`;
            const sDoc = logsSemanas.find(s => s.idGrupo === idG && s.nombreUsuario === r.nombreUsuario);
            
            if (!(sDoc && (!r.timestamp || r.timestamp <= sDoc.timestamp))) {
                if (diccionarioUsuarios[r.nombreUsuario]) {
                    deudaTotalGlobal += r.precio;
                    if (!deudaPorUsuario[r.nombreUsuario]) deudaPorUsuario[r.nombreUsuario] = 0;
                    deudaPorUsuario[r.nombreUsuario] += r.precio;
                }
            }
        });

        logsPago.forEach(p => {
            if (deudaPorUsuario[p.nombreUsuario] !== undefined) {
                deudaPorUsuario[p.nombreUsuario] -= p.monto;
                deudaTotalGlobal -= p.monto;
            }
        });

        if (elDeudaGlobal) elDeudaGlobal.textContent = modoPrivado ? "S/ ***.**" : `S/ ${(deudaTotalGlobal < 0 ? 0 : deudaTotalGlobal).toFixed(2)}`;

        if (listaAlumnos && listaProfesores && listaPersonal) {
            
            let todosLosDeudores = Object.keys(deudaPorUsuario).map(nombre => {
                let rolReal = diccionarioUsuarios[nombre];
                if (!rolReal) return null; 
                return { nombre: nombre, deuda: deudaPorUsuario[nombre], rol: rolReal };
            }).filter(user => user !== null && user.deuda > 0.01); 

            // Función para renderizar lista Y calcular el subtotal
            const renderizarLista = (arreglo, elementoHTML, elementoSubtotal, colorFondo) => {
                elementoHTML.innerHTML = "";
                
                // Calculamos el subtotal de este grupo
                const subtotalDinero = arreglo.reduce((acc, u) => acc + u.deuda, 0);
                if (elementoSubtotal) {
                    elementoSubtotal.textContent = modoPrivado ? 'S/ ***.**' : `S/ ${subtotalDinero.toFixed(2)}`;
                }

                if (arreglo.length === 0) {
                    elementoHTML.innerHTML = `
                    <li class="list-group-item text-center py-4 text-muted bg-transparent border-0 d-flex flex-column align-items-center">
                        <div class="rounded-circle d-flex justify-content-center align-items-center mb-2" style="width: 45px; height: 45px; background-color: ${colorFondo};">
                            <i class="bi bi-check2 text-success fs-3"></i>
                        </div>
                        <span class="small fw-medium">Sin deudas aquí</span>
                    </li>`;
                    return;
                }

                arreglo.sort((a, b) => b.deuda - a.deuda);

                arreglo.forEach((user) => {
                    const montoVisual = modoPrivado ? '***.**' : user.deuda.toFixed(2);
                    // Ahora la fila entera es clickeable para ir a cobrar (Cursor Pointer y Onclick)
                    elementoHTML.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 border-bottom bg-transparent" 
                        style="transition: background-color 0.2s; cursor: pointer;" 
                        onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" 
                        onmouseout="this.style.backgroundColor='transparent'"
                        onclick="window.location.href='consumo.html?nombre=${encodeURIComponent(user.nombre)}&rol=${user.rol}'"
                        title="Ir a la cuenta de ${user.nombre}">
                        <div class="d-flex align-items-center overflow-hidden">
                            <span class="fw-bold text-body-emphasis text-truncate me-2" style="font-size: 0.95rem;">${user.nombre}</span>
                        </div>
                        <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill shadow-sm px-2 py-1 flex-shrink-0">
                            S/ ${montoVisual}
                        </span>
                    </li>`;
                });
            };

            const alumnos = todosLosDeudores.filter(u => u.rol === 'alumnos');
            const profes = todosLosDeudores.filter(u => u.rol === 'profesores');
            const personal = todosLosDeudores.filter(u => u.rol === 'administrativos');

            renderizarLista(alumnos, listaAlumnos, subtotalAlumnos, 'rgba(25, 135, 84, 0.1)');
            renderizarLista(profes, listaProfesores, subtotalProfesores, 'rgba(25, 135, 84, 0.1)');
            renderizarLista(personal, listaPersonal, subtotalPersonal, 'rgba(25, 135, 84, 0.1)');
        }

        const ctxElement = document.getElementById('graficoDashboard');
        if (ctxElement) {
            const ctx = ctxElement.getContext('2d');
            const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const dataIngresos = new Array(12).fill(0);

            logsPago.forEach(p => {
                const f = new Date(p.fecha + 'T00:00:00');
                let mesDelPago = (p.mesAplicado !== undefined && p.mesAplicado !== "todos") ? parseInt(p.mesAplicado) : f.getMonth();
                if (f.getFullYear() === anioAct) dataIngresos[mesDelPago] += p.monto;
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
                        y: { beginAtZero: true, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: textColor, font: { size: 9 } } },
                        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10, weight: 'bold' } } }
                    }
                }
            });
        }
    }
    
    actualizarVistaPrivacidad();
});