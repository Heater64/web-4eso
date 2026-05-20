/* ============================================
   DASHBOARD - Inicialización (versión sin archivos recientes)
   ============================================ */

window.dashboardState = {
    subjects: [],
    profile: null,
    currentView: 'dashboard'
};

async function initDashboard() {
    const client = window.EducaSupabase.getClient();
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    const profile = await window.EducaSupabase.Profiles.getCurrentProfile();
    window.dashboardState.profile = profile || { 
        name: session.user.email.split('@')[0], 
        role: 'user', 
        email: session.user.email,
        id: session.user.id
    };
    
    updateDashboardUserUI();
    
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    
    setupDashboardEventListeners();
    setupDashboardSearch();
    setupSettingsForm();
    setupKeyboardShortcuts();
    
    await refreshDashboard();
    
    if (view === 'subjects') {
        showAllSubjects();
    } else if (view === 'settings') {
        showSettings();
    }
}

function updateDashboardUserUI() {
    const profile = window.dashboardState.profile;
    if (!profile) return;
    
    const name = profile.name || profile.email?.split('@')[0] || 'Usuario';
    const role = profile.role === 'admin' ? 'Administrador' : 'Estudiante';
    const initial = name.charAt(0).toUpperCase();
    
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const topbarUserName = document.getElementById('topbar-user-name');
    const topbarUserRole = document.getElementById('topbar-user-role');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const adminPanel = document.getElementById('admin-panel');
    
    if (sidebarUserName) sidebarUserName.innerText = name;
    if (sidebarUserRole) sidebarUserRole.innerText = role;
    if (topbarUserName) topbarUserName.innerText = name;
    if (topbarUserRole) topbarUserRole.innerText = profile.role === 'admin' ? 'Admin' : 'Usuario';
    
    const avatarElements = ['sidebar-user-avatar', 'topbar-user-avatar'];
    avatarElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (profile.avatar_url) {
                el.innerHTML = `<img src="${profile.avatar_url}" alt="${name}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            } else {
                el.innerText = initial;
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
            }
        }
    });
    
    if (profile.role === 'admin') {
        if (adminPanel) adminPanel.style.display = 'block';
        if (addSubjectBtn) {
            addSubjectBtn.style.display = 'inline-flex';
            addSubjectBtn.onclick = () => showSubjectModal();
        }
    }
}

function setupDashboardEventListeners() {
    const client = window.EducaSupabase.getClient();
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => client.auth.signOut().then(() => window.location.href = 'login.html');
    }
    
    const refreshBtn = document.getElementById('refresh-dashboard-btn');
    if (refreshBtn) refreshBtn.onclick = () => refreshDashboard();
    
    const viewAllLink = document.getElementById('view-all-subjects');
    if (viewAllLink) {
        viewAllLink.onclick = (e) => {
            e.preventDefault();
            showAllSubjects();
        };
    }
    
    const dashboardLink = document.getElementById('dashboard-nav-link');
    const subjectsLink = document.getElementById('subjects-nav-link');
    const settingsLink = document.getElementById('settings-nav-link');
    
    if (dashboardLink) dashboardLink.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });
    if (subjectsLink) subjectsLink.addEventListener('click', (e) => { e.preventDefault(); showAllSubjects(); });
    if (settingsLink) settingsLink.addEventListener('click', (e) => { e.preventDefault(); showSettings(); });
    
    const backToDashboard = document.getElementById('back-to-dashboard');
    const backToDashboardSettings = document.getElementById('back-to-dashboard-settings');
    
    if (backToDashboard) backToDashboard.onclick = () => showDashboard();
    if (backToDashboardSettings) backToDashboardSettings.onclick = () => showDashboard();
    
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (menuBtn && sidebar && overlay) {
        menuBtn.onclick = () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        };
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
}

function setupSettingsForm() {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;
    
    const profile = window.dashboardState.profile;
    if (profile) {
        const nameInput = document.getElementById('profile-name');
        const emailInput = document.getElementById('profile-email');
        const roleInput = document.getElementById('profile-role');
        const avatarInput = document.getElementById('profile-avatar');
        
        if (nameInput) nameInput.value = profile.name || '';
        if (emailInput) emailInput.value = profile.email || '';
        if (roleInput) roleInput.value = profile.role === 'admin' ? 'Administrador' : 'Estudiante';
        if (avatarInput) avatarInput.value = profile.avatar_url || '';
    }
    
    profileForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById('profile-name');
        const avatarInput = document.getElementById('profile-avatar');
        
        const updates = {};
        if (nameInput && nameInput.value.trim()) updates.name = nameInput.value.trim();
        if (avatarInput && avatarInput.value.trim()) updates.avatar_url = avatarInput.value.trim();
        
        if (Object.keys(updates).length === 0) {
            window.Utils.showNotification('No hay cambios para guardar', 'info');
            return;
        }
        
        try {
            const client = window.EducaSupabase.getClient();
            const { error } = await client
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', window.dashboardState.profile.id);
            
            if (error) throw error;
            
            Object.assign(window.dashboardState.profile, updates);
            
            const sidebarUserName = document.getElementById('sidebar-user-name');
            const topbarUserName = document.getElementById('topbar-user-name');
            if (sidebarUserName && updates.name) sidebarUserName.innerText = updates.name;
            if (topbarUserName && updates.name) topbarUserName.innerText = updates.name;
            
            if (updates.name) {
                const initial = updates.name.charAt(0).toUpperCase();
                const avatarElements = ['sidebar-user-avatar', 'topbar-user-avatar'];
                avatarElements.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && !window.dashboardState.profile.avatar_url) el.innerText = initial;
                });
            }
            
            window.Utils.showNotification('✅ Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error updating profile:', error);
            window.Utils.showNotification('❌ Error al actualizar el perfil', 'error');
        }
    };
}

function setupDashboardSearch() {
    const searchInput = document.getElementById('topbar-search-input');
    if (!searchInput) return;
    
    const performSearch = window.Utils.debounce((term) => {
        filterSubjects(term);
    }, 300);
    
    searchInput.addEventListener('input', (e) => performSearch(e.target.value));
}

function filterSubjects(term) {
    if (!window.dashboardState || !window.dashboardState.subjects) return;
    
    const allSubjectsGrid = document.getElementById('all-subjects-grid');
    const isAllSubjectsView = allSubjectsGrid && getComputedStyle(allSubjectsGrid.parentElement).display !== 'none';
    
    if (!term.trim()) {
        if (isAllSubjectsView) {
            renderAllSubjectsGrid(window.dashboardState.subjects);
        } else {
            renderSubjects();
        }
        return;
    }
    
    const lowerTerm = term.toLowerCase();
    const filtered = window.dashboardState.subjects.filter(subject => 
        subject.name.toLowerCase().includes(lowerTerm) ||
        (subject.description && subject.description.toLowerCase().includes(lowerTerm))
    );
    
    if (isAllSubjectsView) {
        renderAllSubjectsGrid(filtered);
    } else {
        renderFilteredSubjects(filtered);
    }
}

function renderFilteredSubjects(subjects) {
    const container = document.getElementById('subjects-grid');
    if (!container) return;
    
    const isAdmin = window.dashboardState.profile?.role === 'admin';
    const subjectsToShow = subjects.slice(0, 3);
    
    if (subjectsToShow.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({
            icon: 'search',
            title: 'No se encontraron asignaturas',
            description: 'No hay asignaturas que coincidan con tu búsqueda.'
        });
        return;
    }
    
    let html = '';
    for (const s of subjectsToShow) {
        const topicCount = s.topics ? s.topics.length : 0;
        let fileCount = 0;
        if (s.topics) {
            for (const t of s.topics) fileCount += t.files?.length || 0;
        }
        
        html += `
            <div class="subject-card" style="cursor: pointer;">
                <div class="subject-card-content" onclick="location.href='subject.html?id=${s.id}'">
                    <div class="subject-card-header">
                        <div class="subject-card-icon" style="background:${s.color || '#6366f1'}20; color:${s.color || '#6366f1'}">
                            ${window.UIModule.getIcon(s.icon || 'bookOpen', 28)}
                        </div>
                        ${isAdmin ? `
                            <div class="subject-card-menu">
                                <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showSubjectCardMenu(event, '${s.id}')">${window.UIModule.getIcon('moreVertical', 20)}</button>
                            </div>
                        ` : ''}
                    </div>
                    <h3 class="subject-card-title">${window.Utils.escapeHtml(s.name)}</h3>
                    ${s.description ? `<p class="subject-card-description" style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-2);">${window.Utils.escapeHtml(s.description)}</p>` : ''}
                    <div class="subject-card-meta">
                        <span class="subject-card-meta-item">${window.UIModule.getIcon('folder', 16)} ${topicCount} ${topicCount === 1 ? 'tema' : 'temas'}</span>
                        <span class="subject-card-meta-item">${window.UIModule.getIcon('fileText', 16)} ${fileCount} ${fileCount === 1 ? 'archivo' : 'archivos'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function renderAllSubjectsGrid(subjects) {
    const container = document.getElementById('all-subjects-grid');
    if (!container) return;
    
    const isAdmin = window.dashboardState.profile?.role === 'admin';
    
    if (subjects.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({
            icon: 'bookOpen',
            title: 'Sin asignaturas',
            description: 'No hay asignaturas creadas aún.',
            actionText: isAdmin ? 'Crear asignatura' : null,
            actionOnClick: 'window.showSubjectModal()'
        });
        return;
    }
    
    let html = '';
    for (const s of subjects) {
        html += `
            <div class="subject-card" style="cursor: pointer;">
                <div class="subject-card-content" onclick="location.href='subject.html?id=${s.id}'">
                    <div class="subject-card-header">
                        <div class="subject-card-icon" style="background:${s.color || '#6366f1'}20; color:${s.color || '#6366f1'}">
                            ${window.UIModule.getIcon(s.icon || 'bookOpen', 28)}
                        </div>
                        ${isAdmin ? `
                            <div class="subject-card-menu">
                                <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showSubjectCardMenu(event, '${s.id}')">${window.UIModule.getIcon('moreVertical', 20)}</button>
                            </div>
                        ` : ''}
                    </div>
                    <h3 class="subject-card-title">${window.Utils.escapeHtml(s.name)}</h3>
                    ${s.description ? `<p class="subject-card-description" style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-2);">${window.Utils.escapeHtml(s.description)}</p>` : ''}
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('topbar-search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

function closeMobileSidebar() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

function updateActiveNavLink(activeId) {
    const navLinks = ['dashboard-nav-link', 'subjects-nav-link', 'settings-nav-link'];
    navLinks.forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            if (id === activeId) link.classList.add('active');
            else link.classList.remove('active');
        }
    });
}

async function refreshDashboard() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsGrid = document.getElementById('subjects-grid');
    
    if (statsGrid) statsGrid.innerHTML = Array(3).fill('<div class="stat-card skeleton-card"></div>').join('');
    if (subjectsGrid) subjectsGrid.innerHTML = Array(3).fill('<div class="skeleton skeleton-card"></div>').join('');
    
    try {
        const subjectsData = await window.EducaSupabase.Subjects.getAll() || [];
        const subjectsWithDetails = await Promise.all(subjectsData.map(async (subject) => {
            return await window.EducaSupabase.Subjects.getById(subject.id);
        }));
        
        window.dashboardState.subjects = subjectsWithDetails;
        
        renderStats();
        renderSubjects();
        
        if (window.dashboardState.currentView === 'subjects' && document.getElementById('all-subjects-section').style.display !== 'none') {
            renderAllSubjectsGrid(window.dashboardState.subjects);
        }
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        window.Utils.showNotification('Error al cargar los datos', 'error');
    }
}

function renderStats() {
    const container = document.getElementById('stats-grid');
    if (!container) return;
    
    let totalTopics = 0;
    let totalFiles = 0;
    
    for (let i = 0; i < window.dashboardState.subjects.length; i++) {
        const subject = window.dashboardState.subjects[i];
        if (subject.topics) {
            totalTopics += subject.topics.length;
            for (let j = 0; j < subject.topics.length; j++) {
                if (subject.topics[j].files) {
                    totalFiles += subject.topics[j].files.length;
                }
            }
        }
    }
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-icon primary">${window.UIModule.getIcon('bookOpen', 24)}</div>
            </div>
            <div class="stat-card-value">${window.dashboardState.subjects.length}</div>
            <div class="stat-card-label">Asignaturas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-icon success">${window.UIModule.getIcon('folderOpen', 24)}</div>
            </div>
            <div class="stat-card-value">${totalTopics}</div>
            <div class="stat-card-label">Temas</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-icon info">${window.UIModule.getIcon('fileText', 24)}</div>
            </div>
            <div class="stat-card-value">${totalFiles}</div>
            <div class="stat-card-label">Archivos</div>
        </div>
    `;
}

function renderSubjects() {
    const container = document.getElementById('subjects-grid');
    if (!container) return;
    
    const isAdmin = window.dashboardState.profile?.role === 'admin';
    
    if (window.dashboardState.subjects.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({ 
            icon: 'bookOpen', 
            title: 'Sin asignaturas', 
            description: 'No hay asignaturas creadas aún.',
            actionText: isAdmin ? 'Crear asignatura' : null,
            actionOnClick: 'window.showSubjectModal()'
        });
        return;
    }
    
    const subjectsToShow = window.dashboardState.subjects.slice(0, 3);
    let html = '';
    
    for (const s of subjectsToShow) {
        const topicCount = s.topics ? s.topics.length : 0;
        let fileCount = 0;
        
        if (s.topics) {
            for (const t of s.topics) {
                if (t.files) fileCount += t.files.length;
            }
        }
        
        html += `
            <div class="subject-card" style="cursor: pointer; position: relative;">
                <div class="subject-card-content" onclick="location.href='subject.html?id=${s.id}'">
                    <div class="subject-card-header">
                        <div class="subject-card-icon" style="background:${s.color || '#6366f1'}20; color:${s.color || '#6366f1'}">
                            ${window.UIModule.getIcon(s.icon || 'bookOpen', 28)}
                        </div>
                        ${isAdmin ? `
                            <div class="subject-card-menu">
                                <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showSubjectCardMenu(event, '${s.id}')" style="padding: 8px; border-radius: 8px; cursor: pointer;" title="Opciones">
                                    ${window.UIModule.getIcon('moreVertical', 20)}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <h3 class="subject-card-title">${window.Utils.escapeHtml(s.name)}</h3>
                    ${s.description ? `<p class="subject-card-description" style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-2);">${window.Utils.escapeHtml(s.description)}</p>` : ''}
                    <div class="subject-card-meta" style="margin-top: var(--space-3);">
                        <span class="subject-card-meta-item">${window.UIModule.getIcon('folder', 16)} ${topicCount} ${topicCount === 1 ? 'tema' : 'temas'}</span>
                        <span class="subject-card-meta-item">${window.UIModule.getIcon('fileText', 16)} ${fileCount} ${fileCount === 1 ? 'archivo' : 'archivos'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

window.showDashboard = function() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsSection = document.getElementById('subjects-section');
    const allSubjectsSection = document.getElementById('all-subjects-section');
    const settingsSection = document.getElementById('settings-section');
    
    if (statsGrid) statsGrid.style.display = '';
    if (subjectsSection) subjectsSection.style.display = '';
    if (allSubjectsSection) allSubjectsSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = 'none';
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span class="topbar-breadcrumb-current">Dashboard</span>';
    
    updateActiveNavLink('dashboard-nav-link');
    window.dashboardState.currentView = 'dashboard';
    closeMobileSidebar();
    refreshDashboard();
};

window.showAllSubjects = function() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsSection = document.getElementById('subjects-section');
    const allSubjectsSection = document.getElementById('all-subjects-section');
    const settingsSection = document.getElementById('settings-section');
    
    if (statsGrid) statsGrid.style.display = 'none';
    if (subjectsSection) subjectsSection.style.display = 'none';
    if (allSubjectsSection) allSubjectsSection.style.display = '';
    if (settingsSection) settingsSection.style.display = 'none';
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span class="topbar-breadcrumb-current">Asignaturas</span>';
    
    updateActiveNavLink('subjects-nav-link');
    window.dashboardState.currentView = 'subjects';
    closeMobileSidebar();
    
    renderAllSubjectsGrid(window.dashboardState.subjects);
};

window.showSettings = function() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsSection = document.getElementById('subjects-section');
    const allSubjectsSection = document.getElementById('all-subjects-section');
    const settingsSection = document.getElementById('settings-section');
    
    if (statsGrid) statsGrid.style.display = 'none';
    if (subjectsSection) subjectsSection.style.display = 'none';
    if (allSubjectsSection) allSubjectsSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = '';
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span class="topbar-breadcrumb-current">Configuración</span>';
    
    updateActiveNavLink('settings-nav-link');
    window.dashboardState.currentView = 'settings';
    closeMobileSidebar();
};

window.initDashboard = initDashboard;
window.refreshDashboard = refreshDashboard;
window.closeMobileSidebar = closeMobileSidebar;