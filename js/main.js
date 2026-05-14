const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!expanded));
    });
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu) {
            navMenu.classList.remove('active');
        }
        if (navToggle) {
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
});

document.querySelectorAll('a[target="_blank"]').forEach(link => {
    const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    link.rel = Array.from(rel).join(' ');
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) {
            return;
        }

        event.preventDefault();
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

const year = document.getElementById('currentYear');
if (year) {
    year.textContent = new Date().getFullYear();
}

const filterButtons = Array.from(document.querySelectorAll('.filter-chip'));
const productCards = Array.from(document.querySelectorAll('.product-card'));
const productCount = document.getElementById('productCount');

function updateProductFilter(filter) {
    let visibleCount = 0;

    productCards.forEach(card => {
        const isVisible = filter === 'all' || card.dataset.group === filter;
        card.hidden = !isVisible;
        if (isVisible) {
            visibleCount += 1;
        }
    });

    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    if (productCount) {
        productCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'product' : 'products'}`;
    }
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        updateProductFilter(button.dataset.filter || 'all');
    });
});

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    document.querySelectorAll('section:not(.hero)').forEach(section => {
        section.classList.add('reveal-section');
        observer.observe(section);
    });
}
