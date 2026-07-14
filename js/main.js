const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const featuredGrid = document.getElementById('featuredGrid');
const productFilters = document.getElementById('productFilters');
const productGrid = document.getElementById('productGrid');
const productCount = document.getElementById('productCount');
const siteAppBackground = document.getElementById('siteAppBackground');

let filterButtons = [];
let productCards = [];

const featuredProductNames = ['Piggy Accounting', 'AI Voice Notes', 'AI Calendar'];
const categoryOrder = ['productivity', 'wellness', 'utility', 'learning', 'lifestyle', 'finance'];
const categoryLabels = new Map([
    ['productivity', 'Productivity'],
    ['wellness', 'Wellness'],
    ['utility', 'Utility'],
    ['learning', 'Learning'],
    ['lifestyle', 'Lifestyle'],
    ['finance', 'Finance']
]);

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

function closeNavigation() {
    if (navMenu) {
        navMenu.classList.remove('active');
    }

    if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
    }
}

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', event => {
        if (!navMenu.classList.contains('active')) {
            return;
        }

        const target = event.target;
        if (target instanceof Node && !navMenu.contains(target) && !navToggle.contains(target)) {
            closeNavigation();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeNavigation();
            navToggle.focus();
        }
    });
}

function getHashTarget(href) {
    if (!href || href.length <= 1 || !href.startsWith('#')) {
        return null;
    }

    return document.getElementById(href.slice(1));
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
        const href = anchor.getAttribute('href');
        const target = getHashTarget(href);

        if (!target) {
            return;
        }

        event.preventDefault();
        closeNavigation();
        target.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });

        if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1');
        }

        target.focus({ preventScroll: true });
        if (window.location.hash !== href) {
            history.pushState(null, '', href);
        }
    });
});

function secureExternalLinks(root = document) {
    root.querySelectorAll('a[target="_blank"]').forEach(link => {
        const rel = new Set((link.rel || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.rel = Array.from(rel).join(' ');
    });
}

secureExternalLinks();

const year = document.getElementById('currentYear');
if (year) {
    year.textContent = new Date().getFullYear();
}

function parseEmbeddedProducts() {
    const embeddedProducts = document.getElementById('productData');
    if (!embeddedProducts || !embeddedProducts.textContent) {
        return [];
    }

    try {
        const parsed = JSON.parse(embeddedProducts.textContent);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function normalizeProducts(products) {
    return products
        .filter(product => product && product.name && product.icon && product.url)
        .map(product => ({
            name: product.name,
            category: product.category || 'Utility',
            group: product.group || 'utility',
            icon: product.icon,
            description: product.description || '',
            url: product.url
        }));
}

async function loadProducts() {
    const embeddedProducts = normalizeProducts(parseEmbeddedProducts());

    if (window.location.protocol === 'file:' && embeddedProducts.length) {
        return embeddedProducts;
    }

    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Product data unavailable');
        }

        const products = await response.json();
        const normalizedProducts = normalizeProducts(products);
        if (normalizedProducts.length) {
            return normalizedProducts;
        }
    } catch (error) {
        if (embeddedProducts.length) {
            return embeddedProducts;
        }
    }

    throw new Error('Product data unavailable');
}

function getCategoryClass(group) {
    return categoryLabels.has(group) ? group : 'utility';
}

function createIconImage(product, size = 120, lazy = true) {
    const image = document.createElement('img');
    image.src = product.icon;
    image.alt = `${product.name} icon`;
    image.width = size;
    image.height = size;
    image.decoding = 'async';

    if (lazy) {
        image.loading = 'lazy';
    }

    return image;
}

function createProductLink(product, label = 'Agent site') {
    const link = document.createElement('a');
    link.href = product.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;
    link.setAttribute('aria-label', `Open ${product.name} agent site`);
    return link;
}

function createCategoryBadge(product) {
    const category = document.createElement('span');
    category.className = `category ${getCategoryClass(product.group)}`;
    category.textContent = product.category;
    return category;
}

function createFeaturedProductCard(product) {
    const card = document.createElement('article');
    card.className = 'featured-product';

    const content = document.createElement('div');
    const title = document.createElement('h3');
    const description = document.createElement('p');
    const links = document.createElement('div');

    title.textContent = product.name;
    description.textContent = product.description;
    links.className = 'product-links';
    links.append(createProductLink(product));

    content.append(createCategoryBadge(product), title, description, links);
    card.append(createIconImage(product, 120, false), content);
    return card;
}

function renderFeaturedProducts(products) {
    if (!featuredGrid) {
        return;
    }

    const productsByName = new Map(products.map(product => [product.name, product]));
    const featuredProducts = featuredProductNames
        .map(name => productsByName.get(name))
        .filter(Boolean);

    featuredGrid.replaceChildren(...featuredProducts.map(createFeaturedProductCard));
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.group = product.group;

    const title = document.createElement('h3');
    const description = document.createElement('p');
    const links = document.createElement('div');

    title.textContent = product.name;
    description.textContent = product.description;
    links.className = 'product-links';
    links.append(createProductLink(product, 'Website'));

    card.append(createIconImage(product), createCategoryBadge(product), title, description, links);
    return card;
}

function createFilterButton(filter, label, count) {
    const button = document.createElement('button');
    const labelText = document.createElement('span');
    const countText = document.createElement('span');

    button.className = 'filter-chip';
    button.type = 'button';
    button.dataset.filter = filter;
    button.setAttribute('aria-pressed', 'false');

    labelText.textContent = label;
    countText.className = 'filter-count';
    countText.textContent = String(count);

    button.append(labelText, countText);
    button.addEventListener('click', () => {
        updateProductFilter(filter);
    });

    return button;
}

function renderFilters(products) {
    if (!productFilters) {
        return;
    }

    const groupCounts = products.reduce((counts, product) => {
        counts.set(product.group, (counts.get(product.group) || 0) + 1);
        return counts;
    }, new Map());

    const sortedGroups = Array.from(groupCounts.keys()).sort((first, second) => {
        const firstIndex = categoryOrder.indexOf(first);
        const secondIndex = categoryOrder.indexOf(second);
        return (firstIndex === -1 ? 99 : firstIndex) - (secondIndex === -1 ? 99 : secondIndex);
    });

    const buttons = [
        createFilterButton('all', 'All', products.length),
        ...sortedGroups.map(group => createFilterButton(group, categoryLabels.get(group) || group, groupCounts.get(group)))
    ];

    productFilters.replaceChildren(...buttons);
    filterButtons = buttons;
}

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
        productCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'agent surface' : 'agent surfaces'}`;
    }
}

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
    const rows = ambientRows
        .map(rowConfig => {
            const rowProducts = rowConfig.products
                .map(name => productsByName.get(name))
                .filter(Boolean);

            if (!rowProducts.length) {
                return null;
            }

            const row = document.createElement('div');
            const track = document.createElement('div');

            row.className = 'ambient-row';
            row.style.setProperty('--duration', rowConfig.duration);
            row.style.setProperty('--offset', rowConfig.offset);
            row.style.setProperty('--row-top', rowConfig.top);

            track.className = 'ambient-track';
            track.append(createAmbientGroup(rowProducts), createAmbientGroup(rowProducts));
            row.append(track);
            return row;
        })
        .filter(Boolean);

    siteAppBackground.replaceChildren(...rows);
}

function renderProductError() {
    if (!productGrid) {
        return;
    }

    const message = document.createElement('p');
    message.className = 'product-fallback';
    message.textContent = 'Agent data is temporarily unavailable. Featured agents and contact links remain available.';
    productGrid.replaceChildren(message);
}

async function renderProducts() {
    if (!productGrid) {
        return;
    }

    productGrid.setAttribute('aria-busy', 'true');

    try {
        const products = await loadProducts();
        renderAmbientBackground(products);
        renderFeaturedProducts(products);
        renderFilters(products);
        productGrid.replaceChildren(...products.map(createProductCard));
        productCards = Array.from(productGrid.querySelectorAll('.product-card'));
        secureExternalLinks(productGrid);
        secureExternalLinks(featuredGrid || document);
        updateProductFilter('all');
    } catch (error) {
        renderProductError();
    } finally {
        productGrid.setAttribute('aria-busy', 'false');
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

// Hero metric count-up
(function initCountUp() {
    const counters = Array.from(document.querySelectorAll('[data-count-to]'));
    if (!counters.length) {
        return;
    }

    if (prefersReducedMotion) {
        counters.forEach(el => { el.textContent = el.dataset.countTo; });
        return;
    }

    const animate = (el) => {
        const target = parseInt(el.dataset.countTo, 10) || 0;
        const duration = 1100;
        const start = performance.now();
        const step = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = String(Math.round(target * eased));
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = String(target);
            }
        };
        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach(el => { el.textContent = '0'; countObserver.observe(el); });
    } else {
        counters.forEach(animate);
    }
})();

// Scroll progress bar + nav shadow
(function initScrollUI() {
    const progress = document.getElementById('scrollProgress');
    const navbar = document.querySelector('.navbar');

    const onScroll = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
        if (progress) {
            progress.style.width = `${ratio * 100}%`;
        }
        if (navbar) {
            navbar.classList.toggle('scrolled', scrollTop > 8);
        }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
})();

// Active-section nav highlight (scroll-spy)
(function initScrollSpy() {
    if (!('IntersectionObserver' in window)) {
        return;
    }

    const links = Array.from(document.querySelectorAll('.nav-link'));
    const sectionToLink = new Map();
    links.forEach(link => {
        const id = (link.getAttribute('href') || '').slice(1);
        const section = id && document.getElementById(id);
        if (section) {
            sectionToLink.set(section, link);
        }
    });

    if (!sectionToLink.size) {
        return;
    }

    const visible = new Set();
    const setActive = () => {
        let best = null;
        let bestTop = Infinity;
        visible.forEach(section => {
            const top = section.getBoundingClientRect().top;
            if (top < bestTop) {
                bestTop = top;
                best = section;
            }
        });
        links.forEach(link => link.classList.remove('active'));
        if (best && sectionToLink.has(best)) {
            sectionToLink.get(best).classList.add('active');
        }
    };

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visible.add(entry.target);
            } else {
                visible.delete(entry.target);
            }
        });
        setActive();
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sectionToLink.forEach((_, section) => spy.observe(section));
})();
