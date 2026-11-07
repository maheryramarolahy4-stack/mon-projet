import { pool } from '../config/db.js';

async function walletBalance(connection, walletId, userId) {
  const [rows] = await connection.execute(`
    SELECT p.solde_initial
      + COALESCE(SUM(CASE WHEN t.type_transaction='REVENU' THEN t.montant WHEN t.type_transaction='DEPENSE' THEN -t.montant ELSE 0 END),0)
      + COALESCE((SELECT SUM(tr.montant) FROM transferts tr WHERE tr.id_wallet_destination=p.id_wallet),0)
      - COALESCE((SELECT SUM(tr.montant+tr.frais) FROM transferts tr WHERE tr.id_wallet_source=p.id_wallet),0) AS balance
    FROM portefeuilles p LEFT JOIN transactions t ON t.id_wallet=p.id_wallet
    WHERE p.id_wallet=? AND p.id_user=? GROUP BY p.id_wallet`, [walletId, userId]);
  return rows.length ? Number(rows[0].balance) : null;
}

export async function listTransactions(req, res, next) {
  try {
    const [rows] = await pool.execute(`
      SELECT t.id_transaction, t.libelle AS name, c.nom AS category,
        t.type_transaction, t.montant, t.date_transaction, p.nom AS wallet,
        CASE WHEN t.type_transaction='REVENU' THEN t.montant ELSE -t.montant END AS amount
      FROM transactions t
      JOIN portefeuilles p ON p.id_wallet=t.id_wallet
      LEFT JOIN categories c ON c.id_categorie=t.id_categorie
      WHERE t.id_user=? ORDER BY t.date_transaction DESC, t.id_transaction DESC`, [req.user.id]);
    res.json({ transactions: rows.map(r => ({ ...r, id: r.id_transaction, date: r.date_transaction, amount: Number(r.amount), icon: r.type_transaction === 'REVENU' ? 'gift' : 'shopping' })) });
  } catch (error) { next(error); }
}

export async function createTransaction(req, res, next) {
  const { name, libelle, amount, montant, category = 'Autres', wallet, id_wallet, type, date } = req.body;
  const label = String(name || libelle || '').trim();
  const value = Number(montant ?? (amount !== undefined ? Math.abs(Number(amount)) : NaN));
  const operationType = type || (Number(amount) >= 0 ? 'REVENU' : 'DEPENSE');
  if (!label || !Number.isFinite(value) || value <= 0 || !['REVENU', 'DEPENSE'].includes(operationType)) {
    return res.status(400).json({ message: 'Libellé, montant positif et type REVENU/DEPENSE requis.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let walletId = Number(id_wallet) || null;
    if (!walletId && wallet) {
      const [walletRows] = await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_user=? AND nom=? LIMIT 1', [req.user.id, wallet]);
      walletId = walletRows[0]?.id_wallet || null;
    }
    if (!walletId) {
      const [walletRows] = await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_user=? ORDER BY id_wallet LIMIT 1', [req.user.id]);
      walletId = walletRows[0]?.id_wallet || null;
    }
    const [owned] = await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_wallet=? AND id_user=?', [walletId, req.user.id]);
    if (!owned.length) { await connection.rollback(); return res.status(400).json({ message: 'Portefeuille invalide.' }); }
    await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_wallet=? AND id_user=? FOR UPDATE', [walletId, req.user.id]);
    const balance = await walletBalance(connection, walletId, req.user.id);
    if (operationType === 'DEPENSE' && balance < value) { await connection.rollback(); return res.status(409).json({ message: 'Solde insuffisant dans ce portefeuille.' }); }
    let categoryId = null;
    const [cats] = await connection.execute('SELECT id_categorie FROM categories WHERE nom=? AND (id_user IS NULL OR id_user=?) LIMIT 1', [category, req.user.id]);
    if (cats.length) categoryId = cats[0].id_categorie;
    const [result] = await connection.execute(
      `INSERT INTO transactions (id_user,id_wallet,id_categorie,type_transaction,montant,libelle,date_transaction)
       VALUES (?,?,?,?,?,?,COALESCE(?,NOW()))`,
      [req.user.id, walletId, categoryId, operationType, value, label, date ? `${date} 12:00:00` : null]
    );
    await connection.commit();
    const [created] = await pool.execute(`
      SELECT t.id_transaction, t.libelle AS name, c.nom AS category, p.nom AS wallet,
      t.type_transaction, t.montant,
      CASE WHEN t.type_transaction='REVENU' THEN t.montant ELSE -t.montant END AS amount,
      t.date_transaction AS date
      FROM transactions t JOIN portefeuilles p ON p.id_wallet=t.id_wallet
      LEFT JOIN categories c ON c.id_categorie=t.id_categorie WHERE t.id_transaction=?`, [result.insertId]);
    const row = created[0];
    res.status(201).json({ message: 'Transaction enregistrée.', transaction: { ...row, id: row.id_transaction, amount: Number(row.amount), icon: operationType === 'REVENU' ? 'gift' : 'shopping' } });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}

export async function updateTransaction(req, res, next) {
  const { name, amount, category = 'Autres', id_wallet, wallet, type, date } = req.body;
  const label = String(name || '').trim();
  const value = Number(amount);
  const operationType = type || (value >= 0 ? 'REVENU' : 'DEPENSE');
  if (!label || !Number.isFinite(value) || value === 0 || !['REVENU', 'DEPENSE'].includes(operationType)) {
    return res.status(400).json({ message: 'Libellé, montant et type valides requis.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let walletId = Number(id_wallet) || null;
    if (!walletId && wallet) {
      const [walletRows] = await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_user=? AND nom=? LIMIT 1', [req.user.id, wallet]);
      walletId = walletRows[0]?.id_wallet || null;
    }
    const [owned] = await connection.execute('SELECT id_transaction,id_wallet,montant,type_transaction FROM transactions WHERE id_transaction=? AND id_user=? FOR UPDATE', [req.params.id, req.user.id]);
    if (!owned.length) { await connection.rollback(); return res.status(404).json({ message: 'Transaction introuvable.' }); }
    const [walletRows] = await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_wallet=? AND id_user=?', [walletId, req.user.id]);
    if (!walletRows.length) { await connection.rollback(); return res.status(400).json({ message: 'Portefeuille invalide.' }); }
    await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_wallet=? AND id_user=? FOR UPDATE', [walletId, req.user.id]);
    const balance = await walletBalance(connection, walletId, req.user.id);
    const old = owned[0];
    const oldSigned = old.type_transaction === 'REVENU' ? Number(old.montant) : -Number(old.montant);
    const available = Number(old.id_wallet) === Number(walletId) ? balance - oldSigned : balance;
    if (operationType === 'DEPENSE' && available < Math.abs(value)) { await connection.rollback(); return res.status(409).json({ message: 'Solde insuffisant dans ce portefeuille.' }); }
    const [categoryRows] = await connection.execute('SELECT id_categorie FROM categories WHERE nom=? AND (id_user IS NULL OR id_user=?) LIMIT 1', [category, req.user.id]);
    await connection.execute(
      `UPDATE transactions SET id_wallet=?, id_categorie=?, type_transaction=?, montant=?, libelle=?, date_transaction=COALESCE(?,date_transaction)
       WHERE id_transaction=? AND id_user=?`,
      [walletId, categoryRows[0]?.id_categorie || null, operationType, Math.abs(value), label, date ? `${date} 12:00:00` : null, req.params.id, req.user.id]
    );
    await connection.commit();
    res.json({ message: 'Transaction modifiée.' });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}

export async function deleteTransaction(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM transactions WHERE id_transaction=? AND id_user=?', [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Transaction introuvable.' });
    res.json({ message: 'Transaction supprimée.' });
  } catch (error) { next(error); }
}
