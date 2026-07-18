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

## Licence

MIT.
