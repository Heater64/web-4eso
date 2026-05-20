/* ============================================
   DASHBOARD - Navegación
   Sidebar fija en desktop, hamburguesa en móvil
   ============================================ */

   /* Update js/pages/dashboard/navigation.js - Fix settings save */
function setupSettingsForm() {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm) return;
    
    // Load profile data into form
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
            
            // Update local state
            Object.assign(window.dashboardState.profile, updates);
            
            // Update UI
            const sidebarUserName = document.getElementById('sidebar-user-name');
            const topbarUserName = document.getElementById('topbar-user-name');
            if (sidebarUserName && updates.name) sidebarUserName.innerText = updates.name;
            if (topbarUserName && updates.name) topbarUserName.innerText = updates.name;
            
            // Update avatar initials if name changed
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

// Add to navigation.js or include in main dashboard init

function setupNavigation() {
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    // Solo para móviles: abrir/cerrar sidebar con botón hamburguesa
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
    
    // Navegación
    const dashboardLink = document.getElementById('dashboard-nav-link');
    const subjectsLink = document.getElementById('subjects-nav-link');
    const settingsLink = document.getElementById('settings-nav-link');
    
    if (dashboardLink) dashboardLink.addEventListener('click', (e) => { e.preventDefault(); showDashboard(); });
    if (subjectsLink) subjectsLink.addEventListener('click', (e) => { e.preventDefault(); showAllSubjects(); });
    if (settingsLink) settingsLink.addEventListener('click', (e) => { e.preventDefault(); showSettings(); });
    
    // Botones de volver
    const backToDashboard = document.getElementById('back-to-dashboard');
    const backToDashboardFiles = document.getElementById('back-to-dashboard-files');
    const backToDashboardSettings = document.getElementById('back-to-dashboard-settings');
    
    if (backToDashboard) backToDashboard.onclick = () => showDashboard();
    if (backToDashboardFiles) backToDashboardFiles.onclick = () => showDashboard();
    if (backToDashboardSettings) backToDashboardSettings.onclick = () => showDashboard();
}

function showDashboard() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsSection = document.getElementById('subjects-section');
    const recentSection = document.getElementById('recent-section');
    const allSubjectsSection = document.getElementById('all-subjects-section');
    const settingsSection = document.getElementById('settings-section');
    
    if (statsGrid) statsGrid.style.display = '';
    if (subjectsSection) subjectsSection.style.display = '';
    if (recentSection) recentSection.style.display = '';
    if (allSubjectsSection) allSubjectsSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = 'none';
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span class="topbar-breadcrumb-current">Dashboard</span>';
    
    updateActiveNavLink('dashboard-nav-link');
    closeMobileSidebar();
}

function showAllSubjects() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsSection = document.getElementById('subjects-section');
    const recentSection = document.getElementById('recent-section');
    const allSubjectsSection = document.getElementById('all-subjects-section');
    const settingsSection = document.getElementById('settings-section');
    
    if (statsGrid) statsGrid.style.display = 'none';
    if (subjectsSection) subjectsSection.style.display = 'none';
    if (recentSection) recentSection.style.display = 'none';
    if (allSubjectsSection) allSubjectsSection.style.display = '';
    if (settingsSection) settingsSection.style.display = 'none';
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span class="topbar-breadcrumb-current">Asignaturas</span>';
    
    updateActiveNavLink('subjects-nav-link');
    
    const container = document.getElementById('all-subjects-grid');
    if (container && window.dashboardState && window.dashboardState.subjects) {
        const isAdmin = window.dashboardState.profile?.role === 'admin';
        container.innerHTML = window.dashboardState.subjects.map(s => `
            <div class="subject-card" style="cursor: pointer;" onclick="location.href='subject.html?id=${s.id}'">
                <div class="subject-card-content">
                    <div class="subject-card-header">
                        <div class="subject-card-icon" style="background:${s.color || '#6366f1'}20; color:${s.color || '#6366f1'}">
                            ${window.UIModule.getIcon(s.icon || 'bookOpen', 28)}
                        </div>
                        ${isAdmin ? `
                            <div class="subject-card-menu">
                                <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showSubjectCardMenu(event, '${s.id}')">
                                    ${window.UIModule.getIcon('moreVertical', 20)}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <h3 class="subject-card-title">${window.Utils.escapeHtml(s.name)}</h3>
                    ${s.description ? `<p class="subject-card-description" style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-2);">${window.Utils.escapeHtml(s.description)}</p>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    closeMobileSidebar();
}

function showSettings() {
    const statsGrid = document.getElementById('stats-grid');
    const subjectsSection = document.getElementById('subjects-section');
    const recentSection = document.getElementById('recent-section');
    const allSubjectsSection = document.getElementById('all-subjects-section');
    const settingsSection = document.getElementById('settings-section');
    
    if (statsGrid) statsGrid.style.display = 'none';
    if (subjectsSection) subjectsSection.style.display = 'none';
    if (recentSection) recentSection.style.display = 'none';
    if (allSubjectsSection) allSubjectsSection.style.display = 'none';
    if (settingsSection) settingsSection.style.display = '';
    
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.innerHTML = '<span class="topbar-breadcrumb-current">Configuración</span>';
    
    updateActiveNavLink('settings-nav-link');
    
    // Cargar perfil
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');
    const profileForm = document.getElementById('profile-form');
    
    if (profileName) profileName.value = window.dashboardState.profile?.name || '';
    if (profileEmail) profileEmail.value = window.dashboardState.profile?.email || '';
    if (profileRole) profileRole.value = window.dashboardState.profile?.role === 'admin' ? 'Administrador' : 'Estudiante';
    
    if (profileForm) {
        // Remover event listener anterior si existe
        const newForm = profileForm.cloneNode(true);
        profileForm.parentNode.replaceChild(newForm, profileForm);
        
        newForm.onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('profile-name')?.value.trim();
            if (newName && window.dashboardState.profile) {
                const client = window.EducaSupabase.getClient();
                await client.from('profiles').update({ name: newName }).eq('id', window.dashboardState.profile.id);
                window.dashboardState.profile.name = newName;
                window.Utils.showNotification('✅ Perfil actualizado');
                
                const sidebarUserName = document.getElementById('sidebar-user-name');
                const topbarUserName = document.getElementById('topbar-user-name');
                if (sidebarUserName) sidebarUserName.innerText = newName;
                if (topbarUserName) topbarUserName.innerText = newName;
            }
        };
    }
    
    closeMobileSidebar();
}

function updateActiveNavLink(activeId) {
    const navLinks = ['dashboard-nav-link', 'subjects-nav-link', 'settings-nav-link'];
    navLinks.forEach(id => {
        const link = document.getElementById(id);
        if (link) {
            if (id === activeId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

// Exportar funciones globales
window.showDashboard = showDashboard;
window.showAllSubjects = showAllSubjects;
window.showSettings = showSettings;
window.closeMobileSidebar = closeMobileSidebar;