# TechDistri — GED NoCode niveau 2

Projet de démonstration pour centraliser les emails de `techdistriesgi@gmail.com`, les relier à un client dans Airtable et archiver leurs pièces jointes dans Google Drive.

## Livrables

- `docker-compose.yml` : instance n8n Community locale et persistante.
- `workflows/WF01_Ingestion_Gmail_GED.json` : unique workflow, avec ingestion toutes les cinq minutes.
- `airtable/SCHEMA.md` : modèle exact des trois tables et de l’Interface.
- `docs/ARCHITECTURE.md` : architecture et flux de données.
- `docs/TESTS.md` : protocole d’acceptation et démo.
- `docs/NOTE_ROI.md` : hypothèses et gains calculés.
- `demo/JEU_EMAILS.md` : cinq emails à envoyer pendant la soutenance.

## Démarrage rapide

1. Copier `.env.example` vers `.env`.
2. Générer une clé de chiffrement d’au moins 32 caractères et renseigner `N8N_ENCRYPTION_KEY`.
3. Créer la base Airtable en suivant `airtable/SCHEMA.md`, puis renseigner ses quatre IDs dans `.env`.
4. Créer `TechDistri_Demo/Clients` dans Drive et renseigner l’ID du dossier `Clients`.
5. Créer dans Gmail les libellés `GED/Traité` et `GED/Erreur`, puis renseigner leurs IDs.
6. Lancer `docker compose up -d` puis ouvrir <http://localhost:5678>.
7. Importer le fichier JSON du dossier `workflows`.
8. Créer et affecter les credentials décrits ci-dessous.
9. Activer `WF01_Ingestion_Gmail_GED` seulement après le test manuel réussi.

L’instance de démonstration autorise les expressions du workflow à lire les IDs techniques définis dans `.env` (`N8N_BLOCK_ENV_ACCESS_IN_NODE=false`). Ne pas activer cette option dans une instance partagée ou non maîtrisée.

## Credentials n8n

### Gmail OAuth2

- Nom attendu : `Gmail OAuth2 - techdistriesgi@gmail.com`.
- Compte : `techdistriesgi@gmail.com`.
- Activer l’API Gmail dans Google Cloud.
- Ajouter l’URL de redirection affichée par n8n au client OAuth Google.
- Après import, sélectionner ce credential dans le Gmail Trigger, le nœud `Relire email Gmail` et le nœud `Libeller Gmail`.

### Google Drive OAuth2

- Nom attendu : `Google Drive OAuth2 - TechDistri`.
- Utiliser le même projet Google Cloud et le même compte de démonstration.
- Activer l’API Google Drive.
- Affecter le credential aux nœuds Drive et aux requêtes Google Drive.

### Airtable PAT

- Créer un Personal Access Token limité à `TechDistri - GED Démo`.
- Scopes minimaux : `data.records:read`, `data.records:write`, `schema.bases:read`.
- Dans n8n, créer un credential **Header Auth** :
  - nom : `Airtable PAT - TechDistri` ;
  - header : `Authorization` ;
  - valeur : `Bearer pat...`.
- Affecter ce credential à toutes les requêtes `api.airtable.com`.

## Récupération des IDs Gmail

Après création des deux libellés, exécuter temporairement un nœud HTTP Request authentifié avec le credential Gmail :

```text
GET https://gmail.googleapis.com/gmail/v1/users/me/labels
```

Copier l’`id` associé à `GED/Traité` dans `GMAIL_LABEL_DONE_ID` et celui de `GED/Erreur` dans `GMAIL_LABEL_ERROR_ID`, puis redémarrer n8n.

## Import et activation

1. Importer `WF01_Ingestion_Gmail_GED.json`.
2. Réaffecter les trois credentials signalés comme manquants.
3. Exécuter WF01 manuellement et envoyer un email sans pièce jointe.
4. Vérifier la création du Client et du Mail ainsi que le libellé Gmail.
5. Envoyer ensuite un email avec une pièce jointe et vérifier Drive/Airtable.
6. Vérifier qu’un éventuel échec Drive apparaît dans `Fichiers — À contrôler` sans empêcher le traitement des autres fichiers.
7. Activer WF01 après cette vérification.

## Sauvegarde et arrêt

```powershell
docker compose stop
docker compose start
docker compose logs -f n8n
```

Le volume `techdistri_n8n_data` conserve les workflows, credentials et exécutions. Les exports JSON ne contiennent aucun secret et doivent être conservés avec le projet.

## Limites de cette version

- L’ordinateur doit rester allumé pour que le polling fonctionne.
- Airtable et Drive sont adaptés à la démonstration, pas encore validés pour 10 000 emails mensuels.
- Les fichiers sont partagés uniquement avec les comptes Google autorisés.
- La classification IA et l’alerte après 48 heures restent hors périmètre niveau 2.
