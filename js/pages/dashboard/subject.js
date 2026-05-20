/* ============================================
   DASHBOARD - CRUD de Asignaturas
   ============================================ */

var editingSubjectId = null;

function showSubjectModal(subject) {
    subject = subject || null;
    editingSubjectId = subject ? subject.id : null;
    var isEdit = !!subject;
    
    var icons = ['bookOpen', 'calculator', 'flaskConical', 'globe', 'music', 'dumbbell', 'heart', 'star', 'code', 'palette'];
    var colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#d946ef'];
    
    var iconsHtml = '';
    for (var i = 0; i < icons.length; i++) {
        var ico = icons[i];
        iconsHtml += '<button type="button" class="icon-option" data-icon="' + ico + '" style="padding:8px; border:2px solid var(--border-subtle); border-radius:8px; margin:4px; background:var(--bg-tertiary); cursor:pointer;">' + window.UIModule.getIcon(ico, 24) + '</button>';
    }
    
    var colorsHtml = '';
    for (var i = 0; i < colors.length; i++) {
        var col = colors[i];
        colorsHtml += '<button type="button" class="color-option" data-color="' + col + '" style="width:32px; height:32px; border-radius:8px; background:' + col + '; border:2px solid transparent; margin:4px; cursor:pointer;"></button>';
    }
    
    var subjectNameValue = isEdit ? window.Utils.escapeHtml(subject.name) : '';
    var subjectDescValue = isEdit ? window.Utils.escapeHtml(subject.description || '') : '';
    
    window.UIModule.showModal({
        title: isEdit ? '✏️ Editar Asignatura' : '📚 Nueva Asignatura',
        content: `
            <form id="subject-form" class="form-grid">
                <div class="input-group">
                    <label class="input-label">Nombre *</label>
                    <input type="text" class="input" id="subject-name" value="${subjectNameValue}" placeholder="Ej: Matemáticas" required>
                </div>
                <div class="input-group">
                    <label class="input-label">Descripción</label>
                    <textarea class="input" id="subject-desc" rows="2" placeholder="Describe brevemente la asignatura...">${subjectDescValue}</textarea>
                </div>
                <div class="input-group">
                    <label class="input-label">Icono</label>
                    <div class="icon-selector" id="icon-selector" style="display: flex; flex-wrap: wrap; gap: 8px;">${iconsHtml}</div>
                </div>
                <div class="input-group">
                    <label class="input-label">Color</label>
                    <div class="color-selector" id="color-selector" style="display: flex; flex-wrap: wrap; gap: 8px;">${colorsHtml}</div>
                </div>
            </form>
        `,
        footer: '<button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button><button class="btn btn-primary" id="save-subject-btn">' + (isEdit ? 'Guardar Cambios' : 'Crear Asignatura') + '</button>'
    });
    
    setTimeout(function() {
        if (isEdit && subject) {
            if (subject.icon) {
                var iconOpt = document.querySelector('#icon-selector .icon-option[data-icon="' + subject.icon + '"]');
                if (iconOpt) {
                    var allIcons = document.querySelectorAll('#icon-selector .icon-option');
                    for (var i = 0; i < allIcons.length; i++) {
                        allIcons[i].style.borderColor = 'var(--border-subtle)';
                    }
                    iconOpt.style.borderColor = 'var(--accent-primary)';
                }
            }
            if (subject.color) {
                var colorOpt = document.querySelector('#color-selector .color-option[data-color="' + subject.color + '"]');
                if (colorOpt) {
                    var allColors = document.querySelectorAll('#color-selector .color-option');
                    for (var i = 0; i < allColors.length; i++) {
                        allColors[i].style.border = '2px solid transparent';
                        allColors[i].style.transform = 'scale(1)';
                    }
                    colorOpt.style.border = '2px solid white';
                    colorOpt.style.transform = 'scale(1.1)';
                }
            }
        } else {
            var firstIcon = document.querySelector('#icon-selector .icon-option');
            if (firstIcon) firstIcon.style.borderColor = 'var(--accent-primary)';
            var firstColor = document.querySelector('#color-selector .color-option');
            if (firstColor) firstColor.style.border = '2px solid white';
        }
        
        var iconSelector = document.getElementById('icon-selector');
        if (iconSelector) {
            var iconOptions = iconSelector.querySelectorAll('.icon-option');
            for (var i = 0; i < iconOptions.length; i++) {
                var opt = iconOptions[i];
                opt.addEventListener('click', function(e) {
                    var clicked = e.currentTarget;
                    var parent = clicked.parentNode;
                    var all = parent.querySelectorAll('.icon-option');
                    for (var j = 0; j < all.length; j++) {
                        all[j].style.borderColor = 'var(--border-subtle)';
                    }
                    clicked.style.borderColor = 'var(--accent-primary)';
                });
            }
        }
        
        var colorSelector = document.getElementById('color-selector');
        if (colorSelector) {
            var colorOptions = colorSelector.querySelectorAll('.color-option');
            for (var i = 0; i < colorOptions.length; i++) {
                var opt = colorOptions[i];
                opt.addEventListener('click', function(e) {
                    var clicked = e.currentTarget;
                    var parent = clicked.parentNode;
                    var all = parent.querySelectorAll('.color-option');
                    for (var j = 0; j < all.length; j++) {
                        all[j].style.border = '2px solid transparent';
                        all[j].style.transform = 'scale(1)';
                    }
                    clicked.style.border = '2px solid white';
                    clicked.style.transform = 'scale(1.1)';
                });
            }
        }
        
        var saveBtn = document.getElementById('save-subject-btn');
        if (saveBtn) {
            saveBtn.onclick = function() {
                if (editingSubjectId) {
                    updateSubject(editingSubjectId);
                } else {
                    createSubject();
                }
            };
        }
    }, 100);
}

async function createSubject() {
    var nameInput = document.getElementById('subject-name');
    if (!nameInput) {
        window.Utils.showNotification('Error: formulario no encontrado', 'error');
        return;
    }
    
    var name = nameInput.value.trim();
    if (!name) {
        window.Utils.showNotification('⚠️ Ingresa un nombre para la asignatura', 'error');
        return;
    }
    
    var selectedIcon = document.querySelector('#icon-selector .icon-option[style*="border-color: var(--accent-primary)"]');
    var icon = selectedIcon ? selectedIcon.getAttribute('data-icon') : 'bookOpen';
    
    var selectedColor = document.querySelector('#color-selector .color-option[style*="border: 2px solid white"]');
    var color = selectedColor ? selectedColor.getAttribute('data-color') : '#6366f1';
    
    var description = document.getElementById('subject-desc') ? document.getElementById('subject-desc').value.trim() : '';
    
    try {
        var newSubject = await window.EducaSupabase.Subjects.create({ name: name, description: description, icon: icon, color: color });
        window.UIModule.closeModal();
        window.Utils.showNotification('✅ Asignatura "' + name + '" creada correctamente');
        if (typeof window.refreshDashboard === 'function') {
            await window.refreshDashboard();
        }
    } catch (error) {
        console.error('Error al crear:', error);
        window.Utils.showNotification('❌ Error al crear: ' + (error.message || 'Error desconocido'), 'error');
    }
}

async function updateSubject(id) {
    var nameInput = document.getElementById('subject-name');
    if (!nameInput) {
        window.Utils.showNotification('Error: formulario no encontrado', 'error');
        return;
    }
    
    var name = nameInput.value.trim();
    if (!name) {
        window.Utils.showNotification('⚠️ Ingresa un nombre para la asignatura', 'error');
        return;
    }
    
    var selectedIcon = document.querySelector('#icon-selector .icon-option[style*="border-color: var(--accent-primary)"]');
    var icon = selectedIcon ? selectedIcon.getAttribute('data-icon') : 'bookOpen';
    
    var selectedColor = document.querySelector('#color-selector .color-option[style*="border: 2px solid white"]');
    var color = selectedColor ? selectedColor.getAttribute('data-color') : '#6366f1';
    
    var description = document.getElementById('subject-desc') ? document.getElementById('subject-desc').value.trim() : '';
    
    try {
        await window.EducaSupabase.Subjects.update(id, { name: name, description: description, icon: icon, color: color });
        window.UIModule.closeModal();
        window.Utils.showNotification('✅ Asignatura "' + name + '" actualizada correctamente');
        if (typeof window.refreshDashboard === 'function') {
            await window.refreshDashboard();
        }
    } catch (error) {
        console.error('Error al actualizar:', error);
        window.Utils.showNotification('❌ Error al actualizar: ' + (error.message || error.error_description || JSON.stringify(error) || 'Error desconocido'), 'error');
    }
}

window.deleteSubject = function(id) {
    var subject = null;
    if (window.dashboardState && window.dashboardState.subjects) {
        for (var i = 0; i < window.dashboardState.subjects.length; i++) {
            if (window.dashboardState.subjects[i].id === id) {
                subject = window.dashboardState.subjects[i];
                break;
            }
        }
    }
    var subjectName = subject ? subject.name : 'esta asignatura';
    
    window.UIModule.showConfirm(
        '⚠️ ¿Eliminar la asignatura "' + subjectName + '"?\n\nSe eliminarán TODOS sus temas. Esta acción no se puede deshacer.',
        async function() {
            try {
                await window.EducaSupabase.Subjects.delete(id);
                window.Utils.showNotification('🗑️ Asignatura "' + subjectName + '" eliminada correctamente');
                if (typeof window.refreshDashboard === 'function') {
                    await window.refreshDashboard();
                }
            } catch (error) {
                console.error('Error al eliminar:', error);
                window.Utils.showNotification('❌ Error al eliminar: ' + (error.message || 'Error desconocido'), 'error');
            }
        }
    );
};

window.showSubjectCardMenu = function(event, subjectId) {
    event.stopPropagation();
    
    var existingMenu = document.querySelector('.subject-context-menu');
    if (existingMenu) existingMenu.remove();
    
    var subject = null;
    if (window.dashboardState && window.dashboardState.subjects) {
        for (var i = 0; i < window.dashboardState.subjects.length; i++) {
            if (window.dashboardState.subjects[i].id === subjectId) {
                subject = window.dashboardState.subjects[i];
                break;
            }
        }
    }
    if (!subject) return;
    
    var menu = document.createElement('div');
    menu.className = 'dropdown-menu active subject-context-menu';
    menu.style.cssText = 'position: fixed; z-index: 1000; min-width: 100px; max-width: 120px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); opacity: 1; visibility: visible;';
    menu.innerHTML = `
        <div class="dropdown-item" data-action="edit" style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; cursor: pointer; border-radius: 6px; font-size: 13px; margin: 2px 0;">
            <span style="font-size: 14px;">✏️</span> Editar
        </div>
        <div class="dropdown-item" data-action="delete" style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; cursor: pointer; border-radius: 6px; color: var(--error); font-size: 13px; margin: 2px 0;">
            <span style="font-size: 14px;">🗑️</span> Eliminar
        </div>
    `;
    document.body.appendChild(menu);
    
    var rect = event.target.closest('.subject-card-menu') ? event.target.closest('.subject-card-menu').getBoundingClientRect() : event.target.getBoundingClientRect();
    var top = rect.bottom + 6;
    var left = rect.left - 100;
    
    if (top + menu.offsetHeight > window.innerHeight) {
        top = rect.top - menu.offsetHeight - 6;
    }
    if (left < 10) left = 10;
    if (left + menu.offsetWidth > window.innerWidth - 10) {
        left = window.innerWidth - menu.offsetWidth - 10;
    }
    
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
    
    var editItem = menu.querySelector('[data-action="edit"]');
    var deleteItem = menu.querySelector('[data-action="delete"]');
    
    editItem.addEventListener('click', function(e) {
        e.stopPropagation();
        menu.remove();
        showSubjectModal(subject);
    });
    
    deleteItem.addEventListener('click', function(e) {
        e.stopPropagation();
        menu.remove();
        window.deleteSubject(subjectId);
    });
    
    editItem.addEventListener('mouseenter', function() { this.style.background = 'var(--bg-hover)'; });
    editItem.addEventListener('mouseleave', function() { this.style.background = ''; });
    deleteItem.addEventListener('mouseenter', function() { this.style.background = 'rgba(239, 68, 68, 0.15)'; });
    deleteItem.addEventListener('mouseleave', function() { this.style.background = ''; });
    
    function closeMenu(e) {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }
    setTimeout(function() { document.addEventListener('click', closeMenu); }, 10);
};

window.showSubjectModal = showSubjectModal;