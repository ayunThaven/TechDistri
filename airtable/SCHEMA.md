# Base Airtable `TechDistri - GED Démo`

Ce modèle est volontairement réduit au niveau 2 du brief. Les seuls champs techniques sont indiqués « à masquer » : ils servent à éviter les doublons et à relier Drive, mais ne sont pas nécessaires dans le dashboard.

Créer les tables dans l’ordre `Clients`, `Mails`, puis `Fichiers`. Les noms doivent être identiques : le workflow les utilise tels quels.

## Table `Clients`

| Champ | Type | Rôle |
|---|---|---|
| Nom client | Texte sur une ligne | Champ principal, nom affiché |
| Identifiant client | Texte sur une ligne | Technique à masquer : domaine professionnel ou adresse Gmail complète ; évite les doublons |
| Dossier Drive ID | Texte sur une ligne | Technique à masquer : identifiant du dossier client |
| Mails | Link to another record | Vers `Mails`, plusieurs valeurs |
| Nombre de mails | Count | Sur `Mails` |
| Dernier échange | Rollup | `Mails` → `Date réception` → `MAX(values)` |
| Nombre de fichiers | Rollup | `Mails` → `Nombre de fichiers` → `SUM(values)` |

## Table `Mails`

| Champ | Type | Rôle |
|---|---|---|
| Gmail Message ID | Texte sur une ligne | Champ principal, technique à masquer : anti-doublon |
| Client | Link to another record | Vers `Clients`, une valeur |
| Sujet | Texte sur une ligne |  |
| Expéditeur | Email |  |
| Date réception | Date | Inclure l’heure |
| Corps texte | Texte long |  |
| Fichiers | Link to another record | Vers `Fichiers`, plusieurs valeurs |
| Nombre de fichiers | Count | Sur `Fichiers` |
| Statut | Single select | `EN_COURS`, `TERMINE`, `PARTIEL`, `ERREUR` |
| Détail erreur | Texte long | Vide si tout est correct |

## Table `Fichiers`

| Champ | Type | Rôle |
|---|---|---|
| Identifiant fichier | Texte sur une ligne | Champ principal, technique à masquer : anti-doublon |
| Nom fichier | Texte sur une ligne | Nom reçu / affiché |
| Mail | Link to another record | Vers `Mails`, une valeur |
| Mail Gmail ID | Texte sur une ligne | Technique à masquer : calcul du statut du mail |
| Statut upload | Single select | `A_UPLOADER`, `UPLOADE`, `ERREUR` |
| URL Drive | URL | Lien cliquable vers le fichier archivé |
| Détail erreur | Texte long | Vide si tout est correct |

## Vues et Interface

- `Clients — Tous` : Nom client, Nombre de mails, Dernier échange, Nombre de fichiers.
- `Mails — À contrôler` : filtre `Statut` est `PARTIEL` ou `ERREUR`.
- `Fichiers — À contrôler` : filtre `Statut upload` est `ERREUR`.

Dans l’Interface `GED TechDistri`, afficher seulement les champs métier : client, sujet, expéditeur, dates, fichiers, liens Drive et statuts. Donner à l’enseignant un accès en lecture seule.
