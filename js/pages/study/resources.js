// js/pages/study/resources.js
// Sección de Recursos de Estudio (métodos, IAs, webs y guías).
//
// Responsabilidades de este archivo:
//   · Sus tres páginas: directorio (renderResources), categoría
//     (renderCategory) y detalle (renderResourceItem).
//   · El widget de filtro en vivo (setupResourceFilter): solo toca el DOM
//     (input, tarjetas [data-filter], contador «N de M» y estado vacío).
//   · El consejo aleatorio (refreshRandomTip).
//
// La política del cotejo es de resourcesModel.js: buildFilterHaystack
// indexa al renderizar y filterMatchesQuery coteja al teclear. Las vistas
// devuelven HTML; el router (dashboard.js) las invoca, y al final del
// archivo se publican en window.

function stripLeadingEmoji(text) {
    return String(text || '').replace(/^[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\s]+/u, '');
}

// ==========================================
// FILTRO EN VIVO
// ==========================================

function filterFieldHtml(placeholder) {
    return [
        '<div class="resources-filter">',
            '<label class="sr-only" for="resourceFilter">Filtrar recursos</label>',
            '<span class="filter-icon" aria-hidden="true">🔎</span>',
            '<input type="search" id="resourceFilter" placeholder="', esc(placeholder), '" autocomplete="off">',
            '<span class="filter-count" id="filterCount" aria-live="polite"></span>',
        '</div>',
        '<p class="filter-empty" id="filterEmpty" hidden>No hay nada que coincida con ese filtro.</p>'
    ].join('');
}

// Oculta/muestra las tarjetas con [data-filter] según el texto escrito.
// El cotejo lo decide el modelo (filterMatchesQuery): sin acentos, sin
// mayúsculas, sin símbolos y con la consulta vacía se ve todo.
function setupResourceFilter() {
    const input = document.getElementById('resourceFilter');
    if (!input) return;

    const cards = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    if (!cards.length) return;

    const countEl = document.getElementById('filterCount');
    const emptyEl = document.getElementById('filterEmpty');

    input.addEventListener('input', function () {
        const query = normalizeText(input.value);
        let visible = 0;

        cards.forEach(function (card) {
            const match = filterMatchesQuery(card.getAttribute('data-filter'), query);
            card.hidden = !match;
            if (match) visible++;
        });

        if (countEl) {
            countEl.textContent = query === '' ? '' : visible + ' de ' + cards.length;
        }
        if (emptyEl) {
            emptyEl.hidden = !(query !== '' && visible === 0);
        }
    });
}

// ==========================================
// VISTA PRINCIPAL
// ==========================================

function renderResources() {
    const categories = getResourceCategories();

    const cards = categories.map(function (category) {
        const haystack = buildFilterHaystack([
            stripLeadingEmoji(category.name),
            category.description,
            category.items.map(function (item) {
                return item.title + ' ' + item.description;
            }).join(' ')
        ]);

        return [
            '<a class="resource-category-card" href="#/recursos/', esc(category.id), '" data-filter="', esc(haystack), '">',
                '<span class="resource-category-icon" style="background:', esc(category.color), '20; color:', esc(category.color), '" aria-hidden="true">',
                    category.icon,
                '</span>',
                '<span class="resource-category-name">', esc(stripLeadingEmoji(category.name)), '</span>',
                '<span class="resource-category-desc">', esc(category.description), '</span>',
                '<span class="resource-category-meta">', pluralize(category.items.length, 'recurso', 'recursos'), '</span>',
            '</a>'
        ].join('');
    }).join('');

    return [
        '<div class="study-page active">',
            '<header class="page-head page-head--inline">',
                '<span class="page-head-icon" style="background: var(--color-acento-15); color: var(--color-acento)" aria-hidden="true">🎓</span>',
                '<div>',
                    '<h1>Recursos de Estudio</h1>',
                    '<p class="page-lede">Métodos, herramientas y guías para aprender mejor.</p>',
                '</div>',
            '</header>',
            '<div class="resources-tip">',
                '<span aria-hidden="true">💡</span>',
                '<span id="randomTip">', esc(getRandomTip()), '</span>',
                '<button type="button" class="tip-refresh" aria-label="Mostrar otro consejo">Otro consejo</button>',
            '</div>',
            filterFieldHtml('Filtrar categorías y recursos...'),
            '<div class="study-grid">', cards, '</div>',
        '</div>'
    ].join('');
}

// ==========================================
// CATEGORÍA
// ==========================================

function renderCategory(categoryId) {
    const category = getCategory(categoryId);

    if (!category) {
        return notFoundHtml('Categoría no encontrada', 'Esta categoría de recursos no existe.');
    }

    const items = category.items.map(function (item) {
        const haystack = buildFilterHaystack([item.title, item.description]);
        return [
            '<a class="resource-item-card" href="#/recursos/', esc(category.id), '/', esc(item.id), '" data-filter="', esc(haystack), '">',
                '<span class="resource-item-name">', esc(item.title), '</span>',
                '<span class="resource-item-desc">', esc(item.description), '</span>',
                '<span class="resource-item-meta">Ver detalles <span class="arrow" aria-hidden="true">→</span></span>',
            '</a>'
        ].join('');
    }).join('');

    return [
        '<div class="study-page active">',
            renderBreadcrumbs([
                HOME_CRUMB,
                { label: 'Recursos', route: '#/recursos' },
                { label: stripLeadingEmoji(category.name) }
            ]),
            '<header class="page-head page-head--inline">',
                '<span class="page-head-icon" style="background:', esc(category.color), '20; color:', esc(category.color), '" aria-hidden="true">', category.icon, '</span>',
                '<div>',
                    '<h1>', esc(stripLeadingEmoji(category.name)), '</h1>',
                    '<p class="page-lede">', esc(category.description), '</p>',
                    '<p class="page-summary">', pluralize(category.items.length, 'recurso', 'recursos'), '</p>',
                '</div>',
            '</header>',
            filterFieldHtml('Filtrar en ' + stripLeadingEmoji(category.name) + '...'),
            '<div class="study-grid">', items, '</div>',
        '</div>'
    ].join('');
}

// ==========================================
// RECURSO INDIVIDUAL
// ==========================================

function resourceSection(title, bodyHtml) {
    if (!bodyHtml) return '';
    return [
        '<section class="resource-section">',
            '<h2>', esc(title), '</h2>',
            bodyHtml,
        '</section>'
    ].join('');
}

function renderResourceItem(categoryId, itemId) {
    const category = getCategory(categoryId);
    const item = getResourceItem(categoryId, itemId);

    if (!category || !item) {
        return notFoundHtml('Recurso no encontrado', 'Este recurso no existe o ha cambiado de nombre.');
    }

    let html = [
        '<div class="study-page active">',
            renderBreadcrumbs([
                HOME_CRUMB,
                { label: 'Recursos', route: '#/recursos' },
                { label: stripLeadingEmoji(category.name), route: '#/recursos/' + category.id },
                { label: item.title }
            ]),
            '<header class="page-head page-head--inline">',
                '<span class="page-head-icon" style="background:', esc(category.color), '20; color:', esc(category.color), '" aria-hidden="true">', category.icon, '</span>',
                '<div>',
                    '<p class="page-summary">', esc(stripLeadingEmoji(category.name)), '</p>',
                    '<h1>', esc(item.title), '</h1>',
                    '<p class="page-lede">', esc(item.description), '</p>',
                '</div>',
            '</header>'
    ].join('');

    if (item.steps && item.steps.length) {
        html += resourceSection('Pasos a seguir', [
            '<ol class="resource-list">',
                item.steps.map(function (step) {
                    return '<li>' + esc(step) + '</li>';
                }).join(''),
            '</ol>'
        ].join(''));
    }

    if (item.tips) {
        html += resourceSection('Consejo', '<p class="resource-note">' + esc(item.tips) + '</p>');
    }

    if (item.features && item.features.length) {
        html += resourceSection('Características', [
            '<ul class="resource-features">',
                item.features.map(function (feature) {
                    return '<li>' + esc(feature) + '</li>';
                }).join(''),
            '</ul>'
        ].join(''));
    }

    if (item.howToUse) {
        html += resourceSection('Cómo usarlo', '<p>' + esc(item.howToUse) + '</p>');
    }

    if (item.bestFor) {
        html += resourceSection('Para qué es ideal', '<p>' + esc(item.bestFor) + '</p>');
    }

    if (item.sections && item.sections.length) {
        html += resourceSection('Contenido de la guía', [
            '<ul class="resource-features">',
                item.sections.map(function (section) {
                    return '<li>' + esc(section) + '</li>';
                }).join(''),
            '</ul>'
        ].join(''));
    }

    if (item.url) {
        html += resourceSection('Web', [
            '<a class="btn-study" href="https://', esc(item.url), '" target="_blank" rel="noopener noreferrer">',
                esc(item.url), ' <span aria-hidden="true">&#8599;</span>',
            '</a>'
        ].join(''));
    }

    html += [
        '<p class="resource-footnote">',
            '¿Te queda alguna duda? Sube este recurso a ',
            '<a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer">NotebookLM</a>',
            ' junto con tus apuntes y pregúntale sobre el tema.',
        '</p>',
        '</div>'
    ].join('');

    return html;
}

// ==========================================
// CONSEJO ALEATORIO
// ==========================================

function refreshRandomTip() {
    const tipElement = document.getElementById('randomTip');
    if (tipElement) {
        tipElement.textContent = getRandomTip();
    }
}

// ==========================================
// EXPORTAR
// ==========================================

window.renderResources = renderResources;
window.renderCategory = renderCategory;
window.renderResourceItem = renderResourceItem;
window.refreshRandomTip = refreshRandomTip;
window.setupResourceFilter = setupResourceFilter;
