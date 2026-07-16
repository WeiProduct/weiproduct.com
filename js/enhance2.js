/* ================================================================
   ADDED (round 2) — additive enhancement script (loads after main.js).
   1. Renders real Apple App Store data from the committed snapshot
      (data/appstore.json, embedded as #appstoreData): release-date
      caption, "Recent ships" strip, rating badges (only when Apple
      reports >= 20 ratings), and a screenshots lightbox (only when
      Apple returns screenshot URLs). Nothing is invented.
   2. Scenario walkthrough stepper ("One day, one system").
   3. Context-layer diagram v2: legend hover/focus highlights a
      cluster, click filters the products grid.
   No existing code in js/main.js is modified.
   ================================================================ */
(function enhanceRound2() {
    'use strict';

    /* ---------- shared helpers ---------- */
    function parseJsonScript(id) {
        const node = document.getElementById(id);
        if (!node || !node.textContent) {
            return null;
        }
        try {
            return JSON.parse(node.textContent);
        } catch (error) {
            return null;
        }
    }

    function getProducts() {
        try {
            if (typeof parseEmbeddedProducts === 'function' && typeof normalizeProducts === 'function') {
                return normalizeProducts(parseEmbeddedProducts());
            }
        } catch (error) { /* fall through */ }
        const parsed = parseJsonScript('productData');
        return Array.isArray(parsed) ? parsed : [];
    }

    const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const monthDayYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    function formatDate(iso, withYear) {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        return (withYear ? monthDayYear : monthDay).format(date);
    }

    const products = getProducts();
    const productsByName = new Map(products.map(product => [product.name, product]));

    const snapshot = parseJsonScript('appstoreData');
    const apps = snapshot && Array.isArray(snapshot.apps) ? snapshot.apps : [];
    const appsBySiteName = new Map(apps.map(app => [app.siteName, app]));

    /* ---------- 1a. real release-date caption for #velocity ---------- */
    (function renderVelocityDates() {
        const mount = document.getElementById('velocityDates');
        if (!mount || !apps.length) {
            return;
        }
        const releases = apps.map(app => app.releaseDate).filter(Boolean).sort();
        if (!releases.length) {
            return;
        }
        const first = new Date(releases[0]);
        const last = new Date(releases[releases.length - 1]);
        const sameYear = first.getFullYear() === last.getFullYear();
        const range = `${sameYear ? monthDay.format(first) : monthDayYear.format(first)} – ${monthDayYear.format(last)}`;
        mount.textContent = `All ${apps.length} first releases shipped ${range} (Apple App Store data).`;
    })();

    /* ---------- 1b. "Recent ships" strip (real Apple versions/dates) ---------- */
    (function renderRecentShips() {
        const list = document.getElementById('recentShips');
        if (!list || !apps.length) {
            return;
        }

        const fetched = document.getElementById('recentShipsFetched');
        if (fetched && snapshot.fetchedAt) {
            fetched.textContent = ` (iTunes Lookup API, fetched ${formatDate(snapshot.fetchedAt, true)})`;
        }

        const recent = apps
            .filter(app => app.currentVersionReleaseDate)
            .sort((a, b) => new Date(b.currentVersionReleaseDate) - new Date(a.currentVersionReleaseDate))
            .slice(0, 6);

        const items = recent.map(app => {
            const item = document.createElement('li');
            item.className = 'recent-ship';

            const link = document.createElement('a');
            link.href = app.trackViewUrl || '#';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute('aria-label', `${app.siteName} version ${app.version}, updated ${formatDate(app.currentVersionReleaseDate, true)}, on the App Store`);

            const product = productsByName.get(app.siteName);
            if (product) {
                const icon = document.createElement('img');
                icon.src = product.icon;
                icon.alt = '';
                icon.width = 88;
                icon.height = 88;
                icon.loading = 'lazy';
                icon.decoding = 'async';
                link.append(icon);
            }

            const name = document.createElement('span');
            name.className = 'recent-ship-name';
            name.textContent = app.siteName;

            const meta = document.createElement('span');
            meta.className = 'recent-ship-meta';

            const version = document.createElement('span');
            version.className = 'recent-ship-version';
            version.textContent = `v${app.version}`;

            const date = document.createElement('span');
            date.className = 'recent-ship-date';
            date.textContent = formatDate(app.currentVersionReleaseDate, true);

            meta.append(version, date);
            link.append(name, meta);
            item.append(link);
            return item;
        });

        list.replaceChildren(...items);
    })();

    /* ---------- 1c. rating badges + screenshots lightbox on cards ---------- */
    const MIN_RATING_COUNT = 20; // never show thin/no data

    function createRatingBadge(app) {
        if (!app || (app.userRatingCount || 0) < MIN_RATING_COUNT) {
            return null;
        }
        const badge = document.createElement('span');
        badge.className = 'rating-badge';
        badge.title = `${app.averageUserRating.toFixed(1)} out of 5 — ${app.userRatingCount} ratings on the App Store (Apple data)`;
        badge.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4L12 17.4l-5.8 3-1.1-6.4L.4 9.4l6.5-.9L12 2.6z"/></svg>';
        const text = document.createElement('span');
        text.textContent = `${app.averageUserRating.toFixed(1)} (${app.userRatingCount})`;
        badge.append(text);
        return badge;
    }

    let screensDialog = null;

    function ensureScreensDialog() {
        if (screensDialog) {
            return screensDialog;
        }
        if (typeof HTMLDialogElement !== 'function') {
            return null;
        }
        const dialog = document.createElement('dialog');
        dialog.className = 'screens-dialog';
        dialog.innerHTML = [
            '<div class="screens-dialog-head">',
            '<div><h3></h3><p>Official App Store screenshots (Apple)</p></div>',
            '<button type="button" class="screens-close" aria-label="Close screenshots">&#10005;</button>',
            '</div>',
            '<div class="screens-strip" tabindex="0"></div>'
        ].join('');
        dialog.querySelector('.screens-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => {
            if (event.target === dialog) {
                dialog.close();
            }
        });
        document.body.append(dialog);
        screensDialog = dialog;
        return dialog;
    }

    function openScreens(app) {
        const dialog = ensureScreensDialog();
        if (!dialog) {
            return;
        }
        dialog.querySelector('h3').textContent = app.siteName;
        const strip = dialog.querySelector('.screens-strip');
        strip.replaceChildren(...app.screenshotUrls.map((url, index) => {
            const image = document.createElement('img');
            image.src = url;
            image.alt = `${app.siteName} App Store screenshot ${index + 1}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            return image;
        }));
        dialog.showModal();
    }

    function createScreensButton(app) {
        if (!app || !Array.isArray(app.screenshotUrls) || !app.screenshotUrls.length) {
            return null;
        }
        if (typeof HTMLDialogElement !== 'function') {
            return null;
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'screens-btn';
        button.textContent = `View screens (${app.screenshotUrls.length})`;
        button.setAttribute('aria-label', `View ${app.screenshotUrls.length} official App Store screenshots of ${app.siteName}`);
        button.addEventListener('click', () => openScreens(app));
        return button;
    }

    function decorateCard(card) {
        if (card.dataset.appstoreDecorated === 'true') {
            return;
        }
        card.dataset.appstoreDecorated = 'true';
        const title = card.querySelector('h3');
        const app = title && appsBySiteName.get(title.textContent.trim());
        if (!app) {
            return;
        }
        const category = card.querySelector('.category');
        const badge = createRatingBadge(app);
        if (badge && category) {
            category.after(badge);
        }
        const links = card.querySelector('.product-links');
        const screensButton = createScreensButton(app);
        if (screensButton && links) {
            links.append(screensButton);
        }
    }

    function decorateAllCards() {
        document.querySelectorAll('.product-card, .featured-product').forEach(decorateCard);
    }

    (function watchProductGrids() {
        if (!apps.length) {
            return;
        }
        decorateAllCards();
        ['productGrid', 'featuredGrid'].forEach(id => {
            const grid = document.getElementById(id);
            if (!grid || !('MutationObserver' in window)) {
                return;
            }
            new MutationObserver(decorateAllCards).observe(grid, { childList: true });
        });
    })();

    /* ---------- 2. scenario walkthrough stepper ---------- */
    (function initScenario() {
        const shell = document.getElementById('scenarioShell');
        const stepsWrap = document.getElementById('scenarioSteps');
        if (!shell || !stepsWrap) {
            return;
        }

        const steps = Array.from(stepsWrap.querySelectorAll('.scenario-step'));
        if (!steps.length) {
            return;
        }

        const agentNames = [];
        steps.forEach(step => {
            (step.dataset.agents || '').split(',').map(name => name.trim()).filter(Boolean).forEach(name => {
                if (!agentNames.includes(name)) {
                    agentNames.push(name);
                }
            });
        });

        const agentsMount = document.getElementById('scenarioAgents');
        const agentChips = new Map();
        if (agentsMount) {
            agentNames.forEach(name => {
                const product = productsByName.get(name);
                const chip = document.createElement('span');
                chip.className = 'scenario-agent';
                if (product) {
                    const icon = document.createElement('img');
                    icon.src = product.icon;
                    icon.alt = '';
                    icon.width = 52;
                    icon.height = 52;
                    icon.loading = 'lazy';
                    icon.decoding = 'async';
                    chip.append(icon);
                }
                const label = document.createElement('span');
                label.textContent = name;
                chip.append(label);
                agentsMount.append(chip);
                agentChips.set(name, chip);
            });
        }

        const prevButton = document.getElementById('scenarioPrev');
        const nextButton = document.getElementById('scenarioNext');
        const dotsMount = document.getElementById('scenarioDots');
        const dots = [];

        let current = 0;

        function setStep(index) {
            current = Math.max(0, Math.min(steps.length - 1, index));
            steps.forEach((step, stepIndex) => {
                step.classList.toggle('is-active', stepIndex === current);
            });
            const active = new Set((steps[current].dataset.agents || '').split(',').map(name => name.trim()));
            agentChips.forEach((chip, name) => {
                chip.classList.toggle('is-lit', active.has(name));
            });
            dots.forEach((dot, dotIndex) => {
                dot.setAttribute('aria-current', String(dotIndex === current));
            });
            if (prevButton) {
                prevButton.disabled = current === 0;
            }
            if (nextButton) {
                nextButton.disabled = current === steps.length - 1;
            }
        }

        if (dotsMount) {
            steps.forEach((step, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'scenario-dot';
                const time = step.querySelector('.scenario-time');
                dot.setAttribute('aria-label', `Go to step ${index + 1}${time ? `: ${time.textContent}` : ''}`);
                dot.addEventListener('click', () => setStep(index));
                dotsMount.append(dot);
                dots.push(dot);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => setStep(current - 1));
        }
        if (nextButton) {
            nextButton.addEventListener('click', () => setStep(current + 1));
        }
        shell.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') {
                setStep(current - 1);
            } else if (event.key === 'ArrowRight') {
                setStep(current + 1);
            }
        });

        setStep(0);
    })();

    /* ---------- 3. context-layer diagram v2 (highlight + filter) ---------- */
    (function initDiagramV2() {
        const diagram = document.getElementById('contextLayerDiagram');
        const legend = document.querySelector('.cl-legend');
        if (!diagram || !legend) {
            return;
        }

        const colorToCluster = {
            '#2563eb': 'productivity',
            '#0f766e': 'wellness',
            '#15803d': 'finance',
            '#b45309': 'learning',
            '#7c3aed': 'utility'
        };
        const clusterToGroups = {
            productivity: ['productivity'],
            wellness: ['wellness'],
            finance: ['finance'],
            learning: ['learning'],
            utility: ['utility', 'lifestyle']
        };

        let tagged = [];

        function tagSvg() {
            const svg = diagram.querySelector('.cl-svg');
            if (!svg) {
                return false;
            }
            const nodes = Array.from(svg.querySelectorAll('.cl-node'));
            const lines = Array.from(svg.querySelectorAll('.cl-line'));
            nodes.forEach((node, index) => {
                const ring = Array.from(node.querySelectorAll('circle')).find(circle => circle.getAttribute('stroke'));
                const cluster = ring && colorToCluster[ring.getAttribute('stroke')];
                if (cluster) {
                    node.dataset.cluster = cluster;
                    if (lines[index]) {
                        lines[index].dataset.cluster = cluster;
                    }
                }
            });
            svg.querySelectorAll('.cl-clabel').forEach(label => {
                const cluster = colorToCluster[label.getAttribute('fill')];
                if (cluster) {
                    label.dataset.cluster = cluster;
                }
            });
            tagged = Array.from(svg.querySelectorAll('.cl-node, .cl-line, .cl-clabel'));
            return tagged.length > 0;
        }

        if (!tagSvg()) {
            return;
        }

        function highlight(cluster) {
            tagged.forEach(element => {
                element.classList.toggle('cl-dim', Boolean(cluster) && element.dataset.cluster !== cluster);
            });
        }

        function filterByCluster(cluster) {
            const groups = clusterToGroups[cluster];
            if (!groups) {
                return;
            }
            const cards = (typeof productCards !== 'undefined' && productCards.length)
                ? productCards
                : Array.from(document.querySelectorAll('#productGrid .product-card'));
            if (!cards.length) {
                return;
            }
            let visibleCount = 0;
            cards.forEach(card => {
                const isVisible = groups.includes(card.dataset.group);
                card.hidden = !isVisible;
                if (isVisible) {
                    visibleCount += 1;
                }
            });
            document.querySelectorAll('#productFilters .filter-chip').forEach(button => {
                const isActive = groups.includes(button.dataset.filter);
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', String(isActive));
            });
            const count = document.getElementById('productCount');
            if (count) {
                count.textContent = `${visibleCount} ${visibleCount === 1 ? 'agent surface' : 'agent surfaces'}`;
            }
            const productsSection = document.getElementById('products');
            if (productsSection) {
                const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                productsSection.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
            }
        }

        legend.querySelectorAll('li').forEach(item => {
            const dot = item.querySelector('.cl-dot');
            const cluster = dot && dot.dataset.cluster;
            if (!cluster) {
                return;
            }
            item.classList.add('cl-legend-interactive');
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `${item.textContent.trim()}: highlight these agents, activate to filter the portfolio grid`);
            item.addEventListener('mouseenter', () => highlight(cluster));
            item.addEventListener('mouseleave', () => highlight(null));
            item.addEventListener('focus', () => highlight(cluster));
            item.addEventListener('blur', () => highlight(null));
            item.addEventListener('click', () => filterByCluster(cluster));
            item.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    filterByCluster(cluster);
                }
            });
        });

        const hint = document.createElement('p');
        hint.className = 'cl-legend-hint';
        hint.textContent = 'Hover a domain to highlight its agents — click to filter the portfolio below.';
        legend.after(hint);
    })();
})();
