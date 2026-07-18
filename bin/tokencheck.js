#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const license = require('../lib/license.js');

const PRICING_PATH = path.join(__dirname, '..', 'pricing.json');

function loadPricing() {
  return JSON.parse(fs.readFileSync(PRICING_PATH, 'utf8'));
}

// Heuristic token estimate (no external tokenizer dependency on purpose:
// keeps install size at zero deps). Blends a chars/4 approximation with a
// word-count based approximation, which stays within ~15% of real BPE
// tokenizers for typical English/French prose. Always presented as an
// estimate, never as an exact count.
function estimateTokens(text) {
  const chars = text.length;
  const words = (text.match(/\S+/g) || []).length;
  const byChars = chars / 4;
  const byWords = words * 1.3;
  return Math.round((byChars + byWords) / 2);
}

function formatUsd(n) {
  return '$' + n.toFixed(4);
}

function printReport(text, filterProvider, filterModel) {
  const tokens = estimateTokens(text);
  const pricing = loadPricing();

  console.log(`\nEstimation (indicative, non-exacte) : ~${tokens.toLocaleString()} tokens`);
  console.log(`Caracteres: ${text.length.toLocaleString()}  |  Mots: ${(text.match(/\S+/g) || []).length.toLocaleString()}`);
  console.log('-'.repeat(72));
  console.log(
    'Provider'.padEnd(12) + 'Modele'.padEnd(22) + 'Cout input'.padEnd(14) + 'Cout output*'
  );

  for (const m of pricing.models) {
    if (filterProvider && m.provider !== filterProvider) continue;
    if (filterModel && m.model !== filterModel) continue;
    const inputCost = (tokens / 1_000_000) * m.input_per_mtok;
    const outputCost = (tokens / 1_000_000) * m.output_per_mtok;
    console.log(
      m.provider.padEnd(12) +
      m.model.padEnd(22) +
      formatUsd(inputCost).padEnd(14) +
      formatUsd(outputCost) + '  (* si la reponse fait ~le meme nb de tokens)'
    );
  }
  console.log('-'.repeat(72));
  console.log(pricing._disclaimer);
  console.log(`Tarifs saisis le : ${pricing._last_updated}\n`);
}

function printList() {
  const pricing = loadPricing();
  console.log(`\nModeles connus (tarifs saisis le ${pricing._last_updated}) :`);
  for (const m of pricing.models) {
    console.log(`  ${m.provider.padEnd(12)} ${m.model.padEnd(22)} in=$${m.input_per_mtok}/Mtok out=$${m.output_per_mtok}/Mtok`);
  }
  console.log(`\n${pricing._disclaimer}\n`);
}

function printBatchLockedNotice(target) {
  console.log('\nMode dossier (batch) : fonctionnalite PRO.');
  console.log(`"${target}" est un dossier, pas un fichier.`);
  console.log('La version gratuite traite un seul fichier a la fois.');
  console.log('Licence Pro (batch + export CSV) : voir README.md pour l\'achat.');
  console.log('Deja achete ? Activez avec : tokencheck --activate <cle-de-licence>\n');
  process.exitCode = 1;
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function runBatch(target, filterProvider, filterModel, csvPath) {
  const pricing = loadPricing();
  const entries = fs.readdirSync(target, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();

  if (entries.length === 0) {
    console.log(`\nAucun fichier trouve dans "${target}".\n`);
    return;
  }

  const models = pricing.models.filter(
    (m) => (!filterProvider || m.provider === filterProvider) && (!filterModel || m.model === filterModel)
  );

  const rows = [];
  console.log(`\nMode batch (Pro) : ${entries.length} fichier(s) dans "${target}"\n`);
  for (const name of entries) {
    const full = path.join(target, name);
    const text = fs.readFileSync(full, 'utf8');
    const tokens = estimateTokens(text);
    const words = (text.match(/\S+/g) || []).length;
    console.log(`${name}: ~${tokens.toLocaleString()} tokens`);
    const row = { file: name, tokens, chars: text.length, words };
    for (const m of models) {
      row[`${m.provider}:${m.model}:input_usd`] = ((tokens / 1_000_000) * m.input_per_mtok).toFixed(6);
      row[`${m.provider}:${m.model}:output_usd`] = ((tokens / 1_000_000) * m.output_per_mtok).toFixed(6);
    }
    rows.push(row);
  }
  console.log('');

  if (csvPath) {
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map((h) => csvEscape(row[h])).join(','));
    }
    fs.writeFileSync(csvPath, lines.join('\n') + '\n', 'utf8');
    console.log(`Export CSV ecrit : ${csvPath}\n`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
tokencheck - estime le nombre de tokens et le cout d'un texte avant envoi a une API LLM

Usage:
  tokencheck <fichier>              Estime le cout pour tous les modeles connus
  tokencheck <fichier> --provider anthropic
  tokencheck <fichier> --model claude-sonnet-5
  cat texte.txt | tokencheck -
  tokencheck --list                 Liste les modeles/tarifs connus
  tokencheck <dossier>              [PRO] Traite tous les fichiers d'un dossier
  tokencheck <dossier> --csv out.csv [PRO] Idem + export CSV
  tokencheck --activate <cle>       Active une licence Pro achetee
  tokencheck --deactivate           Retire la licence Pro activee sur cette machine
  tokencheck --status               Affiche l'etat de la licence

Note: estimation heuristique (~15% de marge), pas une tokenisation exacte.
Version gratuite : un fichier a la fois. Version Pro : dossier entier + CSV.
`);
    return;
  }

  if (args.includes('--list')) {
    printList();
    return;
  }

  if (args.includes('--status')) {
    const status = license.getStatus();
    if (status.active) {
      console.log(`\nLicence Pro active (id: ${status.id}).\n`);
    } else {
      console.log('\nAucune licence Pro active sur cette machine.\n');
    }
    return;
  }

  if (args.includes('--activate')) {
    const idx = args.indexOf('--activate');
    const key = args[idx + 1];
    if (!key) {
      console.error('Usage: tokencheck --activate <cle-de-licence>');
      process.exitCode = 1;
      return;
    }
    const result = license.activate(key);
    if (result.valid) {
      console.log(`\nLicence Pro activee avec succes (id: ${result.id}). Merci !\n`);
    } else {
      console.error(`\nEchec de l'activation : ${result.reason}\n`);
      process.exitCode = 1;
    }
    return;
  }

  if (args.includes('--deactivate')) {
    const removed = license.deactivate();
    console.log(removed ? '\nLicence Pro retiree de cette machine.\n' : '\nAucune licence active a retirer.\n');
    return;
  }

  const providerIdx = args.indexOf('--provider');
  const modelIdx = args.indexOf('--model');
  const filterProvider = providerIdx !== -1 ? args[providerIdx + 1] : null;
  const filterModel = modelIdx !== -1 ? args[modelIdx + 1] : null;

  const target = args[0];

  if (target === '-') {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => {
      printReport(Buffer.concat(chunks).toString('utf8'), filterProvider, filterModel);
    });
    return;
  }

  if (!fs.existsSync(target)) {
    console.error(`Erreur: fichier introuvable: ${target}`);
    process.exitCode = 1;
    return;
  }

  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const status = license.getStatus();
    if (!status.active) {
      printBatchLockedNotice(target);
      return;
    }
    const csvIdx = args.indexOf('--csv');
    const csvPath = csvIdx !== -1 ? args[csvIdx + 1] : null;
    runBatch(target, filterProvider, filterModel, csvPath);
    return;
  }

  const text = fs.readFileSync(target, 'utf8');
  printReport(text, filterProvider, filterModel);
}

main();
