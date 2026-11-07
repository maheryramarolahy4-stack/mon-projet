import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { pool } from '../config/db.js';
import { jwtSecret } from '../config/security.js';

const googleClient = new OAuth2Client();

function makeToken(user) {
  return jwt.sign({ email: user.email }, jwtSecret, {
    subject: String(user.id_user), expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

async function createDefaultWallets(connection, userId) {
  const defaults = [
    ['Espèces', 'CASH'], ['MVola', 'MOBILE_MONEY'],
    ['Orange Money', 'MOBILE_MONEY'], ['Compte bancaire', 'BANK']
  ];
  for (const [name, type] of defaults) {
    await connection.execute(
      'INSERT INTO portefeuilles (id_user, nom, type_wallet, solde_initial, devise) VALUES (?, ?, ?, 0, \'MGA\')',
      [userId, name, type]
    );
  }
}

export async function register(req, res, next) {
  const { nom, prenom = '', email, password } = req.body;
  if (!nom?.trim() || !email?.trim() || !password || password.length < 8) {
    return res.status(400).json({ message: 'Nom, e-mail et mot de passe (8 caractères minimum) sont obligatoires.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute('SELECT id_user FROM utilisateurs WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée.' });
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)',
      [nom.trim(), prenom.trim(), email.trim().toLowerCase(), hash]
    );
    const id = result.insertId;
    await createDefaultWallets(connection, id);
    await connection.commit();
    const user = { id_user: id, nom: nom.trim(), prenom: prenom.trim(), email: email.trim().toLowerCase() };
    res.status(201).json({ message: 'Compte créé avec succès.', token: makeToken(user), user });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { connection?.release(); }
}

export async function googleLogin(req, res, next) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'La connexion Google n’est pas encore configurée sur le serveur.' });
  }
  const { credential } = req.body;
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ message: 'Jeton Google manquant.' });
  }
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
  } catch {
    return res.status(401).json({ message: 'Le jeton Google est invalide ou expiré.' });
  }
  let connection;
  try {
    const profile = ticket.getPayload();
    if (!profile?.email || !profile.email_verified) {
      return res.status(401).json({ message: 'Google doit confirmer votre adresse e-mail.' });
    }
    const email = profile.email.trim().toLowerCase();
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      'SELECT id_user, nom, prenom, email, statut FROM utilisateurs WHERE email=? FOR UPDATE', [email]
    );
    let user;
    let status = 200;
    if (existing.length) {
      const row = existing[0];
      if (row.statut !== 'ACTIF') {
        await connection.rollback();
        return res.status(403).json({ message: 'Ce compte est désactivé.' });
      }
      user = { id_user: row.id_user, nom: row.nom, prenom: row.prenom, email: row.email };
    } else {
      const fullName = String(profile.name || profile.given_name || 'Utilisateur Google').trim();
      const firstSpace = fullName.indexOf(' ');
      const prenom = firstSpace < 0 ? fullName : fullName.slice(0, firstSpace);
      const nom = firstSpace < 0 ? fullName : fullName.slice(firstSpace + 1);
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      const [created] = await connection.execute(
        'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe) VALUES (?, ?, ?, ?)',
        [nom, prenom, email, passwordHash]
      );
      user = { id_user: created.insertId, nom, prenom, email };
      await createDefaultWallets(connection, user.id_user);
      status = 201;
    }
    await connection.commit();
    res.status(status).json({ message: 'Connexion Google réussie.', token: makeToken(user), user });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    connection?.release();
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'E-mail et mot de passe requis.' });
    const [rows] = await pool.execute(
      'SELECT id_user, nom, prenom, email, mot_de_passe, statut FROM utilisateurs WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].mot_de_passe))) {
      return res.status(401).json({ message: 'E-mail ou mot de passe incorrect.' });
    }
    const row = rows[0];
    if (row.statut !== 'ACTIF') return res.status(403).json({ message: 'Ce compte est désactivé.' });
    const user = { id_user: row.id_user, nom: row.nom, prenom: row.prenom, email: row.email };
    res.json({ message: 'Connexion réussie.', token: makeToken(user), user });
  } catch (error) { next(error); }
}

export async function me(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id_user, nom, prenom, email, date_creation FROM utilisateurs WHERE id_user = ?', [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ user: rows[0] });
  } catch (error) { next(error); }
}

export async function updateMe(req, res, next) {
  try {
    const { nom, prenom = '' } = req.body;
    if (!nom?.trim()) return res.status(400).json({ message: 'Le nom est obligatoire.' });
    await pool.execute('UPDATE utilisateurs SET nom=?, prenom=? WHERE id_user=?', [nom.trim(), String(prenom).trim(), req.user.id]);
    const [rows] = await pool.execute('SELECT id_user, nom, prenom, email, date_creation FROM utilisateurs WHERE id_user=?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json({ user: rows[0] });
  } catch (error) { next(error); }
}
