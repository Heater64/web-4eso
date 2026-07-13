// js/pages/study/dashboard.js
// Dashboard de la web de estudio

console.log('📄 dashboard.js cargado');

// ==========================================
// DATOS DE CONSEJOS Y RECORDATORIOS (MINI)
// ==========================================

const miniTips = [
    { icon: '📄', text: 'Los PDFs se abren sin descargar' },
    { icon: '⏰', text: '30 min al día > 6h antes del examen' },
    { icon: '🧠', text: 'Recuerda en voz alta, no solo leas' },
    { icon: '📱', text: 'Móvil fuera durante el estudio' },
    { icon: '💤', text: 'Duerme 7-8h para consolidar' },
    { icon: '🎯', text: 'Divide en objetivos pequeños' },
    { icon: '📝', text: 'Escribir a mano ayuda a retener' },
    { icon: '🤖', text: 'Usa IA para entender, no para hacer' },
];

function getRandomMiniTips(count = 3) {
    const shuffled = [...miniTips].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// ==========================================
// NAVEGACIÓN ENTRE SECCIONES
// ==========================================

function navigateTo(section) {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));
    
    switch(section) {
        case 'home':
            document.querySelector('#navHome')?.classList.add('active');
            renderDashboard();
            break;
        case 'subjects':
            document.querySelector('#navSubjects')?.classList.add('active');
            renderDashboard();
            break;
        case 'resources':
            document.querySelector('#navResources')?.classList.add('active');
            if (typeof renderResources === 'function') {
                renderResources();
            } else {
                console.error('renderResources no está definido');
                renderDashboard();
            }
            break;
        default:
            renderDashboard();
    }
}

// ==========================================
// RENDER DASHBOARD (CON TARJETA MINI DE CONSEJOS)
// ==========================================

function renderDashboard() {
    console.log('🔄 renderDashboard() ejecutado');
    
    const container = document.getElementById('studyContent');
    if (!container) {
        console.error('❌ No se encontró #studyContent');
        return;
    }

    const subjects = getSubjects();
    console.log('📚 Asignaturas:', subjects.length);
    
    const totalSubjects = subjects.length;
    let totalTopics = 0;
    let totalFiles = 0;

    subjects.forEach(s => {
        totalTopics += s.topics.length;
        s.topics.forEach(t => {
            totalFiles += (t.files || []).length;
        });
    });

    // Obtener consejos aleatorios (solo 3)
    const tips = getRandomMiniTips(3);

    // Eliminar resultados de búsqueda si existen
    const searchResults = container.querySelector('.search-results');
    
    let html = `
        <div class="study-page active">
            <!-- ===== CONTENEDOR PRINCIPAL CON TARJETA MINI ===== -->
            <div class="dashboard-layout">
                <!-- Columna principal -->
                <div class="dashboard-main">
                    <!-- Estadísticas -->
                    <div class="study-stats">
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-number">${totalSubjects}</div>
                            <div class="stat-label">Asignaturas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📂</div>
                            <div class="stat-number">${totalTopics}</div>
                            <div class="stat-label">Temas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📄</div>
                            <div class="stat-number">${totalFiles}</div>
                            <div class="stat-label">Archivos</div>
                        </div>
                    </div>

                    <!-- Asignaturas -->
                    <div class="study-section-header">
                        <h2>Mis Asignaturas</h2>
                        <span class="header-line"></span>
                    </div>
                    <div class="study-grid">
                        ${subjects.map(s => `
                            <div class="subject-card" onclick="navigateToSubject('${s.id}')">
                                <div class="subject-content">
                                    <div class="subject-icon" style="background:${s.color}20; color:${s.color}">
                                        ${s.icon}
                                    </div>
                                    <h3>${s.name}</h3>
                                    <p>${s.description || ''}</p>
                                    <div class="subject-meta">
                                        <span>📂 ${s.topics.length} temas</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ===== TARJETA MINI DE CONSEJOS ===== -->
                <div class="dashboard-sidebar-mini">
                    <div class="mini-tips-card">
                        <div class="mini-tips-header">
                            <span class="mini-tips-icon">💡</span>
                            <span>Tips</span>
                            <button class="mini-tips-refresh" onclick="refreshMiniTips()" title="Cambiar consejos">⟳</button>
                        </div>
                        <div class="mini-tips-list" id="miniTipsList">
                            ${tips.map(tip => `
                                <div class="mini-tip-item">
                                    <span class="mini-tip-icon">${tip.icon}</span>
                                    <span class="mini-tip-text">${tip.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Si hay resultados de búsqueda, mostrarlos encima
    if (searchResults) {
        container.innerHTML = searchResults.outerHTML + html;
    } else {
        container.innerHTML = html;
    }
    
    console.log('✅ Dashboard renderizado correctamente');
}

// ==========================================
// FUNCIÓN PARA REFRESCAR CONSEJOS MINI
// ==========================================

function refreshMiniTips() {
    const list = document.getElementById('miniTipsList');
    if (!list) return;
    
    const tips = getRandomMiniTips(3);
    
    list.innerHTML = tips.map(tip => `
        <div class="mini-tip-item">
            <span class="mini-tip-icon">${tip.icon}</span>
            <span class="mini-tip-text">${tip.text}</span>
        </div>
    `).join('');
}

// ==========================================
// RENDER SUBJECT
// ==========================================

function renderSubject(subjectId) {
    console.log('🔄 renderSubject()', subjectId);
    
    const container = document.getElementById('studyContent');
    if (!container) return;

    const subject = getSubject(subjectId);
    if (!subject) {
        container.innerHTML = `
            <div class="study-page active">
                <div class="study-empty">
                    <span>🔍</span>
                    <h3>Asignatura no encontrada</h3>
                    <button class="btn-study" onclick="navigateTo('home')">Volver al inicio</button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="study-page active">
            <div class="subject-header">
                <button class="btn-back" onclick="navigateTo('home')">← Volver</button>
                <div class="subject-header-content">
                    <div class="subject-header-icon" style="background:${subject.color}20; color:${subject.color}">
                        ${subject.icon}
                    </div>
                    <div>
                        <h1>${subject.name}</h1>
                        <p>${subject.description || ''}</p>
                        <span class="subject-badge">${subject.topics.length} temas</span>
                    </div>
                </div>
            </div>

            <div class="study-section-header">
                <h2>Temas</h2>
                <span class="header-line"></span>
            </div>
            <div class="study-grid">
                ${subject.topics.map(t => `
                    <div class="topic-card" onclick="renderTopic('${subject.id}', '${t.id}')">
                        <div class="topic-icon">📖</div>
                        <h3>${t.title}</h3>
                        <p>${t.description || ''}</p>
                        <div class="topic-meta">
                            <span>📄 ${(t.files || []).length} archivos</span>
                            ${(t.recommendations || []).length > 0 ? `<span>💡 ${t.recommendations.length} recursos</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ==========================================
// RENDER TOPIC (CON SEPARADORES EN ARCHIVOS Y RECURSOS)
// ==========================================

function renderTopic(subjectId, topicId) {
    console.log('🔄 renderTopic()', subjectId, topicId);
    
    const container = document.getElementById('studyContent');
    if (!container) return;

    const subject = getSubject(subjectId);
    const topic = subject?.topics.find(t => t.id === topicId);
    
    if (!subject || !topic) {
        container.innerHTML = `
            <div class="study-page active">
                <div class="study-empty">
                    <span>🔍</span>
                    <h3>Tema no encontrado</h3>
                    <button class="btn-study" onclick="navigateTo('home')">Volver al inicio</button>
                </div>
            </div>
        `;
        return;
    }

    const files = topic.files || [];
    const recommendations = topic.recommendations || [];

    // ==========================================
    // GENERAR ARCHIVOS (CON SEPARADORES)
    // ==========================================
    let filesHtml = '';
    if (files.length > 0) {
        filesHtml = `
            <div class="study-section-header">
                <h2>📄 Archivos</h2>
                <span class="header-line"></span>
            </div>
            <div class="file-list">
                ${files.map(f => {
                    // 🔹 Si es un separador
                    if (f.type === 'separator') {
                        return `
                            <div class="resource-separator">
                                <span class="separator-line"></span>
                                <span class="separator-label">${f.label}</span>
                                <span class="separator-line"></span>
                            </div>
                        `;
                    }
                    
                    // 🔹 Si es un archivo normal
                    return `
                        <div class="file-item" onclick="openFile('${f.url}', '${f.name}')">
                            <span class="file-icon">📄</span>
                            <div>
                                <div class="file-name">${f.name}</div>
                                <div class="file-meta">Haz clic para abrir</div>
                            </div>
                            <span class="file-arrow">→</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ==========================================
    // GENERAR RECURSOS (CON SEPARADORES)
    // ==========================================
    let recommendationsHtml = '';
    if (recommendations.length > 0) {
        recommendationsHtml = `
            <div class="study-section-header">
                <h2>💡 Recursos recomendados</h2>
                <span class="header-line"></span>
            </div>
            <div class="file-list">
                ${recommendations.map(r => {
                    // 🔹 Si es un separador
                    if (r.type === 'separator') {
                        return `
                            <div class="resource-separator">
                                <span class="separator-line"></span>
                                <span class="separator-label">${r.label}</span>
                                <span class="separator-line"></span>
                            </div>
                        `;
                    }
                    
                    // 🔹 Si es un recurso normal
                    return `
                        <div class="file-item" onclick="window.open('${r.url}', '_blank')">
                            <span class="file-icon">🔗</span>
                            <div>
                                <div class="file-name">${r.title}</div>
                                <div class="file-meta">Abrir enlace externo</div>
                            </div>
                            <span class="file-arrow">→</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // ==========================================
    // RENDERIZAR TODO
    // ==========================================
    container.innerHTML = `
        <div class="study-page active">
            <button class="btn-back" onclick="renderSubject('${subjectId}')">← Volver a ${subject.name}</button>

            <div class="topic-header">
                <h1>${topic.title}</h1>
                <p>${topic.description || ''}</p>
                <span class="topic-badge">${subject.name}</span>
            </div>

            ${filesHtml}

            ${recommendationsHtml}

            ${files.length === 0 && recommendations.length === 0 ? `
                <div class="study-empty">
                    <span>📭</span>
                    <h3>Sin contenido aún</h3>
                    <p>Este tema no tiene archivos ni recursos disponibles.</p>
                </div>
            ` : ''}
        </div>
    `;
}

// ==========================================
// UTILIDADES
// ==========================================

function openFile(url, name) {
    if (!url || url === '#') {
        alert(`📄 "${name}"\n\nEste archivo aún no está disponible.\nPróximamente se añadirá el contenido.`);
        return;
    }
    window.open(url, '_blank');
}

function navigateToSubject(id) {
    renderSubject(id);
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
        input.focus();
        toggleClearBtn();
        renderDashboard();
    }
}

function performSearch() {
    const input = document.getElementById('searchInput');
    const query = input?.value.trim();
    
    if (!query) {
        renderDashboard();
        return;
    }
    
    const container = document.getElementById('studyContent');
    if (!container) return;
    
    // Buscar en asignaturas Y en recursos
    const subjectResults = searchAll(query);
    const resourceResults = typeof searchResources === 'function' ? searchResources(query) : [];
    
    const allResults = [
        ...subjectResults.subjects.map(r => ({ ...r, badge: 'Asignatura' })),
        ...subjectResults.topics.map(r => ({ ...r, badge: 'Tema' })),
        ...resourceResults.map(r => ({ ...r, badge: 'Recurso' }))
    ];
    
    if (allResults.length === 0) {
        // Sugerencias
        const suggestions = [
            'mates', 'matemáticas', 'geometría', 'ecuaciones',
            'lengua', 'sintaxis', 'romanticismo', 'física', 'energía',
            'pomodoro', 'feynman', 'notebooklm', 'chatgpt'
        ];
        
        container.innerHTML = `
            <div class="search-results active">
                <div class="result-header">
                    <h3>🔍 Resultados para "${query}"</h3>
                    <span class="result-count">0 encontrados</span>
                </div>
                <div class="search-empty">
                    <span>🔎</span>
                    <p>No se encontraron resultados para "<strong>${query}</strong>"</p>
                    <div class="suggestions">
                        💡 Prueba con: ${suggestions.slice(0, 8).map(s => `<strong>"${s}"</strong>`).join(', ')}...
                    </div>
                </div>
            </div>
            ${document.querySelector('.study-page')?.outerHTML || ''}
        `;
        return;
    }
    
    renderSearchResults(container, query, allResults);
}

function renderSearchResults(container, query, results) {
    let html = `
        <div class="search-results active">
            <div class="result-header">
                <h3>🔍 Resultados para "${query}"</h3>
                <span class="result-count">${results.length} encontrados</span>
            </div>
    `;
    
    if (results.length === 0) {
        html += `
            <div class="search-empty">
                <span>🔎</span>
                <p>No se encontraron resultados para "<strong>${query}</strong>"</p>
            </div>
        `;
    } else {
        results.forEach(r => {
            let onclick = '';
            if (r.type === 'subject') {
                onclick = `renderSubject('${r.subjectId}')`;
            } else if (r.type === 'topic') {
                onclick = `renderTopic('${r.subjectId}', '${r.topicId}')`;
            } else if (r.type === 'category') {
                onclick = `renderCategory('${r.categoryId}')`;
            } else if (r.type === 'resource') {
                onclick = `renderResourceItem('${r.categoryId}', '${r.itemId}')`;
            }
            
            html += `
                <div class="search-result-item" onclick="${onclick}">
                    <span class="result-icon">${r.icon}</span>
                    <div class="result-info">
                        <div class="result-title">${r.title}</div>
                        <div class="result-sub">${r.subtitle || ''}</div>
                    </div>
                    <span class="result-badge">${r.badge}</span>
                </div>
            `;
        });
    }
    
    html += `</div>`;
    
    // Mantener el contenido actual y mostrar resultados encima
    const currentContent = container.innerHTML;
    container.innerHTML = html + currentContent;
}

// ==========================================
// EVENTOS
// ==========================================

function setupEventListeners() {
    // Logo
    const logo = document.getElementById('logoLink');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('home');
        });
    }
    
    // Nav Home
    const navHome = document.getElementById('navHome');
    if (navHome) {
        navHome.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('home');
        });
    }
    
    // Nav Subjects
    const navSubjects = document.getElementById('navSubjects');
    if (navSubjects) {
        navSubjects.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('subjects');
        });
    }
    
    // Nav Resources
    const navResources = document.getElementById('navResources');
    if (navResources) {
        navResources.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('resources');
        });
    }
    
    // Buscador - Enter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        searchInput.addEventListener('input', toggleClearBtn);
    }
    
    // Buscador - Clear
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
    
    // Buscador - Botón
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
}

// ==========================================
// INICIO
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, iniciando...');
    setupEventListeners();
    navigateTo('home');
});