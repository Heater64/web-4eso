/* ============================================
   DASHBOARD - Funciones de búsqueda
   ============================================ */

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