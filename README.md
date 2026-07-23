# llm-tokencheck

Estime le nombre de tokens et le coût en dollars d'un texte **avant** de l'envoyer à
une API LLM (Anthropic, OpenAI, Google). Zéro dépendance, s'exécute instantanément.

```bash
# Installation (la commande installée s'appelle `tokencheck`)
npm install -g llm-tokencheck

tokencheck mon-fichier.txt
tokencheck mon-fichier.txt --provider anthropic
tokencheck mon-fichier.txt --model claude-sonnet-5
cat mon-fichier.txt | tokencheck -
tokencheck --list
```

Sans installation : `npx -y -p llm-tokencheck tokencheck mon-fichier.txt`

## Limites

- L'estimation de tokens est **heuristique** (± ~15%), pas une tokenisation exacte :
  chaque fournisseur utilise son propre tokenizer. Pour un usage qui exige une
  précision exacte, utilisez le tokenizer officiel du fournisseur.
- Les tarifs affichés sont saisis manuellement et peuvent devenir obsolètes.
  Vérifiez toujours la page tarifaire officielle avant toute décision budgétaire
  (voir le champ `source` de chaque modèle dans `pricing.json`).

## Version gratuite vs Pro

- **Gratuit** : un fichier (ou stdin) à la fois, tous les modèles listés.
- **Pro** (9 USD, achat unique) : traitement d'un dossier entier + export CSV.
  Achat : https://buy.stripe.com/eVqeVegjH7kL0iE14Q9Zm00
  Après l'achat, vous recevrez une clé de licence par email à activer avec :
  ```bash
  tokencheck --activate <votre-cle-de-licence>
  tokencheck mon-dossier/ --csv rapport.csv
  tokencheck --status       # vérifier l'état de la licence
  tokencheck --deactivate   # retirer la licence de cette machine
  ```
  La licence est vérifiée localement par signature cryptographique (Ed25519) :
  aucune donnée n'est envoyée à un serveur tiers dans les deux cas, tout le calcul
  est local.

## LLM Pricing Alerts (nouveau, test)

Un email quand les tarifs Anthropic/OpenAI/Google de `pricing.json` changent —
pratique si vous suivez ces coûts sans vouloir repasser sur `tokencheck --list`
régulièrement. 3 USD/mois, résiliable à tout moment depuis le lien Stripe.
Abonnement : https://buy.stripe.com/9B63cw5F39sT4yUcNy9Zm01

*Service en phase de test (volume actuel : 0 abonné) — l'envoi des alertes est
encore fait manuellement par l'auteur, pas automatisé, le temps de valider
l'intérêt avant d'investir dans une automatisation.*

## Besoin de plus qu'une estimation ? Audit de vos coûts API existants

Un service séparé, payant, pour aller plus loin que l'estimation gratuite :
envoyez un export de votre usage API réel (CSV/JSON du dashboard fournisseur,
ou un échantillon représentatif de requêtes — pas de clé API requise) et
recevez sous 48h un rapport écrit : quelles requêtes récurrentes pourraient
utiliser un modèle moins cher sans perte de qualité perceptible, et une
estimation d'économie mensuelle. 29 USD, paiement unique, pas d'abonnement.
Détails et paiement : https://ilan-lachkar.github.io/llm-cost-audit/

*Service récent (0 audit réalisé à ce jour) — revue manuelle, pas encore
automatisée ; remboursement intégral si je ne peux rien tirer d'utile de ce
que vous envoyez.*

## Vous lancez vous-même un outil dev ? Le rapport LaunchMap

17 canaux de distribution testés en réel pour lancer un outil dev solo
(annuaires, Reddit, Hacker News, réseaux pub payables en crypto…) : ce qui a
bloqué l'inscription automatisée, ce qui a marché sans friction, ce qui a été
supprimé après coup. Données réelles issues du lancement de cet outil et de
llm-cost-audit. 7 USD, rapport envoyé par email.
Détails et paiement : https://ilan-lachkar.github.io/launchmap/

## Licence

MIT.
