import { useEffect, useRef, useState } from 'react'
import { Wallet, Mail, LockKeyhole, LoaderCircle, ShieldCheck } from 'lucide-react'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function AuthScreen({ onAuthenticate, error: serverError, busy }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', password: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const googleButton = useRef(null)

  useEffect(() => {
    if (!googleClientId || !googleButton.current) return undefined
    let cancelled = false
    const drawButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButton.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setError('')
          try { await onAuthenticate('google', { credential }) } catch (reason) { setError(reason.message) }
        },
      })
      window.google.accounts.id.renderButton(googleButton.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 280, locale: 'fr' })
    }
    if (window.google?.accounts?.id) drawButton()
    else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = drawButton
      script.onerror = () => setError('Impossible de charger la connexion Google. Vérifiez votre connexion internet.')
      document.head.appendChild(script)
    }
    return () => { cancelled = true }
  }, [onAuthenticate])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (mode === 'register' && form.password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }
    try { await onAuthenticate(mode, form) } catch (reason) { setError(reason.message) }
  }

  const activeError = error || serverError
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f7fc] px-4 py-10">
    <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl"/><div className="pointer-events-none absolute -bottom-36 -right-20 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"/>
    <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_28px_90px_-40px_rgba(28,55,110,.3)] lg:grid-cols-[.95fr_1.05fr]">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 p-10 text-white lg:flex"><div><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Wallet size={25}/></div><div><h1 className="font-display text-xl font-extrabold">MY WALLET</h1><p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/60">Vos finances, en sécurité</p></div></div><div className="mt-24"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">Un espace privé</span><h2 className="mt-5 max-w-sm font-display text-4xl font-extrabold leading-tight">Votre argent mérite un espace à vous.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">Chaque compte possède ses propres portefeuilles. Votre solde commence à zéro et n’est visible que par vous.</p></div></div><div className="flex items-center gap-2 text-xs text-blue-100"><ShieldCheck size={16}/> Connexion protégée et données isolées par compte</div></aside>
      <div className="p-6 sm:p-10 lg:p-12"><div className="mb-8 flex items-center gap-3 lg:hidden"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white"><Wallet size={22}/></div><div><h1 className="font-display text-lg font-extrabold text-ink">MY WALLET</h1><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Espace sécurisé</p></div></div>
        <p className="text-xs font-extrabold uppercase tracking-[.18em] text-brand">Bienvenue</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">{mode === 'login' ? 'Connectez-vous' : 'Créer votre compte'}</h2><p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Retrouvez vos finances personnelles.' : 'Vos portefeuilles personnels seront créés avec un solde de départ à zéro.'}</p>
        <div className="mt-7 flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={()=>{setMode('login');setError('')}} className={`flex-1 rounded-lg py-2.5 text-xs font-extrabold ${mode==='login'?'bg-white text-ink shadow-sm':'text-slate-500'}`}>Connexion</button><button type="button" onClick={()=>{setMode('register');setError('')}} className={`flex-1 rounded-lg py-2.5 text-xs font-extrabold ${mode==='register'?'bg-white text-ink shadow-sm':'text-slate-500'}`}>Inscription</button></div>
        <form onSubmit={submit} className="mt-6 space-y-4">{mode==='register'&&<div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-slate-600">Nom<input required autoComplete="family-name" value={form.nom} onChange={(event)=>setForm({...form,nom:event.target.value})} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand" placeholder="Votre nom"/></label><label className="text-xs font-bold text-slate-600">Prénom<input autoComplete="given-name" value={form.prenom} onChange={(event)=>setForm({...form,prenom:event.target.value})} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brand" placeholder="Votre prénom"/></label></div>}
          <label className="block text-xs font-bold text-slate-600">Adresse e-mail<span className="relative mt-1.5 block"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input required type="email" autoComplete="email" value={form.email} onChange={(event)=>setForm({...form,email:event.target.value})} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-brand" placeholder="vous@exemple.com"/></span></label>
          <label className="block text-xs font-bold text-slate-600">Mot de passe<span className="relative mt-1.5 block"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input required minLength={8} type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={form.password} onChange={(event)=>setForm({...form,password:event.target.value})} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-brand" placeholder={mode==='register'?'8 caractères minimum':'Votre mot de passe'}/></span></label>
          {mode==='register'&&<label className="block text-xs font-bold text-slate-600">Confirmer le mot de passe<span className="relative mt-1.5 block"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event)=>setConfirmPassword(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-normal outline-none focus:border-brand" placeholder="Répétez le mot de passe"/></span></label>}
          {activeError&&<p role="alert" className="rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600">{activeError}</p>}
          <button disabled={busy} aria-busy={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{busy&&<LoaderCircle className="animate-spin" size={17}/>} {mode==='login'?'Se connecter':'Créer mon compte'}</button>
        </form>
        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200"/><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ou continuer avec</span><span className="h-px flex-1 bg-slate-200"/></div>
        {googleClientId ? <div ref={googleButton} className="flex min-h-11 justify-center"/> : <button disabled title="Configurez VITE_GOOGLE_CLIENT_ID pour activer Google" className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-200 text-sm font-bold text-slate-400"><span className="font-extrabold">G</span> Google · configuration requise</button>}
        <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">Un compte Google vérifié crée ou ouvre uniquement l’espace associé à cette adresse e-mail.</p>
      </div>
    </section>
  </main>
}
