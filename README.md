# 🏥 AsInAIHB - Site Web & Revue de l'Interne

Site web de l'**Association des Internes et Anciens Internes des Hôpitaux du Bénin** avec :
- 🏠 Présentation de l'association
- 🔬 Revue de l'Interne (style PubMed)
- 👤 Espace membres avec authentification
- 📝 Soumission d'articles scientifiques

---

## 📁 Structure du projet

```
idhbenin-site/
├── index.html              # Page d'accueil
├── revue.html              # Revue de l'Interne (recherche PubMed)
├── membres.html            # Espace membres (connexion + dashboard)
├── soumission.html         # Soumission d'articles
├── login.html              # Connexion / Inscription
├── css/
│   └── style.css           # Styles complets
├── js/
│   ├── supabase.js         # Configuration Supabase
│   ├── auth.js             # Gestion authentification
│   ├── home.js             # Logique page d'accueil
│   ├── revue.js            # Recherche & filtres articles
│   ├── membres.js          # Dashboard membre
│   └── soumission.js       # Formulaire de soumission + upload PDF
├── schema.sql              # Schéma base de données
└── README.md               # Ce fichier
```

---

## 🚀 Déploiement rapide

### Étape 1 : Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet (nommez-le `asinaihb`)
3. Dans **Project Settings > API**, copiez :
   - `URL` → collez dans `js/supabase.js` (variable `SUPABASE_URL`)
   - `anon public` → collez dans `js/supabase.js` (variable `SUPABASE_ANON_KEY`)

### Étape 2 : Créer la base de données

1. Dans Supabase, allez dans **SQL Editor > New query**
2. Copiez-collez tout le contenu du fichier `schema.sql`
3. Cliquez sur **Run**

### Étape 3 : Configurer le stockage (PDF)

1. Dans Supabase, allez dans **Storage > New bucket**
2. Créez un bucket nommé `articles`
3. Cochez **"Public bucket"** pour que les PDF soient accessibles publiquement
4. Dans les **Policies** du bucket, ajoutez :
   - **SELECT** : `true` (public)
   - **INSERT** : `auth.role() = 'authenticated'`
   - **DELETE** : `auth.uid()::text = (storage.foldername(name))[1]`

### Étape 4 : Configurer l'authentification par email

1. Dans Supabase, allez dans **Authentication > Providers > Email**
2. Activez **Confirm email** (recommandé pour la sécurité)
3. Configurez **Site URL** avec l'URL de votre site GitHub Pages

### Étape 5 : Déployer sur GitHub Pages

1. Créez un nouveau repository GitHub (ex: `idhbenin-revue`)
2. Uploadez tous les fichiers du dossier `idhbenin-site/`
3. Allez dans **Settings > Pages**
4. Source : **Deploy from a branch** → sélectionnez `main` / `root`
5. Votre site est en ligne ! 🎉

---

## 🔧 Personnalisation

### Modifier les couleurs
Dans `css/style.css`, changez les variables CSS en haut du fichier :
```css
:root {
    --primary: #1e3a5f;        /* Bleu principal */
    --primary-light: #2d5a87;  /* Bleu clair */
    --accent: #ffd700;         /* Or / Jaune */
}
```

### Modifier le contenu
- **Message du président** : éditez `index.html`, section `.president-msg`
- **Contact** : éditez le footer dans chaque fichier HTML
- **Spécialités** : modifiez les listes dans `js/revue.js` et les `<select>` dans les HTML

---

## 🔐 Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| `member` | Lire articles, soumettre, favoris |
| `reviewer` | Tout member + relire des articles |
| `editor` | Tout reviewer + publier, gérer numéros |
| `admin` | Tout + gérer membres, valider inscriptions |

Pour promouvoir un membre, exécutez dans Supabase SQL Editor :
```sql
UPDATE members SET role = 'editor' WHERE email = 'email@exemple.com';
```

---

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez la console du navigateur (F12 > Console)
2. Vérifiez que vos clés Supabase sont correctes dans `js/supabase.js`
3. Vérifiez que RLS est bien configuré dans Supabase
4. Vérifiez que le bucket `articles` existe et est public

---

**© 2026 AsInAIHB - Association des Internes et Anciens Internes des Hôpitaux du Bénin**
