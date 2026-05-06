document.addEventListener("DOMContentLoaded", () => {
    const listaPersonas = document.getElementById("listaPersonas");
    const btnAgregar = document.getElementById("btnAgregar");
    const inputNuevo = document.getElementById("nuevoNombre");
    const buscadorNombres = document.getElementById("buscadorNombres"); 

    // 1.BLINDAJE: Verificamos que los botones existan en el HTML
    if (!listaPersonas || !btnAgregar || !inputNuevo) {
        console.error("Error: No se encontraron los campos en el HTML.");
        return; 
    }

    // 2.Detectar en qué página estamos (Profes, Alumnos o Admin)
    let tipo = document.body.getAttribute("data-tipo");
    
    // Si el HTML no tiene el data-tipo, lo deducimos por el nombre del archivo (Respaldo)
    if (!tipo) {
        if (window.location.href.includes("alumnos")) tipo = "alumnos";
        else if (window.location.href.includes("administrativos")) tipo = "administrativos";
        else tipo = "profesores"; 
    }

    const storageKey = `lista_${tipo}`;

    // 3. BLINDAJE ANTI-DATOS CORRUPTOS: Cargar de localStorage
    let personas = [];
    try {
        const guardado = JSON.parse(localStorage.getItem(storageKey));
        // Verificamos que lo que haya guardado sea realmente una lista (Array)
        if (Array.isArray(guardado)) {
            personas = guardado;
        } else {
            personas = []; // Si era un texto o un error, empezamos de cero
        }
    } catch (e) {
        personas = []; // Si el JSON está roto, empezamos de cero
    }

    // Función para mostrar las tarjetas
    function mostrarPersonas(personasAMostrar = personas) {
        listaPersonas.innerHTML = "";

        if (personasAMostrar.length === 0) {
            listaPersonas.innerHTML = `<div class="col-12 text-center text-muted mt-4"><i class="bi bi-search fs-3 d-block mb-2"></i> No se encontraron registros.</div>`;
            return;
        }

        personasAMostrar.forEach((persona) => {
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

    // Evento del buscador 
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
            personas.sort((a, b) => a.localeCompare(b)); // Ordenar alfabéticamente
            
            // Forzamos el guardado
            localStorage.setItem(storageKey, JSON.stringify(personas));
            
            inputNuevo.value = "";
            if (buscadorNombres) buscadorNombres.value = ""; 
            mostrarPersonas();
        } else {
            alert("Por favor escribe un nombre válido.");
        }
    }

    // Eliminar persona
    window.eliminarPersona = (index) => {
        if(confirm("¿Seguro que deseas eliminar este registro? (Se mantendrá su historial de consumos guardado)")) {
            personas.splice(index, 1);
            localStorage.setItem(storageKey, JSON.stringify(personas));
            
            if (buscadorNombres) buscadorNombres.dispatchEvent(new Event('input')); 
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