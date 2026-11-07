import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import DataModal from './components/DataModal'
import AuthScreen from './components/AuthScreen'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Wallets from './pages/Wallets'
import Budgets from './pages/Budgets'
import Savings from './pages/Savings'
import Debts from './pages/Debts'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import { api, jsonBody } from './services/api'

const pageMap = {
  'Vue d’ensemble': Dashboard,
  'Transactions': Transactions,
  'Portefeuilles': Wallets,
  'Budgets': Budgets,
  'Épargne': Savings,
  'Dettes & prêts': Debts,
  'Rapports': Reports,
  'Paramètres': SettingsPage
}
export default function App() {
  const [token,setToken]=useState(()=>localStorage.getItem('my_wallet_token'))
  const [authBusy,setAuthBusy]=useState(false)
  const [authError,setAuthError]=useState('')
  const [active,setActive]=useState('Vue d’ensemble')
  const [mobileOpen,setMobileOpen]=useState(false)
  const [modal,setModal]=useState(null)
  const [notice,setNotice]=useState('')
  const [search,setSearch]=useState('')
  const [store,setStore]=useState({transactions:[],wallets:[],budgets:[],savings:[],debts:[],transfers:[],user:null,categories:[]})
  const [dataReady,setDataReady]=useState(false)
  const loadData=useCallback(async(currentToken)=>{
    setDataReady(false)
    try{
      const [profile,walletResult,transactionResult,budgetResult,savingResult,debtResult,categoryResult,transferResult]=await Promise.all([
        api('/auth/me',{token:currentToken}),api('/wallets',{token:currentToken}),api('/transactions',{token:currentToken}),api('/budgets',{token:currentToken}),api('/savings',{token:currentToken}),api('/debts',{token:currentToken}),api('/categories',{token:currentToken}),api('/transfers',{token:currentToken})
      ])
      setStore({
        user:{...profile.user,name:[profile.user.prenom,profile.user.nom].filter(Boolean).join(' '),email:profile.user.email},
        wallets:walletResult.wallets.map((wallet)=>({...wallet,id:wallet.id_wallet,name:wallet.nom,type:({CASH:'Espèces',MOBILE_MONEY:'Mobile Money',BANK:'Banque',OTHER:'Autre'})[wallet.type_wallet]||wallet.type_wallet,initialBalance:Number(wallet.solde_initial),balance:Number(wallet.balance),color:'blue',initials:wallet.nom.slice(0,1).toUpperCase()})),
        transactions:transactionResult.transactions.map((transaction)=>({...transaction,amount:Number(transaction.amount),category:transaction.category||'Autres'})),
        budgets:budgetResult.budgets.map((budget)=>({id:budget.id_budget,name:budget.nom,category:budget.category||'Autres dépenses',limit:Number(budget.limit_amount),spent:Number(budget.spent),startDate:budget.periode_debut,endDate:budget.periode_fin})),
        savings:savingResult.goals.map((goal)=>({id:goal.id_objectif,name:goal.nom,target:Number(goal.montant_cible),saved:Number(goal.saved),date:goal.date_limite,emoji:'🎯'})),
        debts:debtResult.debts.map((debt)=>({id:debt.id_dette,name:debt.personne,kind:debt.type_dette==='LENT'?'À recevoir':'À payer',amount:Number(debt.montant_initial),paid:Number(debt.paid),date:debt.date_echeance})),
        transfers:transferResult.transfers,categories:categoryResult.categories
      })
      setAuthError('')
    }catch(error){
      if(error.message.includes('Session')||error.message.includes('Authentification')){localStorage.removeItem('my_wallet_token');setToken(null)}
      else setAuthError(error.message)
    }finally{setDataReady(true)}
  },[])
  useEffect(()=>{if(token)loadData(token);else setDataReady(true)},[token,loadData])
  const Page=pageMap[active] || Dashboard
  const authenticate=useCallback(async(mode,values)=>{
    setAuthBusy(true);setAuthError('')
    try{
      const path=mode==='google'?'/auth/google':mode==='register'?'/auth/register':'/auth/login'
      const result=await api(path,{token:null,method:'POST',body:jsonBody(mode==='google'?values:{...values,nom:values.nom,prenom:values.prenom})})
      localStorage.setItem('my_wallet_token',result.token);setToken(result.token)
    }catch(error){setAuthError(error.message);throw error}finally{setAuthBusy(false)}
  },[])
  const apiMutation=async(path,body,method='POST')=>{try{await api(path,{method,body:body===undefined?undefined:jsonBody(body)});await loadData(token);return true}catch(error){return error.message}}
  const openModal=(type='transaction',record=null,targetId=null)=>setModal({type,record,targetId})
  const flash=(message)=>{setNotice(message);window.setTimeout(()=>setNotice(''),3500)}
  const saveItem=async(values)=>{
    const type=modal?.type
    const id=modal?.record?.id
    const amount=Number(values.amount)
    if(type==='settings'){
      const [firstName,...familyName]=values.name.trim().split(/\s+/)
      const result=await apiMutation('/auth/me',{nom:familyName.join(' ')||firstName,prenom:familyName.length?firstName:''},'PATCH')
      if(result!==true)return result
      return true
    }
    if(type==='transaction'){
      const result=await apiMutation(id?`/transactions/${id}`:'/transactions',{name:values.name,amount:Number(values.amount)*(values.direction==='income'?1:-1),category:values.category,wallet:values.wallet,type:values.direction==='income'?'REVENU':'DEPENSE',date:values.date},id?'PUT':'POST')
      return result===true?true:result
    }
    if(type==='wallet'){
      const walletType=({Espèces:'CASH','Mobile Money':'MOBILE_MONEY',Banque:'BANK',Autre:'OTHER'})[values.type]||'OTHER'
      const result=await apiMutation(id?`/wallets/${id}`:'/wallets',{nom:values.name,type_wallet:walletType,solde_initial:Number(values.balance)},id?'PUT':'POST')
      return result===true?true:result
    }
    if(type==='budget'){
      const category=store.categories.find((item)=>item.nom===values.category)
      const result=await apiMutation(id?`/budgets/${id}`:'/budgets',{nom:values.name,montant_limite:Number(values.limit),id_categorie:category?.id_categorie||null,periode_debut:values.startDate,periode_fin:values.endDate},id?'PUT':'POST')
      return result===true?true:result
    }
    if(type==='saving'){
      const result=await apiMutation(id?`/savings/${id}`:'/savings',{nom:values.name,montant_cible:Number(values.target),date_limite:values.date||null},id?'PUT':'POST')
      if(result!==true)return result
      if(!id&&Number(values.saved)>0){const refreshed=await api('/savings');const goal=refreshed.goals.filter((item)=>item.nom===values.name).sort((a,b)=>Number(b.id_objectif)-Number(a.id_objectif))[0];if(goal){const contribution=await apiMutation(`/savings/${goal.id_objectif}/contributions`,{montant:Number(values.saved),description:'Contribution initiale'});if(contribution!==true)return contribution}}
      return true
    }
    if(type==='debt'){
      const result=await apiMutation(id?`/debts/${id}`:'/debts',{personne:values.name,type_dette:values.kind==='À recevoir'?'LENT':'OWED',montant_initial:Number(values.amount),date_echeance:values.date||null},id?'PUT':'POST')
      return result===true?true:result
    }
    if(type==='contribution')return await apiMutation(`/savings/${modal.targetId}/contributions`,{montant:amount})
    if(type==='repayment')return await apiMutation(`/debts/${modal.targetId}/repayments`,{montant:amount})
    if(type==='transfer'){
      const source=store.wallets.find((wallet)=>wallet.name===values.source),destination=store.wallets.find((wallet)=>wallet.name===values.destination)
      if(!source||!destination)return 'Veuillez sélectionner deux portefeuilles valides.'
      return await apiMutation('/transfers',{id_wallet_source:source.id_wallet,id_wallet_destination:destination.id_wallet,montant:amount,frais:Number(values.fees||0)})
    }
    return 'Action inconnue.'
  }
  const removeItem=async(type,id)=>{
    if(!window.confirm('Confirmer la suppression ?'))return
    if(token){
      const resource={transaction:'transactions',wallet:'wallets',budget:'budgets',saving:'savings',debt:'debts'}[type]
      if(resource){const result=await apiMutation(`/${resource}/${id}`,undefined,'DELETE');if(result!==true)flash(result)}
      return
    }
    flash('Aucune ressource valide sélectionnée.')
  }
  const resetData=()=>{if(!window.confirm('Se déconnecter de ce compte ?'))return;localStorage.removeItem('my_wallet_token');setToken(null);setStore({transactions:[],wallets:[],budgets:[],savings:[],debts:[],transfers:[],user:null,categories:[]});flash('Déconnexion réussie.')}
  const pageProps={...store,onAdd:(type)=>openModal(type),onEdit:(type,record)=>openModal(type,record),onDelete:removeItem,onContribute:(id)=>openModal('contribution',null,id),onRepay:(id)=>openModal('repayment',null,id),onTransfer:()=>openModal('transfer'),onNavigate:setActive,onSearch:search,onSaveProfile:()=>openModal('settings',store.user)}
  if(!token)return <AuthScreen onAuthenticate={authenticate} error={authError} busy={authBusy}/>
  if(!dataReady)return <div className="flex min-h-screen items-center justify-center bg-canvas text-sm font-bold text-slate-500">Chargement sécurisé du compte…</div>
  if(authError)return <div className="flex min-h-screen items-center justify-center bg-canvas p-6"><div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-card"><h1 className="text-xl font-extrabold text-ink">Connexion au serveur impossible</h1><p className="mt-3 text-sm text-slate-500">{authError}</p><button onClick={()=>loadData(token)} className="mt-5 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white">Réessayer</button><button onClick={resetData} className="ml-2 mt-5 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500">Se déconnecter</button></div></div>
  return <div className="min-h-screen bg-canvas text-ink">
    <div className="flex min-h-screen">
      <Sidebar active={active} onNavigate={setActive} open={mobileOpen} onClose={()=>setMobileOpen(false)} onReset={resetData} transactionCount={store.transactions.length}/>
      <div className="min-w-0 flex-1">
        <Header onMenu={()=>setMobileOpen(true)} onAdd={()=>openModal('transaction')} onSearch={setSearch} onNavigate={setActive} user={store.user}/>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
          <Page {...pageProps}/>
          <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-5 text-[10px] text-slate-400 sm:flex-row"><span>© 2026 MY WALLET. Prenez soin de votre argent.</span><span>Conçu avec simplicité et attention · MGA (Ar)</span></footer>
        </main>
      </div>
    </div>
    {notice&&<div role="status" className="fixed bottom-5 right-5 z-[80] rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
    <DataModal open={Boolean(modal)} type={modal?.type} record={modal?.record} wallets={store.wallets} onClose={()=>setModal(null)} onSave={saveItem}/>
  </div>
}