/* ============================================
   EDUCA+ - Files Module con Cloudinary
   Subida directa a Cloudinary, metadatos en Supabase
   ============================================ */

const FilesModule = {
    currentTopicId: null,
    cloudinaryWidget: null,
    
    showUploadModal: function(topicId) {
        this.currentTopicId = topicId;
        
        window.UIModule.showModal({
            title: '📁 Subir Archivo',
            content: `
                <div class="cloudinary-upload-area" style="text-align: center; padding: var(--space-6);">
                    <div class="dropzone" id="cloudinary-dropzone" style="cursor: pointer; border: 2px dashed var(--border-default); border-radius: var(--radius-xl); padding: var(--space-8); text-align: center; transition: all var(--transition-base);">
                        <div class="dropzone-icon">${window.UIModule.getIcon('upload', 48)}</div>
                        <p class="dropzone-text">Haz clic para subir archivo</p>
                        <p class="dropzone-hint">Imágenes, PDFs o videos (max 10MB)</p>
                    </div>
                </div>
                <div id="file-preview" style="margin-top: var(--space-4);"></div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>
            `
        });
        
        // Esperar a que Cloudinary esté disponible
        var checkCloudinary = setInterval(function() {
            if (typeof cloudinary !== 'undefined') {
                clearInterval(checkCloudinary);
                FilesModule.initCloudinaryWidget();
                FilesModule.setupDropzoneClick();
            }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(function() {
            if (typeof cloudinary === 'undefined') {
                clearInterval(checkCloudinary);
                window.Utils.showNotification('❌ Error: Servicio de subida no disponible. Recarga la página.', 'error');
            }
        }, 5000);
    },
    
    initCloudinaryWidget: function() {
        if (typeof cloudinary === 'undefined') {
            console.error('Cloudinary no está cargado');
            return;
        }
        
        this.cloudinaryWidget = cloudinary.createUploadWidget(
            {
                cloudName: 'dcsent4fs',
                uploadPreset: 'web-4eso-uploads',
                sources: ['local', 'camera', 'url'],
                multiple: false,
                cropping: false,
                showCompletedButton: true,
                showUploadMoreButton: false,
                maxFileSize: 10485760,
                clientAllowedFormats: ['image/*', 'application/pdf', 'video/*'],
                styles: {
                    palette: {
                        window: '#0f1115',
                        windowBorder: '#1c1f2b',
                        tabIcon: '#6366f1',
                        tabText: '#f3f4f6',
                        link: '#6366f1'
                    }
                }
            },
            this.handleCloudinaryUpload.bind(this)
        );
    },
    
    handleCloudinaryUpload: function(error, result) {
        if (error) {
            console.error('Error en Cloudinary:', error);
            window.Utils.showNotification('❌ Error al subir el archivo', 'error');
            return;
        }
        
        if (result && result.event === 'success') {
            var fileInfo = result.info;
            console.log('Archivo subido a Cloudinary:', fileInfo);
            
            var fileType = 'other';
            if (fileInfo.resource_type === 'image') fileType = 'image';
            else if (fileInfo.resource_type === 'video') fileType = 'video';
            else if (fileInfo.original_filename && fileInfo.original_filename.toLowerCase().endsWith('.pdf')) fileType = 'pdf';
            
            this.saveFileToSupabase({
                topic_id: this.currentTopicId,
                file_name: fileInfo.original_filename,
                file_url: fileInfo.secure_url,
                file_type: fileType,
                file_size: fileInfo.bytes
            });
        } else if (result && result.event === 'close') {
            console.log('Widget de Cloudinary cerrado');
        }
    },
    
    saveFileToSupabase: async function(fileData) {
        try {
            var result = await window.EducaSupabase.Files.create(fileData);
            
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Archivo subido correctamente');
            
            if (typeof window.refreshSubject === 'function') {
                await window.refreshSubject();
            }
        } catch (error) {
            console.error('Error al guardar en Supabase:', error);
            window.Utils.showNotification('❌ Error al guardar la información del archivo', 'error');
        }
    },
    
    setupDropzoneClick: function() {
        var dropzone = document.getElementById('cloudinary-dropzone');
        if (dropzone) {
            dropzone.onclick = function() {
                if (FilesModule.cloudinaryWidget) {
                    FilesModule.cloudinaryWidget.open();
                } else {
                    window.Utils.showNotification('Inicializando cargador...', 'info');
                    setTimeout(function() {
                        if (FilesModule.cloudinaryWidget) {
                            FilesModule.cloudinaryWidget.open();
                        }
                    }, 500);
                }
            };
        }
    },
    
    showEditModal: function(fileId, fileName, topicId) {
        window.UIModule.showModal({
            title: '✏️ Editar Archivo',
            content: `
                <div class="input-group">
                    <label class="input-label">Nombre del archivo</label>
                    <input type="text" class="input" id="edit-file-name" value="${window.Utils.escapeHtml(fileName)}">
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="confirm-edit-file">Guardar Cambios</button>
            `
        });
        
        setTimeout(function() {
            var confirmBtn = document.getElementById('confirm-edit-file');
            if (confirmBtn) {
                confirmBtn.onclick = function() { FilesModule.updateName(fileId); };
            }
        }, 100);
    },
    
    updateName: async function(fileId) {
        var newNameInput = document.getElementById('edit-file-name');
        if (!newNameInput) {
            window.Utils.showNotification('Error: formulario no encontrado', 'error');
            return;
        }
        
        var newName = newNameInput.value.trim();
        if (!newName) {
            window.Utils.showNotification('⚠️ Ingresa un nombre para el archivo', 'error');
            return;
        }
        
        try {
            await window.EducaSupabase.Files.updateName(fileId, newName);
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Nombre actualizado correctamente');
            
            if (typeof window.refreshSubject === 'function') {
                await window.refreshSubject();
            }
        } catch (error) {
            console.error('Error al actualizar:', error);
            window.Utils.showNotification('❌ Error al actualizar nombre', 'error');
        }
    },
    
    delete: function(fileId, fileUrl) {
        window.UIModule.showConfirm('⚠️ ¿Eliminar este archivo? Esta acción no se puede deshacer.', async function() {
            try {
                await window.EducaSupabase.Files.delete(fileId, fileUrl);
                window.Utils.showNotification('🗑️ Archivo eliminado correctamente');
                
                if (typeof window.refreshSubject === 'function') {
                    await window.refreshSubject();
                }
            } catch (error) {
                console.error('Error al eliminar:', error);
                window.Utils.showNotification('❌ Error al eliminar archivo', 'error');
            }
        });
    },
    
    download: function(url, filename) {
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        a.click();
        a.remove();
    }
};

window.FilesModule = FilesModule;