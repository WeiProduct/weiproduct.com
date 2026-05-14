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
const siteAppBackground = document.getElementById('siteAppBackground');
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

const ambientRows = [
    {
        duration: '118s',
        offset: '-8%',
        top: '9%',
        products: ['Piggy Accounting', 'AI Weather', 'Food Calories', 'AI Smart Light', 'AI Daily Matters', 'AI Note']
    },
    {
        duration: '132s',
        offset: '-27%',
        top: '31%',
        products: ['AI Calendar', 'AI Pomodoro Timer', 'Dating Chat', 'Meditation', 'AIMBTI', 'AI Voice Notes']
    },
    {
        duration: '124s',
        offset: '-15%',
        top: '54%',
        products: ['Habits', 'AI Vocabulary', 'AI Platform', 'Dailymatters', 'AI Drink Water', 'AI Calendar']
    },
    {
        duration: '146s',
        offset: '-34%',
        top: '77%',
        products: ['AI Voice Notes', 'Food Calories', 'AI Pomodoro Timer', 'AI Smart Light', 'AI Weather', 'Piggy Accounting']
    }
];

function createAmbientIcon(product) {
    const image = document.createElement('img');
    image.className = 'ambient-icon';
    image.src = product.icon;
    image.alt = '';
    image.width = 120;
    image.height = 120;
    image.decoding = 'async';
    image.loading = 'lazy';
    return image;
}

function createAmbientGroup(products) {
    const group = document.createElement('div');
    group.className = 'ambient-group';
    group.append(...products.map(createAmbientIcon));
    return group;
}

function renderAmbientBackground(products) {
    if (!siteAppBackground) {
        return;
    }

    const productsByName = new Map(products.map(product => [product.name, product]));
    const rows = ambientRows.map(rowConfig => {
        const rowProducts = rowConfig.products
            .map(name => productsByName.get(name))
            .filter(Boolean);

        const row = document.createElement('div');
        row.className = 'ambient-row';
        row.style.setProperty('--duration', rowConfig.duration);
        row.style.setProperty('--offset', rowConfig.offset);
        row.style.setProperty('--row-top', rowConfig.top);

        const track = document.createElement('div');
        track.className = 'ambient-track';
        track.append(createAmbientGroup(rowProducts), createAmbientGroup(rowProducts));
        row.append(track);
        return row;
    });

    siteAppBackground.replaceChildren(...rows);
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
        renderAmbientBackground(products);
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
