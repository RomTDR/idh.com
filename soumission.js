// ========================================
// Soumission d'articles - AsInAIHB
// Version corrigée pour GitHub Pages
// ========================================

var currentUserGlobal = null;

document.addEventListener('DOMContentLoaded', function() {
    initSubmissionForm();
    initDropzone();
    initAbstractCounter();
    initAddAuthor();
    restoreDraft();
});

function initSubmissionForm() {
    var form = document.getElementById('submitForm');
    if (!form) return;

    setTimeout(async function() {
        if (typeof IDH !== 'undefined') {
            var user = await IDH.getUser();
            currentUserGlobal = user;
        }
        
        if (!currentUserGlobal) {
            form.innerHTML = '<div class="text-center" style="padding: 50px;">' +
                '<i class="fas fa-lock" style="font-size: 3rem; color: #DA121A;"></i>' +
                '<h3 style="margin: 20px 0;">Connexion requise</h3>' +
                '<p>Vous devez être connecté pour soumettre un article.</p>' +
                '<a href="membres.html" class="btn btn-primary" style="margin-top: 20px;">Se connecter</a>' +
                '</div>';
            return;
        }
        
        form.addEventListener('submit', handleSubmit);
    }, 500);
    
    var saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }
}

function initAddAuthor() {
    var btn = document.getElementById('addAuthorBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        var container = document.getElementById('authorsList');
        var index = container.children.length;

        var row = document.createElement('div');
        row.className = 'author-row';
        row.style.cssText = 'border-top: 1px solid #eee; margin-top: 15px; padding-top: 15px;';
        row.dataset.index = index;
        row.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">' +
            '<strong style="color: #004225;">Auteur ' + (index + 1) + '</strong>' +
            '<button type="button" class="btn-remove" onclick="this.closest(\'.author-row\').remove()" style="background: none; border: none; color: #DA121A; cursor: pointer;">' +
            '<i class="fas fa-trash"></i> Supprimer</button>' +
            '</div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>Prénom *</label><input type="text" class="auth-firstname" required placeholder="Prénom"></div>' +
            '<div class="form-group"><label>Nom *</label><input type="text" class="auth-lastname" required placeholder="Nom"></div>' +
            '<div class="form-group"><label>Email *</label><input type="email" class="auth-email" required placeholder="Email"></div>' +
            '</div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>Affiliation *</label><input type="text" class="auth-affiliation" required placeholder="Ex: CNHU-HKM, Cotonou"></div>' +
            '<div class="form-group"><label>ORCID</label><input type="text" class="auth-orcid" placeholder="0000-0000-0000-0000"></div>' +
            '</div>' +
            '<label style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">' +
            '<input type="radio" name="corresponding" class="auth-corresponding" value="' + index + '">' +
            '<span style="font-size: 0.85rem;">Auteur correspondant</span></label>';
        container.appendChild(row);
    });
}

function initDropzone() {
    var dropzone = document.getElementById('dropzone');
    var fileInput = document.getElementById('subFile');
    if (!dropzone || !fileInput) return;

    fileInput.style.display = 'none';
    
    dropzone.addEventListener('click', function(e) {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(function(eventName) {
        dropzone.addEventListener(eventName, function() {
            dropzone.classList.add('dragover');
            dropzone.style.borderColor = '#DA121A';
            dropzone.style.background = 'rgba(218, 18, 26, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(function(eventName) {
        dropzone.addEventListener(eventName, function() {
            dropzone.classList.remove('dragover');
            dropzone.style.borderColor = '#004225';
            dropzone.style.background = '';
        }, false);
    });

    dropzone.addEventListener('drop', function(e) {
        var files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            updateDropzoneText(files[0].name);
        }
    });

    fileInput.addEventListener('change', function() {
        if (fileInput.files.length) {
            updateDropzoneText(fileInput.files[0].name);
        }
    });
}

function updateDropzoneText(filename) {
    var dropzone = document.getElementById('dropzone');
    if (dropzone) {
        dropzone.innerHTML = '<i class="fas fa-file-pdf" style="font-size: 2rem; color: #DA121A;"></i>' +
            '<p style="margin-top: 10px;"><strong style="color: #004225;">' + filename + '</strong><br>' +
            '<small style="color: #666;">Cliquez pour changer de fichier</small></p>' +
            '<input type="file" id="subFile" accept=".pdf" style="display: none;">';
        
        var newFileInput = document.getElementById('subFile');
        if (newFileInput) {
            newFileInput.addEventListener('change', function() {
                if (newFileInput.files.length) {
                    updateDropzoneText(newFileInput.files[0].name);
                }
            });
        }
    }
}

function initAbstractCounter() {
    var textarea = document.getElementById('subAbstract');
    var counter = document.getElementById('abstractCount');
    if (!textarea || !counter) return;

    textarea.addEventListener('input', function() {
        var count = textarea.value.length;
        counter.textContent = count;
        if (count > 3000) {
            counter.style.color = '#DA121A';
        } else {
            counter.style.color = '#666';
        }
    });
}

function saveDraft() {
    var formData = {
        title: document.getElementById('subTitle') ? document.getElementById('subTitle').value : '',
        type: document.getElementById('subType') ? document.getElementById('subType').value : '',
        specialty: document.getElementById('subSpecialty') ? document.getElementById('subSpecialty').value : '',
        abstract: document.getElementById('subAbstract') ? document.getElementById('subAbstract').value : '',
        keywords: document.getElementById('subKeywords') ? document.getElementById('subKeywords').value : '',
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('articleDraft', JSON.stringify(formData));
    showAlert('submitSuccess', '✅ Brouillon enregistré localement !', 'success');
}

function restoreDraft() {
    var draft = localStorage.getItem('articleDraft');
    if (!draft) return;

    try {
        var data = JSON.parse(draft);
        
        if (data.title && document.getElementById('subTitle')) {
            document.getElementById('subTitle').value = data.title;
        }
        if (data.type && document.getElementById('subType')) {
            document.getElementById('subType').value = data.type;
        }
        if (data.specialty && document.getElementById('subSpecialty')) {
            document.getElementById('subSpecialty').value = data.specialty;
        }
        if (data.abstract && document.getElementById('subAbstract')) {
            document.getElementById('subAbstract').value = data.abstract;
            if (document.getElementById('abstractCount')) {
                document.getElementById('abstractCount').textContent = data.abstract.length;
            }
        }
        if (data.keywords && document.getElementById('subKeywords')) {
            document.getElementById('subKeywords').value = data.keywords;
        }
        
        showAlert('submitSuccess', '📝 Brouillon restauré automatiquement', 'info');
    } catch(e) {
        console.log('Erreur restauration brouillon:', e);
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUserGlobal) {
        showAlert('submitError', 'Vous devez être connecté pour soumettre.', 'error');
        return;
    }

    var btn = e.target.querySelector('button[type="submit"]');
    var originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Soumission en cours...';
    btn.disabled = true;

    try {
        var title = document.getElementById('subTitle').value.trim();
        var type = document.getElementById('subType').value;
        var specialty = document.getElementById('subSpecialty').value;
        var abstract = document.getElementById('subAbstract').value.trim();
        var keywordsRaw = document.getElementById('subKeywords').value;
        var confirmCheck = document.getElementById('subConfirm') ? document.getElementById('subConfirm').checked : false;

        if (!title) throw new Error('Veuillez saisir le titre.');
        if (!type) throw new Error('Veuillez sélectionner le type.');
        if (!specialty) throw new Error('Veuillez sélectionner la spécialité.');
        if (!abstract) throw new Error('Veuillez saisir le résumé.');
        if (abstract.length > 3000) throw new Error('Le résumé ne doit pas dépasser 3000 caractères.');
        
        var keywords = keywordsRaw ? keywordsRaw.split(',').map(function(k) { return k.trim(); }).filter(function(k) { return k; }) : [];
        if (keywords.length === 0) throw new Error('Veuillez saisir au moins un mot-clé.');
        
        if (!confirmCheck) throw new Error('Vous devez certifier l\'originalité du travail.');
        
        // Collecter les auteurs
        var authorRows = document.querySelectorAll('.author-row');
        var authors = [];
        
        if (authorRows.length === 0) {
            throw new Error('Veuillez ajouter au moins un auteur.');
        }
        
        for (var i = 0; i < authorRows.length; i++) {
            var row = authorRows[i];
            var firstName = row.querySelector('.auth-firstname') ? row.querySelector('.auth-firstname').value.trim() : '';
            var lastName = row.querySelector('.auth-lastname') ? row.querySelector('.auth-lastname').value.trim() : '';
            var email = row.querySelector('.auth-email') ? row.querySelector('.auth-email').value.trim() : '';
            var affiliation = row.querySelector('.auth-affiliation') ? row.querySelector('.auth-affiliation').value.trim() : '';
            var orcid = row.querySelector('.auth-orcid') ? row.querySelector('.auth-orcid').value.trim() : '';
            
            if (!firstName || !lastName || !email || !affiliation) {
                throw new Error('Veuillez remplir tous les champs de l\'auteur ' + (i + 1));
            }
            
            authors.push({ first_name: firstName, last_name: lastName, email: email, affiliation: affiliation, orcid: orcid });
        }
        
        // Upload du PDF (simulé pour l'instant)
        var pdfUrl = null;
        var fileInput = document.getElementById('subFile');
        if (fileInput && fileInput.files.length > 0) {
            var file = fileInput.files[0];
            if (file.size > 20 * 1024 * 1024) {
                throw new Error('Le fichier ne doit pas dépasser 20 Mo.');
            }
            if (file.type !== 'application/pdf') {
                throw new Error('Seuls les fichiers PDF sont acceptés.');
            }
            
            // Simulation d'upload (à remplacer par vrai upload)
            pdfUrl = 'https://example.com/pdf/' + Date.now() + '.pdf';
        } else {
            throw new Error('Veuillez joindre votre manuscrit au format PDF.');
        }
        
        // Préparer les données
        var articleData = {
            title: title,
            abstract: abstract,
            keywords: keywords,
            authors: authors,
            specialty: specialty,
            article_type: type,
            status: 'submitted',
            corresponding_author: currentUserGlobal.id,
            pdf_url: pdfUrl,
            is_free: false,
            created_at: new Date().toISOString()
        };
        
        console.log('Article soumis:', articleData);
        
        localStorage.removeItem('articleDraft');
        showAlert('submitSuccess', '✅ Article soumis avec succès !', 'success');
        
        // Réinitialiser le formulaire
        document.getElementById('submitForm').reset();
        
        if (document.getElementById('abstractCount')) {
            document.getElementById('abstractCount').textContent = '0';
        }
        
        // Réinitialiser le dropzone
        var dropzone = document.getElementById('dropzone');
        if (dropzone) {
            dropzone.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #004225;"></i>' +
                '<p>Glissez-déposez votre PDF ici ou <span style="color: #DA121A; cursor: pointer;">cliquez pour parcourir</span></p>' +
                '<input type="file" id="subFile" accept=".pdf" style="display: none;">';
            initDropzone();
        }
        
        setTimeout(function() {
            if (confirm('Article soumis avec succès ! Voulez-vous voir vos soumissions ?')) {
                window.location.href = 'membres.html';
            }
        }, 3000);
        
    } catch(error) {
        console.error('Erreur soumission:', error);
        showAlert('submitError', 'Erreur : ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function showAlert(elementId, message, type) {
    var el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        if (type === 'success') {
            el.style.background = 'rgba(0, 158, 96, 0.1)';
            el.style.border = '1px solid #009E60';
            el.style.color = '#009E60';
        } else if (type === 'error') {
            el.style.background = 'rgba(218, 18, 26, 0.1)';
            el.style.border = '1px solid #DA121A';
            el.style.color = '#DA121A';
        } else {
            el.style.background = 'rgba(255, 215, 0, 0.1)';
            el.style.border = '1px solid #FFD700';
            el.style.color = '#004225';
        }
        setTimeout(function() { el.style.display = 'none'; }, 6000);
    }
}
