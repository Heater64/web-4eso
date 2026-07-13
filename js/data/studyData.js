// js/data/studyData.js
// Todos los datos de la web de estudio - Estáticos

// ==========================================
// SISTEMA DE SINÓNIMOS PARA BÚSQUEDA
// ==========================================

const searchSynonyms = {
    // Matemáticas
    'matematicas': ['mates', 'mate', 'matemática', 'math', 'mat'],
    'mates': ['matematicas', 'mate', 'matemática', 'math', 'mat'],
    
    // Lengua
    'lengua': ['lenguaje', 'literatura', 'leng', 'castellano', 'lectura', 'lengua y literatura'],
    'lenguaje': ['lengua', 'literatura', 'leng', 'castellano', 'lectura'],
    
    // Física y Química
    'fisica': ['física', 'fis', 'física y química', 'fisica y quimica', 'fq', 'fisico', 'quimica', 'química'],
    'quimica': ['química', 'fisica', 'física', 'fq', 'física y química', 'fisica y quimica'],
    'física y química': ['fisica', 'quimica', 'fq', 'física', 'química'],
    
    // Números Reales
    'numeros reales': ['números reales', 'reales', 'num reales', 'reales numeros', 'números'],
    'reales': ['numeros reales', 'números reales', 'num reales'],
    
    // Ecuaciones
    'ecuaciones': ['ecuaciones y sistemas', 'ecuac', 'sistemas', 'sistemas de ecuaciones', 'ecs'],
    'sistemas': ['ecuaciones y sistemas', 'ecuaciones', 'sistemas de ecuaciones', 'ecs'],
    
    // Geometría
    'geometria': ['geometría', 'geo', 'geometrica', 'geom'],
    
    // Sintaxis
    'sintaxis': ['sintáctico', 'analisis sintactico', 'análisis sintáctico', 'sint'],
    
    // Movimiento y Fuerzas
    'movimiento': ['cinemática', 'cinematica', 'fuerzas', 'newton', 'movimiento y fuerzas'],
    'fuerzas': ['movimiento', 'cinemática', 'cinematica', 'newton', 'movimiento y fuerzas'],
    'cinematica': ['cinemática', 'movimiento', 'fuerzas', 'newton'],
    
    // Energía
    'energia': ['energía', 'trabajo', 'potencia', 'energía y trabajo'],
    'trabajo': ['energía', 'energia', 'potencia', 'energía y trabajo'],
    
    // Romanticismo
    'romanticismo': ['romantico', 'romántico', 'literatura del siglo xix', 'siglo xix', 'realismo'],
    'realismo': ['realismo', 'naturalismo', 'romanticismo', 'siglo xix'],
    'naturalismo': ['naturalismo', 'realismo', 'romanticismo', 'siglo xix'],
    
    // Apuntes
    'apuntes': ['apunte', 'resumen', 'resúmenes', 'resumenes', 'notas', 'teoria', 'teoría'],
    'apunte': ['apuntes', 'resumen', 'resúmenes', 'resumenes', 'notas'],
    'resumen': ['resumenes', 'resúmenes', 'apuntes', 'apunte'],
    
    // Ejercicios
    'ejercicios': ['ejercicio', 'problemas', 'problema', 'practica', 'práctica', 'actividades'],
    'ejercicio': ['ejercicios', 'problemas', 'problema', 'practica', 'práctica'],
    'problemas': ['ejercicios', 'ejercicio', 'problema', 'practica', 'práctica'],
    
    // Exámenes
    'examen': ['exámenes', 'exam', 'exams', 'evaluación', 'evaluacion', 'prueba', 'test', 'examen tipo'],
    'exámenes': ['examen', 'exam', 'exams', 'evaluación', 'evaluacion'],
    'test': ['examen', 'exámenes', 'prueba', 'evaluación', 'evaluacion'],
    
    // Guías
    'guia': ['guía', 'tutorial', 'guía rápida', 'tutorial', 'manual', 'ayuda'],
    'guía': ['guia', 'tutorial', 'guía rápida', 'manual'],
    
    // Simulador
    'simulador': ['interactivo', 'simulacion', 'simulación', 'laboratorio', 'lab'],
    'interactivo': ['simulador', 'simulacion', 'simulación'],
    
    // Videos
    'video': ['videos', 'vídeo', 'vídeos', 'youtube', 'clase', 'explicación', 'explicacion', 'tutorial video'],
    'videos': ['video', 'vídeo', 'vídeos', 'youtube', 'clase', 'explicación', 'explicacion'],
    'youtube': ['video', 'videos', 'vídeo', 'vídeos'],
    
    // PDF
    'pdf': ['archivo', 'documento', 'doc', 'lectura', 'texto'],
    
    // Específicos de temas
    'mat-t1': ['t1', 'tema1', 'tema 1', 'numeros reales', 'reales'],
    'mat-t2': ['t2', 'tema2', 'tema 2', 'ecuaciones', 'sistemas'],
    'mat-t3': ['t3', 'tema3', 'tema 3', 'geometria', 'geometría'],
    'len-t1': ['t1', 'tema1', 'tema 1', 'sintaxis'],
    'len-t2': ['t2', 'tema2', 'tema 2', 'romanticismo', 'realismo', 'siglo xix', 'naturalismo'],
    'fis-t1': ['t1', 'tema1', 'tema 1', 'movimiento', 'fuerzas', 'cinematica', 'cinemática', 'newton'],
    'fis-t2': ['t2', 'tema2', 'tema 2', 'energia', 'energía', 'trabajo', 'potencia'],
};

// ==========================================
// FUNCIÓN DE NORMALIZACIÓN DE TEXTO
// ==========================================

function normalizeText(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

// ==========================================
// FUNCIÓN DE BÚSQUEDA CON SINÓNIMOS
// ==========================================

function getSearchTerms(query) {
    const normalized = normalizeText(query);
    const words = normalized.split(/\s+/);
    const terms = new Set();
    
    // Añadir la consulta original normalizada
    terms.add(normalized);
    
    // Añadir cada palabra individual
    words.forEach(word => {
        if (word.length > 1) terms.add(word);
    });
    
    // Añadir sinónimos para la consulta completa
    if (searchSynonyms[normalized]) {
        searchSynonyms[normalized].forEach(syn => {
            terms.add(normalizeText(syn));
        });
    }
    
    // Añadir sinónimos para cada palabra
    words.forEach(word => {
        if (searchSynonyms[word]) {
            searchSynonyms[word].forEach(syn => {
                terms.add(normalizeText(syn));
            });
        }
    });
    
    // Añadir variantes de T-1, T1, t1, etc.
    const tMatch = normalized.match(/t\s*(\d+)/);
    if (tMatch) {
        const num = tMatch[1];
        terms.add(`tema ${num}`);
        terms.add(`tema${num}`);
        terms.add(`t-${num}`);
        terms.add(`t${num}`);
    }
    
    return Array.from(terms);
}

function flexibleMatch(text, searchTerms) {
    if (!text) return false;
    const normalized = normalizeText(text);
    
    for (const term of searchTerms) {
        if (normalized.includes(term)) return true;
    }
    return false;
}

// ==========================================
// ASIGNATURAS Y SU CONTENIDO
// ==========================================

const studyData = {
    subjects: [
        {
            id: 'matematicas',
            name: 'Matemáticas',
            icon: '📐',
            color: '#6366f1',
            description: '',
            searchTerms: ['matematicas', 'mates', 'mate', 'matemáticas', 'math', 'mat'],
            topics: [
                {
                    id: 'mates-t1',
                    title: 'Tema 1 - Números Reales',
                    description: 'Conjuntos numéricos, operaciones y propiedades',
                    searchTerms: ['numeros reales', 'reales', 'num reales', 'numeros',],
                    files: [
                        { type: 'separator', label: 'Resumen' },
                        { name: 'Apuntes Números Reales', url: '#' },
                        { type: 'separator', label: 'Ejercicios' },
                        { name: 'Ejercicios de repaso', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783520590/Ejercicios_Tema1_bejuyw.pdf' },
                        { type: 'separator', label: 'Solucionario' },
                        { name: 'Solucionari Llibre Vicens Vives Tema 1', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783520527/Solucionari_Llibre_VV_Tema1_Matematicas_ovdkg4.pdf' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Introducción' },
                        { title: '*Video 1* Que son los numeros Reales', url: 'https://www.youtube.com/watch?v=wmLsSNsDEtU&time_continue=50&source_ve_path=NzY3NTg&embeds_referring_euri=https%3A%2F%2Faules.edu.gva.es%2F' },
                        { type: 'separator', label: 'Ampliación' },
                        { title: '*Video 2* Que son los numeros Reales', url: 'https://www.youtube.com/watch?v=wmLsSNsDEtU&time_continue=50&source_ve_path=NzY3NTg&embeds_referring_euri=https%3A%2F%2Faules.edu.gva.es%2F' },
                        { type: 'separator', label: 'intervalos' },
                        { title: '*imagen* Resumen de Intervalos', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783519666/resum_intervalos_d93e8u.png' },
                        { title: '*Video* Intervalos', url: 'https://www.youtube.com/watch?v=ukBwDoQY8XQ&time_continue=8&source_ve_path=NzY3NTg&embeds_referring_euri=https%3A%2F%2Faules.edu.gva.es%2F' },
                        { type: 'separator', label: 'Raíces y radicales' },
                        { title: '*imagen* Resum de les propietats de Raices y Radicales', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783519964/image_1_m8wldu.png' },
                        { title: '*Video* Operaciones con radicales 01 - Multiplicación', url: 'https://www.youtube.com/watch?v=oQRf4lSIfY4' },
                        { title: '*Video* Operaciones con radicales 02 - Extraer factores', url: 'https://www.youtube.com/watch?v=n4LBiSxHv94' },
                        { title: '*Video* Operaciones con Radicales 03 - Racionalizar', url: 'https://www.youtube.com/watch?v=KTdBezXCjk0' },
                        { title: '*Video* Operaciones con radicales 04 - Suma', url: 'https://www.youtube.com/watch?v=eeY42p7kLhA' },
                        { type: 'separator', label: 'logaritmos' },
                        { title: '*Video* Logaritmos', url: 'https://www.youtube.com/watch?v=bDSBctt3Zv4' },
                        { type: 'separator', label: 'Ampliación' },
                        { title: '*Video* Suma y resta de logaritmos', url: 'https://www.youtube.com/watch?v=1ssmDU6h12M' },
                                    ]
                },
                {
                    id: 'mates-t2',
                    title: 'Tema 2 - Polinomis i Fraccions algebraiques',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'Resumen' },
                        { name: 'Apuntes', url: '#' },
                        { type: 'separator', label: 'Ejercicios' },
                        { name: 'Fitxa identitats notables i factoritzacio (amb solucions)', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783521319/ficha-18-identidades-notables-y-factorizacion_e6xtre.pdf' },
                        { name: 'Ejercicios resueltos operaciones con fracciones algebraicas', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783522405/EJERCICIOS_RESUELTOS_DE_OPERACIONES_CON_FRACCIONES_ALGEBRAICAS_qgydbq.pdf' },
                        { type: 'separator', label: 'Solucionario' },
                        { name: 'Solucionari Llibre Vicens Vives Tema 2', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783522406/Solucionari_Llibre_VV_Tema2_Matematicas_etkaqc.pdf' },
                                        ],
                    recommendations: [
                        { type: 'separator', label: 'División de Polinomios' },
                        { title: '*Video* División de Polinomios (a partir del minuto 2:02)', url: 'https://www.youtube.com/watch?v=bEgOof8VMxs' },
                        { type: 'separator', label: 'Teorema del Residuo' },
                        { title: '*Video* Aplicacions del Teorema del Residu', url: 'https://www.youtube.com/watch?v=LTDXp8okBdk' },
                        { type: 'separator', label: 'Factorización de Polinomios 2DO GRADO' },
                        { title: '*Video* Factorització de polinomis de grau 2', url: 'https://www.youtube.com/watch?v=bSyIDUf_K1k' },
                        { type: 'separator', label: 'Factorización de Polinomios con Ruffini' },
                        { title: '*Video* Factorització de polinomis amb Ruffini', url: 'https://www.youtube.com/watch?v=Kn15S7w4IA8' },
                        { type: 'separator', label: 'SIMPLIFICACIÓN DE FRACCIONES ALGEBRAICAS' },
                        { title: '*Video* Simplificació de fraccions algebraiques', url: 'https://www.youtube.com/watch?v=Uk3f_2I5y7w' },
                        { type: 'separator', label: 'Suma y Resta de Fracciones Algebraicas' },
                        { title: '*Video* Suma i resta de fraccions algebraiques', url: 'https://www.youtube.com/watch?v=SakGoz9HMEs' },
                        { type: 'separator', label: 'PRODUCTO Y COCIENTE DE FRACCIONES ALGEBRAICAS' },
                        { title: '*Video* Producte de fraccions algebraiques', url: 'https://www.youtube.com/watch?v=5zeBJ80al30' },
                        { type: 'separator', label: 'QUOCIENTE DE FRACCIONES ALGEBRAICAS' },
                        { title: '*Video* Quocient de fraccions algebraiques', url: 'https://www.youtube.com/watch?v=VMupuwYPDjA' },
                    ]
                },
                {
                    id: 'mates-t3',
                    title: 'Tema 3 - Ecuacions, inecuacions i sistemes',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'RESUMEN' },
                        { name: 'Apuntes', url: '#' },
                        { type: 'separator', label: 'EJERCICIOS' },
                        { name: ' EJERCICIOS de ECUACIONES y SISTEMAS', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783522716/ecuaciones_y_sistemas_swqo6i.pdf' },
                        { name: 'Equacions per a repasar', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783523151/TREBALL_EQUACIONS_bexrsv.pdf' },
                        { type: 'separator', label: 'SOLUCIONARIO' },
                        { name: 'Solucionari Llibre Vicens Vives Tema 3', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783523108/Solucionari_Llibre_VV_Tema3_Matematicas_rv5crl.pdf' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Introducción' },
                        { title: '*Video* Equacions, polinomis i altres termes:', url: 'https://www.youtube.com/watch?v=D2jWlKcMem0' },
                        { type: 'separator', label: 'Equacions de 2n grau' },
                        { title: '*Video* Completes', url: 'https://www.youtube.com/watch?v=tmw23jKbGnM' },
                        { title: '*Video* Incompletes', url: 'https://www.youtube.com/watch?v=L9lAfMBFcdg' },
                        { type: 'separator', label: 'Equacions biquadrades' },
                        { title: '*Video* Equacions biquadrades (només exponents parells: 4, 2, 0)', url: 'https://www.youtube.com/watch?v=TxJYjFhJK1w' },
                        { type: 'separator', label: 'Equacions racionals' },
                        { title: '*Video* Equacions racionals (amb x al denominador)', url: 'https://www.youtube.com/watch?v=QU5h_Ex7dhk' },
                        { type: 'separator', label: 'Equacions IRRACIONALS' },
                        { title: '*Video* Equacions irracionals (amb radicals)', url: 'https://www.youtube.com/watch?v=0kImG9PkGO0' },
                        { type: 'separator', label: 'Equacions EXPONENCIALS' },
                        { title: '*Video* Equacions exponencials', url: 'https://www.youtube.com/watch?v=xxp7O2M3dDA' },
                        { type: 'separator', label: 'Equacions LOGARITMIQUES' },
                        { title: '*Video* Equacions logarítmiques', url: 'https://www.youtube.com/watch?v=z5WDNFfSifo' },
                    ]
                },
                {
                    id: 'mates-t4',
                    title: 'Tema 4 - Sistemas de ecuaciones e inecuacions',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'RESUMEN' },
                        { name: 'Apuntes', url: '#' },
                        { type: 'separator', label: 'EJERCICIOS' },
                        { name: 'Problemas resueltos de sistemas de ecuaciones', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783523881/PROBLEMAS_SISTEMAS_DE_ECUACIONES_resueltos_ndmeov.pdf' },
                        { type: 'separator', label: 'SOLUCIONARIO' },
                        { name: 'Solucionari Llibre Vicens Vives Tema 4', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783523446/Solucionari_Llibre_VV_Tema4_Sistemes_inequacions_ej6mqb.pdf' },
                        
                    ],
                    recommendations: [
                        { type: 'separator', label: '-----SISTEMES DE ECUACIONS LINEALS-----' },
                        { type: 'separator', label: 'Mètode de substitucióN' },
                        { title: '*Video* SISTEMES DE ECUACIONS LINEALS Mètode de substitució', url: 'https://www.youtube.com/watch?v=RRWTj18BSBE' },
                        { type: 'separator', label: 'MÉTODO DE IGUALACIÓN'},
                        { title: '*Video* Mètode de igualació', url: 'https://www.youtube.com/watch?v=dTYAQHl43xM' },
                        { type: 'separator', label: 'Mètode de REDUCCIÓN' },
                        { title: '*Video* Mètode de reducció', url: 'https://www.youtube.com/watch?v=ojKpCQmxmUA' },
                        { type: 'separator', label: 'Mètode GRÁFICO'},
                        { title: '*Video* Mètode gràfic', url: 'https://www.youtube.com/watch?v=ZWFIxwcHTKY' },
                        { type: 'separator', label: '-----SISTEMAS DE ECUANES NO LINEALES-----'},
                        { title: '*Video* SISTEMES DE EQUACIONS NO LINEALS', url: 'https://www.youtube.com/watch?v=uVzCg8sOhmI' },
                        { type: 'separator', label: 'SISTEMA DE ECUACIONES LOGARITMICAS'},
                        { title: '*Video* SISTEMES DEEQUACIONS LOGARÍTMIQUES', url: 'https://www.youtube.com/watch?v=r4ZPj5rdlAI' },
                        { type: 'separator', label: 'INECUACIONES CON UNA INCÓGNITA'},
                        { title: '*Video* INEQUACIONS AMB UNA INCÒGNITA', url: 'https://www.youtube.com/watch?v=6cVczQWNtqk' },
                        { type: 'separator', label: 'SISTEMA DE ECUACIONES CON UNA INCOGNITA'},
                        { title: '*Video* SISTEMES DE INEQUACIONS AMB UNA INCÒGNITA', url: 'https://www.youtube.com/watch?v=3I4D2aQ5L1I' },
                    ]
                },
                {
                    id: 'mates-t6',
                    title: 'Tema 6 - Trigonometría',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'RESUMEN'},
                        { name: 'Apuntes', url: '#' },
                        { type: 'separator', label: 'EJERCICIOS'},
                        { name: 'Problemas Trigonometría 1', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783530374/TREBALL_TRIGONOMETRIA_2_zj1uwq.pdf' },
                        { type: 'separator', label: 'SOLUCIONARIO'},
                        { name: 'Solucionari Llibre Vicens Vives Tema 6', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783530371/Solucionari_Llibre_VV_Tema6_Trigonometria_Mates_fxclso.pdf' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Introducción' },
                        { title: '*Video* Trigonometría: Introducción', url: 'https://www.youtube.com/watch?v=x_65e-wVTeg' },
                        { type: 'separator', label: 'RAZONES TRIGONOMETRICAS'},
                        { title: '*Video* Raons trigonomètriques: nocions bàsiques', url: 'https://www.youtube.com/watch?v=Xjf9Aahm28g' },
                        { title: '*Video* Gato meme', url: 'https://www.youtube.com/watch?v=sgvAbaNlXvA' }, 
                        { type: 'separator', label: 'RESOLUCION DE PROBLEMAS'},
                        { title: '*Video* Calculo de la altura de un edifici, coneguts els angles de observación', url: 'https://www.youtube.com/watch?v=t7lYIDv2Voc' },
                        { title: '*Video* Calculo de un objecte elevat entre dos punts, des dels quals se observa:', url: 'https://www.youtube.com/watch?v=XJ2mOyPtfos' },

                    ]
                },
                {
                    id: 'mates-t7',
                    title: 'Tema 7 - Geometría Analítica',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'RESUMEN'},
                        { name: 'Apuntes', url: '#' },
                        { type: 'separator', label: 'SOLUCIONARIO'},
                        { name: 'Solucionari Llibre Vicens Vives Tema 7', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783530666/Solucionari_Llibre_VV_Tema7_Geometria_anal%C3%ADtica_alswhv.pdf' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Introducción' },
                        { title: '*Video* Geometría Analítica: Introducción', url: 'https://www.youtube.com/watch?v=il61wi97yzo' },
                        { type: 'separator', label: 'VECTORES'},
                        { title: '*Video* Operacions amb vectors', url: 'https://www.youtube.com/watch?v=sAIlbzRejMA' },
                        { title: '*Video* Punt mig i vectors paral·lels', url: 'https://www.youtube.com/watch?v=BH2Vf7JV4pI' },
                        { type: 'separator', label: 'ECUACIONES DE LA RECTA'},
                        { title: '*Video* Equacions de la recta 1', url: 'https://www.youtube.com/watch?v=dTvEo9us32g' },
                        { title: '*Video* Ecuacions de la recta 2', url: 'https://www.youtube.com/watch?v=ojtTWTovGGw' },
                        { title: '*Video* Ecuacions de la recta 3', url: 'https://www.youtube.com/watch?v=9wOkJ1EAd6s' },
                    ]
                },
                {
                    id: 'mates-t8',
                    title: 'Tema 8 - FUNCIONES',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'RESUMEN'},
                        { name: 'Apuntes', url: '#' },
                        { type: 'separator', label: 'Ejercicios'},
                        { name: 'Ejercicios de funciones con gráficas', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783536246/Exercicis_de_funcions_amb_gr%C3%A0fiques_isz8e8.pdf'},
                        { type: 'separator', label: 'SOLUCIONARIO'},
                        { name: 'Solucionari Llibre Vicens Vives Tema 8', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783536242/Solucionari_Llibre_VV_Tema8_Funcions_Caracteristiques_wufib1.pdf' },

                    ],
                    recommendations: [
                        { type: 'separator', label: 'INTRODUCCIÓN' },
                        { title: 'Funciones', url: 'https://www.youtube.com/watch?v=3Ir3JMWIjbQ' },
                        { type: 'separator', label: 'Monotonía' },
                        { title: 'Monotonia: Intervals de creixement i decreixement: ', url: 'https://www.youtube.com/watch?v=-eHSOoPkPuI' },
                        { title: 'Extrems duna funció: màxims i mínims relatius i absoluts ', url: 'https://www.youtube.com/watch?v=RDsb-QaqoE8' },
                        { title: 'Taxa de Variació Mitjana (TVM)', url: 'https://www.youtube.com/watch?v=h4XeSAFuHUc' },

                    ]
                },
            ]
        },
        {
            id: 'fisica',
            name: 'Física',
            icon: '⚛️',
            color: '#f59e0b',
            description: '',
            searchTerms: ['fisica', 'física', 'fis', 'fq'],
            topics: [
                {
                    id: 'fisica-t0',
                    title: 'Tema 0',
                    description: 'Libro Dosier completo',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'Libro FiQ - 4ESO' },
                        { name: 'Libro', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783536970/Physics_Chemistry_Activities_2024_1_ln0mhm.pdf' },
                    ],
                    recommendations: []
                },
                {
                    id: 'fisica-t1',
                    title: 'Tema 1 - KINEMATICKS',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'Resumen' },
                        { name: 'Tema Completo', url: 'https://drive.google.com/file/d/1H4ecByu2tTztMEHvTCR0wXwELhF9rIeo/view?usp=sharing' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Ejercicios para repasar el examen' },
                        { title: 'Ejercicios resueltos sobre caiguda lliure i llançament vertical', url: 'https://raizcuadrada.es/cinematica-4o-eso-solucion-ejercicios/' },

                    ]
                },
                {
                    id: 'fisica-t2',
                    title: 'Tema 2 - DYNAMICS',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'Resumen' },
                        { name: 'Tema Completo', url: 'https://drive.google.com/file/d/1U0K09vDp3CaXZ0qo9KCqwP1LFzo7pEfV/view?usp=sharing' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Ejercicios extra' },
                        { title: 'Ejercicios de Dinámica', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783537700/DIN%C3%80MICA_1_cemolj.pdf' },


                    ]
                },
                {
                    id: 'fisica-t4',
                    title: 'Tema 4 - Mechanical Work & Energy',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'Resumen' },
                        { name: 'Tema Completo', url: 'https://drive.google.com/file/d/1WzVJWKu_IVdcO4FYOD71c-BowKZGJ5Qk/view?usp=sharing' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Ecuaciones' },
                        { title: 'Ejercicios de Dinámica', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783537885/Unit_4._Equations_1_zmxgca.pdf' },
                    ]
                },
            ]
        },
        {
            id: 'quimica',
            name: 'Química',
            icon: '🧪',
            color: '#8b5cf6',
            description: '',
            searchTerms: ['quimica', 'química', 'quim', 'q'],

            topics: [
                {
                    id: 'quimica-t6',
                    title: 'Tema 6 - Chemical bond and IUPAC nomenclature',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { type: 'separator', label: 'Resumen' },
                        { name: 'Tema Completo', url: 'https://drive.google.com/file/d/1zADdwPjuXa21am_5lNhuHuSJbQRKkIXe/view?usp=sharing' },
                        { name: 'Resumen de clase', url: 'https://drive.google.com/file/d/1tNjK1HKanePYbLe854xOiY_tw9kW2R3f/view?usp=sharing' },
                        { name: 'Resum Formulació i Nomenclatura Compostos BINARIS', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538427/Resum_formulaci%C3%B3_binaris_4tESO_2_eun2k0.pdf' },
                        { name: 'Resum Formulació i Nomenclatura Compostos TERNARIS', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538430/Resum_formulaci%C3%B3_ternaris_4tESO_2_cwvizx.pdf' },
                        { type: 'separator', label: 'Tabla de valencias' },
                        { name: 'Tabla de valencias', url: 'https://drive.google.com/file/d/1rg4rssD0UrTWiwfGkkJnLoDSqzVIQ6nn/view?usp=sharing' },
                        { type: 'separator', label: 'Formulación' },
                        { name: 'Compuestos Binarios', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538239/Formulaci%C3%B3_binaris_2_qmxr46.pdf' },
                        { type: 'separator', label: 'Modelo de EXAMEN' },
                        { name: 'MODELO DE EXAMEN', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538317/examen_formulaci%C3%B3n_inorg%C3%A1nica_1_2_tirkgq.pdf' },
                        

                    ],
                    recommendations: [
                        { type: 'separator', label: 'Nomenclatura' },
                        { title: '*Video*', url: 'https://www.youtube.com/watch?v=iYonC0W2pXI' },

                    ]
                },
                {
                    id: 'quimica-t7',
                    title: 'Tema 7 - Chemical reactions',
                    description: '',
                    searchTerms: [''],
                    files: [
                         { type: 'separator', label: 'LAS REACCIONES QUÍMICAS' },
                        { name: 'Tipos de reacciones químicas', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538654/LES_REACCIONS_QU%C3%8DMIQUES_1_yehpdl.pdf' },
                        { type: 'separator', label: 'REPASO DE TERCERO' },
                        { name: 'Ajuste de ecuaciones químicas', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538767/Ej_ajuste_de_ecuaciones_qu%C3%ADmicas_1_ucykkh.pdf' }, 
                        { type: 'separator', label: 'CÁLCULOS DE CANTIDAD DE SUSTANCIA' },
                        { name: 'cantidad de substancia', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538837/Cantidad_de_sustancia_1_iqjqzz.pdf' },
                        { type: 'separator', label: 'CÁLCULOS ESTEQUIOMÉTRICOS' },
                        { name: 'calculos estequiometricos', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783538839/C%C3%A0lculs_estequim%C3%A8trics_esquema_1_lz9sys.pdf' },
                    ],
                    recommendations: []
                },
            ]
        },
        {
            id: 'biologia',
            name: 'Biología',
            icon: '🌱',
            color: '#10b981',
            description: '',
            searchTerms: ['biologia', 'biología', 'bio', 'bl'],

            topics: [
                {
                    id: 'examenes-biologia',
                    title: 'Examenes',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: 'Examen Origen de la vida', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783540486/EX_origen_vida_2_awzoio.pdf' },
                        { name: 'Examen Células', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783540512/EXAMEN_T1_4rt_BIO_2_r0x2nf.pdf' },
                        { name: 'Problemas De Genetica', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783540546/Problemas_genetica_AULES_2_hjrtzc.pdf' },
                        { name: 'Guía para solucionar los problemas de genética', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783541218/Guia_problemes_2__compressed_bqwas2.pdf' },

                    ],
                    recommendations: []
                },
                {
                    id: 'biologia-t1',
                    title: 'Tema 1 - La tierra en el universo',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: 'Eclipses y estaciones', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783541516/ECLIPSIS_I_ESTACIONS_1_sdrgw7.pdf' },

                    ],
                    recommendations: []
                },
            ]
        },
        {
            id: 'valenciano',
            name: 'Valenciano',
            icon: '📖',
            color: '#3b82f6',
            description: '',
            searchTerms: ['valenciano', 'valencia', 'val', 'v'],

            topics: [
                {
                    id: 'valenciano-t1',
                    title: '',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: '', url: '#' },
                        { name: '', url: '#' }
                    ],
                    recommendations: []
                },
            ]
        },
        {
            id: 'historia',
            name: 'Historia',
            icon: '🌍',
            color: '#3b82f6',
            description: '',
            searchTerms: ['historia', 'hist', 'h'],
            topics: [
                {
                    id: 'historia-t1',
                    title: 'Tema 1 - Antiguo Regimen y Revolución Francesa',
                    description: '',
                    searchTerms: [''],
                    files: [
                        
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Resumen del tema' },
                        { title: 'NotebookLM Antiguo resimen y Revolución Francesa', url: 'https://notebooklm.google.com/notebook/3b3fbccd-58fe-4b0f-ba6a-c1bb5948bf64' },
                    ]
                },
                {
                    id: 'historia-t2',
                    title: 'Tema 2 - Revolución Industrial',
                    description: '',
                    searchTerms: [''],
                    files: [
                        
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Resumen del tema' },
                        { title: 'NotebookLM Revolución Industrial', url: 'https://notebooklm.google.com/notebook/db1a3985-85f1-4597-85ec-4be5a03eede5' },
                    ]
                },
                {
                    id: 'historia-t3',
                    title: 'Tema 3 - LIBERALISME I NACIONALISME EL RÈGIM LIBERAL A ESPANYA (1814-1868)',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: 'Tema 3', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783541941/T3_MAQUETAT_1_vguhji.pdf' },
                        { name: 'Actividades', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783541961/ACT_T3_MAQUETAT_ipkiyb.pdf' },
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Resumen del tema' },
                        { title: 'NotebookLM Absolutismo y Liberalismo', url: 'https://notebooklm.google.com/notebook/8c8c385b-31da-4425-8ca6-df2c48fb1202' },
                    ]
                },
                {
                    id: 'historia-t4',
                    title: 'Tema 4 - ESPANYA A FINALS DEL SEGLE XIX. DEL SEXENNI DEMOCRÀTIC A LA RESTAURACIÓ (1868-1900)',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: 'Tema 4', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783542203/T4_1_q8bmgp.pdf' },
                        { name: 'Actividades', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783542252/ACT_T4_1_pr6kkc.pdf' }
                    ],
                    recommendations: [
                        { type: 'separator', label: 'Resumen del tema' },
                        { title: 'EL SEXENNI DEMOCRÀTIC A LA RESTAURACIÓ (1868-1900)', url: 'https://notebooklm.google.com/notebook/1df4633d-98e3-42a2-98bc-8a543855c216' },
                    ]
                },
                {
                    id: 'historia-t5',
                    title: 'Tema 5 - CRISI DE LA RESTAURACIÓ I SEGONA REPÚBLICA',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: 'Tema 5', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783542256/T5_MAQUETAT_2_n0yjxq.pdf' },
                        { name: 'Actividades', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783542288/ACT_T5_MAQUETAT_1_2_hwbv30.pdf' }
                    ],
                    recommendations: []
                },
                {
                    id: 'historia-t6',
                    title: 'Tema 6 - GUERRA CIVIL I FRANQUISME',
                    description: '',
                    searchTerms: [''],
                    files: [
                        { name: 'Tema 6', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783542349/T6_MAQUETAT_2_wlz3wg.pdf' },
                        { name: 'Actividades', url: 'https://res.cloudinary.com/dcsent4fs/image/upload/v1783542403/ACT_T6_MAQUETAT_2__compressed_w4ihw0.pdf' }
                    ],
                    recommendations: []
                },
            ]
        },
        
    ]
};

// ==========================================
// FUNCIONES DE ACCESO A DATOS
// ==========================================

function getSubjects() {
    return studyData.subjects;
}

function getSubject(id) {
    return studyData.subjects.find(s => s.id === id);
}

function getTopics(subjectId) {
    const subject = getSubject(subjectId);
    return subject ? subject.topics : [];
}

function getFiles(topicId) {
    for (const subject of studyData.subjects) {
        for (const topic of subject.topics) {
            if (topic.id === topicId) {
                return topic.files || [];
            }
        }
    }
    return [];
}

function getRecommendations(topicId) {
    for (const subject of studyData.subjects) {
        for (const topic of subject.topics) {
            if (topic.id === topicId) {
                return topic.recommendations || [];
            }
        }
    }
    return [];
}

// ==========================================
// FUNCIÓN DE BÚSQUEDA MEJORADA
// ==========================================

function searchAll(query) {
    if (!query || query.trim() === '') {
        return { subjects: [], topics: [] };
    }
    
    const searchTerms = getSearchTerms(query);
    const results = { subjects: [], topics: [] };
    const seenSubjects = new Set();
    const seenTopics = new Set();
    
    studyData.subjects.forEach(subject => {
        let subjectMatched = false;
        
        // Buscar en asignatura
        const subjectTexts = [
            subject.name,
            subject.description || '',
            ...(subject.searchTerms || []),
            subject.id
        ];
        
        for (const text of subjectTexts) {
            if (flexibleMatch(text, searchTerms)) {
                subjectMatched = true;
                break;
            }
        }
        
        if (subjectMatched && !seenSubjects.has(subject.id)) {
            seenSubjects.add(subject.id);
            results.subjects.push({
                type: 'subject',
                id: subject.id,
                title: subject.name,
                subtitle: subject.description || 'Asignatura',
                icon: subject.icon || '📚',
                badge: 'Asignatura',
                subjectId: subject.id,
                topicId: null,
                match: 'Asignatura'
            });
        }
        
        // Buscar en temas
        subject.topics.forEach(topic => {
            let topicMatched = false;
            let matchType = '';
            
            const topicTexts = [
                topic.title,
                topic.description || '',
                ...(topic.searchTerms || []),
                topic.id,
                `${subject.name} ${topic.title}`,
                `${subject.id} ${topic.id}`
            ];
            
            for (const text of topicTexts) {
                if (flexibleMatch(text, searchTerms)) {
                    topicMatched = true;
                    matchType = 'Tema';
                    break;
                }
            }
            
            // Buscar en archivos
            if (!topicMatched && topic.files) {
                for (const file of topic.files) {
                    if (flexibleMatch(file.name, searchTerms)) {
                        topicMatched = true;
                        matchType = 'Archivo';
                        break;
                    }
                }
            }
            
            // Buscar en recomendaciones
            if (!topicMatched && topic.recommendations) {
                for (const rec of topic.recommendations) {
                    if (flexibleMatch(rec.title, searchTerms)) {
                        topicMatched = true;
                        matchType = 'Recurso';
                        break;
                    }
                }
            }
            
            if (topicMatched && !seenTopics.has(topic.id)) {
                seenTopics.add(topic.id);
                results.topics.push({
                    type: 'topic',
                    id: topic.id,
                    title: topic.title,
                    subtitle: `${subject.name} · ${matchType}`,
                    icon: '📖',
                    badge: matchType,
                    subjectId: subject.id,
                    topicId: topic.id,
                    match: matchType
                });
            }
        });
    });
    
    // Ordenar resultados: primero asignaturas, luego temas
    results.subjects.sort((a, b) => a.title.localeCompare(b.title));
    results.topics.sort((a, b) => a.title.localeCompare(b.title));
    
    return results;
}

// ==========================================
// EXPORTAR PARA USO GLOBAL
// ==========================================

window.studyData = studyData;
window.getSubjects = getSubjects;
window.getSubject = getSubject;
window.getTopics = getTopics;
window.getFiles = getFiles;
window.getRecommendations = getRecommendations;
window.searchAll = searchAll;
window.normalizeText = normalizeText;
window.getSearchTerms = getSearchTerms;
window.flexibleMatch = flexibleMatch;

console.log('✅ studyData.js cargado con sistema de búsqueda avanzada');