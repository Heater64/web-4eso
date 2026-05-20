/* ============================================
   EDUCA+ - Utilidades
   Funciones reutilizables
   ============================================ */

// Formatear fecha
function formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) { 
        const minutes = Math.floor(diff / 60000); 
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`; 
    }
    if (diff < 86400000) { 
        const hours = Math.floor(diff / 3600000); 
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`; 
    }
    if (diff < 604800000) { 
        const days = Math.floor(diff / 86400000); 
        return `Hace ${days} día${days > 1 ? 's' : ''}`; 
    }
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escapar HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Debounce para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) { 
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait); 
    };
}

// Mostrar notificación (usa UIModule si está disponible)
function showNotification(message, type = 'success') {
    if (window.UIModule && window.UIModule.showNotification) {
        window.UIModule.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
        // Crear notificación simple si UIModule no está disponible
        const container = document.querySelector('.toast-container');
        if (container) {
            const notification = document.createElement('div');
            notification.className = `toast toast-${type}`;
            notification.innerHTML = `
                <div class="toast-content"><p class="toast-message">${escapeHtml(message)}</p></div>
                <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
            `;
            container.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        } else {
            alert(message);
        }
    }
}

// Exportar todo
window.Utils = {
    formatDate: formatDate,
    formatFileSize: formatFileSize,
    escapeHtml: escapeHtml,
    debounce: debounce,
    showNotification: showNotification
};