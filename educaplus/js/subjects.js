/* ============================================
   EDUCA+ - Subjects Module
   Subject Detail & Topics Management
   ============================================ */

// ============================================
// STATE
// ============================================

const SubjectState = {
    currentSubject: null,
    topics: [],
    loading: true
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize subject detail page
 */
async function initSubjectPage() {
    // Initialize Supabase
    await SupabaseModule.init();
    
    // Check authentication
    const client = SupabaseModule.getClient();
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get user profile
    SubjectState.profile = await SupabaseModule.Profiles.getCurrentProfile();
    
    // Get subject ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('id');
    
    if (!subjectId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Setup UI
    setupSidebar();
    setupTopbar();
    
    // Load subject data
    await loadSubjectData(subjectId);
    
    // Setup event listeners
    setupSubjectEventListeners();
}

/**
 * Load subject data
 * @param {string} subjectId - Subject ID
 */
async function loadSubjectData(subjectId) {
    showSubjectLoading(true);
    
    try {
        // Load subject
        SubjectState.currentSubject = await SupabaseModule.Subjects.getById(subjectId);
        
        if (!SubjectState.currentSubject) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        // Load topics
        SubjectState.topics = SubjectState.currentSubject.topics || [];
        
        // Render page
        renderSubjectPage();
        
        // Update page title
        document.title = `${SubjectState.currentSubject.name} - Educa+`;
        
    } catch (error) {
        console.error('Error loading subject:', error);
        AuthModule.showNotification('Error al cargar la asignatura', 'error');
    } finally {
        showSubjectLoading(false);
    }
}

// ============================================
// RENDERING
// ============================================

/**
 * Render subject page
 */
function renderSubjectPage() {
    renderSubjectHero();
    renderTopics();
    updateBreadcrumb();
}

/**
 * Render subject hero section
 */
function renderSubjectHero() {
    const container = document.getElementById('subject-hero');
    if (!container) return;
    
    const subject = SubjectState.currentSubject;
    
    container.innerHTML = `
        <div class="subject-hero-content">
            <div class="subject-hero-icon">
                ${UIModule.getIcon(subject.icon || 'bookOpen', 40)}
            </div>
            <div class="subject-hero-info">
                <h1 class="subject-hero-title">${subject.name}</h1>
                ${subject.description ? `<p class="subject-hero-description">${subject.description}</p>` : ''}
                <div class="subject-hero-stats">
                    <div class="subject-hero-stat">
                        ${UIModule.getIcon('folder', 18)}
                        <span class="subject-hero-stat-value">${SubjectState.topics.length}</span> temas
                    </div>
                    <div class="subject-hero-stat">
                        ${UIModule.getIcon('fileText', 18)}
                        <span class="subject-hero-stat-value">${subject.files?.[0]?.count || 0}</span> archivos
                    </div>
                </div>
            </div>
            ${SubjectState.profile?.role === 'admin' ? `
                <div class="subject-hero-actions">
                    <button class="btn btn-primary" onclick="showAddTopicModal()">
                        ${UIModule.getIcon('plus', 20)}
                        Nuevo tema
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render topics list
 */
function renderTopics() {
    const container = document.getElementById('topics-list');
    if (!container) return;
    
    const topics = SubjectState.topics;
    
    if (topics.length === 0) {
        container.innerHTML = UIModule.createEmptyState({
            icon: 'folderOpen',
            title: 'Sin temas',
            description: 'Esta asignatura aun no tiene temas creados.',
            actionText: SubjectState.profile?.role === 'admin' ? 'Crear primer tema' : null,
            actionOnClick: 'showAddTopicModal()'
        });
        return;
    }
    
    container.innerHTML = topics.map((topic, index) => `
        <div class="topic-item" data-topic-id="${topic.id}">
            <div class="topic-header" onclick="toggleTopic('${topic.id}')">
                <div class="topic-expand-icon">
                    ${UIModule.getIcon('chevronRight', 16)}
                </div>
                <div class="topic-info">
                    <h3 class="topic-title">${topic.title}</h3>
                    <div class="topic-meta">
                        <span class="topic-meta-item">
                            ${UIModule.getIcon('fileText', 14)}
                            ${topic.files?.length || 0} archivos
                        </span>
                        <span class="topic-meta-item">
                            ${UIModule.getIcon('lightbulb', 14)}
                            ${topic.recommendations?.length || 0} recomendaciones
                        </span>
                    </div>
                </div>
                ${SubjectState.profile?.role === 'admin' ? `
                    <div class="topic-actions">
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); showAddFileModal('${topic.id}')" title="Subir archivo">
                            ${UIModule.getIcon('upload', 18)}
                        </button>
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); showAddRecommendationModal('${topic.id}')" title="Agregar recomendacion">
                            ${UIModule.getIcon('plus', 18)}
                        </button>
                        <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); showTopicMenu('${topic.id}')" title="Mas opciones">
                            ${UIModule.getIcon('moreVertical', 18)}
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="topic-content">
                ${renderTopicFiles(topic)}
                ${renderTopicRecommendations(topic)}
            </div>
        </div>
    `).join('');
}

/**
 * Render topic files
 * @param {Object} topic - Topic data
 * @returns {string} HTML string
 */
function renderTopicFiles(topic) {
    const files = topic.files || [];
    
    if (files.length === 0) {
        return `
            <div class="topic-files" style="margin-bottom: var(--space-4);">
                <p style="color: var(--text-secondary); font-size: var(--text-sm);">
                    No hay archivos en este tema
                </p>
            </div>
        `;
    }
    
    return `
        <div class="topic-files" style="margin-bottom: var(--space-4);">
            <h4 style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: var(--space-3);">
                Archivos
            </h4>
            ${files.map(file => `
                <div class="topic-file">
                    <div class="topic-file-icon">
                        ${UIModule.getIcon(file.file_type === 'pdf' ? 'fileText' : file.file_type === 'image' ? 'image' : 'file', 20)}
                    </div>
                    <div class="topic-file-info">
                        <div class="topic-file-name">${file.file_name}</div>
                        <div class="topic-file-size">${UIModule.formatFileSize(file.file_size || 0)}</div>
                    </div>
                    <div class="topic-file-actions">
                        <a href="${file.file_url}" target="_blank" class="btn btn-ghost btn-icon" title="Ver">
                            ${UIModule.getIcon('externalLink', 16)}
                        </a>
                        <button class="btn btn-ghost btn-icon" onclick="downloadFile('${file.file_url}', '${file.file_name}')" title="Descargar">
                            ${UIModule.getIcon('download', 16)}
                        </button>
                        ${SubjectState.profile?.role === 'admin' ? `
                            <button class="btn btn-ghost btn-icon" onclick="deleteFile('${file.id}', '${file.file_url}')" title="Eliminar">
                                ${UIModule.getIcon('trash', 16)}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Render topic recommendations
 * @param {Object} topic - Topic data
 * @returns {string} HTML string
 */
function renderTopicRecommendations(topic) {
    const recommendations = topic.recommendations || [];
    
    if (recommendations.length === 0) {
        return '';
    }
    
    return `
        <div class="topic-recommendations">
            <h4 style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: var(--space-3);">
                Recomendaciones
            </h4>
            ${recommendations.map(rec => `
                <div class="recommendation-item" style="margin-bottom: var(--space-2); padding: var(--space-3); background: var(--bg-tertiary); border-radius: var(--radius-lg);">
                    <div style="display: flex; align-items: flex-start; gap: var(--space-3);">
                        <div class="recommendation-icon" style="margin-bottom: 0;">
                            ${UIModule.getIcon('lightbulb', 16)}
                        </div>
                        <div style="flex: 1;">
                            <div class="recommendation-title">${rec.title}</div>
                            ${rec.description ? `<div class="recommendation-description">${rec.description}</div>` : ''}
                            ${rec.url ? `
                                <a href="${rec.url}" target="_blank" class="section-link" style="margin-top: var(--space-2); display: inline-flex;">
                                    Ver recurso ${UIModule.getIcon('externalLink', 14)}
                                </a>
                            ` : ''}
                        </div>
                        ${SubjectState.profile?.role === 'admin' ? `
                            <button class="btn btn-ghost btn-icon" onclick="deleteRecommendation('${rec.id}')" title="Eliminar">
                                ${UIModule.getIcon('x', 16)}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Update breadcrumb
 */
function updateBreadcrumb() {
    const container = document.getElementById('breadcrumb');
    if (!container) return;
    
    container.innerHTML = UIModule.createBreadcrumb([
        { label: 'Dashboard', href: 'dashboard.html' },
        { label: SubjectState.currentSubject?.name || 'Asignatura' }
    ]);
}

// ============================================
// TOPIC INTERACTIONS
// ============================================

/**
 * Toggle topic expansion
 * @param {string} topicId - Topic ID
 */
function toggleTopic(topicId) {
    const topicItem = document.querySelector(`[data-topic-id="${topicId}"]`);
    if (topicItem) {
        topicItem.classList.toggle('expanded');
    }
}

/**
 * Expand all topics
 */
function expandAllTopics() {
    document.querySelectorAll('.topic-item').forEach(item => {
        item.classList.add('expanded');
    });
}

/**
 * Collapse all topics
 */
function collapseAllTopics() {
    document.querySelectorAll('.topic-item').forEach(item => {
        item.classList.remove('expanded');
    });
}

// ============================================
// MODALS
// ============================================

/**
 * Show add topic modal
 */
function showAddTopicModal() {
    UIModule.showModal({
        title: 'Nuevo Tema',
        content: `
            <form id="add-topic-form" class="form-grid">
                <div class="input-group">
                    <label class="input-label">Titulo del tema</label>
                    <input type="text" class="input" id="topic-title" placeholder="Ej: Ecuaciones de segundo grado" required>
                </div>
                
                <div class="input-group">
                    <label class="input-label">Descripcion (opcional)</label>
                    <textarea class="input" id="topic-description" placeholder="Breve descripcion del tema" rows="3"></textarea>
                </div>
            </form>
        `,
        footer: `
            <button class="btn btn-secondary" onclick="closeAllModals()">Cancelar</button>
            <button class="btn btn-primary" onclick="createTopic()">Crear tema</button>
        `
    });
}

/**
 * Create new topic
 */
async function createTopic() {
    const title = document.getElementById('topic-title')?.value.trim();
    const description = document.getElementById('topic-description')?.value.trim();
    
    if (!title) {
        AuthModule.showNotification('Por favor, ingresa un titulo', 'error');
        return;
    }
    
    try {
        await SupabaseModule.Topics.create({
            subject_id: SubjectState.currentSubject.id,
            title,
            description,
            order_index: SubjectState.topics.length
        });
        
        closeAllModals();
        AuthModule.showNotification('Tema creado exitosamente');
        await loadSubjectData(SubjectState.currentSubject.id);
        
    } catch (error) {
        console.error('Error creating topic:', error);
        AuthModule.showNotification('Error al crear el tema', 'error');
    }
}

/**
 * Show add file modal
 * @param {string} topicId - Topic ID
 */
function showAddFileModal(topicId) {
    SubjectState.currentTopicId = topicId;
    
    UIModule.showModal({
        title: 'Subir Archivo',
        content: `
            <div class="form-grid">
                <div class="dropzone" id="file-dropzone">
                    <div class="dropzone-icon">
                        ${UIModule.getIcon('upload', 48)}
                    </div>
                    <p class="dropzone-text">Arrastra archivos aqui o haz clic para seleccionar</p>
                    <p class="dropzone-hint">PDFs e imagenes (max. 10MB)</p>
                    <input type="file" id="file-input" accept=".pdf,image/*" hidden multiple>
                </div>
                <div id="file-preview" style="margin-top: var(--space-4);"></div>
            </div>
        `,
        footer: `
            <button class="btn btn-secondary" onclick="closeAllModals()">Cancelar</button>
            <button class="btn btn-primary" onclick="uploadFiles()" id="upload-btn" disabled>Subir archivos</button>
        `
    });
    
    setupDropzone();
}

/**
 * Setup file dropzone
 */
function setupDropzone() {
    const dropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('file-preview');
    const uploadBtn = document.getElementById('upload-btn');
    
    SubjectState.filesToUpload = [];
    
    // Click to select files
    dropzone.addEventListener('click', () => fileInput.click());
    
    // Drag events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
    
    // Handle selected files
    function handleFiles(files) {
        SubjectState.filesToUpload = Array.from(files).filter(file => {
            const isValid = file.type === 'application/pdf' || file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
            return isValid && isValidSize;
        });
        
        // Update preview
        if (SubjectState.filesToUpload.length > 0) {
            preview.innerHTML = SubjectState.filesToUpload.map((file, index) => `
                <div class="file-item" style="margin-top: var(--space-2);">
                    <div class="file-icon">
                        ${UIModule.getIcon(file.type === 'application/pdf' ? 'fileText' : 'image', 20)}
                    </div>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">${UIModule.formatFileSize(file.size)}</div>
                    </div>
                    <button class="btn btn-ghost btn-icon" onclick="removeFileFromUpload(${index})">
                        ${UIModule.getIcon('x', 16)}
                    </button>
                </div>
            `).join('');
            uploadBtn.disabled = false;
        } else {
            preview.innerHTML = '<p style="color: var(--error); font-size: var(--text-sm);">Solo se permiten PDFs e imagenes</p>';
            uploadBtn.disabled = true;
        }
    }
}

/**
 * Remove file from upload queue
 * @param {number} index - File index
 */
function removeFileFromUpload(index) {
    SubjectState.filesToUpload.splice(index, 1);
    
    const preview = document.getElementById('file-preview');
    const uploadBtn = document.getElementById('upload-btn');
    
    if (SubjectState.filesToUpload.length > 0) {
        preview.innerHTML = SubjectState.filesToUpload.map((file, idx) => `
            <div class="file-item" style="margin-top: var(--space-2);">
                <div class="file-icon">
                    ${UIModule.getIcon(file.type === 'application/pdf' ? 'fileText' : 'image', 20)}
                </div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${UIModule.formatFileSize(file.size)}</div>
                </div>
                <button class="btn btn-ghost btn-icon" onclick="removeFileFromUpload(${idx})">
                    ${UIModule.getIcon('x', 16)}
                </button>
            </div>
        `).join('');
    } else {
        preview.innerHTML = '';
        uploadBtn.disabled = true;
    }
}

/**
 * Upload files
 */
async function uploadFiles() {
    const uploadBtn = document.getElementById('upload-btn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<span class="spinner"></span> Subiendo...';
    
    try {
        for (const file of SubjectState.filesToUpload) {
            await SupabaseModule.Files.upload(file, SubjectState.currentTopicId);
        }
        
        closeAllModals();
        AuthModule.showNotification('Archivos subidos exitosamente');
        await loadSubjectData(SubjectState.currentSubject.id);
        
    } catch (error) {
        console.error('Error uploading files:', error);
        AuthModule.showNotification('Error al subir los archivos', 'error');
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Subir archivos';
    }
}

/**
 * Show add recommendation modal
 * @param {string} topicId - Topic ID
 */
function showAddRecommendationModal(topicId) {
    SubjectState.currentTopicId = topicId;
    
    UIModule.showModal({
        title: 'Nueva Recomendacion',
        content: `
            <form id="add-recommendation-form" class="form-grid">
                <div class="input-group">
                    <label class="input-label">Titulo</label>
                    <input type="text" class="input" id="rec-title" placeholder="Ej: Video explicativo sobre..." required>
                </div>
                
                <div class="input-group">
                    <label class="input-label">URL (opcional)</label>
                    <input type="url" class="input" id="rec-url" placeholder="https://...">
                </div>
                
                <div class="input-group">
                    <label class="input-label">Descripcion (opcional)</label>
                    <textarea class="input" id="rec-description" placeholder="Por que recomiendas este recurso?" rows="3"></textarea>
                </div>
            </form>
        `,
        footer: `
            <button class="btn btn-secondary" onclick="closeAllModals()">Cancelar</button>
            <button class="btn btn-primary" onclick="createRecommendation()">Agregar</button>
        `
    });
}

/**
 * Create recommendation
 */
async function createRecommendation() {
    const title = document.getElementById('rec-title')?.value.trim();
    const url = document.getElementById('rec-url')?.value.trim();
    const description = document.getElementById('rec-description')?.value.trim();
    
    if (!title) {
        AuthModule.showNotification('Por favor, ingresa un titulo', 'error');
        return;
    }
    
    try {
        await SupabaseModule.Recommendations.create({
            topic_id: SubjectState.currentTopicId,
            title,
            url: url || null,
            description
        });
        
        closeAllModals();
        AuthModule.showNotification('Recomendacion agregada');
        await loadSubjectData(SubjectState.currentSubject.id);
        
    } catch (error) {
        console.error('Error creating recommendation:', error);
        AuthModule.showNotification('Error al agregar la recomendacion', 'error');
    }
}

/**
 * Show topic context menu
 * @param {string} topicId - Topic ID
 */
function showTopicMenu(topicId) {
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu active';
    menu.style.position = 'fixed';
    menu.innerHTML = `
        <div class="dropdown-item" onclick="editTopic('${topicId}')">
            ${UIModule.getIcon('edit', 18)}
            Editar
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" onclick="deleteTopic('${topicId}')" style="color: var(--error);">
            ${UIModule.getIcon('trash', 18)}
            Eliminar
        </div>
    `;
    
    document.body.appendChild(menu);
    
    const rect = event.target.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

/**
 * Delete topic
 * @param {string} topicId - Topic ID
 */
async function deleteTopic(topicId) {
    UIModule.showConfirm(
        'Estas seguro de que quieres eliminar este tema? Se eliminaran todos los archivos y recomendaciones asociados.',
        async () => {
            try {
                await SupabaseModule.Topics.delete(topicId);
                AuthModule.showNotification('Tema eliminado');
                await loadSubjectData(SubjectState.currentSubject.id);
            } catch (error) {
                console.error('Error deleting topic:', error);
                AuthModule.showNotification('Error al eliminar el tema', 'error');
            }
        }
    );
}

/**
 * Delete file
 * @param {string} fileId - File ID
 * @param {string} fileUrl - File URL
 */
async function deleteFile(fileId, fileUrl) {
    UIModule.showConfirm(
        'Estas seguro de que quieres eliminar este archivo?',
        async () => {
            try {
                await SupabaseModule.Files.delete(fileId, fileUrl);
                AuthModule.showNotification('Archivo eliminado');
                await loadSubjectData(SubjectState.currentSubject.id);
            } catch (error) {
                console.error('Error deleting file:', error);
                AuthModule.showNotification('Error al eliminar el archivo', 'error');
            }
        }
    );
}

/**
 * Delete recommendation
 * @param {string} recId - Recommendation ID
 */
async function deleteRecommendation(recId) {
    try {
        await SupabaseModule.Recommendations.delete(recId);
        AuthModule.showNotification('Recomendacion eliminada');
        await loadSubjectData(SubjectState.currentSubject.id);
    } catch (error) {
        console.error('Error deleting recommendation:', error);
        AuthModule.showNotification('Error al eliminar la recomendacion', 'error');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Setup subject page event listeners
 */
function setupSubjectEventListeners() {
    // Expand/Collapse all buttons
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    
    if (expandAllBtn) expandAllBtn.addEventListener('click', expandAllTopics);
    if (collapseAllBtn) collapseAllBtn.addEventListener('click', collapseAllTopics);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ============================================
// UTILITIES
// ============================================

/**
 * Show/hide subject loading state
 * @param {boolean} show - Show loading
 */
function showSubjectLoading(show) {
    SubjectState.loading = show;
    
    const loaders = document.querySelectorAll('.subject-loader');
    loaders.forEach(loader => {
        loader.style.display = show ? 'flex' : 'none';
    });
}

/**
 * Close all modals
 */
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });
}

/**
 * Download file
 * @param {string} url - File URL
 * @param {string} filename - File name
 */
function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ============================================
// SIDEBAR & TOPBAR SETUP
// ============================================

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay?.classList.toggle('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (collapsed && sidebar) sidebar.classList.add('collapsed');
    
    const userName = document.getElementById('sidebar-user-name');
    const userRole = document.getElementById('sidebar-user-role');
    const userAvatar = document.getElementById('sidebar-user-avatar');
    
    if (SubjectState.profile) {
        if (userName) userName.textContent = SubjectState.profile.email?.split('@')[0] || 'Usuario';
        if (userRole) userRole.textContent = SubjectState.profile.role === 'admin' ? 'Administrador' : 'Estudiante';
        if (userAvatar) userAvatar.textContent = SubjectState.profile.email?.[0]?.toUpperCase() || 'U';
    }
}

function setupTopbar() {
    const searchInput = document.getElementById('topbar-search-input');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await SupabaseModule.getClient().auth.signOut();
            window.location.href = 'login.html';
        });
    }
}

// ============================================
// EXPORT
// ============================================

window.SubjectModule = {
    init: initSubjectPage,
    toggleTopic,
    showAddTopicModal,
    showAddFileModal,
    showAddRecommendationModal,
    deleteTopic,
    deleteFile,
    deleteRecommendation
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initSubjectPage);
