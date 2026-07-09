'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
/* eslint-disable @next/next/no-img-element */
import { awardOptions, blankRatings, breakdownCategories, fmt, groupByRestaurant, officialCategories, overallScore, Review, seedReviews, stripRetiredRatings } from '@/lib/tacoData';

type Tab = 'score'|'leaderboard'|'restaurants'|'awards'|'gallery'|'settings';
const tabs: {id: Tab; label: string; icon: string}[] = [
  {id:'score',label:'Score',icon:'✍️'},{id:'leaderboard',label:'Leaderboard',icon:'🏆'},{id:'restaurants',label:'Restaurants',icon:'📍'},{id:'awards',label:'Awards',icon:'🏅'},{id:'gallery',label:'Gallery',icon:'📸'},{id:'settings',label:'Backup',icon:'⚙️'}
];
const STORE = 'bcs-breakfast-taco-tour-v1';

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>(() => {
    if (typeof window === 'undefined') return seedReviews;
    const raw = window.localStorage.getItem(STORE);
    return raw ? JSON.parse(raw).map(stripRetiredRatings) : seedReviews;
  });
  const [tab, setTab] = useState<Tab>('score');
  const [activeRestaurant, setActiveRestaurant] = useState('Jesse’s Taqueria');
  const [form, setForm] = useState<Review>({ id:'', restaurantName:'Jesse’s Taqueria', reviewerName:'', date:new Date().toISOString().slice(0,10), ordered:'', price:'', photo:'', sentenceReview:'', memorableQuote:'', awards:[], ...blankRatings });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(STORE, JSON.stringify(reviews)); }, [reviews]);
  const restaurants = useMemo(() => groupByRestaurant(reviews), [reviews]);
  const selected = restaurants.find(r => r.name === activeRestaurant) || restaurants[0];

  function update<K extends keyof Review>(key: K, value: Review[K]) { setForm(f => ({...f, [key]: value})); }
  function saveReview() {
    if (!form.restaurantName.trim() || !form.reviewerName.trim()) return alert('Add a restaurant and reviewer name first.');
    setReviews([stripRetiredRatings({...form, id: crypto.randomUUID(), restaurantName: form.restaurantName.trim()}), ...reviews.map(stripRetiredRatings)]);
    setActiveRestaurant(form.restaurantName.trim()); setTab('leaderboard');
    setForm({ id:'', restaurantName: form.restaurantName, reviewerName: '', date:new Date().toISOString().slice(0,10), ordered:'', price:'', photo:'', sentenceReview:'', memorableQuote:'', awards:[], ...blankRatings });
  }
  async function photo(file?: File) { if (!file) return; const reader = new FileReader(); reader.onload = () => update('photo', String(reader.result)); reader.readAsDataURL(file); }
  function importJson(file?: File) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { setReviews(JSON.parse(String(reader.result)).map(stripRetiredRatings)); alert('Backup imported!'); } catch { alert('That JSON did not import.'); } }; reader.readAsText(file); }
  const exportHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reviews.map(stripRetiredRatings), null, 2))}`;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#F8DDA4_0,#FFF7E8_36%,#FFF7E8_100%)] pb-28">
    <header className="sticky top-0 z-20 border-b border-orange/10 bg-cream/90 px-4 py-3 backdrop-blur"><div className="mx-auto max-w-md"><p className="text-xs font-bold uppercase tracking-[.25em] text-orange">Bryan / College Station</p><h1 className="text-2xl font-black text-bean">🌮 2026 Breakfast Taco Tour</h1><p className="text-sm text-bean/70">Yelp vibes, fantasy rankings, local taco glory.</p></div></header>
    <section className="mx-auto max-w-md space-y-4 p-4">
      {tab==='score' && <Card title="Score a restaurant" emoji="✍️"><div className="space-y-3">
        <Input label="Restaurant name" value={form.restaurantName} onChange={v=>update('restaurantName',v)} list="restaurants"/><datalist id="restaurants">{restaurants.map(r=><option key={r.name}>{r.name}</option>)}</datalist>
        <Input label="Reviewer name" value={form.reviewerName} onChange={v=>update('reviewerName',v)} placeholder="Your name"/><Input label="Date" type="date" value={form.date} onChange={v=>update('date',v)}/>
        <Input label="What I ordered" value={form.ordered} onChange={v=>update('ordered',v)} placeholder="Bacon taco + salsa verde"/><Input label="Price" value={form.price} onChange={v=>update('price',v)} placeholder="$4.99"/>
        <button className="w-full rounded-2xl bg-tortilla p-4 font-black" onClick={()=>fileRef.current?.click()}>📸 Add taco photo</button><input ref={fileRef} className="hidden" type="file" accept="image/*" onChange={e=>photo(e.target.files?.[0])}/>{form.photo && <img src={form.photo} alt="Preview" className="h-44 w-full rounded-3xl object-cover"/>}
        <Text label="One-sentence review" value={form.sentenceReview} onChange={v=>update('sentenceReview',v)}/><Input label="Memorable quote" value={form.memorableQuote} onChange={v=>update('memorableQuote',v)} placeholder="That salsa woke me up."/>
        <h3 className="font-black">Official ratings <span className="text-sm text-bean/60">Overall: {fmt(overallScore(form))}</span></h3>{officialCategories.map(c=><Slider key={c.key} label={`${c.emoji} ${c.label} (${Math.round(c.weight*100)}%)`} value={form[c.key]} onChange={v=>update(c.key,v)}/>) }
        <h3 className="font-black">Taco breakdown</h3>{breakdownCategories.map(c=><Slider key={c.key} label={`${c.emoji} ${c.label}`} value={form[c.key]} onChange={v=>update(c.key,v)}/>) }
        <h3 className="font-black">Awards / tags</h3><div className="flex flex-wrap gap-2">{awardOptions.map(a=><button key={a} onClick={()=>update('awards', form.awards.includes(a) ? form.awards.filter(x=>x!==a) : [...form.awards,a])} className={`rounded-full px-3 py-2 text-sm font-bold ${form.awards.includes(a)?'bg-orange text-white':'bg-white'}`}>{a}</button>)}</div>
        <button onClick={saveReview} className="w-full rounded-3xl bg-orange p-5 text-lg font-black text-white shadow-soft">Save score 🌮</button>
      </div></Card>}
      {tab==='leaderboard' && <Card title="Leaderboard" emoji="🏆"><div className="space-y-3">{restaurants.map((r,i)=><button key={r.name} onClick={()=>{setActiveRestaurant(r.name);setTab('restaurants')}} className="w-full rounded-3xl bg-white p-4 text-left shadow-soft"><div className="flex items-center gap-3"><span className="text-3xl">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span><div className="flex-1"><b>{r.name}</b><p className="text-sm text-bean/60">{r.count} review{r.count>1?'s':''} • Taste {fmt(r.taste)} • Tortilla {fmt(r.tortilla)} • Salsa {fmt(r.salsa)}</p></div><span className="text-xl font-black text-orange">{fmt(r.overall)}</span></div></button>)}</div></Card>}
      {tab==='restaurants' && selected && <Card title="Restaurant profile" emoji="📍"><select value={selected.name} onChange={e=>setActiveRestaurant(e.target.value)} className="mb-3 w-full rounded-2xl border-0 p-3 font-bold">{restaurants.map(r=><option key={r.name}>{r.name}</option>)}</select><Profile restaurant={selected}/></Card>}
      {tab==='awards' && <Card title="Awards board" emoji="🏅"><div className="space-y-3">{awardOptions.map(a=>{const winners=restaurants.filter(r=>r.awards.includes(a)); return <div key={a} className="rounded-2xl bg-white p-3"><b>{a}</b><p className="text-sm text-bean/70">{winners.map(w=>w.name).join(', ') || 'No winner yet'}</p></div>})}</div></Card>}
      {tab==='gallery' && <Card title="Taco gallery" emoji="📸"><div className="grid grid-cols-2 gap-3">{reviews.filter(r=>r.photo).map(r=><div key={r.id}><img src={r.photo} alt={r.restaurantName} className="h-36 w-full rounded-2xl object-cover"/><p className="text-xs font-bold">{r.restaurantName}</p></div>)}</div>{!reviews.some(r=>r.photo)&&<p>No photos yet. Tomorrow morning is calling.</p>}</Card>}
      {tab==='settings' && <Card title="Settings & backup" emoji="⚙️"><p className="mb-3 text-sm">Data saves to this device with localStorage. Export JSON after each stop so someone has a backup.</p><a download="bcs-taco-tour-backup.json" href={exportHref} className="block rounded-2xl bg-orange p-4 text-center font-black text-white">Export JSON</a><label className="mt-3 block rounded-2xl bg-white p-4 text-center font-black">Import JSON<input className="hidden" type="file" accept="application/json" onChange={e=>importJson(e.target.files?.[0])}/></label><button onClick={()=>confirm('Clear all reviews?')&&setReviews(seedReviews)} className="mt-3 w-full rounded-2xl bg-salsa p-4 font-black text-white">Reset to starter data</button></Card>}
    </section><nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-orange/10 bg-cream/95 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-6 gap-1 p-2">{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-2xl p-2 text-[11px] font-black ${tab===t.id?'bg-orange text-white':'text-bean'}`}><div className="text-lg">{t.icon}</div>{t.label}</button>)}</div></nav>
  </main>;
}
function Card({title,emoji,children}:{title:string;emoji:string;children:React.ReactNode}){return <div className="rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-soft"><h2 className="mb-3 text-xl font-black"><span>{emoji}</span> {title}</h2>{children}</div>}
function Input({label,value,onChange,type='text',placeholder='',list}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string;list?:string}){return <label className="block text-sm font-bold">{label}<input list={list} type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-2xl border-2 border-tortilla bg-white p-3 outline-orange"/></label>}
function Text({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="block text-sm font-bold">{label}<textarea value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-2xl border-2 border-tortilla bg-white p-3 outline-orange" rows={3}/></label>}
function Slider({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}){return <label className="block rounded-2xl bg-white p-3 text-sm font-bold"> <div className="flex justify-between"><span>{label}</span><span className="text-orange">{value.toFixed(1)}</span></div><input type="range" min="1" max="5" step="0.1" value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full accent-orange"/></label>}
function Profile({restaurant}:{restaurant: ReturnType<typeof groupByRestaurant>[number]}){return <div className="space-y-4"><div className="rounded-3xl bg-orange p-5 text-white"><p className="text-sm font-bold">Overall score</p><p className="text-5xl font-black">{fmt(restaurant.overall)}</p><p>{restaurant.count} review{restaurant.count>1?'s':''}</p></div><div className="grid grid-cols-2 gap-2">{[...officialCategories,...breakdownCategories].map(c=><div key={c.key} className="rounded-2xl bg-white p-3"><p className="text-xs font-bold">{c.emoji} {c.label}</p><b>{fmt(restaurant[c.key])}</b></div>)}</div><div className="flex flex-wrap gap-2">{restaurant.awards.map(a=><span key={a} className="rounded-full bg-gold px-3 py-1 text-sm font-black">{a}</span>)}</div><div className="grid grid-cols-2 gap-2">{restaurant.reviews.filter(r=>r.photo).map(r=><img key={r.id} src={r.photo} alt="Taco" className="h-32 rounded-2xl object-cover"/>)}</div><div className="space-y-2">{restaurant.reviews.map(r=><div key={r.id} className="rounded-2xl bg-white p-3"><b>{r.reviewerName}</b> <span className="text-xs text-bean/60">{r.date}</span><p>{r.sentenceReview}</p>{r.memorableQuote&&<p className="mt-1 italic text-orange">“{r.memorableQuote}”</p>}<p className="text-xs text-bean/60">Ordered: {r.ordered || '—'} • Price: {r.price || '—'}</p></div>)}</div></div>}
