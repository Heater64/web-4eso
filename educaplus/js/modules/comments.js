/* ============================================
   EDUCA+ - Comments Module
   Sistema de comentarios por tema
   ============================================ */

const CommentsAPI = {
    async getByTopic(topicId) {
        const client = window.EducaSupabase.getClient();
        
        // Primero obtener comentarios
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
        
        // Obtener perfiles de usuarios
        const userIds = [...new Set(comments.map(c => c.user_id))];
        
        const { data: profiles, error: profilesError } = await client
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', userIds);
        
        if (profilesError) {
            console.warn('Profiles query error:', profilesError);
            return comments.map(c => ({ ...c, profiles: null }));
        }
        
        // Mapear perfiles
        const profileMap = {};
        if (profiles) {
            profiles.forEach(profile => {
                profileMap[profile.id] = profile;
            });
        }
        
        // Combinar
        return comments.map(comment => ({
            ...comment,
            profiles: profileMap[comment.user_id] || null
        }));
    },
    
    async create(data) {
        const client = window.EducaSupabase.getClient();
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
        
        // Obtener perfil
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
        const client = window.EducaSupabase.getClient();
        const { data: { user } } = await client.auth.getUser();
        const isAdmin = await window.EducaSupabase.Profiles.isAdmin();
        
        let query = client.from('comments').delete().eq('id', id);
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }
        
        const { error } = await query;
        if (error) throw error;
        return true;
    },
    
    async update(id, content) {
        const client = window.EducaSupabase.getClient();
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

window.CommentsAPI = CommentsAPI;