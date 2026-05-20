/* ============================================
   DASHBOARD - Inicialización
   ============================================ */

window.dashboardState = {
    subjects: [],
    recentFiles: [],
    recommendations: [],
    allFiles: [],
    profile: null
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
    
    // Actualizar UI
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const topbarUserName = document.getElementById('topbar-user-name');
    const topbarUserRole = document.getElementById('topbar-user-role');
    const addSubjectBtn = document.getElementById('add-subject-btn');
    const adminPanel = document.getElementById('admin-panel');

    if (sidebarUserName) sidebarUserName.innerText = window.dashboardState.profile.name;
    if (sidebarUserRole) sidebarUserRole.innerText = window.dashboardState.profile.role === 'admin' ? 'Administrador' : 'Estudiante';
    if (topbarUserName) topbarUserName.innerText = window.dashboardState.profile.name;
    if (topbarUserRole) topbarUserRole.innerText = window.dashboardState.profile.role === 'admin' ? 'Admin' : 'Usuario';
    
    if (window.dashboardState.profile.role === 'admin') {
        if (adminPanel) adminPanel.style.display = 'block';
        if (addSubjectBtn) {
            addSubjectBtn.style.display = 'inline-flex';
            // Asegurar que el botón funciona
            addSubjectBtn.onclick = () => {
                console.log('Botón nueva asignatura clickeado');
                showSubjectModal();
            };
        }
    }
    
    // Eventos
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.onclick = () => client.auth.signOut().then(() => window.location.href = 'login.html');
    
    const refreshBtn = document.getElementById('refresh-dashboard-btn');
    if (refreshBtn) refreshBtn.onclick = () => refreshDashboard();
    
    const viewAllLink = document.getElementById('view-all-subjects');
    if (viewAllLink) viewAllLink.onclick = (e) => { e.preventDefault(); showAllSubjects(); };
    
    setupNavigation();
    await refreshDashboard();
}

async function refreshDashboard() {
    // Mostrar skeletons
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) statsGrid.innerHTML = Array(4).fill('<div class="stat-card skeleton-card"></div>').join('');
    
    const subjectsGrid = document.getElementById('subjects-grid');
    if (subjectsGrid) subjectsGrid.innerHTML = Array(3).fill('<div class="skeleton skeleton-card"></div>').join('');
    
    const filesList = document.getElementById('files-list-content');
    if (filesList) filesList.innerHTML = Array(3).fill('<div class="skeleton skeleton-text"></div>').join('');
    
    const recommendationsList = document.getElementById('recommendations-list');
    if (recommendationsList) recommendationsList.innerHTML = Array(2).fill('<div class="skeleton skeleton-text"></div>').join('');
    
    try {
        // Cargar asignaturas con detalles
        const subjectsData = await window.EducaSupabase.Subjects.getAll() || [];
        const subjectsWithDetails = await Promise.all(subjectsData.map(async (subject) => {
            return await window.EducaSupabase.Subjects.getById(subject.id);
        }));
        
        window.dashboardState.subjects = subjectsWithDetails;
        window.dashboardState.recentFiles = await window.EducaSupabase.Files.getRecent(5) || [];
        window.dashboardState.allFiles = await window.EducaSupabase.Files.getAll() || [];
        window.dashboardState.recommendations = await window.EducaSupabase.Recommendations.getRecent(5) || [];
        
        renderStats();
        renderSubjects();
        renderRecentFiles();
        renderRecommendations();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
        window.Utils.showNotification('Error al cargar los datos', 'error');
    }
}

window.initDashboard = initDashboard;
window.refreshDashboard = refreshDashboard;