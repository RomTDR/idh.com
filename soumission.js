// ========================================
// Soumission d'articles — Upload PDF + Formulaire
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initSubmissionForm();
    initDropzone();
    initAbstractCounter();
    initAddAuthor();
});

function initSubmissionForm() {
    const form = document.getElementById('submitForm');
    if (!form) return;

    // Vérifier connexion
    if (!currentUser) {
        form.innerHTML = `
            <div class="alert alert-error" style="text-align:center;padding:3rem;">
                <i class="fas fa-lock" style="font-size:2rem;display:block;margin-bottom:1rem;"></i>
                <h3>Connexion requise</h3>
                <p>Vous devez etre connecte pour soumettre un article.</p>
                <a href="membres.html" class="btn btn-primary" style="margin-top:1rem;">Se connecter</a>
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
        row.dataset.index = index;
        row.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;">
                <strong>Auteur ${index + 1}</strong>
                <button type="button" class="btn btn-sm btn-outline" onclick="this.closest('.author-row').remove()" style="color:#dc3545;border-color:#dc3545;">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Prenom *</label>
                    <input type="text" class="auth-firstname" required placeholder="Prenom">
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
            <label class="checkbox-label">
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

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
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

    // Click sur le dropzone declenche l'input file
    dropzone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });
}

function updateDropzoneText(filename) {
    const dropzone = document.getElementById('dropzone');
    const p = dropzone.querySelector('p');
    if (p) {
        p.innerHTML = `<i class="fas fa-file-pdf" style="color:#dc3545;font-size:2rem;"></i><br><strong>${filename}</strong><br><small>Cliquez pour changer</small>`;
    }
}

function initAbstractCounter() {
    const textarea = document.getElementById('subAbstract');
    const counter = document.getElementById('abstractCount');
    if (!textarea || !counter) return;

    textarea.addEventListener('input', () => {
        counter.textContent = textarea.value.length;
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
    showAlert('submitSuccess', 'Brouillon enregistre localement !');
}

// Restaurer le brouillon au chargement
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
    } catch (e) {
        console.log('Erreur restauration brouillon');
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!currentUser) {
        showAlert('submitError', 'Vous devez etre connecte pour soumettre.');
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

        // Collecter les auteurs
        const authorRows = document.querySelectorAll('.author-row');
        const authors = [];
        let correspondingIndex = 0;

        authorRows.forEach((row, idx) => {
            const firstName = row.querySelector('.auth-firstname').value;
            const lastName = row.querySelector('.auth-lastname').value;
            const email = row.querySelector('.auth-email').value;
            const affiliation = row.querySelector('.auth-affiliation').value;
            const orcid = row.querySelector('.auth-orcid').value;
            const isCorresponding = row.querySelector('.auth-corresponding').checked;

            authors.push({ first_name: firstName, last_name: lastName, email, affiliation, orcid });
            if (isCorresponding) correspondingIndex = idx;
        });

        // Upload du PDF
        let pdfUrl = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 20 * 1024 * 1024) {
                throw new Error('Le fichier ne doit pas depasser 20 Mo.');
            }
            if (file.type !== 'application/pdf') {
                throw new Error('Seuls les fichiers PDF sont acceptes.');
            }

            const fileName = `articles/${currentUser.id}/${Date.now()}_${file.name}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('articles')
                .upload(fileName, file, { contentType: 'application/pdf' });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('articles').getPublicUrl(fileName);
            pdfUrl = urlData.publicUrl;
        }

        // Inserer l'article
        const { data: article, error: insertError } = await supabase
            .from('articles')
            .insert([{
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
            }])
            .select()
            .single();

        if (insertError) throw insertError;

        // Supprimer le brouillon
        localStorage.removeItem('articleDraft');

        showAlert('submitSuccess', 'Article soumis avec succes ! Vous recevrez une confirmation par email. Votre article sera examine sous 48h.');
        document.getElementById('submitForm').reset();

        // Reset dropzone
        const dropzone = document.getElementById('dropzone');
        const p = dropzone?.querySelector('p');
        if (p) {
            p.innerHTML = 'Glissez-deposez votre PDF ici ou <span>cliquez pour parcourir</span>';
        }

        // Reset compteur
        document.getElementById('abstractCount').textContent = '0';

    } catch (error) {
        console.error('Erreur soumission:', error);
        showAlert('submitError', 'Erreur : ' + error.message);
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
        setTimeout(() => { el.style.display = 'none'; }, 6000);
    }
}

// Restaurer brouillon au chargement si formulaire present
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('submitForm')) restoreDraft();
});
