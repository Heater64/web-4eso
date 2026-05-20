/* ============================================
   DASHBOARD - Panel de Administración
   ============================================ */

async function showUserManagementModal() {
    const client = window.EducaSupabase.getClient();
    const { data: users } = await client.from('profiles').select('*').order('created_at', { ascending: false });
    
    window.UIModule.showModal({
        title: '👥 Gestionar Usuarios',
        size: 'large',
        content: `
            <div style="overflow-x:auto">
                <table style="width:100%">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${window.Utils.escapeHtml(u.name || u.email.split('@')[0])}</td>
                                <td>${window.Utils.escapeHtml(u.email)}</td>
                                <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}">${u.role === 'admin' ? 'Admin' : 'Usuario'}</span></td>
                                <td>
                                    ${u.role !== 'admin' 
                                        ? `<button class="btn btn-sm btn-primary" onclick="makeAdmin('${u.id}')">Hacer Admin</button>` 
                                        : `<button class="btn btn-sm btn-secondary" onclick="removeAdmin('${u.id}')">Quitar Admin</button>`
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
}

async function makeAdmin(userId) {
    const client = window.EducaSupabase.getClient();
    await client.from('profiles').update({ role: 'admin' }).eq('id', userId);
    window.UIModule.closeModal();
    window.Utils.showNotification('✅ Usuario actualizado a administrador');
    showUserManagementModal();
}

async function removeAdmin(userId) {
    const client = window.EducaSupabase.getClient();
    await client.from('profiles').update({ role: 'user' }).eq('id', userId);
    window.UIModule.closeModal();
    window.Utils.showNotification('✅ Administrador removido');
    showUserManagementModal();
}

async function exportAllData() {
    const subjects = await window.EducaSupabase.Subjects.getAll();
    const files = await window.EducaSupabase.Files.getAll();
    const recommendations = await window.EducaSupabase.Recommendations.getAll();
    
    const dataStr = JSON.stringify({ 
        exportDate: new Date().toISOString(), 
        subjects, 
        files, 
        recommendations 
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `educaplus_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.Utils.showNotification('📥 Datos exportados');
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
    const manageUsersBtn = document.getElementById('manage-users-btn');
    const exportDataBtn = document.getElementById('export-data-btn');
    
    if (manageUsersBtn) manageUsersBtn.addEventListener('click', showUserManagementModal);
    if (exportDataBtn) exportDataBtn.addEventListener('click', exportAllData);
});