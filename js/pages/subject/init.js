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
    console.log('initSubject called');
    
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('id');
    
    if (!subjectId) {
        console.log('No subject ID, redirecting');
        window.location.href = 'dashboard.html';
        return;
    }
    
    const client = window.EducaSupabase.getClient();
    const { data: { session } } = await client.auth.getSession();
    
    if (!session) {
        console.log('No session, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    const profile = await window.EducaSupabase.Profiles.getCurrentProfile();
    window.subjectData.profile = profile || { 
        name: session.user.email.split('@')[0], 
        role: 'user', 
        id: session.user.id 
    };
    
    console.log('Profile loaded:', window.subjectData.profile);
    
    // Update UI with user info
    updateSubjectUserUI();
    
    await loadSubject(subjectId);
    setupSubjectEvents();
    setupSubjectSearch();
    setupSubjectKeyboardShortcuts();
}

function updateSubjectUserUI() {
    const profile = window.subjectData.profile;
    if (!profile) return;
    
    const name = profile.name || profile.email?.split('@')[0] || 'Usuario';
    const role = profile.role === 'admin' ? 'Administrador' : 'Estudiante';
    const initial = name.charAt(0).toUpperCase();
    
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserRole = document.getElementById('sidebar-user-role');
    const topbarUserName = document.getElementById('topbar-user-name');
    const topbarUserRole = document.getElementById('topbar-user-role');
    
    if (sidebarUserName) sidebarUserName.innerText = name;
    if (sidebarUserRole) sidebarUserRole.innerText = role;
    if (topbarUserName) topbarUserName.innerText = name;
    if (topbarUserRole) topbarUserRole.innerText = role === 'Administrador' ? 'Admin' : 'Usuario';
    
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
        const addTopicBtn = document.getElementById('add-topic-btn');
        if (addTopicBtn) addTopicBtn.style.display = 'inline-flex';
    }
}

async function loadSubject(subjectId) {
    try {
        console.log('Loading subject:', subjectId);
        
        const heroContainer = document.getElementById('subject-hero');
        const topicsContainer = document.getElementById('topics-list');
        
        if (heroContainer) heroContainer.innerHTML = '<div class="skeleton" style="height: 160px;"></div>';
        if (topicsContainer) topicsContainer.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
        
        window.subjectData.current = await window.EducaSupabase.Subjects.getById(subjectId);
        
        if (!window.subjectData.current) {
            console.log('Subject not found');
            window.location.href = 'dashboard.html';
            return;
        }
        
        console.log('Subject loaded:', window.subjectData.current.name);
        window.subjectData.topics = window.subjectData.current.topics || [];
        
        for (let i = 0; i < window.subjectData.topics.length; i++) {
            const topic = window.subjectData.topics[i];
            window.subjectData.comments[topic.id] = await window.EducaSupabase.Comments.getByTopic(topic.id);
        }
        
        if (typeof window.renderSubject === 'function') {
            window.renderSubject();
        } else {
            console.error('renderSubject is not defined');
        }
        
        document.title = window.subjectData.current.name + ' - Web 4 ESO';
    } catch (error) {
        console.error('Error loading subject:', error);
        if (window.Utils) window.Utils.showNotification('Error al cargar la asignatura', 'error');
    }
}

function setupSubjectSearch() {
    const searchInput = document.getElementById('topbar-search-input');
    if (!searchInput) return;
    
    const performSearch = window.Utils.debounce((term) => {
        if (!term.trim()) {
            if (typeof window.renderTopicsList === 'function') {
                window.renderTopicsList();
            }
            return;
        }
        
        const lowerTerm = term.toLowerCase();
        const filteredTopics = window.subjectData.topics.filter(topic => 
            topic.title.toLowerCase().includes(lowerTerm) ||
            (topic.description && topic.description.toLowerCase().includes(lowerTerm))
        );
        
        // Temporary override for filtering
        const originalTopics = window.subjectData.topics;
        window.subjectData.topics = filteredTopics;
        if (typeof window.renderTopicsList === 'function') {
            window.renderTopicsList();
        }
        window.subjectData.topics = originalTopics;
    }, 300);
    
    searchInput.addEventListener('input', (e) => performSearch(e.target.value));
}

function setupSubjectKeyboardShortcuts() {
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

async function refreshSubject() {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('id');
    if (subjectId) {
        await loadSubject(subjectId);
    }
}

window.refreshSubject = refreshSubject;
window.subjectData = subjectData;
window.initSubject = initSubject;
window.loadSubject = loadSubject;