// ========================================
// Gestion de l'authentification - AsInAIHB
// ========================================

let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

async function initAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        updateUIForAuth();
    } else {
        updateUIForGuest();
    }
    
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            await loadUserProfile();
            updateUIForAuth();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            userProfile = null;
            updateUIForGuest();
        }
    });
    
    // Formulaire connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function loadUserProfile() {
    if (!currentUser) return;
    const { data } = await supabaseClient
        .from('members')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    if (data) userProfile = data;
}

function updateUIForAuth() {
    const authLink = document.querySelector('.btn-login');
    if (authLink && userProfile) {
        authLink.innerHTML = `<i class="fas fa-user-check"></i> ${userProfile.first_name}`;
        authLink.href = "membres.html";
    }
}

function updateUIForGuest() {
    const authLink = document.querySelector('.btn-login');
    if (authLink) {
        authLink.innerHTML = `<i class="fas fa-user"></i> Espace Membre`;
        authLink.href = "membres.html";
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const { error } = await IDH.signIn(email, password);
    
    if (error) {
        showAlert('loginError', error.message);
    } else {
        window.location.href = 'membres.html';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    
    const { error } = await IDH.signUp(email, password, { first_name: firstName, last_name: lastName });
    
    if (error) {
        showAlert('registerError', error.message);
    } else {
        showAlert('registerSuccess', 'Inscription réussie ! Vérifiez votre email.');
    }
}

async function handleLogout() {
    await IDH.signOut();
}

function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.className = `alert alert-${type}`;
        setTimeout(() => { el.style.display = 'none'; }, 5000);
    }
}
