document.addEventListener("DOMContentLoaded", () => {
    const listaPersonas = document.getElementById("listaPersonas");
    const btnAgregar = document.getElementById("btnAgregar");
    const inputNuevo = document.getElementById("nuevoNombre");
    const buscadorNombres = document.getElementById("buscadorNombres"); // El nuevo buscador
    
    // Detecta qué tipo de persona estamos gestionando (profesores, alumnos, administrativos)
    const tipo = document.body.getAttribute("data-tipo"); 
    const storageKey = `lista_${tipo}`;

    // Cargar de localStorage o iniciar vacío
    let personas = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Función para mostrar las tarjetas. Recibe un array (por defecto todos)
    function mostrarPersonas(personasAMostrar = personas) {
        listaPersonas.innerHTML = "";

        if (personasAMostrar.length === 0) {
            listaPersonas.innerHTML = `<div class="col-12 text-center text-muted mt-4"><i class="bi bi-search fs-3 d-block mb-2"></i> No se encontraron registros.</div>`;
            return;
        }

        personasAMostrar.forEach((persona) => {
            // Guardamos el índice original para evitar errores al eliminar buscando
            const indexOriginal = personas.indexOf(persona);
            
            let col = document.createElement("div");
            col.className = "col-md-4";
            col.innerHTML = `
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold text-dark">${persona}</h5>
                        <p class="card-text flex-grow-1 text-muted small">Registrado en sistema.</p>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-primary btn-sm" onclick="verConsumo('${persona}', '${tipo}')"><i class="bi bi-bar-chart-fill"></i> Consumos</button>
                            <button class="btn btn-outline-danger btn-sm" onclick="eliminarPersona(${indexOriginal})"><i class="bi bi-trash"></i> Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
            listaPersonas.appendChild(col);
        });
    }

    // Evento del buscador en tiempo real
    if (buscadorNombres) {
        buscadorNombres.addEventListener("input", (e) => {
            const textoBusqueda = e.target.value.toLowerCase().trim();
            const personasFiltradas = personas.filter(p => p.toLowerCase().includes(textoBusqueda));
            mostrarPersonas(personasFiltradas);
        });
    }

    // Agregar nueva persona
    btnAgregar.addEventListener("click", agregarPersona);
    inputNuevo.addEventListener("keypress", (e) => { if (e.key === "Enter") agregarPersona(); });

    function agregarPersona() {
        const nombre = inputNuevo.value.trim();
        if (nombre !== "") {
            personas.push(nombre);
            // Ordenar alfabéticamente para mantener el orden
            personas.sort((a, b) => a.localeCompare(b));
            
            localStorage.setItem(storageKey, JSON.stringify(personas));
            inputNuevo.value = "";
            
            if (buscadorNombres) buscadorNombres.value = ""; // Limpiar buscador
            mostrarPersonas();
        } else {
            alert("Por favor escribe un nombre válido.");
        }
    }

    // Eliminar persona
    window.eliminarPersona = (index) => {
        if(confirm("¿Seguro que deseas eliminar este registro? (Se mantendrá su historial de consumos guardado por seguridad)")) {
            personas.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(personas));
            
            if (buscadorNombres) buscadorNombres.dispatchEvent(new Event('input')); // Mantener filtro activo
            else mostrarPersonas();
        }
    };

    // Redirigir a consumos
    window.verConsumo = (nombre, rol) => {
        window.location.href = `consumo.html?nombre=${encodeURIComponent(nombre)}&rol=${encodeURIComponent(rol)}`;
    };

    // Renderizar al iniciar
    mostrarPersonas();
});