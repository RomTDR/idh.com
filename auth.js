// ========================================
// Gestion de l'authentification - AsInAIHB
// Version corrigée pour les inscriptions
// ========================================

let currentUser = null;
let userProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

async function initAuth() {
    // Initialiser Supabase
    if (typeof IDH !== 'undefined' && IDH.initSupabase) {
        IDH.initSupabase();
    }
    
    try {
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
        if (window.supabaseClient) {
            window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    currentUser = session.user;
                    await loadUserProfile();
                    updateUIForAuth();
                    showMessage('✅ Connexion réussie !', 'success');
                } else if (event === 'SIGNED_OUT') {
                    currentUser = null;
                    userProfile = null;
                    updateUIForGuest();
                    showMessage('Déconnexion réussie.', 'info');
                }
            });
        }
    } catch (error) {
        console.error('Erreur initAuth:', error);
        updateUIForGuest();
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
                is_verified: false,
                created_at: new Date()
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
    // Afficher le dashboard
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (authSection && dashboardSection && currentUser) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        if (userProfile) {
            populateDashboard();
        }
        
        // Charger les données du dashboard
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    }
}

function updateUIForGuest() {
    const authSection = document.getElementById('authSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (authSection && dashboardSection) {
        authSection.style.display = 'grid';
        dashboardSection.style.display = 'none';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
        showError(errorDiv, 'Veuillez remplir tous les champs');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await IDH.signIn(email, password);
        
        if (error) {
            showError(errorDiv, error.message);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        } else {
            currentUser = data.user;
            await loadUserProfile();
            showMessage('✅ Connexion réussie !', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error) {
        showError(errorDiv, 'Une erreur est survenue');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('regEmail')?.value;
    const password = document.getElementById('regPassword')?.value;
    const passwordConfirm = document.getElementById('regPassword2')?.value;
    const firstName = document.getElementById('regFirstName')?.value;
    const lastName = document.getElementById('regLastName')?.value;
    const specialty = document.getElementById('regSpecialty')?.value;
    const hospital = document.getElementById('regHospital')?.value;
    const year = document.getElementById('regYear')?.value;
    const phone = document.getElementById('regPhone')?.value;
    
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    // Validations
    if (!email || !password || !firstName || !lastName || !specialty || !hospital || !year) {
        showError(errorDiv, 'Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    if (password !== passwordConfirm) {
        showError(errorDiv, 'Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        showError(errorDiv, 'Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    submitBtn.disabled = true;
    
    try {
        // Données utilisateur pour metadata
        const userData = {
            first_name: firstName,
            last_name: lastName,
            specialty: specialty,
            hospital: hospital,
            promotion_year: parseInt(year),
            phone: phone
        };
        
        // Inscription avec Supabase
        const { data, error } = await IDH.signUp(email, password, userData);
        
        if (error) {
            showError(errorDiv, error.message);
        } else {
            // Succès
            successDiv.style.display = 'block';
            successDiv.innerHTML = '✅ Inscription réussie ! Vérifiez votre email pour confirmer votre compte.';
            errorDiv.style.display = 'none';
            
            // Réinitialiser le formulaire
            document.getElementById('registerForm').reset();
            
            // Basculer vers l'onglet connexion après 3 secondes
            setTimeout(() => {
                showAuthTab('login');
                successDiv.style.display = 'none';
            }, 3000);
        }
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } catch (error) {
        showError(errorDiv, 'Une erreur est survenue: ' + error.message);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogout() {
    try {
        await IDH.signOut();
        showMessage('Déconnexion réussie', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
}

async function forgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail')?.value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email) {
        showError(errorDiv, 'Veuillez entrer votre email');
        return;
    }
    
    const { error } = await IDH.resetPassword(email);
    
    if (error) {
        showError(errorDiv, error.message);
    } else {
        showError(errorDiv, '📧 Email de réinitialisation envoyé ! Vérifiez votre boîte mail.', 'success');
    }
}

function showError(element, message, type = 'error') {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        if (type === 'success') {
            element.className = 'alert alert-success';
        } else {
            element.className = 'alert alert-error';
        }
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

function showMessage(message, type = 'info') {
    console.log(message);
    // Optionnel: ajouter une notification toast
}

function populateDashboard() {
    if (!userProfile) return;
    
    const dashName = document.getElementById('dashName');
    const dashMeta = document.getElementById('dashMeta');
    
    if (dashName) {
        dashName.textContent = `Dr. ${userProfile.first_name || ''} ${userProfile.last_name || ''}`;
    }
    
    if (dashMeta) {
        const specialty = userProfile.specialty || 'Spécialité non renseignée';
        const hospital = userProfile.hospital || 'Hôpital non renseigné';
        dashMeta.textContent = `${specialty} • ${hospital}`;
    }
}

function showAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

// Exporter les fonctions globales
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.forgotPassword = forgotPassword;
window.showAuthTab = showAuthTab;
