/* ============================================
   EDUCA+ - Supabase Configuration
   ============================================ */

const EDUCA_SUPABASE_URL = 'https://dbdxjskuogumjxcvdxwh.supabase.co';
const EDUCA_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiZHhqc2t1b2d1bWp4Y3ZkeHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjA0NjgsImV4cCI6MjA5NDQ5NjQ2OH0.Lxuepx6BpZ6CQokSF5eEhQEGQ1zyUUDQYPsyWHFl8s4';

let educaSupabase = null;

async function initEducaSupabase() {
    if (educaSupabase) return educaSupabase;
    try {
        educaSupabase = window.supabase.createClient(EDUCA_SUPABASE_URL, EDUCA_SUPABASE_ANON_KEY);
        console.log('Supabase initialized');
        return educaSupabase;
    } catch (error) {
        console.error('Supabase init error:', error);
        throw error;
    }
}

function getEducaSupabase() {
    if (!educaSupabase) throw new Error('Supabase not initialized');
    return educaSupabase;
}

// ============================================
// PROFILES API
// ============================================

const EducaProfilesAPI = {
    async getCurrentProfile() {
        const client = getEducaSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return null;
        
        try {
            let { data: profile, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            
            if (!profile && !error) {
                const newProfile = {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.name || user.email.split('@')[0],
                    role: 'user'
                };
                
                const { data: inserted, error: insertError } = await client
                    .from('profiles')
                    .insert(newProfile)
                    .select()
                    .single();
                
                if (!insertError && inserted) {
                    profile = inserted;
                } else {
                    profile = newProfile;
                }
            }
            
            if (profile) {
                localStorage.setItem('userRole', profile.role || 'user');
                localStorage.setItem('userEmail', profile.email);
                localStorage.setItem('userName', profile.name || profile.email.split('@')[0]);
            }
            
            return profile;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    },
    
    async upsertProfile(profileData) {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('profiles')
            .upsert({
                id: profileData.id,
                email: profileData.email,
                name: profileData.name || profileData.email?.split('@')[0],
                role: profileData.role || 'user',
                avatar_url: profileData.avatar_url || null,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async updateProfile(userId, updates) {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        if (data?.role) localStorage.setItem('userRole', data.role);
        if (data?.name) localStorage.setItem('userName', data.name);
        return data;
    },
    
    async isAdmin() {
        const profile = await this.getCurrentProfile();
        return profile?.role === 'admin';
    },
    
    async getAllUsers() {
        const isAdmin = await this.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    async updateUserRole(userId, role) {
        const isAdmin = await this.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('profiles')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// ============================================
// SUBJECTS API
// ============================================

const EducaSubjectsAPI = {
    async getAll() {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('subjects')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data || [];
    },
    
    async getById(id) {
        const client = getEducaSupabase();
        
        const { data: subject, error: subjectError } = await client
            .from('subjects')
            .select('*')
            .eq('id', id)
            .single();
        
        if (subjectError) throw subjectError;
        
        const { data: topics, error: topicsError } = await client
            .from('topics')
            .select(`
                *,
                files(*),
                recommendations(*)
            `)
            .eq('subject_id', id)
            .order('order_index', { ascending: true });
        
        if (topicsError) throw topicsError;
        
        return { ...subject, topics: topics || [] };
    },
    
    async create(data) {
        const client = getEducaSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión');
        
        const { data: result, error } = await client
            .from('subjects')
            .insert({
                name: data.name,
                icon: data.icon || 'bookOpen',
                color: data.color || '#6366f1',
                description: data.description || null
            })
            .select()
            .single();
        
        if (error) throw error;
        return result;
    },
    
    async update(id, updates) {
        const client = getEducaSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión');
        
        const { error } = await client
            .from('subjects')
            .update({
                name: updates.name,
                description: updates.description,
                icon: updates.icon || 'bookOpen',
                color: updates.color || '#6366f1'
            })
            .eq('id', id);
        
        if (error) throw error;
        return true;
    },
    
    async delete(id) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { error } = await client.from('subjects').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============================================
// TOPICS API
// ============================================

const EducaTopicsAPI = {
    async create(data) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { data: result, error } = await client
            .from('topics')
            .insert({
                subject_id: data.subject_id,
                title: data.title,
                description: data.description || null,
                order_index: data.order_index || 0
            })
            .select()
            .single();
        
        if (error) throw error;
        return result;
    },
    
    async update(id, updates) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('topics')
            .update({
                title: updates.title,
                description: updates.description,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async delete(id) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { error } = await client.from('topics').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
    
    async reorder(orderedIds) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const promises = orderedIds.map(function(item) {
            return client
                .from('topics')
                .update({ order_index: item.order_index })
                .eq('id', item.id);
        });
        
        const results = await Promise.all(promises);
        for (var i = 0; i < results.length; i++) {
            if (results[i].error) throw results[i].error;
        }
        return true;
    }
};

// ============================================
// FILES API (ACTUALIZADO PARA CLOUDINARY)
// ============================================

const EducaFilesAPI = {
    async getRecent(limit = 10) {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('files')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error al obtener archivos recientes:', error);
            return [];
        }
        return data || [];
    },
    
    async getAll() {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('files')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error al obtener todos los archivos:', error);
            return [];
        }
        return data || [];
    },
    
    // NUEVO: Crear registro de archivo (para Cloudinary)
    async create(data) {
        const client = getEducaSupabase();
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('No tienes permisos de administrador');
        
        const { data: result, error } = await client
            .from('files')
            .insert({
                topic_id: data.topic_id,
                file_name: data.file_name,
                file_url: data.file_url,
                file_type: data.file_type || 'other',
                file_size: data.file_size || 0
            })
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ Archivo registrado en Supabase:', result);
        return result;
    },
    
    // NUEVO: Actualizar nombre del archivo
    async updateName(fileId, newName) {
        const client = getEducaSupabase();
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('No tienes permisos de administrador');
        
        const { data, error } = await client
            .from('files')
            .update({ file_name: newName })
            .eq('id', fileId)
            .select()
            .single();
        
        if (error) throw error;
        console.log('✅ Nombre actualizado:', data);
        return data;
    },
    
    // NUEVO: Eliminar registro de archivo
    async delete(id, fileUrl) {
        const client = getEducaSupabase();
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('No tienes permisos de administrador');
        
        // Solo eliminar de Supabase, Cloudinary mantiene el archivo
        const { error } = await client.from('files').delete().eq('id', id);
        if (error) throw error;
        console.log('✅ Registro de archivo eliminado:', id);
        return true;
    }
};

// ============================================
// RECOMMENDATIONS API
// ============================================

const EducaRecommendationsAPI = {
    async getRecent(limit = 10) {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('recommendations')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
    },
    
    async getAll() {
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('recommendations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },
    
    async create(data) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { data: result, error } = await client
            .from('recommendations')
            .insert({
                topic_id: data.topic_id,
                title: data.title,
                url: data.url || null,
                description: data.description || null
            })
            .select()
            .single();
        
        if (error) throw error;
        return result;
    },
    
    async update(id, updates) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { data, error } = await client
            .from('recommendations')
            .update({
                title: updates.title,
                url: updates.url || null,
                description: updates.description || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },
    
    async delete(id) {
        const isAdmin = await EducaProfilesAPI.isAdmin();
        if (!isAdmin) throw new Error('Unauthorized');
        
        const client = getEducaSupabase();
        const { error } = await client.from('recommendations').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};

// ============================================
// COMMENTS API
// ============================================

const EducaCommentsAPI = {
    async getByTopic(topicId) {
        const client = getEducaSupabase();
        
        const { data: comments, error: commentsError } = await client
            .from('comments')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: true });
        
        if (commentsError) {
            console.warn('Comments query error:', commentsError);
            return [];
        }
        
        if (!comments || comments.length === 0) {
            return [];
        }
        
        const userIds = [...new Set(comments.map(c => c.user_id))];
        
        if (userIds.length === 0) {
            return comments.map(c => ({ ...c, profiles: null }));
        }
        
        const { data: profiles, error: profilesError } = await client
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', userIds);
        
        if (profilesError) {
            console.warn('Profiles query error:', profilesError);
            return comments.map(c => ({ ...c, profiles: null }));
        }
        
        const profileMap = {};
        if (profiles) {
            profiles.forEach(profile => {
                profileMap[profile.id] = profile;
            });
        }
        
        return comments.map(comment => ({
            ...comment,
            profiles: profileMap[comment.user_id] || null
        }));
    },
    
    async create(data) {
        const client = getEducaSupabase();
        const { data: result, error } = await client
            .from('comments')
            .insert({
                topic_id: data.topic_id,
                user_id: data.user_id,
                content: data.content
            })
            .select()
            .single();
        
        if (error) throw error;
        
        const { data: profile } = await client
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', data.user_id)
            .single();
        
        return {
            ...result,
            profiles: profile || null
        };
    },
    
    async delete(id) {
        const client = getEducaSupabase();
        const { data: { user } } = await client.auth.getUser();
        const isAdmin = await EducaProfilesAPI.isAdmin();
        
        let query = client.from('comments').delete().eq('id', id);
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }
        
        const { error } = await query;
        if (error) throw error;
        return true;
    },
    
    async update(id, content) {
        const client = getEducaSupabase();
        const { data: { user } } = await client.auth.getUser();
        
        const { data, error } = await client
            .from('comments')
            .update({ content, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};

// ============================================
// EXPORT
// ============================================

window.EducaSupabase = {
    init: initEducaSupabase,
    getClient: getEducaSupabase,
    Profiles: EducaProfilesAPI,
    Subjects: EducaSubjectsAPI,
    Topics: EducaTopicsAPI,
    Files: EducaFilesAPI,
    Recommendations: EducaRecommendationsAPI,
    Comments: EducaCommentsAPI
};

window.SupabaseModule = window.EducaSupabase;