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

const fallbackProducts = [
    {
        name: 'Piggy Accounting',
        category: 'Finance',
        group: 'finance',
        icon: 'assets/icons/piggyfinance.png',
        description: 'Expense tracking and personal accounting for clearer money habits.',
        url: 'https://weiproduct.github.io/piggy-finance/'
    },
    {
        name: 'AI Calendar',
        category: 'Planning',
        group: 'productivity',
        icon: 'assets/icons/ai-calendar.png',
        description: 'Daily scheduling and planning with an AI-first workflow.',
        url: 'https://weiproduct.github.io/AICalendar/'
    },
    {
        name: 'Habits',
        category: 'Habits',
        group: 'wellness',
        icon: 'assets/icons/weirabits.png',
        description: 'Habit formation support for routines that need simple, consistent tracking.',
        url: 'https://weiproduct.github.io/WeiRabits/docs/index.html'
    },
    {
        name: 'AI Weather',
        category: 'Utility',
        group: 'utility',
        icon: 'assets/icons/weatherspro.png',
        description: 'Weather information packaged for fast everyday decisions.',
        url: 'https://weiproduct.github.io/Weather/'
    },
    {
        name: 'AI Pomodoro Timer',
        category: 'Focus',
        group: 'productivity',
        icon: 'assets/icons/ai-tomato-clock.png',
        description: 'Timeboxing and focus sessions for work, study, and personal routines.',
        url: 'https://weiproduct.github.io/AITomatoClock/'
    },
    {
        name: 'AI Vocabulary',
        category: 'Learning',
        group: 'learning',
        icon: 'assets/icons/ai-vocabulary.png',
        description: 'Vocabulary practice for learners who want lightweight daily study.',
        url: 'https://weiproduct.github.io/aiwordslearning/'
    },
    {
        name: 'Food Calories',
        category: 'Health',
        group: 'wellness',
        icon: 'assets/icons/ai-calories.png',
        description: 'Food and calorie awareness for simpler nutrition tracking.',
        url: 'https://weiproduct.github.io/AICaloriesSupport-/'
    },
    {
        name: 'Dating Chat',
        category: 'Lifestyle',
        group: 'lifestyle',
        icon: 'assets/icons/ai-helper.png',
        description: 'Conversation support for people who want clearer, more confident messaging.',
        url: 'https://weiproduct.github.io/aidatingchat2/'
    },
    {
        name: 'AI Platform',
        category: 'AI Utility',
        group: 'utility',
        icon: 'assets/icons/ai-platform.png',
        description: 'A compact mobile interface for accessing AI assistance in one place.',
        url: 'https://weiproduct.github.io/ai-platform-support/'
    },
    {
        name: 'AI Smart Light',
        category: 'Camera',
        group: 'utility',
        icon: 'assets/icons/smart-light-master.png',
        description: 'Lighting support for content, calls, photos, and quick visual setup.',
        url: 'https://weiproduct.github.io/AISmartlight/'
    },
    {
        name: 'Meditation',
        category: 'Wellness',
        group: 'wellness',
        icon: 'assets/icons/ai-meditation.png',
        description: 'Guided calm and reflection moments built for a mobile daily routine.',
        url: 'https://weiproduct.github.io/AIMeditation/'
    },
    {
        name: 'Dailymatters',
        category: 'Journal',
        group: 'productivity',
        icon: 'assets/icons/dailymatters.png',
        description: 'Daily tracking for thoughts, moments, and personal organization.',
        url: 'https://weiproduct.github.io/dailymatters/'
    },
    {
        name: 'AI Daily Matters',
        category: 'Journal',
        group: 'productivity',
        icon: 'assets/icons/aidailymatters.png',
        description: 'An AI-supported companion for capturing and organizing daily matters.',
        url: 'https://weiproduct.github.io/AIDailyMatters/'
    },
    {
        name: 'AIMBTI',
        category: 'Personality',
        group: 'lifestyle',
        icon: 'assets/icons/aimbti.png',
        description: 'Personality reflection and AI-assisted self-understanding.',
        url: 'https://weiproduct.github.io/MBTI/'
    },
    {
        name: 'AI Drink Water',
        category: 'Health',
        group: 'wellness',
        icon: 'assets/icons/aidrinkwater.png',
        description: 'Hydration reminders and simple wellness habit support.',
        url: 'https://weiproduct.github.io/Drinking/'
    },
    {
        name: 'AI Note',
        category: 'Notes',
        group: 'productivity',
        icon: 'assets/icons/ainote.png',
        description: 'Note capture and organization for ideas that need to become useful.',
        url: 'https://weiproduct.github.io/notes/'
    },
    {
        name: 'AI Voice Notes',
        category: 'Voice',
        group: 'productivity',
        icon: 'assets/icons/ai-voice-notes.png',
        description: 'Voice capture for meetings, study, quick thoughts, and personal notes.',
        url: 'https://weiproduct.github.io/recording/'
    }
];

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

async function loadProducts() {
    try {
        const response = await fetch('products.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Product data unavailable');
        }
        return response.json();
    } catch (error) {
        return fallbackProducts;
    }
}

async function renderProducts() {
    if (!productGrid) {
        return;
    }

    const products = await loadProducts();
    renderAmbientBackground(products);
    productGrid.replaceChildren(...products.map(createProductCard));
    productCards = Array.from(productGrid.querySelectorAll('.product-card'));
    updateProductFilter('all');
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
