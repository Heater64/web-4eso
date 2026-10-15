// tools/validate-resources.js
// Comprueba que el modelo de recursos por tema no pierde ni duplica ningún
// elemento de los datos originales (js/data/studyData.js).
//
// Uso:  node tools/validate-resources.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

const context = { window: {}, console };
vm.createContext(context);

[
    'js/data/studyData.js',
    'js/data/resourcesData.js',
    'js/pages/study/resourcesModel.js'
].forEach(function (file) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, context, { filename: file });
});

const studyData = context.window.studyData;
const buildTopicSections = context.buildTopicSections;
const countTopicItems = context.countTopicItems;

let failures = 0;
let totalOriginal = 0;
let totalRendered = 0;

function fail(message) {
    failures++;
    console.log('  ✗ ' + message);
}

studyData.subjects.forEach(function (subject) {
    subject.topics.forEach(function (topic) {
        // 1. Elementos originales (excluyendo separadores y marcadores vacíos)
        const original = [];
        ['files', 'recommendations'].forEach(function (key) {
            (topic[key] || []).forEach(function (entry) {
                if (!entry || entry.type === 'separator') return;
                const name = String(entry.name || entry.title || '').trim();
                const url = String(entry.url || '');
                const isBlank = name === '' && (url === '' || url === '#');
                original.push({ key: key, entry: entry, isBlank: isBlank });
            });
        });

        const expected = original.filter(function (item) { return !item.isBlank; });
        const sections = buildTopicSections(topic);

        const rendered = [];
        sections.forEach(function (section) {
            section.items.forEach(function (item) {
                if (item.kind === 'item') rendered.push({ section: section.id, entry: item.entry });
            });
        });

        totalOriginal += expected.length;
        totalRendered += rendered.length;

        const label = subject.id + ' / ' + (topic.id || '(sin id)');

        if (expected.length !== rendered.length) {
            fail(label + ': esperaba ' + expected.length + ' elementos, se renderizan ' + rendered.length);
        }

        // 2. Ninguna entrada duplicada
        const counts = {};
        rendered.forEach(function (item) {
            const id = (item.entry.name || item.entry.title || '') + '|' + item.entry.url;
            counts[id] = (counts[id] || 0) + 1;
        });
        Object.keys(counts).forEach(function (id) {
            if (counts[id] > 1) fail(label + ': entrada duplicada -> ' + id);
        });

        // 3. Ninguna entrada original ausente
        expected.forEach(function (item) {
            const id = (item.entry.name || item.entry.title || '') + '|' + item.entry.url;
            const present = rendered.some(function (r) {
                return ((r.entry.name || r.entry.title || '') + '|' + r.entry.url) === id;
            });
            if (!present) fail(label + ': falta -> ' + id);
        });

        // 4. Conteo auxiliar coherente: countTopicItems solo cuenta recursos
        //    publicados (nombre + destino real). Los marcadores «Próximamente»
        //    con url '#' se renderizan como fila pendiente (checks 1–3) pero no
        //    suman en el «N recursos» de tarjetas y secciones.
        const counts2 = countTopicItems(topic);
        const expectedAvailable = expected.filter(function (item) {
            const name = String(item.entry.name || item.entry.title || '').trim();
            const url = String(item.entry.url || '');
            return name !== '' && url !== '' && url !== '#';
        });
        if (counts2.files + counts2.extras !== expectedAvailable.length) {
            fail(label + ': countTopicItems no cuadra (' + counts2.files + '+' + counts2.extras + ' vs ' + expectedAvailable.length + ')');
        }

        // 5. Marca de sección por defecto coherente
        sections.forEach(function (section) {
            if (!section.items.length) fail(label + ': sección vacía ' + section.id);
        });
    });
});

console.log('----------------------------------------');
console.log('Elementos originales : ' + totalOriginal);
console.log('Elementos renderizados: ' + totalRendered);
console.log(failures === 0 ? '✓ Sin pérdidas ni duplicados' : '✗ ' + failures + ' problemas');

process.exit(failures === 0 ? 0 : 1);
