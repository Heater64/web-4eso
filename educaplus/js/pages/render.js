/* ============================================
   EDUCA+ - Renderizado Unificado
   Dashboard y Subject page
   ============================================ */

// ============================================
// DASHBOARD RENDER FUNCTIONS
// ============================================

function renderStats() {
    var container = document.getElementById('stats-grid');
    if (!container) return;
    
    var totalTopics = 0;
    var totalSubjectFiles = 0;
    
    for (var i = 0; i < window.dashboardState.subjects.length; i++) {
        var subject = window.dashboardState.subjects[i];
        if (subject.topics) {
            totalTopics += subject.topics.length;
            for (var j = 0; j < subject.topics.length; j++) {
                var topic = subject.topics[j];
                if (topic.files) {
                    totalSubjectFiles += topic.files.length;
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
            <div class="stat-card-value">${window.dashboardState.allFiles.length}</div>
            <div class="stat-card-label">Archivos</div>
        </div>
        <div class="stat-card">
            <div class="stat-card-header">
                <div class="stat-card-icon warning">${window.UIModule.getIcon('clock', 24)}</div>
            </div>
            <div class="stat-card-value">${window.dashboardState.recentFiles.length}</div>
            <div class="stat-card-label">Recientes</div>
        </div>
    `;
}

function renderSubjects() {
    var container = document.getElementById('subjects-grid');
    if (!container) return;
    
    var isAdmin = window.dashboardState.profile && window.dashboardState.profile.role === 'admin';
    
    if (window.dashboardState.subjects.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({ 
            icon: 'bookOpen', 
            title: 'Sin asignaturas', 
            description: 'No hay asignaturas creadas aún.',
            actionText: isAdmin ? 'Crear asignatura' : null,
            actionOnClick: 'window.showSubjectModal && window.showSubjectModal()'
        });
        return;
    }
    
    var subjectsToShow = window.dashboardState.subjects.slice(0, 3);
    var subjectsHtml = '';
    
    for (var i = 0; i < subjectsToShow.length; i++) {
        var s = subjectsToShow[i];
        var topicCount = s.topics ? s.topics.length : 0;
        var fileCount = 0;
        
        if (s.topics) {
            for (var j = 0; j < s.topics.length; j++) {
                if (s.topics[j].files) {
                    fileCount += s.topics[j].files.length;
                }
            }
        }
        
        subjectsHtml += `
            <div class="subject-card" style="cursor: pointer; position: relative;">
                <div class="subject-card-content" onclick="location.href='subject.html?id=${s.id}'">
                    <div class="subject-card-header">
                        <div class="subject-card-icon" style="background:${s.color || '#6366f1'}20; color:${s.color || '#6366f1'}">
                            ${window.UIModule.getIcon(s.icon || 'bookOpen', 28)}
                        </div>
                        ${isAdmin ? `
                            <div class="subject-card-menu">
                                <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window.showSubjectCardMenu && window.showSubjectCardMenu(event, '${s.id}')" style="padding: 8px; border-radius: 8px; cursor: pointer;" title="Opciones">
                                    ${window.UIModule.getIcon('moreVertical', 20)}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <h3 class="subject-card-title">${window.Utils.escapeHtml(s.name)}</h3>
                    ${s.description ? '<p class="subject-card-description" style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-2);">' + window.Utils.escapeHtml(s.description) + '</p>' : ''}
                    <div class="subject-card-meta" style="margin-top: var(--space-3);">
                        <span class="subject-card-meta-item">${window.UIModule.getIcon('folder', 16)} ${topicCount} ${topicCount === 1 ? 'tema' : 'temas'}</span>
                        <span class="subject-card-meta-item">${window.UIModule.getIcon('fileText', 16)} ${fileCount} ${fileCount === 1 ? 'archivo' : 'archivos'}</span>
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = subjectsHtml;
}

function renderRecentFiles() {
    var container = document.getElementById('files-list-content');
    if (!container) return;
    
    if (window.dashboardState.recentFiles.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({ 
            icon: 'fileText', 
            title: 'Sin archivos', 
            description: 'No hay archivos recientes' 
        });
        return;
    }
    
    var filesHtml = '';
    for (var i = 0; i < window.dashboardState.recentFiles.length; i++) {
        var f = window.dashboardState.recentFiles[i];
        filesHtml += `
            <div class="file-row">
                <div class="file-row-icon ${f.file_type}">
                    ${window.UIModule.getIcon(f.file_type === 'pdf' ? 'fileText' : 'file', 20)}
                </div>
                <div class="file-row-info">
                    <div class="file-row-name">${window.Utils.escapeHtml(f.file_name)}</div>
                    <div class="file-row-meta">${window.Utils.formatDate(f.created_at)}</div>
                </div>
                <div class="file-row-actions">
                    <a href="${f.file_url}" target="_blank" class="file-action-btn" title="Ver archivo">${window.UIModule.getIcon('externalLink', 16)}</a>
                    <button class="file-action-btn" onclick="window.downloadFile && window.downloadFile('${f.file_url}', '${window.Utils.escapeHtml(f.file_name)}')" title="Descargar">${window.UIModule.getIcon('download', 16)}</button>
                </div>
            </div>
        `;
    }
    container.innerHTML = filesHtml;
}

function renderRecommendations() {
    var container = document.getElementById('recommendations-list');
    if (!container) return;
    
    if (window.dashboardState.recommendations.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({ 
            icon: 'lightbulb', 
            title: 'Sin recomendaciones', 
            description: 'No hay recomendaciones disponibles' 
        });
        return;
    }
    
    var recsHtml = '';
    for (var i = 0; i < window.dashboardState.recommendations.length; i++) {
        var r = window.dashboardState.recommendations[i];
        recsHtml += `
            <div class="recommendation-item" ${r.url ? 'onclick="window.open(\'' + r.url + '\', \'_blank\')" style="cursor: pointer;"' : ''}>
                <div class="recommendation-icon">${window.UIModule.getIcon('lightbulb', 16)}</div>
                <div class="recommendation-title">${window.Utils.escapeHtml(r.title)}</div>
                ${r.description ? '<div class="recommendation-description">' + window.Utils.escapeHtml(r.description) + '</div>' : ''}
            </div>
        `;
    }
    container.innerHTML = recsHtml;
}

function downloadFile(url, filename) {
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
    a.remove();
}

// ============================================
// SUBJECT PAGE RENDER FUNCTIONS
// ============================================

function renderSubject() {
    var container = document.getElementById('subject-hero');
    if (!container) return;
    
    var isAdmin = window.subjectData && window.subjectData.profile && window.subjectData.profile.role === 'admin';
    var currentSubject = window.subjectData ? window.subjectData.current : null;
    if (!currentSubject) return;
    
    var color = currentSubject.color || '#6366f1';
    
    container.innerHTML = `
        <div class="subject-hero-content">
            <div class="subject-hero-icon" style="background:linear-gradient(135deg,${color},${color}cc)">
                ${window.UIModule.getIcon(currentSubject.icon || 'bookOpen', 40)}
            </div>
            <div class="subject-hero-info">
                <h1>${window.Utils.escapeHtml(currentSubject.name)}</h1>
                ${currentSubject.description ? '<p>' + window.Utils.escapeHtml(currentSubject.description) + '</p>' : ''}
                <div class="subject-hero-stats">
                    <div class="subject-hero-stat">
                        ${window.UIModule.getIcon('folder', 18)} ${window.subjectData.topics ? window.subjectData.topics.length : 0} temas
                    </div>
                    <div class="subject-hero-stat">
                        ${window.UIModule.getIcon('fileText', 18)} ${countTotalFiles(window.subjectData.topics)} archivos
                    </div>
                </div>
            </div>
            ${isAdmin ? `
                <div class="subject-hero-actions">
                    <button class="btn btn-primary" id="add-topic-btn-header">
                        ${window.UIModule.getIcon('plus', 20)} Nuevo tema
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    if (isAdmin) {
        var addTopicBtn = document.getElementById('add-topic-btn-header');
        if (addTopicBtn && window.TopicsModule && currentSubject) {
            addTopicBtn.onclick = function() {
                window.TopicsModule.init(currentSubject.id);
                window.TopicsModule.showCreateModal();
            };
        }
    }
    
    renderTopicsList();
    
    var breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = window.UIModule.createBreadcrumb([
            { label: 'Dashboard', href: 'dashboard.html' },
            { label: currentSubject.name }
        ]);
    }
    
    if (isAdmin && window.TopicsModule) {
        setTimeout(function() {
            if (window.TopicsModule.initDragAndDrop) {
                window.TopicsModule.initDragAndDrop();
            }
        }, 100);
    }
}

function countTotalFiles(topics) {
    if (!topics) return 0;
    var count = 0;
    for (var i = 0; i < topics.length; i++) {
        if (topics[i].files) {
            count += topics[i].files.length;
        }
    }
    return count;
}

function renderTopicsList() {
    var container = document.getElementById('topics-list');
    if (!container) return;
    
    var isAdmin = window.subjectData && window.subjectData.profile && window.subjectData.profile.role === 'admin';
    var userId = window.subjectData && window.subjectData.profile ? window.subjectData.profile.id : null;
    var topics = window.subjectData && window.subjectData.topics ? window.subjectData.topics : [];
    var comments = window.subjectData && window.subjectData.comments ? window.subjectData.comments : {};
    
    if (!topics || topics.length === 0) {
        container.innerHTML = window.UIModule.createEmptyState({
            icon: 'folderOpen',
            title: 'Sin temas',
            description: 'Esta asignatura aún no tiene temas. Crea el primero usando el botón "Nuevo tema".',
            actionText: isAdmin ? 'Crear primer tema' : null,
            actionOnClick: 'window.TopicsModule && window.TopicsModule.showCreateModal && window.TopicsModule.showCreateModal()'
        });
        return;
    }
    
    // Separar temas pineados y no pineados
    var pinnedTopics = [];
    var unpinnedTopics = [];
    for (var i = 0; i < topics.length; i++) {
        if (topics[i].is_pinned === true) {
            pinnedTopics.push(topics[i]);
        } else {
            unpinnedTopics.push(topics[i]);
        }
    }
    var allTopicsSorted = pinnedTopics.concat(unpinnedTopics);
    
    var topicsHtml = '';
    for (var i = 0; i < allTopicsSorted.length; i++) {
        var topic = allTopicsSorted[i];
        var topicComments = comments[topic.id] || [];
        var files = topic.files || [];
        
        topicsHtml += `
            <div class="topic-item" data-topic-id="${topic.id}" ${isAdmin ? 'draggable="true"' : ''}>
                <div class="topic-header" onclick="window.toggleTopic && window.toggleTopic('${topic.id}')">
                    <div class="topic-expand-icon">${window.UIModule.getIcon('chevronRight', 16)}</div>
                    <div class="topic-info">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${topic.is_pinned ? '<span style="font-size: 14px;">📍</span>' : ''}
                            <h3 style="margin: 0;">${window.Utils.escapeHtml(topic.title)}</h3>
                        </div>
                        <div class="topic-meta">
                            <span>${window.UIModule.getIcon('fileText', 14)} ${files.length} archivos</span>
                            <span>${window.UIModule.getIcon('messageCircle', 14)} ${topicComments.length} comentarios</span>
                        </div>
                    </div>
                    ${isAdmin ? `
                        <div class="topic-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-ghost btn-icon" onclick="window.FilesModule && window.FilesModule.showUploadModal && window.FilesModule.showUploadModal('${topic.id}')" title="Subir archivo">
                                ${window.UIModule.getIcon('upload', 18)}
                            </button>
                            <button class="btn btn-ghost btn-icon" onclick="window.TopicsModule && window.TopicsModule.showEditModal && window.TopicsModule.showEditModal('${topic.id}', '${window.Utils.escapeHtml(topic.title)}', '${window.Utils.escapeHtml(topic.description || '')}')" title="Editar tema">
                                ${window.UIModule.getIcon('edit', 18)}
                            </button>
                            <button class="btn btn-ghost btn-icon" onclick="window.TopicsModule && window.TopicsModule.togglePin && window.TopicsModule.togglePin('${topic.id}', ${topic.is_pinned || false})" title="${topic.is_pinned ? 'Desanclar' : 'Anclar al inicio'}" style="color: ${topic.is_pinned ? 'var(--warning)' : 'var(--text-secondary)'}">
                                📌
                            </button>
                            <button class="btn btn-ghost btn-icon" onclick="window.TopicsModule && window.TopicsModule.delete && window.TopicsModule.delete('${topic.id}', '${window.Utils.escapeHtml(topic.title)}')" title="Eliminar tema" style="color:var(--error)">
                                ${window.UIModule.getIcon('trash', 18)}
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="topic-content">
                    ${renderTopicFiles(files, topic.id, isAdmin)}
                    ${renderTopicComments(topicComments, topic.id, userId, isAdmin)}
                </div>
            </div>
        `;
    }
    container.innerHTML = topicsHtml;
    
    // Instrucción para drag & drop (solo admin)
    if (isAdmin && topics.length > 1 && !document.querySelector('.drag-hint')) {
        var dragHint = document.createElement('div');
        dragHint.className = 'drag-hint';
        dragHint.style.cssText = 'text-align: center; padding: var(--space-3); margin-top: var(--space-4); font-size: var(--text-xs); color: var(--text-muted); border-top: 1px solid var(--border-subtle);';
        dragHint.innerHTML = '💡 Sugerencia: Arrastra los temas para reordenarlos';
        container.parentNode.insertBefore(dragHint, container.nextSibling);
    }
}

function renderTopicFiles(files, topicId, isAdmin) {
    if (!files || files.length === 0) {
        return '<p style="color:var(--text-secondary); margin-bottom:var(--space-3)">📁 No hay archivos en este tema</p>';
    }
    
    var filesHtml = '<div class="topic-files"><h4>📁 Archivos</h4>';
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        filesHtml += `
            <div class="topic-file">
                <div class="topic-file-icon">
                    ${window.UIModule.getIcon(f.file_type === 'pdf' ? 'fileText' : 'file', 20)}
                </div>
                <div class="topic-file-info">
                    <div class="topic-file-name">${window.Utils.escapeHtml(f.file_name)}</div>
                    <div class="topic-file-size">${window.Utils.formatFileSize(f.file_size || 0)}</div>
                </div>
                <div class="topic-file-actions">
                    <a href="${f.file_url}" target="_blank" title="Ver archivo">${window.UIModule.getIcon('externalLink', 16)}</a>
                    <button onclick="window.FilesModule && window.FilesModule.download && window.FilesModule.download('${f.file_url}', '${window.Utils.escapeHtml(f.file_name)}')" title="Descargar">
                        ${window.UIModule.getIcon('download', 16)}
                    </button>
                    ${isAdmin ? `
                        <button onclick="window.FilesModule && window.FilesModule.showEditModal && window.FilesModule.showEditModal('${f.id}', '${window.Utils.escapeHtml(f.file_name)}', '${topicId}')" title="Editar nombre">
                            ${window.UIModule.getIcon('edit', 16)}
                        </button>
                        <button onclick="window.FilesModule && window.FilesModule.delete && window.FilesModule.delete('${f.id}', '${f.file_url}')" title="Eliminar archivo" style="color:var(--error)">
                            ${window.UIModule.getIcon('trash', 16)}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    filesHtml += '</div>';
    return filesHtml;
}

function renderTopicComments(comments, topicId, userId, isAdmin) {
    var commentsHtml = `
        <div style="margin-top: var(--space-3);">
            <h4>💬 Comentarios (${comments.length})</h4>
            <div id="comments-list-${topicId}" style="max-height:300px; overflow-y:auto; margin-bottom:12px">
    `;
    
    for (var i = 0; i < comments.length; i++) {
        var c = comments[i];
        var profileName = c.profiles ? c.profiles.name : 'Usuario';
        var initial = profileName.charAt(0).toUpperCase();
        commentsHtml += `
            <div style="display:flex; gap:12px; padding:12px; background:var(--bg-tertiary); border-radius:12px; margin-bottom:8px">
                <div style="width:32px; height:32px; background:var(--accent-primary-light); border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    ${initial}
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <strong>${window.Utils.escapeHtml(profileName)}</strong>
                        <span style="font-size:12px; color:var(--text-muted)">${window.Utils.formatDate(c.created_at)}</span>
                    </div>
                    <p style="margin-top: 4px; word-wrap: break-word;">${window.Utils.escapeHtml(c.content)}</p>
                </div>
                ${(c.user_id === userId || isAdmin) ? `
                    <button onclick="window.deleteComment && window.deleteComment('${c.id}', '${topicId}')" style="color:var(--error); flex-shrink:0;" title="Eliminar comentario">
                        ${window.UIModule.getIcon('trash', 14)}
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    commentsHtml += `
            </div>
            <div style="display:flex; gap:8px; margin-top: 12px;">
                <textarea id="comment-input-${topicId}" class="input" rows="2" placeholder="Escribe un comentario..."></textarea>
                <button class="btn btn-primary" onclick="window.addComment && window.addComment('${topicId}')" style="align-self:flex-end;">
                    ${window.UIModule.getIcon('send', 16)} Enviar
                </button>
            </div>
        </div>
    `;
    
    return commentsHtml;
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================

// Dashboard functions
window.renderStats = renderStats;
window.renderSubjects = renderSubjects;
window.renderRecentFiles = renderRecentFiles;
window.renderRecommendations = renderRecommendations;
window.downloadFile = downloadFile;

// Subject functions
window.renderSubject = renderSubject;
window.renderTopicsList = renderTopicsList;