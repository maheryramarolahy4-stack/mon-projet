import { pool } from '../config/db.js';

export async function listWallets(req, res, next) {
  try {
    const [existingWallets] = await pool.execute('SELECT id_wallet FROM portefeuilles WHERE id_user=? LIMIT 1', [req.user.id]);
    if (!existingWallets.length) {
      const defaults = [['Espèces','CASH'],['MVola','MOBILE_MONEY'],['Orange Money','MOBILE_MONEY'],['Compte bancaire','BANK']];
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.execute('SELECT id_user FROM utilisateurs WHERE id_user=? FOR UPDATE', [req.user.id]);
        const [check] = await connection.execute('SELECT id_wallet FROM portefeuilles WHERE id_user=? LIMIT 1', [req.user.id]);
        if (!check.length) {
          for (const [name,type] of defaults) {
            await connection.execute('INSERT INTO portefeuilles (id_user,nom,type_wallet,solde_initial,devise) VALUES (?,?,?,0,\'MGA\')', [req.user.id,name,type]);
          }
        }
        await connection.commit();
      } catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    }
    const [rows] = await pool.execute(`
      SELECT p.id_wallet, p.nom, p.type_wallet, p.solde_initial, p.devise,
      p.solde_initial + COALESCE(SUM(
        CASE WHEN t.type_transaction = 'REVENU' THEN t.montant
             WHEN t.type_transaction = 'DEPENSE' THEN -t.montant ELSE 0 END
      ), 0) + COALESCE((SELECT SUM(tr.montant) FROM transferts tr WHERE tr.id_wallet_destination=p.id_wallet),0)
        - COALESCE((SELECT SUM(tr.montant + tr.frais) FROM transferts tr WHERE tr.id_wallet_source=p.id_wallet),0) AS solde_actuel
      FROM portefeuilles p
      LEFT JOIN transactions t ON t.id_wallet=p.id_wallet
      WHERE p.id_user=? GROUP BY p.id_wallet ORDER BY p.id_wallet`, [req.user.id]);
    res.json({ wallets: rows.map(w => ({ ...w, balance: Number(w.solde_actuel) })) });
  } catch (error) { next(error); }
}

export async function createWallet(req, res, next) {
  try {
    const { nom, type_wallet = 'CASH', solde_initial = 0 } = req.body;
    if (!nom?.trim() || !Number.isFinite(Number(solde_initial)) || Number(solde_initial) < 0) {
      return res.status(400).json({ message: 'Nom et solde initial valide requis.' });
    }
    const [result] = await pool.execute(
      'INSERT INTO portefeuilles (id_user, nom, type_wallet, solde_initial, devise) VALUES (?, ?, ?, ?, \'MGA\')',
      [req.user.id, nom.trim(), type_wallet, Number(solde_initial)]
    );
    res.status(201).json({ message: 'Portefeuille créé.', id_wallet: result.insertId });
  } catch (error) { next(error); }
}

export async function updateWallet(req, res, next) {
  try {
    const { nom, type_wallet, solde_initial } = req.body;
    const validTypes = ['CASH', 'MOBILE_MONEY', 'BANK', 'OTHER'];
    if (!nom?.trim() || !validTypes.includes(type_wallet) || !Number.isFinite(Number(solde_initial)) || Number(solde_initial) < 0) {
      return res.status(400).json({ message: 'Nom, type et solde initial valides requis.' });
    }
    const [existing] = await pool.execute('SELECT id_wallet FROM portefeuilles WHERE id_wallet=? AND id_user=?', [req.params.id, req.user.id]);
    if (!existing.length) return res.status(404).json({ message: 'Portefeuille introuvable.' });
    await pool.execute(
      'UPDATE portefeuilles SET nom=?, type_wallet=?, solde_initial=? WHERE id_wallet=? AND id_user=?',
      [nom.trim(), type_wallet, Number(solde_initial), req.params.id, req.user.id]
    );
    res.json({ message: 'Portefeuille modifié.' });
  } catch (error) { next(error); }
}

export async function deleteWallet(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM portefeuilles WHERE id_wallet=? AND id_user=?', [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Portefeuille introuvable.' });
    res.json({ message: 'Portefeuille supprimé.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Ce portefeuille contient des opérations et ne peut pas être supprimé.' });
    next(error);
  }
}
