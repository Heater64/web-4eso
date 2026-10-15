// js/data/resourcesData.js
// Recursos de estudio - Métodos, IAs, Webs y más

const resourcesData = {
    categories: [
        {
            id: 'metodos',
            name: '📚 Métodos de Estudio',
            icon: '📖',
            color: '#2563EB',
            description: 'Técnicas y estrategias comprobadas para estudiar de forma más eficiente y retener información.',
            items: [
                {
                    id: 'feynman',
                    title: 'Técnica Feynman',
                    description: 'Método que consiste en explicar un concepto como si se lo enseñaras a un niño de 5 años. Si no puedes simplificarlo, no lo entiendes realmente.',
                    steps: [
                        'Elige un concepto que quieras aprender',
                        'Explícalo como si se lo enseñaras a un niño',
                        'Identifica las partes que no puedes explicar bien',
                        'Vuelve a estudiar esas partes',
                        'Repite el proceso hasta que puedas explicarlo con claridad'
                    ],
                    tips: 'Usa analogías y ejemplos cotidianos para hacer el concepto más accesible.'
                },
                {
                    id: 'pomodoro',
                    title: 'Técnica Pomodoro',
                    description: 'Método de gestión del tiempo que divide el estudio en intervalos de 25 minutos con descansos de 5 minutos.',
                    steps: [
                        'Elige una tarea a realizar',
                        'Configura un temporizador de 25 minutos',
                        'Trabaja en la tarea sin interrupciones',
                        'Cuando suene el temporizador, haz una pausa de 5 minutos',
                        'Cada 4 pomodoros, haz una pausa más larga (15-30 minutos)'
                    ],
                    tips: 'Usa aplicaciones como Forest o Focus To-Do para mantener el enfoque.'
                },
                {
                    id: 'spaced-repetition',
                    title: 'Repetición Espaciada',
                    description: 'Técnica que consiste en repasar el material en intervalos de tiempo cada vez mayores para fijarlo en la memoria a largo plazo.',
                    steps: [
                        'Estudia el material por primera vez',
                        'Repasa al día siguiente',
                        'Repasa a los 3 días',
                        'Repasa a la semana',
                        'Repasa a las 2 semanas',
                        'Repasa al mes'
                    ],
                    tips: 'Usa herramientas como Anki o Quizlet para crear tarjetas de estudio con repetición espaciada.'
                },
                {
                    id: 'active-recall',
                    title: 'Recuerdo Activo',
                    description: 'Técnica que consiste en intentar recordar la información sin mirar las notas, en lugar de releer pasivamente.',
                    steps: [
                        'Lee un fragmento de material',
                        'Cierra el libro y escribe todo lo que recuerdes',
                        'Compara con el original y revisa lo que has olvidado',
                        'Repite el proceso con diferentes secciones'
                    ],
                    tips: 'Haz preguntas a ti mismo: "¿Qué pasaría si...?" o "¿Cómo explicaría esto a alguien?"'
                },
                {
                    id: 'mapas-mentales',
                    title: 'Mapas Mentales',
                    description: 'Técnica visual que organiza la información en torno a un concepto central, usando ramas con palabras clave y colores.',
                    steps: [
                        'Escribe el tema principal en el centro',
                        'Añade ramas con los subtemas principales',
                        'Añade más ramas con detalles y ejemplos',
                        'Usa colores, dibujos y palabras clave',
                        'Revisa y añade conexiones entre ramas'
                    ],
                    tips: 'Usa herramientas digitales como MindMeister o XMind para crear mapas mentales interactivos.'
                },
                {
                    id: 'metodo-sq3r',
                    title: 'Método SQ3R',
                    description: 'Técnica de lectura comprensiva que consta de 5 pasos: Survey (Vista general), Question (Preguntas), Read (Lectura), Recite (Recitar) y Review (Revisar).',
                    steps: [
                        'Survey: Haz una vista general del material (títulos, subtítulos, imágenes)',
                        'Question: Formula preguntas sobre el contenido',
                        'Read: Lee el material buscando respuestas a tus preguntas',
                        'Recite: Explica en voz alta lo que has aprendido',
                        'Review: Revisa el material y las notas'
                    ],
                    tips: 'Dedica unos minutos a cada paso para obtener los mejores resultados.'
                }
            ]
        },
        {
            id: 'ias',
            name: '🤖 Mejores IAs para Estudiar',
            icon: '🧠',
            color: '#8b5cf6',
            description: 'Herramientas de inteligencia artificial que pueden ayudarte a estudiar, resolver dudas y entender conceptos complejos.',
            items: [
                {
                    id: 'notebooklm',
                    title: 'NotebookLM de Google',
                    description: 'IA de Google que permite subir documentos, videos y crear "cuadernos" de estudio donde puedes hacer preguntas sobre el material subido.',
                    features: [
                        'Sube PDFs, videos de YouTube, documentos de texto',
                        'Haz preguntas sobre el material subido',
                        'Genera resúmenes automáticos',
                        'Crea guías de estudio personalizadas',
                        'Cita las fuentes exactas de cada respuesta'
                    ],
                    howToUse: 'Ve a notebooklm.google.com, crea un cuaderno nuevo y sube tus materiales. Luego puedes hacer preguntas en lenguaje natural.',
                    bestFor: 'Ideal para resumir textos largos, entender conceptos complejos y preparar exámenes.'
                },
                {
                    id: 'chatgpt',
                    title: 'ChatGPT',
                    description: 'Modelo de lenguaje de OpenAI que puede responder preguntas, explicar conceptos, generar resúmenes y ayudar con tareas.',
                    features: [
                        'Responde preguntas sobre cualquier tema',
                        'Genera resúmenes de textos largos',
                        'Explica conceptos complejos de forma sencilla',
                        'Crea ejemplos y ejercicios prácticos',
                        'Traduce y parafrasea textos'
                    ],
                    howToUse: 'chat.openai.com, escribe tus preguntas en lenguaje natural y la IA te responderá.',
                    bestFor: 'Ideal para entender conceptos difíciles, resolver dudas rápidas y practicar con ejemplos.'
                },
                {
                    id: 'perplexity',
                    title: 'Perplexity AI',
                    description: 'IA que combina búsqueda en internet con respuestas generadas por IA, citando las fuentes de cada respuesta.',
                    features: [
                        'Busca información en tiempo real',
                        'Cita las fuentes de cada respuesta',
                        'Permite hacer preguntas de seguimiento',
                        'Organiza la información en formato claro y estructurado'
                    ],
                    howToUse: 'perplexity.ai, escribe tus preguntas y la IA buscará en internet y generará una respuesta con fuentes.',
                    bestFor: 'Ideal para investigar, encontrar información actualizada y verificar datos.'
                },
                {
                    id: 'gamma',
                    title: 'Gamma.ai (para presentaciones)',
                    description: 'IA que genera presentaciones automáticas a partir de un tema o texto, con diseño profesional.',
                    features: [
                        'Genera presentaciones completas en segundos',
                        'Diseño profesional y atractivo',
                        'Exporta a PowerPoint o Google Slides',
                        'Edita y personaliza el contenido generado'
                    ],
                    howToUse: 'gamma.app, escribe un tema y la IA generará una presentación completa.',
                    bestFor: 'Ideal para crear presentaciones rápidas y profesionales para exposiciones.'
                }
            ]
        },
        {
            id: 'webs',
            name: '🌐 Webs Útiles para Estudiar',
            icon: '🌍',
            color: '#10b981',
            description: 'Plataformas y sitios web con recursos educativos, ejercicios y material de apoyo para todas las asignaturas.',
            items: [
                {
                    id: 'khan-academy',
                    title: 'Khan Academy',
                    description: 'Plataforma educativa gratuita con cursos de matemáticas, ciencias, historia y más, con videos y ejercicios interactivos.',
                    features: [
                        'Cursos completos por niveles',
                        'Vídeos explicativos',
                        'Ejercicios interactivos',
                        'Seguimiento del progreso'
                    ],
                    url: 'khanacademy.org'
                },
                {
                    id: 'geogebra',
                    title: 'GeoGebra',
                    description: 'Herramienta matemática interactiva para geometría, álgebra, cálculo y estadística.',
                    features: [
                        'Calculadora gráfica',
                        'Geometría interactiva',
                        'Hoja de cálculo',
                        'Simulaciones 3D'
                    ],
                    url: 'geogebra.org'
                },
                {
                    id: 'wolfram-alpha',
                    title: 'Wolfram Alpha',
                    description: 'Motor de conocimiento computacional que resuelve problemas matemáticos, científicos y más.',
                    features: [
                        'Resuelve ecuaciones paso a paso',
                        'Calcula derivadas e integrales',
                        'Genera gráficos automáticos',
                        'Resuelve problemas de física, química y estadística'
                    ],
                    url: 'wolframalpha.com'
                },
                {
                    id: 'cambridge-dictionary',
                    title: 'Cambridge Dictionary',
                    description: 'Diccionario de inglés con definiciones, pronunciación, ejemplos y ejercicios de vocabulario.',
                    features: [
                        'Definiciones en inglés y español',
                        'Pronunciación en audio',
                        'Ejemplos de uso',
                        'Ejercicios de vocabulario'
                    ],
                    url: 'dictionary.cambridge.org'
                },
                {
                    id: 'canva',
                    title: 'Canva (para estudiar visualmente)',
                    description: 'Herramienta de diseño que permite crear mapas mentales, infografías, resúmenes visuales y presentaciones.',
                    features: [
                        'Plantillas de mapas mentales',
                        'Infografías personalizables',
                        'Resúmenes visuales',
                        'Presentaciones profesionales'
                    ],
                    url: 'canva.com'
                }
            ]
        },
        {
            id: 'guias',
            name: '📋 Guías y Plantillas',
            icon: '📋',
            color: '#f59e0b',
            description: 'Plantillas y guías prácticas para organizar tu estudio, planificar exámenes y mejorar tu productividad.',
            items: [
                {
                    id: 'guia-planificacion',
                    title: 'Guía de Planificación de Estudio',
                    description: 'Plantilla para organizar tu tiempo de estudio, establecer objetivos y hacer seguimiento de tu progreso.',
                    sections: [
                        'Define tus objetivos de estudio',
                        'Distribuye el tiempo por asignaturas',
                        'Establece metas diarias y semanales',
                        'Haz seguimiento de tu progreso',
                        'Ajusta el plan según tus necesidades'
                    ]
                },
                {
                    id: 'guia-examenes',
                    title: 'Guía para Enfrentar Exámenes',
                    description: 'Estrategias y consejos para preparar exámenes, manejar la ansiedad y rendir al máximo.',
                    sections: [
                        'Planifica tu estudio antes del examen',
                        'Técnicas de relajación para reducir la ansiedad',
                        'Estrategias para leer y entender las preguntas',
                        'Cómo organizar tus respuestas',
                        'Revisión final antes de entregar'
                    ]
                },
                {
                    id: 'template-resumen',
                    title: 'Plantilla de Resumen',
                    description: 'Plantilla estructurada para crear resúmenes efectivos de cualquier tema o asignatura.',
                    sections: [
                        'Título y tema principal',
                        'Ideas clave y conceptos importantes',
                        'Ejemplos y aplicaciones',
                        'Conexiones con otros temas',
                        'Preguntas de repaso'
                    ]
                }
            ]
        }
    ]
};

// ==========================================
// FUNCIONES DE ACCESO A DATOS
// ==========================================

function getResourceCategories() {
    return resourcesData.categories;
}

function getCategory(id) {
    return resourcesData.categories.find(c => c.id === id);
}

function getResourceItem(categoryId, itemId) {
    const category = getCategory(categoryId);
    if (!category) return null;
    return category.items.find(i => i.id === itemId);
}

function getRandomTip() {
    const tips = [
        '💡 La técnica Feynman: explica el concepto como si se lo enseñaras a un niño.',
        '⏰ Pomodoro: 25 minutos de estudio, 5 de descanso.',
        '🔄 Repetición espaciada: repasa al día siguiente, a los 3 días, a la semana...',
        '🧠 Recuerdo activo: intenta recordar sin mirar las notas.',
        '🗺️ Mapas mentales: organiza la información visualmente.',
        '📚 SQ3R: Survey, Question, Read, Recite, Review.',
        '🤖 NotebookLM: sube tus materiales y haz preguntas a la IA.',
        '🔍 Perplexity: busca información actualizada con fuentes verificadas.',
        '📊 Khan Academy: cursos gratuitos con ejercicios interactivos.',
        '📐 GeoGebra: calculadora gráfica y geometría interactiva.'
    ];
    return tips[Math.floor(Math.random() * tips.length)];
}

// ==========================================
// FUNCIÓN DE BÚSQUEDA EN RECURSOS
// ==========================================

function searchResources(query) {
    if (!query || query.trim() === '') {
        return [];
    }
    
    const normalized = normalizeText(query);
    const terms = getSearchTerms(query);
    const results = [];
    const seen = new Set();
    
    resourcesData.categories.forEach(category => {
        // Buscar en categoría
        if (flexibleMatch(category.name, terms) || flexibleMatch(category.description, terms)) {
            if (!seen.has(category.id)) {
                seen.add(category.id);
                results.push({
                    type: 'category',
                    id: category.id,
                    title: category.name,
                    subtitle: category.description,
                    icon: category.icon,
                    badge: 'Categoría',
                    categoryId: category.id,
                    itemId: null
                });
            }
        }
        
        // Buscar en items
        category.items.forEach(item => {
            if (flexibleMatch(item.title, terms) || flexibleMatch(item.description, terms)) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    results.push({
                        type: 'resource',
                        id: item.id,
                        title: item.title,
                        subtitle: `${category.name} · ${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}`,
                        icon: category.icon,
                        badge: 'Recurso',
                        categoryId: category.id,
                        itemId: item.id
                    });
                }
            }
        });
    });
    
    return results;
}

// ==========================================
// EXPORTAR
// ==========================================

window.resourcesData = resourcesData;
window.getResourceCategories = getResourceCategories;
window.getCategory = getCategory;
window.getResourceItem = getResourceItem;
window.searchResources = searchResources;
window.getRandomTip = getRandomTip;

console.log('✅ resourcesData.js cargado con recursos de estudio');