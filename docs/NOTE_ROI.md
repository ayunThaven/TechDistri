# Note ROI — GED TechDistri

## Situation de départ

TechDistri traite environ 9 000 emails par mois. Une recherche documentaire prend en moyenne 12 minutes et échoue une fois sur quatre. La GED ramène l’objectif de recherche à environ une minute grâce au lien Client–Mail–Fichier et à l’URL Drive.

## Gain de temps estimé

| Scénario | Emails donnant lieu à une recherche | Recherches/mois | Temps économisé | Gain mensuel |
|---|---:|---:|---:|---:|
| Prudent | 2 % | 180 | 11 min | 33 h |
| Central | 5 % | 450 | 11 min | 82,5 h |
| Haut | 10 % | 900 | 11 min | 165 h |

Dans le scénario central, la solution économise environ 990 heures par an. La valeur financière se calcule en multipliant ce volume par le coût horaire chargé de l’équipe.

## Risques couverts

- perte de pièces jointes dans des dossiers personnels ;
- temps de recherche et dépendance à la mémoire collective ;
- doublons de classement grâce au Gmail Message ID ;
- absence de visibilité sur les uploads en échec ;
- difficulté à reconstituer l’historique d’un client.

## Coûts

La démonstration utilise n8n Community auto-hébergé, Airtable et Google Workspace de test. Son coût logiciel marginal est nul hors matériel et connexion existants. Pour un POC réel à 8 000–10 000 emails mensuels, il faudra chiffrer séparément l’hébergement permanent, le plan Airtable, le stockage Drive, la sauvegarde et l’administration.

## Conclusion

Même avec l’hypothèse prudente, le projet libère environ quatre journées de travail par mois. Le niveau 2 suffit à démontrer la valeur métier avant d’investir dans la classification IA ou les alertes avancées.

