/* ============================================
   SUBJECT - Inicialización
   ============================================ */

window.subjectData = {
    current: null,
    topics: [],
    profile: null,
    comments: {}
};

async function initSubject() {
    var urlParams = new URLSearchParams(window.location.search);
    var subjectId = urlParams.get('id');
    if (!subjectId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    var client = window.EducaSupabase.getClient();
    var sessionData = await client.auth.getSession();
    var session = sessionData.data.session;
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    
    var profile = await window.EducaSupabase.Profiles.getCurrentProfile();
    window.subjectData.profile = profile || { 
        name: session.user.email.split('@')[0], 
        role: 'user', 
        id: session.user.id 
    };
    
    var sidebarUserName = document.getElementById('sidebar-user-name');
    var topbarUserName = document.getElementById('topbar-user-name');
    var sidebarUserRole = document.getElementById('sidebar-user-role');
    var topbarUserRole = document.getElementById('topbar-user-role');
    
    if (sidebarUserName) sidebarUserName.innerText = window.subjectData.profile.name;
    if (topbarUserName) topbarUserName.innerText = window.subjectData.profile.name;
    if (sidebarUserRole) sidebarUserRole.innerText = window.subjectData.profile.role === 'admin' ? 'Administrador' : 'Estudiante';
    if (topbarUserRole) topbarUserRole.innerText = window.subjectData.profile.role === 'admin' ? 'Admin' : 'Usuario';
    
    await loadSubject(subjectId);
    setupSubjectEvents();
}

async function loadSubject(subjectId) {
    try {
        var heroContainer = document.getElementById('subject-hero');
        var topicsContainer = document.getElementById('topics-list');
        
        if (heroContainer) heroContainer.innerHTML = '<div class="skeleton" style="height: 160px;"></div>';
        if (topicsContainer) topicsContainer.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
        
        window.subjectData.current = await window.EducaSupabase.Subjects.getById(subjectId);
        
        if (!window.subjectData.current) {
            window.location.href = 'dashboard.html';
            return;
        }
        
        window.subjectData.topics = window.subjectData.current.topics || [];
        
        for (var i = 0; i < window.subjectData.topics.length; i++) {
            var topic = window.subjectData.topics[i];
            window.subjectData.comments[topic.id] = await window.EducaSupabase.Comments.getByTopic(topic.id);
        }
        
        renderSubject();
        document.title = window.subjectData.current.name + ' - Educa+';
    } catch (error) {
        console.error('Error loading subject:', error);
        if (window.Utils) window.Utils.showNotification('Error al cargar la asignatura', 'error');
    }
}

async function refreshSubject() {
    var urlParams = new URLSearchParams(window.location.search);
    var subjectId = urlParams.get('id');
    if (subjectId) {
        await loadSubject(subjectId);
    }
}

window.refreshSubject = refreshSubject;
window.subjectData = subjectData;
window.initSubject = initSubject;
window.loadSubject = loadSubject;