import { LayoutDashboard, ArrowLeftRight, Wallet, ChartNoAxesCombined, PiggyBank, HandCoins, ReceiptText, Settings, CircleHelp, LogOut, X } from 'lucide-react'

const nav = [
  { label: 'Vue d’ensemble', icon: LayoutDashboard, group: 'MENU' },
  { label: 'Transactions', icon: ArrowLeftRight, group: 'MENU' },
  { label: 'Portefeuilles', icon: Wallet, group: 'GESTION' },
  { label: 'Budgets', icon: ChartNoAxesCombined, group: 'GESTION' },
  { label: 'Épargne', icon: PiggyBank, group: 'GESTION' },
  { label: 'Dettes & prêts', icon: HandCoins, group: 'GESTION' },
  { label: 'Rapports', icon: ReceiptText, group: 'AUTRES' },
  { label: 'Paramètres', icon: Settings, group: 'AUTRES' }
]

export default function Sidebar({ active, onNavigate, open, onClose, onReset, transactionCount=0 }) {
  let lastGroup = ''
  return (
    <>
      {open && <button aria-label="Fermer le menu" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-100 bg-white px-5 py-6 transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-blue-200"><Wallet size={23} /></div>
            <div><div className="font-display text-xl font-extrabold tracking-tight text-ink">MY WALLET</div><div className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Votre argent, sereinement</div></div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"><X size={19}/></button>
        </div>
        <nav className="flex-1 space-y-6">
          {nav.map((item) => {
            const showGroup = item.group !== lastGroup
            lastGroup = item.group
            const Icon = item.icon
            return <div key={item.label}>
              {showGroup && <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[.18em] text-slate-400">{item.group}</p>}
              <button onClick={() => { onNavigate(item.label); onClose() }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-bold transition ${active === item.label ? 'bg-brand text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}>
                <Icon size={18} strokeWidth={2.1}/><span>{item.label}</span>
                {item.label === 'Transactions' && <span className={`ml-auto rounded-md px-2 py-0.5 text-[10px] ${active === item.label ? 'bg-white/20 text-white' : 'bg-blue-50 text-brand'}`}>{transactionCount}</span>}
              </button>
            </div>
          })}
        </nav>
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
          <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-white text-brand shadow-sm"><CircleHelp size={18}/></div>
          <p className="text-sm font-extrabold text-ink">Besoin d’aide ?</p>
          <p className="mb-3 mt-1 text-xs leading-5 text-slate-500">Retrouvez des conseils pour mieux gérer votre budget.</p>
          <button className="text-xs font-extrabold text-brand hover:underline">Centre d’assistance →</button>
        </div>
        <button onClick={onReset} className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-500"><LogOut size={18}/> Réinitialiser les données</button>
      </aside>
    </>
  )
}