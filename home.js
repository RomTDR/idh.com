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
        // Compter les articles publiés
        const { count: articlesCount } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published');
        
        // Compter les membres
        const { count: membersCount } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true });
        
        // Compter les numéros
        const { count: issuesCount } = await supabase
            .from('issues')
            .select('*', { count: 'exact', head: true })
            .eq('is_published', true);
        
        animateNumber('statArticles', articlesCount || 0);
        animateNumber('statMembers', membersCount || 0);
        animateNumber('statIssues', issuesCount || 0);
    } catch (e) {
        console.log('Stats non disponibles (base de données non configurée)');
        animateNumber('statArticles', 0);
        animateNumber('statMembers', 0);
        animateNumber('statIssues', 0);
    }
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const increment = Math.ceil(target / 30);
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
        const { data: issues } = await supabase
            .from('issues')
            .select('*')
            .eq('is_published', true)
            .order('publication_date', { ascending: false })
            .limit(3);
        
        if (issues && issues.length > 0) {
            grid.innerHTML = issues.map(issue => `
                <div class="issue-card" onclick="location.href='revue.html?issue=${issue.id}'">
                    <div class="issue-cover">
                        <i class="fas fa-book-medical"></i>
                    </div>
                    <div class="issue-info">
                        <h4>Vol. ${issue.volume}, N°${issue.issue_number}</h4>
                        <p>${issue.title || 'Revue de l\\'Interne'}</p>
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
                    <div class="issue-cover"><i class="fas fa-book-medical"></i></div>
                    <div class="issue-info">
                        <h4>Vol. 12, N°3</h4>
                        <p>Numéro spécial Pédiatrie</p>
                        <div class="issue-meta"><span><i class="fas fa-calendar"></i> 2024</span></div>
                    </div>
                </div>
                <div class="issue-card">
                    <div class="issue-cover"><i class="fas fa-book-medical"></i></div>
                    <div class="issue-info">
                        <h4>Vol. 12, N°2</h4>
                        <p>Médecine interne et infectiologie</p>
                        <div class="issue-meta"><span><i class="fas fa-calendar"></i> 2024</span></div>
                    </div>
                </div>
                <div class="issue-card">
                    <div class="issue-cover"><i class="fas fa-book-medical"></i></div>
                    <div class="issue-info">
                        <h4>Vol. 12, N°1</h4>
                        <p>Santé publique et épidémiologie</p>
                        <div class="issue-meta"><span><i class="fas fa-calendar"></i> 2024</span></div>
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
        const { data: articles } = await supabase
            .from('articles')
            .select('*, members(first_name, last_name)')
            .eq('status', 'published')
            .order('publication_date', { ascending: false })
            .limit(5);
        
        if (articles && articles.length > 0) {
            list.innerHTML = articles.map(art => `
                <div class="article-row" onclick="location.href='revue.html?article=${art.id}'">
                    <h4>${art.title}</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user"></i> ${art.members?.map(m => m.first_name + ' ' + m.last_name).join(', ') || 'Auteurs'}</span>
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
                        <span><i class="fas fa-user"></i> Tohodedje YE, Agossou J, Dansou G</span>
                        <span><i class="fas fa-calendar"></i> 2024</span>
                        <span><i class="fas fa-tag"></i> Pédiatrie</span>
                    </div>
                </div>
                <div class="article-row">
                    <h4>Efficacité de l'artéméther-luméfantrine versus artésunate-amodiaquine : méta-analyse</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user"></i> Kpodékon M, Fagninou A</span>
                        <span><i class="fas fa-calendar"></i> 2023</span>
                        <span><i class="fas fa-tag"></i> Médecine interne</span>
                    </div>
                </div>
                <div class="article-row">
                    <h4>Anémie et paludisme : corrélation chez l'enfant béninois dans le département de l'Ouémé</h4>
                    <div class="article-row-meta">
                        <span><i class="fas fa-user"></i> Dossou-Yovo R, Gbénou S</span>
                        <span><i class="fas fa-calendar"></i> 2022</span>
                        <span><i class="fas fa-tag"></i> Hématologie</span>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.log('Articles non disponibles');
    }
}
