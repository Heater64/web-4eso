/* ============================================
   EDUCA+ - Recommendations Module
   CRUD completo de recomendaciones
   ============================================ */

const RecommendationsModule = {
    currentTopicId: null,
    
    showCreateModal: function(topicId) {
        this.currentTopicId = topicId;
        
        window.UIModule.showModal({
            title: '💡 Nueva Recomendación',
            content: `
                <form id="create-rec-form" class="form-grid">
                    <div class="input-group">
                        <label class="input-label">Título *</label>
                        <input type="text" class="input" id="rec-title" placeholder="Ej: Video tutorial" required>
                    </div>
                    <div class="input-group">
                        <label class="input-label">URL</label>
                        <input type="url" class="input" id="rec-url" placeholder="https://...">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Descripción</label>
                        <textarea class="input" id="rec-description" rows="3" placeholder="Describe el recurso..."></textarea>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="confirm-create-rec">Agregar Recomendación</button>
            `
        });
        
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirm-create-rec');
            if (confirmBtn) {
                confirmBtn.onclick = () => this.create();
            }
        }, 100);
    },
    
    create: async function() {
        const title = document.getElementById('rec-title')?.value.trim();
        const url = document.getElementById('rec-url')?.value.trim();
        const description = document.getElementById('rec-description')?.value.trim();
        
        if (!title) {
            window.Utils.showNotification('⚠️ Ingresa un título para la recomendación', 'error');
            return;
        }
        
        try {
            await window.EducaSupabase.Recommendations.create({
                topic_id: this.currentTopicId,
                title: title,
                url: url || null,
                description: description || null
            });
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Recomendación agregada correctamente');
            
            if (typeof refreshSubject === 'function') {
                await refreshSubject();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error al crear recomendación:', error);
            window.Utils.showNotification('❌ Error al crear recomendación', 'error');
        }
    },
    
    showEditModal: function(recId, title, url, description, topicId) {
        window.UIModule.showModal({
            title: '✏️ Editar Recomendación',
            content: `
                <form id="edit-rec-form" class="form-grid">
                    <div class="input-group">
                        <label class="input-label">Título *</label>
                        <input type="text" class="input" id="edit-rec-title" value="${window.Utils.escapeHtml(title)}" required>
                    </div>
                    <div class="input-group">
                        <label class="input-label">URL</label>
                        <input type="url" class="input" id="edit-rec-url" value="${window.Utils.escapeHtml(url || '')}" placeholder="https://...">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Descripción</label>
                        <textarea class="input" id="edit-rec-description" rows="3">${window.Utils.escapeHtml(description || '')}</textarea>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="confirm-edit-rec">Guardar Cambios</button>
            `
        });
        
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirm-edit-rec');
            if (confirmBtn) {
                confirmBtn.onclick = () => this.update(recId);
            }
        }, 100);
    },
    
    update: async function(recId) {
        const title = document.getElementById('edit-rec-title')?.value.trim();
        const url = document.getElementById('edit-rec-url')?.value.trim();
        const description = document.getElementById('edit-rec-description')?.value.trim();
        
        if (!title) {
            window.Utils.showNotification('⚠️ Ingresa un título para la recomendación', 'error');
            return;
        }
        
        try {
            await window.EducaSupabase.Recommendations.update(recId, {
                title: title,
                url: url || null,
                description: description || null
            });
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Recomendación actualizada correctamente');
            
            if (typeof refreshSubject === 'function') {
                await refreshSubject();
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Error al actualizar recomendación:', error);
            window.Utils.showNotification('❌ Error al actualizar recomendación', 'error');
        }
    },
    
    delete: function(recId) {
        window.UIModule.showConfirm('⚠️ ¿Eliminar esta recomendación?', async function() {
            try {
                await window.EducaSupabase.Recommendations.delete(recId);
                window.Utils.showNotification('🗑️ Recomendación eliminada correctamente');
                
                if (typeof refreshSubject === 'function') {
                    await refreshSubject();
                } else {
                    window.location.reload();
                }
            } catch (error) {
                console.error('Error al eliminar recomendación:', error);
                window.Utils.showNotification('❌ Error al eliminar recomendación', 'error');
            }
        });
    }
};

window.RecommendationsModule = RecommendationsModule;