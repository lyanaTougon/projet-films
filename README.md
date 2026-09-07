# Gestion de Films

Application web permettant de gérer une collection de films (ajout, modification, suppression, recherche).

## Fonctionnalités
- Ajouter / modifier / supprimer un film
- Rechercher par titre, genre.
- Système de notes/favoris

## Stack technique
- **Backend** : Node.js, Express.js
- **Base de données** : PostgreSQL
- **Frontend** : React (JSX), HTML, CSS, Java, Vite
- **Outils de développement** : Postman (requêtes HTTP), pgAdmin (gestion BDD)

## Choix techniques
J'ai testé l'API OMDb pour récupérer automatiquement les données des films. Les résultats obtenus présentaient plusieurs limites : synopsis uniquement en anglais (sans option de traduction), images en basse résolution, et incohérences dans le format des dates.

J'ai également envisagé TMDB, dont les données sont plus complètes et disponibles en français, mais son processus de création de clé API impose de fournir des informations personnelles (nom, adresse, téléphone), ce que j'ai choisi de ne pas faire pour des raisons de confidentialité.

J'ai donc opté pour une gestion manuelle des données via ma propre base PostgreSQL, ce qui m'a permis de travailler la modélisation et les relations de la base de données de A à Z.

**Piste d'évolution** : intégrer une API alternative ou revisiter TMDB si les conditions changent.

## Captures d'écran
(capture d'écran à venir)
