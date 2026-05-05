// ========================================
// Gestion de l'authentification
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initMobileNav();
});

// État global de l'authentification
let currentUser = null;
let userProfile = null;

async function initAuth() {
    // Vérifier la session active
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        updateUIForAuth();
    } else {
        updateUIForGuest();
    }
    
    // Écouter les changements d'authentification
    supabase.auth.onAuthStateChange(async (event, session) => {
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
    
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Onglets auth
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById('loginForm').style.display = target === 'login' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = target === 'register' ? 'block' : 'none';
        });
    });
    
    // Mot de passe oublié
    const forgotPassword = document.getElementById('forgotPassword');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            if (!email) {
                showAlert('loginError', 'Veuillez entrer votre email.');
                return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/membres.html'
            });
            if (error) {
                showAlert('loginError', error.message);
            } else {
                showAlert('loginError', 'Email de réinitialisation envoyé !', 'success');
            }
        });
    }
}

async function loadUserProfile() {
    if (!currentUser) return;
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', currentUser.id)
        .single();
    
    if (data) {
        userProfile = data;
    }
}

function updateUIForAuth() {
    const authLink = document.getElementById('authLink');
    if (authLink && userProfile) {
        authLink.innerHTML = `<a href="membres.html" class="btn-login"><i class="fas fa-user-check"></i> ${userProfile.first_name}</a>`;
    }
    
    // Si on est sur la page membres, afficher le dashboard
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    if (authSection && dashboardSection && currentUser) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        populateDashboard();
    }
}

function updateUIForGuest() {
    const authLink = document.getElementById('authLink');
    if (authLink) {
        authLink.innerHTML = `<a href="membres.html" class="btn-login"><i class="fas fa-user"></i> Connexion</a>`;
    }
    
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    if (authSection && dashboardSection) {
        authSection.style.display = 'grid';
        dashboardSection.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        showAlert('loginError', error.message);
    } else {
        currentUser = data.user;
        await loadUserProfile();
        window.location.reload();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const specialty = document.getElementById('regSpecialty').value;
    const hospital = document.getElementById('regHospital').value;
    const year = document.getElementById('regYear').value;
    const phone = document.getElementById('regPhone').value;
    
    // Créer l'utilisateur
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName
            }
        }
    });
    
    if (authError) {
        showAlert('registerError', authError.message);
        return;
    }
    
    // Créer le profil membre
    const { error: profileError } = await supabase
        .from('members')
        .insert([{
            id: authData.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            specialty,
            hospital,
            promotion_year: parseInt(year),
            phone,
            role: 'member',
            is_verified: false
        }]);
    
    if (profileError) {
        showAlert('registerError', profileError.message);
    } else {
        showAlert('registerSuccess', 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte. Votre profil sera validé sous 24-48h.');
        document.getElementById('registerForm').reset();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

function populateDashboard() {
    if (!userProfile) return;
    
    document.getElementById('dashName').textContent = `Dr. ${userProfile.first_name} ${userProfile.last_name}`;
    document.getElementById('dashMeta').textContent = `${userProfile.specialty || ''} • ${userProfile.hospital || ''}`;
    document.getElementById('dashRole').textContent = userProfile.role || 'Membre';
}

function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.className = `alert alert-${type}`;
        setTimeout(() => { el.style.display = 'none'; }, 6000);
    }
}

function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
}
