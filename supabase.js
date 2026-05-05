// ========================================
// SUPABASE CONFIGURATION
// Remplacez ces valeurs par les vôtres après création du projet
// ========================================

const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-ici';

// Initialisation Supabase (chargé via CDN dans HTML)
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialisé');
        return supabaseClient;
    } else {
        console.warn('⚠️ Supabase non chargé');
        return null;
    }
}

// ========================================
// AUTHENTIFICATION
// ========================================

async function signUp(email, password, userData) {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: userData }
    });
    return { data, error };
}

async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });
    return { data, error };
}

async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

async function getUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

async function getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

// ========================================
// ARTICLES (Revue)
// ========================================

async function getArticles(filters = {}) {
    let query = supabaseClient
        .from('articles')
        .select('*')
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
    const { data, error } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();
    return { data, error };
}

async function submitArticle(articleData) {
    const { data, error } = await supabaseClient
        .from('articles')
        .insert([articleData]);
    return { data, error };
}

// ========================================
// MEMBRES
// ========================================

async function getMemberProfile(userId) {
    const { data, error } = await supabaseClient
        .from('members')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
}

async function updateMemberProfile(userId, updates) {
    const { data, error } = await supabaseClient
        .from('members')
        .update(updates)
        .eq('id', userId);
    return { data, error };
}

// ========================================
// UI HELPERS
// ========================================

function showAlert(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Export pour utilisation dans les pages
window.IDH = {
    initSupabase,
    signUp,
    signIn,
    signOut,
    getUser,
    getSession,
    getArticles,
    getArticleById,
    submitArticle,
    getMemberProfile,
    updateMemberProfile,
    showAlert,
    formatDate
};
