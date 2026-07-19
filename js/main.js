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
            url: product.url,
            appStoreUrl: product.appStoreUrl || ''
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

// ADDED: official-style "Download on the App Store" badge (inline SVG)
function createAppStoreBadge(product) {
    if (!product.appStoreUrl) {
        return null;
    }

    const link = document.createElement('a');
    link.className = 'appstore-badge';
    link.href = product.appStoreUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Download ${product.name} on the App Store`);
    link.innerHTML = [
        '<svg viewBox="0 0 120 40" role="img" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">',
        '<rect x="0.6" y="0.6" width="118.8" height="38.8" rx="6.6" fill="#000000" stroke="#8E8E93" stroke-width="1.2"/>',
        '<g fill="#ffffff" transform="translate(8 8.5) scale(0.8)">',
        '<path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.29 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.71-1.04-2.74-4.13z"/>',
        '<path d="M14.62 4.44c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z"/>',
        '</g>',
        '<text x="35" y="16.5" fill="#ffffff" font-family="Inter, -apple-system, Helvetica, Arial, sans-serif" font-size="6.6" font-weight="500">Download on the</text>',
        '<text x="34.4" y="30.5" fill="#ffffff" font-family="Inter, -apple-system, Helvetica, Arial, sans-serif" font-size="12.6" font-weight="600" letter-spacing="-0.3">App Store</text>',
        '</svg>'
    ].join('');
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
    const featuredBadge = createAppStoreBadge(product);
    if (featuredBadge) {
        links.append(featuredBadge);
    }

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
    const cardBadge = createAppStoreBadge(product);
    if (cardBadge) {
        links.append(cardBadge);
    }

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

// ADDED: dark-mode toggle (persisted + prefers-color-scheme; theme applied pre-paint in <head>)
(function initThemeToggle() {
    const root = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    const STORAGE_KEY = 'weiproduct-theme';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const themeColors = { light: '#0f172a', dark: '#0b1120' };

    const currentTheme = () => (root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

    function applyTheme(theme, persist) {
        root.setAttribute('data-theme', theme);
        if (toggle) {
            toggle.setAttribute('aria-pressed', String(theme === 'dark'));
            toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        const meta = document.querySelector('meta[name="theme-color"]:not([media])');
        if (meta) {
            meta.setAttribute('content', themeColors[theme]);
        }
        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, theme); } catch (error) {}
        }
    }

    applyTheme(currentTheme(), false);

    if (toggle) {
        toggle.addEventListener('click', () => {
            applyTheme(currentTheme() === 'dark' ? 'light' : 'dark', true);
        });
    }

    const onMediaChange = event => {
        let saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (error) {}
        if (!saved) {
            applyTheme(event.matches ? 'dark' : 'light', false);
        }
    };
    if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', onMediaChange);
    } else if (typeof media.addListener === 'function') {
        media.addListener(onMediaChange);
    }
})();

// ADDED: shipping-velocity timeline (App Store build order, data-driven)
(function initVelocityTimeline() {
    const track = document.getElementById('velocityTrack');
    if (!track) {
        return;
    }

    const products = normalizeProducts(parseEmbeddedProducts()).filter(product => product.appStoreUrl);
    if (!products.length) {
        return;
    }

    const appStoreId = product => {
        const match = /id(\d+)/.exec(product.appStoreUrl || '');
        return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    };

    const ordered = products.slice().sort((a, b) => appStoreId(a) - appStoreId(b));

    const nodes = ordered.map((product, index) => {
        const item = document.createElement('li');
        item.className = 'vel-node';
        item.style.setProperty('--i', String(index));

        const link = document.createElement('a');
        link.href = product.appStoreUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${product.name}, app number ${index + 1}, on the App Store`);

        const seq = document.createElement('span');
        seq.className = 'vel-seq';
        seq.textContent = `#${index + 1}`;

        const dot = document.createElement('span');
        dot.className = 'vel-dot';
        dot.setAttribute('aria-hidden', 'true');

        const image = document.createElement('img');
        image.className = 'vel-icon';
        image.src = product.icon;
        image.alt = '';
        image.width = 96;
        image.height = 96;
        image.loading = 'lazy';
        image.decoding = 'async';

        const name = document.createElement('span');
        name.className = 'vel-name';
        name.textContent = product.name;

        link.append(seq, dot, image, name);
        item.append(link);
        return item;
    });

    track.replaceChildren(...nodes);
    secureExternalLinks(track);
})();

// ADDED: personal context layer system diagram (inline SVG hub-and-spoke)
(function initContextLayerDiagram() {
    const mount = document.getElementById('contextLayerDiagram');
    if (!mount) {
        return;
    }

    const products = normalizeProducts(parseEmbeddedProducts());
    if (!products.length) {
        return;
    }
    const byName = new Map(products.map(product => [product.name, product]));

    const clusterColor = {
        productivity: '#2563eb',
        wellness: '#0f766e',
        finance: '#15803d',
        learning: '#b45309',
        utility: '#7c3aed'
    };
    const clusterLabel = {
        productivity: 'Productivity',
        wellness: 'Wellness & Health',
        finance: 'Finance',
        learning: 'Learning',
        utility: 'Utility & Lifestyle'
    };
    const ringOrder = [
        { name: 'AI Calendar', cluster: 'productivity' },
        { name: 'AI Pomodoro Timer', cluster: 'productivity' },
        { name: 'Dailymatters', cluster: 'productivity' },
        { name: 'AI Daily Matters', cluster: 'productivity' },
        { name: 'AI Note', cluster: 'productivity' },
        { name: 'AI Voice Notes', cluster: 'productivity' },
        { name: 'Habits', cluster: 'wellness' },
        { name: 'Food Calories', cluster: 'wellness' },
        { name: 'Meditation', cluster: 'wellness' },
        { name: 'AI Drink Water', cluster: 'wellness' },
        { name: 'AI Vocabulary', cluster: 'learning' },
        { name: 'Piggy Accounting', cluster: 'finance' },
        { name: 'AI Weather', cluster: 'utility' },
        { name: 'AI Platform', cluster: 'utility' },
        { name: 'AI Smart Light', cluster: 'utility' },
        { name: 'Dating Chat', cluster: 'utility' },
        { name: 'AIMBTI', cluster: 'utility' },
        { name: 'ilink', cluster: 'utility' }
    ];

    const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const W = 1180;
    const H = 660;
    const cx = 590;
    const cy = 330;
    const hubR = 96;
    const rx = 410;
    const ry = 250;
    const nodeR = 29;
    const lrx = 472;
    const lry = 306;
    const step = (Math.PI * 2) / ringOrder.length;
    const startAngle = -Math.PI / 2;

    const placed = ringOrder
        .map((entry, index) => {
            const product = byName.get(entry.name);
            if (!product) {
                return null;
            }
            const angle = startAngle + index * step;
            const nx = cx + rx * Math.cos(angle);
            const ny = cy + ry * Math.sin(angle);
            const dx = nx - cx;
            const dy = ny - cy;
            const dist = Math.hypot(dx, dy) || 1;
            return { entry, product, index, angle, nx, ny, ux: dx / dist, uy: dy / dist };
        })
        .filter(Boolean);

    let linesSvg = '';
    let nodesSvg = '';
    let clipsSvg = '';
    placed.forEach(p => {
        const x1 = (cx + p.ux * (hubR + 6)).toFixed(1);
        const y1 = (cy + p.uy * (hubR + 6)).toFixed(1);
        const x2 = (p.nx - p.ux * (nodeR + 7)).toFixed(1);
        const y2 = (p.ny - p.uy * (nodeR + 7)).toFixed(1);
        const lineDelay = (p.index * 0.035).toFixed(3);
        linesSvg += `<line class="cl-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="1" stroke="url(#clLineGrad)" stroke-width="2" style="transition-delay:${lineDelay}s"/>`;

        const color = clusterColor[p.entry.cluster] || '#2563eb';
        const clipId = `clNode${p.index}`;
        const inner = nodeR - 3;
        const nxF = p.nx.toFixed(1);
        const nyF = p.ny.toFixed(1);
        clipsSvg += `<clipPath id="${clipId}"><circle cx="${nxF}" cy="${nyF}" r="${inner}"/></clipPath>`;
        const nodeDelay = (0.22 + p.index * 0.03).toFixed(3);
        nodesSvg += `<g class="cl-node" style="transition-delay:${nodeDelay}s">`
            + `<circle class="cl-node-bg" cx="${nxF}" cy="${nyF}" r="${nodeR}"/>`
            + `<image href="${p.product.icon}" x="${(p.nx - inner).toFixed(1)}" y="${(p.ny - inner).toFixed(1)}" width="${inner * 2}" height="${inner * 2}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`
            + `<circle cx="${nxF}" cy="${nyF}" r="${nodeR}" fill="none" stroke="${color}" stroke-width="2.5"/>`
            + `<title>${esc(p.product.name)} — ${esc(clusterLabel[p.entry.cluster])}</title>`
            + `</g>`;
    });

    const clusters = {};
    placed.forEach(p => {
        (clusters[p.entry.cluster] = clusters[p.entry.cluster] || []).push(p.index);
    });
    let labelsSvg = '';
    Object.keys(clusters).forEach((key, order) => {
        const indexes = clusters[key];
        const meanIndex = indexes.reduce((a, b) => a + b, 0) / indexes.length;
        const angle = startAngle + meanIndex * step;
        const lx = (cx + lrx * Math.cos(angle)).toFixed(1);
        const ly = (cy + lry * Math.sin(angle)).toFixed(1);
        const cosv = Math.cos(angle);
        let anchor = 'middle';
        if (cosv > 0.25) {
            anchor = 'start';
        } else if (cosv < -0.25) {
            anchor = 'end';
        }
        const delay = (0.55 + order * 0.08).toFixed(3);
        labelsSvg += `<text class="cl-clabel" x="${lx}" y="${ly}" text-anchor="${anchor}" dominant-baseline="central" fill="${clusterColor[key]}" style="transition-delay:${delay}s">${esc(clusterLabel[key])}</text>`;
    });

    const hubSvg = `<g class="cl-hub">`
        + `<circle cx="${cx}" cy="${cy}" r="${hubR + 16}" fill="url(#clHubGlow)"/>`
        + `<circle cx="${cx}" cy="${cy}" r="${hubR}" fill="url(#clHubGrad)"/>`
        + `<text class="cl-hub-title" x="${cx}" y="${cy - 22}" text-anchor="middle">Personal</text>`
        + `<text class="cl-hub-title" x="${cx}" y="${cy + 4}" text-anchor="middle">context</text>`
        + `<text class="cl-hub-title" x="${cx}" y="${cy + 30}" text-anchor="middle">layer</text>`
        + `<text class="cl-hub-sub" x="${cx}" y="${cy + 54}" text-anchor="middle">18 agents · 5 domains</text>`
        + `</g>`;

    const defs = `<defs>`
        + `<linearGradient id="clHubGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#0f766e"/></linearGradient>`
        + `<linearGradient id="clLineGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#0f766e"/></linearGradient>`
        + `<radialGradient id="clHubGlow"><stop offset="0" stop-color="#2563eb" stop-opacity="0.28"/><stop offset="1" stop-color="#2563eb" stop-opacity="0"/></radialGradient>`
        + clipsSvg
        + `</defs>`;

    mount.innerHTML = `<svg class="cl-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="18 specialized agents across five domains feeding one central personal context layer" xmlns="http://www.w3.org/2000/svg">`
        + defs + linesSvg + hubSvg + nodesSvg + labelsSvg
        + `</svg>`;
})();
