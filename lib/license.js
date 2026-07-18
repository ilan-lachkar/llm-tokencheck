'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Cle PUBLIQUE Ed25519 uniquement (peut etre distribuee sans risque : elle
// permet de VERIFIER une signature mais pas d'en creer une). La cle privee
// correspondante reste dans tools/keys/ (tools/ n'est jamais publie sur npm,
// voir "files" dans package.json) et sert a signer une licence apres un
// paiement Stripe reel confirme.
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAVt9lacnnF3uGhW4R8S7oyKlGha98Iz/a3USD5nON7FE=
-----END PUBLIC KEY-----
`;

const STORE_DIR = path.join(os.homedir(), '.tokencheck');
const STORE_PATH = path.join(STORE_DIR, 'license.json');

function b64urlToBuf(s) {
  return Buffer.from(s, 'base64url');
}

// Retourne { valid: true, id, iat } ou { valid: false, reason }
function verifyLicenseKey(key) {
  if (typeof key !== 'string' || !key.startsWith('TC1.')) {
    return { valid: false, reason: 'format de cle invalide' };
  }
  const parts = key.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'format de cle invalide' };
  }
  const [, payloadB64, sigB64] = parts;
  let payloadRaw;
  try {
    payloadRaw = b64urlToBuf(payloadB64);
  } catch {
    return { valid: false, reason: 'payload illisible' };
  }
  let sig;
  try {
    sig = b64urlToBuf(sigB64);
  } catch {
    return { valid: false, reason: 'signature illisible' };
  }
  let publicKeyObj;
  try {
    publicKeyObj = crypto.createPublicKey(PUBLIC_KEY_PEM);
  } catch {
    return { valid: false, reason: 'cle publique invalide (bug interne)' };
  }
  let ok;
  try {
    ok = crypto.verify(null, payloadRaw, publicKeyObj, sig);
  } catch {
    return { valid: false, reason: 'echec de verification cryptographique' };
  }
  if (!ok) {
    return { valid: false, reason: 'signature invalide' };
  }
  let payload;
  try {
    payload = JSON.parse(payloadRaw.toString('utf8'));
  } catch {
    return { valid: false, reason: 'payload JSON invalide' };
  }
  return { valid: true, id: payload.id, iat: payload.iat };
}

function activate(key) {
  const result = verifyLicenseKey(key);
  if (!result.valid) return result;
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(
    STORE_PATH,
    JSON.stringify({ key, id: result.id, activatedAt: new Date().toISOString() }, null, 2)
  );
  return result;
}

function deactivate() {
  if (fs.existsSync(STORE_PATH)) {
    fs.unlinkSync(STORE_PATH);
    return true;
  }
  return false;
}

// Retourne { active: true, id } ou { active: false }
function getStatus() {
  if (!fs.existsSync(STORE_PATH)) return { active: false };
  let stored;
  try {
    stored = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch {
    return { active: false };
  }
  const result = verifyLicenseKey(stored.key);
  if (!result.valid) return { active: false };
  return { active: true, id: result.id };
}

module.exports = { verifyLicenseKey, activate, deactivate, getStatus, STORE_PATH };
