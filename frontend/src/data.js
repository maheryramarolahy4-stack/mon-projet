export const initialTransactions = [
  { id: 1, name: 'Courses au supermarché', category: 'Alimentation', date: 'Aujourd’hui, 10:42', amount: -48500, wallet: 'Espèces', icon: 'shopping' },
  { id: 2, name: 'Mission freelance', category: 'Travail', date: 'Aujourd’hui, 09:15', amount: 350000, wallet: 'MVola', icon: 'briefcase' },
  { id: 3, name: 'Transport et taxi', category: 'Transport', date: 'Hier, 18:20', amount: -12000, wallet: 'Espèces', icon: 'car' },
  { id: 4, name: 'Abonnement internet', category: 'Factures', date: 'Hier, 08:30', amount: -65000, wallet: 'Orange Money', icon: 'wifi' },
  { id: 5, name: 'Argent reçu', category: 'Autres revenus', date: '05 nov. 2026', amount: 120000, wallet: 'MVola', icon: 'gift' },
  { id: 6, name: 'Déjeuner', category: 'Alimentation', date: '04 nov. 2026', amount: -18000, wallet: 'Espèces', icon: 'coffee' }
]

export const wallets = [
  { id: 1, name: 'Espèces', type: 'Espèces', balance: 285000, color: 'blue', initials: 'Ar', number: '•••• 2841' },
  { id: 2, name: 'MVola', type: 'Mobile Money', balance: 425000, color: 'purple', initials: 'M', number: '•••• 9012' },
  { id: 3, name: 'Orange Money', type: 'Mobile Money', balance: 180000, color: 'orange', initials: 'O', number: '•••• 6630' },
  { id: 4, name: 'Compte bancaire', type: 'Banque', balance: 1250000, color: 'green', initials: 'B', number: '•••• 1128' }
]

export const budgets = [
  { id: 1, name: 'Alimentation', spent: 210000, limit: 300000, category: 'Alimentation', color: 'blue', icon: 'utensils' },
  { id: 2, name: 'Transport', spent: 85000, limit: 150000, category: 'Transport', color: 'orange', icon: 'car' },
  { id: 3, name: 'Loisirs', spent: 45000, limit: 100000, category: 'Loisirs', color: 'purple', icon: 'gamepad' },
  { id: 4, name: 'Factures', spent: 160000, limit: 180000, category: 'Factures', color: 'rose', icon: 'receipt' }
]

export const initialSavings = [
  { id: 1, name: 'Nouveau ordinateur', saved: 1250000, target: 2500000, date: '2027-03-31', emoji: '💻' },
  { id: 2, name: 'Voyage & vacances', saved: 480000, target: 1200000, date: '2027-06-30', emoji: '✈️' },
  { id: 3, name: 'Fonds d’urgence', saved: 850000, target: 1000000, date: '2026-12-31', emoji: '🛟' }
]

export const initialDebts = [
  { id: 1, name: 'Remboursement prêt — Andry', kind: 'À recevoir', amount: 250000, paid: 100000, date: '2026-11-15' },
  { id: 2, name: 'Prêt familial', kind: 'À payer', amount: 500000, paid: 200000, date: '2026-11-30' },
  { id: 3, name: 'Avance frais partagés — Tiana', kind: 'À recevoir', amount: 80000, paid: 0, date: '2026-11-20' }
]

export const formatMoney = (value) => new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0
}).format(Math.abs(value)) + ' Ar'
