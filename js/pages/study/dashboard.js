// js/pages/study/dashboard.js
// Shell de la aplicación: tema, rutas, navegación y páginas principales.
//
// La navegación funciona con hashes (#/asignaturas/matematicas/mates-t1):
// cada vista tiene URL propia, se puede compartir, y el botón atrás del
// navegador funciona. Los enlaces se generan como <a href>, con lo que son
// accesibles con teclado y se pueden abrir en otra pestaña.
//
// Estructura del archivo (una región por responsabilidad, en orden):
//   TEMA                  oscuro / claro / alto contraste (estado: localStorage)
//   RUTAS                 hash -> parseRoute(); la URL es el estado de navegación
//   BREADCRUMBS           migas compartidas por todas las páginas
//   CONTEO PARA TARJETAS  countsMetaList(): «N archivos · N recursos»
//   PÁGINA: INICIO        dashboardHtml() + tarjetas de asignatura
//   CONTINUAR DONDE ESTABAS  último tema visitado (estado: localStorage)
//   PÁGINA: ASIGNATURA    lista de temas con numeración real del programa
//   PÁGINA: TEMA          hero + columnas + navegación entre temas; el
//                         contenido lo pinta resourcesModel (renderTopicSection)
//   PÁGINA: BÚSQUEDA      resultados (el índice vive en studyData/resourcesData)
//   RENDER PRINCIPAL      renderRoute(): único punto que escribe #studyContent
//   BUSCADOR / EVENTOS / INICIO
//
// Dependencias: esc/pluralize/countTopicItems/buildTopicSections/
// renderTopicSection (resourcesModel.js) y las vistas de Recursos
// (resources.js), invocadas por renderRoute.

// ==========================================
// TEMA (oscuro / claro / alto contraste)
// ==========================================

const THEME_MODES = ['dark', 'light', 'contrast'];
const THEME_ICONS = { dark: '🌙', light: '☀️', contrast: '◐' };
const THEME_LABELS = {
    dark: 'Tema oscuro activo. Activar tema claro',
    light: 'Tema claro activo. Activar alto contraste',
    contrast: 'Alto contraste activo. Activar tema oscuro'
};

function getCurrentTheme() {
    const current = document.documentElement.dataset.theme;
    return THEME_MODES.indexOf(current) > -1 ? current : 'dark';
}

function applyTheme(mode) {
    const theme = THEME_MODES.indexOf(mode) > -1 ? mode : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === 'contrast' ? 'dark' : theme;

    const meta = document.head.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content',
            theme === 'light' ? '#F8FAFC' : (theme === 'contrast' ? '#000000' : '#0B1220'));
    }

    try {
        localStorage.setItem('web4eso.modo', theme);
    } catch (err) {
        // Modo privado sin almacenamiento: el tema solo dura esta sesión
    }

    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = THEME_ICONS[theme];
        btn.setAttribute('aria-label', THEME_LABELS[theme]);
        btn.title = THEME_LABELS[theme];
    }
}

function cycleTheme() {
    const next = THEME_MODES[(THEME_MODES.indexOf(getCurrentTheme()) + 1) % THEME_MODES.length];
    applyTheme(next);
}

function syncThemeButton() {
    const theme = getCurrentTheme();
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = THEME_ICONS[theme];
        btn.setAttribute('aria-label', THEME_LABELS[theme]);
        btn.title = THEME_LABELS[theme];
    }
}

// ==========================================
// RUTAS
// ==========================================

const LEGACY_ROUTES = {
    home: '#/',
    subjects: '#/asignaturas',
    resources: '#/recursos'
};

function navigateTo(target) {
    let next = LEGACY_ROUTES[target];

    if (!next) {
        next = String(target || '#/');
        if (next.charAt(0) !== '#') {
            next = '#/' + next.replace(/^\/+/, '');
        }
    }

    if (window.location.hash === next) {
        renderRoute({ initial: false });
        return;
    }

    window.location.hash = next;
}

function normalizeHash(hash) {
    let path = String(hash || '').replace(/^#/, '');
    if (!path) return '/';
    if (path.charAt(0) !== '/') path = '/' + path;
    if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
    return path;
}

function parseRoute() {
    const raw = normalizeHash(window.location.hash);
    const qIndex = raw.indexOf('?');
    const pathPart = qIndex > -1 ? raw.slice(0, qIndex) : raw;
    const queryString = qIndex > -1 ? raw.slice(qIndex + 1) : '';

    const query = {};
    queryString.split('&').forEach(function (pair) {
        if (!pair) return;
        const bits = pair.split('=');
        query[decodeURIComponent(bits[0])] = decodeURIComponent((bits[1] || '').replace(/\+/g, ' '));
    });

    const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent);

    if (!segments.length) return { name: 'home', query: query };

    if (segments[0] === 'asignaturas') {
        if (segments.length === 1) return { name: 'subjects', query: query };
        if (segments.length === 2) return { name: 'subject', subjectId: segments[1], query: query };
        return { name: 'topic', subjectId: segments[1], topicId: segments[2], query: query };
    }

    if (segments[0] === 'recursos') {
        if (segments.length === 1) return { name: 'resources', query: query };
        if (segments.length === 2) return { name: 'category', categoryId: segments[1], query: query };
        return { name: 'item', categoryId: segments[1], itemId: segments[2], query: query };
    }

    if (segments[0] === 'buscar') return { name: 'search', query: query };

    return { name: 'notfound', path: pathPart, query: query };
}

// ==========================================
// BREADCRUMBS
// ==========================================

function renderBreadcrumbs(items) {
    if (!items || !items.length) return '';

    const parts = items.map(function (item, i) {
        const isLast = i === items.length - 1;
        if (isLast || !item.route) {
            return '<span class="current" aria-current="page">' + esc(item.label) + '</span>';
        }
        return '<a href="' + esc(item.route) + '">' + esc(item.label) + '</a>';
    }).join('<span class="sep" aria-hidden="true">‹</span>');

    return '<nav class="study-breadcrumbs" aria-label="Ruta de navegación">' + parts + '</nav>';
}

const HOME_CRUMB = { label: 'Inicio', route: '#/' };
const SUBJECTS_CRUMB = { label: 'Asignaturas', route: '#/asignaturas' };

// ==========================================
// CONTEO PARA LAS TARJETAS
// ==========================================

// «N archivos · N recursos» a partir del recuento del modelo; lo que es 0
// no aparece. El texto alternativo (p. ej. «Contenido pendiente de
// publicar») lo añade cada página sobre esta lista.
function countsMetaList(counts) {
    const meta = [];
    if (counts.files) meta.push(pluralize(counts.files, 'archivo', 'archivos'));
    if (counts.extras) meta.push(pluralize(counts.extras, 'recurso', 'recursos'));
    return meta;
}

// ==========================================
// PÁGINA: INICIO / DIRECTORIO DE ASIGNATURAS
// ==========================================

function subjectCardHtml(subject) {
    const count = subject.topics.length;
    return [
        '<a class="subject-card" href="#/asignaturas/', esc(subject.id), '">',
            '<span class="subject-content">',
                '<span class="subject-icon" style="background:', esc(subject.color), '20; color:', esc(subject.color), '">',
                    subject.icon,
                '</span>',
                '<span class="subject-title">', esc(subject.name), '</span>',
                subject.description ? '<span class="subject-desc">' + esc(subject.description) + '</span>' : '',
                '<span class="subject-meta">',
                    count ? pluralize(count, 'tema', 'temas') : 'Sin temas publicados',
                '</span>',
            '</span>',
        '</a>'
    ].join('');
}

// Fila de estadísticas del home: cifras grandes sobre el material ya
// publicado (mismo recuento que usa el modelo: sin marcadores pendientes).
function subjectStatsHtml(subjects) {
    let totalTopics = 0;
    let totalMaterials = 0;
    subjects.forEach(function (subject) {
        totalTopics += subject.topics.length;
        subject.topics.forEach(function (topic) {
            const counts = countTopicItems(topic);
            totalMaterials += counts.files + counts.extras;
        });
    });

    const stats = [
        { value: subjects.length, one: 'asignatura', many: 'asignaturas' },
        { value: totalTopics, one: 'tema', many: 'temas' },
        { value: totalMaterials, one: 'material', many: 'materiales' }
    ];

    return '<div class="page-stats" aria-label="Resumen del material publicado">' + stats.map(function (stat) {
        return [
            '<span class="stat">',
                '<strong class="stat-value">', stat.value, '</strong>',
                '<span class="stat-label">', stat.value === 1 ? stat.one : stat.many, '</span>',
            '</span>'
        ].join('');
    }).join('') + '</div>';
}

function dashboardHtml(mode) {
    const subjects = getSubjects();
    const focusOnly = mode === 'subjects';

    return [
        '<div class="study-page active">',
            '<header class="page-head">',
                '<h1>Mis Asignaturas</h1>',
                focusOnly ? '<p class="page-lede">Todo el material publicado, asignatura por asignatura.</p>' : '',
                subjectStatsHtml(subjects),
            '</header>',
            resumeCardHtml(),
            '<div class="study-grid" id="asignaturasGrid">',
                subjects.map(subjectCardHtml).join(''),
            '</div>',
        '</div>'
    ].join('');
}

// ==========================================
// CONTINUAR DONDE ESTABAS
// ==========================================
//
// Recuerda el último tema visitado (solo en este navegador) y lo ofrece en
// el home. Si la ruta dejó de existir, la tarjeta simplemente no se muestra.

const LAST_TOPIC_KEY = 'web4eso.ultimoTema';

function rememberLastTopic(subjectId, topicId) {
    try {
        localStorage.setItem(LAST_TOPIC_KEY, subjectId + '/' + topicId);
    } catch (err) {
        // Modo privado sin almacenamiento: la función queda inactiva
    }
}

function readLastTopic() {
    let raw = '';
    try {
        raw = localStorage.getItem(LAST_TOPIC_KEY) || '';
    } catch (err) {
        return null;
    }

    const parts = raw.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const subject = getSubject(parts[0]);
    const topic = subject && subject.topics.find(function (item) {
        return item.id === parts[1];
    });

    if (!topic) return null;
    return { subject: subject, topic: topic };
}

function resumeCardHtml() {
    const last = readLastTopic();
    if (!last) return '';

    const counts = countTopicItems(last.topic);
    const meta = [last.subject.name].concat(countsMetaList(counts));

    return [
        '<a class="resume-card" href="#/asignaturas/', esc(last.subject.id), '/', esc(last.topic.id), '">',
            '<span class="resume-body">',
                '<span class="resume-eyebrow">Continuar donde estabas</span>',
                '<span class="resume-title">', esc(last.topic.title || 'Tema sin título'), '</span>',
                '<span class="resume-meta">', esc(meta.join(' · ')), '</span>',
            '</span>',
            '<span class="resume-arrow" aria-hidden="true">→</span>',
        '</a>'
    ].join('');
}

// ==========================================
// PÁGINA: ASIGNATURA
// ==========================================

// Número de tema real derivado del título ("Tema 6" → 6), de modo que los
// huecos del programa (Tema 5 ausente) se respetan; si el título no lleva
// número, se usa la posición en la lista.
function topicNumber(topic, index) {
    const match = /^Tema\s+(\d+)/i.exec(String(topic.title || '').trim());
    return match ? match[1] : String(index + 1);
}

function topicRowHtml(subject, topic, index) {
    const counts = countTopicItems(topic);
    const meta = countsMetaList(counts);
    if (!meta.length) meta.push('Contenido pendiente de publicar');

    return [
        '<a class="topic-row" href="#/asignaturas/', esc(subject.id), '/', esc(topic.id), '">',
            '<span class="topic-num" aria-hidden="true">', topicNumber(topic, index), '</span>',
            '<span class="topic-body">',
                '<span class="topic-title">', esc(topic.title || 'Tema sin título'), '</span>',
                topic.description ? '<span class="topic-desc">' + esc(topic.description) + '</span>' : '',
                '<span class="topic-meta">', meta.map(esc).join(' · '), '</span>',
            '</span>',
            '<span class="topic-arrow" aria-hidden="true">→</span>',
        '</a>'
    ].join('');
}

function renderSubject(subjectId) {
    const subject = getSubject(subjectId);

    if (!subject) {
        return notFoundHtml('Asignatura no encontrada', 'La asignatura que buscas no existe o ha cambiado de nombre.');
    }

    return [
        '<div class="study-page active">',
            renderBreadcrumbs([
                HOME_CRUMB,
                SUBJECTS_CRUMB,
                { label: subject.name }
            ]),
            '<header class="page-head page-head--inline">',
                '<span class="page-head-icon" style="background:', esc(subject.color), '20; color:', esc(subject.color), '" aria-hidden="true">', subject.icon, '</span>',
                '<div>',
                    '<h1>', esc(subject.name), '</h1>',
                    subject.description ? '<p class="page-lede">' + esc(subject.description) + '</p>' : '',
                '</div>',
            '</header>',
            subject.topics.length
                ? '<div class="topic-list">' + subject.topics.map(function (topic, i) {
                    return topicRowHtml(subject, topic, i);
                }).join('') + '</div>'
                : '<div class="study-empty"><h2>Todavía sin temas</h2><p>Esta asignatura aún no tiene material publicado.</p></div>',
        '</div>'
    ].join('');
}

// ==========================================
// PÁGINA: TEMA
// ==========================================

function topicIntroHtml(topic, subject) {
    const counts = countTopicItems(topic);
    const meta = countsMetaList(counts);

    return [
        '<div class="topic-hero">',
            '<div class="topic-hero-main">',
                '<h1>', esc(topic.title || 'Tema sin título'), '</h1>',
                topic.description ? '<p class="topic-desc">' + esc(topic.description) + '</p>' : '',
                '<div class="topic-hero-bottom">',
                    meta.length ? '<span class="topic-meta-badge">' + esc(subject.name) + ' · ' + meta.join(' · ') + '</span>' : '',
                '</div>',
            '</div>',
        '</div>'
    ].join('');
}

function topicNavHtml(subject, topic) {
    const index = subject.topics.findIndex(function (item) { return item.id === topic.id; });
    const prev = index > 0 ? subject.topics[index - 1] : null;
    const next = index > -1 && index < subject.topics.length - 1 ? subject.topics[index + 1] : null;

    if (!prev && !next) return '';

    function link(item, direction, label) {
        if (!item) return '<span class="topic-nav-slot is-empty"></span>';
        return [
            '<a class="topic-nav-link is-', direction, '" href="#/asignaturas/', esc(subject.id), '/', esc(item.id), '">',
                '<span class="topic-nav-label">', label, '</span>',
                '<span class="topic-nav-title">', esc(item.title || 'Tema sin título'), '</span>',
            '</a>'
        ].join('');
    }

    return [
        '<nav class="topic-nav" aria-label="Navegación entre temas">',
            link(prev, 'prev', '‹ Tema anterior'),
            link(next, 'next', 'Tema siguiente ›'),
        '</nav>'
    ].join('');
}

function renderTopic(subjectId, topicId) {
    const subject = getSubject(subjectId);
    const topic = subject && subject.topics.find(function (item) { return item.id === topicId; });

    if (!subject || !topic) {
        return notFoundHtml('Tema no encontrado', 'El tema que buscas no existe o aún no se ha publicado.');
    }

    const allSections = buildTopicSections(topic);
    const intro = topicIntroHtml(topic, subject);

    // Secciones de estudio (consulta) en el flujo principal;
    // las de práctica, en el aside.
    const studySections = allSections.filter(function (s) { return s.weight !== 'practice'; });
    const practiceSections = allSections.filter(function (s) { return s.weight === 'practice'; });

    const studyHtml = studySections.map(function (section) {
        return renderTopicSection(topic, section);
    }).join('');

    const activities = renderActivities(topic);

    const practiceHtml = practiceSections.map(function (section) {
        return renderTopicSection(topic, section);
    }).join('');

    const empty = (!allSections.length && !activities)
        ? [
            '<div class="study-empty">',
                '<h2>Contenido pendiente</h2>',
                '<p>Este tema todavía no tiene materiales publicados.</p>',
            '</div>'
          ].join('')
        : '';

    return [
        '<div class="study-page active">',
            renderBreadcrumbs([
                HOME_CRUMB,
                SUBJECTS_CRUMB,
                { label: subject.name, route: '#/asignaturas/' + subject.id },
                { label: topic.title || 'Tema sin título' }
            ]),
            intro,
            '<div class="topic-layout">',
                '<div class="topic-main">',
                    studyHtml,
                    activities,
                '</div>',
                practiceSections.length
                    ? '<aside class="topic-aside">' + practiceHtml + '</aside>'
                    : '',
            '</div>',
            empty,
            topicNavHtml(subject, topic),
        '</div>'
    ].join('');
}

// ==========================================
// PÁGINA: BÚSQUEDA
// ==========================================

const SEARCH_SUGGESTIONS = [
    'mates', 'matemáticas', 'geometría', 'ecuaciones',
    'lengua', 'sintaxis', 'romanticismo', 'física', 'energía',
    'pomodoro', 'feynman', 'notebooklm', 'chatgpt'
];

function searchResultItemHtml(result) {
    let href = '#/';

    if (result.type === 'subject') href = '#/asignaturas/' + result.subjectId;
    else if (result.type === 'topic') href = '#/asignaturas/' + result.subjectId + '/' + result.topicId;
    else if (result.type === 'category') href = '#/recursos/' + result.categoryId;
    else if (result.type === 'resource') href = '#/recursos/' + result.categoryId + '/' + result.itemId;

    return [
        '<a class="search-result-item" href="', esc(href), '">',
            '<span class="result-icon" aria-hidden="true">', result.icon || '🔎', '</span>',
            '<span class="result-info">',
                '<span class="result-title">', esc(result.title), '</span>',
                '<span class="result-sub">', esc(result.subtitle || ''), '</span>',
            '</span>',
            '<span class="result-badge">', esc(result.badge || result.match || ''), '</span>',
        '</a>'
    ].join('');
}

function searchViewHtml(query) {
    const subjectResults = searchAll(query);
    const resourceResults = typeof searchResources === 'function' ? searchResources(query) : [];

    const results = [
        ...subjectResults.subjects.map(function (r) { return Object.assign({}, r, { badge: 'Asignatura' }); }),
        ...subjectResults.topics.map(function (r) { return Object.assign({}, r, { badge: r.match || 'Tema' }); }),
        ...resourceResults.map(function (r) { return Object.assign({}, r, { badge: r.badge || 'Recurso' }); })
    ];

    const header = [
        '<header class="page-head">',
            '<h1>Resultados para «', esc(query), '»</h1>',
            '<p class="page-summary">',
                results.length ? pluralize(results.length, 'resultado', 'resultados') : 'Sin resultados',
            '</p>',
        '</header>'
    ].join('');

    const back = '<p class="search-back"><a href="#/">← Volver al inicio</a></p>';

    if (!results.length) {
        return [
            '<div class="study-page active search-results active">',
                header,
                '<div class="search-empty">',
                    '<p>No hay nada que coincida con «<strong>', esc(query), '</strong>».</p>',
                    '<div class="suggestions">Prueba con: ',
                        SEARCH_SUGGESTIONS.slice(0, 8).map(function (s) {
                            return '<a href="#/buscar?q=' + encodeURIComponent(s) + '">' + esc(s) + '</a>';
                        }).join(' · '),
                    '</div>',
                '</div>',
                back,
            '</div>'
        ].join('');
    }

    return [
        '<div class="study-page active search-results active">',
            header,
            '<div class="result-list">', results.map(searchResultItemHtml).join(''), '</div>',
            back,
        '</div>'
    ].join('');
}

function notFoundHtml(title, message) {
    return [
        '<div class="study-page active">',
            '<div class="study-empty">',
                '<h1>', esc(title), '</h1>',
                '<p>', esc(message), '</p>',
                '<a class="btn-study" href="#/">Volver al inicio</a>',
            '</div>',
        '</div>'
    ].join('');
}

// ==========================================
// RENDER PRINCIPAL
// ==========================================

const NAV_BY_ROUTE = {
    home: 'navHome',
    subjects: 'navSubjects',
    subject: 'navSubjects',
    topic: 'navSubjects',
    resources: 'navResources',
    category: 'navResources',
    item: 'navResources'
};

function syncNav(routeName) {
    const activeId = NAV_BY_ROUTE[routeName];

    document.querySelectorAll('.nav-links a').forEach(function (link) {
        const isActive = link.id === activeId;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

function renderRoute(options) {
    const opts = options || {};
    const container = document.getElementById('studyContent');
    if (!container) return;

    const route = parseRoute();
    let html = '';

    switch (route.name) {
        case 'home':
            html = dashboardHtml('home');
            break;
        case 'subjects':
            html = dashboardHtml('subjects');
            break;
        case 'subject':
            html = renderSubject(route.subjectId);
            break;
        case 'topic':
            html = renderTopic(route.subjectId, route.topicId);
            rememberLastTopic(route.subjectId, route.topicId);
            break;
        case 'resources':
            html = typeof renderResources === 'function' ? renderResources() : notFoundHtml('Recursos', 'Sección no disponible.');
            break;
        case 'category':
            html = typeof renderCategory === 'function' ? renderCategory(route.categoryId) : '';
            break;
        case 'item':
            html = typeof renderResourceItem === 'function' ? renderResourceItem(route.categoryId, route.itemId) : '';
            break;
        case 'search':
            html = searchViewHtml(route.query.q || '');
            break;
        default:
            html = notFoundHtml('Página no encontrada', 'La dirección que has abierto no existe.');
    }

    container.innerHTML = html || notFoundHtml('Página no encontrada', 'La dirección que has abierto no existe.');
    syncNav(route.name);

    // Filtro en vivo de la sección de Recursos (si la página lo incluye)
    if (typeof setupResourceFilter === 'function') {
        setupResourceFilter();
    }

    if (route.name === 'search') {
        const input = document.getElementById('searchInput');
        if (input) input.value = route.query.q || '';
        toggleClearBtn();
    }

    if (!opts.initial) {
        window.scrollTo(0, 0);
        const heading = container.querySelector('h1');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            try { heading.focus({ preventScroll: true }); } catch (err) { heading.focus(); }
        }
    }
}

// ==========================================
// BUSCADOR
// ==========================================

function toggleClearBtn() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    if (input && clearBtn) {
        clearBtn.classList.toggle('visible', input.value.length > 0);
    }
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
        toggleClearBtn();
        input.focus();
    }
    navigateTo('home');
}

function performSearch() {
    const input = document.getElementById('searchInput');
    const query = input ? input.value.trim() : '';

    if (!query) {
        navigateTo('home');
        return;
    }

    navigateTo('#/buscar?q=' + encodeURIComponent(query));
}

// ==========================================
// EVENTOS
// ==========================================

function setupEventListeners() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            performSearch();
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', toggleClearBtn);
    }

    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', cycleTheme);
    }

    // Corrección y reinicio de actividades interactivas (evento delegado)
    document.addEventListener('submit', handleActivitySubmit);
    document.addEventListener('click', handleActivityReset);

    // El tema por defecto es claro y solo cambia cuando el alumno lo elige
    // con el botón; no se sigue automáticamente el sistema para que la
    // primera impresión sea predecible.

    window.addEventListener('hashchange', function () {
        renderRoute({ initial: false });
    });
}

// ==========================================
// INICIO
// ==========================================

document.addEventListener('DOMContentLoaded', function () {
    syncThemeButton();
    setupEventListeners();
    renderRoute({ initial: true });
});
