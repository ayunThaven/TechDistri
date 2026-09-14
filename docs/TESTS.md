# Plan de tests et recette

## Préconditions

- WF01 importé, credentials au vert et variables `.env` renseignées.
- Trois tables Airtable vides et Interface créée.
- Dossier Drive `TechDistri_Demo/Clients` vide.
- Libellés Gmail présents.

## Matrice

| ID | Scénario | Résultat attendu |
|---|---|---|
| T01 | Email sans pièce jointe | 1 Client, 1 Mail `TERMINE`, 0 Fichier |
| T02 | Email avec un PDF | 1 Fichier `UPLOADE`, lien Drive ouvrable |
| T03 | Email avec PDF + XLSX + JPG | 3 Fichiers liés au même Mail |
| T04 | Deux expéditeurs `@carrasco.fr` | Un seul Client Carrasco, deux Mails |
| T05 | Deux expéditeurs Gmail | Deux Clients distincts |
| T06 | Même email rejoué | Aucun Mail supplémentaire |
| T07 | Deux PJ portant le même nom | Deux noms archivés uniques |
| T08 | Nom `Devis été n°42.pdf` | Nom Drive assaini, extension conservée |
| T09 | ID dossier Drive volontairement invalide | Fichier `ERREUR`, Mail `PARTIEL/ERREUR` |
| T10 | Exécution manuelle de WF01 après correction | Fichier repris, Mail finalement `TERMINE` |
| T11 | Redémarrage Docker | Workflow et credentials conservés |
| T12 | Cinq emails de démo | Tous visibles en moins de cinq minutes |

## Contrôles de non-régression

- `Nombre de mails`, `Dernier échange` et `Nombre de fichiers` sont exacts.
- Les relations Client–Mail–Fichier sont navigables dans les deux sens.
- Les libellés Gmail correspondent au statut final.
- Les vues `À contrôler` n’affichent que les erreurs réelles.
- Le JSON exporté ne contient ni token, ni secret, ni adresse d’un expéditeur réel.

## Critère de validation final

La recette est acceptée quand T01 à T12 sont réussis, avec captures de T03, T04, T09 et T12. En cas d’échec, conserver la capture, l’ID d’exécution n8n et le message Airtable avant correction.
