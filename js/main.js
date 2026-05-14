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

const productGrid = document.getElementById('productGrid');
const productCount = document.getElementById('productCount');
const filterButtons = Array.from(document.querySelectorAll('.filter-chip'));
let productCards = [];

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

function getCategoryClass(group) {
    const allowed = new Set(['finance', 'productivity', 'wellness', 'utility', 'learning', 'lifestyle']);
    return allowed.has(group) ? group : 'utility';
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.group = product.group;

    const image = document.createElement('img');
    image.src = product.icon;
    image.alt = `${product.name} icon`;
    image.width = 120;
    image.height = 120;
    image.decoding = 'async';
    image.loading = 'lazy';

    const category = document.createElement('span');
    category.className = `category ${getCategoryClass(product.group)}`;
    category.textContent = product.category;

    const title = document.createElement('h3');
    title.textContent = product.name;

    const description = document.createElement('p');
    description.textContent = product.description;

    const links = document.createElement('div');
    links.className = 'product-links';

    const link = document.createElement('a');
    link.href = product.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Website';
    links.append(link);

    card.append(image, category, title, description, links);
    return card;
}

async function renderProducts() {
    if (!productGrid) {
        return;
    }

    try {
        const response = await fetch('products.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Product data unavailable');
        }
        const products = await response.json();
        productGrid.replaceChildren(...products.map(createProductCard));
        productCards = Array.from(productGrid.querySelectorAll('.product-card'));
        updateProductFilter('all');
    } catch (error) {
        productGrid.innerHTML = '<p class="product-fallback">Product portfolio is temporarily unavailable. Please use the featured product links above.</p>';
    }
}

renderProducts();

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
