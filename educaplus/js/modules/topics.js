/* ============================================
   EDUCA+ - Topics Module
   CRUD completo + Pin (SIN Drag & Drop)
   ============================================ */

const TopicsModule = {
    currentSubjectId: null,
    
    init: function(subjectId) {
        this.currentSubjectId = subjectId;
    },
    
    showCreateModal: function() {
        window.UIModule.showModal({
            title: '📚 Nuevo Tema',
            content: `
                <form id="create-topic-form" class="form-grid">
                    <div class="input-group">
                        <label class="input-label">Título *</label>
                        <input type="text" class="input" id="topic-title" placeholder="Ej: Introducción a la materia" required>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Descripción</label>
                        <textarea class="input" id="topic-description" rows="3" placeholder="Describe el contenido del tema..."></textarea>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="confirm-create-topic">Crear Tema</button>
            `
        });
        
        setTimeout(function() {
            var confirmBtn = document.getElementById('confirm-create-topic');
            if (confirmBtn) {
                confirmBtn.onclick = function() { TopicsModule.create(); };
            }
        }, 100);
    },
    
    create: async function() {
        var titleInput = document.getElementById('topic-title');
        if (!titleInput) {
            window.Utils.showNotification('Error: formulario no encontrado', 'error');
            return;
        }
        
        var title = titleInput.value.trim();
        if (!title) {
            window.Utils.showNotification('⚠️ Ingresa un título para el tema', 'error');
            return;
        }
        
        var descriptionInput = document.getElementById('topic-description');
        var description = descriptionInput ? descriptionInput.value.trim() : '';
        
        try {
            await window.EducaSupabase.Topics.create({
                subject_id: this.currentSubjectId,
                title: title,
                description: description || null,
                order_index: 0
            });
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Tema creado correctamente');
            
            if (typeof window.refreshSubject === 'function') {
                await window.refreshSubject();
            }
        } catch (error) {
            console.error('Error al crear tema:', error);
            window.Utils.showNotification('❌ Error al crear tema', 'error');
        }
    },
    
    showEditModal: function(topicId, currentTitle, currentDescription) {
        var escapedTitle = window.Utils.escapeHtml(currentTitle);
        var escapedDescription = window.Utils.escapeHtml(currentDescription || '');
        
        window.UIModule.showModal({
            title: '✏️ Editar Tema',
            content: `
                <form id="edit-topic-form" class="form-grid">
                    <div class="input-group">
                        <label class="input-label">Título *</label>
                        <input type="text" class="input" id="edit-topic-title" value="${escapedTitle}" required>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Descripción</label>
                        <textarea class="input" id="edit-topic-description" rows="3">${escapedDescription}</textarea>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="confirm-update-topic">Guardar Cambios</button>
            `
        });
        
        setTimeout(function() {
            var confirmBtn = document.getElementById('confirm-update-topic');
            if (confirmBtn) {
                confirmBtn.onclick = function() { TopicsModule.update(topicId); };
            }
        }, 100);
    },
    
    update: async function(topicId) {
        var titleInput = document.getElementById('edit-topic-title');
        if (!titleInput) {
            window.Utils.showNotification('Error: formulario no encontrado', 'error');
            return;
        }
        
        var title = titleInput.value.trim();
        if (!title) {
            window.Utils.showNotification('⚠️ Ingresa un título para el tema', 'error');
            return;
        }
        
        var descriptionInput = document.getElementById('edit-topic-description');
        var description = descriptionInput ? descriptionInput.value.trim() : '';
        
        try {
            await window.EducaSupabase.Topics.update(topicId, {
                title: title,
                description: description || null
            });
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Tema actualizado correctamente');
            
            if (typeof window.refreshSubject === 'function') {
                await window.refreshSubject();
            }
        } catch (error) {
            console.error('Error al actualizar tema:', error);
            window.Utils.showNotification('❌ Error al actualizar tema', 'error');
        }
    },
    
    delete: function(topicId, topicTitle) {
        window.UIModule.showConfirm(
            '⚠️ ¿Eliminar el tema "' + (topicTitle || 'este tema') + '"?\n\nSe perderán TODOS sus archivos y comentarios. Esta acción no se puede deshacer.',
            async function() {
                try {
                    await window.EducaSupabase.Topics.delete(topicId);
                    window.Utils.showNotification('🗑️ Tema eliminado correctamente');
                    
                    if (typeof window.refreshSubject === 'function') {
                        await window.refreshSubject();
                    }
                } catch (error) {
                    console.error('Error al eliminar tema:', error);
                    window.Utils.showNotification('❌ Error al eliminar tema', 'error');
                }
            }
        );
    },
    
    togglePin: async function(topicId, isPinned) {
        try {
            var client = window.EducaSupabase.getClient();
            var { error } = await client
                .from('topics')
                .update({ is_pinned: !isPinned, updated_at: new Date().toISOString() })
                .eq('id', topicId);
            
            if (error) throw error;
            
            window.Utils.showNotification(isPinned ? '📌 Tema desanclado' : '📍 Tema anclado al inicio');
            
            if (typeof window.refreshSubject === 'function') {
                await window.refreshSubject();
            }
        } catch (error) {
            console.error('Error al cambiar pin:', error);
            window.Utils.showNotification('❌ Error al cambiar estado', 'error');
        }
    }
};

window.TopicsModule = TopicsModule;