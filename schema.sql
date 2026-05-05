-- ========================================
-- Schéma de base de données - AsInAIHB
-- À exécuter dans l'éditeur SQL de Supabase
-- ========================================

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLE : members (Membres)
-- ========================================
CREATE TABLE members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100),
    hospital VARCHAR(150),
    promotion_year INT,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'member',
    is_verified BOOLEAN DEFAULT FALSE,
    bio TEXT,
    orcid VARCHAR(50),
    profile_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_members_specialty ON members(specialty);
CREATE INDEX idx_members_role ON members(role);
CREATE INDEX idx_members_verified ON members(is_verified);

-- ========================================
-- TABLE : issues (Numéros de revue)
-- ========================================
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volume INT NOT NULL,
    issue_number INT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    cover_image VARCHAR(500),
    publication_date DATE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_issues_published ON issues(is_published, publication_date DESC);

-- ========================================
-- TABLE : articles (Articles scientifiques)
-- ========================================
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    abstract TEXT,
    keywords TEXT[],
    authors JSONB,
    corresponding_author UUID REFERENCES members(id),
    article_type VARCHAR(50),
    specialty VARCHAR(100),
    status VARCHAR(50) DEFAULT 'submitted',
    pdf_url VARCHAR(500),
    doi VARCHAR(100),
    volume INT,
    issue_number INT,
    pages VARCHAR(50),
    publication_date DATE,
    is_free BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_specialty ON articles(specialty);
CREATE INDEX idx_articles_type ON articles(article_type);
CREATE INDEX idx_articles_date ON articles(publication_date DESC);
CREATE INDEX idx_articles_free ON articles(is_free);

-- Recherche full-text
ALTER TABLE articles ADD COLUMN search_vector TSVECTOR 
    GENERATED ALWAYS AS (
        setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('french', coalesce(abstract, '')), 'B') ||
        setweight(to_tsvector('french', coalesce(array_to_string(keywords, ' '), '')), 'C')
    ) STORED;

CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- ========================================
-- TABLE : article_issues (Liaison article ↔ numéro)
-- ========================================
CREATE TABLE article_issues (
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, issue_id)
);

-- ========================================
-- TABLE : reviews (Relecture par les pairs)
-- ========================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES members(id) ON DELETE CASCADE,
    decision VARCHAR(50),
    comments TEXT,
    is_submitted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(article_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id, is_submitted);
CREATE INDEX idx_reviews_article ON reviews(article_id);

-- ========================================
-- TABLE : favorites (Articles favoris)
-- ========================================
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(member_id, article_id)
);

-- ========================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- ========================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Politiques members
CREATE POLICY "Members public read" ON members FOR SELECT USING (true);
CREATE POLICY "Members self update" ON members FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Members self insert" ON members FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques articles
CREATE POLICY "Articles public read published" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "Articles authors read" ON articles FOR SELECT USING (corresponding_author = auth.uid());
CREATE POLICY "Articles authors insert" ON articles FOR INSERT WITH CHECK (corresponding_author = auth.uid());
CREATE POLICY "Articles editors all" ON articles FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role IN ('editor', 'admin'))
);

-- Politiques issues
CREATE POLICY "Issues public read published" ON issues FOR SELECT USING (is_published = true);
CREATE POLICY "Issues editors all" ON issues FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role IN ('editor', 'admin'))
);

-- Politiques reviews
CREATE POLICY "Reviews reviewer access" ON reviews FOR ALL USING (reviewer_id = auth.uid());
CREATE POLICY "Reviews editors access" ON reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND role IN ('editor', 'admin'))
);

-- Politiques favorites
CREATE POLICY "Favorites self" ON favorites FOR ALL USING (member_id = auth.uid());

-- ========================================
-- FONCTIONS & TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STORAGE BUCKET & POLICIES (Supabase Storage)
-- ========================================

-- Créer le bucket (à faire via l'interface ou avec cette commande si activé)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('articles', 'articles', true);

-- Politiques pour le bucket 'articles'
-- Tout le monde peut lire les PDF publiés
CREATE POLICY "Public read articles PDF"
ON storage.objects FOR SELECT
USING (bucket_id = 'articles');

-- Les membres authentifiés peuvent uploader
CREATE POLICY "Authenticated upload articles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'articles');

-- Les auteurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Authors delete own PDF"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'articles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- DONNÉES DE DÉMO
-- ========================================

INSERT INTO issues (volume, issue_number, title, publication_date, is_published) VALUES
(12, 3, 'Numéro spécial Pédiatrie', '2024-09-01', true),
(12, 2, 'Médecine interne et infectiologie', '2024-06-01', true),
(12, 1, 'Santé publique et épidémiologie', '2024-03-01', true),
(11, 2, 'Chirurgie et spécialités chirurgicales', '2023-09-01', true),
(11, 1, 'Gynéco-obstétrique et santé reproductive', '2023-03-01', true);
