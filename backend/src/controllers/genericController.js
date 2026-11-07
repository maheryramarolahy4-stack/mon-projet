import { pool } from '../config/db.js';

export async function categories(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT id_categorie, nom, type_categorie FROM categories WHERE id_user IS NULL OR id_user=? ORDER BY nom', [req.user.id]);
    res.json({ categories: rows });
  } catch (error) { next(error); }
}

export async function listBudgets(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT b.id_budget,b.nom,b.montant_limite AS limit_amount,b.periode_debut,b.periode_fin,c.nom AS category,
      COALESCE((SELECT SUM(t.montant) FROM transactions t WHERE t.id_user=b.id_user AND t.type_transaction='DEPENSE'
        AND t.date_transaction BETWEEN b.periode_debut AND b.periode_fin AND (b.id_categorie IS NULL OR t.id_categorie=b.id_categorie)),0) AS spent
      FROM budgets b LEFT JOIN categories c ON c.id_categorie=b.id_categorie WHERE b.id_user=? ORDER BY b.id_budget DESC`, [req.user.id]);
    res.json({ budgets: rows });
  } catch (error) { next(error); }
}
export async function createBudget(req, res, next) {
  try {
    const { nom, montant_limite, id_categorie = null, periode_debut, periode_fin } = req.body;
    if (!nom?.trim() || !(Number(montant_limite) > 0) || !periode_debut || !periode_fin || periode_fin < periode_debut) return res.status(400).json({ message: 'Nom, montant et période valides requis.' });
    if (id_categorie) {
      const [category] = await pool.execute('SELECT id_categorie FROM categories WHERE id_categorie=? AND (id_user IS NULL OR id_user=?)', [id_categorie,req.user.id]);
      if (!category.length) return res.status(400).json({ message: 'Catégorie invalide.' });
    }
    const [r] = await pool.execute('INSERT INTO budgets (id_user,id_categorie,nom,montant_limite,periode_debut,periode_fin) VALUES (?,?,?,?,?,?)', [req.user.id,id_categorie,nom.trim(),Number(montant_limite),periode_debut,periode_fin]);
    res.status(201).json({ message: 'Budget créé.', id_budget: r.insertId });
  } catch (error) { next(error); }
}
export async function updateBudget(req, res, next) {
  try {
    const { nom, montant_limite, id_categorie = null, periode_debut, periode_fin } = req.body;
    if (!nom?.trim() || !(Number(montant_limite) > 0) || !periode_debut || !periode_fin || periode_fin < periode_debut) return res.status(400).json({ message: 'Nom, montant et période valides requis.' });
    if (id_categorie) {
      const [category] = await pool.execute('SELECT id_categorie FROM categories WHERE id_categorie=? AND (id_user IS NULL OR id_user=?)', [id_categorie,req.user.id]);
      if (!category.length) return res.status(400).json({ message: 'Catégorie invalide.' });
    }
    const [existing] = await pool.execute('SELECT id_budget FROM budgets WHERE id_budget=? AND id_user=?', [req.params.id,req.user.id]);
    if (!existing.length) return res.status(404).json({ message: 'Budget introuvable.' });
    await pool.execute('UPDATE budgets SET nom=?,id_categorie=?,montant_limite=?,periode_debut=?,periode_fin=? WHERE id_budget=? AND id_user=?', [nom.trim(),id_categorie,Number(montant_limite),periode_debut,periode_fin,req.params.id,req.user.id]);
    res.json({ message: 'Budget modifié.' });
  } catch (error) { next(error); }
}
export async function deleteBudget(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM budgets WHERE id_budget=? AND id_user=?', [req.params.id,req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Budget introuvable.' });
    res.json({ message: 'Budget supprimé.' });
  } catch (error) { next(error); }
}

export async function listSavings(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT o.id_objectif,o.nom,o.montant_cible,o.date_limite,o.statut,COALESCE(SUM(c.montant),0) AS saved
      FROM objectifs_epargne o LEFT JOIN contributions c ON c.id_objectif=o.id_objectif
      WHERE o.id_user=? GROUP BY o.id_objectif ORDER BY o.id_objectif DESC`, [req.user.id]);
    res.json({ goals: rows });
  } catch (error) { next(error); }
}
export async function createSaving(req, res, next) {
  try {
    const { nom, montant_cible, date_limite } = req.body;
    if (!nom?.trim() || !(Number(montant_cible) > 0)) return res.status(400).json({ message: 'Nom et montant cible requis.' });
    const [r] = await pool.execute('INSERT INTO objectifs_epargne (id_user,nom,montant_cible,date_limite) VALUES (?,?,?,?)', [req.user.id,nom.trim(),Number(montant_cible),date_limite || null]);
    res.status(201).json({ message: 'Objectif créé.', id_objectif: r.insertId });
  } catch (error) { next(error); }
}
export async function updateSaving(req, res, next) {
  try {
    const { nom, montant_cible, date_limite } = req.body;
    if (!nom?.trim() || !(Number(montant_cible) > 0)) return res.status(400).json({ message: 'Nom et montant cible requis.' });
    const [existing] = await pool.execute('SELECT id_objectif FROM objectifs_epargne WHERE id_objectif=? AND id_user=?', [req.params.id,req.user.id]);
    if (!existing.length) return res.status(404).json({ message: 'Objectif introuvable.' });
    await pool.execute('UPDATE objectifs_epargne SET nom=?,montant_cible=?,date_limite=? WHERE id_objectif=? AND id_user=?', [nom.trim(),Number(montant_cible),date_limite||null,req.params.id,req.user.id]);
    res.json({ message: 'Objectif modifié.' });
  } catch (error) { next(error); }
}
export async function deleteSaving(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM objectifs_epargne WHERE id_objectif=? AND id_user=?', [req.params.id,req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Objectif introuvable.' });
    res.json({ message: 'Objectif supprimé.' });
  } catch (error) { next(error); }
}
export async function addContribution(req, res, next) {
  try {
    const { montant, description = '' } = req.body;
    const [owned] = await pool.execute('SELECT id_objectif FROM objectifs_epargne WHERE id_objectif=? AND id_user=?', [req.params.id,req.user.id]);
    if (!owned.length) return res.status(404).json({ message: 'Objectif introuvable.' });
    if (!(Number(montant) > 0)) return res.status(400).json({ message: 'Montant invalide.' });
    await pool.execute('INSERT INTO contributions (id_objectif,montant,description) VALUES (?,?,?)', [req.params.id,Number(montant),description]);
    res.status(201).json({ message: 'Contribution ajoutée.' });
  } catch (error) { next(error); }
}
export async function listDebts(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT d.id_dette,d.personne,d.type_dette,d.montant_initial,d.date_echeance,d.statut,
      COALESCE(SUM(r.montant),0) AS paid FROM dettes d LEFT JOIN remboursements r ON r.id_dette=d.id_dette
      WHERE d.id_user=? GROUP BY d.id_dette ORDER BY d.id_dette DESC`, [req.user.id]);
    res.json({ debts: rows });
  } catch (error) { next(error); }
}
export async function createDebt(req, res, next) {
  try {
    const { personne, type_dette, montant_initial, date_echeance } = req.body;
    if (!personne?.trim() || !['OWED','LENT'].includes(type_dette) || !(Number(montant_initial) > 0)) return res.status(400).json({ message: 'Personne, type OWED/LENT et montant requis.' });
    const [r] = await pool.execute('INSERT INTO dettes (id_user,personne,type_dette,montant_initial,date_echeance) VALUES (?,?,?,?,?)', [req.user.id,personne.trim(),type_dette,Number(montant_initial),date_echeance || null]);
    res.status(201).json({ message: 'Dette enregistrée.', id_dette: r.insertId });
  } catch (error) { next(error); }
}
export async function updateDebt(req, res, next) {
  try {
    const { personne, type_dette, montant_initial, date_echeance } = req.body;
    if (!personne?.trim() || !['OWED','LENT'].includes(type_dette) || !(Number(montant_initial) > 0)) return res.status(400).json({ message: 'Personne, type et montant valides requis.' });
    const [existing] = await pool.execute('SELECT id_dette FROM dettes WHERE id_dette=? AND id_user=?', [req.params.id,req.user.id]);
    if (!existing.length) return res.status(404).json({ message: 'Dette introuvable.' });
    const [repayments] = await pool.execute('SELECT COALESCE(SUM(montant),0) AS paid FROM remboursements WHERE id_dette=?', [req.params.id]);
    if (Number(montant_initial) < Number(repayments[0].paid)) return res.status(400).json({ message: 'Le montant total ne peut pas être inférieur aux remboursements déjà enregistrés.' });
    await pool.execute('UPDATE dettes SET personne=?,type_dette=?,montant_initial=?,date_echeance=? WHERE id_dette=? AND id_user=?', [personne.trim(),type_dette,Number(montant_initial),date_echeance||null,req.params.id,req.user.id]);
    res.json({ message: 'Dette modifiée.' });
  } catch (error) { next(error); }
}
export async function deleteDebt(req, res, next) {
  try {
    const [result] = await pool.execute('DELETE FROM dettes WHERE id_dette=? AND id_user=?', [req.params.id,req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Dette introuvable.' });
    res.json({ message: 'Dette supprimée.' });
  } catch (error) { next(error); }
}
export async function addRepayment(req, res, next) {
  const { montant, description = '' } = req.body;
  if (!(Number(montant) > 0)) return res.status(400).json({ message: 'Montant invalide.' });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [debts] = await connection.execute('SELECT id_dette,montant_initial FROM dettes WHERE id_dette=? AND id_user=? FOR UPDATE', [req.params.id,req.user.id]);
    if (!debts.length) { await connection.rollback(); return res.status(404).json({ message: 'Dette introuvable.' }); }
    const [repayments] = await connection.execute('SELECT COALESCE(SUM(montant),0) AS paid FROM remboursements WHERE id_dette=?', [req.params.id]);
    if (Number(repayments[0].paid)+Number(montant)>Number(debts[0].montant_initial)) { await connection.rollback(); return res.status(400).json({ message: 'Le remboursement dépasse le montant restant.' }); }
    await connection.execute('INSERT INTO remboursements (id_dette,montant,description) VALUES (?,?,?)', [req.params.id,Number(montant),description]);
    const settled=Number(repayments[0].paid)+Number(montant)>=Number(debts[0].montant_initial);
    if(settled) await connection.execute('UPDATE dettes SET statut=\'REGLEE\' WHERE id_dette=? AND id_user=?',[req.params.id,req.user.id]);
    await connection.commit();
    res.status(201).json({ message: 'Remboursement enregistré.' });
  } catch (error) { await connection.rollback(); next(error); }
  finally { connection.release(); }
}
export async function listTransfers(req, res, next) {
  try {
    const [rows] = await pool.execute(`SELECT tr.*,s.nom AS wallet_source,d.nom AS wallet_destination FROM transferts tr
      JOIN portefeuilles s ON s.id_wallet=tr.id_wallet_source JOIN portefeuilles d ON d.id_wallet=tr.id_wallet_destination
      WHERE tr.id_user=? ORDER BY tr.date_transfert DESC`, [req.user.id]);
    res.json({ transfers: rows });
  } catch (error) { next(error); }
}
export async function createTransfer(req, res, next) {
  const { id_wallet_source, id_wallet_destination, montant, frais = 0, description = '' } = req.body;
  if (!id_wallet_source || !id_wallet_destination || Number(id_wallet_source) === Number(id_wallet_destination) || !(Number(montant) > 0) || Number(frais) < 0) return res.status(400).json({ message: 'Portefeuilles distincts, montant positif et frais valides requis.' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [wallets] = await conn.execute('SELECT id_wallet FROM portefeuilles WHERE id_user=? AND id_wallet IN (?,?) FOR UPDATE', [req.user.id,id_wallet_source,id_wallet_destination]);
    if (wallets.length !== 2) { await conn.rollback(); return res.status(400).json({ message: 'Portefeuille source ou destination invalide.' }); }
    const [bal] = await conn.execute(`SELECT p.solde_initial + COALESCE(SUM(CASE WHEN t.type_transaction='REVENU' THEN t.montant WHEN t.type_transaction='DEPENSE' THEN -t.montant ELSE 0 END),0)
      + COALESCE((SELECT SUM(x.montant) FROM transferts x WHERE x.id_wallet_destination=p.id_wallet),0)
      - COALESCE((SELECT SUM(x.montant+x.frais) FROM transferts x WHERE x.id_wallet_source=p.id_wallet),0) AS balance
      FROM portefeuilles p LEFT JOIN transactions t ON t.id_wallet=p.id_wallet WHERE p.id_wallet=? GROUP BY p.id_wallet`, [id_wallet_source]);
    if (!bal.length || Number(bal[0].balance) < Number(montant) + Number(frais)) { await conn.rollback(); return res.status(409).json({ message: 'Solde insuffisant pour effectuer ce transfert.' }); }
    const [r] = await conn.execute('INSERT INTO transferts (id_user,id_wallet_source,id_wallet_destination,montant,frais,description) VALUES (?,?,?,?,?,?)', [req.user.id,id_wallet_source,id_wallet_destination,Number(montant),Number(frais),description]);
    await conn.commit(); res.status(201).json({ message: 'Transfert effectué.', id_transfert: r.insertId });
  } catch (error) { await conn.rollback(); next(error); } finally { conn.release(); }
}
