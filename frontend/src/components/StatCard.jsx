import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
export default function StatCard({ title, value, change, positive, icon: Icon, tint }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-soft">
    <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-slate-400">{title}</p><p className="mt-2 font-display text-[clamp(1.25rem,2vw,1.7rem)] font-extrabold tracking-tight text-ink">{value}</p></div><div className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}><Icon size={20}/></div></div>
    <div className="mt-4 flex items-center gap-1.5 text-[11px]"><span className={`flex items-center gap-0.5 font-extrabold ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>{positive ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {change}</span><span className="text-slate-400">vs mois dernier</span></div>
  </div>
}