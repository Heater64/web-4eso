/* ============================================
   DASHBOARD - Panel de Administración
   ============================================ */

async function showUserManagementModal() {
    try {
        const users = await window.EducaSupabase.Profiles.getAllUsers();
        
        window.UIModule.showModal({
            title: '👥 Gestionar Usuarios',
            size: 'large',
            content: `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                <th style="text-align: left; padding: 12px;">Usuario</th>
                                <th style="text-align: left; padding: 12px;">Email</th>
                                <th style="text-align: left; padding: 12px;">Rol</th>
                                <th style="text-align: left; padding: 12px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr style="border-bottom: 1px solid var(--border-subtle);">
                                    <td style="padding: 12px;">${window.Utils.escapeHtml(u.name || u.email.split('@')[0])}</td>
                                    <td style="padding: 12px;">${window.Utils.escapeHtml(u.email)}</td>
                                    <td style="padding: 12px;">
                                        <span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">
                                            ${u.role === 'admin' ? 'Admin' : 'Usuario'}
                                        </span>
                                    </td>
                                    <td style="padding: 12px;">
                                        ${u.role !== 'admin' 
                                            ? `<button class="btn btn-sm btn-primary" onclick="window.makeUserAdmin('${u.id}')">Hacer Admin</button>` 
                                            : u.email !== window.dashboardState.profile?.email
                                                ? `<button class="btn btn-sm btn-secondary" onclick="window.removeUserAdmin('${u.id}')">Quitar Admin</button>`
                                                : '<span class="badge badge-primary">Tú</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `,
            footer: '<button class="btn btn-secondary" onclick="window.UIModule.closeModal()">Cerrar</button>'
        });
    } catch (error) {
        console.error('Error loading users:', error);
        window.Utils.showNotification('Error al cargar usuarios', 'error');
    }
}

async function makeUserAdmin(userId) {
    try {
        await window.EducaSupabase.Profiles.updateUserRole(userId, 'admin');
        window.UIModule.closeModal();
        window.Utils.showNotification('✅ Usuario actualizado a administrador');
        showUserManagementModal();
    } catch (error) {
        console.error(error);
        window.Utils.showNotification('❌ Error al actualizar rol', 'error');
    }
}

async function removeUserAdmin(userId) {
    try {
        await window.EducaSupabase.Profiles.updateUserRole(userId, 'user');
        window.UIModule.closeModal();
        window.Utils.showNotification('✅ Administrador removido');
        showUserManagementModal();
    } catch (error) {
        console.error(error);
        window.Utils.showNotification('❌ Error al actualizar rol', 'error');
    }
}

async function exportAllData() {
    window.UIModule.showModal({
        title: '📥 Exportar Datos',
        content: '<div style="text-align: center; padding: var(--space-4);"><div class="spinner-lg" style="margin: 0 auto;"></div><p style="margin-top: var(--space-3);">Generando exportación...</p></div>',
        closable: false
    });
    
    try {
        const [subjects, files, recommendations, users] = await Promise.all([
            window.EducaSupabase.Subjects.getAll(),
            window.EducaSupabase.Files.getAll(),
            window.EducaSupabase.Recommendations.getAll(),
            window.EducaSupabase.Profiles.getAllUsers()
        ]);
        
        const exportData = {
            exportDate: new Date().toISOString(),
            platform: 'Web 4 ESO',
            version: '1.0.0',
            summary: {
                totalSubjects: subjects.length,
                totalFiles: files.length,
                totalRecommendations: recommendations.length,
                totalUsers: users.length
            },
            subjects: subjects,
            files: files,
            recommendations: recommendations,
            users: users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, created_at: u.created_at }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `web4eso_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        window.UIModule.closeModal();
        window.Utils.showNotification('📥 Datos exportados correctamente');
    } catch (error) {
        console.error('Export error:', error);
        window.UIModule.closeModal();
        window.Utils.showNotification('❌ Error al exportar datos', 'error');
    }
}

window.showUserManagementModal = showUserManagementModal;
window.makeUserAdmin = makeUserAdmin;
window.removeUserAdmin = removeUserAdmin;
window.exportAllData = exportAllData;

document.addEventListener('DOMContentLoaded', () => {
    const manageUsersBtn = document.getElementById('manage-users-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    
    if (manageUsersBtn) manageUsersBtn.addEventListener('click', showUserManagementModal);
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportAllData);
});