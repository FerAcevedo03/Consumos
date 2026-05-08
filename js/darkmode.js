// aplicar tema oscuro
const temaGuardado = localStorage.getItem("tema_nobel");
if (temaGuardado === "dark") {
    document.documentElement.setAttribute("data-bs-theme", "dark");
} else {
    document.documentElement.setAttribute("data-bs-theme", "light");
}

// configuracion de boton 
document.addEventListener("DOMContentLoaded", () => {
    const btnDarkMode = document.getElementById("btnDarkMode");
    if (!btnDarkMode) return;

    // actualizacion del icono inicial
    actualizarIcono(document.documentElement.getAttribute("data-bs-theme"));

    btnDarkMode.addEventListener("click", () => {
        let actual = document.documentElement.getAttribute("data-bs-theme");
        let nuevo = (actual === "dark") ? "light" : "dark";

        document.documentElement.setAttribute("data-bs-theme", nuevo);
        localStorage.setItem("tema_nobel", nuevo);
        actualizarIcono(nuevo);
    });

    function actualizarIcono(tema) {
        btnDarkMode.innerHTML = (tema === "dark") 
            ? '<i class="bi bi-sun-fill text-warning"></i>' 
            : '<i class="bi bi-moon-fill"></i>';
    }
});
