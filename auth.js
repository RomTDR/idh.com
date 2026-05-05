// ========================================
// Gestion de l'authentification - AsInAIHB
// Version corrigée pour GitHub Pages
// ========================================

var currentUser = null;
var userProfile = null;

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initMobileNav();
});

async function initAuth() {
    if (typeof IDH !== 'undefined' && IDH.initSupabase) {
        IDH.initSupabase();
    }
    
    try {
        var session = await IDH.getSession();
        
        if (session) {
            currentUser = session.user;
            await loadUserProfile();
            updateUIForAuth();
        } else {
            updateUIForGuest();
        }
    } catch(e) {
        console.log('Erreur auth:', e);
        updateUIForGuest();
    }
    
    // Formulaire de connexion
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulaire d'inscription
    var registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Déconnexion
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function loadUserProfile() {
    if (!currentUser) return null;
    
    try {
        var result = await IDH.getMemberProfile(currentUser.id);
        
        if (result.error && result.error.code === 'PGRST116') {
            var newProfile = {
                id: currentUser.id,
                email: currentUser.email,
                first_name: (currentUser.user_metadata && currentUser.user_metadata.first_name) || '',
                last_name: (currentUser.user_metadata && currentUser.user_metadata.last_name) || '',
                role: 'member',
                is_verified: false
            };
            await IDH.createMemberProfile(newProfile);
            userProfile = newProfile;
            return newProfile;
        }
        
        if (result.data) {
            userProfile = result.data;
            return result.data;
        }
    } catch(e) {
        console.error('Erreur chargement profil:', e);
    }
    return null;
}

function updateUIForAuth() {
    var authLink = document.querySelector('.btn-login');
    if (authLink && userProfile) {
        var firstName = userProfile.first_name || 'Membre';
        authLink.innerHTML = '<i class="fas fa-user-check"></i> ' + firstName;
        authLink.href = 'membres.html';
    }
    
    var authSection = document.getElementById('authSection');
    var dashboardSection = document.getElementById('dashboardSection');
    if (authSection && dashboardSection && currentUser) {
        authSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        if (typeof populateDashboard === 'function') {
            populateDashboard();
        }
    }
}

function updateUIForGuest() {
    var authLink = document.querySelector('.btn-login');
    if (authLink) {
        authLink.innerHTML = '<i class="fas fa-user"></i> Espace Membre';
        authLink.href = 'membres.html';
    }
    
    var authSection = document.getElementById('authSection');
    var dashboardSection = document.getElementById('dashboardSection');
    if (authSection && dashboardSection) {
        authSection.style.display = 'block';
        dashboardSection.style.display = 'none';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showLoginError('Veuillez remplir tous les champs.');
        return;
    }
    
    var btn = e.target.querySelector('button[type="submit"]');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    btn.disabled = true;
    
    try {
        var result = await IDH.signIn(email, password);
        
        if (result.error) {
            showLoginError(result.error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        } else {
            currentUser = result.data.user;
            await loadUserProfile();
            showNotification('Connexion réussie !', 'success');
            setTimeout(function() {
                window.location.href = 'membres.html';
            }, 1000);
        }
    } catch(e) {
        showLoginError('Une erreur est survenue.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    var email = document.getElementById('regEmail').value;
    var password = document.getElementById('regPassword').value;
    var passwordConfirm = document.getElementById('regPassword2').value;
    var firstName = document.getElementById('regFirstName').value;
    var lastName = document.getElementById('regLastName').value;
    var specialty = document.getElementById('regSpecialty').value;
    var hospital = document.getElementById('regHospital').value;
    var year = document.getElementById('regYear').value;
    var phone = document.getElementById('regPhone').value;
    
    if (!email || !password || !firstName || !lastName) {
        showRegisterError('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    if (password !== passwordConfirm) {
        showRegisterError('Les mots de passe ne correspondent pas.');
        return;
    }
    
    if (password.length < 6) {
        showRegisterError('Le mot de passe doit contenir au moins 6 caract�res.');
        return;
    }
    
    var btn = e.target.querySelector('button[type="submit"]');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cr�ation...';
    btn.disabled = true;
    
    try {
        var userData = {
            first_name: firstName,
            last_name: lastName,
            specialty: specialty,
            hospital: hospital,
            promotion_year: year ? parseInt(year) : null,
            phone: phone
        };
        
        var result = await IDH.signUp(email, password, userData);
        
        if (result.error) {
            showRegisterError(result.error.message);
        } else {
            showRegisterSuccess('✅ Inscription réussie ! Vérifiez votre email pour confirmer.');
            document.getElementById('registerForm').reset();
            setTimeout(function() {
                var loginTab = document.querySelector('.auth-tab[data-tab="login"]');
                if (loginTab && typeof loginTab.click === 'function') loginTab.click();
            }, 3000);
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
    } catch(e) {
        showRegisterError('Une erreur est survenue.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleLogout() {
    try {
        await IDH.signOut();
        showNotification('Déconnexion réussie.', 'info');
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 500);
    } catch(e) {
        console.error('Erreur déconnexion:', e);
    }
}

function populateDashboard() {
    if (!userProfile) return;
    
    var dashName = document.getElementById('dashName');
    var dashMeta = document.getElementById('dashMeta');
    var dashRole = document.getElementById('dashRole');
    
    if (dashName) {
        dashName.textContent = 'Dr. ' + (userProfile.first_name || '') + ' ' + (userProfile.last_name || '');
    }
    
    if (dashMeta) {
        var specialty = userProfile.specialty || 'Spécialité non renseignée';
        var hospital = userProfile.hospital || 'Hôpital non renseigné';
        dashMeta.textContent = specialty + ' • ' + hospital;
    }
    
    if (dashRole) {
        var roleLabels = {
            'member': 'Membre',
            'reviewer': 'Relecteur',
            'editor': 'Éditeur',
            'admin': 'Administrateur'
        };
        dashRole.textContent = roleLabels[userProfile.role] || 'Membre';
    }
}

function showLoginError(message) {
    var el = document.getElementById('loginError');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(function() { el.style.display = 'none'; }, 5000);
    }
}

function showRegisterError(message) {
    var el = document.getElementById('registerError');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(function() { el.style.display = 'none'; }, 5000);
    }
}

function showRegisterSuccess(message) {
    var el = document.getElementById('registerSuccess');
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(function() { el.style.display = 'none'; }, 5000);
    }
}

function showNotification(message, type) {
    console.log('Notification:', message);
    alert(message);
}

function initMobileNav() {
    var toggle = document.getElementById('mobileToggle');
    var menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', function() {
            menu.classList.toggle('active');
        });
    }
}

// Exporter les fonctions globales
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
