# Jeu de cinq emails pour la démonstration

Envoyer ces messages à `techdistriesgi@gmail.com`. Les noms et adresses d’expéditeur sont fictifs : utiliser les comptes ou alias de test disponibles. Ne pas modifier les noms des pièces jointes, car ils servent aux tests de déduplication et d’assainissement.

## Email 1 — sans pièce jointe

| Élément | Valeur |
|---|---|
| Expéditeur | Jean Dupont `<jean.dupont@carrasco.fr>` |
| Sujet | `Demande de devis Carrasco 2026` |
| Pièce jointe | Aucune |

```text
Bonjour,

Nous souhaitons recevoir un devis pour le renouvellement de deux pompes industrielles sur notre site de Lyon.

Pouvez-vous nous indiquer les références disponibles et le délai de livraison ?

Merci,
Jean Dupont
Carrasco
```

Résultat attendu : création du client Carrasco et d’un mail `TERMINE`, sans fichier.

## Email 2 — même client, une pièce jointe XLSX

| Élément | Valeur |
|---|---|
| Expéditeur | Marie Dupont `<marie.dupont@carrasco.fr>` |
| Sujet | `Bon de commande Carrasco` |
| Pièce jointe | `pieces-jointes/02_Carrasco/commande-carrasco.xlsx` |

```text
Bonjour,

Suite à votre proposition, vous trouverez notre bon de commande en pièce jointe.

Merci de nous confirmer la prise en compte et le délai de préparation.

Cordialement,
Marie Dupont
Carrasco
```

Résultat attendu : aucun nouveau client Carrasco ; deuxième mail lié au même client ; fichier XLSX archivé dans le dossier Drive Carrasco.

## Email 3 — deux fichiers portant le même nom

| Élément | Valeur |
|---|---|
| Expéditeur | Atelier Martin `<qualite@ateliermartin.fr>` |
| Sujet | `Photos produit endommagé` |
| Pièces jointes | `pieces-jointes/03_Atelier_Martin/PJ_1/photo-produit.png` et `pieces-jointes/03_Atelier_Martin/PJ_2/photo-produit.png` |

```text
Bonjour,

Nous avons constaté une rayure sur le matériel reçu ce matin.

Vous trouverez deux photos jointes afin d’ouvrir un dossier de contrôle qualité.

Bien cordialement,
Service qualité
Atelier Martin
```

Résultat attendu : deux fiches Fichiers et deux noms archivés distincts dans Drive, malgré le même nom original.

## Email 4 — Gmail et nom de fichier avec accents

| Élément | Valeur |
|---|---|
| Expéditeur | Compte Gmail test A `<techdistri.test.a@gmail.com>` |
| Sujet | `Documentation technique capteur pression` |
| Pièce jointe | `pieces-jointes/04_Gmail_A/Fiche technique été n°42.pdf` |

```text
Bonjour,

Pouvez-vous vérifier si ce capteur est compatible avec une installation extérieure ?

Je joins la fiche technique reçue de notre équipe maintenance.

Merci,
Alex Test
```

Résultat attendu : un client propre à cette adresse Gmail ; PDF archivé avec un nom Drive assaini, extension conservée.

## Email 5 — plusieurs types de fichiers

| Élément | Valeur |
|---|---|
| Expéditeur | Compte Gmail test B `<techdistri.test.b@gmail.com>` |
| Sujet | `Commande multi fichiers atelier` |
| Pièces jointes | `pieces-jointes/05_Commande_multi_fichiers/devis-equipement-atelier.pdf`, `pieces-jointes/05_Commande_multi_fichiers/commande-multi-fichiers.xlsx`, `pieces-jointes/05_Commande_multi_fichiers/photo-pompe.png` |

```text
Bonjour,

Vous trouverez le devis validé, le détail de commande et une photo du matériel concerné.

Merci de confirmer que les trois documents ont bien été reçus.

Cordialement,
Camille Test
```

Résultat attendu : un client propre à cette seconde adresse Gmail, un mail et trois fichiers liés, de types PDF, XLSX et PNG.

## Ordre de démonstration

1. Afficher Airtable et le dossier Drive `Clients` vides.
2. Envoyer les cinq emails dans l’ordre ci-dessus.
3. Montrer le polling n8n, puis les cinq mails créés dans Airtable.
4. Ouvrir le dossier Carrasco : il doit contenir le XLSX du deuxième mail.
5. Vérifier les deux fichiers `photo-produit.png` et le PDF avec accents.
6. Filtrer l’Interface Airtable par client, statut et fichier.

Plan B : enregistrer avant la soutenance une vidéo montrant exactement cette séquence et conserver les captures finales dans le dossier de remise.
