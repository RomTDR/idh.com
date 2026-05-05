// ========================================
// Page d'accueil - Chargement des données
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadRecentIssues();
    loadRecentArticles();
});

async function loadStats() {
    try {
        const stats = await IDH.getStats();
        
        animateNumber('statArticles', stats.articles || 156);
        animateNumber('statMembers', stats.members || 342);
        animateNumber('statIssues', stats.issues || 12);
    } catch (e) {
        console.log('Stats non disponibles, utilisation valeurs démo');
        animateNumber('statArticles', 156);
        animateNumber('statMembers', 342);
        animateNumber('statIssues', 12);
    }
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    
    let current = 0;
    const increment = Math.ceil(target / 50);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current;
    }, 30);
}

async function loadRecentIssues() {
    const grid = document.getElementById('issuesGrid');
    if (!grid) return;
    
    try {
        const { data: issues } = await IDH.getIssues(3);
        
        if (issues && issues.length > 0) {
            grid.innerHTML = issues.map(issue => `
                <div class="issue-card" onclick="location.href='revue.html?issue=${issue.id}'">
                    <div class="issue-cover">
                        <i class="fas fa-book-medical"></i>
                    </div>
                    <div class="issue-info">
                        <h4>Vol. ${issue.volume}, N°${issue.issue_number}</h4>
                        <p>${issue.title || 'Revue de l\'Interne'}</p>
                        <div class="issue-meta">
                            <span><i class="fas fa-calendar"></i> ${new Date(issue.publication_date).getFullYear()}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            // Données de démo
            grid.innerHTML = `
                <div class="issue-card">
                    <div class="issue-cover"><i class="fas fa-child"></i></div>
                    <div class="issue-info">
                        <h4>Vol. 12, N°3</h4>
                        <p>Numéro spécial Pédiatrie</p>
                        <div class="issue-meta">Septembre 2024</div>
                    </div>
                </div>
                <div class="issue-card">
                    <div class="issue-cover"><i class="fas fa-heartbeat"></i></div>
                    <div class="issue-info">
                        <h4>Vol. 12, N°2</h4>
                        <p>Médecine interne</p>
                        <div class="issue-meta">Juin 2024</div>
                    </div>
                </div>
                <div class="issue-card">
                    <div class="issue-cover"><i class="fas fa-chart-line"></i></div>
                    <div class="issue-info">
                        <h4>Vol. 12, N°1</h4>
                        <p>Santé publique</p>
                        <div class="issue-meta">Mars 2024</div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.log('Issues non disponibles');
    }
}

async function loadRecentArticles() {
    const list = document.getElementById('recentArticles');
    if (!list) return;
    
    try {
        const { data: articles } = await IDH.getArticles();
        
        if (articles && articles.length > 0) {
            const recentArticles = articles.slice(0, 5);
            list.innerHTML = recentArticles.map(art => `
                <div class="article-row" onclick="location.href='revue.html?article=${art.id}'">
                    <h4>${art.title}</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user-md"></i> ${art.authors?.map(a => `${a.first_name} ${a.last_name}`).join(', ') || 'Auteurs'}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(art.publication_date).getFullYear()}</span>
                        <span><i class="fas fa-tag"></i> ${art.specialty}</span>
                    </div>
                </div>
            `).join('');
        } else {
            // Données de démo
            list.innerHTML = `
                <div class="article-row">
                    <h4>Prévalence du paludisme grave chez les enfants de moins de 5 ans au CNHU-HKM de Cotonou</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user-md"></i> Tohodjede YE, Agossou J, Dansou G</span>
                        <span><i class="fas fa-calendar"></i> 2024</span>
                        <span><i class="fas fa-tag"></i> Pédiatrie</span>
                    </div>
                </div>
                <div class="article-row">
                    <h4>Efficacité de l'artéméther-luméfantrine versus artésunate-amodiaquine : méta-analyse</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user-md"></i> Kpodékon M, Fagninou A</span>
                        <span><i class="fas fa-calendar"></i> 2023</span>
                        <span><i class="fas fa-tag"></i> Médecine interne</span>
                    </div>
                </div>
                <div class="article-row">
                    <h4>Fractures du fémur chez l'enfant : expérience du CNHU-HKM</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user-md"></i> Avimadje P, Sossou K</span>
                        <span><i class="fas fa-calendar"></i> 2024</span>
                        <span><i class="fas fa-tag"></i> Chirurgie</span>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.log('Articles non disponibles');
    }
}
