/* ============================================
   EDUCA+ - Files Module con Cloudinary
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
            `,
            footer: '<button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button>'
        });
        
        var checkCloudinary = setInterval(function() {
            if (typeof cloudinary !== 'undefined') {
                clearInterval(checkCloudinary);
                FilesModule.initCloudinaryWidget();
                FilesModule.setupDropzoneClick();
            }
        }, 100);
        
        setTimeout(function() {
            if (typeof cloudinary === 'undefined') {
                clearInterval(checkCloudinary);
                window.Utils.showNotification('❌ Servicio de subida no disponible', 'error');
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
                maxFileSize: 10485760,
                clientAllowedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4'],
                resourceType: 'auto',
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
            console.error('Error:', error);
            window.Utils.showNotification('❌ Error al subir', 'error');
            return;
        }
        
        if (result && result.event === 'success') {
            var fileInfo = result.info;
            console.log('✅ Subido a Cloudinary:', fileInfo);
            
            var fileType = 'other';
            var fileUrl = fileInfo.secure_url;
            
            if (fileInfo.resource_type === 'image') {
                fileType = 'image';
            } else if (fileInfo.resource_type === 'video') {
                fileType = 'video';
            }
            
            if (fileInfo.format === 'pdf' || (fileInfo.original_filename && fileInfo.original_filename.toLowerCase().endsWith('.pdf'))) {
                fileType = 'pdf';
                if (fileUrl.includes('/image/upload/')) {
                    fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
                    console.log('URL corregida para PDF:', fileUrl);
                }
            }
            
            var fileName = fileInfo.original_filename;
            if (fileInfo.format && !fileName.toLowerCase().endsWith('.' + fileInfo.format)) {
                fileName = fileName + '.' + fileInfo.format;
            }
            
            this.saveFileToSupabase({
                topic_id: this.currentTopicId,
                file_name: fileName,
                file_url: fileUrl,
                file_type: fileType,
                file_size: fileInfo.bytes
            });
        }
    },
    
    saveFileToSupabase: async function(fileData) {
        try {
            var result = await window.EducaSupabase.Files.create(fileData);
            console.log('✅ Guardado en Supabase:', result);
            
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Archivo subido correctamente');
            
            if (typeof window.refreshSubject === 'function') {
                await window.refreshSubject();
            }
        } catch (error) {
            console.error('Error:', error);
            window.Utils.showNotification('❌ Error al guardar', 'error');
        }
    },
    
    setupDropzoneClick: function() {
        var dropzone = document.getElementById('cloudinary-dropzone');
        if (dropzone) {
            dropzone.onclick = function() {
                FilesModule.cloudinaryWidget.open();
            };
        }
    },
    
    showEditModal: function(fileId, fileName, topicId) {
        window.UIModule.showModal({
            title: '✏️ Editar Archivo',
            content: '<div class="input-group"><label class="input-label">Nombre</label><input type="text" class="input" id="edit-file-name" value="' + window.Utils.escapeHtml(fileName) + '"></div>',
            footer: '<button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cancelar</button><button class="btn btn-primary" id="confirm-edit-file">Guardar</button>'
        });
        
        setTimeout(function() {
            var btn = document.getElementById('confirm-edit-file');
            if (btn) {
                btn.onclick = function() {
                    var newName = document.getElementById('edit-file-name').value.trim();
                    if (newName) FilesModule.updateFileName(fileId, newName);
                };
            }
        }, 100);
    },
    
    updateFileName: async function(fileId, newName) {
        try {
            await window.EducaSupabase.Files.updateName(fileId, newName);
            window.UIModule.closeModal();
            window.Utils.showNotification('✅ Nombre actualizado');
            if (typeof window.refreshSubject === 'function') await window.refreshSubject();
        } catch (error) {
            console.error(error);
            window.Utils.showNotification('❌ Error al actualizar', 'error');
        }
    },
    
    delete: function(fileId, fileUrl) {
        window.UIModule.showConfirm('⚠️ ¿Eliminar este archivo?', async function() {
            try {
                await window.EducaSupabase.Files.delete(fileId, fileUrl);
                window.Utils.showNotification('🗑️ Eliminado');
                if (typeof window.refreshSubject === 'function') await window.refreshSubject();
            } catch (error) {
                console.error(error);
                window.Utils.showNotification('❌ Error al eliminar', 'error');
            }
        });
    }
};

window.FilesModule = FilesModule;
