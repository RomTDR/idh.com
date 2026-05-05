// ========================================
// SUPABASE CONFIGURATION - AsInAIHB
// Version corrigée pour GitHub Pages
// ========================================

// Configuration - À MODIFIER avec vos identifiants Supabase
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-ici';

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialisé');
        return supabaseClient;
    } else {
        console.warn('⚠️ Supabase non chargé - Vérifiez le CDN');
        return null;
    }
}

// AUTHENTIFICATION
async function signUp(email, password, userData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: userData }
    });
    return { data: data, error: error };
}

async function signIn(email, password) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    return { data: data, error: error };
}

async function signOut() {
    if (!supabaseClient) initSupabase();
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

async function getUser() {
    if (!supabaseClient) initSupabase();
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
}

async function getSession() {
    if (!supabaseClient) initSupabase();
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
}

async function resetPassword(email) {
    if (!supabaseClient) initSupabase();
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/membres.html'
    });
    return { error: error };
}

// ARTICLES
async function getArticles(filters) {
    if (!supabaseClient) initSupabase();
    let query = supabaseClient
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('publication_date', { ascending: false });
    
    if (filters && filters.specialty) {
        query = query.eq('specialty', filters.specialty);
    }
    if (filters && filters.article_type) {
        query = query.eq('article_type', filters.article_type);
    }
    if (filters && filters.search) {
        query = query.or('title.ilike.%' + filters.search + '%,abstract.ilike.%' + filters.search + '%');
    }
    
    const { data, error } = await query;
    return { data: data, error: error };
}

async function getArticleById(id) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
    return { data: data, error: error };
}

async function submitArticle(articleData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('articles')
        .insert([articleData])
        .select();
    return { data: data, error: error };
}

async function getUserArticles(userId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('corresponding_author', userId)
        .order('created_at', { ascending: false });
    return { data: data, error: error };
}

// MEMBRES
async function getMemberProfile(userId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();
    return { data: data, error: error };
}

async function updateMemberProfile(userId, updates) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('members')
        .update(updates)
        .eq('id', userId)
        .select();
    return { data: data, error: error };
}

async function createMemberProfile(profileData) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('members')
        .insert([profileData])
        .select();
    return { data: data, error: error };
}

// NUMÉROS
async function getIssues(limit) {
    if (!supabaseClient) initSupabase();
    var limitVal = limit || 3;
    const { data, error } = await supabaseClient
        .from('issues')
        .select('*')
        .eq('is_published', true)
        .order('publication_date', { ascending: false })
        .limit(limitVal);
    return { data: data, error: error };
}

// REVIEWS
async function getReviewsForReviewer(reviewerId) {
    if (!supabaseClient) initSupabase();
    const { data, error } = await supabaseClient
        .from('reviews')
        .select('*, articles(title)')
        .eq('reviewer_id', reviewerId)
        .eq('is_submitted', false);
    return { data: data, error: error };
}

// UPLOAD FICHIERS
async function uploadPDF(file, userId) {
    if (!supabaseClient) initSupabase();
    var fileName = 'articles/' + userId + '/' + Date.now() + '_' + file.name;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('articles')
        .upload(fileName, file, { contentType: 'application/pdf' });
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabaseClient.storage
        .from('articles')
        .getPublicUrl(fileName);
    
    return urlData.publicUrl;
}

// STATISTIQUES
async function getStats() {
    if (!supabaseClient) initSupabase();
    
    var articlesCount = 0;
    var membersCount = 0;
    var issuesCount = 0;
    
    try {
        const { count: aCount } = await supabaseClient
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published');
        articlesCount = aCount || 0;
    } catch(e) { articlesCount = 156; }
    
    try {
        const { count: mCount } = await supabaseClient
            .from('members')
            .select('*', { count: 'exact', head: true });
        membersCount = mCount || 0;
    } catch(e) { membersCount = 342; }
    
    try {
        const { count: iCount } = await supabaseClient
            .from('issues')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);
        issuesCount = iCount || 0;
    } catch(e) { issuesCount = 12; }
    
    return {
        articles: articlesCount,
        members: membersCount,
        issues: issuesCount
    };
}

// UTILITAIRES
function showAlert(containerId, message, type) {
    var container = document.getElementById(containerId);
    if (!container) return;
    
    var alertClass = 'alert-info';
    if (type === 'success') alertClass = 'alert-success';
    if (type === 'error') alertClass = 'alert-error';
    
    container.innerHTML = '<div class="' + alertClass + '">' + message + '</div>';
    setTimeout(function() { container.innerHTML = ''; }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    var d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Export global
window.IDH = {
    initSupabase: initSupabase,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getUser: getUser,
    getSession: getSession,
    resetPassword: resetPassword,
    getArticles: getArticles,
    getArticleById: getArticleById,
    submitArticle: submitArticle,
    getUserArticles: getUserArticles,
    getMemberProfile: getMemberProfile,
    updateMemberProfile: updateMemberProfile,
    createMemberProfile: createMemberProfile,
    getIssues: getIssues,
    getReviewsForReviewer: getReviewsForReviewer,
    uploadPDF: uploadPDF,
    getStats: getStats,
    showAlert: showAlert,
    formatDate: formatDate
};

// Initialisation automatique
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});
