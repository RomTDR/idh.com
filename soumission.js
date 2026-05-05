// ========================================
// Soumission d'articles - AsInAIHB
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initSubmissionForm();
    initDropzone();
    initAbstractCounter();
    initAddAuthor();
    restoreDraft();
});

function initSubmissionForm() {
    const form = document.getElementById('submitForm');
    if (!form) return;

    // Vérifier si l'utilisateur est connecté
    if (!currentUser) {
        form.innerHTML = `
            <div class="text-center" style="padding: 50px;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #DA121A;"></i>
                <h3 style="margin: 20px 0;">Connexion requise</h3>
                <p>Vous devez être connecté pour soumettre un article.</p>
                <a href="membres.html" class="btn btn-primary" style="margin-top: 20px;">Se connecter</a>
            </div>
        `;
        return;
    }

    form.addEventListener('submit', handleSubmit);
    document.getElementById('saveDraftBtn')?.addEventListener('click', saveDraft);
}

function initAddAuthor() {
    const btn = document.getElementById('addAuthorBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const container = document.getElementById('authorsList');
        const index = container.children.length;

        const row = document.createElement('div');
        row.className = 'author-row';
        row.style.cssText = 'border-top: 1px solid #eee; margin-top: 15px; padding-top: 15px;';
        row.dataset.index = index;
        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong style="color: #004225;">Auteur ${index + 1}</strong>
                <button type="button" class="btn-remove" onclick="this.closest('.author-row').remove()" style="background: none; border: none; color: #DA121A; cursor: pointer;">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Prénom *</label>
                    <input type="text" class="auth-firstname" required placeholder="Prénom">
                </div>
                <div class="form-group">
                    <label>Nom *</label>
                    <input type="text" class="auth-lastname" required placeholder="Nom">
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" class="auth-email" required placeholder="Email">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Affiliation *</label>
                    <input type="text" class="auth-affiliation" required placeholder="Ex: CNHU-HKM, Cotonou">
                </div>
                <div class="form-group">
                    <label>ORCID (optionnel)</label>
                    <input type="text" class="auth-orcid" placeholder="0000-0000-0000-0000">
                </div>
            </div>
            <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; margin-top: 10px;">
                <input type="radio" name="corresponding" class="auth-corresponding" value="${index}">
                Auteur correspondant
            </label>
        `;
        container.appendChild(row);
    });
}

function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('subFile');
    if (!dropzone || !fileInput) return;

    // Cacher l'input file et utiliser le dropzone
    fileInput.style.display = 'none';
    
    // Gérer le clic sur le dropzone
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Gérer les événements drag & drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('dragover');
            dropzone.style.borderColor = '#DA121A';
            dropzone.style.background = 'rgba(218, 18, 26, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('dragover');
            dropzone.style.borderColor = '#004225';
            dropzone.style.background = '';
        }, false);
    });

    dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            updateDropzoneText(files[0].name);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            updateDropzoneText(fileInput.files[0].name);
        }
    });
}

function updateDropzoneText(filename) {
    const dropzone = document.getElementById('dropzone');
    dropzone.innerHTML = `
        <i class="fas fa-file-pdf" style="font-size: 2rem; color: #DA121A;"></i>
        <p><strong>${filename}</strong><br><small style="color: #666;">Cliquez pour changer de fichier</small></p>
        <input type="file" id="subFile" accept=".pdf" style="display: none;">
    `;
    
    // Réattacher l'événement click
    const newFileInput = document.getElementById('subFile');
    if (newFileInput) {
        newFileInput.addEventListener('change', () => {
            if (newFileInput.files.length) {
                updateDropzoneText(newFileInput.files[0].name);
            }
        });
    }
}

function initAbstractCounter() {
    const textarea = document.getElementById('subAbstract');
    const counter = document.getElementById('abstractCount');
    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        const count = textarea.value.length;
        counter.textContent = count;
        if (count > 3000) {
            counter.style.color = '#DA121A';
        } else {
            counter.style.color = '#666';
        }
    });
}

function saveDraft() {
    const formData = {
        title: document.getElementById('subTitle')?.value,
        type: document.getElementById('subType')?.value,
        specialty: document.getElementById('subSpecialty')?.value,
        abstract: document.getElementById('subAbstract')?.value,
        keywords: document.getElementById('subKeywords')?.value,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('articleDraft', JSON.stringify(formData));
    showAlert('submitSuccess', '✅ Brouillon enregistré localement !', 'success');
}

function restoreDraft() {
    const draft = localStorage.getItem('articleDraft');
    if (!draft) return;

    try {
        const data = JSON.parse(draft);
        if (document.getElementById('subTitle')) document.getElementById('subTitle').value = data.title || '';
        if (document.getElementById('subType')) document.getElementById('subType').value = data.type || '';
        if (document.getElementById('subSpecialty')) document.getElementById('subSpecialty').value = data.specialty || '';
        if (document.getElementById('subAbstract')) document.getElementById('subAbstract').value = data.abstract || '';
        if (document.getElementById('subKeywords')) document.getElementById('subKeywords').value = data.keywords || '';
        
        if (data.abstract) {
            document.getElementById('abstractCount').textContent = data.abstract.length;
        }
        
        showAlert('submitSuccess', '📝 Brouillon restauré automatiquement', 'info');
    } catch (e) {
        console.log('Erreur restauration brouillon');
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        showAlert('submitError', 'Vous devez être connecté pour soumettre.', 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Soumission en cours...';
    btn.disabled = true;

    try {
        const title = document.getElementById('subTitle').value;
        const type = document.getElementById('subType').value;
        const specialty = document.getElementById('subSpecialty').value;
        const abstract = document.getElementById('subAbstract').value;
        const keywords = document.getElementById('subKeywords').value
            .split(',').map(k => k.trim()).filter(k => k);
        const fileInput = document.getElementById('subFile');

        // Validation
        if (!title || !type || !specialty || !abstract || !keywords.length) {
            throw new Error('Veuillez remplir tous les champs obligatoires.');
        }

        // Collecter les auteurs
        const authorRows = document.querySelectorAll('.author-row');
        const authors = [];
        let correspondingIndex = 0;

        authorRows.forEach((row, idx) => {
            const firstName = row.querySelector('.auth-firstname')?.value;
            const lastName = row.querySelector('.auth-lastname')?.value;
            const email = row.querySelector('.auth-email')?.value;
            const affiliation = row.querySelector('.auth-affiliation')?.value;
            const orcid = row.querySelector('.auth-orcid')?.value;
            const isCorresponding = row.querySelector('.auth-corresponding')?.checked;

            if (firstName && lastName && email && affiliation) {
                authors.push({ first_name: firstName, last_name: lastName, email, affiliation, orcid });
                if (isCorresponding) correspondingIndex = idx;
            }
        });

        if (authors.length === 0) {
            throw new Error('Veuillez ajouter au moins un auteur.');
        }

        // Upload du PDF si présent
        let pdfUrl = null;
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 20 * 1024 * 1024) {
                throw new Error('Le fichier ne doit pas dépasser 20 Mo.');
            }
            if (file.type !== 'application/pdf') {
                throw new Error('Seuls les fichiers PDF sont acceptés.');
            }

            pdfUrl = await IDH.uploadPDF(file, currentUser.id);
        }

        // Insérer l'article
        const articleData = {
            title,
            abstract,
            keywords,
            authors: authors,
            specialty,
            article_type: type,
            status: 'submitted',
            corresponding_author: currentUser.id,
            pdf_url: pdfUrl,
            is_free: false,
            created_at: new Date().toISOString()
        };

        const { data, error } = await IDH.submitArticle(articleData);

        if (error) throw error;

        // Supprimer le brouillon
        localStorage.removeItem('articleDraft');

        showAlert('submitSuccess', '✅ Article soumis avec succès ! Vous recevrez une confirmation par email.', 'success');
        document.getElementById('submitForm')?.reset();
        
        // Réinitialiser le dropzone
        const dropzone = document.getElementById('dropzone');
        if (dropzone) {
            dropzone.innerHTML = `
                <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: #004225;"></i>
                <p>Glissez-déposez votre PDF ici ou <span style="color: #DA121A; cursor: pointer;">cliquez pour parcourir</span></p>
                <input type="file" id="subFile" accept=".pdf" style="display: none;">
            `;
            initDropzone();
        }
        
        document.getElementById('abstractCount').textContent = '0';

    } catch (error) {
        console.error('Erreur soumission:', error);
        showAlert('submitError', 'Erreur : ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
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
        }, 6000);
    }
}
