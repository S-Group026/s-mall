import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Calendar, Search, ChevronLeft, Lock, CreditCard, CheckCircle, Truck, MessageCircle, Send, Star, Phone, ArrowRight, Minus, Plus, Trash2, X, MapPin, Clock, Eye, Flame, Sparkles, TrendingUp, ShoppingBag, Cpu, GraduationCap, Map, Car, Home } from 'lucide-react';
import { sb } from './supabase';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const C = {
  bg:'#0a0a0a', card:'#161616', card2:'#1c1c1c', border:'#2a2a2a',
  gold:'#c9a84c', goldL:'#e8c97a', goldD:'#9a7a2e',
  white:'#f5f0e8', muted:'#888880', red:'#e05a4e', green:'#4caf7d',
  orange:'#f59e0b', blue:'#3b82f6',
};
const FCFA = n => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
const PCT  = (o,s) => Math.round((1-s/o)*100);
const UID  = () => 'CMD-' + Date.now().toString(36).toUpperCase();
const RID  = () => 'RES-' + Date.now().toString(36).toUpperCase();
const WA   = 'https://wa.me/2250150512408';
const EDGE = 'https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email';
const FEDA_KEY = 'pk_live_EzI5k531w-Iu-LUAu4I2sluv';
const BOOKING_CATS = ['circuit','voiture','appart'];
const NO_SHIP_CATS = ['circuit','voiture','appart','formation'];
const BADGE_COLOR  = { Nouveau:C.green, Bestseller:C.gold, Promo:C.red, Premium:'#9b59b6' };
const DEFAULT_ZONES = [
  {id:1,name:'Cotonou',price:1500,free_above:50000,delay:'24-48h'},
  {id:2,name:'Bénin (hors Cotonou)',price:3000,free_above:100000,delay:'2-4 jours'},
  {id:3,name:'Togo',price:5000,free_above:150000,delay:'3-5 jours'},
  {id:4,name:"Côte d'Ivoire",price:7500,free_above:200000,delay:'4-6 jours'},
  {id:5,name:'International',price:25000,free_above:500000,delay:'7-14 jours'},
];

// ─── Pays FedaPay par zone ────────────────────────────────────────────────────
const ZONE_COUNTRY = {
  'Cotonou': 'bj',
  'Bénin (hors Cotonou)': 'bj',
  'Togo': 'tg',
  "Côte d'Ivoire": 'ci',
  'International': 'bj',
};

// ─── CSS GLOBAL ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0a0a0a; color: #f5f0e8; font-family: 'DM Sans', sans-serif; }
::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #9a7a2e; border-radius: 4px; }
@keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
@keyframes spin   { to { transform:rotate(360deg) } }
@keyframes glow   { 0%,100% { box-shadow:0 0 12px #c9a84c55 } 50% { box-shadow:0 0 28px #c9a84c99 } }
.hov { transition:transform .25s,box-shadow .25s; }
.hov:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(201,168,76,.15) !important; }
.btn { transition:filter .15s; } .btn:hover { filter:brightness(1.1); }
.lnk { cursor:pointer; transition:color .2s; } .lnk:hover { color:#c9a84c !important; }
select option { background:#1c1c1c; color:#f5f0e8; }
@media (max-width:768px) {
  .hide-mob { display:none !important; }
  .col1 { grid-template-columns:1fr !important; }
  .hero { padding:52px 22px 44px !important; }
}
`;

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────
const Spin = ({ s=20 }) => (
  <span style={{ display:'inline-block', width:s, height:s, border:'2.5px solid #2a2a2a', borderTopColor:C.gold, borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
);
const GL = () => (
  <div style={{ height:1, background:`linear-gradient(90deg,transparent,${C.gold},transparent)`, margin:'0 0 20px' }}/>
);
const CatIcon = ({ id, size=26 }) => {
  const p = { size, strokeWidth:1.5, color:C.gold };
  if (id==='mode')      return <ShoppingBag {...p}/>;
  if (id==='tech')      return <Cpu {...p}/>;
  if (id==='formation') return <GraduationCap {...p}/>;
  if (id==='circuit')   return <Map {...p}/>;
  if (id==='voiture')   return <Car {...p}/>;
  if (id==='appart')    return <Home {...p}/>;
  return <Sparkles {...p}/>;
};

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────
function Notif({ notif }) {
  if (!notif) return null;
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, background:C.card, border:`1px solid ${notif.color}`, color:notif.color, padding:'11px 18px', borderRadius:12, fontWeight:700, fontSize:13, boxShadow:'0 8px 28px rgba(0,0,0,.6)', animation:'fadeUp .3s ease', maxWidth:300, pointerEvents:'none' }}>
      {notif.msg}
    </div>
  );
}

// ─── BANNER SLIDER ────────────────────────────────────────────────────────────
function BannerSlider({ items }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [items]);
  useEffect(() => {
    if (!items || items.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i+1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items]);
  if (!items || items.length === 0) return null;
  const b = items[Math.min(idx, items.length-1)];
  if (!b || !b.media_url) return null;
  return (
    <div style={{ position:'relative', borderRadius:16, overflow:'hidden', cursor:b.link_url?'pointer':'default' }} onClick={() => b.link_url && window.open(b.link_url,'_blank')}>
      {b.media_type === 'video'
        ? <video src={b.media_url} autoPlay muted loop playsInline style={{ width:'100%', maxHeight:220, objectFit:'cover', display:'block' }}/>
        : <img src={b.media_url} alt={b.title||''} style={{ width:'100%', maxHeight:220, objectFit:'cover', display:'block' }}/>
      }
      {b.title && (
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.75))', padding:'20px 16px 12px' }}>
          <p style={{ color:'#fff', fontWeight:700, fontSize:15 }}>{b.title}</p>
        </div>
      )}
      {items.length > 1 && (
        <div style={{ position:'absolute', bottom:10, right:12, display:'flex', gap:5 }}>
          {items.map((_,i) => (
            <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              style={{ width:i===idx?18:6, height:6, borderRadius:999, background:i===idx?C.gold:'rgba(255,255,255,.45)', cursor:'pointer', transition:'all .2s' }}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ p, cats, i, allImages, onOpen }) {
  const isBooking = BOOKING_CATS.includes(p.cat);
  const imgs = allImages[p.id] || [];
  const img  = imgs[0] || p.image_url;
  const cat  = cats.find(c => c.id === p.cat);
  return (
    <div className="hov" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', animation:`fadeUp .3s ease ${Math.min(i,8)*.04}s both` }}>
      <div onClick={() => onOpen(p)} style={{ height:155, position:'relative', overflow:'hidden', cursor:'pointer', background:'linear-gradient(135deg,#161200,#201a00)' }}>
        {img
          ? <img src={img} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:52 }}>{p.emoji}</div>
        }
        {p.badge && <span style={{ position:'absolute', top:8, right:8, background:BADGE_COLOR[p.badge]||C.gold, color:p.badge==='Bestseller'?C.bg:'#fff', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:999, textTransform:'uppercase' }}>{p.badge}</span>}
        {p.orig_price && <span style={{ position:'absolute', top:8, left:8, background:C.red, color:'#fff', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:999 }}>-{PCT(p.orig_price,p.price)}%</span>}
        {isBooking && <span style={{ position:'absolute', bottom:8, left:8, background:'rgba(245,158,11,.85)', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 8px', borderRadius:999 }}>Acompte 10%</span>}
        {cat && <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.6))', padding:'10px 8px 6px', textAlign:'center' }}>
          <span style={{ fontSize:9, color:C.gold, fontWeight:700, letterSpacing:2, textTransform:'uppercase' }}>{cat.label}</span>
        </div>}
      </div>
      <div style={{ padding:'14px 16px' }}>
        <p style={{ fontWeight:700, fontSize:14, color:C.white, marginBottom:3, cursor:'pointer', lineHeight:1.3 }} onClick={() => onOpen(p)}>{p.name}</p>
        <p style={{ fontSize:11, color:C.muted, marginBottom:10, lineHeight:1.5 }}>{(p.desc||p.description||'').slice(0,65)}{(p.desc||p.description||'').length>65?'…':''}</p>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:900, color:C.gold, marginBottom:10 }}>{FCFA(p.price)}</p>
        <button type="button" onClick={() => onOpen(p)} className="btn"
          style={{ width:'100%', background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:9, padding:'8px', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
          {isBooking ? <><Calendar size={12}/>Réserver</> : <><Eye size={12}/>Voir le produit</>}
        </button>
      </div>
    </div>
  );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function ProductModal({ product, cats, allVariants, allImages, onClose, onAddToCart, onBook }) {
  const [cur, setCur]   = useState(0);
  const [selS, setSelS] = useState(null);
  const [selC, setSelC] = useState(null);
  const [selZ, setSelZ] = useState(null);

  useEffect(() => {
    setCur(0); setSelS(null); setSelC(null); setSelZ(null);
  }, [product?.id]);

  if (!product) return null;

  const variants  = allVariants[product.id] || [];
  const imgs      = allImages[product.id] || [];
  const allImgs   = imgs.length > 0 ? imgs : (product.image_url ? [product.image_url] : []);
  const isBooking = BOOKING_CATS.includes(product.cat);
  const cat       = cats.find(c => c.id === product.cat);

  const storages = [...new Set(variants.filter(v => v.storage).map(v => v.storage))];
  const sizes    = [...new Set(variants.filter(v => v.size).map(v => v.size))];
  const getColors = (list) => {
    const seen = {};
    return list.filter(v => v.color).reduce((acc, v) => {
      if (!seen[v.color]) { seen[v.color] = true; acc.push({ name:v.color, hex:v.color_hex||'#888' }); }
      return acc;
    }, []);
  };
  const colors = storages.length > 0
    ? (selS ? getColors(variants.filter(v => v.storage===selS)) : [])
    : getColors(variants);

  const hasVariants = variants.length > 0;
  const matched = hasVariants
    ? variants.find(v =>
        (storages.length===0 || v.storage===selS) &&
        (colors.length===0  || v.color===selC)   &&
        (sizes.length===0   || v.size===selZ))
    : null;

  const price   = matched ? matched.price : (hasVariants ? Math.min(...variants.map(v => v.price)) : product.price);
  const acompte = Math.round(price * 0.10);
  const canAdd  = !hasVariants || !!matched;

  const needs = [
    storages.length > 0 && !selS ? 'une capacité' : null,
    (storages.length===0||selS) && colors.length > 0 && !selC ? 'une couleur' : null,
    sizes.length > 0 && !selZ ? 'une taille' : null,
  ].filter(Boolean);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.93)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:16, overflowY:'auto' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, width:'100%', maxWidth:640, margin:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.95)' }}>

        {/* GALLERY */}
        <div style={{ position:'relative', borderRadius:'22px 22px 0 0', overflow:'hidden', height:260, background:'#000' }}>
          {allImgs.length > 0
            ? <img src={allImgs[cur]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            : <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', fontSize:80, background:'linear-gradient(135deg,#161200,#201a00)' }}>{product.emoji}</div>
          }
          {allImgs.length > 1 && <>
            <button type="button" onClick={() => setCur(c => c===0 ? allImgs.length-1 : c-1)}
              style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,.6)', border:'none', color:'#fff', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <button type="button" onClick={() => setCur(c => c===allImgs.length-1 ? 0 : c+1)}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'rgba(0,0,0,.6)', border:'none', color:'#fff', borderRadius:'50%', width:34, height:34, cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
            <div style={{ position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5 }}>
              {allImgs.map((_,i) => (
                <button key={i} type="button" onClick={() => setCur(i)}
                  style={{ width:i===cur?18:6, height:6, borderRadius:999, background:i===cur?C.gold:'rgba(255,255,255,.4)', border:'none', cursor:'pointer', padding:0, transition:'all .2s' }}/>
              ))}
            </div>
          </>}
          {product.orig_price && <span style={{ position:'absolute', top:10, left:10, background:C.red, color:'#fff', fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:999, zIndex:5 }}>-{PCT(product.orig_price,product.price)}%</span>}
          {product.badge && <span style={{ position:'absolute', top:10, right:44, background:BADGE_COLOR[product.badge]||C.gold, color:product.badge==='Bestseller'?C.bg:'#fff', fontSize:10, fontWeight:800, padding:'3px 9px', borderRadius:999, zIndex:5 }}>{product.badge}</span>}
          <button type="button" onClick={onClose}
            style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,.7)', border:'none', color:'#fff', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5, fontSize:18 }}>×</button>
        </div>

        {/* CONTENT */}
        <div style={{ padding:'20px 24px' }}>
          {cat && <p style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', marginBottom:5 }}>{cat.label}</p>}
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:21, fontWeight:900, color:C.white, marginBottom:8, lineHeight:1.3 }}>{product.name}</h2>
          {(product.desc||product.description) && <p style={{ fontSize:13, color:C.muted, lineHeight:1.8, marginBottom:12 }}>{product.desc||product.description}</p>}
          <GL/>

          {/* VARIANTS */}
          {storages.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>Capacité</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {storages.map(s => {
                  const minP = Math.min(...variants.filter(v => v.storage===s).map(v => v.price));
                  return (
                    <button key={s} type="button" onClick={() => { setSelS(selS===s ? null : s); setSelC(null); }}
                      style={{ padding:'7px 14px', borderRadius:10, border:`2px solid ${selS===s?C.gold:C.border}`, background:selS===s?`${C.gold}18`:C.card2, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'all .15s' }}>
                      <span style={{ fontWeight:700, fontSize:13, color:selS===s?C.gold:C.white }}>{s}</span>
                      <span style={{ fontSize:10, color:C.muted }}>{FCFA(minP)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>
                Couleur{selC ? <span style={{ color:C.white, fontWeight:400 }}> — {selC}</span> : ''}
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {colors.map(col => (
                  <button key={col.name} type="button" onClick={() => setSelC(selC===col.name ? null : col.name)}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 12px', borderRadius:999, border:`2px solid ${selC===col.name?C.gold:'transparent'}`, background:C.card2, cursor:'pointer', transition:'all .15s', fontFamily:"'DM Sans',sans-serif" }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:col.hex, border:'1px solid rgba(255,255,255,.2)', flexShrink:0 }}/>
                    <span style={{ fontSize:12, color:selC===col.name?C.gold:C.muted, fontWeight:600 }}>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:8 }}>Taille</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {sizes.map(s => (
                  <button key={s} type="button" onClick={() => setSelZ(selZ===s ? null : s)}
                    style={{ width:44, height:44, borderRadius:10, border:`2px solid ${selZ===s?C.gold:C.border}`, background:selZ===s?`${C.gold}18`:C.card2, color:selZ===s?C.gold:C.white, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .15s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PRICE BOX */}
          <div style={{ background:C.card2, border:`1px solid ${matched||!hasVariants?C.gold:C.border}`, borderRadius:12, padding:'12px 16px', marginBottom:12, transition:'border-color .2s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:isBooking?8:0 }}>
              <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:C.gold }}>{FCFA(price)}</span>
              {product.orig_price && <span style={{ textDecoration:'line-through', color:C.muted, fontSize:13 }}>{FCFA(product.orig_price)}</span>}
              {matched && <span style={{ fontSize:11, color:C.green, fontWeight:700, background:`${C.green}15`, padding:'2px 9px', borderRadius:999 }}>✓ Prêt</span>}
            </div>
            {isBooking && (
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 10px', background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:8 }}>
                <span style={{ fontSize:12, color:C.orange, fontWeight:700 }}>Acompte 10% requis : {FCFA(acompte)}</span>
              </div>
            )}
          </div>

          {hasVariants && !matched && needs.length > 0 && (
            <p style={{ fontSize:12, color:C.orange, fontWeight:600, background:`${C.orange}10`, padding:'8px 12px', borderRadius:8, textAlign:'center', marginBottom:12 }}>
              Veuillez sélectionner {needs.join(' et ')}
            </p>
          )}

          {/* ACTION BUTTON */}
          {isBooking
            ? <button type="button" className="btn" onClick={() => canAdd && onBook(product, price, acompte)} disabled={!canAdd}
                style={{ width:'100%', background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:'#2a2a2a', color:canAdd?C.bg:C.muted, border:'none', borderRadius:14, padding:'13px', fontWeight:700, fontSize:14, cursor:canAdd?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Calendar size={15}/>{canAdd ? `Réserver — acompte ${FCFA(acompte)}` : 'Sélectionner les options'}
              </button>
            : <button type="button" className="btn" onClick={() => canAdd && onAddToCart(product, matched)} disabled={!canAdd}
                style={{ width:'100%', background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:'#2a2a2a', color:canAdd?C.bg:C.muted, border:'none', borderRadius:14, padding:'13px', fontWeight:700, fontSize:14, cursor:canAdd?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <ShoppingCart size={15}/>{canAdd ? 'Ajouter au panier' : 'Sélectionner les options'}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
function BookingModal({ data, onClose, onConfirm }) {
  const today = new Date();
  const [bf, setBf]         = useState({ name:'', email:'', tel:'', date:'', qty:1 });
  const [err, setErr]       = useState('');
  const [calOpen, setCalOpen] = useState(false);
  const [view, setView]     = useState({ y:today.getFullYear(), m:today.getMonth() });

  // IMPORTANT: tous les hooks AVANT le return conditionnel
  useEffect(() => {
    if (data) { setBf({ name:'', email:'', tel:'', date:'', qty:1 }); setErr(''); setCalOpen(false); }
  }, [data?.product?.id]);

  if (!data) return null;

  const { product, price, acompte } = data;
  const days  = new Date(view.y, view.m+1, 0).getDate();
  const first = new Date(view.y, view.m, 1).getDay();
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

  const pickDate = d => {
    const dt = new Date(view.y, view.m, d);
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dt < now) return;
    setBf(f => ({ ...f, date:`${String(d).padStart(2,'0')}/${String(view.m+1).padStart(2,'0')}/${view.y}` }));
    setCalOpen(false);
  };

  const confirm = () => {
    if (!bf.name.trim() || !bf.tel.trim() || !bf.date) { setErr('Remplissez tous les champs obligatoires'); return; }
    setErr('');
    onConfirm({ ...bf, product, acompte, price });
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:1001, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:28, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:18, color:C.gold }}>{product.name}</h3>
            <p style={{ fontSize:12, color:C.muted, marginTop:3 }}>Réservation — acompte 10%</p>
          </div>
          <button type="button" onClick={onClose} style={{ background:'none', border:`1px solid ${C.border}`, color:C.muted, borderRadius:8, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>×</button>
        </div>
        <GL/>

        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[['name','Votre nom *','text'],['email','Email','email'],['tel','Téléphone / WhatsApp *','tel']].map(([f,l,t]) => (
            <div key={f}>
              <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
              <input type={t} value={bf[f]} onChange={e => setBf(x => ({...x,[f]:e.target.value}))} placeholder={l.replace(' *','')}
                style={{ width:'100%', background:C.card2, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'10px 13px', color:C.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' }}/>
            </div>
          ))}

          {/* CALENDRIER */}
          <div style={{ position:'relative' }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>Date souhaitée *</label>
            <button type="button" onClick={() => setCalOpen(o => !o)}
              style={{ width:'100%', background:C.card2, border:`1.5px solid ${bf.date?C.gold:C.border}`, borderRadius:10, padding:'10px 13px', color:bf.date?C.gold:C.muted, fontSize:14, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{bf.date || 'Choisir une date'}</span>
              <Calendar size={14} color={bf.date?C.gold:C.muted}/>
            </button>
            {calOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:600, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:14, width:240, boxShadow:'0 20px 50px rgba(0,0,0,.9)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <button type="button" onClick={() => setView(v => v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} style={{ background:'none', border:`1px solid ${C.border}`, color:C.gold, borderRadius:7, padding:'3px 10px', cursor:'pointer' }}>‹</button>
                  <span style={{ fontWeight:700, fontSize:13, color:C.white }}>{MONTHS[view.m]} {view.y}</span>
                  <button type="button" onClick={() => setView(v => v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} style={{ background:'none', border:`1px solid ${C.border}`, color:C.gold, borderRadius:7, padding:'3px 10px', cursor:'pointer' }}>›</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:4 }}>
                  {['Di','Lu','Ma','Me','Je','Ve','Sa'].map(d => <div key={d} style={{ textAlign:'center', fontSize:9, color:C.muted, fontWeight:700 }}>{d}</div>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                  {Array(first).fill(null).map((_,i) => <div key={'e'+i}/>)}
                  {Array(days).fill(null).map((_,i) => {
                    const d = i+1;
                    const dt = new Date(view.y, view.m, d);
                    const past = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const sel = bf.date === `${String(d).padStart(2,'0')}/${String(view.m+1).padStart(2,'0')}/${view.y}`;
                    return (
                      <button key={d} type="button" onClick={() => pickDate(d)}
                        style={{ textAlign:'center', fontSize:12, padding:'5px 0', borderRadius:7, border:'none', background:sel?C.gold:past?'transparent':C.card2, color:sel?C.bg:past?C.border:C.white, cursor:past?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:sel?800:400 }}>
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* NB PERSONNES */}
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:6 }}>Nombre de personnes</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button type="button" onClick={() => setBf(f => ({...f,qty:Math.max(1,f.qty-1)}))} style={{ width:34, height:34, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.card2, color:C.gold, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={13}/></button>
              <span style={{ fontWeight:800, fontSize:18, minWidth:20, textAlign:'center' }}>{bf.qty}</span>
              <button type="button" onClick={() => setBf(f => ({...f,qty:f.qty+1}))} style={{ width:34, height:34, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.card2, color:C.gold, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={13}/></button>
            </div>
          </div>

          {err && <p style={{ color:C.red, fontSize:12, fontWeight:600 }}>⚠ {err}</p>}

          {/* RÉSUMÉ PAIEMENT */}
          <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:'12px 16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
              <span style={{ color:C.muted }}>Montant total</span>
              <span style={{ fontWeight:700 }}>{FCFA(price * bf.qty)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:15 }}>
              <span style={{ color:C.orange, fontWeight:700 }}>Acompte (10%)</span>
              <span style={{ fontWeight:900, color:C.orange }}>{FCFA(acompte * bf.qty)}</span>
            </div>
          </div>

          <button type="button" className="btn" onClick={confirm}
            style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:13, padding:'13px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Calendar size={15}/>Confirmer — {FCFA(acompte * bf.qty)}
          </button>
          <p style={{ fontSize:11, color:C.muted, textAlign:'center' }}>Solde restant ({FCFA((price-acompte)*bf.qty)}) finalisé via WhatsApp/Email</p>
        </div>
      </div>
    </div>
  );
}

// ─── HELPER : lire le panier depuis localStorage de façon sûre ────────────────
function readCart() {
  try {
    const raw = localStorage.getItem('smcart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


// ─── DONNÉES PAR DÉFAUT CIRCUITS ─────────────────────────────────────────────
const DEFAULT_CIRCUIT = {
  hero_title: "Circuits Vacances",
  hero_subtitle: "Afrique de l’Ouest — Clé en main",
  hero_desc: "Du transfert aéroport jusqu’à votre départ, S-Group organise chaque détail de votre séjour. Hébergement, transport, excursions, repas, guide dédié — tout est inclus. Vous arrivez… et tout est déjà géré.",
  saison: "Saison 2026 — 2027",
  periodes: [
    { type:"basse", label:"Basse Saison", dates:"Août → Octobre 2026", desc:"Conditions idéales, moins de touristes, atmosphère authentique et tranquille. Idéal pour une immersion sereine.", tarif:"Prix de base" },
    { type:"haute", label:"Haute Saison", dates:"Novembre 2026 → Janvier 2027", desc:"Fêtes de fin d’année, Noël & Nouvel An au Bénin. Ambiance festive, événements culturels exceptionnels.", tarif:"Prix de base + 10 %" },
  ],
  packs: [
    { id:"benin", name:"Pack Bénin", countries:"Bénin uniquement", color:"#0D2B45",
      couple_fcfa:721000, couple_eur:1100, solo_fcfa:918000, solo_eur:1400,
      billet_fcfa:721500, billet_eur:1100, extra_day_fcfa:72100, extra_day_eur:110,
      dates_proposees:["15 Août 2026","01 Sept. 2026","15 Oct. 2026","20 Nov. 2026","20 Déc. 2026"] },
    { id:"benin-togo", name:"Pack Bénin + Togo", countries:"2 pays", color:"#1A4560",
      couple_fcfa:853000, couple_eur:1300, solo_fcfa:1049000, solo_eur:1600,
      billet_fcfa:721500, billet_eur:1100, extra_day_fcfa:85300, extra_day_eur:130,
      dates_proposees:["01 Sept. 2026","20 Oct. 2026","01 Déc. 2026","05 Jan. 2027"] },
    { id:"sous-region", name:"Pack Sous-Région", countries:"3 pays — immersion totale", color:"#0F3520",
      couple_fcfa:1246000, couple_eur:1900, solo_fcfa:1443000, solo_eur:2200,
      billet_fcfa:721500, billet_eur:1100, extra_day_fcfa:124600, extra_day_eur:190,
      dates_proposees:["15 Sept. 2026","01 Nov. 2026","15 Déc. 2026","10 Jan. 2027"] },
  ],
  inclus: [
    "Transfert aéroport — arrivée & départ",
    "Hébergement hôtel 3 étoiles",
    "3 repas complets par jour",
    "Guide local S-Group dédié",
    "Véhicule avec chauffeur privé",
    "Toutes excursions & visites guidées",
    "Eau minérale à volonté",
    "Carte SIM locale + Internet",
    "Cadeau souvenir S-Group",
  ],
  non_inclus: [
    "Visa (assisté par S-Group)",
    "Billet international (optionnel)",
    "Dépenses personnelles",
    "Assurance voyage",
    "Pourboires",
    "Activités hors programme",
    "Boissons alcolisées",
  ],
  programme: [
    { day:"01", location:"Cotonou — Arrivée", desc:"Accueil VIP à l’aéroport, transfert hôtel, déjeuner de bienvenue, découverte de Cotonou & briefing du séjour." },
    { day:"02", location:"Cotonou — Marché Dantokpa", desc:"Visite du plus grand marché d’Afrique de l’Ouest, Centre Artistique, rencontre avec artistes locaux." },
    { day:"03", location:"Ouidah — Histoire & Spiritualité", desc:"Temple des Pythons, Musée d’Histoire, Route des Esclaves & Porte du Non-Retour face à l’Atlantique." },
    { day:"04", location:"Ganvié — La Venise de l’Afrique", desc:"Traversée en pirogue vers le village lacustre sur pilotis du lac Nokoué, rencontre avec les habitants." },
    { day:"05", location:"Porto-Novo — La Capitale", desc:"Musée Ethnographique, Grande Mosquée Brasileira, marché central, Palais Royal de Porto-Novo." },
    { day:"06—09", location:"Expériences & Immersion", desc:"Journées culturelles, artisanat, cuisine locale, excursions optionnelles (Abomey, Penjari…), journées libres & soirées." },
    { day:"10", location:"Cotonou — Départ", desc:"Petit-déjeuner, dêner de clôture, remise du cadeau souvenir S-Group & transfert aéroport." },
  ],
  conditions: "Acompte de 30 % à la confirmation — Solde 30 jours avant le départ. Paiement échelonné possible sur demande. Assistance visa disponible.",
};

// ─── CARTE CIRCUIT INDIVIDUEL ────────────────────────────────────────────────
function CircuitCard({ p, allImages, onBook, i }) {
  const imgs = allImages[p.id] || [];
  const img  = imgs[0] || p.image_url;
  return (
    <div className="hov" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column', animation:`fadeUp .35s ease ${Math.min(i,6)*.06}s both` }}>
      <div style={{ height:200, position:'relative', overflow:'hidden', background:'linear-gradient(135deg,#050e05,#0d1a0d)', flexShrink:0 }}>
        {img
          ? <img src={img} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
              <Map size={48} strokeWidth={1} color={C.gold}/>
            </div>
        }
        {p.badge && (
          <span style={{ position:'absolute', top:12, right:12, background:C.gold, color:C.bg, fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999, textTransform:'uppercase', letterSpacing:1 }}>{p.badge}</span>
        )}
        {p.orig_price && (
          <span style={{ position:'absolute', top:12, left:12, background:C.red, color:'#fff', fontSize:9, fontWeight:800, padding:'3px 10px', borderRadius:999 }}>-{PCT(p.orig_price,p.price)}%</span>
        )}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent,rgba(0,0,0,.7))', padding:'20px 16px 12px' }}>
          <p style={{ fontSize:9, color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase' }}>Circuit</p>
        </div>
      </div>
      <div style={{ padding:'20px 22px', flex:1, display:'flex', flexDirection:'column' }}>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:900, color:C.white, marginBottom:6, lineHeight:1.3 }}>{p.name}</h3>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.7, marginBottom:14, flex:1 }}>{(p.desc||p.description||'').slice(0,100)}{(p.desc||p.description||'').length>100?'…':''}</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:C.gold }}>{FCFA(p.price)}</p>
            {p.orig_price && <p style={{ fontSize:11, color:C.muted, textDecoration:'line-through' }}>{FCFA(p.orig_price)}</p>}
          </div>
          <span style={{ fontSize:11, color:C.muted, background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px' }}>Acompte 30%</span>
        </div>
        <button type="button" className="btn" onClick={() => onBook({ id:p.id, name:p.name, countries:p.dest||'Bénin', base:p.price, color:'#0D2B45', prices:[], note:'' })}
          style={{ width:'100%', background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:12, padding:'12px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:0.3 }}>
          Réserver ce circuit
        </button>
      </div>
    </div>
  );
}

// ─── PAGE CIRCUITS ────────────────────────────────────────────────────────────
function CircuitsPage({ data, circuits, allImages, onBook, onOpenProduct }) {
  const d          = data ? { ...DEFAULT_CIRCUIT, ...data } : DEFAULT_CIRCUIT;
  const packs      = (data && data.packs)      ? data.packs      : DEFAULT_CIRCUIT.packs;
  const programme  = (data && data.programme)  ? data.programme  : DEFAULT_CIRCUIT.programme;
  const inclus     = (data && data.inclus)     ? data.inclus     : DEFAULT_CIRCUIT.inclus;
  const non_inclus = (data && data.non_inclus) ? data.non_inclus : DEFAULT_CIRCUIT.non_inclus;
  const periodes   = (data && data.periodes)   ? data.periodes   : DEFAULT_CIRCUIT.periodes;

  return (
    <div style={{ animation:'fadeUp .4s ease' }}>

      {/* ── HERO ── */}
      <div style={{ position:'relative', overflow:'hidden', padding:'80px 56px 72px', background:'linear-gradient(160deg,#050e05 0%,#0d1a0d 55%,#050e05 100%)' }}>
        <div style={{ position:'absolute', top:-100, right:-80, width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,${C.gold}0d 0%,transparent 65%)`, pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-80, left:-40, width:350, height:350, borderRadius:'50%', background:`radial-gradient(circle,${C.gold}07 0%,transparent 65%)`, pointerEvents:'none' }}/>
        <div style={{ maxWidth:1180, margin:'0 auto' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:5, textTransform:'uppercase', fontSize:10, marginBottom:16 }}>{d.saison}</p>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:56, fontWeight:900, lineHeight:1.02, marginBottom:12, color:C.white }}>
            {d.hero_title}<br/>
            <span style={{ background:`linear-gradient(90deg,${C.gold},${C.goldL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{d.hero_subtitle}</span>
          </h1>
          <div style={{ width:64, height:3, background:`linear-gradient(90deg,${C.gold},${C.goldL})`, margin:'22px 0' }}/>
          <p style={{ color:C.muted, fontSize:15, lineHeight:1.85, maxWidth:600, marginBottom:36 }}>{d.hero_desc}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, maxWidth:680 }}>
            {packs.map(p => (
              <div key={p.id} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${C.gold}22`, borderRadius:14, padding:'18px 14px', textAlign:'center', backdropFilter:'blur(8px)' }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.gold, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>{p.name}</p>
                <p style={{ fontSize:10, color:C.muted }}>{p.countries}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CIRCUITS DISPONIBLES (dynamiques depuis Supabase) ── */}
      {circuits && circuits.length > 0 && (
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'56px 28px' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:10, marginBottom:8 }}>Nos circuits</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, marginBottom:6, color:C.white }}>Circuits disponibles</h2>
          <p style={{ fontSize:14, color:C.muted, marginBottom:10, lineHeight:1.7 }}>Chaque circuit est une expérience unique, organisée et gérée par S-Group de A à Z.</p>
          <GL/>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:22 }}>
            {circuits.map((p,i) => (
              <CircuitCard key={p.id} p={p} allImages={allImages} onBook={onBook} i={i}/>
            ))}
          </div>
        </div>
      )}

      {/* ── PÉRIODES ── */}
      <div style={{ background: circuits && circuits.length > 0 ? C.card : 'transparent', padding:'56px 0' }}>
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:10, marginBottom:8 }}>Disponibilités</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, marginBottom:10, color:C.white }}>Deux saisons, deux ambiances</h2>
          <GL/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            {periodes.map((p,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${p.type==='haute'?C.gold+'44':C.border}`, borderRadius:18, padding:'32px 30px' }}>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:p.type==='haute'?C.gold:C.blue, marginBottom:10 }}>{p.label}</p>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:C.white, marginBottom:12 }}>{p.dates}</p>
                <p style={{ fontSize:13, color:C.muted, lineHeight:1.8, marginBottom:14 }}>{p.desc}</p>
                <div style={{ display:'inline-block', background:p.type==='haute'?`${C.gold}15`:C.card2, border:`1px solid ${p.type==='haute'?C.gold+'33':C.border}`, borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, color:p.type==='haute'?C.gold:C.muted }}>{p.tarif}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FORMULES TARIFAIRES ── */}
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'56px 28px' }}>
        <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:10, marginBottom:8 }}>Tarification</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, marginBottom:6, color:C.white }}>Nos formules — à partir de 10 jours</h2>
        <p style={{ fontSize:14, color:C.muted, marginBottom:10, lineHeight:1.7 }}>Hébergement, transport, repas et visites inclus. Prix par personne hors billet d'avion.</p>
        <GL/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:22 }}>
          {packs.map(p => (
            <div key={p.id} className="hov" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'24px', background:p.color||C.bg, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }}/>
                <p style={{ fontSize:10, fontWeight:700, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{p.countries}</p>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:C.white }}>{p.name}</h3>
              </div>
              <div style={{ padding:'20px 24px', flex:1, display:'flex', flexDirection:'column' }}>
                <div style={{ flex:1 }}>
                  <div style={{ padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:5 }}>Couple / personne</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:C.gold }}>{FCFA(p.couple_fcfa||721000)}</span>
                      <span style={{ fontSize:11, color:C.muted }}>≈ {p.couple_eur||1100} €</span>
                    </div>
                  </div>
                  <div style={{ padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                    <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:5 }}>Solo</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:C.gold }}>{FCFA(p.solo_fcfa||918000)}</span>
                      <span style={{ fontSize:11, color:C.muted }}>≈ {p.solo_eur||1400} €</span>
                    </div>
                  </div>
                  <div style={{ padding:'10px 0' }}>
                    <p style={{ fontSize:11, color:C.muted, fontWeight:600, marginBottom:3 }}>Billet d'avion (option)</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.white }}>+ {FCFA(p.billet_fcfa||721500)}</span>
                      <span style={{ fontSize:10, color:C.muted }}>≈ +{p.billet_eur||1100} €</span>
                    </div>
                  </div>
                  {p.extra_day_fcfa && (
                    <p style={{ fontSize:11, color:C.muted, fontStyle:'italic', borderTop:`1px solid ${C.border}`, paddingTop:10, marginTop:4 }}>
                      + {FCFA(p.extra_day_fcfa)} / jour supplémentaire
                    </p>
                  )}
                </div>
                <button type="button" className="btn" onClick={() => onBook(p)}
                  style={{ width:'100%', marginTop:18, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:12, padding:'13px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:0.5 }}>
                  Réserver cette formule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── INCLUS / NON INCLUS ── */}
      <div style={{ background:C.card, padding:'56px 0' }}>
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:10, marginBottom:8 }}>Contenu des formules</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, marginBottom:10, color:C.white }}>Ce qui est inclus</h2>
          <GL/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div style={{ background:C.card2, border:`1px solid ${C.green}33`, borderRadius:18, padding:'28px 30px' }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.green, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${C.green}22` }}>Inclus dans toutes les formules</p>
              {inclus.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:C.green, marginTop:6, flexShrink:0 }}/>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{item}</p>
                </div>
              ))}
            </div>
            <div style={{ background:C.card2, border:`1px solid ${C.red}33`, borderRadius:18, padding:'28px 30px' }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:'uppercase', color:C.red, marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${C.red}22` }}>Non inclus</p>
              {non_inclus.map((item,i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:C.red, marginTop:6, flexShrink:0 }}/>
                  <p style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROGRAMME ── */}
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'56px 28px' }}>
        <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:10, marginBottom:8 }}>Programme indicatif</p>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, marginBottom:10, color:C.white }}>Séjour jour par jour — Pack Bénin</h2>
        <GL/>
        <div>
          {programme.map((item,i) => (
            <div key={i} style={{ display:'flex', gap:24, padding:'22px 0', borderBottom:i<programme.length-1?`1px solid ${C.border}`:'none', alignItems:'flex-start' }}>
              <div style={{ width:52, height:52, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRadius:12, letterSpacing:1 }}>J{item.day}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.gold, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>{item.location}</p>
                <p style={{ fontSize:14, color:C.muted, lineHeight:1.8 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAIEMENT & CTA ── */}
      <div style={{ background:C.card, padding:'56px 0' }}>
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:10, marginBottom:8 }}>Réservation</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, marginBottom:10, color:C.white }}>Modalités de paiement</h2>
          <GL/>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
                {['Mobile Money','Virement bancaire','Carte bancaire','PayPal','Espèces'].map(m => (
                  <div key={m} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 18px', fontSize:12, fontWeight:600, color:C.white }}>{m}</div>
                ))}
              </div>
              <div style={{ background:C.card2, borderLeft:`3px solid ${C.gold}`, borderRadius:'0 12px 12px 0', padding:'18px 22px', fontSize:13, color:C.muted, lineHeight:1.8 }}>
                {d.conditions}
              </div>
            </div>
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:18, padding:'28px 26px' }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:C.white, marginBottom:6 }}>Vous souhaitez réserver ?</p>
              <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:20 }}>Choisissez votre formule et réservez en ligne avec un acompte de 30 %. Notre équipe vous contacte sous 24h pour finaliser les détails.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {packs.map(p => (
                  <button key={p.id} type="button" className="btn" onClick={() => onBook(p)}
                    style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:12, padding:'12px 20px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>{p.name}</span>
                    <span style={{ fontSize:11, opacity:0.8 }}>Réserver</span>
                  </button>
                ))}
                <a href={WA + "?text=Bonjour%20S-Group%2C%20je%20souhaite%20des%20informations%20sur%20les%20circuits"} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#25d366', color:'#fff', borderRadius:12, padding:'12px', fontWeight:700, fontSize:13, textDecoration:'none', fontFamily:"'DM Sans',sans-serif" }}>
                  Contacter via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── MODAL RÉSERVATION CIRCUIT ────────────────────────────────────────────────
// Dates proposées par défaut si le pack n'en a pas
const DEFAULT_DATES = ["15 Août 2026","01 Sept. 2026","15 Oct. 2026","20 Nov. 2026","20 Déc. 2026"];
const EUR_RATE = 655.957; // 1 EUR ≈ 656 FCFA (taux fixe CFA)

function CircuitBookModal({ pack, onClose, onConfirm }) {
  const today = new Date();
  // ── États ──
  const [step,       setStep]       = useState(1); // 1=options, 2=dates, 3=infos
  const [option,     setOption]     = useState(null);    // 'couple' | 'solo'
  const [billet,     setBillet]     = useState(false);   // option billet avion
  const [dateMode,   setDateMode]   = useState(null);    // 'proposee' | 'libre'
  const [dateSel,    setDateSel]    = useState('');      // date choisie (proposée ou calendrier)
  const [calOpen,    setCalOpen]    = useState(false);
  const [calView,    setCalView]    = useState({ y:today.getFullYear(), m:today.getMonth() });
  const [qty,        setQty]        = useState(1);
  const [bf,         setBf]         = useState({ name:'', email:'', tel:'' });
  const [err,        setErr]        = useState('');

  // Reset à chaque ouverture
  useEffect(() => {
    if (pack) {
      setStep(1); setOption(null); setBillet(false);
      setDateMode(null); setDateSel(''); setCalOpen(false);
      setQty(1); setBf({ name:'', email:'', tel:'' }); setErr('');
    }
  }, [pack?.id]);

  if (!pack) return null;

  // ── Calculs prix ──
  const prixUnitaire = option === 'solo'
    ? (pack.solo_fcfa || pack.price || 918000)
    : (pack.couple_fcfa || pack.price || 721000);

  const prixBillet   = billet ? (pack.billet_fcfa || 721500) : 0;
  const prixBase     = (prixUnitaire + prixBillet) * qty;
  const acompte      = Math.round(prixBase * 0.30);
  const solde        = prixBase - acompte;

  const prixEur = option === 'solo'
    ? (pack.solo_eur || 1400)
    : (pack.couple_eur || 1100);

  // ── Calendrier ──
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const calDays  = new Date(calView.y, calView.m+1, 0).getDate();
  const calFirst = new Date(calView.y, calView.m, 1).getDay();

  const pickCalDate = d => {
    const dt = new Date(calView.y, calView.m, d);
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dt < now) return;
    setDateSel(`${String(d).padStart(2,'0')}/${String(calView.m+1).padStart(2,'0')}/${calView.y}`);
    setCalOpen(false);
  };

  // ── Validation et confirmation ──
  const confirm = () => {
    if (!bf.name.trim() || !bf.tel.trim()) { setErr('Veuillez remplir votre nom et téléphone'); return; }
    setErr('');
    onConfirm({
      name: bf.name, email: bf.email, tel: bf.tel,
      date: dateSel, qty,
      option, billet,
      packName: pack.name,
      total: prixBase,
      acompte,
    });
  };

  // ── Styles communs ──
  const S = {
    label: { fontSize:11, fontWeight:700, color:C.muted, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:1.5 },
    input: { width:'100%', background:C.card2, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'11px 14px', color:C.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' },
    optBtn: (active, col=C.gold) => ({
      flex:1, border:`2px solid ${active ? col : C.border}`, borderRadius:12, padding:'14px 10px',
      background: active ? `${col}18` : C.card2, cursor:'pointer', textAlign:'center',
      fontFamily:"'DM Sans',sans-serif", transition:'all .15s',
    }),
    stepDot: (n) => ({
      width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:12, fontWeight:800,
      background: step >= n ? `linear-gradient(135deg,${C.goldD},${C.gold})` : C.card2,
      color: step >= n ? C.bg : C.muted,
      flexShrink:0,
    }),
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.93)', zIndex:1002, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, width:'100%', maxWidth:500, margin:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.95)' }}>

        {/* ── EN-TÊTE ── */}
        <div style={{ padding:'22px 26px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', marginBottom:5 }}>Réservation</p>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:C.white, marginBottom:2 }}>{pack.name}</h3>
              {pack.countries && <p style={{ fontSize:12, color:C.muted }}>{pack.countries}</p>}
            </div>
            <button type="button" onClick={onClose} style={{ background:'none', border:`1px solid ${C.border}`, color:C.muted, borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
          </div>
          {/* Indicateur d'étapes */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {[['1','Options'],['2','Date'],['3','Vos infos']].map(([n,l],i) => (
              <div key={n} style={{ display:'flex', alignItems:'center', gap:8, flex:i<2?1:'auto' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={S.stepDot(Number(n))}>{Number(n) < step ? '✓' : n}</div>
                  <span style={{ fontSize:11, fontWeight:700, color:step>=Number(n)?C.gold:C.muted }}>{l}</span>
                </div>
                {i < 2 && <div style={{ flex:1, height:1, background:step>Number(n)?C.gold:C.border }}/>}
              </div>
            ))}
          </div>
        </div>

        {/* ── CONTENU ÉTAPES ── */}
        <div style={{ padding:'22px 26px', display:'flex', flexDirection:'column', gap:18, maxHeight:'70vh', overflowY:'auto' }}>

          {/* ═ ÉTAPE 1 : OPTIONS ═ */}
          {step === 1 && (
            <>
              {/* Solo / Couple */}
              <div>
                <label style={S.label}>Votre situation *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { val:'couple', titre:'Couple', desc:'Par personne', prix: pack.couple_fcfa||721000, eur: pack.couple_eur||1100 },
                    { val:'solo',   titre:'Solo',   desc:'Par personne', prix: pack.solo_fcfa||918000,   eur: pack.solo_eur||1400 },
                  ].map(o => (
                    <button key={o.val} type="button" onClick={() => setOption(o.val)} style={S.optBtn(option===o.val)}>
                      <p style={{ fontWeight:800, fontSize:14, color:option===o.val?C.gold:C.white, marginBottom:6 }}>{o.titre}</p>
                      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:C.gold, marginBottom:2 }}>{FCFA(o.prix)}</p>
                      <p style={{ fontSize:10, color:C.muted }}>≈ {o.eur} € / pers.</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nombre de personnes */}
              {option && (
                <div>
                  <label style={S.label}>Nombre de personnes</label>
                  <div style={{ display:'flex', alignItems:'center', gap:14, background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 16px' }}>
                    <button type="button" onClick={() => setQty(q => Math.max(1,q-1))} style={{ width:34, height:34, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.bg, color:C.gold, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={14}/></button>
                    <span style={{ fontWeight:900, fontSize:22, flex:1, textAlign:'center', color:C.white }}>{qty}</span>
                    <button type="button" onClick={() => setQty(q => q+1)} style={{ width:34, height:34, borderRadius:9, border:`1.5px solid ${C.border}`, background:C.bg, color:C.gold, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={14}/></button>
                  </div>
                </div>
              )}

              {/* Option billet */}
              {option && (
                <div>
                  <label style={S.label}>Billet d'avion</label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {[
                      { val:false, titre:'Sans billet', desc:'Je gère mon vol' },
                      { val:true,  titre:'Avec billet', desc:`+ ${FCFA(pack.billet_fcfa||721500)}` },
                    ].map(o => (
                      <button key={String(o.val)} type="button" onClick={() => setBillet(o.val)} style={S.optBtn(billet===o.val, billet===o.val&&o.val?C.orange:C.gold)}>
                        <p style={{ fontWeight:700, fontSize:13, color:billet===o.val?C.gold:C.white, marginBottom:3 }}>{o.titre}</p>
                        <p style={{ fontSize:11, color:C.muted }}>{o.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Récap rapide */}
              {option && (
                <div style={{ background:`${C.gold}0d`, border:`1px solid ${C.gold}22`, borderRadius:12, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                    <span style={{ color:C.muted }}>{option==='couple'?'Couple':'Solo'} × {qty} pers.</span>
                    <span style={{ fontWeight:700, color:C.white }}>{FCFA(prixUnitaire * qty)}</span>
                  </div>
                  {billet && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                      <span style={{ color:C.muted }}>Billet × {qty} pers.</span>
                      <span style={{ fontWeight:700, color:C.white }}>{FCFA(prixBillet * qty)}</span>
                    </div>
                  )}
                  <div style={{ height:1, background:C.border, margin:'8px 0' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:700, color:C.gold }}>Total estimé</span>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:18, color:C.gold }}>{FCFA(prixBase)}</span>
                  </div>
                </div>
              )}

              <button type="button" onClick={() => { if(!option){ setErr('Choisissez Solo ou Couple'); return; } setErr(''); setStep(2); }}
                disabled={!option}
                style={{ background:option?`linear-gradient(135deg,${C.goldD},${C.gold})`:'#2a2a2a', color:option?C.bg:C.muted, border:'none', borderRadius:13, padding:'13px', fontWeight:700, fontSize:14, cursor:option?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif" }}>
                Suivant — Choisir la date
              </button>
            </>
          )}

          {/* ═ ÉTAPE 2 : DATE ═ */}
          {step === 2 && (
            <>
              <div>
                <label style={S.label}>Mode de réservation *</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { val:'proposee', titre:'Date S-Group', desc:'Choisir parmi nos départs' },
                    { val:'libre',    titre:'Date libre',   desc:'Je choisis mes propres dates' },
                  ].map(o => (
                    <button key={o.val} type="button" onClick={() => { setDateMode(o.val); setDateSel(''); setCalOpen(false); }} style={S.optBtn(dateMode===o.val)}>
                      <p style={{ fontWeight:700, fontSize:13, color:dateMode===o.val?C.gold:C.white, marginBottom:3 }}>{o.titre}</p>
                      <p style={{ fontSize:11, color:C.muted }}>{o.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Dates proposées */}
                {dateMode === 'proposee' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <p style={{ fontSize:11, color:C.muted, marginBottom:4 }}>Sélectionnez un départ :</p>
                    {(pack.dates_proposees || DEFAULT_DATES).map(d => (
                      <button key={d} type="button" onClick={() => setDateSel(d)}
                        style={{ background:dateSel===d?`${C.gold}18`:C.card2, border:`2px solid ${dateSel===d?C.gold:C.border}`, borderRadius:11, padding:'12px 16px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all .15s' }}>
                        <span style={{ fontWeight:700, fontSize:14, color:dateSel===d?C.gold:C.white }}>{d}</span>
                        {dateSel===d && <span style={{ fontSize:12, color:C.gold }}>✓ Sélectionné</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Calendrier libre */}
                {dateMode === 'libre' && (
                  <div style={{ position:'relative' }}>
                    <button type="button" onClick={() => setCalOpen(o => !o)}
                      style={{ width:'100%', background:C.card2, border:`1.5px solid ${dateSel?C.gold:C.border}`, borderRadius:10, padding:'11px 14px', color:dateSel?C.gold:C.muted, fontSize:14, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span>{dateSel || 'Sélectionner votre date de départ'}</span>
                      <Calendar size={15} color={dateSel?C.gold:C.muted}/>
                    </button>
                    {calOpen && (
                      <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:600, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, width:'100%', boxShadow:'0 20px 50px rgba(0,0,0,.9)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                          <button type="button" onClick={() => setCalView(v => v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} style={{ background:'none', border:`1px solid ${C.border}`, color:C.gold, borderRadius:7, padding:'4px 12px', cursor:'pointer', fontSize:16 }}>‹</button>
                          <span style={{ fontWeight:700, fontSize:13, color:C.white }}>{MONTHS[calView.m]} {calView.y}</span>
                          <button type="button" onClick={() => setCalView(v => v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} style={{ background:'none', border:`1px solid ${C.border}`, color:C.gold, borderRadius:7, padding:'4px 12px', cursor:'pointer', fontSize:16 }}>›</button>
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2, marginBottom:6 }}>
                          {['Di','Lu','Ma','Me','Je','Ve','Sa'].map(d => <div key={d} style={{ textAlign:'center', fontSize:9, color:C.muted, fontWeight:700, padding:'4px 0' }}>{d}</div>)}
                        </div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
                          {Array(calFirst).fill(null).map((_,i) => <div key={'e'+i}/>)}
                          {Array(calDays).fill(null).map((_,i) => {
                            const d=i+1;
                            const dt=new Date(calView.y,calView.m,d);
                            const past=dt<new Date(today.getFullYear(),today.getMonth(),today.getDate());
                            const dStr=`${String(d).padStart(2,'0')}/${String(calView.m+1).padStart(2,'0')}/${calView.y}`;
                            const sel=dateSel===dStr;
                            return (
                              <button key={d} type="button" onClick={() => pickCalDate(d)}
                                style={{ textAlign:'center', fontSize:12, padding:'6px 0', borderRadius:7, border:'none', background:sel?C.gold:past?'transparent':C.card2, color:sel?C.bg:past?C.border:C.white, cursor:past?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:sel?800:400 }}>
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <p style={{ fontSize:11, color:C.muted, marginTop:8 }}>Notre équipe confirmera la disponibilité de votre date sous 24h.</p>
                  </div>
                )}
              </div>

              {err && <p style={{ color:C.red, fontSize:12, fontWeight:600, background:`${C.red}10`, padding:'10px 14px', borderRadius:9 }}>{err}</p>}

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => { setStep(1); setErr(''); }}
                  style={{ background:C.card2, border:`1px solid ${C.border}`, color:C.muted, borderRadius:13, padding:'13px 18px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Retour
                </button>
                <button type="button" onClick={() => { if(!dateMode||!dateSel){ setErr('Veuillez sélectionner une date'); return; } setErr(''); setStep(3); }}
                  style={{ flex:1, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:13, padding:'13px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Suivant — Mes coordonnées
                </button>
              </div>
            </>
          )}

          {/* ═ ÉTAPE 3 : INFOS CLIENT ═ */}
          {step === 3 && (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[['name','Nom complet *','text'],['email','Adresse email','email'],['tel','Téléphone / WhatsApp *','tel']].map(([f,l,t]) => (
                  <div key={f}>
                    <label style={S.label}>{l}</label>
                    <input type={t} value={bf[f]} onChange={e => setBf(x => ({...x,[f]:e.target.value}))} placeholder={l.replace(' *','')}
                      style={{ ...S.input, border:`1.5px solid ${C.border}` }}/>
                  </div>
                ))}
              </div>

              {/* ── RÉCAPITULATIF COMPLET ── */}
              <div style={{ background:`${C.gold}0a`, border:`1px solid ${C.gold}33`, borderRadius:16, padding:'18px 20px' }}>
                <p style={{ fontSize:11, fontWeight:700, color:C.gold, letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>Récapitulatif de votre réservation</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:C.muted }}>Formule</span>
                    <span style={{ fontWeight:700, color:C.white }}>{pack.name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:C.muted }}>Option</span>
                    <span style={{ fontWeight:700, color:C.white }}>{option==='solo'?'Solo':'Couple'} × {qty} pers.</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:C.muted }}>Billet</span>
                    <span style={{ fontWeight:700, color:C.white }}>{billet?'Inclus':'Non inclus'}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:C.muted }}>Date de départ</span>
                    <span style={{ fontWeight:700, color:C.white }}>{dateSel}</span>
                  </div>
                  <div style={{ height:1, background:C.border, margin:'4px 0' }}/>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                    <span style={{ color:C.muted }}>Montant total</span>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, fontSize:15, color:C.white }}>{FCFA(prixBase)}</div>
                      <div style={{ fontSize:10, color:C.muted }}>≈ {Math.round(prixBase/EUR_RATE)} €</div>
                    </div>
                  </div>
                  <div style={{ background:`${C.gold}15`, border:`1px solid ${C.gold}33`, borderRadius:10, padding:'12px 14px', marginTop:4 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontWeight:700, color:C.gold, fontSize:14 }}>Acompte 30 % à payer</span>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:22, color:C.gold }}>{FCFA(acompte)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:C.muted }}>Solde restant (à 30 jours)</span>
                      <span style={{ fontWeight:700, color:C.muted }}>{FCFA(solde)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {err && <p style={{ color:C.red, fontSize:12, fontWeight:600, background:`${C.red}10`, padding:'10px 14px', borderRadius:9 }}>{err}</p>}

              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => { setStep(2); setErr(''); }}
                  style={{ background:C.card2, border:`1px solid ${C.border}`, color:C.muted, borderRadius:13, padding:'13px 18px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                  Retour
                </button>
                <button type="button" className="btn" onClick={confirm}
                  style={{ flex:1, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:13, padding:'13px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", letterSpacing:0.3 }}>
                  Confirmer — {FCFA(acompte)}
                </button>
              </div>
              <p style={{ fontSize:11, color:C.muted, textAlign:'center', lineHeight:1.6 }}>Notre équipe vous contacte sous 24h. Le solde est dû 30 jours avant votre départ.</p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── APPLICATION PRINCIPALE ───────────────────────────────────────────────────
export default function SMall() {
  // ── Data
  const [products,  setProducts]  = useState([]);
  const [cats,      setCats]      = useState([]);
  const [zones,     setZones]     = useState(DEFAULT_ZONES);
  const [banners,   setBanners]   = useState([]);
  const [reviews,   setReviews]   = useState([]);
  const [allVariants, setAllVariants] = useState({});
  const [allImages,   setAllImages]   = useState({});
  const [loading,   setLoading]   = useState(true);

  // ── UI
  const [page,    setPage]    = useState('home');
  // FIX: on utilise une ref pour la catégorie cible lors de la navigation
  const [cat,     setCat]     = useState('all');
  const [search,  setSearch]  = useState('');
  const [zone,    setZone]    = useState(null);
  const [pay,     setPay]     = useState('fedapay');
  const [modal,   setModal]   = useState(null);
  const [booking, setBooking] = useState(null);
  const [cart,    setCart]    = useState(readCart);
  const [form,    setForm]    = useState({ name:'', email:'', tel:'' });
  const [errs,    setErrs]    = useState({});
  const [proc,    setProc]    = useState(false);
  const [notif,   setNotif]   = useState(null);
  const [rvForm,  setRvForm]  = useState({ name:'', rating:5, comment:'' });
  const [rvSent,  setRvSent]  = useState(false);
  const [ctForm,  setCtForm]  = useState({ name:'', email:'', tel:'', message:'' });
  const [ctSent,  setCtSent]  = useState(false);
  const [lastRes, setLastRes] = useState(null);
  const [circuitData, setCircuitData] = useState(null);
  const [bookCircuit, setBookCircuit] = useState(null);

  // Persist cart
  useEffect(() => {
    try { localStorage.setItem('smcart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  // ── Load all data once
  const loadAll = useCallback(async () => {
    try {
      const [pd,cd,zd,bd,rd,vd,id] = await Promise.all([
        sb.from('products').select('*').eq('active',true).order('id'),
        sb.from('categories').select('*').order('position'),
        sb.from('shipping_zones').select('*').order('price'),
        sb.from('banners').select('*').eq('active',true).order('created_at',{ascending:false}),
        sb.from('reviews').select('*').eq('approved',true).order('created_at',{ascending:false}),
        sb.from('product_variants').select('*').eq('active',true),
        sb.from('product_images').select('product_id,url,position').order('position'),
      ]);
      if (pd.data) setProducts(pd.data);
      if (cd.data && cd.data.length > 0) setCats([{id:'all',label:'Tout'}, ...cd.data]);
      else setCats([{id:'all',label:'Tout'},{id:'mode',label:'Mode'},{id:'tech',label:'Électronique'},{id:'formation',label:'Formations'},{id:'circuit',label:'Circuits'},{id:'voiture',label:'Voitures'},{id:'appart',label:'Appartements'}]);
      if (zd.data && zd.data.length > 0) setZones(zd.data);
      if (bd.data) setBanners(bd.data);
      if (rd.data) setReviews(rd.data);
      if (vd.data) {
        const vm = {};
        vd.data.forEach(v => { if (!vm[v.product_id]) vm[v.product_id]=[]; vm[v.product_id].push(v); });
        setAllVariants(vm);
      }
      if (id.data) {
        const im = {};
        id.data.forEach(x => { if (!im[x.product_id]) im[x.product_id]=[]; im[x.product_id].push(x.url); });
        setAllImages(im);
      }
      // Charger config circuits
      try {
        const cc = await sb.from('circuit_config').select('*').single();
        if (cc.data) setCircuitData(cc.data);
      } catch(e) { /* table pas encore créée */ }
    } catch(e) { console.error('Load error:', e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    const ch = sb.channel('app')
      .on('postgres_changes',{event:'*',schema:'public',table:'products'},loadAll)
      .on('postgres_changes',{event:'*',schema:'public',table:'banners'},loadAll)
      .on('postgres_changes',{event:'*',schema:'public',table:'reviews'},loadAll)
      .subscribe();
    return () => sb.removeChannel(ch);
  }, [loadAll]);

  // ── Computed
  const cartN    = cart.reduce((s,i) => s+i.qty, 0);
  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const needsShip = cart.some(i => !NO_SHIP_CATS.includes(i.cat));
  const shipCost  = zone && needsShip ? (zone.free_above>0 && subtotal>=zone.free_above ? 0 : zone.price) : 0;
  const total     = subtotal + shipCost;
  const filtered  = products.filter(p => (cat==='all'||p.cat===cat) && (p.name||'').toLowerCase().includes(search.toLowerCase()));

  const notify = (msg, color=C.gold) => { setNotif({msg,color}); setTimeout(()=>setNotif(null),3500); };

  // FIX : navigation robuste — la catégorie est appliquée de façon synchrone
  const go = k => {
    setSearch('');
    setModal(null);
    setBooking(null);
    if (k==='home') {
      setPage('home');
    } else if (k==='shop') {
      setCat('all');
      setPage('shop');
    } else if (k==='formations') {
      setCat('formation');
      setPage('shop');
    } else if (k==='circuits') {
      setPage('circuits');
    } else {
      setPage(k);
    }
  };

  const goToCat = targetCat => {
    setSearch('');
    setModal(null);
    setBooking(null);
    setCat(targetCat);
    setPage('shop');
  };

  const addToCart = (p, variant) => {
    const price  = variant ? variant.price : p.price;
    const vLabel = variant ? [variant.color,variant.storage,variant.size].filter(Boolean).join(' · ') : null;
    const key    = String(p.id) + (vLabel||'');
    setCart(prev => {
      const ex = prev.find(i => i._key===key);
      if (ex) return prev.map(i => i._key===key ? {...i,qty:i.qty+1} : i);
      return [...prev, {...p, price, variantLabel:vLabel, qty:1, _key:key}];
    });
    notify(`✦ ${p.name}${vLabel?' ('+vLabel+')':''} ajouté`);
    setModal(null);
  };

  const openBook = (product, price, acompte) => {
    setModal(null);
    setBooking({ product, price, acompte });
  };

  // FIX : pays FedaPay dynamique selon la zone choisie
  const getFedaCountry = () => {
    if (!zone) return 'bj';
    return ZONE_COUNTRY[zone.name] || 'bj';
  };

  const doBook = async info => {
    const resId = RID();
    const amt   = info.acompte * info.qty;
    setBooking(null);
    await sb.from('reservations').insert({
      id:resId, client_name:info.name, client_email:info.email||'N/A', client_tel:info.tel,
      product_id:info.product.id, product_name:info.product.name, product_emoji:info.product.emoji,
      book_type:info.product.cat, date_from:info.date, persons:info.qty, total:amt, status:'En attente',
    });
    try {
      await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        to:'agencesgroup23@gmail.com',
        subject:`🔔 Réservation — ${info.product.name}`,
        html:`<div style="font-family:sans-serif;background:#0a0a0a;color:#f5f0e8;padding:24px;border-radius:12px;"><h2 style="color:#c9a84c;">🔔 Réservation S-Mall</h2><p><b>Produit:</b> ${info.product.name}</p><p><b>Client:</b> ${info.name} / ${info.tel}</p><p><b>Date:</b> ${info.date} · ${info.qty} pers.</p><p><b>Acompte:</b> ${FCFA(amt)}</p><p><b>Réf:</b> ${resId}</p></div>`
      })});
    } catch(e) { console.warn('Email notification failed:', e); }
    setProc(true);
    if (window.FedaPay) {
      window.FedaPay.init({
        public_key: FEDA_KEY,
        transaction: { amount:amt, description:`Acompte ${info.product.name}` },
        customer: { firstname:info.name.split(' ')[0], lastname:info.name.split(' ').slice(1).join(' ')||'.', email:info.email||'client@smallet.com', phone_number:{number:info.tel,country:'bj'} },
        onComplete: async r => {
          if (r.reason==='DIALOG DISMISSED') { setProc(false); notify('Paiement annulé',C.red); return; }
          await sb.from('reservations').update({status:'Acompte reçu'}).eq('id',resId);
          setProc(false);
          setLastRes({ name:info.name, product:info.product.name, acompte:amt, resId });
          setPage('resOk');
        }
      }).open();
    } else {
      setProc(false);
      setLastRes({ name:info.name, product:info.product.name, acompte:amt, resId });
      setPage('resOk');
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Requis';
    if (!form.email.includes('@')) e.email = 'Email invalide';
    if (!form.tel.trim()) e.tel = 'Requis';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const doPay = async () => {
    if (!validate()) return;
    if (needsShip && !zone) { notify('Choisissez une zone de livraison', C.red); return; }
    setProc(true);
    const snap = { cart:[...cart], subtotal, shipCost, total, zone };
    const country = getFedaCountry();
    try {
      if (window.FedaPay) {
        const oid = UID();
        window.FedaPay.init({
          public_key: FEDA_KEY,
          transaction: { amount:snap.total, description:`Commande S-Mall ${oid}` },
          customer: { firstname:form.name.split(' ')[0], lastname:form.name.split(' ').slice(1).join(' ')||'.', email:form.email, phone_number:{number:form.tel,country} },
          onComplete: async r => {
            if (r.reason==='DIALOG DISMISSED') { setProc(false); notify('Paiement annulé',C.red); return; }
            await sb.from('orders').insert({
              id:oid, client_name:form.name.trim(), client_email:form.email.trim(), client_tel:form.tel.trim(),
              items:snap.cart.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price,variant:i.variantLabel||null})),
              subtotal:snap.subtotal, shipping:snap.shipCost, total:snap.total,
              pay_method:pay, status:'Confirmé', country:snap.zone?.name||'N/A',
            });
            try {
              await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
                to:form.email.trim(),
                subject:`✦ Confirmation S-Mall — ${oid}`,
                html:`<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0a0a0a;color:#f5f0e8;padding:28px;border-radius:14px;"><h1 style="color:#c9a84c;text-align:center;">✦ S-Mall</h1><div style="background:#161616;border-radius:10px;padding:18px;margin:16px 0;text-align:center;"><h2 style="color:#c9a84c;">Commande confirmée !</h2><p style="color:#888;">Réf : <b style="color:#f5f0e8;">${oid}</b></p></div><p>Bonjour <b>${form.name}</b>,<br/>Merci pour votre commande de <b style="color:#c9a84c;">${FCFA(snap.total)}</b>.</p><p style="color:#555;font-size:12px;text-align:center;margin-top:16px;"><a href="${WA}" style="color:#c9a84c;">WhatsApp</a> · sgroupmall.vercel.app</p></div>`
              })});
            } catch(e) { console.warn('Email confirmation failed:', e); }
            setProc(false); setCart([]); setZone(null); setPage('ok');
          }
        }).open();
      } else {
        const oid = UID();
        await sb.from('orders').insert({ id:oid, client_name:form.name.trim(), client_email:form.email.trim(), client_tel:form.tel.trim(), items:snap.cart.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price,variant:i.variantLabel||null})), subtotal:snap.subtotal, shipping:snap.shipCost, total:snap.total, pay_method:pay, status:'En cours', country:snap.zone?.name||'N/A' });
        setProc(false); setCart([]); setZone(null); setPage('ok');
      }
    } catch(e) { setProc(false); notify('Erreur. Réessayez.', C.red); }
  };

  const Inp = ({ f, pl, t='text' }) => (
    <div>
      <input type={t} value={form[f]} onChange={e => setForm(x => ({...x,[f]:e.target.value}))} placeholder={pl}
        style={{ width:'100%', background:C.card2, border:`1.5px solid ${errs[f]?C.red:C.border}`, borderRadius:10, padding:'11px 14px', color:C.white, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' }}/>
      {errs[f] && <p style={{ color:C.red, fontSize:11, marginTop:3 }}>{errs[f]}</p>}
    </div>
  );

  const topBanners = banners.filter(b => !b.position || b.position==='home_top');
  const midBanners = banners.filter(b => b.position==='home_mid');
  const promos     = products.filter(p => p.orig_price);
  const news       = products.filter(p => p.badge==='Nouveau');
  const best       = products.filter(p => p.badge==='Bestseller');

  // ── RENDER
  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.white, fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>

      <Notif notif={notif}/>

      {/* MODALS */}
      <ProductModal
        product={modal}
        cats={cats}
        allVariants={allVariants}
        allImages={allImages}
        onClose={() => setModal(null)}
        onAddToCart={addToCart}
        onBook={openBook}
      />
      <BookingModal
        data={booking}
        onClose={() => setBooking(null)}
        onConfirm={doBook}
      />

      {/* NAV */}
      <nav style={{ background:'rgba(10,10,10,.97)', backdropFilter:'blur(12px)', padding:'0 28px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => go('home')}>
          <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, animation:'glow 3s ease infinite' }}>✦</div>
          <div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:18, background:`linear-gradient(90deg,${C.gold},${C.goldL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>S-Mall</span>
            <span style={{ fontSize:8, color:C.muted, display:'block', letterSpacing:3, textTransform:'uppercase' }}>Premium Store</span>
          </div>
        </div>
        <div className="hide-mob" style={{ display:'flex', gap:20, alignItems:'center' }}>
          {[['Accueil','home'],['Boutique','shop'],['Circuits','circuits'],['Formations','formations'],['Contact','contact']].map(([l,k]) => (
            <span key={k} className="lnk" style={{ fontWeight:600, fontSize:13, color:page===k||(k==='formations'&&page==='shop'&&cat==='formation')?C.gold:C.muted }} onClick={() => go(k)}>{l}</span>
          ))}
        </div>
        <button type="button" className="btn" onClick={() => setPage('cart')}
          style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:11, padding:'9px 16px', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:"'DM Sans',sans-serif" }}>
          <ShoppingCart size={15}/>
          {cartN > 0 && <span style={{ background:C.bg, color:C.gold, borderRadius:999, padding:'1px 6px', fontSize:11, fontWeight:800 }}>{cartN}</span>}
          Panier
        </button>
      </nav>

      {/* LOADING */}
      {loading && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, padding:'80px 0' }}>
          <Spin s={24}/><span style={{ color:C.muted, fontSize:15 }}>Chargement…</span>
        </div>
      )}

      {/* ═══ HOME ═══════════════════════════════════════════════════════════ */}
      {!loading && page==='home' && (
        <div>
          {/* HERO */}
          <div className="hero" style={{ position:'relative', overflow:'hidden', padding:'80px 56px 70px', background:'linear-gradient(135deg,#0a0a0a 0%,#1a1400 50%,#0a0a0a 100%)' }}>
            <div style={{ position:'absolute', top:-80, left:-60, width:380, height:380, borderRadius:'50%', background:`radial-gradient(circle,${C.gold}14 0%,transparent 70%)`, pointerEvents:'none' }}/>
            <div style={{ maxWidth:620, animation:'fadeUp .6s ease' }}>
              <p style={{ color:C.gold, fontWeight:700, letterSpacing:4, textTransform:'uppercase', fontSize:11, marginBottom:14 }}>✦ Bienvenue sur S-Mall</p>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:46, fontWeight:900, lineHeight:1.1, marginBottom:16 }}>
                Mode. Tech. Voyages.<br/>
                <span style={{ background:`linear-gradient(90deg,${C.gold},${C.goldL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Tout en un lieu.</span>
              </h1>
              <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, maxWidth:460, marginBottom:28 }}>Vêtements, électronique, formations, circuits Bénin · Togo · CIV, voitures & appartements.</p>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button type="button" className="btn" onClick={() => go('shop')} style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:13, padding:'13px 26px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:8 }}>Explorer<ArrowRight size={14}/></button>
                <button type="button" onClick={() => go('circuits')} style={{ background:'transparent', color:C.gold, border:`1.5px solid ${C.gold}`, borderRadius:13, padding:'13px 20px', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Circuits</button>
              </div>
            </div>
          </div>

          {topBanners.length > 0 && <div style={{ maxWidth:1180, margin:'0 auto', padding:'22px 28px 0' }}><BannerSlider items={topBanners}/></div>}

          {/* CATÉGORIES */}
          <div style={{ maxWidth:1180, margin:'0 auto', padding:'40px 28px' }}>
            <p style={{ color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11, textAlign:'center', marginBottom:6 }}>✦ Nos univers</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, textAlign:'center', marginBottom:8 }}>Que cherchez-vous ?</h2>
            <GL/>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:12 }}>
              {cats.filter(c => c.id!=='all').map((c,i) => (
                <div key={c.id} className="hov" onClick={() => goToCat(c.id)}
                  style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:'18px 12px', textAlign:'center', cursor:'pointer', animation:`fadeUp .35s ease ${i*.04}s both` }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:8 }}><CatIcon id={c.id}/></div>
                  <p style={{ fontWeight:700, fontSize:12, color:C.white }}>{c.label}</p>
                  <p style={{ fontSize:10, color:C.gold, marginTop:2 }}>{products.filter(p => p.cat===c.id).length} articles</p>
                </div>
              ))}
            </div>
          </div>

          {promos.length > 0 && (
            <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px 40px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}><Flame size={15} color={C.red}/><p style={{ color:C.red, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11 }}>Offres du moment</p></div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:8 }}>Promotions</h2>
              <GL/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                {promos.slice(0,4).map((p,i) => <ProductCard key={p.id} p={p} cats={cats} i={i} allImages={allImages} onOpen={setModal}/>)}
              </div>
            </div>
          )}

          {midBanners.length > 0 && <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px 40px' }}><BannerSlider items={midBanners}/></div>}

          {news.length > 0 && (
            <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px 40px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}><Sparkles size={15} color={C.green}/><p style={{ color:C.green, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11 }}>Tout juste arrivé</p></div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:8 }}>Nouveautés</h2>
              <GL/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                {news.slice(0,4).map((p,i) => <ProductCard key={p.id} p={p} cats={cats} i={i} allImages={allImages} onOpen={setModal}/>)}
              </div>
            </div>
          )}

          {best.length > 0 && (
            <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px 40px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}><TrendingUp size={15} color={C.gold}/><p style={{ color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11 }}>Les plus demandés</p></div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:8 }}>Bestsellers</h2>
              <GL/>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                {best.slice(0,4).map((p,i) => <ProductCard key={p.id} p={p} cats={cats} i={i} allImages={allImages} onOpen={setModal}/>)}
              </div>
            </div>
          )}

          {/* AVIS */}
          <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px 40px' }}>
            <p style={{ color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11, textAlign:'center', marginBottom:6 }}>⭐ Témoignages</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, textAlign:'center', marginBottom:8 }}>Ce que disent nos clients</h2>
            <GL/>
            {reviews.length === 0
              ? <div style={{ textAlign:'center', padding:'28px 0', color:C.muted }}>
                  <Star size={38} strokeWidth={1} style={{ margin:'0 auto 10px', display:'block' }} color={C.muted}/>
                  <p style={{ fontSize:14, fontWeight:600 }}>Soyez le premier à laisser un avis !</p>
                  <button type="button" onClick={() => setPage('contact')} style={{ marginTop:12, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:11, padding:'10px 20px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Laisser un avis</button>
                </div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
                  {reviews.slice(0,6).map((r,i) => (
                    <div key={r.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'18px 20px', animation:`fadeUp .35s ease ${i*.05}s both` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                        <div><p style={{ fontWeight:700, fontSize:14, color:C.white }}>{r.client_name}</p><p style={{ fontSize:10, color:C.muted }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</p></div>
                        <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:13, color:s<=r.rating?C.gold:'#333' }}>★</span>)}</div>
                      </div>
                      <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, fontStyle:'italic' }}>"{r.comment}"</p>
                    </div>
                  ))}
                </div>
            }
            <div style={{ textAlign:'center', marginTop:18 }}>
              <button type="button" onClick={() => setPage('contact')} style={{ background:'transparent', color:C.gold, border:`1.5px solid ${C.gold}`, borderRadius:11, padding:'9px 22px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>✦ Laisser un avis</button>
            </div>
          </div>

          {/* FORMATIONS BANNER */}
          <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 28px 48px' }}>
            <div style={{ background:'linear-gradient(135deg,#1c0a08,#2a1008)', border:'1px solid rgba(232,83,63,.27)', borderRadius:18, padding:'28px 36px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:18 }}>
              <div>
                <p style={{ color:'#e8533f', fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11, marginBottom:7 }}>⚡ Formations en ligne</p>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, marginBottom:5 }}>Formations & Ebooks</h3>
                <p style={{ color:C.muted, fontSize:13, maxWidth:380, lineHeight:1.6 }}>Lien d'accès envoyé automatiquement par email dès le paiement.</p>
              </div>
              <button type="button" className="btn" onClick={() => goToCat('formation')}
                style={{ background:'linear-gradient(135deg,#c0392b,#e8533f)', color:'#fff', border:'none', borderRadius:13, padding:'11px 22px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
                Voir les formations →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SHOP ════════════════════════════════════════════════════════════ */}
      {!loading && page==='shop' && (
        <div style={{ maxWidth:1180, margin:'0 auto', padding:'36px 28px', animation:'fadeUp .35s ease' }}>
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ flex:1, minWidth:180, display:'flex', alignItems:'center', background:C.card, border:`1px solid ${C.border}`, borderRadius:11, padding:'9px 14px', gap:8 }}>
              <Search size={14} color={C.gold}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                style={{ border:'none', outline:'none', background:'transparent', color:C.white, fontSize:14, width:'100%', fontFamily:"'DM Sans',sans-serif" }}/>
              {search && <button type="button" onClick={() => setSearch('')} style={{ background:'none', border:'none', color:C.muted, cursor:'pointer' }}><X size={13}/></button>}
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {cats.map(c => (
                <button key={c.id} type="button" onClick={() => setCat(c.id)}
                  style={{ padding:'7px 13px', borderRadius:999, border:`1.5px solid ${cat===c.id?C.gold:C.border}`, background:cat===c.id?`${C.gold}18`:'transparent', color:cat===c.id?C.gold:C.muted, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all .2s' }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <p style={{ color:C.muted, fontSize:12, marginBottom:16 }}>{filtered.length} article{filtered.length!==1?'s':''}</p>
          {filtered.length === 0
            ? <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}><Search size={44} strokeWidth={1} style={{ margin:'0 auto 12px', display:'block' }} color={C.muted}/><p style={{ fontSize:15, fontWeight:600 }}>Aucun résultat</p></div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
                {filtered.map((p,i) => <ProductCard key={p.id} p={p} cats={cats} i={i} allImages={allImages} onOpen={setModal}/>)}
              </div>
          }
        </div>
      )}

      {/* ═══ CART ════════════════════════════════════════════════════════════ */}
      {page==='cart' && (
        <div style={{ maxWidth:940, margin:'0 auto', padding:'36px 28px', animation:'fadeUp .35s ease' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11, marginBottom:5 }}>✦ Mon panier</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, marginBottom:18 }}>{cartN} article{cartN!==1?'s':''}</h2>
          <GL/>
          {cart.length === 0
            ? <div style={{ textAlign:'center', padding:'70px 0' }}>
                <ShoppingCart size={52} strokeWidth={1} color={C.muted} style={{ margin:'0 auto 14px', display:'block' }}/>
                <p style={{ fontWeight:700, fontSize:16, color:C.muted, marginBottom:18 }}>Votre panier est vide</p>
                <button type="button" className="btn" onClick={() => go('shop')} style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:13, padding:'12px 26px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Parcourir la boutique</button>
              </div>
            : <div className="col1" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:20, alignItems:'start' }}>
                {/* ITEMS */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {cart.map((item,idx) => (
                    <div key={item._key||idx} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:50, height:50, borderRadius:11, background:C.card2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, overflow:'hidden', border:`1px solid ${C.border}` }}>
                        {item.image_url ? <img src={item.image_url} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt=""/> : <span>{item.emoji}</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:700, fontSize:13, color:C.white, marginBottom:2 }}>{item.name}</p>
                        {item.variantLabel && <p style={{ fontSize:11, color:C.gold, marginBottom:2 }}>{item.variantLabel}</p>}
                        <p style={{ color:C.gold, fontWeight:700, fontSize:13 }}>{FCFA(item.price)}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <button type="button" onClick={() => setCart(prev => prev.map((it,i) => i===idx?{...it,qty:Math.max(1,it.qty-1)}:it))} style={{ width:26, height:26, borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.muted }}><Minus size={11}/></button>
                        <span style={{ fontWeight:800, fontSize:13, minWidth:18, textAlign:'center' }}>{item.qty}</span>
                        <button type="button" onClick={() => setCart(prev => prev.map((it,i) => i===idx?{...it,qty:it.qty+1}:it))} style={{ width:26, height:26, borderRadius:7, border:`1px solid ${C.border}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.muted }}><Plus size={11}/></button>
                      </div>
                      <div style={{ textAlign:'right', minWidth:80 }}>
                        <p style={{ fontWeight:900, fontSize:13, color:C.white, marginBottom:4 }}>{FCFA(item.price*item.qty)}</p>
                        <button type="button" onClick={() => setCart(prev => prev.filter((_,i) => i!==idx))} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontSize:11, fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:3, marginLeft:'auto' }}><Trash2 size={10}/>Retirer</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => go('shop')} style={{ background:'none', border:`1.5px solid ${C.border}`, borderRadius:11, padding:'10px', fontWeight:600, fontSize:13, color:C.muted, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}><ChevronLeft size={13}/>Continuer mes achats</button>
                </div>

                {/* RÉSUMÉ */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20, position:'sticky', top:76 }}>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:17, marginBottom:16 }}>Récapitulatif</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Sous-total</span><span style={{ fontWeight:700 }}>{FCFA(subtotal)}</span></div>

                    {needsShip && (
                      <div>
                        <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'flex', alignItems:'center', gap:5, marginBottom:7 }}><MapPin size={11}/>Zone de livraison</label>
                        <select value={zone?.id||''} onChange={e => { const z=zones.find(z=>String(z.id)===e.target.value); setZone(z||null); }}
                          style={{ width:'100%', background:C.card2, border:`1.5px solid ${zone?C.gold:C.border}`, borderRadius:9, padding:'9px 11px', color:zone?C.white:C.muted, fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none', cursor:'pointer' }}>
                          <option value="">-- Choisir votre zone --</option>
                          {zones.map(z => <option key={z.id} value={String(z.id)}>{z.name} — {z.free_above>0&&subtotal>=z.free_above?'Gratuite':FCFA(z.price)} ({z.delay})</option>)}
                        </select>
                      </div>
                    )}

                    {needsShip && (
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                        <span style={{ color:C.muted, display:'flex', alignItems:'center', gap:4 }}><Truck size={11}/>Livraison</span>
                        <span style={{ fontWeight:700, color:!zone?C.muted:shipCost===0?C.green:C.white }}>{!zone?'À choisir':shipCost===0?'Gratuite 🎉':FCFA(shipCost)}</span>
                      </div>
                    )}
                    {zone && zone.free_above>0 && subtotal<zone.free_above && (
                      <p style={{ fontSize:11, color:C.muted, background:'#1a1200', padding:'6px 9px', borderRadius:7 }}>💡 Encore {FCFA(zone.free_above-subtotal)} pour la livraison gratuite</p>
                    )}
                    {zone && <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:C.muted }}><Clock size={10}/>{zone.delay}</div>}
                    <div style={{ height:1, background:C.border }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontFamily:"'Playfair Display',serif", fontWeight:900 }}>
                      <span>Total</span><span style={{ color:C.gold }}>{FCFA(total)}</span>
                    </div>
                  </div>
                  <button type="button" className="btn" onClick={() => setPage('checkout')} disabled={needsShip&&!zone}
                    style={{ width:'100%', marginTop:14, background:(!needsShip||zone)?`linear-gradient(135deg,${C.goldD},${C.gold})`:'#2a2a2a', color:(!needsShip||zone)?C.bg:C.muted, border:'none', borderRadius:13, padding:'12px', fontWeight:700, fontSize:14, cursor:(!needsShip||zone)?'pointer':'not-allowed', fontFamily:"'DM Sans',sans-serif" }}>
                    {needsShip&&!zone ? 'Choisissez une zone' : 'Passer la commande →'}
                  </button>
                </div>
              </div>
          }
        </div>
      )}

      {/* ═══ CHECKOUT ════════════════════════════════════════════════════════ */}
      {page==='checkout' && (
        <div style={{ maxWidth:840, margin:'0 auto', padding:'36px 28px', animation:'fadeUp .35s ease' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11, marginBottom:5 }}>✦ Finaliser</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:18 }}>Paiement sécurisé</h2>
          <GL/>
          <div className="col1" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20 }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, marginBottom:14, color:C.gold }}>👤 Vos informations</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
                  <Inp f="name" pl="Nom complet"/>
                  <Inp f="email" pl="Email" t="email"/>
                  <Inp f="tel" pl="Téléphone" t="tel"/>
                </div>
              </div>
              {needsShip && zone && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <Truck size={14} color={C.gold}/>
                      <div><p style={{ fontWeight:700, fontSize:13, color:C.white }}>{zone.name}</p><p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{zone.delay}</p></div>
                    </div>
                    <span style={{ fontWeight:800, fontSize:14, color:shipCost===0?C.green:C.gold }}>{shipCost===0?'Gratuite':FCFA(shipCost)}</span>
                  </div>
                </div>
              )}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20 }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, marginBottom:14, color:C.gold }}>💳 Méthode de paiement</h3>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                  {[
                    { id:'fedapay', l:'Mobile Money', c:'#e8a020', s:'MTN · Moov · Wave · Orange', icon:<Phone size={17} strokeWidth={1.5}/> },
                    { id:'card',    l:'Carte Visa/MC', c:'#635BFF', s:'Cartes internationales',   icon:<CreditCard size={17} strokeWidth={1.5}/> },
                  ].map(m => (
                    <button key={m.id} type="button" onClick={() => setPay(m.id)}
                      style={{ border:`2px solid ${pay===m.id?m.c:C.border}`, borderRadius:11, padding:'12px 8px', background:pay===m.id?`${m.c}14`:'#111', cursor:'pointer', textAlign:'center', fontFamily:"'DM Sans',sans-serif", transition:'all .2s' }}>
                      <div style={{ marginBottom:4, display:'flex', justifyContent:'center', color:pay===m.id?m.c:'#444' }}>{m.icon}</div>
                      <div style={{ fontWeight:700, fontSize:12, color:pay===m.id?m.c:C.white }}>{m.l}</div>
                      <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{m.s}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', background:'#0a1800', borderRadius:9, border:`1px solid ${C.green}44` }}>
                  <Lock size={11} color={C.green}/>
                  <span style={{ fontSize:12, color:C.green, fontWeight:600 }}>Paiement sécurisé via FedaPay — SSL 256-bit</span>
                </div>
              </div>
            </div>

            {/* RÉSUMÉ COMMANDE */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:18, position:'sticky', top:76 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:16, marginBottom:13 }}>Votre commande</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:13, maxHeight:160, overflowY:'auto' }}>
                {cart.map((item,idx) => (
                  <div key={item._key||idx} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:C.card2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>{item.emoji}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:12, color:C.white }}>{item.name}</p>
                      {item.variantLabel && <p style={{ fontSize:10, color:C.gold }}>{item.variantLabel}</p>}
                      <p style={{ color:C.muted, fontSize:10 }}>×{item.qty}</p>
                    </div>
                    <span style={{ fontWeight:800, fontSize:11, color:C.gold, flexShrink:0 }}>{FCFA(item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{ height:1, background:C.border, marginBottom:10 }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}><span style={{ color:C.muted }}>Sous-total</span><span style={{ fontWeight:700 }}>{FCFA(subtotal)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:10 }}><span style={{ color:C.muted }}>Livraison</span><span style={{ fontWeight:700, color:shipCost===0?C.green:C.white }}>{shipCost===0?'Gratuite':FCFA(shipCost)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:16, marginBottom:14 }}><span>Total</span><span style={{ color:C.gold }}>{FCFA(total)}</span></div>
              <button type="button" className="btn" onClick={doPay} disabled={proc}
                style={{ width:'100%', background:proc?'#2a2a2a':`linear-gradient(135deg,${C.goldD},${C.gold})`, color:proc?C.muted:C.bg, border:'none', borderRadius:12, padding:'12px', fontWeight:700, fontSize:13, cursor:proc?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {proc ? <><Spin s={15}/>Traitement…</> : `Confirmer — ${FCFA(total)}`}
              </button>
              <button type="button" onClick={() => setPage('cart')} style={{ width:'100%', marginTop:8, background:'none', border:'none', color:C.muted, fontWeight:600, fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", padding:'6px', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><ChevronLeft size={12}/>Retour au panier</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SUCCESS ══════════════════════════════════════════════════════════ */}
      {page==='ok' && (
        <div style={{ maxWidth:480, margin:'60px auto', padding:'0 22px', textAlign:'center' }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, padding:'44px 36px' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${C.goldD},${C.gold})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', animation:'glow 2s ease infinite' }}>
              <CheckCircle size={34} color={C.bg} strokeWidth={2.5}/>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, marginBottom:10 }}>Commande confirmée !</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:20 }}>Merci ! Un email de confirmation vous a été envoyé.</p>
            <button type="button" className="btn" onClick={() => { setPage('home'); setForm({name:'',email:'',tel:''}); setErrs({}); }}
              style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:13, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Retour à l'accueil
            </button>
          </div>
        </div>
      )}

      {/* ═══ RÉSERVATION SUCCESS ═════════════════════════════════════════════ */}
      {page==='resOk' && (
        <div style={{ maxWidth:480, margin:'60px auto', padding:'0 22px', textAlign:'center' }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, padding:'44px 36px' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,#1a6b2e,${C.green})`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', animation:'glow 2s ease infinite' }}>
              <Calendar size={34} color="#fff" strokeWidth={2}/>
            </div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, marginBottom:10, color:C.green }}>Réservation enregistrée !</h2>
            <p style={{ color:C.muted, fontSize:14, lineHeight:1.7, marginBottom:8 }}>Votre acompte de <strong style={{ color:C.gold }}>{FCFA(lastRes?.acompte||0)}</strong> a été reçu.</p>
            <p style={{ color:C.muted, fontSize:13, lineHeight:1.7, marginBottom:20 }}>Notre équipe vous contactera via WhatsApp ou Email pour finaliser votre {lastRes?.product||'réservation'}.</p>
            <a href={`${WA}?text=Bonjour%20S-Mall%2C%20j'ai%20réservé%20${encodeURIComponent(lastRes?.product||'')}%20-%20Réf:%20${lastRes?.resId||''}`}
              target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#25d366', color:'#fff', borderRadius:13, padding:'12px', fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:"'DM Sans',sans-serif", marginBottom:12 }}>
              <MessageCircle size={17}/>Contacter via WhatsApp
            </a>
            <button type="button" onClick={() => setPage('home')} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 22px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>Retour à l'accueil</button>
          </div>
        </div>
      )}

      {/* ═══ CONTACT ══════════════════════════════════════════════════════════ */}
      {page==='contact' && (
        <div style={{ maxWidth:760, margin:'0 auto', padding:'36px 28px', animation:'fadeUp .35s ease' }}>
          <p style={{ color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:11, marginBottom:5 }}>✦ Nous contacter</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, marginBottom:8 }}>Parlons-nous</h2>
          <GL/>
          <div className="col1" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* FORMULAIRE */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:24 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:17, marginBottom:5 }}>📬 Message</h3>
              <p style={{ fontSize:13, color:C.muted, marginBottom:18 }}>Réponse sous 24h</p>
              {ctSent
                ? <div style={{ textAlign:'center', padding:'28px 0' }}>
                    <CheckCircle size={40} color={C.green} strokeWidth={1.5} style={{ margin:'0 auto 10px', display:'block' }}/>
                    <p style={{ fontWeight:700, fontSize:14, color:C.green, marginBottom:6 }}>Message envoyé !</p>
                    <button type="button" onClick={() => setCtSent(false)} style={{ background:'none', border:`1px solid ${C.border}`, color:C.muted, borderRadius:9, padding:'7px 14px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>Envoyer un autre</button>
                  </div>
                : <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                    {[['name','Votre nom *','Nom complet','text'],['email','Email','votre@email.com','email'],['tel','Téléphone','WhatsApp ou mobile','tel']].map(([f,l,p,t]) => (
                      <div key={f}>
                        <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>{l}</label>
                        <input type={t} value={ctForm[f]} onChange={e => setCtForm(cf => ({...cf,[f]:e.target.value}))} placeholder={p}
                          style={{ width:'100%', background:C.card2, border:`1.5px solid ${C.border}`, borderRadius:9, padding:'10px 13px', color:C.white, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' }}/>
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize:12, fontWeight:700, color:C.muted, display:'block', marginBottom:4 }}>Message *</label>
                      <textarea value={ctForm.message} onChange={e => setCtForm(cf => ({...cf,message:e.target.value}))} placeholder="Votre message…" rows={4}
                        style={{ width:'100%', background:C.card2, border:`1.5px solid ${C.border}`, borderRadius:9, padding:'10px 13px', color:C.white, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'none', boxSizing:'border-box' }}/>
                    </div>
                    <button type="button" className="btn" onClick={async () => {
                      if (!ctForm.name.trim()||!ctForm.message.trim()) { notify('Remplissez nom et message', C.red); return; }
                      try {
                        await sb.from('messages').insert({ from_name:ctForm.name, from_email:ctForm.email||'N/A', subject:`Contact S-Mall — ${ctForm.name}`, message:ctForm.tel?`Tél: ${ctForm.tel}\n\n${ctForm.message}`:ctForm.message });
                        setCtSent(true); setCtForm({name:'',email:'',tel:'',message:''}); notify('✦ Message envoyé !');
                      } catch(e) { notify('Erreur lors de l\'envoi. Réessayez.', C.red); }
                    }} style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:11, padding:'11px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                      <Send size={13}/>Envoyer
                    </button>
                  </div>
              }
            </div>

            {/* WHATSAPP + AVIS */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'linear-gradient(135deg,#0a1f0a,#0f2f0f)', border:'1px solid #25d36644', borderRadius:18, padding:22 }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:17, marginBottom:7, color:'#25d366' }}>💬 WhatsApp</h3>
                <p style={{ fontSize:13, color:C.muted, marginBottom:16, lineHeight:1.6 }}>Réponse instantanée tous les jours !</p>
                <a href={`${WA}?text=Bonjour%20S-Mall`} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, background:'#25d366', color:'#fff', borderRadius:13, padding:'12px', fontWeight:700, fontSize:14, textDecoration:'none', fontFamily:"'DM Sans',sans-serif" }}>
                  <MessageCircle size={17}/>Ouvrir WhatsApp
                </a>
                <p style={{ fontSize:11, color:C.muted, marginTop:9, textAlign:'center' }}>Disponible 7j/7 · Réponse rapide</p>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:22, flex:1 }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:800, fontSize:17, marginBottom:5 }}>⭐ Laisser un avis</h3>
                {rvSent
                  ? <div style={{ textAlign:'center', padding:'16px 0' }}><p style={{ fontWeight:700, color:C.green, fontSize:14 }}>Merci !</p><p style={{ color:C.muted, fontSize:12, marginTop:5 }}>Publié après validation.</p></div>
                  : <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:14 }}>
                      <input value={rvForm.name} onChange={e => setRvForm(r => ({...r,name:e.target.value}))} placeholder="Votre nom *"
                        style={{ width:'100%', background:C.card2, border:`1.5px solid ${C.border}`, borderRadius:9, padding:'9px 13px', color:C.white, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', boxSizing:'border-box' }}/>
                      <div>
                        <p style={{ fontSize:12, fontWeight:700, color:C.muted, marginBottom:5 }}>Note *</p>
                        <div style={{ display:'flex', gap:4 }}>
                          {[1,2,3,4,5].map(s => (
                            <button key={s} type="button" onClick={() => setRvForm(r => ({...r,rating:s}))}
                              style={{ fontSize:22, background:'none', border:'none', cursor:'pointer', color:s<=rvForm.rating?C.gold:'#333', transition:'transform .1s' }}
                              onMouseEnter={e => e.target.style.transform='scale(1.2)'}
                              onMouseLeave={e => e.target.style.transform='scale(1)'}>★</button>
                          ))}
                        </div>
                      </div>
                      <textarea value={rvForm.comment} onChange={e => setRvForm(r => ({...r,comment:e.target.value}))} placeholder="Commentaire *" rows={3}
                        style={{ width:'100%', background:C.card2, border:`1.5px solid ${C.border}`, borderRadius:9, padding:'9px 13px', color:C.white, fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'none', boxSizing:'border-box' }}/>
                      <button type="button" className="btn" onClick={async () => {
                        if (!rvForm.name.trim()||!rvForm.comment.trim()) { notify('Remplissez tous les champs', C.red); return; }
                        try {
                          await sb.from('reviews').insert({ client_name:rvForm.name, rating:rvForm.rating, comment:rvForm.comment, approved:false });
                          setRvSent(true); notify('✦ Avis envoyé !');
                        } catch(e) { notify('Erreur lors de l\'envoi', C.red); }
                      }} style={{ background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:10, padding:'10px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                        <Star size={12}/>Publier
                      </button>
                    </div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CIRCUITS ═══════════════════════════════════════════════════════ */}
      {page==='circuits' && (
        <CircuitsPage
          data={circuitData}
          circuits={products.filter(p => p.cat === 'circuit' && p.active !== false)}
          allImages={allImages}
          onBook={(pack) => setBookCircuit(pack)}
          onOpenProduct={(p) => setModal(p)}
        />
      )}

      {/* MODAL RÉSERVATION CIRCUIT */}
      {bookCircuit && (
        <CircuitBookModal
          pack={bookCircuit}
          onClose={() => setBookCircuit(null)}
          onConfirm={async (info) => {
            const resId = RID();
            const amt = Math.round(info.total * 0.30);
            setBookCircuit(null);
            await sb.from('reservations').insert({
              id:resId, client_name:info.name, client_email:info.email||'N/A', client_tel:info.tel,
              product_id:null, product_name:info.packName, product_emoji:'✈️',
              book_type:'circuit', date_from:info.date, persons:info.qty, total:amt, status:'En attente',
            });
            try { await fetch(EDGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:'agencesgroup23@gmail.com',subject:`🔔 Circuit — ${info.packName}`,html:`<div style="font-family:sans-serif;background:#0a0a0a;color:#f5f0e8;padding:24px;border-radius:12px;"><h2 style="color:#c9a84c;">🔔 Réservation Circuit S-Mall</h2><p><b>Pack:</b> ${info.packName}</p><p><b>Client:</b> ${info.name} / ${info.tel}</p><p><b>Date:</b> ${info.date} · ${info.qty} pers.</p><p><b>Acompte 30%:</b> ${FCFA(amt)}</p><p><b>Réf:</b> ${resId}</p></div>`})}); } catch(e) {}
            if (window.FedaPay) {
              window.FedaPay.init({
                public_key: FEDA_KEY,
                transaction: { amount:amt, description:`Acompte Circuit ${info.packName}` },
                customer: { firstname:info.name.split(' ')[0], lastname:info.name.split(' ').slice(1).join(' ')||'.', email:info.email||'client@smallet.com', phone_number:{number:info.tel,country:'bj'} },
                onComplete: async r => {
                  if (r.reason==='DIALOG DISMISSED') { notify('Paiement annulé',C.red); return; }
                  await sb.from('reservations').update({status:'Acompte reçu'}).eq('id',resId);
                  setLastRes({ name:info.name, product:info.packName, acompte:amt, resId });
                  setPage('resOk');
                }
              }).open();
            } else {
              setLastRes({ name:info.name, product:info.packName, acompte:amt, resId });
              setPage('resOk');
            }
          }}
        />
      )}

      {/* FOOTER */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'20px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, marginTop:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:6, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✦</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:14, background:`linear-gradient(90deg,${C.gold},${C.goldL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>S-Mall</span>
        </div>
        <p style={{ color:C.muted, fontSize:11 }}>Bénin · Togo · Côte d'Ivoire — Mobile Money · FedaPay</p>
        <p style={{ color:C.muted, fontSize:11 }}>© 2025 S-Mall. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
