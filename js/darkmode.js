
const temaGuardado = localStorage.getItem("tema_nobel");

if (temaGuardado === "dark") {
    document.documentElement.setAttribute("data-bs-theme", "dark");
} else if (temaGuardado === "light") {
    document.documentElement.setAttribute("data-bs-theme", "light");
} else {
    // Si es su primera vez, detecta si su celular ya está en modo oscuro
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute("data-bs-theme", "dark");
    }
}


document.addEventListener("DOMContentLoaded", () => {
    // Busca el botón, sin importar si estás en index.html o en consumo.html
    const btnTheme = document.getElementById("theme-toggle") || document.getElementById("btnDarkMode");
    
    function actualizarIcono(tema) {
        if (!btnTheme) return;
        const icono = btnTheme.querySelector("i");
        if (!icono) return;

        if (tema === "dark") {
            icono.className = "bi bi-sun-fill";
            icono.style.color = "#ffc107"; // Sol amarillo
        } else {
            icono.className = "bi bi-moon-fill";
            icono.style.color = ""; 
        }
    }

  
    actualizarIcono(document.documentElement.getAttribute("data-bs-theme"));

    if (btnTheme) {
        btnTheme.addEventListener("click", () => {
            let temaActual = document.documentElement.getAttribute("data-bs-theme");
            let nuevoTema = temaActual === "dark" ? "light" : "dark";
            
            document.documentElement.setAttribute("data-bs-theme", nuevoTema);
            localStorage.setItem("tema_nobel", nuevoTema);
            actualizarIcono(nuevoTema);
        });
    }
});