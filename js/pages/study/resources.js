// js/pages/study/resources.js
// Sección de Recursos de Estudio

console.log('📄 resources.js cargado');

// ==========================================
// RENDER RECURSOS (Vista principal)
// ==========================================

function renderResources() {
    console.log('🔄 renderResources() ejecutado');
    
    const container = document.getElementById('studyContent');
    if (!container) return;
    
    const categories = getResourceCategories();
    
    let html = `
        <div class="study-page active">
            <!-- Header -->
            <div class="resources-header">
                <div class="resources-header-content">
                    <span class="resources-header-icon">🎓</span>
                    <div>
                        <h1>Recursos de Estudio</h1>
                        <p>Métodos, herramientas y guías para aprender mejor</p>
                    </div>
                </div>
                <div class="resources-tip">
                    <span>💡</span>
                    <span id="randomTip">${getRandomTip()}</span>
                </div>
            </div>

            <!-- Categorías -->
            <div class="study-grid">
                ${categories.map(c => `
                    <div class="resource-category-card" onclick="renderCategory('${c.id}')">
                        <div class="resource-category-icon" style="background:${c.color}20; color:${c.color}">
                            ${c.icon}
                        </div>
                        <h3>${c.name}</h3>
                        <p>${c.description}</p>
                        <div class="resource-category-meta">
                            <span>📄 ${c.items.length} recursos</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==========================================
// RENDER CATEGORÍA
// ==========================================

function renderCategory(categoryId) {
    console.log('🔄 renderCategory()', categoryId);
    
    const container = document.getElementById('studyContent');
    if (!container) return;
    
    const category = getCategory(categoryId);
    if (!category) {
        container.innerHTML = `
            <div class="study-page active">
                <div class="study-empty">
                    <span>🔍</span>
                    <h3>Categoría no encontrada</h3>
                    <button class="btn-study" onclick="renderResources()">Volver a recursos</button>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="study-page active">
            <!-- Back -->
            <button class="btn-back" onclick="renderResources()">← Volver a recursos</button>
            
            <!-- Category Header -->
            <div class="category-header" style="border-color:${category.color}40;">
                <div class="category-header-icon" style="background:${category.color}20; color:${category.color}">
                    ${category.icon}
                </div>
                <div>
                    <h1>${category.name}</h1>
                    <p>${category.description}</p>
                </div>
            </div>
            
            <!-- Items Grid -->
            <div class="study-grid">
                ${category.items.map(item => `
                    <div class="resource-item-card" onclick="renderResourceItem('${category.id}', '${item.id}')">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <div class="resource-item-meta">
                            <span>🔍 Ver detalles</span>
                            <span class="arrow">→</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==========================================
// RENDER RECURSO INDIVIDUAL
// ==========================================

function renderResourceItem(categoryId, itemId) {
    console.log('🔄 renderResourceItem()', categoryId, itemId);
    
    const container = document.getElementById('studyContent');
    if (!container) return;
    
    const category = getCategory(categoryId);
    const item = getResourceItem(categoryId, itemId);
    
    if (!category || !item) {
        container.innerHTML = `
            <div class="study-page active">
                <div class="study-empty">
                    <span>🔍</span>
                    <h3>Recurso no encontrado</h3>
                    <button class="btn-study" onclick="renderResources()">Volver a recursos</button>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="study-page active">
            <!-- Back -->
            <button class="btn-back" onclick="renderCategory('${categoryId}')">← Volver a ${category.name}</button>
            
            <!-- Resource Content -->
            <div class="resource-detail">
                <div class="resource-detail-header" style="border-color:${category.color}40;">
                    <span class="resource-detail-icon" style="background:${category.color}20; color:${category.color}">
                        ${category.icon}
                    </span>
                    <div>
                        <span class="resource-detail-badge" style="background:${category.color}20; color:${category.color}">
                            ${category.name}
                        </span>
                        <h1>${item.title}</h1>
                        <p>${item.description}</p>
                    </div>
                </div>
    `;
    
    // Steps (si existen)
    if (item.steps && item.steps.length > 0) {
        html += `
            <div class="resource-section">
                <h3>📋 Pasos a seguir</h3>
                <ul class="resource-list">
                    ${item.steps.map((step, index) => `
                        <li>
                            <span class="step-number">${index + 1}</span>
                            ${step}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Tips (si existe)
    if (item.tips) {
        html += `
            <div class="resource-section resource-tip">
                <h3>💡 Consejos</h3>
                <p>${item.tips}</p>
            </div>
        `;
    }
    
    // Features (si existen)
    if (item.features && item.features.length > 0) {
        html += `
            <div class="resource-section">
                <h3>✨ Características</h3>
                <ul class="resource-features">
                    ${item.features.map(f => `
                        <li>${f}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // How to use (si existe)
    if (item.howToUse) {
        html += `
            <div class="resource-section">
                <h3>🚀 Cómo usarlo</h3>
                <p>${item.howToUse}</p>
            </div>
        `;
    }
    
    // Best for (si existe)
    if (item.bestFor) {
        html += `
            <div class="resource-section resource-bestfor">
                <h3>🎯 Para qué es ideal</h3>
                <p>${item.bestFor}</p>
            </div>
        `;
    }
    
    // URL (si existe)
    if (item.url) {
        html += `
            <div class="resource-section">
                <h3>🔗 Web</h3>
                <a href="https://${item.url}" target="_blank" class="resource-link">
                    ${item.url} → 
                </a>
            </div>
        `;
    }
    
    // Sections (para guías)
    if (item.sections && item.sections.length > 0) {
        html += `
            <div class="resource-section">
                <h3>📋 Contenido de la guía</h3>
                <ul class="resource-features">
                    ${item.sections.map(s => `
                        <li>${s}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // NotebookLM Integration
    html += `
                <div class="resource-section resource-notebooklm">
                    <h3>🤖 ¿Quieres saber más?</h3>
                    <p>
                        Sube este recurso a <strong>NotebookLM</strong> (notebooklm.google.com) 
                        junto con tus apuntes y haz preguntas específicas sobre el tema.
                    </p>
                    <div class="notebooklm-tips">
                        <span>📤 Sube tus apuntes</span>
                        <span>❓ Haz preguntas</span>
                        <span>📝 Obtén resúmenes</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// ==========================================
// BUSCADOR DE RECURSOS
// ==========================================

function searchResourcesGlobal(query) {
    if (!query || query.trim() === '') {
        return [];
    }
    
    const results = searchResources(query);
    return results;
}

// ==========================================
// ACTUALIZAR TIP ALEATORIO
// ==========================================

function refreshRandomTip() {
    const tipElement = document.getElementById('randomTip');
    if (tipElement) {
        tipElement.textContent = getRandomTip();
    }
}

// Cambiar tip cada 10 segundos
setInterval(refreshRandomTip, 10000);

// ==========================================
// EXPORTAR
// ==========================================

window.renderResources = renderResources;
window.renderCategory = renderCategory;
window.renderResourceItem = renderResourceItem;
window.searchResourcesGlobal = searchResourcesGlobal;
window.refreshRandomTip = refreshRandomTip;