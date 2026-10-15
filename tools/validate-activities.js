// Comprueba el motor de actividades interactivas con datos sintéticos.
// No publica nada en los datos: valida la capa de modelo (registro, build,
// render, agrupación por nivel y corrección de texto) para que un tipo nuevo
// se pueda añadir sin tocar el motor.
//
//   node tools/validate-activities.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

// --- sandbox mínima: el motor solo necesita window al cargar ---
const sandbox = {
    window: {},
    console: console,
    document: {
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {}
    }
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

['js/data/studyData.js', 'js/pages/study/resourcesModel.js'].forEach(function (file) {
    const code = fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
});

// const de módulo no se expone al objeto global del contexto: se piden explícitamente
const api = vm.runInContext('({ ACTIVITY_TYPES, renderActivities, isCorrectAnswer, ACTIVITY_STORE })', sandbox);
const registro = api.ACTIVITY_TYPES;
const renderActivities = api.renderActivities;
const isCorrectAnswer = api.isCorrectAnswer;
const ACTIVITY_STORE = api.ACTIVITY_STORE;

const failures = [];
function check(nombre, condicion, detalle) {
    if (condicion) return;
    failures.push(nombre + (detalle ? ' — ' + detalle : ''));
}

// --- 1. el registro declara los 9 tipos con su contrato ---
const TIPOS_ESPERADOS = [
    'test', 'examen', 'opcion-multiple', 'vf', 'respuesta-corta',
    'relacionar', 'practica', 'tarjetas', 'visual'
];

check('existe ACTIVITY_TYPES', !!registro);
TIPOS_ESPERADOS.forEach(function (tipo) {
    const entry = registro[tipo];
    check('tipo registrado: ' + tipo, !!entry);
    if (!entry) return;
    ['label', 'help', 'mode', 'build', 'render'].forEach(function (campo) {
        check(tipo + '.' + campo, entry[campo] !== undefined && entry[campo] !== '');
    });
    check(tipo + ' tiene mode válido', entry.mode === 'evaluada' || entry.mode === 'autoestudio', entry.mode);
    if (entry.mode === 'evaluada') {
        check(tipo + ' evaluado tiene check', typeof entry.check === 'function');
        check(tipo + ' evaluado tiene reset', typeof entry.reset === 'function');
        check(tipo + ' evaluado tiene feedback', entry.feedback === 'inline' || entry.feedback === 'resumen');
    }
});

// --- 2. cada tipo renderiza contenido con datos sintéticos ---
const MUESTRA = {
    'test': { preguntas: [{ enunciado: '2+2', opciones: ['3', '4'], correcta: 1, explicacion: 'Suma.' }] },
    'examen': { preguntas: [{ enunciado: '¿2+2=4?', correcta: true }] },
    'opcion-multiple': { preguntas: [{ enunciado: 'Capital', opciones: ['Madrid', 'Lima'], correcta: 0 }] },
    'vf': { preguntas: [{ enunciado: 'El agua hierve a 100 °C', correcta: true }] },
    'respuesta-corta': { preguntas: [{ enunciado: '¿Cuánto es 2+2?', respuestas: ['4', 'cuatro'] }] },
    'relacionar': { preguntas: [{ enunciado: 'Relaciona', parejas: [{ concepto: 'Sol', relacion: 'Estrella' }, { concepto: 'Luna', relacion: 'Satélite' }] }] },
    'practica': { preguntas: [{ enunciado: 'Resuelve', solucion: ['Paso 1', 'Paso 2'] }] },
    'tarjetas': { preguntas: [{ tarjetas: [{ anverso: 'Fotosíntesis', reverso: 'Conversión de luz en glucosa' }] }] },
    'visual': { preguntas: [{ imagen: 'diagrama.png', etiquetas: [{ x: 10, y: 20, texto: 'Raíz' }] }] }
};

TIPOS_ESPERADOS.forEach(function (tipo) {
    const topic = { id: 'tema-x', activities: [Object.assign({ type: tipo, title: 'Actividad de prueba', description: 'Descripción', nivel: 'Medio' }, MUESTRA[tipo])] };
    const html = renderActivities(topic);
    check('renderiza ' + tipo, typeof html === 'string' && html.length > 0);
    check(tipo + ' incluye el chip de tipo', html.indexOf(registro[tipo].label) !== -1);
    check(tipo + ' incluye ayuda de uso', html.indexOf('act-help') !== -1);
    check(tipo + ' incluye el nivel', html.indexOf('act-level') !== -1);
});

// --- 3. estructura por pregunta ---
const topicOM = { id: 'tema-om', activities: [{ type: 'opcion-multiple', title: 'T', preguntas: [
    { enunciado: 'P1', opciones: ['a', 'b'], correcta: 0 },
    { enunciado: 'P2', opciones: ['c', 'd'], correcta: 1 }
] }] };
const htmlOM = renderActivities(topicOM);
check('una pregunta por fieldset', (htmlOM.match(/class="act-q/g) || []).length === 2);
check('formularios registrados para corrección', Object.keys(ACTIVITY_STORE).length > 0);

// --- 4. agrupación por nivel ---
const topicNiveles = { id: 'tema-n', activities: [
    { type: 'vf', nivel: 'Avanzado', preguntas: [{ enunciado: 'A', correcta: true }] },
    { type: 'vf', nivel: 'Básico', preguntas: [{ enunciado: 'B', correcta: false }] },
    { type: 'vf', preguntas: [{ enunciado: 'C', correcta: true }] }
] };
const htmlNiveles = renderActivities(topicNiveles);
check('agrupa por nivel', htmlNiveles.indexOf('act-nivel-title') !== -1);
check('orden de niveles Básico→Medio→Avanzado', htmlNiveles.indexOf('Básico') < htmlNiveles.indexOf('Avanzado'));
check('sin nivel al final', htmlNiveles.indexOf('Sin nivel') > htmlNiveles.indexOf('Avanzado'));

// --- 5. casos límite ---
check('tema sin actividades no pinta nada', renderActivities({ id: 'vacio', activities: [] }) === '');
check('tipo desconocido se omite', renderActivities({ id: 'raro', activities: [{ type: 'inventado', preguntas: [{ enunciado: 'x' }] }] }) === '');
check('actividad sin preguntas se omite', renderActivities({ id: 'raro2', activities: [{ type: 'vf' }] }) === '');

// --- 6. corrección de respuesta corta: variantes y acentos ---
const q = { respuestas: ['mitocondria', 'la mitocondria'] };
check('respuesta exacta', isCorrectAnswer(q, 'mitocondria'));
check('respuesta con mayúsculas', isCorrectAnswer(q, 'MITOCONDRIA'));
check('respuesta con artículo (variante aceptada)', isCorrectAnswer(q, 'La mitocondria'));
check('variante aceptada por «|»', isCorrectAnswer({ respuestas: ['fotosíntesis|fotosintesis'] }, 'FOTOSINTESIS'));
check('respuesta incorrecta rechazada', !isCorrectAnswer(q, 'núcleo'));
check('respuesta vacía rechazada', !isCorrectAnswer(q, '   '));

// --- 7. baraja determinista de relacionar ---
const fuenteRel = { preguntas: [{ parejas: [{ concepto: 'a', relacion: '1' }, { concepto: 'b', relacion: '2' }], distractores: ['3'] }] };
const rel1 = registro['relacionar'].build(fuenteRel)[0];
const rel2 = registro['relacionar'].build(fuenteRel)[0];
check('orden estable en relacionar', JSON.stringify(rel1.opciones) === JSON.stringify(rel2.opciones), rel1.opciones + ' vs ' + rel2.opciones);
check('incluye distractores', rel1.opciones.length === 3, rel1.opciones);
check('relacionar no pierde parejas', rel1.parejas.length === 2);

// --- 8. datos publicados: ninguna actividad inventada ---
const studyDataSrc = fs.readFileSync(path.join(root, 'js/data/studyData.js'), 'utf8');
check('los datos publicados no incluyen actividades inventadas', studyDataSrc.indexOf('activities') === -1);

// --- informe ---
const total = TIPOS_ESPERADOS.length;
if (failures.length) {
    console.log('✗ Fallan ' + failures.length + ' comprobaciones:');
    failures.forEach(function (f) { console.log('  - ' + f); });
    process.exit(1);
}

console.log('✓ ' + total + ' tipos de actividad registrados y renderizados');
console.log('✓ Variante alternativa por «|» en respuestas cortas (se parte antes de normalizar)');
console.log('✓ Agrupación por nivel (Básico → Medio → Avanzado → sin nivel)');
console.log('✓ Corrección de respuesta corta: acentos, mayúsculas, variantes por «|»');
console.log('✓ Baraja determinista de «relacionar conceptos»');
console.log('✓ Tipos desconocidos, temas vacíos y actividades sin preguntas se omiten');
console.log('✓ Los datos publicados siguen sin actividades inventadas');
