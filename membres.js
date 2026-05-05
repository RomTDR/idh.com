// ========================================
// Espace Membres - Dashboard
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    if (currentUser) {
        await loadDashboardData();
    }
});

async function loadDashboardData() {
    if (!currentUser || !userProfile) return;
    
    try {
        // Mes articles
        const { data: myArticles, error: artError } = await IDH.getUserArticles(currentUser.id);
        
        if (!artError && myArticles) {
            document.getElementById('dashArticles').textContent = myArticles.length;
            renderMyArticles(myArticles);
            
            const pending = myArticles.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
            document.getElementById('dashPending').textContent = pending;
        } else {
            document.getElementById('dashArticles').textContent = '0';
            document.getElementById('dashPending').textContent = '0';
        }
        
        // Reviews
        const { data: reviews, error: revError } = await IDH.getReviewsForReviewer(currentUser.id);
        
        if (!revError && reviews) {
            document.getElementById('dashReviews').textContent = reviews.length;
            renderReviews(reviews);
        } else {
            document.getElementById('dashReviews').textContent = '0';
        }
        
        // Favoris (à implémenter)
        document.getElementById('dashFavorites').textContent = '0';
        
    } catch (e) {
        console.log('Erreur chargement dashboard:', e);
        // Afficher des données de démo pour le développement
        renderDemoData();
    }
}

function renderMyArticles(articles) {
    const container = document.getElementById('myArticlesList');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 30px;">
                <i class="fas fa-file-alt" style="font-size: 2rem; color: #ccc;"></i>
                <p style="margin-top: 10px;">Vous n'avez pas encore soumis d'article.</p>
                <a href="soumission.html" class="btn btn-primary btn-sm" style="margin-top: 10px;">Soumettre mon premier article →</a>
            </div>
        `;
        return;
    }
    
    const statusLabels = {
        'submitted': { text: 'Soumis', color: '#FFD700', textColor: '#004225' },
        'under_review': { text: 'En relecture', color: '#FFD700', textColor: '#004225' },
        'accepted': { text: 'Accepté', color: '#009E60', textColor: 'white' },
        'published': { text: 'Publié', color: '#009E60', textColor: 'white' },
        'rejected': { text: 'Rejeté', color: '#DA121A', textColor: 'white' }
    };
    
    container.innerHTML = articles.map(art => {
        const status = statusLabels[art.status] || statusLabels['submitted'];
        return `
            <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px; color: #004225; font-size: 0.95rem;">${art.title}</h4>
                        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #666;">
                            <span><i class="fas fa-calendar"></i> ${new Date(art.created_at).toLocaleDateString('fr-FR')}</span>
                            <span><i class="fas fa-tag"></i> ${art.specialty || 'Non spécifié'}</span>
                        </div>
                    </div>
                    <span style="background: ${status.color}; color: ${status.textColor}; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">
                        ${status.text}
                    </span>
                </div>
                ${art.status === 'published' ? `
                    <div style="margin-top: 8px;">
                        <a href="revue.html?article=${art.id}" class="btn btn-outline btn-sm" style="padding: 4px 12px; font-size: 0.75rem;">
                            <i class="fas fa-eye"></i> Voir l'article
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderReviews(reviews) {
    const container = document.getElementById('myReviewsList');
    if (!container) return;
    
    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 30px;">
                <i class="fas fa-check-circle" style="font-size: 2rem; color: #009E60;"></i>
                <p style="margin-top: 10px;">Aucune relecture en attente.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reviews.map(review => `
        <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
            <h4 style="margin: 0 0 5px; color: #004225; font-size: 0.9rem;">${review.articles?.title || 'Article sans titre'}</h4>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="font-size: 0.8rem; color: #666;"><i class="fas fa-clock"></i> Reçu le ${new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                <button class="btn btn-primary btn-sm" onclick="startReview('${review.article_id}')" style="padding: 5px 12px; font-size: 0.75rem;">
                    <i class="fas fa-pen"></i> Commencer
                </button>
            </div>
        </div>
    `).join('');
}

function renderDemoData() {
    const container = document.getElementById('myArticlesList');
    if (container) {
        container.innerHTML = `
            <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px; color: #004225;">Prévalence du paludisme chez les enfants</h4>
                        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #666;">
                            <span><i class="fas fa-calendar"></i> 15/10/2024</span>
                            <span><i class="fas fa-tag"></i> Pédiatrie</span>
                        </div>
                    </div>
                    <span style="background: #FFD700; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem;">En relecture</span>
                </div>
            </div>
            <div style="border-bottom: 1px solid #eee; padding: 12px 0;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0 0 5px; color: #004225;">Prise en charge des urgences chirurgicales</h4>
                        <div style="display: flex; gap: 15px; font-size: 0.8rem; color: #666;">
                            <span><i class="fas fa-calendar"></i> 01/09/2024</span>
                            <span><i class="fas fa-tag"></i> Chirurgie</span>
                        </div>
                    </div>
                    <span style="background: #009E60; color: white; padding: 3px 12px; border-radius: 20px; font-size: 0.75rem;">Publié</span>
                </div>
                <div style="margin-top: 8px;">
                    <a href="revue.html" class="btn btn-outline btn-sm" style="padding: 4px 12px; font-size: 0.75rem;">
                        <i class="fas fa-eye"></i> Voir l'article
                    </a>
                </div>
            </div>
        `;
    }
    
    document.getElementById('dashArticles').textContent = '2';
    document.getElementById('dashPending').textContent = '1';
    document.getElementById('dashReviews').textContent = '0';
}

function startReview(articleId) {
    // À implémenter : ouvrir le formulaire de relecture
    alert(`Formulaire de relecture pour l'article ${articleId} (à implémenter)`);
}

function editArticle(articleId) {
    window.location.href = `soumission.html?edit=${articleId}`;
}

function viewArticle(articleId) {
    window.location.href = `revue.html?article=${articleId}`;
}

// Exporter les fonctions globales
window.startReview = startReview;
window.editArticle = editArticle;
window.viewArticle = viewArticle;
