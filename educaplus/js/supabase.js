/* ============================================
   EDUCA+ - Supabase Configuration
   Database & Authentication Module
   ============================================ */

// Supabase Configuration
// Replace with your actual Supabase credentials
const SUPABASE_URL = 'TU_URL';
const SUPABASE_ANON_KEY = 'TU_ANON_KEY';

// Initialize Supabase Client
let supabase = null;

/**
 * Initialize Supabase client
 * @returns {Object} Supabase client instance
 */
async function initSupabase() {
    if (supabase) return supabase;
    
    try {
        // Using the Supabase CDN
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return supabase;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        throw error;
    }
}

/**
 * Get current Supabase client
 * @returns {Object} Supabase client instance
 */
function getSupabase() {
    if (!supabase) {
        throw new Error('Supabase not initialized. Call initSupabase() first.');
    }
    return supabase;
}

// ============================================
// DATABASE SCHEMA
// ============================================

/*
-- Profiles Table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects Table
CREATE TABLE subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'book-open',
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Topics Table
CREATE TABLE topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files Table
CREATE TABLE files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'other')),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations Table
CREATE TABLE recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for subjects (read-only for users, full access for admins)
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);

-- RLS Policies for topics
CREATE POLICY "Anyone can view topics" ON topics FOR SELECT USING (true);

-- RLS Policies for files
CREATE POLICY "Anyone can view files" ON files FOR SELECT USING (true);

-- RLS Policies for recommendations
CREATE POLICY "Anyone can view recommendations" ON recommendations FOR SELECT USING (true);

-- Storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);

-- Storage policies
CREATE POLICY "Anyone can view files" ON storage.objects FOR SELECT USING (bucket_id = 'files');
*/

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Execute a database query with error handling
 * @param {Function} queryFn - Query function to execute
 * @returns {Object} Query result
 */
async function executeQuery(queryFn) {
    try {
        const client = getSupabase();
        const result = await queryFn(client);
        
        if (result.error) {
            console.error('Database error:', result.error);
            throw result.error;
        }
        
        return result.data;
    } catch (error) {
        console.error('Query execution failed:', error);
        throw error;
    }
}

// ============================================
// PROFILES API
// ============================================

const ProfilesAPI = {
    /**
     * Get current user profile
     * @returns {Object} User profile
     */
    async getCurrentProfile() {
        const client = getSupabase();
        const { data: { user } } = await client.auth.getUser();
        
        if (!user) return null;
        
        return executeQuery(client => 
            client.from('profiles').select('*').eq('id', user.id).single()
        );
    },
    
    /**
     * Create or update user profile
     * @param {Object} profileData - Profile data
     * @returns {Object} Created/updated profile
     */
    async upsertProfile(profileData) {
        return executeQuery(client =>
            client.from('profiles').upsert(profileData).select().single()
        );
    },
    
    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} updates - Profile updates
     * @returns {Object} Updated profile
     */
    async updateProfile(userId, updates) {
        return executeQuery(client =>
            client.from('profiles').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', userId).select().single()
        );
    },
    
    /**
     * Check if user is admin
     * @returns {boolean} True if user is admin
     */
    async isAdmin() {
        const profile = await this.getCurrentProfile();
        return profile?.role === 'admin';
    }
};

// ============================================
// SUBJECTS API
// ============================================

const SubjectsAPI = {
    /**
     * Get all subjects
     * @returns {Array} List of subjects
     */
    async getAll() {
        return executeQuery(client =>
            client.from('subjects')
                .select(`
                    *,
                    topics(count),
                    files(count)
                `)
                .order('name', { ascending: true })
        );
    },
    
    /**
     * Get subject by ID
     * @param {string} id - Subject ID
     * @returns {Object} Subject data
     */
    async getById(id) {
        return executeQuery(client =>
            client.from('subjects')
                .select(`
                    *,
                    topics(*),
                    files(count)
                `)
                .eq('id', id)
                .single()
        );
    },
    
    /**
     * Create new subject (admin only)
     * @param {Object} subjectData - Subject data
     * @returns {Object} Created subject
     */
    async create(subjectData) {
        return executeQuery(client =>
            client.from('subjects').insert(subjectData).select().single()
        );
    },
    
    /**
     * Update subject (admin only)
     * @param {string} id - Subject ID
     * @param {Object} updates - Subject updates
     * @returns {Object} Updated subject
     */
    async update(id, updates) {
        return executeQuery(client =>
            client.from('subjects').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', id).select().single()
        );
    },
    
    /**
     * Delete subject (admin only)
     * @param {string} id - Subject ID
     */
    async delete(id) {
        return executeQuery(client =>
            client.from('subjects').delete().eq('id', id)
        );
    }
};

// ============================================
// TOPICS API
// ============================================

const TopicsAPI = {
    /**
     * Get all topics for a subject
     * @param {string} subjectId - Subject ID
     * @returns {Array} List of topics
     */
    async getBySubject(subjectId) {
        return executeQuery(client =>
            client.from('topics')
                .select(`
                    *,
                    files(*),
                    recommendations(*)
                `)
                .eq('subject_id', subjectId)
                .order('order_index', { ascending: true })
        );
    },
    
    /**
     * Get topic by ID
     * @param {string} id - Topic ID
     * @returns {Object} Topic data
     */
    async getById(id) {
        return executeQuery(client =>
            client.from('topics')
                .select(`
                    *,
                    files(*),
                    recommendations(*)
                `)
                .eq('id', id)
                .single()
        );
    },
    
    /**
     * Create new topic (admin only)
     * @param {Object} topicData - Topic data
     * @returns {Object} Created topic
     */
    async create(topicData) {
        return executeQuery(client =>
            client.from('topics').insert(topicData).select().single()
        );
    },
    
    /**
     * Update topic (admin only)
     * @param {string} id - Topic ID
     * @param {Object} updates - Topic updates
     * @returns {Object} Updated topic
     */
    async update(id, updates) {
        return executeQuery(client =>
            client.from('topics').update({
                ...updates,
                updated_at: new Date().toISOString()
            }).eq('id', id).select().single()
        );
    },
    
    /**
     * Delete topic (admin only)
     * @param {string} id - Topic ID
     */
    async delete(id) {
        return executeQuery(client =>
            client.from('topics').delete().eq('id', id)
        );
    }
};

// ============================================
// FILES API
// ============================================

const FilesAPI = {
    /**
     * Get all files for a topic
     * @param {string} topicId - Topic ID
     * @returns {Array} List of files
     */
    async getByTopic(topicId) {
        return executeQuery(client =>
            client.from('files')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: false })
        );
    },
    
    /**
     * Get recent files
     * @param {number} limit - Number of files to return
     * @returns {Array} List of recent files
     */
    async getRecent(limit = 10) {
        return executeQuery(client =>
            client.from('files')
                .select(`
                    *,
                    topics(
                        id,
                        title,
                        subjects(id, name)
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limit)
        );
    },
    
    /**
     * Upload file to storage
     * @param {File} file - File to upload
     * @param {string} topicId - Topic ID
     * @returns {Object} Uploaded file data
     */
    async upload(file, topicId) {
        const client = getSupabase();
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `topics/${topicId}/${fileName}`;
        
        // Upload to storage
        const { error: uploadError } = await client.storage
            .from('files')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = client.storage
            .from('files')
            .getPublicUrl(filePath);
        
        // Determine file type
        let fileType = 'other';
        if (file.type === 'application/pdf') fileType = 'pdf';
        else if (file.type.startsWith('image/')) fileType = 'image';
        
        // Create file record
        return executeQuery(client =>
            client.from('files').insert({
                topic_id: topicId,
                file_name: file.name,
                file_url: publicUrl,
                file_type: fileType,
                file_size: file.size
            }).select().single()
        );
    },
    
    /**
     * Delete file
     * @param {string} id - File ID
     * @param {string} fileUrl - File URL to delete from storage
     */
    async delete(id, fileUrl) {
        const client = getSupabase();
        
        // Extract path from URL
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(p => p === 'files');
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        // Delete from storage
        if (filePath) {
            await client.storage.from('files').remove([filePath]);
        }
        
        // Delete record
        return executeQuery(client =>
            client.from('files').delete().eq('id', id)
        );
    }
};

// ============================================
// RECOMMENDATIONS API
// ============================================

const RecommendationsAPI = {
    /**
     * Get all recommendations for a topic
     * @param {string} topicId - Topic ID
     * @returns {Array} List of recommendations
     */
    async getByTopic(topicId) {
        return executeQuery(client =>
            client.from('recommendations')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: false })
        );
    },
    
    /**
     * Get recent recommendations
     * @param {number} limit - Number to return
     * @returns {Array} List of recommendations
     */
    async getRecent(limit = 5) {
        return executeQuery(client =>
            client.from('recommendations')
                .select(`
                    *,
                    topics(
                        id,
                        title,
                        subjects(id, name)
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(limit)
        );
    },
    
    /**
     * Create recommendation
     * @param {Object} data - Recommendation data
     * @returns {Object} Created recommendation
     */
    async create(data) {
        return executeQuery(client =>
            client.from('recommendations').insert(data).select().single()
        );
    },
    
    /**
     * Delete recommendation
     * @param {string} id - Recommendation ID
     */
    async delete(id) {
        return executeQuery(client =>
            client.from('recommendations').delete().eq('id', id)
        );
    }
};

// Export for use in other modules
window.SupabaseModule = {
    init: initSupabase,
    getClient: getSupabase,
    Profiles: ProfilesAPI,
    Subjects: SubjectsAPI,
    Topics: TopicsAPI,
    Files: FilesAPI,
    Recommendations: RecommendationsAPI
};
