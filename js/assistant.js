/* ================================================================
   ADDED (round 3) — "Ask WeiProduct" investor-facing AI assistant.
   Additive only: mounts a floating action button + chat panel into
   #wp-assistant-root (see css/assistant.css). Vanilla JS, no libs.

   Backend contract (do not change server-side):
   - POST https://personal-portfolio-api-sandy.vercel.app/api/chat-proxy
     with {model:"gpt-4o-mini", messages, temperature, max_tokens}
   - non-streaming chat.completions JSON; server caps output tokens
   - client trims history: <= 12 conversation messages and <= 8000
     total chars (system prompt included) before sending

   Honesty: the system prompt below is public and contains ONLY
   published, verified facts. The assistant must never invent
   traction/revenue/user numbers — the prompt instructs it to defer
   to founder@weiproduct.com for anything not listed.
   ================================================================ */
(function weiProductAssistant() {
    'use strict';

    /* ---------- configuration ---------- */

    var ENDPOINT = 'https://personal-portfolio-api-sandy.vercel.app/api/chat-proxy';
    var MODEL = 'gpt-4o-mini';
    var TEMPERATURE = 0.5;
    var MAX_TOKENS = 700;
    var MAX_HISTORY_MESSAGES = 12;   // conversation turns kept client-side
    var MAX_TOTAL_CHARS = 8000;      // hard server budget (system + history)
    var CHAR_HEADROOM = 7600;        // trim target below the hard budget
    var MAX_INPUT_CHARS = 1500;

    var SYSTEM_PROMPT = [
        'You are the WeiProduct Assistant, the public AI concierge on weiproduct.com for investors, partners, and recruiters.',
        'Speak about WeiProduct and its founder in the third person. Be concise (usually under 150 words). Reply in the language the user writes in (English or 中文).',
        '',
        'STRICT GROUNDING: every fact you state must come from the FACTS below — this is your entire knowledge base.',
        'If asked for anything not listed (downloads, revenue, users, retention, funding, valuation, or any traction metric): say those figures are not published yet and offer founder@weiproduct.com.',
        'For pitch-deck or meeting requests: direct people to founder@weiproduct.com. Never invent numbers, quotes, customers, or partners.',
        '',
        'FACTS',
        'Company: WeiProduct, an AI consumer-product studio. Thesis: 17 focused AI agents across 5 life domains (productivity, finance, learning, wellness, utility) that connect into one personal context layer.',
        'Roadmap: Phase 1 focused agents (shipped) -> Phase 2 cross-agent context (in progress) -> Phase 3 unified personal decision layer (planned).',
        'Moat framing: shared agent infrastructure + compounding cross-agent context + shipping velocity. No public traction metrics yet.',
        'Portfolio: 17 iOS apps live on the App Store; all 17 first releases shipped within four weeks (Jul 9 - Aug 6, 2025, per Apple data); 15 of 17 have shipped post-1.0 updates.',
        'Apps (App Store link format https://apps.apple.com/app/id<ID>): AI Calendar 6748324487; Piggy Finance (记账2) 6748370595; WeiRabits 6748370992; AI Weather (WeathersPro) 6748373741; AI Pomodoro Timer 6748548518; AI Vocabulary 6748568205; Food Calories 6748717022; Dating Chat 6748549192; AI Platform 6748650326; AI Smart Light 6749024443; AI Meditation 6749164175; Dailymatters 6749191628; AI Daily Matters 6749191633; AIMBTI 6749165632; AI Drink Water 6749274211; AI Note 6749283592; AI Voice Notes 6748947046.',
        'How it is built: SwiftUI + SwiftData clients; hardened per-app Vercel serverless proxies (origin/model allow-lists, server-side key management); OpenAI, Whisper, Claude, Gemini integrations; XCTest/XCUITest suites in multiple apps; App Store Connect API release automation; products bilingual EN/中文.',
        'Founder: Wei Fu — mobile/iOS software engineer, founder of WeiProduct, San Francisco Bay Area, bilingual English/Chinese, open to iOS/AI/SWE roles; F-1 OPT, seeking H-1B sponsorship.',
        'Education: UMass Amherst, dual B.S. Computer Science + Managerial Economics (May 2025), GPA 3.63/4.00, Dean\'s List 5 semesters, 4-year merit scholarship; A/A- coursework: Artificial Intelligence, Machine Learning, Operating Systems, Computer Networks, Software Entrepreneurship, Data Management, Money & Banking, Fundamentals of Finance, Managerial Economics.',
        'Contact: founder@weiproduct.com (company/investors); weifu@umass.edu (personal/recruiting). Links: weiproduct.com; weiproduct.github.io/ME; github.com/WeiProduct; linkedin.com/in/wei-fu-004724256.',
        '',
        'STYLE: markdown-lite only — short paragraphs, "-" bullet lists, **bold**, [text](https://...) links. When mentioning an app you may link its App Store page. No tables, images, or code blocks.'
    ].join('\n');

    var CHIPS = [
        'What is the thesis?',
        'Show me the portfolio',
        "What's the roadmap?",
        '为什么是 17 个 App？'
    ];

    var GREETING = "Hi — I'm the **WeiProduct Assistant**. Ask me about the thesis, the 17 shipped iOS agents, the roadmap, or how it's all built. 也可以用中文提问。";

    /* ---------- state ---------- */

    var history = [];        // {role:'user'|'assistant', content} — session only
    var pendingQuestion = null;
    var busy = false;
    var opened = false;
    var chipsUsed = false;

    var mount = document.getElementById('wp-assistant-root');
    if (!mount) { return; }
    mount.classList.add('wpa-root');

    /* ---------- helpers ---------- */

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeHref(url) {
        // Only http(s) targets ever become links. Input is already
        // HTML-escaped, so quotes arrive as entities; strip any that
        // survived and re-check the scheme.
        var cleaned = String(url).replace(/["'<>\u0000-\u001f]/g, '');
        return /^https?:\/\//i.test(cleaned) ? cleaned : null;
    }

    function anchor(href, label) {
        return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    }

    /* Markdown-lite renderer. Everything is HTML-escaped first; the
       only tags in the output are ones this function constructs
       (strong/code/a/p/ul/ol/li/br) with sanitized http(s) hrefs. */
    function renderMarkdownLite(text) {
        var tokens = [];

        function stash(html) {
            tokens.push(html);
            return '\u0000' + (tokens.length - 1) + '\u0000';
        }

        function inline(raw) {
            var s = escapeHtml(raw);
            // code spans first so their contents are left alone
            s = s.replace(/`([^`\n]+)`/g, function (m, code) {
                return stash('<code>' + code + '</code>');
            });
            // markdown links [text](url) — http(s) only
            s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/gi, function (m, label, url) {
                var href = safeHref(url);
                return href ? stash(anchor(href, label)) : label;
            });
            // bare URLs
            s = s.replace(/https?:\/\/[^\s<)\u0000]+/gi, function (m) {
                var trimmed = m.replace(/[.,;:!?，。；：]+$/, '');
                var tail = m.slice(trimmed.length);
                var href = safeHref(trimmed);
                return href ? stash(anchor(href, trimmed)) + tail : m;
            });
            // bold / emphasis
            s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
            s = s.replace(/(^|\s)\*([^*\n]+)\*/g, '$1<em>$2</em>');
            // restore stashed fragments
            s = s.replace(/\u0000(\d+)\u0000/g, function (m, i) {
                return tokens[Number(i)];
            });
            return s;
        }

        var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
        var html = '';
        var para = [];
        var list = [];
        var listTag = '';

        function flushPara() {
            if (para.length) {
                html += '<p>' + para.map(inline).join('<br>') + '</p>';
                para = [];
            }
        }

        function flushList() {
            if (list.length) {
                html += '<' + listTag + '>' + list.map(function (item) {
                    return '<li>' + inline(item) + '</li>';
                }).join('') + '</' + listTag + '>';
                list = [];
            }
        }

        for (var i = 0; i < lines.length; i += 1) {
            var line = lines[i];
            var bullet = line.match(/^\s*[-*•]\s+(.*)$/);
            var numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
            var heading = line.match(/^\s*#{1,4}\s+(.*)$/);
            if (bullet || numbered) {
                flushPara();
                var tag = bullet ? 'ul' : 'ol';
                if (listTag && listTag !== tag) { flushList(); }
                listTag = tag;
                list.push((bullet || numbered)[1]);
            } else if (heading) {
                flushList();
                flushPara();
                html += '<p><strong>' + inline(heading[1]) + '</strong></p>';
            } else if (/^\s*$/.test(line)) {
                flushList();
                flushPara();
            } else {
                flushList();
                para.push(line);
            }
        }
        flushList();
        flushPara();
        return html;
    }

    /* ---------- DOM ---------- */

    var SPARKLE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/></svg>';
    var CLOSE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    var SEND_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 12L20 4.5 15.5 20l-3.2-5.3L4.5 12z"/><path d="M12.3 14.7L20 4.5"/></svg>';

    mount.innerHTML =
        '<button type="button" class="wpa-fab" id="wpaFab" aria-haspopup="dialog" aria-expanded="false">' +
            '<span class="wpa-fab-icon" aria-hidden="true">' + SPARKLE_SVG + '</span>' +
            '<span>Ask WeiProduct</span>' +
        '</button>' +
        '<section class="wpa-panel" id="wpaPanel" role="dialog" aria-modal="false" aria-label="WeiProduct AI assistant" hidden>' +
            '<header class="wpa-header">' +
                '<span class="wpa-avatar" aria-hidden="true">W</span>' +
                '<div class="wpa-heading">' +
                    '<h2 class="wpa-title">WeiProduct Assistant</h2>' +
                    '<p class="wpa-subtitle">Investor Q&amp;A · grounded in published facts · EN / 中文</p>' +
                '</div>' +
                '<button type="button" class="wpa-close" id="wpaClose" aria-label="Close assistant">' + CLOSE_SVG + '</button>' +
            '</header>' +
            '<div class="wpa-log" id="wpaLog" aria-live="polite"></div>' +
            '<form class="wpa-form" id="wpaForm">' +
                '<textarea class="wpa-input" id="wpaInput" rows="1" maxlength="' + MAX_INPUT_CHARS + '" placeholder="Ask about the thesis, apps, roadmap…" aria-label="Message the WeiProduct assistant"></textarea>' +
                '<button type="submit" class="wpa-send" id="wpaSend" aria-label="Send message">' + SEND_SVG + '</button>' +
            '</form>' +
            '<p class="wpa-note">AI-generated from published facts only — for anything else email <a href="mailto:founder@weiproduct.com">founder@weiproduct.com</a>.</p>' +
        '</section>';

    var fab = document.getElementById('wpaFab');
    var panel = document.getElementById('wpaPanel');
    var closeBtn = document.getElementById('wpaClose');
    var log = document.getElementById('wpaLog');
    var form = document.getElementById('wpaForm');
    var input = document.getElementById('wpaInput');
    var sendBtn = document.getElementById('wpaSend');
    var chipsWrap = null;
    var typingEl = null;

    /* ---------- log rendering ---------- */

    function scrollLog() {
        log.scrollTop = log.scrollHeight;
    }

    function addUserBubble(text) {
        var el = document.createElement('div');
        el.className = 'wpa-msg wpa-msg-user';
        el.textContent = text;
        log.appendChild(el);
        scrollLog();
    }

    function addAssistantBubble(markdown) {
        var el = document.createElement('div');
        el.className = 'wpa-msg wpa-msg-assistant';
        el.innerHTML = renderMarkdownLite(markdown);
        log.appendChild(el);
        scrollLog();
        return el;
    }

    function showTyping() {
        hideTyping();
        typingEl = document.createElement('div');
        typingEl.className = 'wpa-typing';
        typingEl.setAttribute('role', 'status');
        typingEl.setAttribute('aria-label', 'Assistant is thinking');
        typingEl.innerHTML = '<span></span><span></span><span></span>';
        log.appendChild(typingEl);
        scrollLog();
    }

    function hideTyping() {
        if (typingEl && typingEl.parentNode) {
            typingEl.parentNode.removeChild(typingEl);
        }
        typingEl = null;
    }

    function showError(message, question) {
        var el = document.createElement('div');
        el.className = 'wpa-msg-error';
        el.textContent = message + ' ';
        var retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'wpa-retry';
        retry.textContent = 'Retry';
        retry.addEventListener('click', function () {
            if (busy) { return; }
            if (el.parentNode) { el.parentNode.removeChild(el); }
            askAssistant(question, true);
        });
        el.appendChild(retry);
        log.appendChild(el);
        scrollLog();
    }

    function addChips() {
        chipsWrap = document.createElement('div');
        chipsWrap.className = 'wpa-chips';
        CHIPS.forEach(function (label) {
            var chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'wpa-chip';
            chip.textContent = label;
            chip.addEventListener('click', function () {
                submitQuestion(label);
            });
            chipsWrap.appendChild(chip);
        });
        log.appendChild(chipsWrap);
    }

    function removeChips() {
        if (!chipsUsed && chipsWrap && chipsWrap.parentNode) {
            chipsWrap.parentNode.removeChild(chipsWrap);
        }
        chipsUsed = true;
    }

    /* ---------- history trimming (client-side budget) ---------- */

    function buildMessages() {
        var turns = history.slice(-MAX_HISTORY_MESSAGES);
        var total = function (list) {
            return list.reduce(function (sum, m) {
                return sum + m.content.length;
            }, SYSTEM_PROMPT.length);
        };
        while (turns.length > 1 && total(turns) > CHAR_HEADROOM) {
            turns.shift();
        }
        if (turns.length && total(turns) > MAX_TOTAL_CHARS) {
            var last = turns[turns.length - 1];
            last = { role: last.role, content: last.content.slice(0, MAX_TOTAL_CHARS - SYSTEM_PROMPT.length - 50) };
            turns = [last];
        }
        return [{ role: 'system', content: SYSTEM_PROMPT }].concat(turns);
    }

    /* ---------- network ---------- */

    function askAssistant(question, isRetry) {
        if (busy) { return; }
        busy = true;
        sendBtn.disabled = true;
        pendingQuestion = question;
        if (!isRetry) {
            history.push({ role: 'user', content: question });
        } else if (!history.length || history[history.length - 1].role !== 'user') {
            history.push({ role: 'user', content: question });
        }
        showTyping();

        var payload = {
            model: MODEL,
            messages: buildMessages(),
            temperature: TEMPERATURE,
            max_tokens: MAX_TOKENS
        };

        fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (res) {
            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }
            return res.json();
        }).then(function (data) {
            var reply = data && data.choices && data.choices[0] &&
                data.choices[0].message && data.choices[0].message.content;
            if (!reply) {
                throw new Error('Empty response');
            }
            history.push({ role: 'assistant', content: reply });
            hideTyping();
            addAssistantBubble(reply);
        }).catch(function () {
            hideTyping();
            showError("Couldn't reach the assistant. Please try again, or email founder@weiproduct.com.", question);
        }).then(function () {
            busy = false;
            sendBtn.disabled = false;
        });
    }

    function submitQuestion(text) {
        var question = String(text || '').trim().slice(0, MAX_INPUT_CHARS);
        if (!question || busy) { return; }
        removeChips();
        addUserBubble(question);
        input.value = '';
        autosize();
        askAssistant(question, false);
    }

    /* ---------- open / close, focus trap ---------- */

    function openPanel() {
        if (opened) { return; }
        opened = true;
        mount.classList.add('wpa-open');
        panel.hidden = false;
        fab.setAttribute('aria-expanded', 'true');
        if (!log.childNodes.length) {
            addAssistantBubble(GREETING);
            addChips();
        }
        input.focus();
        scrollLog();
    }

    function closePanel() {
        if (!opened) { return; }
        opened = false;
        mount.classList.remove('wpa-open');
        panel.hidden = true;
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
    }

    panel.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closePanel();
            return;
        }
        if (event.key !== 'Tab') { return; }
        var focusables = panel.querySelectorAll(
            'button:not(:disabled), textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) { return; }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    fab.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        submitQuestion(input.value);
    });

    input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submitQuestion(input.value);
        }
    });

    function autosize() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }
    input.addEventListener('input', autosize);

    /* ---------- deep link: #ask opens, #ask=<q> prefills ----------
       On localhost only (the proxy's test origin) a #ask=<q> hash
       also auto-sends, which lets the headless round-trip test drive
       the real widget end-to-end. Production visitors just get the
       panel opened with the question prefilled. */

    function handleHash() {
        var hash = window.location.hash || '';
        if (hash.indexOf('#ask') !== 0) { return; }
        openPanel();
        var eq = hash.indexOf('=');
        if (eq === -1) { return; }
        var question = '';
        try {
            question = decodeURIComponent(hash.slice(eq + 1)).trim();
        } catch (error) {
            question = '';
        }
        if (!question) { return; }
        var host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
            submitQuestion(question);
        } else {
            input.value = question.slice(0, MAX_INPUT_CHARS);
            autosize();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleHash);
    } else {
        handleHash();
    }
    window.addEventListener('hashchange', handleHash);
}());
