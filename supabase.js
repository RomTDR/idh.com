// ========================================
// SUPABASE CONFIGURATION - AsInAIHB
// Remplacez ces valeurs par les vôtres
// ========================================

const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-cle-anon-ici';

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

// AUTHENTIFICATION
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

// ARTICLES
async function getArticles(filters = {}) {
    let query = supabaseClient
        .from('articles')
        .select('*')
        .eq('status', 'published')
        .order('publication_date', { ascending: false });
    
    if (filters.specialty) {
        query = query.eq('specialty', filters.specialty);
    }
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,abstract.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    return { data, error };
}

async function submitArticle(articleData) {
    const { data, error } = await supabaseClient
        .from('articles')
        .insert([articleData]);
    return { data, error };
}

// MEMBRES
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

// Export global
window.IDH = {
    initSupabase,
    signUp,
    signIn,
    signOut,
    getUser,
    getArticles,
    submitArticle,
    getMemberProfile,
    updateMemberProfile
};

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});
