import { BriefcaseBusiness, CarFront, Coffee, Gift, ShoppingBasket, Wifi, Pencil, Trash2 } from 'lucide-react'
const icons = { shopping: ShoppingBasket, briefcase: BriefcaseBusiness, car: CarFront, wifi: Wifi, gift: Gift, coffee: Coffee }
export default function TransactionList({ transactions, compact = false, onEdit, onDelete }) {
  return <div className="divide-y divide-slate-50">
    {transactions.slice(0, compact ? 5 : transactions.length).map((t) => {
      const Icon = icons[t.icon] || ShoppingBasket
      const income = t.amount > 0
      return <div key={t.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${income ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}><Icon size={18}/></div>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-ink sm:text-sm">{t.name}</p><p className="mt-1 text-[10px] text-slate-400">{t.category} · {t.date}</p></div>
        <div className="text-right"><p className={`whitespace-nowrap text-xs font-extrabold sm:text-sm ${income ? 'text-emerald-600' : 'text-ink'}`}>{income ? '+' : '−'}{new Intl.NumberFormat('fr-FR').format(Math.abs(t.amount))} Ar</p><p className="mt-1 text-[10px] text-slate-400">{t.wallet}</p></div>
        {!compact && <div className="flex gap-1"><button aria-label="Modifier la transaction" onClick={()=>onEdit?.(t)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-brand"><Pencil size={15}/></button><button aria-label="Supprimer la transaction" onClick={()=>onDelete?.(t.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 size={15}/></button></div>}
      </div>
    })}
    {!transactions.length && <p className="py-8 text-center text-sm text-slate-400">Aucune transaction pour le moment.</p>}
  </div>
}