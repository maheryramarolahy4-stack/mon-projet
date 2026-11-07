# MY WALLET — Frontend React + Tailwind CSS

Interface responsive de gestion financière personnelle, en français et en Ariary (MGA).

## Fonctionnalités
- Tableau de bord avec indicateurs et graphiques
- Liste des transactions avec recherche et filtres
- Transactions reliées au compte utilisateur
- Portefeuilles
- Budgets
- Objectifs d'épargne
- Dettes et prêts
- Rapports et statistiques
- Paramètres
- Navigation latérale responsive avec menu mobile

## Données et comptes
- Inscription et connexion par e-mail/mot de passe, ou connexion Google après configuration OAuth.
- Chaque compte est isolé en base et démarre avec des portefeuilles à zéro.
- Transactions, portefeuilles, budgets, objectifs, dettes, contributions et remboursements sont enregistrés via l’API MySQL.
- Les rapports peuvent être filtrés par période et exportés en CSV.
- Le bouton dans le menu latéral déconnecte le compte.
- Voir le README du backend pour créer les fichiers `.env` et configurer le Client ID Google.

## Prérequis
- Node.js 18 ou plus
- npm

## Installation
Dans un terminal, à la racine du dossier :

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse affichée, généralement `http://localhost:5173`.

Pour créer la version de production :

```bash
npm run build
npm run preview
```

## Personnalisation
- `src/App.jsx` : navigation et état global
- `src/pages/` : écrans de l'application
- `src/components/` : composants réutilisables
- `tailwind.config.js` : configuration Tailwind CSS

## Important
L’inscription et la connexion nécessitent que MySQL soit démarré, que le schéma `backend/database/my_wallet.sql` ait été importé et que l’API tourne sur le port configuré. Après une modification de `.env`, redémarrez Vite. La connexion Google exige aussi un Client ID OAuth Web valide; l’inscription par e-mail fonctionne sans Google.
