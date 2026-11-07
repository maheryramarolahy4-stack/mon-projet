import { pool } from '../config/db.js';

export async function dashboard(req, res, next) {
  try {
    const [wallets] = await pool.execute(`
      SELECT p.id_wallet, p.nom, p.type_wallet, p.solde_initial,
        p.solde_initial + COALESCE(SUM(CASE WHEN t.type_transaction='REVENU' THEN t.montant WHEN t.type_transaction='DEPENSE' THEN -t.montant ELSE 0 END),0)
        + COALESCE((SELECT SUM(x.montant) FROM transferts x WHERE x.id_wallet_destination=p.id_wallet),0)
        - COALESCE((SELECT SUM(x.montant+x.frais) FROM transferts x WHERE x.id_wallet_source=p.id_wallet),0) AS balance
      FROM portefeuilles p LEFT JOIN transactions t ON t.id_wallet=p.id_wallet
      WHERE p.id_user=? GROUP BY p.id_wallet`, [req.user.id]);
    const [totals] = await pool.execute(`
      SELECT COALESCE(SUM(CASE WHEN type_transaction='REVENU' AND date_transaction >= DATE_FORMAT(CURDATE(),'%Y-%m-01') THEN montant ELSE 0 END),0) AS income_month,
             COALESCE(SUM(CASE WHEN type_transaction='DEPENSE' AND date_transaction >= DATE_FORMAT(CURDATE(),'%Y-%m-01') THEN montant ELSE 0 END),0) AS expense_month
      FROM transactions WHERE id_user=?`, [req.user.id]);
    const [recent] = await pool.execute(`
      SELECT t.id_transaction AS id, t.libelle AS name, c.nom AS category, p.nom AS wallet,
      CASE WHEN t.type_transaction='REVENU' THEN t.montant ELSE -t.montant END AS amount,
      t.date_transaction AS date, t.type_transaction
      FROM transactions t JOIN portefeuilles p ON p.id_wallet=t.id_wallet
      LEFT JOIN categories c ON c.id_categorie=t.id_categorie
      WHERE t.id_user=? ORDER BY t.date_transaction DESC LIMIT 8`, [req.user.id]);
    const [userRows] = await pool.execute('SELECT nom, prenom FROM utilisateurs WHERE id_user=?', [req.user.id]);
    res.json({
      user: userRows[0],
      totalBalance: wallets.reduce((sum, w) => sum + Number(w.balance), 0),
      incomeMonth: Number(totals[0].income_month),
      expenseMonth: Number(totals[0].expense_month),
      wallets,
      recentTransactions: recent.map(t => ({ ...t, amount: Number(t.amount), icon: t.type_transaction === 'REVENU' ? 'gift' : 'shopping' }))
    });
  } catch (error) { next(error); }
}
