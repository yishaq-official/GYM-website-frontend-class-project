document.addEventListener('DOMContentLoaded', () => {
    
    // --- Initialize AOS (Animate On Scroll) ---
    AOS.init({
        duration: 800, // Animation duration in ms
        once: true,    // Whether animation should happen only once
        offset: 100    // Offset (in px) from the original trigger point
    });

    // --- Dark Mode Logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');

    // Check saved preference
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Navbar Collapse on Mobile Click ---
    // Since we are using Bootstrap, we just need to ensure the menu closes 
    // when a link is clicked on mobile.
    const navLinks = document.querySelectorAll('.nav-link');
    const navbarCollapse = document.getElementById('navbarNav');
    const bsCollapse = new bootstrap.Collapse(navbarCollapse, {toggle: false});

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) { // 992px is Bootstrap's LG breakpoint
                bsCollapse.hide();
            }
        });
    });
});