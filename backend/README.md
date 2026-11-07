# MY WALLET — Backend API

Backend Node.js + Express + MySQL conçu pour le frontend React/Vite `MY_WALLET_FRONTEND`.
Devise de base : Ariary (MGA / Ar).

## 1. Prérequis
- Node.js 20 ou supérieur
- XAMPP avec MySQL démarré (Apache n'est pas obligatoire pour l'API)
- phpMyAdmin

## 2. Installer la base de données
1. Ouvrir `http://localhost/phpmyadmin`.
2. Aller dans l'onglet **Importer**.
3. Choisir `database/my_wallet.sql` puis cliquer sur **Importer / Exécuter**.
4. La base `my_wallet` et les tables sont créées automatiquement.

## 3. Installer le backend
Dans un terminal, depuis le dossier `MY_WALLET_BACKEND` :

```bash
npm install
```

Copier `.env.example` vers `.env`, puis configurer MySQL. En production, remplacer impérativement `JWT_SECRET` par une chaîne aléatoire privée (au moins 32 caractères). En développement, une clé éphémère est générée si elle manque ; les sessions sont invalidées au redémarrage du serveur. Avec XAMPP standard :

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=my_wallet
JWT_SECRET=remplacer_par_une_cle_longue_et_aleatoire_de_32_caracteres_minimum
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Démarrer :

```bash
npm run dev
```

Vérifier : `http://localhost:5000/api/health`.

## 4. Configurer le frontend et Google
Copier `frontend/.env.example` vers `frontend/.env` et configurer les valeurs suivantes :

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Pour activer Google, créer un **OAuth Client ID de type application Web** dans Google Cloud Console. Ajouter `http://localhost:5173` aux origines JavaScript autorisées (et le domaine du site en production). Copier le même Client ID dans `backend/.env` et `frontend/.env`. En mode test, ajouter les comptes concernés comme utilisateurs test dans l’écran de consentement Google. Aucun secret OAuth privé ne doit être placé dans le frontend.

Le frontend contient l’inscription, la connexion e-mail/mot de passe et le bouton Google. Les comptes et données sont enregistrés dans MySQL et les requêtes privées sont isolées par identifiant utilisateur. Les mots de passe sont hachés avec bcrypt ; le JWT est conservé côté frontend pour les requêtes authentifiées.

Au premier démarrage, créer un compte avec **Inscription** ou **Continuer avec Google**. Chaque nouveau compte reçoit quatre portefeuilles (« Espèces », MVola, Orange Money et compte bancaire) avec un **solde initial de zéro**. Aucun jeu de données de démonstration n’est chargé pour un compte réel.

Lancer backend et frontend depuis la racine du dépôt avec `npm run dev`, après avoir démarré MySQL et importé le schéma. L’inscription par e-mail ne nécessite pas Google OAuth. Si `.env` a été modifié, redémarrer les serveurs concernés.

## 5. Routes disponibles
Toutes les routes sauf health, register et login exigent `Authorization: Bearer <token>`.

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérifier API + MySQL |
| POST | `/api/auth/register` | Créer un compte et 4 portefeuilles par défaut |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/google` | Vérifier un jeton Google et créer/connecter le compte |
| GET | `/api/auth/me` | Profil connecté |
| PATCH | `/api/auth/me` | Modifier le nom du profil |
| GET | `/api/dashboard` | Solde global, revenus/dépenses du mois, portefeuilles, dernières opérations |
| GET/POST/PUT/DELETE | `/api/wallets` | Gérer les portefeuilles de l’utilisateur |
| GET/POST/PUT/DELETE | `/api/transactions` | Gérer les transactions de l’utilisateur |
| DELETE | `/api/transactions/:id` | Supprimer une transaction |
| GET | `/api/categories` | Catégories accessibles |
| GET/POST/PUT/DELETE | `/api/budgets` | Gérer les budgets de l’utilisateur |
| GET/POST/PUT/DELETE | `/api/savings` | Gérer les objectifs de l’utilisateur |
| POST | `/api/savings/:id/contributions` | Ajouter une contribution |
| GET/POST/PUT/DELETE | `/api/debts` | Gérer les dettes et prêts de l’utilisateur |
| POST | `/api/debts/:id/repayments` | Enregistrer un remboursement sans dépasser le solde dû |
| GET/POST | `/api/transfers` | Lister / effectuer un transfert |

## 6. Règles importantes
- Un montant de transaction est stocké positivement ; `type_transaction` détermine revenu ou dépense.
- Dans l'API adaptée au frontend, `amount` est signé : positif = revenu, négatif = dépense.
- Un transfert n'est ni un revenu ni une dépense. Le transfert vérifie que les deux portefeuilles appartiennent à l'utilisateur et que le solde est suffisant ; son enregistrement est atomique via transaction SQL.
- Le solde courant est calculé depuis le solde initial, les revenus, les dépenses et les transferts ; ne pas le modifier directement dans React.
- Les mots de passe sont hachés avec bcrypt. Les routes privées vérifient un JWT.
- Ne jamais exposer le fichier `.env` ni publier la clé JWT.

## 7. Dépannage
- `ECONNREFUSED`: démarrer MySQL dans XAMPP et vérifier le port 3306.
- `Unknown database`: importer `database/my_wallet.sql`.
- `Access denied`: vérifier `DB_USER` et `DB_PASSWORD` dans `.env`.
- Erreur CORS: vérifier `CLIENT_URL=http://localhost:5173` et redémarrer le backend.
- `401`: se reconnecter et envoyer le token dans l'en-tête Authorization.
