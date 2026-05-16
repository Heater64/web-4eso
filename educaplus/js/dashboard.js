/* ============================================
   EDUCA+ - Dashboard Module
   Main Dashboard Functionality
   ============================================ */

// ============================================
// STATE
// ============================================

const DashboardState = {
    subjects: [],
    recentFiles: [],
    recommendations: [],
    stats: {
        totalSubjects: 0,
        totalTopics: 0,
        totalFiles: 0,
        recentActivity: 0
    },
    loading: true
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize dashboard
 */
async function initDashboard() {
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
    try {
        DashboardState.profile = await SupabaseModule.Profiles.getCurrentProfile();
    } catch (error) {
        console.error('Error getting profile:', error);
    }
    
    // Setup UI
    setupSidebar();
    setupTopbar();
    
    // Load dashboard data
    await loadDashboardData();
    
    // Setup event listeners
    setupDashboardEventListeners();
    
    // Initialize animations
    initDashboardAnimations();
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    showDashboardLoading(true);
    
    try {
        // Load subjects
        DashboardState.subjects = await SupabaseModule.Subjects.getAll();
        
        // Load recent files
        DashboardState.recentFiles = await SupabaseModule.Files.getRecent(5);
        
        // Load recent recommendations
        DashboardState.recommendations = await SupabaseModule.Recommendations.getRecent(5);
        
        // Calculate stats
        calculateStats();
        
        // Render dashboard
        renderDashboard();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error al cargar los datos', 'error');
    } finally {
        showDashboardLoading(false);
    }
}

/**
 * Calculate dashboard statistics
 */
function calculateStats() {
    const subjects = DashboardState.subjects || [];
    
    DashboardState.stats = {
        totalSubjects: subjects.length,
        totalTopics: subjects.reduce((acc, s) => acc + (s.topics?.[0]?.count || 0), 0),
        totalFiles: subjects.reduce((acc, s) => acc + (s.files?.[0]?.count || 0), 0),
        recentActivity: DashboardState.recentFiles?.length || 0
    };
}

// ============================================
// RENDERING
// ============================================

/**
 * Render entire dashboard
 */
function renderDashboard() {
    renderStats();
    renderSubjects();
    renderRecentFiles();
    renderRecommendations();
}

/**
 * Render statistics cards
 */
function renderStats() {
    const container = document.getElementById('stats-grid');
    if (!container) return;
    
    const { stats } = DashboardState;
    
    container.innerHTML = `
        <div class="stat-card animate-fadeInUp" style="animation-delay: 0ms;">
            <div class="stat-card-header">
                <div class="stat-card-icon primary">
                    ${UIModule.getIcon('bookOpen', 24)}
                </div>
            </div>
            <div class="stat-card-value">${stats.totalSubjects}</div>
            <div class="stat-card-label">Asignaturas</div>
        </div>
        
        <div class="stat-card animate-fadeInUp" style="animation-delay: 50ms;">
            <div class="stat-card-header">
                <div class="stat-card-icon success">
                    ${UIModule.getIcon('folderOpen', 24)}
                </div>
            </div>
            <div class="stat-card-value">${stats.totalTopics}</div>
            <div class="stat-card-label">Temas</div>
        </div>
        
        <div class="stat-card animate-fadeInUp" style="animation-delay: 100ms;">
            <div class="stat-card-header">
                <div class="stat-card-icon info">
                    ${UIModule.getIcon('fileText', 24)}
                </div>
            </div>
            <div class="stat-card-value">${stats.totalFiles}</div>
            <div class="stat-card-label">Archivos</div>
        </div>
        
        <div class="stat-card animate-fadeInUp" style="animation-delay: 150ms;">
            <div class="stat-card-header">
                <div class="stat-card-icon warning">
                    ${UIModule.getIcon('clock', 24)}
                </div>
            </div>
            <div class="stat-card-value">${stats.recentActivity}</div>
            <div class="stat-card-label">Archivos recientes</div>
        </div>
    `;
}

/**
 * Render subjects grid
 */
function renderSubjects() {
    const container = document.getElementById('subjects-grid');
    if (!container) return;
    
    const subjects = DashboardState.subjects || [];
    
    if (subjects.length === 0) {
        container.innerHTML = UIModule.createEmptyState({
            icon: 'bookOpen',
            title: 'Sin asignaturas',
            description: 'No hay asignaturas creadas aun.',
            actionText: DashboardState.profile?.role === 'admin' ? 'Crear asignatura' : null,
            actionOnClick: 'showAddSubjectModal()'
        });
        return;
    }
    
    container.innerHTML = subjects.map((subject, index) => `
        <div class="subject-card animate-fadeInUp" style="animation-delay: ${index * 50}ms;" 
             onclick="navigateToSubject('${subject.id}')">
            <div class="subject-card-content">
                <div class="subject-card-header">
                    <div class="subject-card-icon">
                        ${UIModule.getIcon(subject.icon || 'bookOpen', 28)}
                    </div>
                    <button class="subject-card-menu" onclick="event.stopPropagation(); showSubjectMenu('${subject.id}')">
                        ${UIModule.getIcon('moreHorizontal', 20)}
                    </button>
                </div>
                <h3 class="subject-card-title">${subject.name}</h3>
                <div class="subject-card-meta">
                    <span class="subject-card-meta-item">
                        ${UIModule.getIcon('folder', 16)}
                        ${subject.topics?.[0]?.count || 0} temas
                    </span>
                    <span class="subject-card-meta-item">
                        ${UIModule.getIcon('fileText', 16)}
                        ${subject.files?.[0]?.count || 0} archivos
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Render recent files list
 */
function renderRecentFiles() {
    const container = document.getElementById('files-list-content');
    if (!container) return;
    
    const files = DashboardState.recentFiles || [];
    
    if (files.length === 0) {
        container.innerHTML = UIModule.createEmptyState({
            icon: 'fileText',
            title: 'Sin archivos',
            description: 'No hay archivos subidos recientemente.'
        });
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="file-row">
            <div class="file-row-icon ${file.file_type}">
                ${UIModule.getIcon(file.file_type === 'pdf' ? 'fileText' : file.file_type === 'image' ? 'image' : 'file', 20)}
            </div>
            <div class="file-row-info">
                <div class="file-row-name">${file.file_name}</div>
                <div class="file-row-meta">
                    <span>${file.topics?.subjects?.name || 'Sin asignatura'}</span>
                    <span>${UIModule.formatDate(file.created_at)}</span>
                </div>
            </div>
            <div class="file-row-actions">
                <a href="${file.file_url}" target="_blank" class="file-action-btn" title="Ver archivo">
                    ${UIModule.getIcon('externalLink', 16)}
                </a>
                <button class="file-action-btn" title="Descargar" onclick="downloadFile('${file.file_url}', '${file.file_name}')">
                    ${UIModule.getIcon('download', 16)}
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Render recommendations
 */
function renderRecommendations() {
    const container = document.getElementById('recommendations-list');
    if (!container) return;
    
    const recommendations = DashboardState.recommendations || [];
    
    if (recommendations.length === 0) {
        container.innerHTML = UIModule.createEmptyState({
            icon: 'lightbulb',
            title: 'Sin recomendaciones',
            description: 'No hay recomendaciones disponibles.'
        });
        return;
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item" onclick="${rec.url ? `window.open('${rec.url}', '_blank')` : ''}">
            <div class="recommendation-icon">
                ${UIModule.getIcon('lightbulb', 16)}
            </div>
            <div class="recommendation-title">${rec.title}</div>
            <div class="recommendation-description">${rec.description || ''}</div>
        </div>
    `).join('');
}

// ============================================
// SIDEBAR & TOPBAR
// ============================================

/**
 * Setup sidebar functionality
 */
function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Toggle sidebar collapse (desktop)
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Toggle sidebar on mobile
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay?.classList.toggle('active');
        });
    }
    
    // Close sidebar on overlay click
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    // Restore sidebar state
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (collapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }
    
    // Update user info in sidebar
    const userName = document.getElementById('sidebar-user-name');
    const userRole = document.getElementById('sidebar-user-role');
    const userAvatar = document.getElementById('sidebar-user-avatar');
    
    if (DashboardState.profile) {
        if (userName) userName.textContent = DashboardState.profile.email?.split('@')[0] || 'Usuario';
        if (userRole) userRole.textContent = DashboardState.profile.role === 'admin' ? 'Administrador' : 'Estudiante';
        if (userAvatar) userAvatar.textContent = DashboardState.profile.email?.[0]?.toUpperCase() || 'U';
    }
}

/**
 * Setup topbar functionality
 */
function setupTopbar() {
    const searchInput = document.getElementById('topbar-search-input');
    const logoutBtn = document.getElementById('logout-btn');
    const userMenuBtn = document.getElementById('user-menu-btn');
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // User menu dropdown
    if (userMenuBtn) {
        const dropdown = userMenuBtn.closest('.dropdown');
        userMenuBtn.addEventListener('click', () => {
            dropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
    
    // Update user info in topbar
    const topbarUserName = document.getElementById('topbar-user-name');
    const topbarUserRole = document.getElementById('topbar-user-role');
    const topbarUserAvatar = document.getElementById('topbar-user-avatar');
    
    if (DashboardState.profile) {
        if (topbarUserName) topbarUserName.textContent = DashboardState.profile.email?.split('@')[0] || 'Usuario';
        if (topbarUserRole) topbarUserRole.textContent = DashboardState.profile.role === 'admin' ? 'Administrador' : 'Estudiante';
        if (topbarUserAvatar) topbarUserAvatar.textContent = DashboardState.profile.email?.[0]?.toUpperCase() || 'U';
    }
}

/**
 * Handle search
 * @param {Event} event - Input event
 */
function handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    
    if (query.length < 2) {
        renderSubjects();
        return;
    }
    
    // Filter subjects
    const filtered = DashboardState.subjects.filter(subject => 
        subject.name.toLowerCase().includes(query)
    );
    
    // Render filtered results
    const container = document.getElementById('subjects-grid');
    if (container && filtered.length > 0) {
        container.innerHTML = filtered.map((subject, index) => `
            <div class="subject-card animate-fadeInUp" style="animation-delay: ${index * 50}ms;" 
                 onclick="navigateToSubject('${subject.id}')">
                <div class="subject-card-content">
                    <div class="subject-card-header">
                        <div class="subject-card-icon">
                            ${UIModule.getIcon(subject.icon || 'bookOpen', 28)}
                        </div>
                    </div>
                    <h3 class="subject-card-title">${subject.name}</h3>
                    <div class="subject-card-meta">
                        <span class="subject-card-meta-item">
                            ${UIModule.getIcon('folder', 16)}
                            ${subject.topics?.[0]?.count || 0} temas
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    } else if (container) {
        container.innerHTML = UIModule.createEmptyState({
            icon: 'search',
            title: 'Sin resultados',
            description: `No se encontraron asignaturas para "${query}"`
        });
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        await SupabaseModule.getClient().auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Setup dashboard event listeners
 */
function setupDashboardEventListeners() {
    // Add subject button
    const addSubjectBtn = document.getElementById('add-subject-btn');
    if (addSubjectBtn && DashboardState.profile?.role === 'admin') {
        addSubjectBtn.style.display = 'inline-flex';
        addSubjectBtn.addEventListener('click', showAddSubjectModal);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus search on Ctrl+K
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('topbar-search-input')?.focus();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ============================================
// MODALS
// ============================================

/**
 * Show add subject modal
 */
function showAddSubjectModal() {
    const modal = UIModule.showModal({
        title: 'Nueva Asignatura',
        content: `
            <form id="add-subject-form" class="form-grid">
                <div class="input-group">
                    <label class="input-label">Nombre de la asignatura</label>
                    <input type="text" class="input" id="subject-name" placeholder="Ej: Matematicas" required>
                </div>
                
                <div class="input-group">
                    <label class="input-label">Descripcion (opcional)</label>
                    <textarea class="input" id="subject-description" placeholder="Breve descripcion de la asignatura" rows="3"></textarea>
                </div>
                
                <div class="input-group">
                    <label class="input-label">Icono</label>
                    <div class="icon-selector" id="icon-selector">
                        <button type="button" class="icon-option selected" data-icon="bookOpen">${UIModule.getIcon('bookOpen', 24)}</button>
                        <button type="button" class="icon-option" data-icon="calculator">${UIModule.getIcon('calculator', 24)}</button>
                        <button type="button" class="icon-option" data-icon="flaskConical">${UIModule.getIcon('flaskConical', 24)}</button>
                        <button type="button" class="icon-option" data-icon="globe">${UIModule.getIcon('globe', 24)}</button>
                        <button type="button" class="icon-option" data-icon="music">${UIModule.getIcon('music', 24)}</button>
                        <button type="button" class="icon-option" data-icon="dumbbell">${UIModule.getIcon('dumbbell', 24)}</button>
                    </div>
                </div>
            </form>
        `,
        footer: `
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="createSubject()">Crear asignatura</button>
        `
    });
    
    // Icon selector
    const iconSelector = document.getElementById('icon-selector');
    iconSelector?.addEventListener('click', (e) => {
        const option = e.target.closest('.icon-option');
        if (option) {
            iconSelector.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        }
    });
}

/**
 * Create new subject
 */
async function createSubject() {
    const name = document.getElementById('subject-name')?.value.trim();
    const description = document.getElementById('subject-description')?.value.trim();
    const icon = document.querySelector('.icon-option.selected')?.dataset.icon || 'bookOpen';
    
    if (!name) {
        AuthModule.showNotification('Por favor, ingresa un nombre', 'error');
        return;
    }
    
    try {
        await SupabaseModule.Subjects.create({
            name,
            description,
            icon
        });
        
        closeAllModals();
        AuthModule.showNotification('Asignatura creada exitosamente');
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error creating subject:', error);
        AuthModule.showNotification('Error al crear la asignatura', 'error');
    }
}

/**
 * Show subject menu
 * @param {string} subjectId - Subject ID
 */
function showSubjectMenu(subjectId) {
    if (DashboardState.profile?.role !== 'admin') return;
    
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'dropdown-menu active';
    menu.style.position = 'fixed';
    menu.innerHTML = `
        <div class="dropdown-item" onclick="editSubject('${subjectId}')">
            ${UIModule.getIcon('edit', 18)}
            Editar
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" onclick="deleteSubject('${subjectId}')" style="color: var(--error);">
            ${UIModule.getIcon('trash', 18)}
            Eliminar
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Position menu
    const rect = event.target.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.left = `${rect.left}px`;
    
    // Close on click outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

/**
 * Delete subject
 * @param {string} subjectId - Subject ID
 */
async function deleteSubject(subjectId) {
    UIModule.showConfirm(
        'Estas seguro de que quieres eliminar esta asignatura? Esta accion no se puede deshacer.',
        async () => {
            try {
                await SupabaseModule.Subjects.delete(subjectId);
                AuthModule.showNotification('Asignatura eliminada');
                await loadDashboardData();
            } catch (error) {
                console.error('Error deleting subject:', error);
                AuthModule.showNotification('Error al eliminar la asignatura', 'error');
            }
        }
    );
}

/**
 * Navigate to subject detail
 * @param {string} subjectId - Subject ID
 */
function navigateToSubject(subjectId) {
    window.location.href = `subject.html?id=${subjectId}`;
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

// ============================================
// UTILITIES
// ============================================

/**
 * Show/hide dashboard loading state
 * @param {boolean} show - Show loading state
 */
function showDashboardLoading(show) {
    DashboardState.loading = show;
    
    const loaders = document.querySelectorAll('.dashboard-loader');
    loaders.forEach(loader => {
        loader.style.display = show ? 'flex' : 'none';
    });
    
    const contents = document.querySelectorAll('.dashboard-content');
    contents.forEach(content => {
        content.style.opacity = show ? '0.5' : '1';
        content.style.pointerEvents = show ? 'none' : 'auto';
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

/**
 * Initialize dashboard animations
 */
function initDashboardAnimations() {
    // Animate cards on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.stat-card, .subject-card, .file-row, .recommendation-item').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// EXPORT
// ============================================

window.DashboardModule = {
    init: initDashboard,
    load: loadDashboardData,
    showAddSubjectModal,
    createSubject,
    deleteSubject,
    navigateToSubject
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initDashboard);
