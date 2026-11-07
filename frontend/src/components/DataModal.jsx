import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const today = new Date().toISOString().slice(0, 10)
const field = (name, label, type = 'text', extra = {}) => ({ name, label, type, ...extra })

function fieldsFor(type, wallets, record = {}) {
  const walletOptions = wallets.map((wallet) => ({ value: wallet.name, label: wallet.name }))
  const categories = ['Alimentation', 'Transport', 'Factures', 'Loisirs', 'Santé', 'Logement', 'Travail', 'Autres revenus', 'Autres dépenses']
  const choices = (values) => values.map((value) => ({ value, label: value }))
  const fields = {
    transaction: [field('name', 'Libellé'), field('amount', 'Montant (Ar)', 'number', { min: 1 }), field('category', 'Catégorie', 'select', { options: choices(categories) }), field('wallet', 'Portefeuille', 'select', { options: walletOptions }), field('date', 'Date', 'date')],
    wallet: [field('name', 'Nom du portefeuille'), field('type', 'Type', 'select', { options: choices(['Espèces', 'Mobile Money', 'Banque', 'Autre']) }), field('balance', 'Solde initial (Ar)', 'number', { min: 0 })],
    budget: [field('name', 'Catégorie / nom du budget'), field('limit', 'Limite (Ar)', 'number', { min: 1 }), field('category', 'Catégorie', 'select', { options: choices(categories) }), field('startDate', 'Début de période', 'date'), field('endDate', 'Fin de période', 'date')],
    saving: [field('name', 'Nom de l’objectif'), field('target', 'Montant cible (Ar)', 'number', { min: 1 }), field('saved', 'Déjà épargné (Ar)', 'number', { min: 0 }), field('date', 'Échéance', 'date')],
    debt: [field('name', 'Personne / description'), field('kind', 'Type de dette', 'select', { options: choices(['À recevoir', 'À payer']) }), field('amount', 'Montant total (Ar)', 'number', { min: 1 }), field('paid', 'Déjà réglé (Ar)', 'number', { min: 0 }), field('date', 'Échéance', 'date')],
    transfer: [field('source', 'Depuis', 'select', { options: walletOptions }), field('destination', 'Vers', 'select', { options: walletOptions }), field('amount', 'Montant (Ar)', 'number', { min: 1 }), field('fees', 'Frais (Ar)', 'number', { min: 0 })],
    contribution: [field('amount', 'Montant de la contribution (Ar)', 'number', { min: 1 })],
    repayment: [field('amount', 'Montant du remboursement (Ar)', 'number', { min: 1 })],
    settings: [field('name', 'Nom affiché')]
  }
  const base = {
    transaction: { name: '', amount: '', direction: 'expense', category: 'Alimentation', wallet: walletOptions[0]?.value || '', date: today },
    wallet: { name: '', type: 'Espèces', balance: 0 },
    budget: { name: '', limit: '', category: 'Alimentation', startDate: today.slice(0, 8) + '01', endDate: today },
    saving: { name: '', target: '', saved: 0, date: '' },
    debt: { name: '', kind: 'À recevoir', amount: '', paid: 0, date: '' },
    transfer: { source: walletOptions[0]?.value || '', destination: walletOptions[1]?.value || '', amount: '', fees: 0 },
    contribution: { amount: '' },
    repayment: { amount: '' },
    settings: { name: '', email: '' }
  }
  const values = { ...base[type], ...record }
  if (type === 'transaction' && record) {
    values.amount = Math.abs(Number(record.amount || 0))
    values.direction = Number(record.amount) >= 0 ? 'income' : 'expense'
    const parsedDate = new Date(record.date)
    values.date = Number.isNaN(parsedDate.getTime()) ? today : parsedDate.toISOString().slice(0, 10)
  }
  if (type === 'wallet' && record) values.balance = record.initialBalance ?? record.solde_initial ?? record.balance ?? 0
  const visibleFields = (fields[type] || []).filter((item) => !(record && type === 'saving' && item.name === 'saved') && !(record && type === 'debt' && item.name === 'paid'))
  return { fields: visibleFields, values }
}

const titles = { transaction: 'Transaction', wallet: 'Portefeuille', budget: 'Budget', saving: 'Objectif d’épargne', debt: 'Dette ou prêt', transfer: 'Transfert', contribution: 'Ajouter une contribution', repayment: 'Enregistrer un remboursement', settings: 'Informations personnelles' }

export default function DataModal({ open, type = 'transaction', record, wallets = [], onClose, onSave }) {
  const config = fieldsFor(type, wallets, record)
  const [values, setValues] = useState(config.values)
  const [error, setError] = useState('')
  const missingWallets = (type === 'transaction' || type === 'transfer') && wallets.length === 0

  useEffect(() => {
    setValues(config.values)
    setError('')
  }, [open, type, record])

  if (!open) return null

  const submit = async (event) => {
    event.preventDefault()
    if (type === 'transfer' && values.source === values.destination) return setError('Choisissez deux portefeuilles différents.')
    setError('')
    const result = await onSave(values)
    if (typeof result === 'string') setError(result)
    else if (result !== false) onClose()
  }

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form onSubmit={submit} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-xl font-extrabold text-ink">{record ? 'Modifier' : 'Ajouter'} · {titles[type]}</h2><p className="mt-1 text-xs text-slate-400">Vos changements sont enregistrés dans votre compte sécurisé.</p></div><button type="button" onClick={onClose} aria-label="Fermer" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      {type === 'transaction' && <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setValues((current) => ({ ...current, direction: 'expense' }))} className={`rounded-lg py-2.5 text-xs font-extrabold ${(values.direction || (Number(values.amount) < 0 ? 'expense' : 'income')) === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}>Dépense</button><button type="button" onClick={() => setValues((current) => ({ ...current, direction: 'income' }))} className={`rounded-lg py-2.5 text-xs font-extrabold ${(values.direction || (Number(values.amount) < 0 ? 'expense' : 'income')) === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Revenu</button></div>}
      {config.fields.map((item) => <label key={item.name} className="mb-4 block text-xs font-bold text-slate-600">{item.label}{item.type === 'select' ? <select required value={values[item.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [item.name]: event.target.value }))} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-brand"><option value="" disabled>Choisir une option</option>{item.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={item.name !== 'date' && item.name !== 'endDate'} type={item.type} min={item.min} value={values[item.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [item.name]: event.target.value }))} placeholder={item.type === 'number' ? '0' : ''} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-brand"/>}</label>)}
      {missingWallets && <p role="alert" className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700">Aucun portefeuille n’est chargé. Actualisez la page; si le problème persiste, vérifiez l’API et la base MySQL.</p>}
      {error && <p role="alert" className="mb-3 text-xs font-semibold text-rose-600">{error}</p>}
      <div className="mt-5 flex gap-3"><button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-bold text-slate-500">Annuler</button><button disabled={missingWallets} className="h-11 flex-1 rounded-xl bg-brand text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">Enregistrer</button></div>
    </form>
  </div>
}
