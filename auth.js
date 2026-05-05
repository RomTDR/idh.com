// ========================================
// Gestion de l'authentification - AsInAIHB
// ========================================

let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initMobileNav();
});

async function initAuth() {
    // Initialiser Supabase
    if (typeof IDH !== 'undefined') {
        IDH.initSupabase();
    }
    
    // Vérifier la session active
    const session = await IDH.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserProfile();
        updateUIForAuth();
    } else {
        updateUIForGuest();
    }
    
    // Écouter les changements d'authentification
    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                currentUser = session.user;
                await loadUserProfile();
                updateUIForAuth();
                showNotification('Connexion réussie ! Bienvenue.', 'success');
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                userProfile = null;
                updateUIForGuest();
                showNotification('Déconnexion réussie.', 'info');
            }
        });
    }
    
    // Formulaire de connexion (page membres)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire d'inscription (page membres)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mot de passe oublié
    const forgotPassword = document.getElementById('forgotPassword');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value;
            if (!email) {
                showAlert('loginError', 'Veuillez entrer votre email.', 'error');
                return;
            }
            const { error } = await IDH.resetPassword(email);
            if (error) {
                showAlert('loginError', error.message, 'error');
            } else {
                showAlert('loginError', 'Email de réinitialisation envoyé ! Vérifiez votre boîte mail.', 'success');
            }
        });
    }
}

async function loadUserProfile() {
    if (!currentUser) return null;
    
    try {
        const { data, error } = await IDH.getMemberProfile(currentUser.id);
        
        if (error && error.code === 'PGRST116') {
            // Profil non trouvé, le créer
            const newProfile = {
                id: currentUser.id,
                email: currentUser.email,
                first_name: currentUser.user_metadata?.first_name || '',
                last_name: currentUser.user_metadata?.last_name || '',
                role: 'member',
                is_verified: false
            };
            await IDH.createMemberProfile(newProfile);
            userProfile = newProfile;
            return newProfile;
        }
        
        if (data) {
            userProfile = data;
            return data;
        }
    } catch (error) {
        console.error('Erreur chargement profil:', error);
    }
    return null;
}

function updateUIForAuth() {
    // Mettre à jour le lien dans la navigation
    const authLink = document.querySelector('.btn-login');
    if (authLink && userProfile) {
        const firstName = userProfile.first_name || 'Membre';
        authLink.innerHTML = `<i class="fas fa-user-check"></i> ${firstName}`;
        authLink.href = 'membres.html';
    }
    
    // Afficher le dashboard si on est sur la page membres
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    if (authSection && dashboardSection && currentUser) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        populateDashboard();
    }
}

function updateUIForGuest() {
    // Mettre à jour le lien dans la navigation
    const authLink = document.querySelector('.btn-login');
    if (authLink) {
        authLink.innerHTML = `<i class="fas fa-user"></i> Espace Membre`;
        authLink.href = 'membres.html';
    }
    
    // Afficher le formulaire d'auth si on est sur la page membres
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    if (authSection && dashboardSection) {
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    
    if (!email || !password) {
        showAlert('loginError', 'Veuillez remplir tous les champs.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await IDH.signIn(email, password);
        
        if (error) {
            showAlert('loginError', error.message, 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        } else {
            currentUser = data.user;
            await loadUserProfile();
            showNotification('Connexion réussie !', 'success');
            setTimeout(() => {
                window.location.href = 'membres.html';
            }, 1000);
        }
    } catch (error) {
        showAlert('loginError', 'Une erreur est survenue.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('regEmail')?.value;
    const password = document.getElementById('regPassword')?.value;
    const passwordConfirm = document.getElementById('regPassword2')?.value;
    const firstName = document.getElementById('regFirstName')?.value;
    const lastName = document.getElementById('regLastName')?.value;
    const specialty = document.getElementById('regSpecialty')?.value;
    const hospital = document.getElementById('regHospital')?.value;
    const year = document.getElementById('regYear')?.value;
    const phone = document.getElementById('regPhone')?.value;
    const terms = document.getElementById('regTerms')?.checked;
    
    // Validations
    if (!email || !password || !firstName || !lastName) {
        showAlert('registerError', 'Veuillez remplir tous les champs obligatoires.', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showAlert('registerError', 'Les mots de passe ne correspondent pas.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('registerError', 'Le mot de passe doit contenir au moins 6 caractères.', 'error');
        return;
    }
    
    if (terms === false) {
        showAlert('registerError', 'Vous devez accepter les conditions d\'utilisation.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    submitBtn.disabled = true;
    
    try {
        const userData = {
            first_name: firstName,
            last_name: lastName,
            specialty: specialty,
            hospital: hospital,
            promotion_year: year ? parseInt(year) : null,
            phone: phone
        };
        
        const { data, error } = await IDH.signUp(email, password, userData);
        
        if (error) {
            showAlert('registerError', error.message, 'error');
        } else {
            showAlert('registerSuccess', '✅ Inscription réussie ! Vérifiez votre email pour confirmer votre compte.', 'success');
            document.getElementById('registerForm')?.reset();
            setTimeout(() => {
                // Basculer vers l'onglet connexion
                const loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                if (loginTab) loginTab.click();
            }, 3000);
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } catch (error) {
        showAlert('registerError', 'Une erreur est survenue.', 'error');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogout() {
    try {
        await IDH.signOut();
        showNotification('Déconnexion réussie.', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
}

function populateDashboard() {
    if (!userProfile) return;
    
    const dashName = document.getElementById('dashName');
    const dashMeta = document.getElementById('dashMeta');
    const dashRole = document.getElementById('dashRole');
    
    if (dashName) {
        dashName.textContent = `Dr. ${userProfile.first_name || ''} ${userProfile.last_name || ''}`;
    }
    
    if (dashMeta) {
        const specialty = userProfile.specialty || 'Spécialité non renseignée';
        const hospital = userProfile.hospital || 'Hôpital non renseigné';
        dashMeta.textContent = `${specialty} • ${hospital}`;
    }
    
    if (dashRole) {
        const roleLabels = {
            'member': 'Membre',
            'reviewer': 'Relecteur',
            'editor': 'Éditeur',
            'admin': 'Administrateur'
        };
        dashRole.textContent = roleLabels[userProfile.role] || 'Membre';
    }
}

function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        el.className = `alert alert-${type}`;
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => {
                el.style.display = 'none';
                el.style.opacity = '1';
            }, 300);
        }, 5000);
    }
}

function showNotification(message, type = 'info') {
    // Créer une notification toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Styles pour la notification
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 12px 20px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#009E60' : type === 'error' ? '#DA121A' : '#FFD700'};
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function initMobileNav() {
    const toggle = document.getElementById('mobileToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });
    }
}

// Exporter les fonctions globales
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
