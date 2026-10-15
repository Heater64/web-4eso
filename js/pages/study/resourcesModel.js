// js/pages/study/resourcesModel.js
// Modelo de recursos de cada tema + render de actividades interactivas.
//
// ----------------------------------------------------------------------------
// CÓMO SE RELLENA CADA SECCIÓN (no se inventa contenido):
//
//   topic.files[]           -> material del profesor (estructura ya existente)
//   topic.recommendations[] -> material complementario (estructura ya existente)
//
// Cada entrada puede llevar opcionalmente:
//   kind: 'mios'  -> aparece en "Mis apuntes" (apuntes manuscritos digitalizados)
//   kind: 'ia'    -> aparece en "Apuntes mejorados con IA"
//
// Sin `kind`, la entrada se clasifica por el separador que la precede y por su
// nombre/URL (p. ej. los enlaces de NotebookLM entran en "con IA"). Las
// secciones sin contenido real no se renderizan: nunca se rellenan con datos
// ficticios.
//
// topic.activities[] -> actividades interactivas (ver esquema en renderActivities)
// ----------------------------------------------------------------------------

// ==========================================
// UTILIDADES COMPARTIDAS
// ==========================================

function esc(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function pluralize(count, singular, pluralForm) {
    return count + ' ' + (count === 1 ? singular : pluralForm);
}

// ==========================================
// SECCIONES DE RECURSOS DE UN TEMA
// ==========================================

const TOPIC_BUCKETS = [
    {
        id: 'profesor',
        title: 'Apuntes del profesor',
        hint: 'Material original utilizado en clase.',
        weight: 'primary'
    },
    {
        id: 'mios',
        title: 'Mis apuntes',
        hint: 'Apuntes manuscritos digitalizados.',
        weight: 'primary'
    },
    {
        id: 'ia',
        title: 'Apuntes mejorados con IA',
        hint: 'Material revisado y reorganizado para facilitar la comprensión.',
        weight: 'primary'
    },
    {
        id: 'ejercicios',
        title: 'Ejercicios y actividades',
        hint: 'Práctica propuesta por el profesor.',
        weight: 'practice'
    },
    {
        id: 'examenes',
        title: 'Exámenes y solucionarios',
        hint: 'Modelos de examen y correcciones.',
        weight: 'practice'
    },
    {
        id: 'complementario',
        title: 'Material complementario',
        hint: 'Vídeos, imágenes y enlaces para ampliar.',
        weight: 'extra'
    }
];

const RE_CON_EJERCICIOS = /(ejercicio|ejercicis|exercici|actividad|activitat|problema|problemes|fitxa|treball|repas|practica|practiques|resuelt|resolt)/;
const RE_CON_EXAMEN = /(examen|modelo|solucionari|solucio|solucionar|prueba|evaluacion|cuestionario|test)/;

function classifyEntry(entry, source, groupLabel) {
    const kind = String(entry.kind || '').toLowerCase();

    if (kind === 'mios' || kind === 'propio' || kind === 'manuscrito') return 'mios';
    if (kind === 'ia') return 'ia';

    const url = String(entry.url || '').toLowerCase();
    if (url.indexOf('notebooklm.google.com') > -1) return 'ia';

    const text = normalizeText([groupLabel, entry.name, entry.title].filter(Boolean).join(' '));

    // Los ejercicios se comprueban antes que los exámenes: hay enunciados como
    // "Ejercicios para repasar el examen" que son práctica, no evaluación.
    if (RE_CON_EJERCICIOS.test(text)) return 'ejercicios';
    if (RE_CON_EXAMEN.test(text)) return 'examenes';

    return source === 'recommendation' ? 'complementario' : 'profesor';
}

// Devuelve las secciones con contenido, preservando los separadores originales
// dentro de cada sección y el orden en que aparecían.
function buildTopicSections(topic) {
    const buckets = {};
    TOPIC_BUCKETS.forEach(function (bucket) {
        buckets[bucket.id] = [];
    });

    let pendingSeparators = [];

    function push(entries, source) {
        (entries || []).forEach(function (entry) {
            if (!entry) return;

            if (entry.type === 'separator') {
                pendingSeparators.push({ kind: 'separator', label: entry.label || '' });
                return;
            }

            const name = String(entry.name || entry.title || '').trim();
            const url = String(entry.url || '');
            const hasContent = name !== '' && url !== '' && url !== '#';

            // Marcadores totalmente vacíos (sin nombre ni destino): no son
            // contenido, no se pintan como filas rotas.
            if (name === '' && (url === '' || url === '#')) return;

            const groupLabel = pendingSeparators.length
                ? pendingSeparators[pendingSeparators.length - 1].label
                : '';
            const bucketId = classifyEntry(entry, source, groupLabel);

            pendingSeparators.forEach(function (sep) {
                buckets[bucketId].push(sep);
            });
            pendingSeparators = [];
            buckets[bucketId].push({ kind: 'item', entry: entry, source: source, available: hasContent });
        });
    }

    push(topic.files, 'file');
    push(topic.recommendations, 'recommendation');

    const sections = TOPIC_BUCKETS
        .map(function (bucket) {
            return Object.assign({}, bucket, { items: buckets[bucket.id] });
        })
        .filter(function (section) {
            return section.items.length > 0;
        });

    // Separadores huérfanos (al final de la lista, sin elementos detrás):
    // se conservan al final de la última sección con contenido.
    if (pendingSeparators.length && sections.length) {
        sections[sections.length - 1].items = sections[sections.length - 1].items.concat(pendingSeparators);
    }

    return sections;
}

function countTopicItems(topic) {
    let files = 0;
    let extras = 0;

    // Excluye separadores, marcadores vacíos y pendientes (url '#'): el
    // recuento debe reflejar solo lo que ya se puede abrir, igual que las
    // insignias de sección (topicSectionHtml / renderTopicSections).
    function isContent(entry) {
        if (!entry || entry.type === 'separator') return false;
        const name = String(entry.name || entry.title || '').trim();
        const url = String(entry.url || '');
        return name !== '' && url !== '' && url !== '#';
    }

    (topic.files || []).forEach(function (entry) {
        if (isContent(entry)) files++;
    });
    (topic.recommendations || []).forEach(function (entry) {
        if (isContent(entry)) extras++;
    });

    return { files: files, extras: extras };
}

// ==========================================
// FILAS DE RECURSO
// ==========================================

function resourceKind(url) {
    const u = String(url || '').toLowerCase();

    if (!u || u === '#') return { key: 'pendiente', label: 'Próximamente' };
    if (u.indexOf('youtube.com') > -1 || u.indexOf('youtu.be') > -1) return { key: 'video', label: 'Vídeo' };
    if (u.indexOf('notebooklm.google.com') > -1) return { key: 'ia', label: 'NotebookLM' };
    if (u.indexOf('drive.google.com') > -1) return { key: 'drive', label: 'Drive' };
    if (u.indexOf('docs.google.com') > -1) return { key: 'docs', label: 'Google Docs' };
    if (/\.pdf(\?|#|$)/.test(u)) return { key: 'pdf', label: 'PDF' };
    if (/\.(png|jpe?g|webp|gif|svg)(\?|#|$)/.test(u)) return { key: 'imagen', label: 'Imagen' };
    return { key: 'web', label: 'Web' };
}

function renderResourceRow(item) {
    const entry = item.entry;
    const label = String(entry.name || entry.title || '').trim();
    const kind = resourceKind(entry.url);

    if (!item.available) {
        return [
            '<div class="file-item is-pending">',
                '<span class="file-type" data-kind="pendiente">Próximamente</span>',
                '<span class="file-body">',
                    '<span class="file-name">', esc(label || 'Contenido del tema'), '</span>',
                    '<span class="file-meta">Todavía no está disponible.</span>',
                '</span>',
            '</div>'
        ].join('');
    }

    return [
        '<a class="file-item" href="', esc(entry.url), '" target="_blank" rel="noopener noreferrer">',
            '<span class="file-type" data-kind="', kind.key, '">', kind.label, '</span>',
            '<span class="file-body">',
                '<span class="file-name">', esc(label), '</span>',
            '</span>',
            '<span class="file-arrow" aria-hidden="true" title="Se abre en una pestaña nueva">&#8599;</span>',
        '</a>'
    ].join('');
}

function renderSeparator(item) {
    return [
        '<div class="resource-separator">',
            '<span class="separator-line"></span>',
            '<span class="separator-label">', esc(item.label), '</span>',
            '<span class="separator-line"></span>',
        '</div>'
    ].join('');
}

function renderTopicSections(topic) {
    const sections = buildTopicSections(topic);

    if (!sections.length) return '';

    return sections.map(function (section, index) {
        const headingId = 'seccion-' + topic.id + '-' + section.id;
        const rows = section.items.map(function (item) {
            return item.kind === 'separator' ? renderSeparator(item) : renderResourceRow(item);
        }).join('');

        const count = section.items.filter(function (item) {
            return item.kind === 'item' && item.available;
        }).length;

        return [
            '<section class="res-section res-section--', section.weight, '" aria-labelledby="', headingId, '">',
                '<header class="res-section-head">',
                    '<div>',
                        '<h2 id="', headingId, '">', esc(section.title), '</h2>',
                        section.hint ? '<p class="res-section-hint">' + esc(section.hint) + '</p>' : '',
                    '</div>',
                    count ? '<span class="res-count">' + pluralize(count, 'recurso', 'recursos') + '</span>' : '',
                '</header>',
                '<div class="file-list">', rows, '</div>',
            '</section>'
        ].join('');
    }).join('');
}

// ==========================================
// ACTIVIDADES INTERACTIVAS
// ==========================================
//
// Arquitectura por registro: cada tipo de actividad se declara UNA sola vez en
// ACTIVITY_TYPES y el motor (renderActivity / handleActivityClick /
// handleActivitySubmit) no lo conoce de forma específica. Añadir un tipo nuevo
// significa añadir una entrada al registro; el resto del archivo no cambia.
//
//   topic.activities[] = [{
//     type:        clave del registro (ver ACTIVITY_TYPES),
//     title:       'Qué es la fotosíntesis',
//     description: 'Qué contenido trabaja y por qué importa',
//     nivel:       'Básico' | 'Medio' | 'Avanzado'  (opcional: agrupa la sección),
//     preguntas:   payload del tipo (cada tipo documenta su forma).
//                  Es el contenedor único para TODOS los tipos: en tarjetas y
//                  visual cada elemento de «preguntas» es una tarjeta o un esquema.
//   }]
//
// Cada tipo del registro declara:
//   label     nombre que ve el alumno (chip del encabezado)
//   help      «cómo se utiliza» en una frase, mostrado siempre
//   mode      'evaluada'  → formulario con corrección y puntuación
//             'autoestudio' → material para repasar, sin corrección
//   feedback  'inline'  → se marca y explica cada pregunta al corregir
//             'resumen' → la corrección entera llega al final (exámenes)
//   build(q)  normaliza la entrada del autor
//   render(q, i, name, extra)  HTML de una pregunta
//   check(q, fieldset, pintar) → { answered, correct }
//   reset(fieldset) limpia el estado visual
//
// Sin cuentas, sin seguimiento, sin gamificación y sin IA: solo estado local de
// página. El estado de respuesta vive en el formulario, no en el modelo.
// Ningún ejemplo publicado: el esquema se documenta aquí y se prueba con datos
// sintéticos en tools/validate-activities.js.

const NIVEL_ORDER = ['Básico', 'Medio', 'Avanzado'];

function normalizeAnswer(value) {
    return normalizeText(String(value || ''));
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isCorrectAnswer(question, given) {
    const candidate = normalizeAnswer(given);
    if (!candidate) return false;
    // Se parte ANTES de normalizar: normalizeText elimina los símbolos.
    return (question.respuestas || []).some(function (accepted) {
        return String(accepted || '').split('|').some(function (part) {
            const target = normalizeAnswer(part);
            return target !== '' && candidate === target;
        });
    });
}

// ---------- piezas compartidas ----------

function actLegend(question, index, name) {
    return '<legend class="act-enunciado"><span class="act-num">' + (index + 1) + '.</span> ' + esc(question.enunciado || 'Pregunta') + '</legend>';
}

function actFeedbackSlot() {
    return '<div class="act-feedback" hidden tabindex="-1"></div>';
}

function actWriteFeedback(feedback, ok, explanation, extra) {
    if (!feedback) return;
    feedback.hidden = false;
    feedback.className = 'act-feedback ' + (ok === null ? 'is-empty' : (ok ? 'is-correct' : 'is-wrong'));
    const texto = ok === null ? (extra || 'Falta esta respuesta.')
        : (ok ? 'Respuesta correcta.' : 'Respuesta incorrecta.')
          + (explanation ? ' ' + explanation : '');
    feedback.innerHTML = '<p>' + esc(texto) + '</p>';
}

function actClearFeedback(root) {
    const slot = root.querySelector('.act-feedback');
    if (!slot) return;
    slot.hidden = true;
    slot.innerHTML = '';
    slot.className = 'act-feedback';
}

// ---------- construcción de preguntas ----------

function buildChoice(question) {
    return {
        kind: 'opcion',
        enunciado: question.enunciado || '',
        opciones: (question.opciones || []).slice(),
        correcta: typeof question.correcta === 'number' ? question.correcta : 0,
        pista: question.pista || '',
        explicacion: question.explicacion || ''
    };
}

function buildVF(question) {
    const built = buildChoice(question);
    built.opciones = ['Verdadero', 'Falso'];
    built.correcta = question.correcta ? 0 : 1;
    return built;
}

function buildShort(question) {
    return {
        kind: 'corta',
        enunciado: question.enunciado || '',
        respuestas: question.respuestas || (question.respuesta ? [question.respuesta] : []),
        pista: question.pista || '',
        explicacion: question.explicacion || ''
    };
}

// Un test admite preguntas mixtas: hay 'respuestas' → corta; si no, opción múltiple.
function buildMixed(question) {
    return (question.respuestas || question.respuesta) ? buildShort(question) : buildChoice(question);
}

function buildPractica(question) {
    return {
        enunciado: question.enunciado || '',
        contexto: question.contexto || '',
        pista: question.pista || '',
        solucion: question.solucion || (question.respuesta ? [question.respuesta] : []),
        explicacion: question.explicacion || ''
    };
}

function hashText(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) | 0;
    return Math.abs(hash);
}

function buildRelacionar(question) {
    const parejas = (question.parejas || []).map(function (pair) {
        return { concepto: pair.concepto, relacion: pair.relacion };
    });
    const pool = parejas.map(function (pair) { return pair.relacion; })
        .concat(question.distractores || []);
    // Baraja determinista: el mismo orden en cada render, sin aleatoriedad.
    const opciones = pool
        .map(function (text, i) { return { text: text, key: hashText(text) + i }; })
        .sort(function (a, b) { return a.key - b.key; })
        .map(function (item) { return item.text; });
    return {
        enunciado: question.enunciado || '',
        parejas: parejas,
        opciones: opciones,
        explicacion: question.explicacion || ''
    };
}

function buildTarjetas(question) {
    return {
        enunciado: question.enunciado || '',
        tarjetas: (question.tarjetas || []).map(function (card) {
            return { anverso: card.anverso, reverso: card.reverso };
        })
    };
}

function buildVisual(question) {
    return {
        enunciado: question.enunciado || '',
        imagen: question.imagen || '',
        alt: question.alt || question.pie || question.enunciado || '',
        pie: question.pie || '',
        etiquetas: (question.etiquetas || []).map(function (label, i) {
            return {
                x: Math.min(100, Math.max(0, Number(label.x) || 0)),
                y: Math.min(100, Math.max(0, Number(label.y) || 0)),
                texto: label.texto || ('Etiqueta ' + (i + 1))
            };
        })
    };
}

// ---------- render de preguntas ----------

function renderChoice(question, index, name, extra) {
    const options = question.opciones.map(function (option, i) {
        const id = name + '-o' + i;
        return [
            '<label class="act-opt" for="', id, '">',
                '<input type="radio" id="', id, '" name="', name, '" value="', i, '">',
                '<span class="act-opt-text">', esc(option), '</span>',
            '</label>'
        ].join('');
    }).join('');

    return [
        '<fieldset class="act-q', extra ? ' ' + extra : '', '" data-index="', index, '">',
            actLegend(question, index, name),
            options,
            question.pista ? '<p class="act-hint">Pista: ' + esc(question.pista) + '</p>' : '',
            actFeedbackSlot(),
        '</fieldset>'
    ].join('');
}

function renderShort(question, index, name, extra) {
    const id = name + '-text';
    return [
        '<div class="act-q', extra ? ' ' + extra : '', '" data-index="', index, '">',
            actLegend(question, index, name),
            '<label class="act-label" for="', id, '">Tu respuesta</label>',
            '<input class="act-input" type="text" id="', id, '" autocomplete="off" spellcheck="false">',
            question.pista ? '<p class="act-hint">Pista: ' + esc(question.pista) + '</p>' : '',
            actFeedbackSlot(),
        '</div>'
    ].join('');
}

function renderMixed(question, index, name) {
    const extra = 'act-q--' + question.kind;
    return question.kind === 'corta'
        ? renderShort(question, index, name, extra)
        : renderChoice(question, index, name, extra);
}

function renderRelacionar(question, index, name) {
    const rows = question.parejas.map(function (pair, i) {
        const id = name + '-r' + i;
        return [
            '<div class="act-rel-row">',
                '<label class="act-rel-term" for="', id, '">', esc(pair.concepto), '</label>',
                '<select class="act-rel-select" id="', id, '">',
                    '<option value="">Elige una relación…</option>',
                    question.opciones.map(function (option) {
                        return '<option value="', esc(option), '">', esc(option), '</option>';
                    }).join(''),
                '</select>',
            '</div>'
        ].join('');
    }).join('');

    return [
        '<fieldset class="act-q" data-index="', index, '">',
            actLegend(question, index, name),
            '<div class="act-rel">', rows, '</div>',
            actFeedbackSlot(),
        '</fieldset>'
    ].join('');
}

function renderPractica(question, index, name) {
    const id = name + '-dev';
    return [
        '<div class="act-q act-q--practica" data-index="', index, '">',
            actLegend(question, index, name),
            question.contexto ? '<p class="act-contexto">' + esc(question.contexto) + '</p>' : '',
            '<label class="act-label" for="', id, '">Tu desarrollo</label>',
            '<textarea class="act-textarea" id="', id, '" rows="4"></textarea>',
            question.pista ? '<p class="act-hint">Pista: ' + esc(question.pista) + '</p>' : '',
            question.solucion.length
                ? [
                    '<div class="act-solucion" hidden>',
                        '<h4>Solución</h4>',
                        '<ol class="act-pasos">', question.solucion.map(function (step) {
                            return '<li>' + esc(step) + '</li>';
                        }).join(''), '</ol>',
                        question.explicacion ? '<p class="act-explicacion">' + esc(question.explicacion) + '</p>' : '',
                    '</div>',
                    '<button type="button" class="btn-back act-ver-solucion" aria-expanded="false">Ver solución</button>'
                  ].join('')
                : '',
        '</div>'
    ].join('');
}

function renderTarjetas(question, index) {
    const cards = question.tarjetas.map(function (card, i) {
        return [
            '<button type="button" class="act-card" aria-pressed="false">',
                '<span class="act-card-face act-card-front">', esc(card.anverso), '</span>',
                '<span class="act-card-face act-card-back">', esc(card.reverso), '</span>',
            '</button>'
        ].join('');
    }).join('');

    return [
        '<div class="act-q act-q--tarjetas" data-index="', index, '">',
            question.enunciado ? '<p class="act-sub">' + esc(question.enunciado) + '</p>' : '',
            '<div class="act-cards">', cards, '</div>',
            '<div class="act-actions">',
                '<button type="button" class="btn-back act-revelar" aria-pressed="false">Revelar todas</button>',
            '</div>',
        '</div>'
    ].join('');
}

function renderVisual(question, index) {
    if (!question.imagen) return '';

    const marcadores = question.etiquetas.map(function (label, i) {
        return '<span class="act-marcador" style="left:', label.x, '%; top:', label.y, '%;">', (i + 1), '</span>';
    }).join('');

    const lista = question.etiquetas.map(function (label, i) {
        return '<li><span class="act-marcador-num">', (i + 1), '</span> ', esc(label.texto), '</li>';
    }).join('');

    return [
        '<div class="act-q act-q--visual" data-index="', index, '">',
            question.enunciado ? '<p class="act-sub">' + esc(question.enunciado) + '</p>' : '',
            '<figure class="act-visual">',
                '<img src="', esc(question.imagen), '" alt="', esc(question.alt), '" loading="lazy">',
                question.etiquetas.length ? marcadores : '',
                question.pie ? '<figcaption>' + esc(question.pie) + '</figcaption>' : '',
            '</figure>',
            question.etiquetas.length
                ? [
                    '<button type="button" class="btn-back act-toggle-etiquetas" aria-expanded="false" aria-controls="', index, '-etiquetas">Mostrar etiquetas</button>',
                    '<ol class="act-etiquetas" id="', index, '-etiquetas" hidden>', lista, '</ol>'
                  ].join('')
                : '',
        '</div>'
    ].join('');
}

// ---------- corrección (solo modos evaluados) ----------

function checkChoice(question, fieldset, paint) {
    const checked = fieldset.querySelector('input:checked');
    const feedback = fieldset.querySelector('.act-feedback');

    if (!checked) {
        actWriteFeedback(feedback, null, '', 'Falta esta respuesta.');
        return { answered: false, correct: false };
    }

    const given = Number(checked.value);
    const ok = given === question.correcta;

    if (paint) {
        fieldset.querySelectorAll('.act-opt').forEach(function (label, i) {
            const input = label.querySelector('input');
            input.disabled = true;
            if (i === question.correcta) label.classList.add('is-correct');
            if (i === given && !ok) label.classList.add('is-wrong');
        });
        actWriteFeedback(feedback, ok, question.explicacion);
    }

    return { answered: true, correct: ok };
}

function resetChoice(fieldset) {
    fieldset.querySelectorAll('.act-opt').forEach(function (label) {
        label.classList.remove('is-correct', 'is-wrong');
        const input = label.querySelector('input');
        input.disabled = false;
        input.checked = false;
    });
    actClearFeedback(fieldset);
}

function checkShort(question, fieldset, paint) {
    const input = fieldset.querySelector('.act-input');
    const feedback = fieldset.querySelector('.act-feedback');
    const given = input.value.trim();

    if (!given) {
        actWriteFeedback(feedback, null, '', 'Falta esta respuesta.');
        return { answered: false, correct: false };
    }

    const ok = isCorrectAnswer(question, given);

    if (paint) {
        input.disabled = true;
        input.classList.add(ok ? 'is-correct' : 'is-wrong');
        actWriteFeedback(feedback, ok, question.explicacion);
    }

    return { answered: true, correct: ok };
}

function resetShort(fieldset) {
    const input = fieldset.querySelector('.act-input');
    input.disabled = false;
    input.value = '';
    input.classList.remove('is-correct', 'is-wrong');
    actClearFeedback(fieldset);
}

function mixedCheck(question, fieldset, paint) {
    return question.kind === 'corta'
        ? checkShort(question, fieldset, paint)
        : checkChoice(question, fieldset, paint);
}

function mixedReset(fieldset) {
    (fieldset.classList.contains('act-q--corta') ? resetShort : resetChoice)(fieldset);
}

function checkRelacionar(question, fieldset, paint) {
    const selects = Array.prototype.slice.call(fieldset.querySelectorAll('.act-rel-select'));
    const feedback = fieldset.querySelector('.act-feedback');
    let correct = 0;
    let answered = 0;

    selects.forEach(function (select, i) {
        const esperada = question.parejas[i] ? question.parejas[i].relacion : '';
        const ok = select.value !== '' && select.value === esperada;
        if (select.value !== '') answered += 1;
        if (ok) correct += 1;
        if (paint) {
            select.disabled = true;
            select.classList.add(ok ? 'is-correct' : (select.value ? 'is-wrong' : 'is-empty'));
        }
    });

    if (!answered) {
        actWriteFeedback(feedback, null, '', 'Faltan relaciones por completar.');
        return { answered: false, correct: false };
    }

    const perfecto = correct === selects.length;
    if (paint) {
        actWriteFeedback(feedback, perfecto, question.explicacion,
            'Has acertado ' + correct + ' de ' + selects.length + ' relaciones.');
    }

    return { answered: true, correct: perfecto };
}

function resetRelacionar(fieldset) {
    fieldset.querySelectorAll('.act-rel-select').forEach(function (select) {
        select.disabled = false;
        select.value = '';
        select.classList.remove('is-correct', 'is-wrong', 'is-empty');
    });
    actClearFeedback(fieldset);
}

// ---------- registro de tipos ----------
//
// Añadir un tipo nuevo = añadir una entrada aquí. El motor no cambia.

// Adaptador: los constructores de arriba son por pregunta; el motor los aplica
// sobre activity.preguntas y obtiene la lista normalizada.
function allQuestions(builder) {
    return function (activity) {
        return (activity.preguntas || []).map(builder);
    };
}

const ACTIVITY_TYPES = {
    'test': {
        label: 'Test autocorregible',
        help: 'Responde a las preguntas y pulsa «Comprobar respuestas»: se corrige cada una y se explica el porqué.',
        mode: 'evaluada',
        feedback: 'inline',
        build: allQuestions(buildMixed),
        render: renderMixed,
        check: mixedCheck,
        reset: mixedReset
    },
    'examen': {
        label: 'Examen de repaso',
        help: 'Responde a todo y envía el examen: la corrección llega completa al final, sin pistas en caliente.',
        mode: 'evaluada',
        feedback: 'resumen',
        build: allQuestions(buildMixed),
        render: renderMixed,
        check: mixedCheck,
        reset: mixedReset
    },
    'opcion-multiple': {
        label: 'Opción múltiple',
        help: 'Elige una opción en cada pregunta y comprueba la respuesta.',
        mode: 'evaluada',
        feedback: 'inline',
        build: allQuestions(buildChoice),
        render: renderChoice,
        check: checkChoice,
        reset: resetChoice
    },
    'vf': {
        label: 'Verdadero o falso',
        help: 'Decide si cada enunciado es verdadero o falso y comprueba la respuesta.',
        mode: 'evaluada',
        feedback: 'inline',
        build: allQuestions(buildVF),
        render: renderChoice,
        check: checkChoice,
        reset: resetChoice
    },
    'respuesta-corta': {
        label: 'Respuesta corta',
        help: 'Escribe la respuesta con tus palabras; se aceptan las variantes indicadas en cada pregunta.',
        mode: 'evaluada',
        feedback: 'inline',
        build: allQuestions(buildShort),
        render: renderShort,
        check: checkShort,
        reset: resetShort
    },
    'relacionar': {
        label: 'Relacionar conceptos',
        help: 'Asocia cada concepto con su relación usando los desplegables y comprueba el resultado.',
        mode: 'evaluada',
        feedback: 'inline',
        build: allQuestions(buildRelacionar),
        render: renderRelacionar,
        check: checkRelacionar,
        reset: resetRelacionar
    },
    'practica': {
        label: 'Ejercicio práctico',
        help: 'Resuelve el ejercicio en tu cuaderno, complétalo aquí y consulta la solución paso a paso cuando quieras.',
        mode: 'autoestudio',
        build: allQuestions(buildPractica),
        render: renderPractica
    },
    'tarjetas': {
        label: 'Tarjetas de memoria',
        help: 'Pulsa cada tarjeta para voltearla y recuperar el concepto antes de mirar el reverso.',
        mode: 'autoestudio',
        build: allQuestions(buildTarjetas),
        render: renderTarjetas
    },
    'visual': {
        label: 'Recurso visual',
        help: 'Estudia el esquema y usa los marcadores para identificar cada parte antes de mostrar las etiquetas.',
        mode: 'autoestudio',
        build: allQuestions(buildVisual),
        render: renderVisual
    }
};

function getActivityType(activity) {
    return ACTIVITY_TYPES[activity && activity.type] || null;
}

const ACTIVITY_STORE = {};

function renderActivity(activity, index, topicId) {
    const type = getActivityType(activity);
    if (!type) return '';

    const preguntas = type.build(activity);
    if (!Array.isArray(preguntas) || !preguntas.length) return '';

    const formName = topicId + '-act' + index;
    const rendered = preguntas.map(function (question, i) {
        return type.render(question, i, formName, '');
    }).join('');

    if (!rendered) return '';

    let body = rendered;

    if (type.mode === 'evaluada') {
        ACTIVITY_STORE[formName] = { type: activity.type, questions: preguntas };
        body = [
            '<form class="act-form" data-form="', formName, '" novalidate>',
                rendered,
                '<div class="act-actions">',
                    '<button type="submit" class="btn-study">Comprobar respuestas</button>',
                    '<button type="button" class="btn-back act-reset" hidden>Reintentar</button>',
                '</div>',
                '<p class="act-score" hidden></p>',
                '<div class="act-resumen" hidden></div>',
            '</form>'
        ].join('');
    }

    return [
        '<article class="act" data-type="', esc(activity.type), '">',
            '<header class="act-head">',
                '<div class="act-head-main">',
                    '<h3>', esc(activity.title || ('Actividad ' + (index + 1))), '</h3>',
                    '<p class="act-meta">',
                        '<span class="act-type">', esc(type.label), '</span>',
                        activity.nivel ? '<span class="act-level">' + esc(activity.nivel) + '</span>' : '',
                    '</p>',
                '</div>',
            '</header>',
            activity.description ? '<p class="act-desc">' + esc(activity.description) + '</p>' : '',
            '<p class="act-help">', esc(type.help), '</p>',
            body,
        '</article>'
    ].join('');
}

function renderActivities(topic) {
    const activities = topic.activities || [];
    if (!activities.length) return '';

    const headingId = 'actividades-' + topic.id;
    const porNivel = {};
    const orden = [];

    activities.forEach(function (activity, index) {
        const nivel = activity.nivel || '';
        if (!porNivel[nivel]) {
            porNivel[nivel] = [];
            orden.push(nivel);
        }
        porNivel[nivel].push({ activity: activity, index: index });
    });

    const nivelesPresentes = NIVEL_ORDER.filter(function (nivel) { return porNivel[nivel]; });
    if (porNivel['']) nivelesPresentes.push('');
    const agrupado = nivelesPresentes.length > 1;

    const body = nivelesPresentes.map(function (nivel) {
        const inner = porNivel[nivel].map(function (entry) {
            return renderActivity(entry.activity, entry.index, topic.id);
        }).join('');

        if (!inner) return '';

        return [
            '<div class="act-nivel">',
                agrupado ? '<h3 class="act-nivel-title">' + esc(nivel || 'Sin nivel') + '</h3>' : '',
                inner,
            '</div>'
        ].join('');
    }).join('');

    if (!body) return '';

    return [
        '<section class="res-section res-section--actividades" aria-labelledby="', headingId, '">',
            '<header class="res-section-head">',
                '<div>',
                    '<h2 id="', headingId, '">Actividades interactivas</h2>',
                    '<p class="res-section-hint">Comprueba lo aprendido: se corrige cada respuesta y se explica el error, no solo la nota.</p>',
                '</div>',
            '</header>',
            body,
        '</section>'
    ].join('');
}

// ==========================================
// CORRECCIÓN E INTERACCIÓN DE ACTIVIDADES
// ==========================================

function resumenHtml(questions, results) {
    const items = questions.map(function (question, i) {
        const result = results[i] || { answered: false, correct: false };
        const estado = !result.answered ? 'Sin responder' : (result.correct ? 'Correcto' : 'Incorrecto');
        const clase = !result.answered ? 'is-empty' : (result.correct ? 'is-correct' : 'is-wrong');

        return [
            '<li class="act-resumen-item ', clase, '">',
                '<p class="act-resumen-titulo">',
                    '<span class="act-num">', (i + 1), '.</span> ',
                    esc(question.enunciado || ''),
                    ' <span class="act-resumen-estado">', estado, '</span>',
                '</p>',
                question.explicacion ? '<p class="act-resumen-exp">' + esc(question.explicacion) + '</p>' : '',
            '</li>'
        ].join('');
    }).join('');

    return '<h4>Corrección</h4><ol class="act-resumen-lista">', items, '</ol>';
}

function handleActivitySubmit(event) {
    const form = event.target;
    if (!form.classList || !form.classList.contains('act-form')) return;

    event.preventDefault();

    const stored = ACTIVITY_STORE[form.dataset.form];
    if (!stored) return;

    const type = getActivityType(stored);
    if (!type || type.mode !== 'evaluada') return;

    const fieldsets = Array.prototype.slice.call(form.querySelectorAll('.act-q'));
    if (!fieldsets.length) return;

    const pintarEnLinea = type.feedback === 'inline';
    const results = fieldsets.map(function (fieldset, i) {
        return type.check(stored.questions[i], fieldset, pintarEnLinea);
    });

    const correct = results.filter(function (result) { return result.correct; }).length;

    const score = form.querySelector('.act-score');
    score.hidden = false;
    score.textContent = 'Respuesta correcta en ' + correct + ' de ' + results.length + '.';
    score.className = 'act-score' + (correct === results.length ? ' is-perfect' : (correct < results.length / 2 ? ' is-low' : ''));

    const resumen = form.querySelector('.act-resumen');
    if (resumen) {
        resumen.hidden = pintarEnLinea;
        resumen.innerHTML = pintarEnLinea ? '' : resumenHtml(stored.questions, results);
    }

    fieldsets.forEach(function (fieldset) { fieldset.classList.add('is-checked'); });
    form.querySelector('.act-reset').hidden = false;

    if (pintarEnLinea) {
        const firstWrong = form.querySelector('.act-feedback:not([hidden])');
        if (firstWrong) firstWrong.focus();
    }
}

function resetActivityForm(form) {
    const stored = ACTIVITY_STORE[form.dataset.form];
    if (!stored) return;
    const type = getActivityType(stored);
    if (!type || !type.reset) return;

    form.querySelectorAll('.act-q').forEach(function (fieldset) {
        type.reset(fieldset);
        fieldset.classList.remove('is-checked');
    });

    const score = form.querySelector('.act-score');
    if (score) { score.hidden = true; score.textContent = ''; score.className = 'act-score'; }

    const resumen = form.querySelector('.act-resumen');
    if (resumen) { resumen.hidden = true; resumen.innerHTML = ''; }

    const reset = form.querySelector('.act-reset');
    if (reset) reset.hidden = true;

    const first = form.querySelector('.act-q input:not([type="hidden"]), .act-q select');
    if (first) first.focus();
}

function toggleSolution(button) {
    const question = button.closest('.act-q');
    if (!question) return;
    const solution = question.querySelector('.act-solucion');
    if (!solution) return;
    const visible = solution.hidden;
    solution.hidden = !visible;
    button.setAttribute('aria-expanded', String(visible));
    button.textContent = visible ? 'Ocultar solución' : 'Ver solución';
}

function toggleCard(card) {
    const activa = card.classList.toggle('is-flipped');
    card.setAttribute('aria-pressed', String(activa));
}

function toggleAllCards(button) {
    const body = button.closest('.act-q');
    if (!body) return;
    const cards = body.querySelectorAll('.act-card');
    const revelar = button.getAttribute('aria-pressed') !== 'true';
    cards.forEach(function (card) {
        card.classList.toggle('is-flipped', revelar);
        card.setAttribute('aria-pressed', String(revelar));
    });
    button.setAttribute('aria-pressed', String(revelar));
    button.textContent = revelar ? 'Ocultar todas' : 'Revelar todas';
}

function toggleLabels(button) {
    const body = button.closest('.act-q');
    if (!body) return;
    const lista = body.querySelector('.act-etiquetas');
    if (!lista) return;
    const visible = lista.hidden;
    lista.hidden = !visible;
    button.setAttribute('aria-expanded', String(visible));
    button.textContent = visible ? 'Ocultar etiquetas' : 'Mostrar etiquetas';
}

// Manejador único de clics sobre actividades: corrección, soluciones, tarjetas y
// etiquetas visuales. dashboard.js lo registra una sola vez.
function handleActivityClick(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    const reset = target.closest('.act-reset');
    if (reset) {
        const form = reset.closest('.act-form');
        if (form) resetActivityForm(form);
        return;
    }

    const solucion = target.closest('.act-ver-solucion');
    if (solucion) { toggleSolution(solucion); return; }

    const card = target.closest('.act-card');
    if (card) { toggleCard(card); return; }

    const revelar = target.closest('.act-revelar');
    if (revelar) { toggleAllCards(revelar); return; }

    const etiquetas = target.closest('.act-toggle-etiquetas');
    if (etiquetas) { toggleLabels(etiquetas); return; }
}

// Alias estable: dashboard.js sigue registrando handleActivityReset.
window.handleActivityReset = handleActivityClick;
