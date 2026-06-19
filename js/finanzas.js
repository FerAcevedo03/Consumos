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

    // BUSCADOR EN TIEMPO REAL
    let filtroBoveda = "";
    const buscadorBoveda = document.getElementById("buscadorBoveda");
    if (buscadorBoveda) {
        buscadorBoveda.addEventListener("input", (e) => {
            filtroBoveda = e.target.value.toLowerCase().trim();
            procesarFinanzas(); // Recargar las listas visualmente
        });
    }

    // DICCIONARIO DE ROLES
    let usuariosPorColeccion = { alumnos: {}, profesores: {}, administrativos: {} };
    let diccionarioUsuarios = {};
    
    const colecciones = ['alumnos', 'profesores', 'administrativos'];

    colecciones.forEach(col => {
        onSnapshot(collection(db, col), (snap) => {
            usuariosPorColeccion[col] = {}; 
            snap.forEach(doc => {
                if(doc.data().nombre) {
                    usuariosPorColeccion[col][doc.data().nombre] = col;
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

    const subtotalAlumnos = document.getElementById("subtotalAlumnos");
    const subtotalProfesores = document.getElementById("subtotalProfesores");
    const subtotalPersonal = document.getElementById("subtotalPersonal");
    
    let logsConsumo = [];
    let logsPago = [];
    let miGrafico = null;

    onSnapshot(collection(db, "consumos"), (snap) => { logsConsumo = snap.docs.map(d => d.data()); procesarFinanzas(); });
    onSnapshot(collection(db, "pagos"), (snap) => { logsPago = snap.docs.map(d => d.data()); procesarFinanzas(); });

    function procesarFinanzas() {
        const hoy = new Date();
        const mesAct = hoy.getMonth();
        const anioAct = hoy.getFullYear();

        // LISTA NEGRA
        const usuariosFantasmas = ["franco", "franco vasquez"]; 

        const consumosValidos = logsConsumo.filter(c => {
            const nom = (c.nombreUsuario || "").toLowerCase().trim();
            return !usuariosFantasmas.includes(nom);
        });

        const pagosValidos = logsPago.filter(p => {
            const nom = (p.nombreUsuario || "").toLowerCase().trim();
            return !usuariosFantasmas.includes(nom);
        });
        
        // 1. Ingresos Mensuales
        const recaudado = pagosValidos.filter(p => {
            const f = p.mesAplicado !== undefined && p.mesAplicado !== "todos" ? parseInt(p.mesAplicado) : new Date(p.fecha + 'T00:00:00').getMonth();
            return f === mesAct && new Date(p.fecha + 'T00:00:00').getFullYear() === anioAct;
        }).reduce((acc, curr) => acc + curr.monto, 0);
        
        if (elDineroMes) elDineroMes.textContent = modoPrivado ? "S/ ***.**" : `S/ ${recaudado.toFixed(2)}`;

        // 2. MATEMÁTICA CONTABLE
        let deudaPorUsuario = {};

        consumosValidos.forEach(r => {
            if (!deudaPorUsuario[r.nombreUsuario]) deudaPorUsuario[r.nombreUsuario] = 0;
            deudaPorUsuario[r.nombreUsuario] += r.precio;
        });

        pagosValidos.forEach(p => {
            if (!deudaPorUsuario[p.nombreUsuario]) deudaPorUsuario[p.nombreUsuario] = 0;
            deudaPorUsuario[p.nombreUsuario] -= p.monto;
        });

        let deudaTotalReal = 0;
        Object.values(deudaPorUsuario).forEach(deuda => {
            if (deuda > 0.01) {
                deudaTotalReal += deuda;
            }
        });

        if (elDeudaGlobal) elDeudaGlobal.textContent = modoPrivado ? "S/ ***.**" : `S/ ${deudaTotalReal.toFixed(2)}`;

        // 3. RENDERIZAR LISTAS
        if (listaAlumnos && listaProfesores && listaPersonal) {
            
            let todosLosNombres = new Set([
                ...Object.keys(diccionarioUsuarios),
                ...Object.keys(deudaPorUsuario)
            ]);

            let todosLosDeudores = Array.from(todosLosNombres).map(nombre => {
                let rolReal = diccionarioUsuarios[nombre] || 'alumnos'; 
                let saldoReal = deudaPorUsuario[nombre] || 0;
                return { nombre: nombre, deuda: saldoReal, rol: rolReal };
            }).filter(user => !usuariosFantasmas.includes(user.nombre.toLowerCase().trim()));

            // A) Calcular subtotales ANTES de aplicar el filtro del buscador
            const totalAlumnos = todosLosDeudores.filter(u => u.rol === 'alumnos').reduce((acc, u) => acc + (u.deuda > 0.01 ? u.deuda : 0), 0);
            const totalProfesores = todosLosDeudores.filter(u => u.rol === 'profesores').reduce((acc, u) => acc + (u.deuda > 0.01 ? u.deuda : 0), 0);
            const totalPersonal = todosLosDeudores.filter(u => u.rol === 'administrativos').reduce((acc, u) => acc + (u.deuda > 0.01 ? u.deuda : 0), 0);

            if (subtotalAlumnos) subtotalAlumnos.textContent = modoPrivado ? 'S/ ***.**' : `S/ ${totalAlumnos.toFixed(2)}`;
            if (subtotalProfesores) subtotalProfesores.textContent = modoPrivado ? 'S/ ***.**' : `S/ ${totalProfesores.toFixed(2)}`;
            if (subtotalPersonal) subtotalPersonal.textContent = modoPrivado ? 'S/ ***.**' : `S/ ${totalPersonal.toFixed(2)}`;

            // B) Aplicar el Filtro de Búsqueda si se está escribiendo
            let deudoresParaMostrar = todosLosDeudores;
            if (filtroBoveda !== "") {
                deudoresParaMostrar = deudoresParaMostrar.filter(u => u.nombre.toLowerCase().includes(filtroBoveda));
            }

            const renderizarLista = (arreglo, elementoHTML) => {
                elementoHTML.innerHTML = "";
                
                if (arreglo.length === 0) {
                    elementoHTML.innerHTML = `
                    <li class="list-group-item text-center py-4 text-muted bg-transparent border-0 d-flex flex-column align-items-center">
                        <i class="bi bi-search text-muted fs-3 mb-2 opacity-50"></i>
                        <span class="small fw-medium">No se encontraron resultados</span>
                    </li>`;
                    return;
                }

                arreglo.sort((a, b) => {
                    if (a.deuda > 0.01 && b.deuda > 0.01) return b.deuda - a.deuda;
                    if (a.deuda > 0.01) return -1;
                    if (b.deuda > 0.01) return 1;
                    return a.nombre.localeCompare(b.nombre, 'es');
                });

                arreglo.forEach((user) => {
                    const tieneDeuda = user.deuda > 0.01;
                    const montoVisual = modoPrivado ? '***.**' : Math.abs(user.deuda).toFixed(2);
                    
                    let etiquetaFinanciera = "";
                    if (tieneDeuda) {
                        etiquetaFinanciera = `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill shadow-sm px-2 py-1 flex-shrink-0" style="font-size: 0.75rem;">S/ ${montoVisual}</span>`;
                    } else if (user.deuda < -0.01) {
                        etiquetaFinanciera = `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill shadow-sm px-2 py-1 flex-shrink-0" style="font-size: 0.75rem;">Favor: S/ ${montoVisual}</span>`;
                    } else {
                        etiquetaFinanciera = `<span class="badge bg-light text-muted border rounded-pill shadow-sm px-2 py-1 flex-shrink-0" style="font-size: 0.70rem;">Al día</span>`;
                    }

                    // AHORA TIENE px-3 y py-2 PARA HACER LA FILA MÁS COMPACTA Y SIN SCROLL EXCESIVO
                    elementoHTML.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-transparent" 
                        style="transition: background-color 0.2s; cursor: pointer;" 
                        onmouseover="this.style.backgroundColor='rgba(255,255,255,0.05)'" 
                        onmouseout="this.style.backgroundColor='transparent'"
                        onclick="window.location.href='consumo.html?nombre=${encodeURIComponent(user.nombre)}&rol=${user.rol}'"
                        title="Ir a la cuenta de ${user.nombre}">
                        <div class="d-flex align-items-center overflow-hidden">
                            <span class="fw-bold text-body-emphasis text-truncate me-2" style="font-size: 0.85rem; opacity: ${tieneDeuda ? '1' : '0.6'};">${user.nombre}</span>
                        </div>
                        ${etiquetaFinanciera}
                    </li>`;
                });
            };

            const alumnos = deudoresParaMostrar.filter(u => u.rol === 'alumnos');
            const profes = deudoresParaMostrar.filter(u => u.rol === 'profesores');
            const personal = deudoresParaMostrar.filter(u => u.rol === 'administrativos');

            renderizarLista(alumnos, listaAlumnos);
            renderizarLista(profes, listaProfesores);
            renderizarLista(personal, listaPersonal);
        }

        // 4. Gráfico Anual
        const ctxElement = document.getElementById('graficoDashboard');
        if (ctxElement) {
            const ctx = ctxElement.getContext('2d');
            const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const dataIngresos = new Array(12).fill(0);

            pagosValidos.forEach(p => {
                const f = new Date(p.fecha + 'T00:00:00');
                let mesDelPago = p.mesAplicado !== undefined && p.mesAplicado !== "todos" ? parseInt(p.mesAplicado) : f.getMonth();
                if (f.getFullYear() === anioAct) dataIngresos[mesDelPago] += p.monto;
            });

            const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
            const textColor = isDark ? '#e0e0e0' : '#6c757d';
            
            if (miGrafico) { miGrafico.destroy(); }
            
            miGrafico = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ingresos S/',
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