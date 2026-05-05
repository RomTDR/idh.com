// ========================================
// Espace Membres - Dashboard
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        loadDashboardData();
    }
});

async function loadDashboardData() {
    if (!currentUser || !userProfile) return;
    
    try {
        // Mes articles
        const { data: myArticles, error: artError } = await supabase
            .from('articles')
            .select('*')
            .eq('corresponding_author', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (!artError && myArticles) {
            document.getElementById('dashArticles').textContent = myArticles.length;
            renderMyArticles(myArticles);
            
            const pending = myArticles.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
            document.getElementById('dashPending').textContent = pending;
        }
        
        // Reviews
        const { data: reviews, error: revError } = await supabase
            .from('reviews')
            .select('*')
            .eq('reviewer_id', currentUser.id);
        
        if (!revError && reviews) {
            document.getElementById('dashReviews').textContent = reviews.length;
        }
        
        // Favoris (à implémenter avec une table favorites)
        document.getElementById('dashFavorites').textContent = '0';
        
    } catch (e) {
        console.log('Erreur dashboard:', e);
    }
}

function renderMyArticles(articles) {
    const container = document.getElementById('myArticlesList');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<p class="empty-state">Vous n\\'avez pas encore soumis d\\'article. <a href="soumission.html">Soumettre mon premier article →</a></p>';
        return;
    }
    
    const statusLabels = {
        'submitted': { text: 'Soumis', class: 'badge', style: 'background:#6c757d' },
        'under_review': { text: 'En relecture', class: 'badge', style: 'background:#f0ad4e' },
        'accepted': { text: 'Accepté', class: 'badge', style: 'background:#28a745' },
        'published': { text: 'Publié', class: 'badge', style: 'background:#17a2b8' },
        'rejected': { text: 'Rejeté', class: 'badge', style: 'background:#dc3545' }
    };
    
    container.innerHTML = articles.map(art => {
        const status = statusLabels[art.status] || statusLabels['submitted'];
        return `
            <div class="article-row" style="margin-bottom:0.6rem;">
                <h4 style="font-size:0.95rem;">${art.title}</h4>
                <div class="article-row-meta">
                    <span class="${status.class}" style="${status.style};color:white;padding:0.15rem 0.5rem;border-radius:3px;font-size:0.75rem;">${status.text}</span>
                    <span>${new Date(art.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>
        `;
    }).join('');
}
