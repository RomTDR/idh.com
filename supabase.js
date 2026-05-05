// ========================================
// SUPABASE CONFIGURATION - AsInAIHB
// Remplacez ces valeurs par les vôtres après création du projet Supabase
// ========================================

const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-ici';

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialisé avec succès');
        return supabaseClient;
    } else {
        console.warn('⚠️ Supabase non chargé - Vérifiez le CDN');
        return null;
    }
}

// ========================================
// AUTHENTIFICATION
// ========================================

async function signUp(email, password, userData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { 
            data: userData 
        }
    });
    return { data, error };
}

async function signIn(email, password) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

async function signOut() {
    if (!supabaseClient) initSupabase();
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

async function getUser() {
    if (!supabaseClient) initSupabase();
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

async function getSession() {
    if (!supabaseClient) initSupabase();
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

async function resetPassword(email) {
    if (!supabaseClient) initSupabase();
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/membres.html'
    });
    return { error };
}

// ========================================
// ARTICLES (Revue)
// ========================================

async function getArticles(filters = {}) {
    if (!supabaseClient) initSupabase();
    let query = supabaseClient
        .from('articles')
        .select('*, members(first_name, last_name)')
        .eq('status', 'published')
        .order('publication_date', { ascending: false });
    
    if (filters.specialty) {
        query = query.eq('specialty', filters.specialty);
    }
    if (filters.article_type) {
        query = query.eq('article_type', filters.article_type);
    }
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    return { data, error };
}

async function getArticleById(id) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('articles')
        .select('*, members(first_name, last_name)')
        .eq('id', id)
        .single();
    return { data, error };
}

async function submitArticle(articleData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('articles')
        .insert([articleData])
        .select();
    return { data, error };
}

async function getUserArticles(userId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('corresponding_author', userId)
        .order('created_at', { ascending: false });
    return { data, error };
}

// ========================================
// MEMBRES (Profils)
// ========================================

async function getMemberProfile(userId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

async function updateMemberProfile(userId, updates) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('members')
        .update(updates)
        .eq('id', userId)
        .select();
    return { data, error };
}

async function createMemberProfile(profileData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('members')
        .insert([profileData])
        .select();
    return { data, error };
}

// ========================================
// NUMÉROS (Issues)
// ========================================

async function getIssues(limit = 3) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('issues')
        .select('*')
        .eq('is_published', true)
        .order('publication_date', { ascending: false })
        .limit(limit);
    return { data, error };
}

// ========================================
// REVIEWS (Relectures)
// ========================================

async function getReviewsForReviewer(reviewerId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('reviews')
        .select('*, articles(title)')
        .eq('reviewer_id', reviewerId)
        .eq('is_submitted', false);
    return { data, error };
}

async function submitReview(reviewId, reviewData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('reviews')
        .update(reviewData)
        .eq('id', reviewId);
    return { data, error };
}

// ========================================
// FAVORIS
// ========================================

async function getFavorites(memberId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('favorites')
        .select('*, articles(*)')
        .eq('member_id', memberId);
    return { data, error };
}

async function addFavorite(memberId, articleId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('favorites')
        .insert([{ member_id: memberId, article_id: articleId }]);
    return { data, error };
}

async function removeFavorite(memberId, articleId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('favorites')
        .delete()
        .eq('member_id', memberId)
        .eq('article_id', articleId);
    return { data, error };
}

// ========================================
// STATISTIQUES
// ========================================

async function getStats() {
    if (!supabaseClient) initSupabase();
    
    const { count: articlesCount } = await supabaseClient
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');
    
    const { count: membersCount } = await supabaseClient
        .from('members')
        .select('*', { count: 'exact', head: true });
    
    const { count: issuesCount } = await supabaseClient
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);
    
    return {
        articles: articlesCount || 0,
        members: membersCount || 0,
        issues: issuesCount || 0
    };
}

// ========================================
// UPLOAD FICHIERS (Storage)
// ========================================

async function uploadPDF(file, userId) {
    if (!supabaseClient) initSupabase();
    const fileName = `articles/${userId}/${Date.now()}_${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('articles')
        .upload(fileName, file, { contentType: 'application/pdf' });
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabaseClient.storage
        .from('articles')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

// ========================================
// UTILITAIRES
// ========================================

function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alertClass = type === 'success' ? 'alert-success' : 
                      (type === 'error' ? 'alert-error' : 'alert-info');
    
    container.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Export pour utilisation globale
window.IDH = {
    initSupabase,
    signUp,
    signIn,
    signOut,
    getUser,
    getSession,
    resetPassword,
    getArticles,
    getArticleById,
    submitArticle,
    getUserArticles,
    getMemberProfile,
    updateMemberProfile,
    createMemberProfile,
    getIssues,
    getReviewsForReviewer,
    submitReview,
    getFavorites,
    addFavorite,
    removeFavorite,
    getStats,
    uploadPDF,
    showAlert,
    formatDate
};

// Initialisation automatique au chargement
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
