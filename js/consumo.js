import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, doc, updateDoc, deleteDoc, onSnapshot, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

let firebaseConfig = {
    apiKey: "AIzaSyBuXHMvdHZbJLoo-SakENFEcUvlECJvTRA",
    authDomain: "quiosco-nobel-school.firebaseapp.com",
    projectId: "quiosco-nobel-school",
    storageBucket: "quiosco-nobel-school.firebasestorage.app",
    messagingSenderId: "448413136914",
    appId: "1:448413136914:web:426e8fc48a8e24ea96c0cb"
};

let app = initializeApp(firebaseConfig);
let db = getFirestore(app);

// CORRECCIÓN MATEMÁTICA RESTAURADA (La tuya original exacta)
function obtenerDatosSemana(fechaString) {
    let f = new Date(fechaString + 'T00:00:00');

    if (tipoCuentaActiva === 'semanal') {
        let lunes = new Date(f);
        lunes.setDate(f.getDate() - ((f.getDay() + 6) % 7));
        return {
            mesEfectivo: lunes.getMonth(),
            anioEfectivo: lunes.getFullYear(),
            nombreMes: lunes.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase(),
            numSemana: Math.ceil(lunes.getDate() / 7)
        };
    }

    let mesEfectivo = f.getMonth();
    let anioEfectivo = f.getFullYear();
    let nombreMes = f.toLocaleDateString('es-PE', { month: 'long' }).toUpperCase();
    let primerDia = new Date(anioEfectivo, mesEfectivo, 1);
    let offset = (primerDia.getDay() + 6) % 7;
    let numSemana = Math.floor((f.getDate() - 1 + offset) / 7) + 1;

    return { mesEfectivo, anioEfectivo, nombreMes, numSemana };
}

let tipoCuentaActiva = 'semanal';
let idDocumentoUsuario = null;

function getGroupData(fechaStr, mesVal) {
    let d = obtenerDatosSemana(fechaStr);
    let idGrupo = "";
    let textoCabecera = "";

    if (tipoCuentaActiva === 'mensual') {
        idGrupo = `${d.nombreMes}_COMPLETO`;
        textoCabecera = mesVal === "todos" ? `MES DE ${d.nombreMes}` : `TODO EL MES DE ${d.nombreMes}`;
    } else if (tipoCuentaActiva === 'diaria') {
        let fObj = new Date(fechaStr + 'T00:00:00');
        let diaStr = fObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
        idGrupo = `DIA_${fechaStr}`;
        textoCabecera = diaStr.toUpperCase();
    } else {
        idGrupo = `${d.nombreMes}_${d.numSemana}`;
        textoCabecera = mesVal === "todos" ? `${d.nombreMes} - SEMANA 0${d.numSemana}` : `SEMANA 0${d.numSemana}`;
    }
    return { idGrupo, textoCabecera, numSemana: d.numSemana, nombreMes: d.nombreMes };
}

let iconosVisuales = {
    "comida": "🍛", "bebida": "🥤", "pan": "🥖", "galleta": "🍪", "keke": "🧁",
    "postre": "🍮", "dulce": "🍬", "snack": "🍟", "utiles": "✏️", "otro": "📦"
};

function obtenerVisual(catReal, nombreProd) {
    let c = catReal ? catReal.toLowerCase() : 'otro';
    if (!iconosVisuales[c]) {
        c = 'otro';
        let n = nombreProd.toLowerCase();
        if (n.includes('arroz') || n.includes('pollo') || n.includes('tallarin') || n.includes('aji')) c = 'comida';
        else if (n.includes('agua') || n.includes('jugo') || n.includes('frugos')) c = 'bebida';
        else if (n.includes('pan') || n.includes('empanada')) c = 'pan';
        else if (n.includes('galleta') || n.includes('morochas') || n.includes('picaras')) c = 'galleta';
        else if (n.includes('chupetin') || n.includes('caramelo') || n.includes('sublime')) c = 'dulce';
    }
    return { emoji: iconosVisuales[c] || "📦" };
}

document.addEventListener("DOMContentLoaded", () => {
    let params = new URLSearchParams(window.location.search);
    let nombreUsuario = params.get("nombre") || "Usuario Desconocido";
    let rolUsuario = params.get("rol") || "index";

    let nombrePersonaEl = document.getElementById("nombrePersona");
    let etiquetaRolEl = document.getElementById("etiquetaRol");
    let avatarFondoEl = document.getElementById("avatarFondo");

    if (nombrePersonaEl) nombrePersonaEl.textContent = nombreUsuario;
    if (rolUsuario === "profesores") { if (etiquetaRolEl) etiquetaRolEl.textContent = "Profesor"; }
    else if (rolUsuario === "alumnos") { if (etiquetaRolEl) etiquetaRolEl.textContent = "Alumno"; }
    else if (rolUsuario === "administrativos") { if (etiquetaRolEl) etiquetaRolEl.textContent = "Administrativo"; }
    else { if (etiquetaRolEl) etiquetaRolEl.textContent = "Personal"; }

    if (avatarFondoEl) {
        let coloresAvatar = ['#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1e88e5', '#039be5', '#0097a7', '#00897b', '#43a047', '#689f38', '#ef6c00', '#e65100', '#f4511e'];
        let sumaLetras = 0;
        for (let i = 0; i < nombreUsuario.length; i++) {
            sumaLetras += nombreUsuario.charCodeAt(i);
        }
        let colorAsignado = coloresAvatar[sumaLetras % coloresAvatar.length];
        let inicial = nombreUsuario.charAt(0).toUpperCase();
        avatarFondoEl.style.backgroundColor = colorAsignado;
        avatarFondoEl.innerHTML = `<span class="fw-bold text-white shadow-sm" style="font-size: 1.1rem; line-height: 1; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${inicial}</span>`;
    }

    const TIPOS_CUENTA = {
        diaria: { label: 'Diaria', icono: 'bi-calendar-day', desc: 'Cada día se cobra por separado.', color: '#f59e0b' },
        semanal: { label: 'Semanal', icono: 'bi-calendar-week', desc: 'Semanas naturales del mes.', color: '#0d6efd' },
        mensual: { label: 'Mensual', icono: 'bi-calendar-month', desc: 'Un solo cobro por mes.', color: '#198754' }
    };

    function actualizarChipTipoCuenta() {
        let btn = document.getElementById("btnTipoCuenta");
        let t = TIPOS_CUENTA[tipoCuentaActiva] || TIPOS_CUENTA.semanal;
        if (btn) {
            btn.innerHTML = `<i class="bi ${t.icono}"></i> <span id="txtTipoCuenta" class="d-none d-sm-inline ms-1">${t.label}</span>`;
            btn.style.backgroundColor = t.color;
            btn.style.borderColor = t.color;
            btn.className = "btn text-white fw-bold shadow-sm px-3 rounded-pill d-flex align-items-center gap-1 hover-lift";
        }
    }

    async function abrirSelectorTipoCuenta() {
        let elegido = tipoCuentaActiva;

        let tarjetas = Object.keys(TIPOS_CUENTA).map(key => {
            let t = TIPOS_CUENTA[key];
            return `
                <div class="tipo-card ${key === elegido ? 'selected' : ''}" data-tipo="${key}" style="--c: ${t.color};">
                    <div class="tipo-icon"><i class="bi ${t.icono}"></i></div>
                    <div class="text-start">
                        <div class="tipo-title">${t.label}</div>
                        <div class="tipo-desc">${t.desc}</div>
                    </div>
                </div>`;
        }).join('');

        const { value: tipoSeleccionado } = await Swal.fire({
            title: '<h4 class="fw-bold mb-0">Tipo de cuenta</h4>',
            html: `
                <p class="text-muted mb-4">¿Cómo se le cobra a <b>${nombreUsuario}</b>?</p>
                <div class="d-flex flex-column gap-3">${tarjetas}</div>
                <style>
                    .tipo-card { display: flex; align-items: center; gap: 16px; padding: 16px 18px; border: 2px solid var(--bs-border-color); border-radius: 16px; cursor: pointer; transition: all .2s; color: var(--bs-body-color); }
                    .tipo-card:hover { border-color: var(--c); transform: translateY(-2px); }
                    .tipo-card .tipo-icon { width: 52px; height: 52px; flex-shrink: 0; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; color: var(--c); background: color-mix(in srgb, var(--c) 15%, transparent); }
                    .tipo-card .tipo-title { font-weight: 800; font-size: 1.2rem; line-height: 1.2; }
                    .tipo-card .tipo-desc { font-size: .85rem; opacity: .75; margin-top: 2px; }
                    .tipo-card.selected { background: var(--c); border-color: var(--c); color: #fff; box-shadow: 0 6px 18px color-mix(in srgb, var(--c) 40%, transparent); }
                    .tipo-card.selected .tipo-icon { background: rgba(255,255,255,.22); color: #fff; }
                </style>
            `,
            width: 520,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-save me-1"></i> Guardar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'rounded-4 py-4',
                confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white',
                cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white'
            },
            didOpen: () => {
                let cards = document.querySelectorAll('.tipo-card');
                cards.forEach(card => {
                    card.addEventListener('click', () => {
                        cards.forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        elegido = card.getAttribute('data-tipo');
                    });
                });
            },
            preConfirm: () => elegido
        });

        if (tipoSeleccionado && tipoSeleccionado !== tipoCuentaActiva && idDocumentoUsuario) {
            try {
                await updateDoc(doc(db, rolUsuario, idDocumentoUsuario), { tipoCuenta: tipoSeleccionado });
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Tipo de cuenta actualizado', showConfirmButton: false, timer: 2000 });
            } catch (e) {
                Swal.fire('Error', e.message, 'error');
            }
        }
    }

    let btnTipoCuenta = document.getElementById("btnTipoCuenta");
    if (btnTipoCuenta) {
        btnTipoCuenta.addEventListener("click", abrirSelectorTipoCuenta);
    }

    if (rolUsuario !== "index") {
        onSnapshot(query(collection(db, rolUsuario), where("nombre", "==", nombreUsuario)), (snap) => {
            if (!snap.empty) {
                let docUser = snap.docs[0];
                idDocumentoUsuario = docUser.id;
                tipoCuentaActiva = docUser.data().tipoCuenta || 'semanal';
                actualizarChipTipoCuenta();
                renderizarConsumos();
                recalcularSaldoGlobal();
            }
        });
    }

    let btnVolver = document.getElementById("btnVolver");
    if (btnVolver) btnVolver.onclick = () => window.location.href = `${rolUsuario}.html`;

    let inputProducto = document.getElementById("inputProducto");
    let inputCantidad = document.getElementById("inputCantidad");
    let listaSugerencias = document.getElementById("listaSugerencias");
    let fechaConsumo = document.getElementById("fechaConsumo");
    let formConsumo = document.getElementById("formConsumo");
    let tablaConsumos = document.getElementById("tablaConsumos");
    let totalAcumulado = document.getElementById("totalAcumulado");

    let mesFiltro = document.getElementById("mesFiltro");
    let textoMesVisual = document.getElementById("textoMesVisual");
    let listaMesesUI = document.getElementById("listaMesesUI");

    let inputBusquedaTabla = document.getElementById("inputBusquedaTabla");
    let estadoCuentaMesVisual = document.getElementById("estadoCuentaMesVisual");
    let btnMarcarMesPagado = document.getElementById("btnMarcarMesPagado");

    let montoAbono = document.getElementById("montoAbono");
    let fechaAbono = document.getElementById("fechaAbono");
    let inputPagador = document.getElementById("inputPagador");
    let btnAbonoYape = document.getElementById("btnAbonoYape");
    let btnAbonoEfectivo = document.getElementById("btnAbonoEfectivo");

    let contenedorHistorialPagos = document.getElementById("contenedorHistorialPagos");
    let listaPagosVisual = document.getElementById("listaPagosVisual");

    let historialConsumos = [];
    let historialPagos = [];
    let semanasPagadas = [];
    let productosDB = [];

    // --- BUSCADOR DE USUARIOS EN EL NAVBAR ---
    let usuariosMismoRol = [];
    let inputBuscarUsuario = document.getElementById("inputBuscarUsuario");
    let listaSugerenciasUsuarios = document.getElementById("listaSugerenciasUsuarios");
    let indexUserSelec = -1;

    if (rolUsuario !== "index") {
        onSnapshot(query(collection(db, rolUsuario)), (snap) => {
            usuariosMismoRol = [];
            snap.forEach(doc => usuariosMismoRol.push({ id: doc.id, ...doc.data() }));
        });
    }

    if (inputBuscarUsuario) {
        inputBuscarUsuario.addEventListener("input", () => {
            let val = inputBuscarUsuario.value.toLowerCase().trim();
            listaSugerenciasUsuarios.innerHTML = "";
            indexUserSelec = -1;

            if (val.length > 0) {
                let filtrados = usuariosMismoRol.filter(u => u.nombre.toLowerCase().includes(val) && u.nombre !== nombreUsuario);
                
                if (filtrados.length > 0) {
                    listaSugerenciasUsuarios.style.display = "block";
                    filtrados.forEach(u => {
                        let li = document.createElement("li");
                        li.innerHTML = `
                            <a class="dropdown-item py-2 px-3 d-flex align-items-center border-bottom border-light" href="#" style="transition: all 0.2s ease;">
                                <i class="bi bi-person-circle fs-5 me-2 text-muted"></i>
                                <span class="fw-bold text-body-emphasis fs-6 user-name-target">${u.nombre}</span>
                            </a>
                        `;
                        li.onmousedown = (e) => { 
                            e.preventDefault(); 
                            window.location.href = `consumo.html?nombre=${encodeURIComponent(u.nombre)}&rol=${encodeURIComponent(rolUsuario)}`;
                        };
                        listaSugerenciasUsuarios.appendChild(li);
                    });
                } else {
                    listaSugerenciasUsuarios.style.display = "none";
                }
            } else {
                listaSugerenciasUsuarios.style.display = "none";
            }
        });

        inputBuscarUsuario.addEventListener("blur", () => { setTimeout(() => { listaSugerenciasUsuarios.style.display = "none"; }, 200); });
        inputBuscarUsuario.addEventListener("focus", () => { if(inputBuscarUsuario.value.trim().length > 0) listaSugerenciasUsuarios.style.display = "block"; });

        inputBuscarUsuario.addEventListener("keydown", (e) => {
            let items = listaSugerenciasUsuarios.querySelectorAll("a.dropdown-item");
            if (listaSugerenciasUsuarios.style.display === "none" || items.length === 0) return;
            
            if (e.key === "ArrowDown") {
                e.preventDefault(); 
                indexUserSelec++; 
                if (indexUserSelec >= items.length) indexUserSelec = 0; 
                actualizarSeleccionUsuario(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault(); 
                indexUserSelec--; 
                if (indexUserSelec < 0) indexUserSelec = items.length - 1; 
                actualizarSeleccionUsuario(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (indexUserSelec > -1) {
                    let nombreSeleccionado = items[indexUserSelec].querySelector(".user-name-target").textContent;
                    window.location.href = `consumo.html?nombre=${encodeURIComponent(nombreSeleccionado)}&rol=${encodeURIComponent(rolUsuario)}`;
                } else if (items.length > 0) {
                    let nombreSeleccionado = items[0].querySelector(".user-name-target").textContent;
                    window.location.href = `consumo.html?nombre=${encodeURIComponent(nombreSeleccionado)}&rol=${encodeURIComponent(rolUsuario)}`;
                }
            }
        });

        function actualizarSeleccionUsuario(items) {
            items.forEach((item, i) => {
                if (i === indexUserSelec) {
                    item.classList.add("active");
                    item.style.backgroundColor = "#0d6efd";
                    item.querySelector('.text-body-emphasis').style.color = "white";
                    item.querySelector('i').classList.remove("text-muted");
                    item.querySelector('i').style.color = "white";
                } else {
                    item.classList.remove("active");
                    item.style.backgroundColor = "";
                    item.querySelector('.text-body-emphasis').style.color = "";
                    item.querySelector('i').classList.add("text-muted");
                    item.querySelector('i').style.color = "";
                }
            });
        }
    }

    // --- NUEVO PRODUCTO ---
    let btnCrearProducto = document.getElementById("btnCrearProducto");
    if (btnCrearProducto) {
        btnCrearProducto.addEventListener("click", async () => {
            const { value: formValues } = await Swal.fire({
                title: '<h3 class="fw-bold mb-0">Nuevo Producto</h3>',
                html: `
                    <div class="mt-4 text-start">
                        <label class="form-label fw-bold small text-muted">Nombre del Producto</label>
                        <input id="swal-prod-nombre" class="form-control form-control-lg fw-bold" placeholder="Ej: Galleta de Vainilla" autocomplete="off">
                    </div>
                    <div class="mt-3 text-start">
                        <label class="form-label fw-bold small text-muted">Precio Unitario (S/)</label>
                        <input id="swal-prod-precio" type="number" step="0.01" class="form-control form-control-lg fw-bold text-primary" placeholder="Ej: 1.50">
                    </div>
                    <div class="mt-3 text-start">
                        <label class="form-label fw-bold small text-muted">Categoría</label>
                        <select id="swal-prod-cat" class="form-select form-select-lg">
                            <option value="comida">🍛 Comida (Menú)</option>
                            <option value="bebida">🥤 Bebidas</option>
                            <option value="pan">🥖 Pan / Sándwich</option>
                            <option value="galleta" selected>🍪 Galletas</option>
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
                confirmButtonText: '<i class="bi bi-save me-1"></i> Guardar',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                preConfirm: () => {
                    let n = document.getElementById('swal-prod-nombre').value.trim();
                    let p = parseFloat(document.getElementById('swal-prod-precio').value);
                    let c = document.getElementById('swal-prod-cat').value;
                    
                    if (!n) { Swal.showValidationMessage('Ingresa un nombre para el producto'); return false; }
                    if (isNaN(p) || p <= 0) { Swal.showValidationMessage('Ingresa un precio válido'); return false; }
                    
                    return { nombre: n, precio: p, categoria: c };
                }
            });

            if (formValues) {
                try {
                    let nFormateado = formValues.nombre.charAt(0).toUpperCase() + formValues.nombre.slice(1).toLowerCase();
                    
                    let existe = productosDB.some(p => p.nombre.toLowerCase() === nFormateado.toLowerCase());
                    if (existe) {
                        Swal.fire('Atención', 'Ya existe un producto con ese nombre.', 'warning');
                        return;
                    }

                    await addDoc(collection(db, "productos"), {
                        nombre: nFormateado,
                        precio: formValues.precio,
                        categoria: formValues.categoria,
                        timestamp: Date.now()
                    });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto agregado', showConfirmButton: false, timer: 2500 });
                    
                    if(inputProducto) {
                        inputProducto.value = nFormateado + " + ";
                        if (inputCantidad) inputCantidad.value = 1;
                        inputProducto.focus();
                    }
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    }

    // --- LISTA COMPLETA PARA EDITAR PRODUCTOS (Solución al Botón Lápiz) ---
    let btnEditarListaProductos = document.getElementById("btnEditarListaProductos");
    if (btnEditarListaProductos) {
        btnEditarListaProductos.addEventListener("click", async () => {
            if (productosDB.length === 0) {
                Swal.fire('Info', 'No hay productos registrados aún.', 'info');
                return;
            }
            
            // Ordenamos alfabéticamente para que sea fácil buscar
            let prodsHTML = productosDB.sort((a,b) => a.nombre.localeCompare(b.nombre)).map(p => {
                let vis = obtenerVisual(p.categoria, p.nombre);
                return `
                    <div class="d-flex justify-content-between align-items-center p-3 border-bottom hover-bg-light" style="cursor: pointer;" onclick="window.ejecutarEdicionBase('${p.id}', '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, '${p.categoria || 'otro'}')">
                        <div class="d-flex align-items-center">
                            <span class="fs-4 me-3">${vis.emoji}</span>
                            <span class="fw-bold text-dark text-start">${p.nombre}</span>
                        </div>
                        <span class="badge bg-primary rounded-pill px-3 py-2">S/ ${p.precio.toFixed(2)}</span>
                    </div>
                `;
            }).join('');

            Swal.fire({
                title: '<h4 class="fw-bold mb-0">Editar Productos</h4>',
                html: `
                    <p class="text-muted small mb-3">Selecciona el producto que deseas modificar:</p>
                    <div class="text-start border rounded-3 shadow-sm overflow-auto" style="max-height: 400px; background-color: var(--bs-body-bg);">
                        ${prodsHTML}
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                customClass: { popup: 'rounded-4 py-4', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-5 fw-bold border-0 text-white mt-3' }
            });
        });
    }

    window.ejecutarEdicionBase = async (idProd, nombreAct, precioAct, catAct) => {
        Swal.close();
        setTimeout(async () => {
            const { value: editValues } = await Swal.fire({
                title: `<h4 class="fw-bold mb-0">Editar: ${nombreAct}</h4>`,
                html: `
                    <div class="mt-4 text-start">
                        <label class="form-label fw-bold small text-muted">Nombre del Producto</label>
                        <input id="swal-edit-nombre-base" class="form-control form-control-lg fw-bold" value="${nombreAct}" autocomplete="off">
                    </div>
                    <div class="mt-3 text-start">
                        <label class="form-label fw-bold small text-muted">Precio Unitario (S/)</label>
                        <input id="swal-edit-precio-base" type="number" step="0.01" class="form-control form-control-lg fw-bold text-primary" value="${precioAct}">
                    </div>
                    <div class="mt-3 text-start">
                        <label class="form-label fw-bold small text-muted">Categoría</label>
                        <select id="swal-edit-cat-base" class="form-select form-select-lg">
                            <option value="comida" ${catAct==='comida'?'selected':''}>🍛 Comida (Menú)</option>
                            <option value="bebida" ${catAct==='bebida'?'selected':''}>🥤 Bebidas</option>
                            <option value="pan" ${catAct==='pan'?'selected':''}>🥖 Pan / Sándwich</option>
                            <option value="galleta" ${catAct==='galleta'?'selected':''}>🍪 Galletas</option>
                            <option value="keke" ${catAct==='keke'?'selected':''}>🧁 Kekes / Porciones</option>
                            <option value="postre" ${catAct==='postre'?'selected':''}>🍮 Postres</option>
                            <option value="dulce" ${catAct==='dulce'?'selected':''}>🍬 Dulces</option>
                            <option value="snack" ${catAct==='snack'?'selected':''}>🍟 Snacks</option>
                            <option value="utiles" ${catAct==='utiles'?'selected':''}>✏️ Útiles</option>
                            <option value="otro" ${catAct==='otro'?'selected':''}>📦 Otro</option>
                        </select>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="bi bi-save me-1"></i> Actualizar',
                cancelButtonText: 'Cancelar',
                customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                preConfirm: () => {
                    let n = document.getElementById('swal-edit-nombre-base').value.trim();
                    let p = parseFloat(document.getElementById('swal-edit-precio-base').value);
                    let c = document.getElementById('swal-edit-cat-base').value;
                    if (!n) { Swal.showValidationMessage('El nombre no puede estar vacío'); return false; }
                    if (isNaN(p) || p <= 0) { Swal.showValidationMessage('Ingresa un precio válido'); return false; }
                    return { nombre: n, precio: p, categoria: c };
                }
            });

            if (editValues) {
                try {
                    let nFormat = editValues.nombre.charAt(0).toUpperCase() + editValues.nombre.slice(1).toLowerCase();
                    await updateDoc(doc(db, "productos", idProd), {
                        nombre: nFormat,
                        precio: editValues.precio,
                        categoria: editValues.categoria
                    });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto actualizado', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        }, 300);
    };

    onSnapshot(collection(db, "productos"), (snap) => {
        if (!snap.empty) {
            productosDB = [];
            snap.forEach(doc => productosDB.push({ id: doc.id, ...doc.data() }));
        } else {
            productosDB = JSON.parse(localStorage.getItem("base_productos")) || [];
        }
    });

    let fpConsumo;
    if (fechaConsumo) {
        fpConsumo = flatpickr(fechaConsumo, { locale: "es", defaultDate: "today", disableMobile: true, altInput: true, altFormat: "d-m-Y", dateFormat: "Y-m-d" });
    }
    if (fechaAbono) {
        flatpickr(fechaAbono, { locale: "es", defaultDate: "today", disableMobile: true, altInput: true, altFormat: "d-m-Y", dateFormat: "Y-m-d" });
    }

    let btnDiaMenos = document.getElementById("btnDiaMenos");
    let btnDiaMas = document.getElementById("btnDiaMas");

    if (btnDiaMenos && fpConsumo) {
        btnDiaMenos.addEventListener("click", () => {
            let currentDate = fpConsumo.selectedDates[0] || new Date();
            currentDate.setDate(currentDate.getDate() - 1);
            fpConsumo.setDate(currentDate);
            fechaConsumo.dispatchEvent(new Event('change'));
        });
    }
    if (btnDiaMas && fpConsumo) {
        btnDiaMas.addEventListener("click", () => {
            let currentDate = fpConsumo.selectedDates[0] || new Date();
            currentDate.setDate(currentDate.getDate() + 1);
            fpConsumo.setDate(currentDate);
            fechaConsumo.dispatchEvent(new Event('change'));
        });
    }

    if (listaMesesUI) {
        listaMesesUI.addEventListener("click", (e) => {
            let item = e.target.closest(".dropdown-item");
            if (!item) return;
            e.preventDefault();
            let valor = item.getAttribute("data-val");
            let texto = item.textContent;
            
            if (mesFiltro.value !== valor) {
                mesFiltro.value = valor;
                if (textoMesVisual) textoMesVisual.textContent = texto;
                renderizarConsumos();
                recalcularSaldoGlobal();
                renderizarListaPagos();
            }
        });
    }

    if (mesFiltro) {
        mesFiltro.addEventListener("change", () => {
            if (textoMesVisual) textoMesVisual.textContent = mesFiltro.options[mesFiltro.selectedIndex].text;
            renderizarConsumos();
            recalcularSaldoGlobal();
            renderizarListaPagos();
        });
    }

    if (fechaConsumo && mesFiltro) {
        fechaConsumo.addEventListener("change", () => {
            if (!fechaConsumo.value) return;
            let datosSemana = obtenerDatosSemana(fechaConsumo.value);
            let mesDeLaFecha = datosSemana.mesEfectivo.toString();

            if (mesFiltro.value !== mesDeLaFecha) {
                mesFiltro.value = mesDeLaFecha;
                let optionSelec = Array.from(mesFiltro.options).find(opt => opt.value === mesDeLaFecha);
                if (textoMesVisual && optionSelec) textoMesVisual.textContent = optionSelec.text;
                
                renderizarConsumos();
                recalcularSaldoGlobal();
                renderizarListaPagos();
            }
        });
    }

    let fechaHoy = new Date();
    if (mesFiltro) {
        mesFiltro.value = fechaHoy.getMonth().toString();
        let optionSeleccionadaInicial = Array.from(mesFiltro.options).find(opt => opt.value === mesFiltro.value);
        if (textoMesVisual && optionSeleccionadaInicial) {
             textoMesVisual.textContent = optionSeleccionadaInicial.text;
        }
    }

    if (inputBusquedaTabla) inputBusquedaTabla.addEventListener("input", renderizarConsumos);

    let indiceSeleccionado = -1;
    if (inputProducto) {
        inputProducto.addEventListener("input", () => {
            let val = inputProducto.value.toLowerCase();
            let partes = val.split("+");
            let ult = partes[partes.length - 1].trim();
            listaSugerencias.innerHTML = "";
            indiceSeleccionado = -1;

            if (ult.length > 0) {
                let f = productosDB.filter(p => p.nombre.toLowerCase().includes(ult));
                if (f.length > 0) {
                    listaSugerencias.classList.add("show");
                    f.forEach(p => {
                        let li = document.createElement("li");
                        let visual = obtenerVisual(p.categoria, p.nombre);

                        li.innerHTML = `
                            <a class="dropdown-item d-flex justify-content-between align-items-center py-2 px-3" href="#" style="transition: all 0.2s ease;">
                                <div class="d-flex align-items-center">
                                    <span class="fs-4 me-2 lh-1">${visual.emoji}</span>
                                    <span class="fw-bold text-body-emphasis">${p.nombre}</span>
                                </div>
                                <span class="badge bg-light border text-dark fs-6 ms-3">S/ ${parseFloat(p.precio).toFixed(2)}</span>
                            </a>
                        `;
                        li.onmousedown = (e) => { e.preventDefault(); seleccionar(p.nombre); };
                        listaSugerencias.appendChild(li);
                    });
                } else listaSugerencias.classList.remove("show");
            } else listaSugerencias.classList.remove("show");
        });

        inputProducto.addEventListener("keydown", (e) => {
            let items = listaSugerencias.querySelectorAll("a.dropdown-item");
            if (!listaSugerencias.classList.contains("show") || items.length === 0) return;
            if (e.key === "ArrowDown") {
                e.preventDefault(); indiceSeleccionado++; if (indiceSeleccionado >= items.length) indiceSeleccionado = 0; actSel(items);
            } else if (e.key === "ArrowUp") {
                e.preventDefault(); indiceSeleccionado--; if (indiceSeleccionado < 0) indiceSeleccionado = items.length - 1; actSel(items);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (indiceSeleccionado > -1) seleccionar(items[indiceSeleccionado].querySelector(".text-body-emphasis").textContent);
                else if (items.length > 0) seleccionar(items[0].querySelector(".text-body-emphasis").textContent);
            }
        });

        function actSel(items) {
            items.forEach((item, i) => {
                if (i === indiceSeleccionado) {
                    item.classList.add("active");
                    item.style.backgroundColor = "#0d6efd";
                    item.querySelector('.text-body-emphasis').style.color = "white";
                    item.querySelector('.badge').classList.replace('text-dark', 'text-primary');
                    item.scrollIntoView({ block: "nearest" });
                } else {
                    item.classList.remove("active");
                    item.style.backgroundColor = "";
                    item.querySelector('.text-body-emphasis').style.color = "";
                    item.querySelector('.badge').classList.replace('text-primary', 'text-dark');
                }
            });
        }
        function seleccionar(n) {
            let p = inputProducto.value.split("+");
            p[p.length - 1] = ` ${n} `;
            inputProducto.value = p.join("+").trim() + " + ";
            listaSugerencias.classList.remove("show");
            inputProducto.focus();
        }
    }

    onSnapshot(query(collection(db, "consumos"), where("nombreUsuario", "==", nombreUsuario)), (snap) => {
        historialConsumos = [];
        snap.forEach(doc => historialConsumos.push({ id: doc.id, ...doc.data() }));
        historialConsumos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        renderizarConsumos();
        recalcularSaldoGlobal();
    });

    onSnapshot(query(collection(db, "pagos"), where("nombreUsuario", "==", nombreUsuario)), (snap) => {
        historialPagos = [];
        snap.forEach(doc => historialPagos.push({ id: doc.id, ...doc.data() }));
        historialPagos.sort((a, b) => b.timestamp - a.timestamp);
        recalcularSaldoGlobal();
        renderizarListaPagos();
    });

    onSnapshot(query(collection(db, "semanas_pagadas"), where("nombreUsuario", "==", nombreUsuario)), (snap) => {
        semanasPagadas = [];
        snap.forEach(doc => semanasPagadas.push({ id: doc.id, ...doc.data() }));
        renderizarConsumos();
        recalcularSaldoGlobal();
    });

    function recalcularSaldoGlobal() {
        if (!estadoCuentaMesVisual) return;

        let mesSeleccionado = mesFiltro.value;
        let consumosFiltrados = mesSeleccionado === "todos" ? historialConsumos : historialConsumos.filter(r => obtenerDatosSemana(r.fecha).mesEfectivo == mesSeleccionado);
        let pagosFiltrados = mesSeleccionado === "todos" ? historialPagos : historialPagos.filter(p => {
            let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : obtenerDatosSemana(p.fecha).mesEfectivo.toString();
            return mesDelPago === mesSeleccionado;
        });

        let totalConsumoBruto = 0;
        let deudaVisualReal = 0;

        consumosFiltrados.forEach(r => {
            totalConsumoBruto += r.precio;
            let grp = getGroupData(r.fecha, mesSeleccionado);
            let semanaDoc = semanasPagadas.find(s => s.idGrupo === grp.idGrupo);
            let itemPagado = r.pagado === true || (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp));
            
            if (!itemPagado) {
                deudaVisualReal += r.precio;
            }
        });

        let totalPagosBruto = pagosFiltrados.reduce((acc, p) => acc + p.monto, 0);
        let pendienteMostrar = 0;
        let canceloMostrar = 0;
        let badgeHTML = "";

        if (mesSeleccionado === "todos") {
            if (btnMarcarMesPagado) btnMarcarMesPagado.style.display = "none";
            pendienteMostrar = totalConsumoBruto - totalPagosBruto;
            if (pendienteMostrar < 0) pendienteMostrar = 0;
            if (pendienteMostrar < deudaVisualReal) pendienteMostrar = deudaVisualReal; 
            canceloMostrar = totalPagosBruto;
        } else {
            if (btnMarcarMesPagado) {
                btnMarcarMesPagado.style.display = (tipoCuentaActiva === 'mensual') ? "none" : "inline-block";
            }
            
            pendienteMostrar = deudaVisualReal;
            canceloMostrar = totalConsumoBruto - deudaVisualReal;
            if (totalPagosBruto > totalConsumoBruto) canceloMostrar = totalPagosBruto;
        }

        let saldoAFavor = canceloMostrar - totalConsumoBruto;
        if (saldoAFavor < 0) saldoAFavor = 0;

        if (pendienteMostrar > 0.01) {
            badgeHTML = `<span class="badge bg-danger px-4 py-2 rounded-pill shadow-sm fs-5"><i class="bi bi-exclamation-triangle-fill me-1"></i> FALTAN: S/ ${pendienteMostrar.toFixed(2)}</span>`;
        } else if (saldoAFavor > 0.01) {
            badgeHTML = `<span class="badge bg-success px-4 py-2 rounded-pill shadow-sm fs-5"><i class="bi bi-gift-fill me-1"></i> A FAVOR: S/ ${saldoAFavor.toFixed(2)}</span>`;
        } else {
            badgeHTML = `<span class="badge bg-secondary px-4 py-2 rounded-pill shadow-sm fs-5"><i class="bi bi-shield-check me-1"></i> AL DÍA</span>`;
        }

        estadoCuentaMesVisual.innerHTML = `
            <div class="d-inline-flex bg-white px-4 py-3 rounded-4 shadow-sm border border-light mb-3 w-100 justify-content-center">
                <div class="pe-4 border-end w-50 text-center">
                    <span class="d-block text-muted fw-bold mb-1" style="font-size: 0.85rem;">PENDIENTE</span>
                    <span class="fw-bold text-dark lh-1 fs-2">S/ ${pendienteMostrar.toFixed(2)}</span>
                </div>
                <div class="ps-4 w-50 text-center">
                    <span class="d-block text-muted fw-bold mb-1" style="font-size: 0.85rem;">CANCELÓ</span>
                    <span class="fw-bold text-success lh-1 fs-2">S/ ${canceloMostrar.toFixed(2)}</span>
                </div>
            </div>
            <div class="text-center mt-1">
                ${badgeHTML}
            </div>
        `;

        if (totalAcumulado && (!inputBusquedaTabla || inputBusquedaTabla.value.trim() === "")) {
            totalAcumulado.textContent = `S/ ${pendienteMostrar.toFixed(2)}`;
        }

        if (btnMarcarMesPagado && mesSeleccionado !== "todos" && tipoCuentaActiva !== 'mensual') {
            let todosSemanasPagadas = false;
            if (consumosFiltrados.length > 0) {
                todosSemanasPagadas = consumosFiltrados.every(r => {
                    let grp = getGroupData(r.fecha, mesSeleccionado);
                    return r.pagado === true || semanasPagadas.some(s => s.idGrupo === grp.idGrupo);
                });
            }

            if (todosSemanasPagadas && consumosFiltrados.length > 0) {
                btnMarcarMesPagado.innerHTML = '<i class="bi bi-x-circle"></i> DESMARCAR MES';
                btnMarcarMesPagado.className = "btn btn-outline-danger fw-bold py-2 px-3 shadow-sm bg-white rounded-pill mt-2 mt-sm-0";
                btnMarcarMesPagado.setAttribute("data-estado", "pagado");
            } else {
                btnMarcarMesPagado.innerHTML = '<i class="bi bi-check-all fs-5"></i> Cobrar Mes';
                btnMarcarMesPagado.className = "btn btn-outline-success fw-bold py-2 px-3 shadow-sm bg-white rounded-pill mt-2 mt-sm-0 fs-6";
                btnMarcarMesPagado.setAttribute("data-estado", "pendiente");
            }
        }
    }

    if (btnMarcarMesPagado) {
        btnMarcarMesPagado.onclick = async () => {
            let mesSeleccionado = mesFiltro.value;
            if (mesSeleccionado === "todos") return;

            let nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text.toUpperCase();
            let consumosDelMes = historialConsumos.filter(r => obtenerDatosSemana(r.fecha).mesEfectivo == mesSeleccionado);
            let estado = btnMarcarMesPagado.getAttribute("data-estado");

            if (estado === "pagado") {
                Swal.fire({
                    title: '<h3 class="fw-bold mb-0 text-danger">¿Desmarcar mes?</h3>',
                    html: `Las cuentas de <b>${nombreMes}</b> volverán a estar pendientes.<br><br><small class="text-danger fw-bold">Ojo: Si hubo pago registrado en dinero, debes borrarlo manualmente del historial abajo.</small>`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#dc3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, desmarcar',
                    cancelButtonText: 'Cancelar',
                    customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            btnMarcarMesPagado.disabled = true;
                            let batch = writeBatch(db);

                            let gruposSemanas = [...new Set(consumosDelMes.map(r => getGroupData(r.fecha, mesSeleccionado).idGrupo))];

                            gruposSemanas.forEach(idGrupo => {
                                let docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
                                batch.delete(doc(db, "semanas_pagadas", docId));
                            });

                            consumosDelMes.forEach(r => {
                                if (r.pagado) batch.update(doc(db, "consumos", r.id), { pagado: false });
                            });

                            await batch.commit();
                            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Mes desmarcado', showConfirmButton: false, timer: 2500 });
                        } catch (e) {
                            Swal.fire('Error', e.message, 'error');
                        } finally {
                            btnMarcarMesPagado.disabled = false;
                        }
                    }
                });
                return;
            }

            let pagosDelMes = historialPagos.filter(p => {
                let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : obtenerDatosSemana(p.fecha).mesEfectivo.toString();
                return mesDelPago === mesSeleccionado;
            });

            let totalConsumoMes = consumosDelMes.reduce((acc, r) => acc + r.precio, 0);
            let totalPagosMes = pagosDelMes.reduce((acc, p) => acc + p.monto, 0);
            
            let deudaFaltante = 0;
            consumosDelMes.forEach(r => {
                let grp = getGroupData(r.fecha, mesSeleccionado);
                let semanaDoc = semanasPagadas.find(s => s.idGrupo === grp.idGrupo);
                let itemPagado = r.pagado === true || (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp));
                if(!itemPagado) deudaFaltante += r.precio;
            });

            if (deudaFaltante > 0.01) {
                Swal.fire({
                    title: '<h3 class="fw-bold mb-0">¿Cerrar y Cobrar Mes?</h3>',
                    html: `Se marcarán los grupos de <b>${nombreMes}</b> como cerrados y se ingresará un abono de <b>S/ ${deudaFaltante.toFixed(2)}</b>.<br><br>¿Medio de pago?`,
                    icon: 'info',
                    showCancelButton: true,
                    showDenyButton: true,
                    confirmButtonText: '<i class="bi bi-cash me-1"></i> Efectivo',
                    denyButtonText: '<i class="bi bi-qr-code me-1"></i> Yape',
                    cancelButtonText: 'Cancelar',
                    customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0', denyButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                    didOpen: () => {
                        let confirmBtn = Swal.getConfirmButton();
                        if(confirmBtn) confirmBtn.style.cssText = 'background-color: #198754 !important; color: white !important;';
                        let denyBtn = Swal.getDenyButton();
                        if(denyBtn) denyBtn.style.cssText = 'background-color: #742384 !important; color: white !important;';
                    }
                }).then(async (result) => {
                    if (result.isConfirmed || result.isDenied) {
                        let metodoPago = result.isConfirmed ? 'Efectivo' : 'Yape';
                        let gruposSemanas = [...new Set(consumosDelMes.map(r => getGroupData(r.fecha, mesSeleccionado).idGrupo))];

                        if (gruposSemanas.length > 0) {
                            try {
                                btnMarcarMesPagado.disabled = true;

                                await addDoc(collection(db, "pagos"), {
                                    nombreUsuario: nombreUsuario,
                                    monto: deudaFaltante,
                                    fecha: new Date().toISOString().split('T')[0],
                                    metodo: metodoPago,
                                    pagador: `Cierre de Mes: ${nombreMes}`,
                                    mesAplicado: mesSeleccionado,
                                    timestamp: Date.now()
                                });

                                let batch = writeBatch(db);
                                gruposSemanas.forEach(idGrupo => {
                                    let docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
                                    let docRef = doc(db, "semanas_pagadas", docId);
                                    batch.set(docRef, {
                                        nombreUsuario: nombreUsuario,
                                        idGrupo: idGrupo,
                                        timestamp: Date.now()
                                    });
                                });
                                await batch.commit();
                                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mes cobrado', showConfirmButton: false, timer: 2500 });
                            } catch (e) {
                                Swal.fire('Error', e.message, 'error');
                            } finally {
                                btnMarcarMesPagado.disabled = false;
                            }
                        }
                    }
                });
            } else {
                Swal.fire({
                    title: '<h3 class="fw-bold mb-0">Mes sin deudas</h3>',
                    html: `El mes de <b>${nombreMes}</b> ya está completamente pagado. ¿Deseas marcar todos los consumos visualmente como cancelados?`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#198754',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Sí, tachar',
                    cancelButtonText: 'Cancelar',
                    customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-success btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        let gruposSemanas = [...new Set(consumosDelMes.map(r => getGroupData(r.fecha, mesSeleccionado).idGrupo))];

                        let batch = writeBatch(db);
                        gruposSemanas.forEach(idGrupo => {
                            let docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
                            let docRef = doc(db, "semanas_pagadas", docId);
                            batch.set(docRef, {
                                nombreUsuario: nombreUsuario,
                                idGrupo: idGrupo,
                                timestamp: Date.now()
                            });
                        });
                        await batch.commit();
                        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mes cancelado', showConfirmButton: false, timer: 2000 });
                    }
                });
            }
        };
    }

    window.pagarYMarcarSemana = (idGrupo, deudaSemana, textoCabecera) => {
        Swal.fire({
            title: '<h3 class="fw-bold mb-0">Cobrar Cuenta</h3>',
            html: `Se registrará un pago de <b>S/ ${deudaSemana.toFixed(2)}</b> por:<br><b>${textoCabecera}</b>.<br><br>¿Medio de pago?`,
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="bi bi-cash"></i> Efectivo',
            denyButtonText: '<i class="bi bi-qr-code"></i> Yape',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0', denyButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
            didOpen: () => {
                let confirmBtn = Swal.getConfirmButton();
                if(confirmBtn) confirmBtn.style.cssText = 'background-color: #198754 !important; color: white !important;';
                let denyBtn = Swal.getDenyButton();
                if(denyBtn) denyBtn.style.cssText = 'background-color: #742384 !important; color: white !important;';
            }
        }).then(async (result) => {
            if (result.isConfirmed || result.isDenied) {
                let metodoPago = result.isConfirmed ? 'Efectivo' : 'Yape';
                let mesDestino = mesFiltro.value === "todos" ? new Date().getMonth().toString() : mesFiltro.value;
                let docIdSemana = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');

                try {
                    await addDoc(collection(db, "pagos"), {
                        nombreUsuario: nombreUsuario,
                        monto: deudaSemana,
                        fecha: new Date().toISOString().split('T')[0],
                        metodo: metodoPago,
                        pagador: `Pago exacto: ${textoCabecera}`,
                        mesAplicado: mesDestino,
                        timestamp: Date.now()
                    });

                    await setDoc(doc(db, "semanas_pagadas", docIdSemana), {
                        nombreUsuario: nombreUsuario,
                        idGrupo: idGrupo,
                        timestamp: Date.now()
                    });

                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cuenta Pagada', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    window.desmarcarSemana = (idGrupo) => {
        let docId = `${nombreUsuario}_${idGrupo}`.replace(/\s+/g, '_');
        Swal.fire({
            title: '<h3 class="fw-bold mb-0">¿Deshacer tachado?</h3>',
            html: '<p class="fs-5 mt-3">Los consumos se marcarán como pendientes de pago de nuevo.</p><small class="text-danger fw-bold">Ojo: Esto NO borra el pago de dinero registrado, debes borrarlo abajo manualmente.</small>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, desmarcar',
            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteDoc(doc(db, "semanas_pagadas", docId));
            }
        });
    };

    window.pagarYMarcarDia = (idConsumo, monto, productoNombre) => {
        Swal.fire({
            title: '<h3 class="fw-bold mb-0">Cobrar Día</h3>',
            html: `Vas a cobrar <b>S/ ${monto.toFixed(2)}</b> por: <br><i>${productoNombre}</i><br><br>¿Medio de pago?`,
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: '<i class="bi bi-cash"></i> Efectivo',
            denyButtonText: '<i class="bi bi-qr-code"></i> Yape',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0', denyButton: 'btn btn-lg rounded-pill px-4 fw-bold border-0', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
            didOpen: () => {
                let confirmBtn = Swal.getConfirmButton();
                if(confirmBtn) confirmBtn.style.cssText = 'background-color: #198754 !important; color: white !important;';
                let denyBtn = Swal.getDenyButton();
                if(denyBtn) denyBtn.style.cssText = 'background-color: #742384 !important; color: white !important;';
            }
        }).then(async (result) => {
            if (result.isConfirmed || result.isDenied) {
                let metodoPago = result.isConfirmed ? 'Efectivo' : 'Yape';
                let mesDestino = mesFiltro.value === "todos" ? new Date().getMonth().toString() : mesFiltro.value;

                try {
                    await addDoc(collection(db, "pagos"), {
                        nombreUsuario: nombreUsuario,
                        monto: monto,
                        fecha: new Date().toISOString().split('T')[0],
                        metodo: metodoPago,
                        pagador: `Día: ${productoNombre}`,
                        mesAplicado: mesDestino,
                        timestamp: Date.now()
                    });

                    await updateDoc(doc(db, "consumos", idConsumo), { pagado: true });
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Día pagado', showConfirmButton: false, timer: 2000 });
                } catch (e) {
                    Swal.fire('Error', e.message, 'error');
                }
            }
        });
    };

    window.desmarcarDia = async (idConsumo) => {
        await updateDoc(doc(db, "consumos", idConsumo), { pagado: false });
    };

    function renderizarConsumos() {
        if (!tablaConsumos) return;
        tablaConsumos.innerHTML = "";
        let totalBusqueda = 0;
        let mes = mesFiltro.value;
        let textoBusqueda = inputBusquedaTabla ? inputBusquedaTabla.value.toLowerCase() : "";

        let filtrados = historialConsumos.filter(r => {
            let coincideMes = (mes === "todos" || obtenerDatosSemana(r.fecha).mesEfectivo == mes);
            let coincideBusqueda = r.productoNombre.toLowerCase().includes(textoBusqueda);
            return coincideMes && coincideBusqueda;
        });

        if (filtrados.length === 0) {
            tablaConsumos.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-5 fs-5">No hay consumos en este mes.</td></tr>';
            if (totalAcumulado) totalAcumulado.textContent = "S/ 0.00";
            return;
        }

        let consumosPorGrupo = {};
        let consumosPorSemana = {};

        filtrados.forEach(r => {
            let g = getGroupData(r.fecha, mes);
            if (!consumosPorGrupo[g.idGrupo]) consumosPorGrupo[g.idGrupo] = [];
            consumosPorGrupo[g.idGrupo].push(r);

            let kSemana = `${g.idGrupo}_S${g.numSemana}`;
            if (!consumosPorSemana[kSemana]) consumosPorSemana[kSemana] = [];
            consumosPorSemana[kSemana].push(r);
        });

        let grupoActual = "";
        let semanaActual = "";

        filtrados.forEach(r => {
            let grpInfo = getGroupData(r.fecha, mes);
            let identificadorGrupo = grpInfo.idGrupo;

            let semanaDoc = semanasPagadas.find(s => s.idGrupo === identificadorGrupo);
            let itemPagado = r.pagado === true || (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp));

            if (identificadorGrupo !== grupoActual) {
                grupoActual = identificadorGrupo;
                semanaActual = "";

                let itemsGrupo = consumosPorGrupo[identificadorGrupo];
                let todosPagados = itemsGrupo.every(item => {
                    let sDoc = semanasPagadas.find(s => s.idGrupo === identificadorGrupo);
                    return item.pagado === true || (sDoc && (!item.timestamp || item.timestamp <= sDoc.timestamp));
                });
                let deudaSemana = itemsGrupo
                    .filter(item => {
                        let sDoc = semanasPagadas.find(s => s.idGrupo === identificadorGrupo);
                        return !(item.pagado === true || (sDoc && (!item.timestamp || item.timestamp <= sDoc.timestamp)));
                    })
                    .reduce((acc, curr) => acc + curr.precio, 0);

                let colorFondo = todosPagados ? '#d1e7dd' : '#f0f7ff';
                let colorBorde = todosPagados ? '#198754' : '#0d6efd';
                let colorTexto = todosPagados ? 'text-success' : 'text-primary';

                let badgeTotal = todosPagados ? '' : `<span class="badge bg-danger rounded-pill shadow-sm px-3 py-2 ms-2 fs-6">S/ ${deudaSemana.toFixed(2)}</span>`;

                let botonAccion = todosPagados
                    ? `<button class="btn btn-success rounded-pill fw-bold py-2 px-4 shadow-sm border-0" onclick="window.desmarcarSemana('${identificadorGrupo}')"><i class="bi bi-check-circle-fill me-1"></i>Pagado</button>`
                    : `<button class="btn btn-warning text-dark rounded-pill fw-bold py-2 px-4 shadow-sm border-0" onclick="window.pagarYMarcarSemana('${identificadorGrupo}', ${deudaSemana}, '${grpInfo.textoCabecera}')"><i class="bi bi-cash-coin me-1"></i>Pagar Todo</button>`;

                let trGrupo = document.createElement("tr");
                trGrupo.innerHTML = `
                    <td colspan="4" class="py-3 ps-3 ps-md-4" style="background-color: ${colorFondo}; border-left: 6px solid ${colorBorde}; border-bottom: 2px solid rgba(0,0,0,0.05);">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pe-2">
                            <div class="d-flex align-items-center flex-wrap">
                                <span class="fw-bold ${colorTexto} fs-5"><i class="bi bi-calendar3 me-2"></i>${grpInfo.textoCabecera}</span>
                                ${badgeTotal}
                            </div>
                            <div class="d-flex align-items-center gap-2">${botonAccion}</div>
                        </div>
                    </td>
                `;
                tablaConsumos.appendChild(trGrupo);
            }

            if (tipoCuentaActiva === 'mensual') {
                let kSemana = `${identificadorGrupo}_S${grpInfo.numSemana}`;
                if (kSemana !== semanaActual) {
                    semanaActual = kSemana;
                    let totalSemana = consumosPorSemana[kSemana].reduce((acc, c) => acc + c.precio, 0);
                    let trSub = document.createElement("tr");
                    trSub.innerHTML = `
                        <td colspan="4" class="py-2 ps-4" style="background-color: rgba(13,110,253,0.07); border-left: 6px solid rgba(13,110,253,0.35);">
                            <div class="d-flex justify-content-between align-items-center pe-3">
                                <span class="fw-bold text-secondary"><i class="bi bi-calendar-week me-2"></i>Semana 0${grpInfo.numSemana}</span>
                                <span class="badge rounded-pill bg-secondary-subtle text-secondary-emphasis px-3 py-2">Consumido: S/ ${totalSemana.toFixed(2)}</span>
                            </div>
                        </td>
                    `;
                    tablaConsumos.appendChild(trSub);
                }
            }

            if (!itemPagado) totalBusqueda += r.precio;

            let fechaObjForDisplay = new Date(r.fecha + 'T00:00:00');
            let f = fechaObjForDisplay.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
            let tr = document.createElement("tr");
            let nombreSeguro = r.productoNombre.replace(/'/g, "\\'");

            let tachadoClase = itemPagado ? "text-decoration: line-through; opacity: 0.5;" : "";
            let colorLetra = itemPagado ? "text-muted" : "text-dark";

            let btnCobroIndividual = "";
            if (!itemPagado) {
                btnCobroIndividual = `<button class="btn btn-outline-success rounded-circle me-2 shadow-sm d-flex align-items-center justify-content-center" style="width:38px; height:38px;" onclick="window.pagarYMarcarDia('${r.id}', ${r.precio}, '${nombreSeguro}')" title="Cobrar solo este día"><i class="bi bi-cash-coin fs-5"></i></button>`;
            } else if (r.pagado === true) {
                btnCobroIndividual = `<button class="btn btn-outline-secondary rounded-circle me-2 shadow-sm border-0 d-flex align-items-center justify-content-center" style="width:38px; height:38px;" onclick="window.desmarcarDia('${r.id}')" title="Deshacer tachado individual"><i class="bi bi-arrow-counterclockwise fs-5"></i></button>`;
            }

            tr.innerHTML = `
                <td class="ps-4 text-muted fs-6" style="${tachadoClase}">${f.charAt(0).toUpperCase() + f.slice(1)}</td>
                <td class="fw-bold fs-6 ${colorLetra}" style="${tachadoClase}">${r.productoNombre}</td>
                <td class="text-center fw-bold fs-5 ${colorLetra}" style="${tachadoClase}">S/ ${r.precio.toFixed(2)}</td>
                <td class="text-center" style="white-space: nowrap;">
                    <div class="d-flex justify-content-end align-items-center me-2">
                        ${btnCobroIndividual}
                        <button class="btn btn-outline-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style="width:38px; height:38px;" onclick="window.editarRegistro('${r.id}', '${nombreSeguro}', ${r.precio}, '${r.fecha}')" title="Editar consumo">
                            <i class="bi bi-pencil-square fs-5"></i>
                        </button>
                        <button class="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center" style="width:38px; height:38px;" onclick="eliminarRegistro('${r.id}')" title="Eliminar registro">
                            <i class="bi bi-x-lg fs-5"></i>
                        </button>
                    </div>
                </td>
            `;
            tablaConsumos.appendChild(tr);
        });

        if (textoBusqueda !== "") {
            if (totalAcumulado) totalAcumulado.textContent = `S/ ${totalBusqueda.toFixed(2)} (Buscando)`;
        }
    }

    window.modoEdicionActiva = null;

    window.editarRegistro = (id, productoActual, precioActual, fechaDB) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (fechaConsumo) {
            fechaConsumo.value = fechaDB;
            if (fechaConsumo._flatpickr) fechaConsumo._flatpickr.setDate(fechaDB);
        }
        if (inputProducto) inputProducto.value = productoActual + " + ";
        if (inputCantidad) inputCantidad.value = 1;

        window.modoEdicionActiva = { id: id };

        let btnSubmit = formConsumo.querySelector("button[type='submit']");
        if (btnSubmit) {
            btnSubmit.innerHTML = '<i class="bi bi-save"></i> Guardar Cambios';
            btnSubmit.classList.remove("btn-primary");
            btnSubmit.classList.add("btn-success");
        }
        inputProducto.focus();
    };

    window.editarPago = async (id, montoActual, fechaDB, metodoActual, pagadorActual) => {
        let p = fechaDB.split('-');
        
        let { value: formValues } = await Swal.fire({
            title: '<h3 class="fw-bold mb-0">Editar Pago</h3>',
            html: `
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Monto (S/)</label>
                    <input id="swal-monto" type="number" step="0.01" class="form-control form-control-lg fw-bold" value="${montoActual}">
                </div>
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Fecha</label>
                    <input id="swal-fecha" type="date" class="form-control form-control-lg" value="${fechaDB}">
                </div>
                <div class="mb-3 text-start">
                    <label class="form-label fw-bold small text-muted">Medio de Pago</label>
                    <select id="swal-metodo" class="form-select form-select-lg">
                        <option value="Efectivo" ${metodoActual === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                        <option value="Yape" ${metodoActual === 'Yape' ? 'selected' : ''}>Yape</option>
                    </select>
                </div>
                <div class="mb-1 text-start">
                    <label class="form-label fw-bold small text-muted">Detalles</label>
                    <input id="swal-pagador" type="text" class="form-control form-control-lg" placeholder="Concepto o nota..." value="${pagadorActual || ''}">
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
            preConfirm: () => {
                return {
                    monto: document.getElementById('swal-monto').value,
                    fecha: document.getElementById('swal-fecha').value,
                    metodo: document.getElementById('swal-metodo').value,
                    pagador: document.getElementById('swal-pagador').value
                }
            }
        });

        if (formValues) {
            let nuevoMonto = parseFloat(formValues.monto);
            if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
                Swal.fire('Error', 'Monto inválido.', 'error');
                return;
            }
            if (!formValues.fecha) {
                Swal.fire('Error', 'Selecciona fecha.', 'error');
                return;
            }
            try {
                await updateDoc(doc(db, "pagos", id), { monto: nuevoMonto, fecha: formValues.fecha, metodo: formValues.metodo, pagador: formValues.pagador.trim() });
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pago actualizado', showConfirmButton: false, timer: 2000 });
            } catch (e) {
                Swal.fire('Error', e.message, 'error');
            }
        }
    };

    function renderizarListaPagos() {
        if (!contenedorHistorialPagos || !listaPagosVisual) return;
        listaPagosVisual.innerHTML = "";
        let mesSeleccionado = mesFiltro.value;

        let pagosFiltrados = historialPagos.filter(p => {
            if (mesSeleccionado === "todos") return true;
            let mesDelPago = p.mesAplicado !== undefined ? p.mesAplicado.toString() : obtenerDatosSemana(p.fecha).mesEfectivo.toString();
            return mesDelPago === mesSeleccionado;
        });

        if (pagosFiltrados.length === 0) {
            contenedorHistorialPagos.classList.add("d-none");
            return;
        }

        contenedorHistorialPagos.classList.remove("d-none");
        pagosFiltrados.forEach((pago) => {
            let [y, m, d] = pago.fecha.split('-');
            let metodo = pago.metodo || "Efectivo";
            let colorMetodo = metodo === "Yape" ? "#742384" : "#198754";
            let iconoMetodo = metodo === "Yape" ? "bi-qr-code" : "bi-cash-stack";
            let textoPagador = pago.pagador ? `<br><small class="text-secondary fw-bold fs-6"><i class="bi bi-chat-left-text me-1"></i>${pago.pagador}</small>` : "";

            let li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center px-4 py-3 border-bottom";
            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <div class="rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm flex-shrink-0" style="width: 45px; height: 45px; background-color: ${colorMetodo}; color: white;">
                        <i class="bi ${iconoMetodo} fs-4"></i>
                    </div>
                    <div>
                        <span class="d-block text-dark fw-bold fs-5">S/ ${pago.monto.toFixed(2)} <span class="badge ms-2" style="background-color: ${colorMetodo};">${metodo}</span></span>
                        <small class="text-muted fw-semibold">El ${d}-${m}-${y}</small>${textoPagador}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center" style="width:38px; height:38px;" onclick="window.editarPago('${pago.id}', ${pago.monto}, '${pago.fecha}', '${metodo}', '${pago.pagador || ''}')"><i class="bi bi-pencil-square fs-5"></i></button>
                    <button class="btn btn-outline-danger rounded-circle d-flex align-items-center justify-content-center" style="width:38px; height:38px;" onclick="window.eliminarPago('${pago.id}')"><i class="bi bi-x-lg fs-5"></i></button>
                </div>
            `;
            listaPagosVisual.appendChild(li);
        });
    }

    if (formConsumo) {
        formConsumo.onsubmit = async (e) => {
            e.preventDefault();
            let btn = formConsumo.querySelector("button[type='submit']");
            let fechaVal = fechaConsumo._flatpickr ? fechaConsumo.value : fechaConsumo.value;

            let prodCrudo = inputProducto.value.trim();
            if (prodCrudo.endsWith("+")) prodCrudo = prodCrudo.slice(0, -1).trim();
            let cant = parseInt(inputCantidad.value);

            if (!prodCrudo || cant < 1) return;

            let nombresSeparados = prodCrudo.split("+").map(n => n.trim()).filter(n => n !== "");
            let precioTotalFinal = 0;
            let itemsDeEstePedido = [];

            for (let rawName of nombresSeparados) {
                let nombreLimpio = rawName;
                let cantidadLocal = 1;
                let precioPersonalizado = null;

                let matchPrecio = rawName.match(/^(.*?)\s*\(\s*S\/\s*([\d.]+)\s*\)$/i);
                if (matchPrecio) {
                    nombreLimpio = matchPrecio[1].trim();
                    precioPersonalizado = parseFloat(matchPrecio[2]);
                } else {
                    let matchCant = rawName.match(/^(.*?)\s*\(\s*(\d+)\s*\)$/);
                    if (matchCant) {
                        nombreLimpio = matchCant[1].trim();
                        cantidadLocal = parseInt(matchCant[2], 10);
                    }
                }

                let productoEncontrado = productosDB.find(p => p.nombre.toLowerCase() === nombreLimpio.toLowerCase());

                if (!productoEncontrado && precioPersonalizado === null) {
                    Swal.fire({
                        title: '<h3 class="fw-bold mb-0 text-danger">Producto Inválido</h3>', 
                        html: `<p class="fs-5">El producto <b>"${nombreLimpio}"</b> no está registrado.</p>`, 
                        icon: 'error',
                        customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
                    });
                    return;
                }

                let precioDelProducto = 0;
                let nombreParaHistorial = nombreLimpio;

                if (precioPersonalizado !== null) {
                    precioDelProducto = precioPersonalizado;
                    nombreParaHistorial = `${nombreLimpio} (S/ ${precioDelProducto.toFixed(2)})`;
                } else {
                    precioDelProducto = parseFloat(productoEncontrado.precio);
                    nombreParaHistorial = productoEncontrado.nombre;

                    let cat = (productoEncontrado.categoria || "").toLowerCase();
                    let nom = productoEncontrado.nombre.toLowerCase();
                    if (cat === "comida" || cat === "menu" || cat === "menú" || nom.includes("comida") || nom.includes("menu")) {

                        let { value: precioIngresado } = await Swal.fire({
                            title: `<h3 class="fw-bold">Precio de ${productoEncontrado.nombre}</h3>`,
                            html: `
                                <p class="text-muted mb-4">Selecciona o ingresa el precio para hoy:</p>
                                <div class="d-flex flex-wrap justify-content-center gap-2 mb-3">
                                    <div class="price-box" data-price="5">S/ 5.00</div>
                                    <div class="price-box" data-price="7">S/ 7.00</div>
                                    <div class="price-box" data-price="8">S/ 8.00</div>
                                    <div class="price-box" data-price="10">S/ 10.00</div>
                                    <div class="price-box" data-price="12">S/ 12.00</div>
                                </div>
                                <div class="mt-3 text-start">
                                    <label class="form-label text-muted small fw-bold">Otras cantidades manuales:</label>
                                    <input type="number" id="custom-price-input" step="0.01" class="form-control form-control-lg fw-bold text-primary text-center" placeholder="Ej: 6.50">
                                </div>
                                <style>
                                    .price-box { width: 30%; border: 2px solid #e2e8f0; border-radius: 12px; padding: 12px 5px; cursor: pointer; transition: all 0.2s; font-weight: bold; font-size: 1.1rem; color: var(--bs-body-color); text-align: center; }
                                    .price-box:hover { border-color: #0d6efd; background-color: rgba(13, 110, 253, 0.1); color: #0d6efd; }
                                    .price-box.selected { border-color: #0d6efd; background-color: #0d6efd; color: #ffffff !important; transform: scale(1.05); }
                                    [data-bs-theme="dark"] .price-box { border-color: #495057; }
                                    [data-bs-theme="dark"] .price-box:hover { border-color: #0d6efd; background-color: rgba(13, 110, 253, 0.2); }
                                </style>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Guardar',
                            cancelButtonText: 'Cancelar',
                            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                            didOpen: () => {
                                const boxes = document.querySelectorAll('.price-box');
                                const input = document.getElementById('custom-price-input');
                                boxes.forEach(box => {
                                    box.addEventListener('click', () => {
                                        boxes.forEach(b => b.classList.remove('selected'));
                                        box.classList.add('selected');
                                        input.value = box.getAttribute('data-price');
                                    });
                                });
                                input.addEventListener('input', () => {
                                    boxes.forEach(b => b.classList.remove('selected'));
                                });
                            },
                            preConfirm: () => {
                                let val = document.getElementById('custom-price-input').value;
                                if (!val || isNaN(val) || parseFloat(val) <= 0) {
                                    Swal.showValidationMessage('Selecciona o ingresa un precio válido');
                                    return false;
                                }
                                return parseFloat(val);
                            }
                        });
                        if (!precioIngresado) return;
                        precioDelProducto = parseFloat(precioIngresado);
                        nombreParaHistorial = `${productoEncontrado.nombre} (S/ ${precioDelProducto.toFixed(2)})`;
                    }
                }

                precioTotalFinal += (precioDelProducto * cantidadLocal);
                for (let i = 0; i < cantidadLocal; i++) itemsDeEstePedido.push(nombreParaHistorial);
            }

            precioTotalFinal = precioTotalFinal * cant;
            let textoAgrupadoSinFinal = [];
            for (let i = 0; i < cant; i++) textoAgrupadoSinFinal.push(...itemsDeEstePedido);

            function agruparTextos(texto) {
                let pts = texto.split(/(?:<br>|\+)/).map(p => p.trim()).filter(p => p !== "");
                let mapa = new Map();
                pts.forEach(p => {
                    let n = p, c = 1, match = p.match(/^(.*?)\s*\(\s*(\d+)\s*\)$/);
                    if (match && !p.includes("S/")) { n = match[1].trim(); c = parseInt(match[2], 10); }
                    mapa.set(n, (mapa.get(n) || 0) + c);
                });
                let res = [];
                mapa.forEach((c, n) => { res.push(c > 1 ? `${n} (${c})` : n); });
                return res.join(" + ");
            }

            let textoNuevoPedido = agruparTextos(textoAgrupadoSinFinal.join(" + "));

            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-cloud-arrow-up"></i> Guardando...';

            try {
                if (window.modoEdicionActiva) {
                    await updateDoc(doc(db, "consumos", window.modoEdicionActiva.id), {
                        productoNombre: textoNuevoPedido,
                        precio: precioTotalFinal,
                        fecha: fechaVal,
                        pagado: false
                    });
                    window.modoEdicionActiva = null;
                    btn.classList.remove("btn-success");
                    btn.classList.add("btn-primary");
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Consumo Editado', showConfirmButton: false, timer: 2000 });
                } else {
                    let indexExistente = historialConsumos.findIndex(r => r.fecha === fechaVal);
                    if (indexExistente !== -1) {
                        let reg = historialConsumos[indexExistente];
                        await updateDoc(doc(db, "consumos", reg.id), {
                            productoNombre: agruparTextos(reg.productoNombre + " + " + textoNuevoPedido),
                            precio: reg.precio + precioTotalFinal,
                            pagado: false
                        });
                    } else {
                        await addDoc(collection(db, "consumos"), {
                            nombreUsuario: nombreUsuario,
                            fecha: fechaVal,
                            productoNombre: textoNuevoPedido,
                            precio: precioTotalFinal,
                            timestamp: Date.now(),
                            pagado: false
                        });
                    }
                    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Agregado a la cuenta', showConfirmButton: false, timer: 2000 });
                }
                inputProducto.value = "";
                inputCantidad.value = "1";
                inputProducto.focus();
            } catch (e) { Swal.fire('Error', e.message, 'error'); }
            finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Agregar al registro';
            }
        };
    }

    let guardarAbono = async (metodo) => {
        if (!montoAbono) return;
        let monto = parseFloat(montoAbono.value);
        if (isNaN(monto) || monto <= 0) return;

        let fechaVal = fechaAbono.value;
        if (!fechaVal) return;

        let pagador = "";
        if (inputPagador) pagador = inputPagador.value.trim();

        let mesDestino = mesFiltro.value;
        if (mesDestino === "todos") mesDestino = new Date().getMonth().toString();

        try {
            if (btnAbonoYape) btnAbonoYape.disabled = true;
            if (btnAbonoEfectivo) btnAbonoEfectivo.disabled = true;

            await addDoc(collection(db, "pagos"), {
                nombreUsuario: nombreUsuario,
                monto: monto,
                fecha: fechaVal,
                metodo: metodo,
                pagador: pagador,
                mesAplicado: mesDestino,
                timestamp: Date.now()
            });

            montoAbono.value = "";
            if (inputPagador) inputPagador.value = "";
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Abono registrado', showConfirmButton: false, timer: 2000 });

        } catch (e) {
            Swal.fire('Error', 'Error al registrar pago: ' + e.message, 'error');
        } finally {
            if (btnAbonoYape) btnAbonoYape.disabled = false;
            if (btnAbonoEfectivo) btnAbonoEfectivo.disabled = false;
        }
    };

    if (btnAbonoYape) btnAbonoYape.addEventListener("click", () => guardarAbono("Yape"));
    if (btnAbonoEfectivo) btnAbonoEfectivo.addEventListener("click", () => guardarAbono("Efectivo"));

    window.eliminarRegistro = (id) => {
        Swal.fire({
            title: '<h3 class="fw-bold mb-0 text-danger">Confirmar Borrado</h3>',
            html: '<p class="fs-5 mt-3">¿Borrar este consumo del sistema?</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteDoc(doc(db, "consumos", id));
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Consumo borrado', showConfirmButton: false, timer: 2000 });
            }
        });
    };

    window.eliminarPago = (id) => {
        Swal.fire({
            title: '<h3 class="fw-bold mb-0 text-danger">Anular Pago</h3>',
            html: '<p class="fs-5 mt-3">La deuda pendiente se recalculará automáticamente.</p>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar',
            customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await deleteDoc(doc(db, "pagos", id));
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pago anulado', showConfirmButton: false, timer: 2000 });
            }
        });
    };

    let btnWhatsApp = document.getElementById("btnWhatsApp");
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener("click", () => {
            let mesSeleccionado = mesFiltro.value;
            let nombreMes = mesFiltro.options[mesFiltro.selectedIndex].text;
            let consumosDelMes = historialConsumos.filter(r => mesSeleccionado === "todos" || obtenerDatosSemana(r.fecha).mesEfectivo == mesSeleccionado);

            if (consumosDelMes.length === 0) { Swal.fire('Vacío', 'No hay consumos registrados en este mes para enviar.', 'info'); return; }

            let sumaTotal = consumosDelMes.reduce((acc, reg) => acc + reg.precio, 0);
            let horaActual = new Date().getHours();
            let saludo = horaActual < 12 ? "Buenos días" : horaActual < 19 ? "Buenas tardes" : "Buenas noches";

            let mensaje = `*REGISTRO DE CONSUMO EN EL QUIOSCO*\n\n`;

            if (rolUsuario === "alumnos") {
                mensaje += `¡${saludo}! Esperamos que se encuentren muy bien.\nLe hacemos entrega del detalle de los consumos recientes de su niño(a) *${nombreUsuario}* correspondientes a ${nombreMes}:\n\n`;
            } else {
                mensaje += `¡${saludo} *${nombreUsuario}*!\nLe compartimos el resumen de sus consumos realizados en el quiosco durante ${nombreMes}:\n\n`;
            }

            consumosDelMes.forEach(registro => {
                let [y, m, d] = registro.fecha.split('-');
                let fBonita = new Date(registro.fecha + 'T00:00:00');
                let diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                let detalleLimpio = registro.productoNombre.split(/<br>\s*\+?|<br>|\n/).map(item => item.trim().replace(/^\+\s*/, '')).filter(item => item !== '').join(" + ");
                mensaje += `- ${diasCortos[fBonita.getDay()]} ${d}/${m}: ${detalleLimpio} (S/ ${registro.precio.toFixed(2)})\n`;
            });

            mensaje += `\n*TOTAL A PAGAR: S/ ${sumaTotal.toFixed(2)}*\n\n*Datos para realizar el pago (Yape):*\n- Titular: Rosa Ro***\n\nLe agradecemos el envío de la captura del pago por este medio. ¡Muchas gracias y que tenga un buen día!`;
            window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
        });
    }

    let btnExportarPDF = document.getElementById("btnExportarPDF");

    if (btnExportarPDF) {
        btnExportarPDF.addEventListener("click", async () => {
            let mesSeleccionado = mesFiltro.value;
            let nombreMesHeader = mesFiltro.options[mesFiltro.selectedIndex].text;
            let consumosExportar = [];
            let tituloPeriodo = "";
            let fileNamePersonalizado = `Consumo_${nombreUsuario.replace(/ /g, "_")}`;

            if (mesSeleccionado === "todos") {
                let { isConfirmed } = await Swal.fire({
                    title: '<h3 class="fw-bold mb-0">Reporte Global</h3>',
                    html: '<p class="fs-5 mt-3">Vas a descargar el historial de TODOS los meses de este año. ¿Continuar?</p>',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: '<i class="bi bi-file-pdf"></i> Sí, descargar todo',
                    cancelButtonText: 'Cancelar',
                    customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' }
                });

                if (!isConfirmed) return;
                consumosExportar = historialConsumos;
                tituloPeriodo = "HISTÓRICO COMPLETO";
                fileNamePersonalizado += `_Global`;

            } else {
                let consumosDelMes = historialConsumos.filter(r => obtenerDatosSemana(r.fecha).mesEfectivo == mesSeleccionado);
                
                if (consumosDelMes.length === 0) {
                    Swal.fire({title: 'Vacío', text: 'No hay datos en este mes.', icon: 'info'});
                    return;
                }

                if (tipoCuentaActiva === 'semanal') {
                    let semanasUnicas = [...new Set(consumosDelMes.map(r => getGroupData(r.fecha, mesSeleccionado).numSemana))].sort((a,b) => a - b);
                    
                    let checkboxesHTML = semanasUnicas.map(s => `
                        <div class="form-check d-flex align-items-center mb-3">
                            <input class="form-check-input swal-week-checkbox shadow-sm me-3" type="checkbox" value="${s}" id="sem${s}" style="transform: scale(1.5); cursor: pointer;">
                            <label class="form-check-label fw-bold text-dark fs-5" for="sem${s}" style="cursor: pointer;">Semana 0${s}</label>
                        </div>
                    `).join('');

                    let { value: semanasElegidas, isConfirmed } = await Swal.fire({
                        title: '<h3 class="fw-bold mb-0 text-danger"><i class="bi bi-file-earmark-pdf-fill"></i> Crear PDF</h3>',
                        html: `
                            <p class="text-muted fs-6 mb-4">Selecciona las semanas de <b>${nombreMesHeader}</b> que deseas incluir en el reporte:</p>
                            <div class="bg-light p-4 rounded-4 border shadow-sm text-start mx-auto" style="max-width: 300px;">
                                <div class="form-check d-flex align-items-center mb-3 pb-3 border-bottom border-secondary border-opacity-25">
                                   <input class="form-check-input shadow-sm me-3" type="checkbox" id="selectAllWeeks" onchange="document.querySelectorAll('.swal-week-checkbox').forEach(cb => cb.checked = this.checked)" style="transform: scale(1.5); cursor: pointer;">
                                   <label class="form-check-label fw-bolder text-primary fs-5" for="selectAllWeeks" style="cursor: pointer;">Seleccionar Todo</label>
                                </div>
                                ${checkboxesHTML}
                            </div>
                        `,
                        showCancelButton: true,
                        confirmButtonText: '<i class="bi bi-cloud-download"></i> Descargar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#dc3545',
                        preConfirm: () => {
                            let selecciones = Array.from(document.querySelectorAll('.swal-week-checkbox:checked')).map(cb => parseInt(cb.value));
                            if (selecciones.length === 0) Swal.showValidationMessage('Debes elegir al menos una semana');
                            return selecciones;
                        },
                        customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                        didOpen: () => {
                            Swal.getConfirmButton().style.cssText = 'background-color: #dc3545 !important; color: white !important;';
                        }
                    });

                    if (!isConfirmed || !semanasElegidas) return;

                    consumosExportar = consumosDelMes.filter(r => semanasElegidas.includes(getGroupData(r.fecha, mesSeleccionado).numSemana));
                    
                    if (semanasElegidas.length === semanasUnicas.length) {
                        tituloPeriodo = `MES DE ${nombreMesHeader.toUpperCase()}`;
                        fileNamePersonalizado += `_${nombreMesHeader}`;
                    } else {
                        let numFormateados = semanasElegidas.map(s => `0${s}`).join(', ');
                        tituloPeriodo = `SEMANAS: ${numFormateados} - ${nombreMesHeader.toUpperCase()}`;
                        
                        if(semanasElegidas.length === 1) {
                            fileNamePersonalizado += `_Sem${semanasElegidas[0]}_${nombreMesHeader.substring(0,3)}`;
                        } else {
                            fileNamePersonalizado += `_Sems${semanasElegidas.join('-')}_${nombreMesHeader.substring(0,3)}`;
                        }
                    }
                } else {
                    let { isConfirmed } = await Swal.fire({
                        title: '<h3 class="fw-bold mb-0 text-danger"><i class="bi bi-file-earmark-pdf-fill"></i> Crear PDF</h3>',
                        html: `<p class="fs-5 mt-3">Generar reporte del mes de <b>${nombreMesHeader}</b> completo.</p>`,
                        showCancelButton: true,
                        confirmButtonText: '<i class="bi bi-cloud-download"></i> Descargar',
                        cancelButtonText: 'Cancelar',
                        confirmButtonColor: '#dc3545',
                        customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-danger btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                        didOpen: () => { Swal.getConfirmButton().style.cssText = 'background-color: #dc3545 !important; color: white !important;'; }
                    });
                    if(!isConfirmed) return;
                    consumosExportar = consumosDelMes;
                    tituloPeriodo = `MES DE ${nombreMesHeader.toUpperCase()}`;
                    fileNamePersonalizado += `_${nombreMesHeader}`;
                }
            }

            if (consumosExportar.length === 0) return;

            let sumaTotalPDF_Test = 0;
            consumosExportar.forEach((r) => {
                let grp = getGroupData(r.fecha, mesSeleccionado);
                let semanaDoc = semanasPagadas.find(s => s.idGrupo === grp.idGrupo);
                let itemPagado = r.pagado === true || (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp));
                if (!itemPagado) sumaTotalPDF_Test += r.precio;
            });

            let ocupacionTexto = etiquetaRolEl ? etiquetaRolEl.textContent : 'Personal';
            let tituloTotal = "TOTAL PENDIENTE";

            if (sumaTotalPDF_Test === 0) {
                let confZero = await Swal.fire({
                    title: '<h3 class="fw-bold mb-0">Periodo Cancelado</h3>',
                    html: `<p class="fs-5 mt-3">El reporte (${tituloPeriodo}) no tiene deudas.<br>¿Descargar comprobante?</p>`,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonColor: '#0d6efd',
                    confirmButtonText: 'Sí, descargar',
                    cancelButtonText: 'Cancelar',
                    customClass: { popup: 'rounded-4 py-4', confirmButton: 'btn btn-primary btn-lg rounded-pill px-4 fw-bold border-0 text-white', cancelButton: 'btn btn-secondary btn-lg rounded-pill px-4 fw-bold border-0 text-white' },
                    didOpen: () => { Swal.getConfirmButton().style.cssText = 'background-color: #0d6efd !important; color: white !important;'; }
                });
                if (!confZero.isConfirmed) return;
            }

            btnExportarPDF.innerHTML = '<i class="bi bi-hourglass-split"></i>...';
            btnExportarPDF.disabled = true;

            let grupoActualPDF = "";
            let semanaActualPDF = "";
            let filasHtml = "";

            consumosExportar.forEach((r, index) => {
                let grpData = getGroupData(r.fecha, mesSeleccionado);
                let [y, m, d] = r.fecha.split('-');
                let idGrupo = grpData.idGrupo;
                let semanaDoc = semanasPagadas.find(s => s.idGrupo === idGrupo);
                let itemPagado = r.pagado === true || (semanaDoc && (!r.timestamp || r.timestamp <= semanaDoc.timestamp));

                if (idGrupo !== grupoActualPDF) {
                    grupoActualPDF = idGrupo;
                    let itemsGrupo = consumosExportar.filter(x => getGroupData(x.fecha, mesSeleccionado).idGrupo === idGrupo);
                    let todosPagadosPDF = itemsGrupo.every(x => {
                        let s = semanasPagadas.find(sw => sw.idGrupo === idGrupo);
                        return x.pagado === true || (s && (!x.timestamp || x.timestamp <= s.timestamp));
                    });
                    let badgePDF = todosPagadosPDF ? `<span style="color: #198754; font-size: 11px; font-weight: normal;">(CANCELADA)</span>` : `<span style="color: #dc3545; font-size: 11px; font-weight: normal;">(PENDIENTE)</span>`;

                    filasHtml += `
                        <tr style="background-color: #f0f7fe; page-break-after: avoid;">
                            <td colspan="4" style="padding: 10px 15px; border-bottom: 2px solid #0d6efd; color: #0d6efd; font-weight: bold; font-size: 13px;">
                                ${grpData.textoCabecera} ${badgePDF}
                            </td>
                        </tr>
                    `;
                }

                let diasCortos = ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'];
                let fechaDisplay = new Date(r.fecha + 'T00:00:00');
                let bgFila = index % 2 === 0 ? "#fffffe" : "#fcfcfb";
                let tachado = itemPagado ? "text-decoration: line-through; color: #6c757c !important;" : "";

                if (tipoCuentaActiva === 'mensual') {
                    let claveSemana = `${idGrupo}_S${grpData.numSemana}`;
                    if (claveSemana !== semanaActualPDF) {
                        semanaActualPDF = claveSemana;
                        let subtotalSemana = consumosExportar
                            .filter(x => { let g = getGroupData(x.fecha, mesSeleccionado); return g.idGrupo === idGrupo && g.numSemana === grpData.numSemana; })
                            .reduce((acc, x) => acc + x.precio, 0);
                        filasHtml += `
                            <tr style="background-color: #f4f6f8; page-break-after: avoid;">
                                <td colspan="3" style="padding: 8px 15px 8px 30px; color: #6c757d; font-weight: bold; font-size: 12px; border-bottom: 1px solid #dee2e6;">Semana 0${grpData.numSemana}</td>
                                <td style="padding: 8px 15px; color: #6c757d; font-weight: bold; font-size: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">Subtotal: S/ ${subtotalSemana.toFixed(2)}</td>
                            </tr>
                        `;
                    }
                }

                filasHtml += `
                    <tr style="background-color: ${bgFila}; page-break-inside: avoid;">
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #000001; font-weight: bold; text-align: left; width: 10%; ${tachado}">${diasCortos[fechaDisplay.getDay()]}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #495057; text-align: left; width: 15%; ${tachado}">${d}/${m}/${y}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212528; text-align: left; width: 55%; font-size: 14px; ${tachado}">${r.productoNombre}</td>
                        <td style="padding: 12px 15px; border-bottom: 1px solid #dee2e6; color: #212528; width: 20%;">
                            <div style="display: flex; justify-content: space-between; width: 85px; margin-left: auto; font-weight: bold; font-size: 15px; ${tachado}">
                                <span>S/</span>
                                <span>${r.precio.toFixed(2)}</span>
                            </div>
                        </td>
                    </tr>
                `;

                let esUltimoDelGrupo = false;
                if (index === consumosExportar.length - 1) {
                    esUltimoDelGrupo = true;
                } else {
                    let nD = getGroupData(consumosExportar[index + 1].fecha, mesSeleccionado);
                    if (nD.idGrupo !== idGrupo) esUltimoDelGrupo = true;
                }

                if (esUltimoDelGrupo) {
                    let itemsGrupo = consumosExportar.filter(x => getGroupData(x.fecha, mesSeleccionado).idGrupo === idGrupo);
                    let totalSemanaPDF = 0;
                    itemsGrupo.forEach(x => { totalSemanaPDF += x.precio; });

                    filasHtml += `
                        <tr style="background-color: #fdf2f2; page-break-inside: avoid;">
                            <td colspan="3" style="padding: 10px 15px; text-align: right; font-size: 13px; color: #dc3545; font-weight: bold; border-bottom: 2px solid #dee2e6;">Total consumido en el periodo:</td>
                            <td style="padding: 10px 15px; border-bottom: 2px solid #dee2e6; color: #dc3545; font-weight: bold;">
                                <div style="display: flex; justify-content: space-between; width: 85px; margin-left: auto;">
                                    <span>S/</span><span>${totalSemanaPDF.toFixed(2)}</span>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            });

            let reciboPDF = document.createElement("div");
            reciboPDF.innerHTML = `
                <div style="width: 1120px; padding: 20px 40px; box-sizing: border-box; font-family: Arial, sans-serif; background-color: #fffffe; color: #000001;">
                    <div style="text-align: center; border-bottom: 3px solid #0d6efd; padding-bottom: 10px; margin-bottom: 15px;">
                        <div style="color: #0d6efd; margin: 0; font-size: 32px; font-weight: 900;">Quiosco</div>
                        <div style="color: #6c757d; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; font-weight: bold;">REPORTE DE CONSUMO - ${tituloPeriodo}</div>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #f8f9fb; border: 1px solid #dee2e6; color: #212528;">
                        <tr style="text-align: center;">
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>CLIENTE:</strong><br>${nombreUsuario}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>OCUPACIÓN:</strong><br>${ocupacionTexto}</td>
                            <td style="padding: 15px 10px; border-right: 1px solid #dee2e6; width: 25%;"><strong>PERIODO:</strong><br>${tituloPeriodo}</td>
                            <td style="padding: 15px 10px; width: 25%;"><strong>EMISIÓN:</strong><br>${new Date().toLocaleDateString('es-PE')}</td>
                        </tr>
                    </table>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                        <thead>
                            <tr style="background-color: #0d6efd; color: #fffffe;">
                                <th style="padding: 12px 15px; text-align: left; width: 10%;">Día</th>
                                <th style="padding: 12px 15px; text-align: left; width: 15%;">Fecha</th>
                                <th style="padding: 12px 15px; text-align: left; width: 55%;">Detalle de Consumo</th>
                                <th style="padding: 12px 15px; text-align: right; width: 20%;">Importe</th>
                            </tr>
                        </thead>
                        <tbody>${filasHtml}</tbody>
                    </table>
                    <div style="page-break-inside: avoid;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="width: 48%; padding-right: 15px;">
                                    <table style="width: 100%; background: #742384; border-radius: 12px; color: #fffffe; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="padding: 20px; vertical-align: middle; text-align: left;">
                                                <div style="font-size: 20px; font-weight: 900;">YAPE</div>
                                                <p style="margin: 0; font-size: 14px;">TITULAR: ROSA RO***</p>
                                            </td>
                                            <td style="padding: 20px; vertical-align: middle; text-align: right; width: 110px;">
                                                <table style="background: #fffffe; border-radius: 8px; width: 90px; height: 90px; border-collapse: collapse; margin-left: auto;">
                                                    <tr>
                                                        <td style="text-align: center; vertical-align: middle; padding: 0;">
                                                            <img src="yape.png" style="width: 75px; height: 75px; display: block; margin: 0 auto;">
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                                <td style="width: 52%; padding-left: 15px;">
                                    <table style="width: 100%; background-color: #e9ecef; border-radius: 12px; border: 1px solid #dee2e6; border-collapse: collapse; height: 120px;">
                                        <tr>
                                            <td style="text-align: center; vertical-align: middle; padding: 20px;">
                                                <div style="margin: 0 0 5px 0; color: #212528; font-weight: 900; font-size: 18px; letter-spacing: 0.5px; text-transform: uppercase;">${tituloTotal}</div>
                                                <div style="margin: 0; font-size: 42px; color: #0d6efd; font-weight: 900;">S/ ${sumaTotalPDF_Test.toFixed(2)}</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                        <div style="text-align: center; color: #495057; font-size: 15px; margin-top: 25px; font-weight: bold; font-style: italic;">
                            <p>Se agradece el pronto pago de su cuenta, Tenga un excelente día.</p>
                        </div>
                    </div>
                </div>
            `;

            let opcionesPDF = {
                margin: [5, 0, 10, 0],
                filename: `${fileNamePersonalizado}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { scale: 2, useCORS: true, width: 1120, windowWidth: 1120, x: 0, y: 0, scrollX: 0, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opcionesPDF).from(reciboPDF).save().then(() => {
                btnExportarPDF.innerHTML = '<i class="bi bi-file-earmark-pdf-fill"></i> PDF';
                btnExportarPDF.disabled = false;
            }).catch(error => {
                btnExportarPDF.disabled = false;
            });
        });
    }

    let navbar = document.getElementById("main-navbar");
    let ultimoScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (navbar) {
        window.addEventListener("scroll", () => {
            let scrollActual = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollActual > ultimoScroll && scrollActual > 60) {
                navbar.style.top = `-${navbar.offsetHeight}px`;
            } else {
                navbar.style.top = "0";
            }
            ultimoScroll = scrollActual <= 0 ? 0 : scrollActual;
        });
    }
});