# Architecture TechDistri — niveau 2

```mermaid
flowchart LR
    G[techdistriesgi@gmail.com] -->|Polling 5 min| N[n8n local / Docker]
    N -->|Clients, mails, statuts| A[(Airtable)]
    N -->|Dossiers et pièces jointes| D[(Google Drive)]
    A --> I[Airtable Interface]
    I --> U[5 commerciaux + direction]
    N -->|GED/Traité ou GED/Erreur| G
```

## Flux nominal

1. Gmail Trigger récupère le message complet et ses pièces jointes.
2. n8n normalise l’expéditeur et calcule la clé client.
3. Le Gmail Message ID protège la table Mails contre les doublons.
4. Le client est retrouvé ou créé, ainsi que son dossier Drive.
5. Le mail est créé en `EN_COURS`.
6. Chaque pièce jointe obtient une fiche Fichier et un upload Drive.
7. Le statut final devient `TERMINE`, `PARTIEL` ou `ERREUR`.
8. Gmail est libellé et marqué comme lu.

## Gestion d’erreur après création du mail

Après le nœud `Créer mail Airtable`, les erreurs techniques sont toutes redirigées vers le nœud unique `Marquer mail en ERREUR`. Il met immédiatement le champ `Statut` du mail à `ERREUR` et enregistre le message technique dans `Détail erreur`. Une erreur d’upload Drive conserve en plus la fiche Fichier concernée avec le statut `ERREUR`.

## Règle de rapprochement

- Domaine professionnel : toutes les adresses du domaine représentent le même client.
- Domaine générique (`gmail.com`, `outlook.com`, `yahoo.*`, `icloud.com`, etc.) : l’adresse complète devient la clé client.

## Sécurité et exploitation

- Aucun token n’est présent dans les exports JSON.
- n8n écoute uniquement sur `127.0.0.1`.
- Les credentials sont chiffrés avec `N8N_ENCRYPTION_KEY`.
- Les exécutions sont purgées après sept jours.
- Les fichiers Drive restent privés et accessibles uniquement aux comptes autorisés.
