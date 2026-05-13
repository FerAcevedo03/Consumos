document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement; // Etiqueta <html>

    // 1. Revisar si hay un tema guardado en la memoria del navegador
    const savedTheme = localStorage.getItem('theme');
    
    // Si no hay nada guardado, revisar si la PC/Celular del usuario está en modo oscuro
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Definir el tema inicial
    const currentTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
    
    // Aplicar el tema al iniciar
    setTheme(currentTheme);

    // 2. Evento del botón para alternar
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = htmlElement.getAttribute('data-bs-theme') === 'dark';
            const newTheme = isDark ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    // 3. Función maestra que hace los cambios
    function setTheme(theme) {
        // Le avisa a Bootstrap que cambie sus colores internos
        htmlElement.setAttribute('data-bs-theme', theme);
        
        // Lo guarda en memoria para que no se pierda al cambiar de página
        localStorage.setItem('theme', theme);
        
        // Cambia el icono visualmente
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.className = 'bi bi-sun-fill text-warning'; // Sol amarillo en modo oscuro
            } else {
                themeIcon.className = 'bi bi-moon-fill text-dark'; // Luna oscura en modo claro
            }
        }
    }
});