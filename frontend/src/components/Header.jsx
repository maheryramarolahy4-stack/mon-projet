import { Bell, Menu, Search, Plus, ChevronDown } from 'lucide-react'
import { useState } from 'react'
export default function Header({ onMenu, onAdd, onSearch, onNavigate, user={name:'Mahery'} }) {
  const [query,setQuery]=useState('')
  return <header className="sticky top-0 z-30 flex h-[78px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
    <div className="flex items-center gap-3">
      <button onClick={onMenu} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={21}/></button>
      <div className="relative hidden sm:block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(event)=>{setQuery(event.target.value);onSearch(event.target.value)}} onKeyDown={(event)=>event.key==='Enter'&&onNavigate('Transactions')} placeholder="Rechercher..." className="h-10 w-56 rounded-xl border-0 bg-slate-50 pl-10 pr-3 text-sm outline-none ring-1 ring-transparent focus:ring-brand/30 xl:w-72"/></div>
      <p className="text-sm font-bold text-slate-400 sm:hidden">Bonjour, {user.name} 👋</p>
    </div>
    <div className="flex items-center gap-2 sm:gap-4">
      <button onClick={onAdd} className="flex h-10 items-center gap-2 rounded-xl bg-brand px-3 text-xs font-extrabold text-white shadow-md shadow-blue-200 transition hover:bg-brand-dark sm:px-4 sm:text-sm"><Plus size={17}/><span className="hidden xs:inline">Ajouter</span><span className="sm:hidden">Ajouter</span></button>
      <button onClick={()=>onNavigate('Budgets')} title="Voir les budgets et alertes" className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-100 text-slate-500 hover:bg-slate-50"><Bell size={18}/></button>
      <button onClick={()=>onNavigate('Paramètres')} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"><div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-sm font-extrabold text-amber-700">{user.name?.slice(0,1).toUpperCase()||'U'}</div><span className="hidden text-left sm:block"><span className="block text-xs font-extrabold text-ink">{user.name}</span><span className="block text-[10px] text-slate-400">Compte local</span></span><ChevronDown size={15} className="hidden text-slate-400 sm:block"/></button>
    </div>
  </header>
}