// 1. Aplicar el tema inmediatamente (evita el parpadeo blanco)
const temaGuardado = localStorage.getItem("tema_nobel");
if (temaGuardado === "dark") {
    document.documentElement.setAttribute("data-bs-theme", "dark");
} else {
    document.documentElement.setAttribute("data-bs-theme", "light");
}

// 2. Configurar el botón cuando cargue el DOM
document.addEventListener("DOMContentLoaded", () => {
    const btnDarkMode = document.getElementById("btnDarkMode");
    if (!btnDarkMode) return;

    // Actualizar icono inicial
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