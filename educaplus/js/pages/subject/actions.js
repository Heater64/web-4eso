/* ============================================
   SUBJECT - Acciones (comentarios)
   ============================================ */

function toggleTopic(id) {
    var element = document.querySelector('.topic-item[data-topic-id="' + id + '"]');
    if (element) element.classList.toggle('expanded');
}

async function addComment(topicId) {
    var input = document.getElementById('comment-input-' + topicId);
    if (!input) return;
    
    var content = input.value.trim();
    if (!content) {
        window.Utils.showNotification('✏️ Escribe un comentario antes de enviar', 'error');
        return;
    }
    
    try {
        await window.EducaSupabase.Comments.create({
            topic_id: topicId,
            user_id: window.subjectData.profile.id,
            content: content
        });
        
        window.subjectData.comments[topicId] = await window.EducaSupabase.Comments.getByTopic(topicId);
        renderTopicsList();
        window.Utils.showNotification('💬 Comentario agregado');
        
        input.value = '';
    } catch (error) {
        console.error(error);
        window.Utils.showNotification('❌ Error al agregar comentario', 'error');
    }
}

async function deleteComment(commentId, topicId) {
    window.UIModule.showConfirm('¿Eliminar este comentario?', async function() {
        try {
            await window.EducaSupabase.Comments.delete(commentId);
            window.subjectData.comments[topicId] = await window.EducaSupabase.Comments.getByTopic(topicId);
            renderTopicsList();
            window.Utils.showNotification('🗑️ Comentario eliminado');
        } catch (error) {
            console.error(error);
            window.Utils.showNotification('❌ Error al eliminar comentario', 'error');
        }
    });
}

function setupSubjectEvents() {
    var client = window.EducaSupabase.getClient();
    
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            client.auth.signOut().then(function() {
                window.location.href = 'login.html';
            });
        };
    }
    
    var menuBtn = document.getElementById('menu-btn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    
    if (menuBtn && sidebar && overlay) {
        menuBtn.onclick = function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        };
        
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    var expandAllBtn = document.getElementById('expand-all-btn');
    var collapseAllBtn = document.getElementById('collapse-all-btn');
    
    if (expandAllBtn) {
        expandAllBtn.onclick = function() {
            var topics = document.querySelectorAll('.topic-item');
            for (var i = 0; i < topics.length; i++) {
                topics[i].classList.add('expanded');
            }
        };
    }
    
    if (collapseAllBtn) {
        collapseAllBtn.onclick = function() {
            var topics = document.querySelectorAll('.topic-item');
            for (var i = 0; i < topics.length; i++) {
                topics[i].classList.remove('expanded');
            }
        };
    }
    
    var dashboardLink = document.getElementById('dashboard-nav-link');
    var subjectsLink = document.getElementById('subjects-nav-link');
    var settingsLink = document.getElementById('settings-nav-link');
    
    if (dashboardLink) {
        dashboardLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }
    
    if (subjectsLink) {
        subjectsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html?view=subjects';
        });
    }
    
    if (settingsLink) {
        settingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'dashboard.html?view=settings';
        });
    }
    
    var addTopicBtn = document.getElementById('add-topic-btn');
    if (addTopicBtn && window.TopicsModule && window.subjectData.current) {
        addTopicBtn.onclick = function() {
            window.TopicsModule.init(window.subjectData.current.id);
            window.TopicsModule.showCreateModal();
        };
    }
}

function closeMobileSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    
    if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }
}

window.toggleTopic = toggleTopic;
window.addComment = addComment;
window.deleteComment = deleteComment;
window.setupSubjectEvents = setupSubjectEvents;
window.closeMobileSidebar = closeMobileSidebar;