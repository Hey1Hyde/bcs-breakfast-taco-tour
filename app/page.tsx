'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadReviews, saveReviewToDatabase } from '@/lib/tacoDb';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { awardOptions, blankRatings, breakdownCategories, fmt, groupByRestaurant, normalizeReview, officialCategories, overallScore, Review, seedReviews } from '@/lib/tacoData';

type Tab = 'score'|'leaderboard'|'restaurants'|'awards'|'settings';
const tabs: {id: Tab; label: string; icon: string}[] = [
  {id:'score',label:'Score',icon:'✍️'},{id:'leaderboard',label:'Leaderboard',icon:'🏆'},{id:'restaurants',label:'Restaurants',icon:'📍'},{id:'awards',label:'Awards',icon:'🏅'},{id:'settings',label:'Backup',icon:'⚙️'}
];

const localMigrationCompleteKey = 'bcs-breakfast-taco-tour:supabase-migration-complete';

function localStorageReviewCandidates() {
  const candidates: Review[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key || key === localMigrationCompleteKey) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const values = Array.isArray(parsed) ? parsed : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { reviews?: unknown }).reviews) ? (parsed as { reviews: unknown[] }).reviews : [];
      values.forEach(value => {
        if (typeof value !== 'object' || value === null) return;
        const record = value as Record<string, unknown>;
        if (typeof record.restaurantName !== 'string' || typeof record.reviewerName !== 'string') return;
        candidates.push(normalizeReview(record));
      });
    } catch {
      // Ignore non-JSON localStorage entries owned by other browser features.
    }
  }
  return candidates;
}

async function migrateLocalReviews() {
  if (localStorage.getItem(localMigrationCompleteKey)) return [];
  const candidates = localStorageReviewCandidates();
  if (candidates.length === 0) {
    localStorage.setItem(localMigrationCompleteKey, 'true');
    return [];
  }
  const migrated = await Promise.all(candidates.map(review => saveReviewToDatabase(review)));
  localStorage.setItem(localMigrationCompleteKey, 'true');
  return migrated;
}
export default function Home() {
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('score');
  const [activeRestaurant, setActiveRestaurant] = useState('Jesse’s Taqueria');
  const [form, setForm] = useState<Review>({ id:'', restaurantName:'Jesse’s Taqueria', reviewerName:'', date:new Date().toISOString().slice(0,10), ordered:'', price:'', sentenceReview:'', memorableQuote:'', awards:[], ...blankRatings });

  const refreshReviews = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const loadedReviews = await loadReviews();
      const activeReviews = loadedReviews.length > 0 ? loadedReviews : await migrateLocalReviews();
      setReviews(activeReviews.length > 0 ? activeReviews : seedReviews);
    } catch (error) {
      console.error(error);
      alert('Could not load shared taco tour data. Check the Supabase environment variables and table setup.');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refreshReviews);

    const client = supabase;
    if (!client) return;
    const channel = client
      .channel('shared-taco-tour')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, refreshReviews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'review_awards' }, refreshReviews)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, refreshReviews)
      .subscribe();

    return () => { void client.removeChannel(channel); };
  }, [refreshReviews]);
  const restaurants = useMemo(() => groupByRestaurant(reviews), [reviews]);
  const selected = restaurants.find(r => r.name === activeRestaurant) || restaurants[0];

  function update<K extends keyof Review>(key: K, value: Review[K]) { setForm(f => ({...f, [key]: value})); }
  async function saveReview() {
    if (!form.restaurantName.trim() || !form.reviewerName.trim()) return alert('Add a restaurant and reviewer name first.');
    if (!isSupabaseConfigured) return alert('Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');

    setIsSaving(true);
    try {
      const savedReview = await saveReviewToDatabase(normalizeReview({...form, id: crypto.randomUUID(), restaurantName: form.restaurantName.trim()}));
      setReviews([savedReview, ...reviews]);
      setActiveRestaurant(savedReview.restaurantName); setTab('leaderboard');
      setForm({ id:'', restaurantName: form.restaurantName, reviewerName: '', date:new Date().toISOString().slice(0,10), ordered:'', price:'', sentenceReview:'', memorableQuote:'', awards:[], ...blankRatings });
      void refreshReviews();
    } catch (error) {
      console.error(error);
      alert('Could not save this score. Please check the Supabase table setup and try again.');
    } finally {
      setIsSaving(false);
    }
  }
  const exportHref = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(reviews, null, 2))}`;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#F8DDA4_0,#FFF7E8_36%,#FFF7E8_100%)] pb-28">
    <header className="sticky top-0 z-20 border-b border-orange/10 bg-cream/90 px-4 py-3 backdrop-blur"><div className="mx-auto max-w-md"><p className="text-xs font-bold uppercase tracking-[.25em] text-orange">Bryan / College Station</p><h1 className="text-2xl font-black text-bean">🌮 2026 Breakfast Taco Tour</h1><p className="text-sm text-bean/70">Yelp vibes, fantasy rankings, local taco glory.</p></div></header>
    <section className="mx-auto max-w-md space-y-4 p-4">
      {tab==='score' && <Card title="Score a restaurant" emoji="✍️"><div className="space-y-3">
        <Input label="Restaurant name" value={form.restaurantName} onChange={v=>update('restaurantName',v)} list="restaurants"/><datalist id="restaurants">{restaurants.map(r=><option key={r.name}>{r.name}</option>)}</datalist>
        <Input label="Reviewer name" value={form.reviewerName} onChange={v=>update('reviewerName',v)} placeholder="Your name"/><Input label="Date" type="date" value={form.date} onChange={v=>update('date',v)}/>
        <Input label="What I ordered" value={form.ordered} onChange={v=>update('ordered',v)} placeholder="Bacon taco + salsa verde"/><Input label="Price" value={form.price} onChange={v=>update('price',v)} placeholder="$4.99"/>
        <Text label="One-sentence review" value={form.sentenceReview} onChange={v=>update('sentenceReview',v)}/><Input label="Memorable quote" value={form.memorableQuote} onChange={v=>update('memorableQuote',v)} placeholder="That salsa woke me up."/>
        <h3 className="font-black">Official ratings <span className="text-sm text-bean/60">Overall: {fmt(overallScore(form))}</span></h3>{officialCategories.map(c=><Slider key={c.key} label={`${c.emoji} ${c.label} (${Math.round(c.weight*100)}%)`} value={form[c.key]} onChange={v=>update(c.key,v)}/>) }
        <h3 className="font-black">Taco breakdown</h3>{breakdownCategories.map(c=><Slider key={c.key} label={`${c.emoji} ${c.label}`} value={form[c.key]} onChange={v=>update(c.key,v)}/>) }
        <h3 className="font-black">Awards / tags</h3><div className="flex flex-wrap gap-2">{awardOptions.map(a=><button key={a} onClick={()=>update('awards', form.awards.includes(a) ? form.awards.filter(x=>x!==a) : [...form.awards,a])} className={`rounded-full px-3 py-2 text-sm font-bold ${form.awards.includes(a)?'bg-orange text-white':'bg-white'}`}>{a}</button>)}</div>
        <button onClick={saveReview} disabled={isSaving} className="w-full rounded-3xl bg-orange p-5 text-lg font-black text-white shadow-soft disabled:opacity-60">{isSaving ? 'Saving score…' : 'Save score 🌮'}</button>
      </div></Card>}
      {tab==='leaderboard' && <Card title="Leaderboard" emoji="🏆"><div className="space-y-3">{restaurants.map((r,i)=><button key={r.name} onClick={()=>{setActiveRestaurant(r.name);setTab('restaurants')}} className="w-full rounded-3xl bg-white p-4 text-left shadow-soft"><div className="flex items-center gap-3"><span className="text-3xl">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</span><div className="flex-1"><b>{r.name}</b><p className="text-sm text-bean/60">{r.count} review{r.count>1?'s':''} • Taste {fmt(r.taste)} • Tortilla {fmt(r.tortilla)} • Salsa {fmt(r.salsa)}</p></div><span className="text-xl font-black text-orange">{fmt(r.overall)}</span></div></button>)}</div></Card>}
      {tab==='restaurants' && selected && <Card title="Restaurant profile" emoji="📍"><select value={selected.name} onChange={e=>setActiveRestaurant(e.target.value)} className="mb-3 w-full rounded-2xl border-0 p-3 font-bold">{restaurants.map(r=><option key={r.name}>{r.name}</option>)}</select><Profile restaurant={selected}/></Card>}
      {tab==='awards' && <Card title="Awards board" emoji="🏅"><div className="space-y-3">{awardOptions.map(a=>{const winners=restaurants.filter(r=>r.awards.includes(a)); return <div key={a} className="rounded-2xl bg-white p-3"><b>{a}</b><p className="text-sm text-bean/70">{winners.map(w=>w.name).join(', ') || 'No winner yet'}</p></div>})}</div></Card>}
      {tab==='settings' && <Card title="Settings & backup" emoji="⚙️"><p className="mb-3 text-sm">Data saves to the shared Supabase database. Export JSON whenever someone wants an extra backup.</p><a download="bcs-taco-tour-backup.json" href={exportHref} className="block rounded-2xl bg-orange p-4 text-center font-black text-white">Export JSON</a><label className="mt-3 block rounded-2xl bg-white p-4 text-center font-black opacity-60">Import JSON (temporarily disabled)<input className="hidden" type="file" accept="application/json" disabled/></label><button disabled className="mt-3 w-full rounded-2xl bg-salsa p-4 font-black text-white opacity-60">Reset to starter data (temporarily disabled)</button></Card>}
    </section><nav className="safe-bottom fixed bottom-0 left-0 right-0 z-30 border-t border-orange/10 bg-cream/95 backdrop-blur"><div className="mx-auto grid max-w-md grid-cols-5 gap-1 p-2">{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`rounded-2xl p-2 text-[11px] font-black ${tab===t.id?'bg-orange text-white':'text-bean'}`}><div className="text-lg">{t.icon}</div>{t.label}</button>)}</div></nav>
  </main>;
}
function Card({title,emoji,children}:{title:string;emoji:string;children:React.ReactNode}){return <div className="rounded-[2rem] border border-white/80 bg-white/70 p-4 shadow-soft"><h2 className="mb-3 text-xl font-black"><span>{emoji}</span> {title}</h2>{children}</div>}
function Input({label,value,onChange,type='text',placeholder='',list}:{label:string;value:string;onChange:(v:string)=>void;type?:string;placeholder?:string;list?:string}){return <label className="block text-sm font-bold">{label}<input list={list} type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-2xl border-2 border-tortilla bg-white p-3 outline-orange"/></label>}
function Text({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="block text-sm font-bold">{label}<textarea value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-2xl border-2 border-tortilla bg-white p-3 outline-orange" rows={3}/></label>}
function Slider({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}){return <label className="block rounded-2xl bg-white p-3 text-sm font-bold"> <div className="flex justify-between"><span>{label}</span><span className="text-orange">{value.toFixed(1)}</span></div><input type="range" min="1" max="10" step="0.1" value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full accent-orange"/></label>}
function Profile({restaurant}:{restaurant: ReturnType<typeof groupByRestaurant>[number]}){return <div className="space-y-4"><div className="rounded-3xl bg-orange p-5 text-white"><p className="text-sm font-bold">Overall score</p><p className="text-5xl font-black">{fmt(restaurant.overall)}</p><p>{restaurant.count} review{restaurant.count>1?'s':''}</p></div><div className="grid grid-cols-2 gap-2">{[...officialCategories,...breakdownCategories].map(c=><div key={c.key} className="rounded-2xl bg-white p-3"><p className="text-xs font-bold">{c.emoji} {c.label}</p><b>{fmt(restaurant[c.key])}</b></div>)}</div><div className="flex flex-wrap gap-2">{restaurant.awards.map(a=><span key={a} className="rounded-full bg-gold px-3 py-1 text-sm font-black">{a}</span>)}</div><div className="space-y-2">{restaurant.reviews.map(r=><div key={r.id} className="rounded-2xl bg-white p-3"><b>{r.reviewerName}</b> <span className="text-xs text-bean/60">{r.date}</span><p>{r.sentenceReview}</p>{r.memorableQuote&&<p className="mt-1 italic text-orange">“{r.memorableQuote}”</p>}<p className="text-xs text-bean/60">Ordered: {r.ordered || '—'} • Price: {r.price || '—'}</p></div>)}</div></div>}
