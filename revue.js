// ========================================
// Revue de l'Interne — Recherche & Filtres (style PubMed)
// ========================================

let allArticles = [];
let filteredArticles = [];
let currentPage = 1;
let perPage = 10;

const SPECIALTIES = [
    'Pediatrie', 'Chirurgie', 'Gyneco-Obstetrique', 'Medecine interne',
    'Sante publique', 'Anesthesie', 'Dermatologie', 'Ophtalmologie',
    'ORL', 'Psychiatrie', 'Radiologie', 'Autre'
];

const ARTICLE_TYPES = [
    'Article original', 'Revue de litterature', 'Cas clinique',
    'Meta-analyse', 'Communication courte', 'Editorial'
];

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initSearch();
    loadArticles();
    initModal();
});

function initFilters() {
    const specContainer = document.getElementById('specialtyFilters');
    if (specContainer) {
        specContainer.innerHTML = SPECIALTIES.map(s => {
            const label = s.replace(/-/g, '-').replace(/\w/g, l => l.toUpperCase());
            return `<label class="filter-item"><input type="checkbox" value="${s}" class="filter-specialty"> ${label}</label>`;
        }).join('');
    }

    const typeContainer = document.getElementById('typeFilters');
    if (typeContainer) {
        typeContainer.innerHTML = ARTICLE_TYPES.map(t => 
            `<label class="filter-item"><input type="checkbox" value="${t}" class="filter-type"> ${t}</label>`
        ).join('');
    }

    document.querySelectorAll('.filter-specialty, .filter-type, [name="filterDate"], #filterFree, #filterMember').forEach(el => {
        el.addEventListener('change', () => { currentPage = 1; applyFilters(); });
    });

    document.getElementById('sortSelect')?.addEventListener('change', () => { applyFilters(); });
    document.getElementById('perPage')?.addEventListener('change', (e) => { perPage = parseInt(e.target.value); currentPage = 1; applyFilters(); });
}

function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const advSearchBtn = document.getElementById('advSearchBtn');
    const advToggle = document.getElementById('advancedSearchToggle');
    const advPanel = document.getElementById('advancedSearch');

    searchBtn?.addEventListener('click', () => { currentPage = 1; applyFilters(); });
    searchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') { currentPage = 1; applyFilters(); } });
    advSearchBtn?.addEventListener('click', () => { currentPage = 1; applyFilters(); });

    advToggle?.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = advPanel.style.display === 'none';
        advPanel.style.display = isHidden ? 'block' : 'none';
        advToggle.textContent = isHidden ? 'Recherche avancée ▲' : 'Recherche avancée ▼';
    });
}

async function loadArticles() {
    const list = document.getElementById('articlesList');
    if (!list) return;

    list.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Chargement des articles...</div>';

    try {
        const { data: articles, error } = await supabase
            .from('articles')
            .select('*, members(first_name, last_name)')
            .eq('status', 'published')
            .order('publication_date', { ascending: false });

        if (error) throw error;
        allArticles = articles || [];
        if (allArticles.length === 0) allArticles = getDemoArticles();
    } catch (e) {
        console.log('Erreur chargement articles:', e);
        allArticles = getDemoArticles();
    }

    applyFilters();
}

function getDemoArticles() {
    return [
        {
            id: '1',
            title: 'Prévalence du paludisme grave chez les enfants de moins de 5 ans au CNHU-HKM de Cotonou : une étude rétrospective de 5 ans',
            abstract: 'Objectif : Déterminer la prévalence et les facteurs de risque du paludisme grave chez les enfants hospitalisés au CNHU-HKM. Méthodes : Étude rétrospective descriptive de janvier 2019 à décembre 2023 incluant 1 247 dossiers...',
            authors: [{ first_name: 'Y.E.', last_name: 'Tohodedje' }, { first_name: 'J.', last_name: 'Agossou' }],
            specialty: 'Pediatrie',
            article_type: 'Article original',
            publication_date: '2024-06-15',
            volume: 12,
            issue_number: 3,
            pages: '145-152',
            doi: '10.51234/ri.v12i3.456',
            keywords: ['Paludisme', 'Pédiatrie', 'Bénin', 'Prévalence'],
            is_free: true
        },
        {
            id: '2',
            title: "Efficacité de l'artéméther-luméfantrine versus artésunate-amodiaquine dans le traitement du paludisme uncomplicated : revue systématique et méta-analyse",
            abstract: "Contexte : Le choix du traitement du paludisme uncomplicated reste un défi dans les pays à ressources limitées. Objectif : Comparer l'efficacité des deux combinaisons thérapeutiques...",
            authors: [{ first_name: 'M.', last_name: 'Kpodékon' }, { first_name: 'A.', last_name: 'Fagninou' }],
            specialty: 'Medecine interne',
            article_type: 'Meta-analyse',
            publication_date: '2023-09-20',
            volume: 11,
            issue_number: 2,
            pages: '78-89',
            doi: '10.51234/ri.v11i2.345',
            keywords: ['Paludisme', 'Thérapeutique', 'Artémisinine', 'Bénin'],
            is_free: true
        },
        {
            id: '3',
            title: "Anémie et paludisme : corrélation chez l'enfant béninois dans le département de l'Ouémé",
            abstract: "Introduction : L'anémie constitue l'une des complications les plus fréquentes du paludisme chez l'enfant en zone d'endémie. L'objectif de cette étude était d'évaluer la corrélation entre...",
            authors: [{ first_name: 'R.', last_name: 'Dossou-Yovo' }, { first_name: 'S.', last_name: 'Gbénou' }],
            specialty: 'Pediatrie',
            article_type: 'Article original',
            publication_date: '2022-12-10',
            volume: 10,
            issue_number: 4,
            pages: '201-208',
            doi: '10.51234/ri.v10i4.234',
            keywords: ['Anémie', 'Paludisme', 'Enfant', 'Ouémé'],
            is_free: false
        },
        {
            id: '4',
            title: "Fractures du fémur chez l'enfant : expérience du service de chirurgie pédiatrique du CNHU-HKM",
            abstract: 'La fracture du fémur chez'enfant pose des défis thérapeutiques particuliers. Cette étude rapporte 67 cas colligés sur une période de 3 ans...',
            authors: [{ first_name: 'P.', last_name: 'Avimadje' }, { first_name: 'K.', last_name: 'Sossou' }],
            specialty: 'Chirurgie',
            article_type: 'Cas clinique',
            publication_date: '2024-03-15',
            volume: 12,
            issue_number: 1,
            pages: '34-41',
            keywords: ['Fracture', 'Fémur', 'Chirurgie pédiatrique', 'Traumatologie'],
            is_free: true
        },
        {
            id: '5',
            title: "Prévalence de l'hypertension artérielle chez les personnes vivant avec le VIH sous traitement antirétroviral au Bénin",
            abstract: 'Le VIH et l'hypertension artérielle représentent un double fardeau pour les systèmes de santé. Cette étude transversale a évalué la prévalence de l'HTA chez 450 patients sous ARV...',
            authors: [{ first_name: 'A.', last_name: 'Houngbegnon' }, { first_name: 'F.', last_name: 'Dovonou' }],
            specialty: 'Medecine interne',
            article_type: 'Article original',
            publication_date: '2023-06-01',
            volume: 11,
            issue_number: 1,
            pages: '12-20',
            keywords: ['VIH', 'Hypertension', 'ARV', 'Bénin'],
            is_free: true
        }
    ];
}

function applyFilters() {
    const query = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const advTitle = document.getElementById('advTitle')?.value.toLowerCase() || '';
    const advAuthor = document.getElementById('advAuthor')?.value.toLowerCase() || '';
    const advSpecialty = document.getElementById('advSpecialty')?.value || '';
    const advType = document.getElementById('advType')?.value || '';
    const advYear = document.getElementById('advYear')?.value || '';

    const selectedSpecs = Array.from(document.querySelectorAll('.filter-specialty:checked')).map(cb => cb.value);
    const selectedTypes = Array.from(document.querySelectorAll('.filter-type:checked')).map(cb => cb.value);
    const dateFilter = document.querySelector('[name="filterDate"]:checked')?.value || 'all';
    const freeOnly = document.getElementById('filterFree')?.checked || false;
    const memberOnly = document.getElementById('filterMember')?.checked || false;

    filteredArticles = allArticles.filter(art => {
        if (query) {
            const inTitle = art.title?.toLowerCase().includes(query);
            const inAbstract = art.abstract?.toLowerCase().includes(query);
            const inAuthors = art.authors?.some(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(query));
            const inKeywords = art.keywords?.some(k => k.toLowerCase().includes(query));
            if (!inTitle && !inAbstract && !inAuthors && !inKeywords) return false;
        }

        if (advTitle && !art.title?.toLowerCase().includes(advTitle)) return false;
        if (advAuthor && !art.authors?.some(a => `${a.first_name} ${a.last_name}`.toLowerCase().includes(advAuthor))) return false;
        if (advSpecialty && art.specialty !== advSpecialty) return false;
        if (advType && art.article_type !== advType) return false;
        if (advYear) {
            const artYear = new Date(art.publication_date).getFullYear().toString();
            if (artYear !== advYear) return false;
        }

        if (selectedSpecs.length > 0 && !selectedSpecs.includes(art.specialty)) return false;
        if (selectedTypes.length > 0 && !selectedTypes.includes(art.article_type)) return false;

        if (dateFilter !== 'all') {
            const artDate = new Date(art.publication_date);
            const now = new Date();
            const yearsDiff = (now - artDate) / (1000 * 60 * 60 * 24 * 365);
            if (dateFilter === '1year' && yearsDiff > 1) return false;
            if (dateFilter === '5years' && yearsDiff > 5) return false;
            if (dateFilter === '10years' && yearsDiff > 10) return false;
        }

        if (freeOnly && !art.is_free) return false;
        if (memberOnly && !currentUser) return false;

        return true;
    });

    const sort = document.getElementById('sortSelect')?.value || 'relevance';
    if (sort === 'date_desc') {
        filteredArticles.sort((a, b) => new Date(b.publication_date) - new Date(a.publication_date));
    } else if (sort === 'date_asc') {
        filteredArticles.sort((a, b) => new Date(a.publication_date) - new Date(b.publication_date));
    } else if (sort === 'author') {
        filteredArticles.sort((a, b) => (a.authors?.[0]?.last_name || '').localeCompare(b.authors?.[0]?.last_name || ''));
    }

    renderResults();
}

function renderResults() {
    const list = document.getElementById('articlesList');
    const countEl = document.getElementById('resultsCount');
    const pagination = document.getElementById('pagination');

    if (!list) return;

    const total = filteredArticles.length;
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageArticles = filteredArticles.slice(start, end);

    if (countEl) {
        countEl.innerHTML = total > 0 
            ? `Résultats <strong>${start + 1} - ${Math.min(end, total)}</strong> sur <strong>${total}</strong>`
            : 'Aucun résultat trouvé';
    }

    if (pageArticles.length === 0) {
        list.innerHTML = '<div class="loading-state">Aucun article ne correspond à vos critères.</div>';
        if (pagination) pagination.innerHTML = '';
        return;
    }

    list.innerHTML = pageArticles.map(art => {
        const authorsStr = art.authors?.map(a => `${a.first_name} ${a.last_name}`).join(', ') || 'Auteurs';
        const year = new Date(art.publication_date).getFullYear();
        const keywordsHtml = art.keywords?.map(k => `<span class="tag tag-keyword">${k}</span>`).join('') || '';

        return `
            <article class="article-card">
                <h3 class="article-card-title" onclick="openArticleModal('${art.id}')">${art.title}</h3>
                <div class="article-card-authors">${authorsStr}</div>
                <div class="article-card-meta">
                    <span>📚 Revue de l'Interne</span>
                    <span>Vol. ${art.volume}, N°${art.issue_number}, pp. ${art.pages}</span>
                    <span>📅 ${year}</span>
                    ${art.doi ? `<span>🆔 DOI: ${art.doi}</span>` : ''}
                </div>
                <p class="article-card-abstract">${art.abstract?.substring(0, 300)}${art.abstract?.length > 300 ? '...' : ''}</p>
                <div class="article-card-tags">
                    <span class="tag tag-type">${art.article_type}</span>
                    ${art.is_free ? '<span class="tag tag-free">✓ Texte complet libre</span>' : '<span class="tag tag-member">🔒 Membre</span>'}
                    ${keywordsHtml}
                </div>
            </article>
        `;
    }).join('');

    const totalPages = Math.ceil(total / perPage);
    let pagesHtml = '';
    if (currentPage > 1) pagesHtml += `<button class="page-btn" onclick="goToPage(${currentPage - 1})">← Préc</button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagesHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagesHtml += `<span style="padding:0.5rem;">...</span>`;
        }
    }

    if (currentPage < totalPages) pagesHtml += `<button class="page-btn" onclick="goToPage(${currentPage + 1})">Suiv →</button>`;
    if (pagination) pagination.innerHTML = pagesHtml;
}

function goToPage(page) {
    currentPage = page;
    renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initModal() {
    const modal = document.getElementById('articleModal');
    const closeBtn = document.getElementById('modalClose');

    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
}

function openArticleModal(id) {
    const art = allArticles.find(a => a.id === id);
    if (!art) return;

    const modal = document.getElementById('articleModal');
    const body = document.getElementById('modalBody');

    const authorsStr = art.authors?.map(a => `${a.first_name} ${a.last_name}`).join(', ') || '';
    const year = new Date(art.publication_date).getFullYear();
    const keywordsStr = art.keywords?.join(', ') || '';

    body.innerHTML = `
        <div class="modal-body">
            <h2>${art.title}</h2>
            <div class="modal-meta">
                <span><i class="fas fa-users"></i> ${authorsStr}</span>
                <span><i class="fas fa-book"></i> Revue de l'Interne, Vol.${art.volume} N°${art.issue_number}</span>
                <span><i class="fas fa-calendar"></i> ${year}</span>
                <span><i class="fas fa-file-alt"></i> pp. ${art.pages}</span>
            </div>
            <div class="modal-abstract">
                <h4>Résumé</h4>
                <p>${art.abstract}</p>
            </div>
            <p><strong>Mots-clés :</strong> ${keywordsStr}</p>
            <div class="modal-actions">
                ${art.is_free 
                    ? `<a href="${art.pdf_url || '#'}" class="btn btn-primary" target="_blank"><i class="fas fa-file-pdf"></i> Télécharger le PDF</a>`
                    : currentUser 
                        ? `<a href="${art.pdf_url || '#'}" class="btn btn-primary" target="_blank"><i class="fas fa-file-pdf"></i> Télécharger le PDF (membre)</a>`
                        : `<a href="membres.html" class="btn btn-outline"><i class="fas fa-lock"></i> Connexion requise</a>`
                }
                <button class="btn btn-outline" onclick="navigator.clipboard.writeText('${art.doi || ''}');alert('DOI copié !')"><i class="fas fa-copy"></i> Copier le DOI</button>
                <button class="btn btn-outline" onclick="citeArticle('${art.id}')"><i class="fas fa-quote-right"></i> Citer</button>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function citeArticle(id) {
    const art = allArticles.find(a => a.id === id);
    if (!art) return;
    const authors = art.authors?.map(a => `${a.last_name} ${a.first_name.charAt(0)}`).join(', ');
    const citation = `${authors}. ${art.title}. Revue de l'Interne. ${new Date(art.publication_date).getFullYear()};${art.volume}(${art.issue_number}):${art.pages}. DOI:${art.doi || 'N/A'}`;
    navigator.clipboard.writeText(citation);
    alert('Citation copiée au format Vancouver !');
}
