import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Cpu, GraduationCap, Plane, Map, Car, Home, Sparkles, TrendingUp, Flame, ShoppingCart, Calendar, Search, ChevronLeft, Lock, CreditCard, CheckCircle, Truck, MessageCircle, Send, Star, Phone, ArrowRight, Minus, Plus, Trash2, Tag, X, MapPin, Clock, Eye, Percent } from 'lucide-react';
import { sb } from './supabase';
import React from 'react';

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#0a0a0a", dark:"#111111", card:"#161616", card2:"#1c1c1c",
  border:"#2a2a2a", gold:"#c9a84c", goldL:"#e8c97a", goldD:"#9a7a2e",
  white:"#f5f0e8", muted:"#888880", red:"#e05a4e", green:"#4caf7d",
  orange:"#f59e0b", blue:"#3b82f6", stripe:"#635BFF", sys:"#e8533f",
};
const fmt = n => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const pct = (o,s) => Math.round((1-s/o)*100);
const uid = () => "CMD-" + Date.now().toString(36).toUpperCase();
const rid = () => "RES-" + Date.now().toString(36).toUpperCase();
const EDGE = "https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email";
const WA = "https://wa.me/2250150512408";
const BOOKING_CATS = ["avion","circuit","voiture","appart"];
const NO_SHIPPING_CATS = ["formation","avion","circuit","voiture","appart"]; // No delivery needed
const ACOMPTE = 0.10; // 10%

const DEFAULT_CATS = [
  {id:"all",label:"Tout",icon:"all"},
  {id:"mode",label:"Mode",icon:"mode"},
  {id:"tech",label:"Électronique",icon:"tech"},
  {id:"formation",label:"Formations",icon:"formation"},
  {id:"avion",label:"Vols",icon:"avion"},
  {id:"circuit",label:"Circuits",icon:"circuit"},
  {id:"voiture",label:"Voitures",icon:"voiture"},
  {id:"appart",label:"Appartements",icon:"appart"},
];

const BADGE_C = {Nouveau:C.green, Bestseller:C.gold, Promo:C.red, Premium:"#9b59b6"};

const CatIcon = ({id, size=26}) => {
  const props = {size, strokeWidth:1.5, color:C.gold};
  switch(id) {
    case "mode": return <ShoppingBag {...props}/>;
    case "tech": return <Cpu {...props}/>;
    case "formation": return <GraduationCap {...props}/>;
    case "avion": return <Plane {...props}/>;
    case "circuit": return <Map {...props}/>;
    case "voiture": return <Car {...props}/>;
    case "appart": return <Home {...props}/>;
    default: return <Sparkles {...props}/>;
  }
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #f5f0e8; font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #9a7a2e; border-radius: 4px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes glow { 0%,100% { box-shadow: 0 0 12px #c9a84c55 } 50% { box-shadow: 0 0 28px #c9a84c99 } }
  .card-hover { transition: transform .25s, box-shadow .25s; }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(201,168,76,.15) !important; }
  .btn-t { transition: filter .15s; } .btn-t:hover { filter: brightness(1.1); }
  .nav-link { cursor: pointer; transition: color .2s; } .nav-link:hover { color: #c9a84c !important; }
  select option { background: #1c1c1c; color: #f5f0e8; }
  @media (max-width: 768px) {
    .nav-links { display: none !important; }
    .grid-cart { grid-template-columns: 1fr !important; }
    .grid-checkout { grid-template-columns: 1fr !important; }
    .grid-contact { grid-template-columns: 1fr !important; }
    .hero-section { padding: 52px 22px 44px !important; }
    .modal-pad { padding: 18px 16px !important; }
  }
`;

// ── SPINNER ───────────────────────────────────────────────────────────────────
const Spin = ({s=20}) => <span style={{display:"inline-block",width:s,height:s,border:`2.5px solid #2a2a2a`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;

// ── DIVIDER ───────────────────────────────────────────────────────────────────
const GL = () => <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 0 22px"}}/>;

// ── MINI CALENDAR ─────────────────────────────────────────────────────────────
function MiniCalendar({label, value, onChange}) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const today = new Date();
  const [view, setView] = useState({y:today.getFullYear(), m:today.getMonth()});
  const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const days = new Date(view.y, view.m+1, 0).getDate();
  const first = new Date(view.y, view.m, 1).getDay();

  useEffect(() => {
    const handler = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = d => {
    const dt = new Date(view.y, view.m, d);
    const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if(dt < now) return;
    onChange(`${String(d).padStart(2,"0")}/${String(view.m+1).padStart(2,"0")}/${view.y}`);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{position:"relative"}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${value?C.gold:C.border}`,borderRadius:10,padding:"10px 14px",color:value?C.gold:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{value||"Choisir une date"}</span>
        <Calendar size={15} color={value?C.gold:C.muted}/>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:600,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,width:250,boxShadow:"0 20px 50px rgba(0,0,0,.9)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button type="button" onClick={()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:7,padding:"3px 10px",cursor:"pointer",fontSize:14}}>‹</button>
            <span style={{fontWeight:700,fontSize:13,color:C.white}}>{MONTHS[view.m]} {view.y}</span>
            <button type="button" onClick={()=>setView(v=>v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:7,padding:"3px 10px",cursor:"pointer",fontSize:14}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:5}}>
            {["Di","Lu","Ma","Me","Je","Ve","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:C.muted,fontWeight:700,padding:"2px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {Array(first).fill(null).map((_,i)=><div key={"x"+i}/>)}
            {Array(days).fill(null).map((_,i)=>{
              const d = i+1;
              const dt = new Date(view.y, view.m, d);
              const past = dt < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const sel = value === `${String(d).padStart(2,"0")}/${String(view.m+1).padStart(2,"0")}/${view.y}`;
              return (
                <button type="button" key={d} onClick={()=>pick(d)}
                  style={{textAlign:"center",fontSize:12,padding:"5px 0",borderRadius:7,border:"none",background:sel?C.gold:past?"transparent":C.card2,color:sel?C.bg:past?C.border:C.white,cursor:past?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:sel?800:400}}>
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── IMAGE GALLERY ─────────────────────────────────────────────────────────────
function ImageGallery({productId, mainImage, emoji}) {
  const [imgs, setImgs] = useState(mainImage ? [mainImage] : []);
  const [cur, setCur] = useState(0);

  useEffect(() => {
    setCur(0);
    if(!productId) { setImgs(mainImage?[mainImage]:[]); return; }
    sb.from("product_images").select("url").eq("product_id", productId).order("position")
      .then(({data}) => {
        if(data && data.length > 0) setImgs(data.map(i=>i.url));
        else setImgs(mainImage?[mainImage]:[]);
      })
      .catch(() => setImgs(mainImage?[mainImage]:[]));
  }, [productId, mainImage]);

  const prev = () => setCur(c => c===0 ? imgs.length-1 : c-1);
  const next = () => setCur(c => c===imgs.length-1 ? 0 : c+1);

  if(imgs.length === 0) return (
    <div style={{height:260,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#161200,#201a00)",fontSize:72}}>
      {emoji||"🛍️"}
    </div>
  );

  return (
    <div style={{position:"relative",height:260,background:"#000",overflow:"hidden"}}>
      <img src={imgs[cur]} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      {imgs.length > 1 && (
        <>
          <button type="button" onClick={prev} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.65)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
          <button type="button" onClick={next} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.65)",border:"none",color:"#fff",borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>
            {imgs.map((_,i)=><button type="button" key={i} onClick={()=>setCur(i)} style={{width:i===cur?18:6,height:6,borderRadius:999,background:i===cur?C.gold:"rgba(255,255,255,.4)",border:"none",cursor:"pointer",padding:0,transition:"all .2s"}}/>)}
          </div>
          <span style={{position:"absolute",bottom:10,right:12,background:"rgba(0,0,0,.65)",color:"#fff",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:999}}>{cur+1}/{imgs.length}</span>
        </>
      )}
    </div>
  );
}

// ── VARIANT SELECTOR ─────────────────────────────────────────────────────────
function VariantSelector({product, onAddToCart, onBook}) {
  const [variants, setVariants] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selStorage, setSelStorage] = useState(null);
  const [selColor, setSelColor] = useState(null);
  const [selSize, setSelSize] = useState(null);

  useEffect(() => {
    setVariants([]); setLoaded(false);
    setSelStorage(null); setSelColor(null); setSelSize(null);
    if(!product?.id) { setLoaded(true); return; }
    sb.from("product_variants").select("*").eq("product_id", product.id).eq("active", true)
      .then(({data}) => { setVariants(data||[]); setLoaded(true); })
      .catch(() => { setVariants([]); setLoaded(true); });
  }, [product?.id]);

  useEffect(() => { setSelColor(null); }, [selStorage]);

  if(!loaded) return <div style={{display:"flex",justifyContent:"center",padding:"20px 0"}}><Spin/></div>;

  const storages = [...new Set(variants.filter(v=>v.storage).map(v=>v.storage))];
  const sizes    = [...new Set(variants.filter(v=>v.size).map(v=>v.size))];
  const colors = storages.length > 0
    ? (selStorage ? [...new Map(variants.filter(v=>v.storage===selStorage&&v.color).map(v=>[v.color,{name:v.color,hex:v.color_hex||"#888"}])).values()] : [])
    : [...new Map(variants.filter(v=>v.color).map(v=>[v.color,{name:v.color,hex:v.color_hex||"#888"}])).values()];

  const hasVariants = variants.length > 0;
  const matched = hasVariants ? variants.find(v =>
    (storages.length===0 || v.storage===selStorage) &&
    (colors.length===0 || v.color===selColor) &&
    (sizes.length===0 || v.size===selSize)
  ) || null : null;

  const basePrice = matched ? matched.price : (hasVariants ? Math.min(...variants.map(v=>v.price)) : product.price);
  const isBooking = BOOKING_CATS.includes(product.cat);
  const acompte = Math.round(basePrice * ACOMPTE);
  const canAdd = !hasVariants || !!matched;

  const needs = [
    storages.length>0 && !selStorage ? "une capacité" : null,
    (storages.length===0||selStorage) && colors.length>0 && !selColor ? "une couleur" : null,
    sizes.length>0 && !selSize ? "une taille" : null,
  ].filter(Boolean);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Capacité */}
      {storages.length > 0 && (
        <div>
          <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Capacité</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {storages.map(s => {
              const minP = Math.min(...variants.filter(v=>v.storage===s).map(v=>v.price));
              const sel = selStorage===s;
              return (
                <button type="button" key={s} onClick={()=>setSelStorage(sel?null:s)}
                  style={{padding:"7px 14px",borderRadius:10,border:`2px solid ${sel?C.gold:C.border}`,background:sel?`${C.gold}18`:C.card2,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <span style={{fontWeight:700,fontSize:13,color:sel?C.gold:C.white}}>{s}</span>
                  <span style={{fontSize:10,color:C.muted}}>{fmt(minP)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Couleurs */}
      {colors.length > 0 && (
        <div>
          <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>
            Couleur{selColor ? <span style={{color:C.white,fontWeight:400}}> — {selColor}</span> : ""}
          </p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {colors.map(col => {
              const sel = selColor===col.name;
              return (
                <button type="button" key={col.name} onClick={()=>setSelColor(sel?null:col.name)} title={col.name}
                  style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:999,border:`2px solid ${sel?C.gold:"transparent"}`,background:C.card2,cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:col.hex,border:"1px solid rgba(255,255,255,.2)",flexShrink:0}}/>
                  <span style={{fontSize:12,color:sel?C.gold:C.muted,fontWeight:600}}>{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tailles */}
      {sizes.length > 0 && (
        <div>
          <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Taille</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {sizes.map(s => {
              const sel = selSize===s;
              return (
                <button type="button" key={s} onClick={()=>setSelSize(sel?null:s)}
                  style={{width:44,height:44,borderRadius:10,border:`2px solid ${sel?C.gold:C.border}`,background:sel?`${C.gold}18`:C.card2,color:sel?C.gold:C.white,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Prix */}
      <div style={{background:C.card2,border:`1px solid ${matched||!hasVariants?C.gold:C.border}`,borderRadius:12,padding:"12px 16px",transition:"border-color .2s"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:isBooking?8:0}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:C.gold}}>{fmt(basePrice)}</span>
          {product.orig_price && <span style={{textDecoration:"line-through",color:C.muted,fontSize:13}}>{fmt(product.orig_price)}</span>}
          {matched && <span style={{fontSize:11,color:C.green,fontWeight:700,background:`${C.green}15`,padding:"2px 9px",borderRadius:999}}>✓ Sélectionné</span>}
        </div>
        {isBooking && (
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:`${C.orange}12`,border:`1px solid ${C.orange}33`,borderRadius:8}}>
            <Percent size={12} color={C.orange}/>
            <span style={{fontSize:12,color:C.orange,fontWeight:700}}>Acompte de 10% requis : {fmt(acompte)}</span>
          </div>
        )}
      </div>

      {/* Alerte sélection */}
      {hasVariants && !matched && needs.length > 0 && (
        <p style={{fontSize:12,color:C.orange,fontWeight:600,background:`${C.orange}10`,padding:"8px 12px",borderRadius:8,textAlign:"center"}}>
          Veuillez sélectionner {needs.join(" et ")}
        </p>
      )}

      {/* Boutons */}
      <div style={{display:"flex",gap:10,marginTop:4}}>
        {isBooking ? (
          <button type="button" className="btn-t" onClick={()=>canAdd&&onBook(product, basePrice, acompte)} disabled={!canAdd}
            style={{flex:1,background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:canAdd?C.bg:C.muted,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:canAdd?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
            <Calendar size={15}/>{canAdd ? `Réserver (acompte ${fmt(acompte)})` : "Sélectionner les options"}
          </button>
        ) : (
          <button type="button" className="btn-t" onClick={()=>canAdd&&onAddToCart(product, matched)} disabled={!canAdd}
            style={{flex:1,background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:canAdd?C.bg:C.muted,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:canAdd?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
            <ShoppingCart size={15}/>{canAdd ? "Ajouter au panier" : "Sélectionner les options"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── PRODUCT MODAL ─────────────────────────────────────────────────────────────
function ProductModal({product, cats, onClose, onAddToCart, onBook}) {
  const cat = cats.find(c=>c.id===product.cat);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"20px 16px",overflowY:"auto"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,width:"100%",maxWidth:660,margin:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.95)",position:"relative"}}>
        {/* Gallery */}
        <div style={{position:"relative",borderRadius:"24px 24px 0 0",overflow:"hidden"}}>
          <ImageGallery productId={product.id} mainImage={product.image_url} emoji={product.emoji}/>
          {product.orig_price && <span style={{position:"absolute",top:12,left:12,background:C.red,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:999,zIndex:5}}>-{pct(product.orig_price,product.price)}%</span>}
          {product.badge && <span style={{position:"absolute",top:12,right:46,background:BADGE_C[product.badge]||C.gold,color:product.badge==="Bestseller"?C.bg:"#fff",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:999,zIndex:5}}>{product.badge}</span>}
          <button type="button" onClick={onClose} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5}}><X size={15}/></button>
        </div>
        {/* Content */}
        <div className="modal-pad" style={{padding:"22px 26px"}}>
          {cat && <p style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>{cat.label}</p>}
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:C.white,marginBottom:8,lineHeight:1.3}}>{product.name}</h2>
          {(product.desc||product.description) && <p style={{fontSize:14,color:C.muted,lineHeight:1.8,marginBottom:14}}>{product.desc||product.description}</p>}
          <GL/>
          <VariantSelector
            product={product}
            onAddToCart={onAddToCart}
            onBook={onBook}
          />
        </div>
      </div>
    </div>
  );
}

// ── BANNER SLIDER ─────────────────────────────────────────────────────────────
function BannerSlider({items}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [items]);
  useEffect(() => {
    if(!items||items.length<=1) return;
    const t = setInterval(() => setIdx(i=>(i+1)%items.length), 5000);
    return () => clearInterval(t);
  }, [items]);
  if(!items||items.length===0) return null;
  const b = items[idx]||items[0];
  if(!b||!b.media_url) return null;
  return (
    <div style={{position:"relative",borderRadius:16,overflow:"hidden",cursor:b.link_url?"pointer":"default"}} onClick={()=>b.link_url&&window.open(b.link_url,"_blank")}>
      {b.media_type==="video"
        ? <video src={b.media_url} autoPlay muted loop playsInline style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
        : <img src={b.media_url} alt={b.title||""} style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
      }
      {b.title && (
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.75))",padding:"20px 16px 12px"}}>
          <p style={{color:"#fff",fontWeight:700,fontSize:15}}>{b.title}</p>
        </div>
      )}
      {items.length > 1 && (
        <div style={{position:"absolute",bottom:10,right:12,display:"flex",gap:5}}>
          {items.map((_,i)=>(
            <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}}
              style={{width:i===idx?18:6,height:6,borderRadius:999,background:i===idx?C.gold:"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s"}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PRODUCT CARD ──────────────────────────────────────────────────────────────
function ProductCard({p, cats, i, onOpen, onAddToCart, onBook}) {
  const isBooking = BOOKING_CATS.includes(p.cat);
  return (
    <div className="card-hover" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden",animation:`fadeUp .3s ease ${Math.min(i,.15)*0.04}s both`}}>
      <div onClick={()=>onOpen(p)} style={{height:150,position:"relative",overflow:"hidden",cursor:"pointer",background:"linear-gradient(135deg,#161200,#201a00)"}}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:52}}>{p.emoji}</div>
        }
        {p.badge && <span style={{position:"absolute",top:8,right:8,background:BADGE_C[p.badge]||C.gold,color:p.badge==="Bestseller"?C.bg:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,textTransform:"uppercase"}}>{p.badge}</span>}
        {p.orig_price && <span style={{position:"absolute",top:8,left:8,background:C.red,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999}}>-{pct(p.orig_price,p.price)}%</span>}
        {isBooking && <span style={{position:"absolute",bottom:8,left:8,background:`${C.orange}dd`,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,display:"flex",alignItems:"center",gap:4}}><Percent size={8}/>Acompte 10%</span>}
      </div>
      <div style={{padding:"14px 16px"}}>
        <p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:3,cursor:"pointer",lineHeight:1.3}} onClick={()=>onOpen(p)}>{p.name}</p>
        <p style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.5}}>{(p.desc||p.description||"").slice(0,60)}{(p.desc||p.description||"").length>60?"…":""}</p>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:900,color:C.gold,marginBottom:10}}>{fmt(p.price)}</p>
        <div style={{display:"flex",gap:7}}>
          <button type="button" onClick={()=>onOpen(p)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"7px",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <Eye size={11}/>Détail
          </button>
          {isBooking
            ? <button type="button" className="btn-t" onClick={()=>onOpen(p)} style={{flex:1,background:`${C.blue}20`,border:`1.5px solid ${C.blue}`,color:C.blue,borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Calendar size={11}/>Réserver</button>
            : <button type="button" className="btn-t" onClick={()=>onAddToCart(p,null)} style={{flex:1,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ShoppingCart size={11}/>Ajouter</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── BOOKING CONFIRMATION MODAL ────────────────────────────────────────────────
function BookConfirmModal({product, basePrice, acompte, onClose, onConfirm}) {
  const [form, setForm] = useState({name:"",email:"",tel:"",date:""});
  const [persons, setPersons] = useState(1);
  const [err, setErr] = useState("");

  const confirm = () => {
    if(!form.name.trim()) { setErr("Votre nom est requis"); return; }
    if(!form.tel.trim()) { setErr("Votre téléphone est requis"); return; }
    if(!form.date) { setErr("Choisissez une date"); return; }
    setErr("");
    onConfirm({...form, persons, acompte, totalFull: basePrice*persons, product});
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:28,width:"100%",maxWidth:460,boxShadow:"0 24px 60px rgba(0,0,0,.9)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:C.gold}}>{product.name}</h3>
            <p style={{fontSize:12,color:C.muted,marginTop:3}}>Réservation avec acompte de 10%</p>
          </div>
          <button type="button" onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={13}/></button>
        </div>
        <GL/>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[["name","Votre nom *","text"],["email","Email","email"],["tel","Téléphone / WhatsApp *","tel"]].map(([f,l,t])=>(
            <div key={f}>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>{l}</label>
              <input type={t} value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} placeholder={l.replace(" *","")}
                style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          <MiniCalendar label="Date souhaitée *" value={form.date} onChange={v=>setForm(x=>({...x,date:v}))}/>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:6}}>Nombre de personnes</label>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button type="button" onClick={()=>setPersons(p=>Math.max(1,p-1))} style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={13}/></button>
              <span style={{fontWeight:800,fontSize:18,minWidth:20,textAlign:"center"}}>{persons}</span>
              <button type="button" onClick={()=>setPersons(p=>p+1)} style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={13}/></button>
            </div>
          </div>
          {err && <p style={{color:C.red,fontSize:12,fontWeight:600}}>⚠ {err}</p>}
          <div style={{background:`${C.orange}12`,border:`1px solid ${C.orange}33`,borderRadius:12,padding:"12px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:C.muted}}>Montant total</span><span style={{fontWeight:700}}>{fmt(basePrice*persons)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:15}}><span style={{color:C.orange,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><Percent size={13}/>Acompte à payer (10%)</span><span style={{fontWeight:900,color:C.orange}}>{fmt(acompte*persons)}</span></div>
          </div>
          <button type="button" className="btn-t" onClick={confirm}
            style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Calendar size={15}/>Confirmer et payer {fmt(acompte*persons)}
          </button>
          <p style={{fontSize:11,color:C.muted,textAlign:"center"}}>Le solde restant ({fmt((basePrice-acompte)*persons)}) sera réglé ultérieurement via WhatsApp / Email</p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function SMallClient() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState(DEFAULT_CATS);
  const [zones, setZones] = useState([]);
  const [banners, setBanners] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState("home");
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [zone, setZone] = useState(null);
  const [payMethod, setPayMethod] = useState("fedapay");

  const [openProd, setOpenProd] = useState(null);   // product detail modal
  const [bookData, setBookData] = useState(null);    // {product, basePrice, acompte}

  const [form, setForm] = useState({name:"",email:"",tel:""});
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [notif, setNotif] = useState(null);
  const [reviewForm, setReviewForm] = useState({name:"",email:"",rating:5,comment:""});
  const [reviewSent, setReviewSent] = useState(false);
  const [contactForm, setContactForm] = useState({name:"",email:"",tel:"",message:""});
  const [contactSent, setContactSent] = useState(false);

  // ── DATA LOADING ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const {data} = await sb.from("products").select("*").eq("active",true).order("id");
      setProducts(data||[]); setLoading(false);
    };
    load();
    const ch = sb.channel("p-live").on("postgres_changes",{event:"*",schema:"public",table:"products"},load).subscribe();
    return () => sb.removeChannel(ch);
  }, []);

  useEffect(() => {
    const load = () => sb.from("categories").select("*").order("position").then(({data}) => {
      if(data&&data.length>0) setCats([{id:"all",label:"Tout",icon:"all"},...data]);
    });
    load();
    const ch = sb.channel("c-live").on("postgres_changes",{event:"*",schema:"public",table:"categories"},load).subscribe();
    return () => sb.removeChannel(ch);
  }, []);

  useEffect(() => {
    sb.from("shipping_zones").select("*").order("price").then(({data}) => {
      setZones(data&&data.length>0 ? data : [
        {id:1,name:"Cotonou",price:1500,free_above:50000,delay:"24-48h"},
        {id:2,name:"Bénin (hors Cotonou)",price:3000,free_above:100000,delay:"2-4 jours"},
        {id:3,name:"Togo",price:5000,free_above:150000,delay:"3-5 jours"},
        {id:4,name:"Côte d'Ivoire",price:7500,free_above:200000,delay:"4-6 jours"},
        {id:5,name:"International",price:25000,free_above:500000,delay:"7-14 jours"},
      ]);
    });
  }, []);

  useEffect(() => {
    const load = () => sb.from("banners").select("*").eq("active",true).order("created_at",{ascending:false}).then(({data})=>setBanners(data||[]));
    load();
    const ch = sb.channel("b-live").on("postgres_changes",{event:"*",schema:"public",table:"banners"},load).subscribe();
    return () => sb.removeChannel(ch);
  }, []);

  useEffect(() => {
    const load = () => sb.from("reviews").select("*").eq("approved",true).order("created_at",{ascending:false}).then(({data})=>setReviews(data||[]));
    load();
    const ch = sb.channel("r-live").on("postgres_changes",{event:"*",schema:"public",table:"reviews"},load).subscribe();
    return () => sb.removeChannel(ch);
  }, []);

  // ── CART LOGIC ──────────────────────────────────────────────────────────────
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shippableTotal = cart.filter(i=>!NO_SHIPPING_CATS.includes(i.cat)).reduce((s,i)=>s+i.price*i.qty,0);
  const shipCost = zone && shippableTotal>0 ? (zone.free_above>0&&shippableTotal>=zone.free_above ? 0 : zone.price) : 0;
  const hasShipping = cart.some(i=>!NO_SHIPPING_CATS.includes(i.cat));
  const grandTotal = subtotal + shipCost;
  const hasBookingInCart = cart.some(i=>i.isBooking);
  const hasShopInCart = cart.some(i=>!i.isBooking);
  const hasFormation = cart.some(i=>i.cat==="formation");

  const notify = (msg, color=C.gold) => {
    setNotif({msg,color});
    setTimeout(() => setNotif(null), 3500);
  };

  const addToCart = (p, variant=null) => {
    const price = variant ? variant.price : p.price;
    const vLabel = variant ? [variant.color,variant.storage,variant.size].filter(Boolean).join(" · ") : null;
    const key = String(p.id)+(vLabel||"");
    setCart(prev => {
      const ex = prev.find(i=>i._key===key);
      if(ex) return prev.map(i=>i._key===key?{...i,qty:i.qty+1}:i);
      return [...prev, {...p, price, variantLabel:vLabel, qty:1, _key:key, isBooking:false}];
    });
    notify(`✦ ${p.name}${vLabel?` (${vLabel})`:""} ajouté`);
    setOpenProd(null);
  };

  const handleBook = (product, basePrice, acompte) => {
    setOpenProd(null);
    setBookData({product, basePrice, acompte});
  };

  const confirmBooking = async (info) => {
    setBookData(null);
    const resId = rid();
    const totalAcompte = info.acompte * info.persons;
    // Save reservation
    await sb.from("reservations").insert({
      id: resId,
      client_name: info.name,
      client_email: info.email||"Non renseigné",
      client_tel: info.tel,
      product_id: info.product.id,
      product_name: info.product.name,
      product_emoji: info.product.emoji,
      book_type: info.product.book_type||info.product.cat,
      date_from: info.date,
      persons: info.persons,
      total: totalAcompte,
      status: "En attente",
    });
    // Send WhatsApp notification link + email
    const msg = `🔔 Nouvelle réservation S-Mall!\n\n📦 ${info.product.name}\n👤 ${info.name}\n📞 ${info.tel}\n📅 ${info.date}\n👥 ${info.persons} pers.\n💰 Acompte: ${fmt(totalAcompte)}\nRéf: ${resId}`;
    try {
      await fetch(EDGE, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        to:"agencesgroup23@gmail.com",
        subject:`🔔 Réservation S-Mall — ${info.product.name}`,
        html:`<div style="font-family:sans-serif;padding:20px;background:#0a0a0a;color:#f5f0e8;border-radius:12px;"><h2 style="color:#c9a84c;">🔔 Nouvelle Réservation</h2><p><b>Produit:</b> ${info.product.name}</p><p><b>Client:</b> ${info.name}</p><p><b>Téléphone:</b> ${info.tel}</p><p><b>Email:</b> ${info.email||"N/A"}</p><p><b>Date:</b> ${info.date}</p><p><b>Personnes:</b> ${info.persons}</p><p><b>Acompte payé (10%):</b> ${fmt(totalAcompte)}</p><p><b>Total complet:</b> ${fmt(info.totalFull)}</p><p><b>Réf:</b> ${resId}</p></div>`
      })});
    } catch(e) {}
    // Launch FedaPay for acompte
    setProcessing(true);
    if(window.FedaPay) {
      window.FedaPay.init({
        public_key: "pk_live_EzI5k531w-Iu-LUAu4I2sluv",
        transaction: {amount:totalAcompte, description:`Acompte réservation ${info.product.name} — ${resId}`},
        customer: {firstname:info.name.split(" ")[0], lastname:info.name.split(" ").slice(1).join(" ")||".", email:info.email||"client@smallet.com", phone_number:{number:info.tel,country:"bj"}},
        onComplete: async(resp) => {
          if(resp.reason==="DIALOG DISMISSED"){setProcessing(false);notify("Paiement annulé",C.red);return;}
          await sb.from("reservations").update({status:"Acompte reçu"}).eq("id",resId);
          setProcessing(false);
          setPage("resSuccess");
          window._lastRes = {name:info.name, product:info.product.name, acompte:totalAcompte, resId};
        }
      }).open();
    } else {
      setProcessing(false);
      notify("✦ Réservation enregistrée ! Nous vous contactons sous peu.",C.green);
      setPage("resSuccess");
      window._lastRes = {name:info.name, product:info.product.name, acompte:totalAcompte, resId};
    }
  };

  const removeItem = idx => setCart(prev=>prev.filter((_,i)=>i!==idx));
  const updateQty = (idx,d) => setCart(prev=>prev.map((it,i)=>i===idx?{...it,qty:Math.max(1,it.qty+d)}:it));
  const filtered = products.filter(p=>(cat==="all"||p.cat===cat)&&(p.name||"").toLowerCase().includes(search.toLowerCase()));

  const nav = (k) => {
    setSearch("");
    if(k==="home") setPage("home");
    else if(k==="shop") { setCat("all"); setPage("shop"); }
    else if(k==="voyages") { setCat("avion"); setPage("shop"); }
    else if(k==="formations") { setCat("formation"); setPage("shop"); }
    else if(k==="contact") setPage("contact");
  };

  const validate = () => {
    const e = {};
    if(!form.name.trim()) e.name = "Requis";
    if(!form.email.includes("@")) e.email = "Email invalide";
    if(!form.tel.trim()) e.tel = "Requis";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handlePay = async () => {
    if(!validate()) return;
    const needsShipping = cart.some(i=>!NO_SHIPPING_CATS.includes(i.cat));
    if(needsShipping && !zone) { notify("Choisissez une zone de livraison",C.red); return; }
    setProcessing(true);
    try {
      const orderId = uid();
      const safeName = form.name.trim();
      const safeEmail = form.email.toLowerCase().trim();
      const safeTel = form.tel.trim();
      await sb.from("orders").insert({
        id: orderId, client_name:safeName, client_email:safeEmail, client_tel:safeTel,
        items: cart.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price,variant:i.variantLabel||null})),
        subtotal, shipping:shipCost, total:grandTotal,
        pay_method: payMethod, status:"En cours",
        country: zone?.name||"N/A",
      });
      // Email
      try {
        await fetch(EDGE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          to:safeEmail, subject:`✦ Confirmation S-Mall — ${orderId}`,
          html:(()=>{
        const downloads = cart.filter(i=>i.download_url);
        const dlSection = downloads.length>0 ? downloads.map(i=>`<div style="background:#0a1a0a;border:1px solid #4caf7d44;border-radius:10px;padding:14px;margin:10px 0;"><p style="color:#4caf7d;font-weight:bold;margin-bottom:6px;">📥 ${i.name}</p><a href="${i.download_url}" style="color:#c9a84c;word-break:break-all;font-size:13px;">${i.download_url}</a></div>`).join("") : "";
        return `<div style="font-family:sans-serif;max-width:540px;margin:auto;background:#0a0a0a;color:#f5f0e8;padding:28px;border-radius:14px;"><h1 style="color:#c9a84c;text-align:center;">✦ S-Mall</h1><div style="background:#161616;border-radius:10px;padding:20px;margin:18px 0;text-align:center;"><h2 style="color:#c9a84c;">Commande confirmée !</h2><p style="color:#888;">Réf : <b style="color:#f5f0e8;">${orderId}</b></p></div><p>Bonjour <b>${safeName}</b>,<br/>Merci pour votre commande de <b style="color:#c9a84c;">${fmt(grandTotal)}</b>.</p>${dlSection}${downloads.length>0?'<p style="color:#4caf7d;font-size:13px;margin-top:10px;">⬆️ Vos liens de téléchargement sont ci-dessus.</p>':''}<p style="color:#555;font-size:12px;text-align:center;margin-top:18px;"><a href="${WA}" style="color:#c9a84c;">WhatsApp</a> · sgroupmall.vercel.app</p></div>`;
      })()
        })});
      } catch(e) {}
      if(payMethod==="fedapay"&&window.FedaPay) {
        window.FedaPay.init({
          public_key:"pk_live_EzI5k531w-Iu-LUAu4I2sluv",
          transaction:{amount:grandTotal,description:`Commande S-Mall ${orderId}`},
          customer:{firstname:safeName.split(" ")[0],lastname:safeName.split(" ").slice(1).join(" ")||".",email:safeEmail,phone_number:{number:safeTel,country:"bj"}},
          onComplete:async(resp)=>{
            if(resp.reason==="DIALOG DISMISSED"){setProcessing(false);notify("Paiement annulé",C.red);return;}
            await sb.from("orders").update({status:"Confirmé"}).eq("id",orderId);
            setProcessing(false);setPage("success");setCart([]);setZone(null);
          }
        }).open();
      } else {
        setProcessing(false);setPage("success");setCart([]);setZone(null);
      }
    } catch(err) { setProcessing(false);notify("Erreur. Réessayez.",C.red); }
  };

  const submitReview = async () => {
    if(!reviewForm.name.trim()||!reviewForm.comment.trim()){notify("Remplis tous les champs",C.red);return;}
    await sb.from("reviews").insert({client_name:reviewForm.name,client_email:reviewForm.email,rating:reviewForm.rating,comment:reviewForm.comment,approved:false});
    setReviewSent(true);notify("✦ Avis envoyé — merci !");
  };

  const submitContact = async () => {
    if(!contactForm.name.trim()||!contactForm.message.trim()){notify("Remplis nom et message",C.red);return;}
    await sb.from("messages").insert({
      from_name:contactForm.name, from_email:contactForm.email||"N/A",
      subject:`Contact S-Mall — ${contactForm.name}`,
      message:contactForm.tel?`Tél: ${contactForm.tel}\n\n${contactForm.message}`:contactForm.message,
    });
    setContactSent(true);notify("✦ Message envoyé !");
  };

  const Inp = ({field,placeholder,type="text"}) => (
    <div>
      <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${errors[field]?C.red:C.border}`,borderRadius:10,padding:"11px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
      {errors[field]&&<p style={{color:C.red,fontSize:11,marginTop:3}}>{errors[field]}</p>}
    </div>
  );

  const homeBanners = banners.filter(b=>b.position==="home_top"||!b.position);
  const midBanners  = banners.filter(b=>b.position==="home_mid");
  const promos = products.filter(p=>p.orig_price);
  const nouveautes = products.filter(p=>p.badge==="Nouveau");
  const bestsellers = products.filter(p=>p.badge==="Bestseller");

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.white,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>

      {/* NOTIFICATION */}
      {notif && (
        <div style={{position:"fixed",top:16,right:16,zIndex:9999,background:C.card,border:`1px solid ${notif.color}`,color:notif.color,padding:"11px 18px",borderRadius:12,fontWeight:700,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,.6)",animation:"fadeUp .3s ease",maxWidth:280,pointerEvents:"none"}}>
          {notif.msg}
        </div>
      )}

      {/* PRODUCT MODAL */}
      {openProd && openProd.id && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflowY:"auto"}} onClick={()=>setOpenProd(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,width:"100%",maxWidth:640,margin:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.95)"}}>
            <div style={{position:"relative",borderRadius:"22px 22px 0 0",overflow:"hidden"}}>
              <ImageGallery productId={openProd.id} mainImage={openProd.image_url} emoji={openProd.emoji}/>
              {openProd.orig_price&&<span style={{position:"absolute",top:10,left:10,background:C.red,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:999,zIndex:5}}>-{pct(openProd.orig_price,openProd.price)}%</span>}
              {openProd.badge&&<span style={{position:"absolute",top:10,right:44,background:BADGE_C[openProd.badge]||C.gold,color:openProd.badge==="Bestseller"?C.bg:"#fff",fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:999,zIndex:5}}>{openProd.badge}</span>}
              <button type="button" onClick={()=>setOpenProd(null)} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5,fontSize:18}}>×</button>
            </div>
            <div style={{padding:"20px 24px"}}>
              <p style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:5}}>{cats.find(c=>c.id===openProd.cat)?.label||""}</p>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:900,color:C.white,marginBottom:8,lineHeight:1.3}}>{openProd.name}</h2>
              {(openProd.desc||openProd.description)&&<p style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:12}}>{openProd.desc||openProd.description}</p>}
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,marginBottom:16}}/>
              <VariantSelector product={openProd} onAddToCart={(p,v)=>{addToCart(p,v);setOpenProd(null);}} onBook={handleBook}/>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING CONFIRM MODAL */}
      {bookData && (
        <BookConfirmModal
          product={bookData.product}
          basePrice={bookData.basePrice}
          acompte={bookData.acompte}
          onClose={()=>setBookData(null)}
          onConfirm={confirmBooking}
        />
      )}

      {/* NAV */}
      <nav style={{background:"rgba(10,10,10,.97)",backdropFilter:"blur(12px)",padding:"0 28px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>nav("home")}>
          <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,animation:"glow 3s ease infinite"}}>✦</div>
          <div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
            <span style={{fontSize:8,color:C.muted,display:"block",letterSpacing:3,textTransform:"uppercase"}}>Premium Store</span>
          </div>
        </div>
        <div className="nav-links" style={{display:"flex",gap:20,alignItems:"center"}}>
          {[["Accueil","home"],["Boutique","shop"],["Voyages","voyages"],["Formations","formations"],["Contact","contact"]].map(([l,k])=>(
            <span key={k} className="nav-link" style={{fontWeight:600,fontSize:13,color:page===k?C.gold:C.muted}} onClick={()=>nav(k)}>{l}</span>
          ))}
        </div>
        <button type="button" className="btn-t" onClick={()=>setPage("cart")}
          style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"'DM Sans',sans-serif"}}>
          <ShoppingCart size={15}/>
          {cartCount>0&&<span style={{background:C.bg,color:C.gold,borderRadius:999,padding:"1px 6px",fontSize:11,fontWeight:800}}>{cartCount}</span>}
          Panier
        </button>
      </nav>

      {/* LOADING */}
      {loading && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"80px 0"}}>
          <Spin s={24}/><span style={{color:C.muted,fontSize:15}}>Chargement…</span>
        </div>
      )}

      {/* ── HOME ─────────────────────────────────────────────────────────────── */}
      {!loading && page==="home" && (
        <div>
          {/* Hero */}
          <div className="hero-section" style={{position:"relative",overflow:"hidden",padding:"80px 56px 70px",background:"linear-gradient(135deg,#0a0a0a 0%,#1a1400 50%,#0a0a0a 100%)"}}>
            <div style={{position:"absolute",top:-80,left:-60,width:380,height:380,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{maxWidth:620,animation:"fadeUp .6s ease"}}>
              <p style={{color:C.gold,fontWeight:700,letterSpacing:4,textTransform:"uppercase",fontSize:11,marginBottom:14}}>✦ Bienvenue sur S-Mall</p>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:46,fontWeight:900,lineHeight:1.1,marginBottom:16}}>Mode. Tech. Voyages.<br/><span style={{background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tout en un lieu.</span></h1>
              <p style={{color:C.muted,fontSize:15,lineHeight:1.7,maxWidth:460,marginBottom:28}}>Vêtements, électronique, formations, vols, circuits Bénin · Togo · CIV, voitures & appartements.</p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <button type="button" className="btn-t" onClick={()=>nav("shop")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"13px 26px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>Explorer<ArrowRight size={14}/></button>
                <button type="button" onClick={()=>{setCat("circuit");setPage("shop");}} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:13,padding:"13px 20px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Circuits</button>
                <button type="button" onClick={()=>{setCat("avion");setPage("shop");}} style={{background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,borderRadius:13,padding:"13px 20px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Vols</button>
              </div>
            </div>
          </div>

          {/* Banner Top */}
          {homeBanners.length>0 && <div style={{maxWidth:1180,margin:"0 auto",padding:"22px 28px 0"}}><BannerSlider items={homeBanners}/></div>}

          {/* Categories */}
          <div style={{maxWidth:1180,margin:"0 auto",padding:"40px 28px"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:6}}>✦ Nos univers</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,textAlign:"center",marginBottom:8}}>Que cherchez-vous ?</h2>
            <GL/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
              {cats.filter(c=>c.id!=="all").map((c,i) => (
                <div key={c.id} className="card-hover" onClick={()=>{setCat(c.id);setPage("shop");}}
                  style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 12px",textAlign:"center",cursor:"pointer",animation:`fadeUp .35s ease ${i*.04}s both`}}>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><CatIcon id={c.id} size={26}/></div>
                  <p style={{fontWeight:700,fontSize:12,color:C.white}}>{c.label}</p>
                  <p style={{fontSize:10,color:C.gold,marginTop:2}}>{products.filter(p=>p.cat===c.id).length} articles</p>
                </div>
              ))}
            </div>
          </div>

          {/* Promos */}
          {promos.length>0 && (
            <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><Flame size={15} color={C.red}/><p style={{color:C.red,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Offres du moment</p></div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Promotions</h2>
              <GL/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
                {promos.slice(0,4).map((p,i)=><ProductCard key={p.id} p={p} cats={cats} i={i} onOpen={setOpenProd} onAddToCart={addToCart} onBook={handleBook}/>)}
              </div>
            </div>
          )}

          {/* Banner Mid */}
          {midBanners.length>0 && <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}><BannerSlider items={midBanners}/></div>}

          {/* Nouveautés */}
          {nouveautes.length>0 && (
            <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><Sparkles size={15} color={C.green}/><p style={{color:C.green,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Tout juste arrivé</p></div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Nouveautés</h2>
              <GL/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
                {nouveautes.slice(0,4).map((p,i)=><ProductCard key={p.id} p={p} cats={cats} i={i} onOpen={setOpenProd} onAddToCart={addToCart} onBook={handleBook}/>)}
              </div>
            </div>
          )}

          {/* Bestsellers */}
          {bestsellers.length>0 && (
            <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><TrendingUp size={15} color={C.gold}/><p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Les plus demandés</p></div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Bestsellers</h2>
              <GL/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
                {bestsellers.slice(0,4).map((p,i)=><ProductCard key={p.id} p={p} cats={cats} i={i} onOpen={setOpenProd} onAddToCart={addToCart} onBook={handleBook}/>)}
              </div>
            </div>
          )}

          {/* Avis */}
          <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:6}}>⭐ Témoignages</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,textAlign:"center",marginBottom:8}}>Ce que disent nos clients</h2>
            <GL/>
            {reviews.length===0 ? (
              <div style={{textAlign:"center",padding:"28px 0",color:C.muted}}>
                <Star size={38} strokeWidth={1} style={{margin:"0 auto 10px",display:"block"}} color={C.muted}/>
                <p style={{fontSize:14,fontWeight:600}}>Soyez le premier à laisser un avis !</p>
                <button type="button" onClick={()=>setPage("contact")} style={{marginTop:12,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Laisser un avis</button>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
                {reviews.slice(0,6).map((r,i)=>(
                  <div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",animation:`fadeUp .35s ease ${i*.05}s both`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <div><p style={{fontWeight:700,fontSize:14,color:C.white}}>{r.client_name}</p><p style={{fontSize:10,color:C.muted}}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p></div>
                      <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:13,color:s<=r.rating?C.gold:"#333"}}>★</span>)}</div>
                    </div>
                    <p style={{fontSize:13,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{textAlign:"center",marginTop:18}}>
              <button type="button" onClick={()=>setPage("contact")} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:11,padding:"9px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✦ Laisser un avis</button>
            </div>
          </div>

          {/* Formations banner */}
          <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 48px"}}>
            <div style={{background:"linear-gradient(135deg,#1c0a08,#2a1008)",border:`1px solid ${C.sys}44`,borderRadius:18,padding:"28px 36px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:18}}>
              <div>
                <p style={{color:C.sys,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:7}}>⚡ Formations en ligne</p>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,marginBottom:5}}>Formations & Ebooks</h3>
                <p style={{color:C.muted,fontSize:13,maxWidth:380,lineHeight:1.6}}>Accès automatique envoyé par email dès le paiement.</p>
              </div>
              <button type="button" className="btn-t" onClick={()=>{setCat("formation");setPage("shop");}} style={{background:`linear-gradient(135deg,#c0392b,${C.sys})`,color:"#fff",border:"none",borderRadius:13,padding:"11px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Voir les formations →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHOP ─────────────────────────────────────────────────────────────── */}
      {!loading && page==="shop" && (
        <div style={{maxWidth:1180,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 14px",gap:8}}>
              <Search size={14} color={C.gold}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
              {search && <button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}><X size={13}/></button>}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {cats.map(c=>(
                <button type="button" key={c.id} onClick={()=>setCat(c.id)} style={{padding:"7px 13px",borderRadius:999,border:`1.5px solid ${cat===c.id?C.gold:C.border}`,background:cat===c.id?`${C.gold}18`:"transparent",color:cat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>{c.label}</button>
              ))}
            </div>
          </div>
          <p style={{color:C.muted,fontSize:12,marginBottom:16}}>{filtered.length} article{filtered.length!==1?"s":""}</p>
          {filtered.length===0
            ? <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}><Search size={44} strokeWidth={1} style={{margin:"0 auto 12px",display:"block"}} color={C.muted}/><p style={{fontSize:15,fontWeight:600}}>Aucun résultat</p></div>
            : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>{filtered.map((p,i)=><ProductCard key={p.id} p={p} cats={cats} i={i} onOpen={setOpenProd} onAddToCart={addToCart} onBook={handleBook}/>)}</div>
          }
        </div>
      )}

      {/* ── CART ─────────────────────────────────────────────────────────────── */}
      {page==="cart" && (
        <div style={{maxWidth:940,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:5}}>✦ Mon panier</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:18}}>{cartCount} article{cartCount!==1?"s":""}</h2>
          <GL/>
          {cart.length===0 ? (
            <div style={{textAlign:"center",padding:"70px 0"}}>
              <ShoppingCart size={52} strokeWidth={1} color={C.muted} style={{margin:"0 auto 14px",display:"block"}}/>
              <p style={{fontWeight:700,fontSize:16,color:C.muted,marginBottom:18}}>Votre panier est vide</p>
              <button type="button" className="btn-t" onClick={()=>nav("shop")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"12px 26px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Parcourir la boutique</button>
            </div>
          ) : (
            <div className="grid-cart" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
              {/* Items */}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {cart.map((item,idx)=>(
                  <div key={idx} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:50,height:50,borderRadius:11,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden",border:`1px solid ${C.border}`}}>
                      {item.image_url?<img src={item.image_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span>{item.emoji}</span>}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:700,fontSize:13,color:C.white,marginBottom:2}}>{item.name}</p>
                      {item.variantLabel&&<p style={{fontSize:11,color:C.gold,marginBottom:2}}>{item.variantLabel}</p>}
                      <p style={{color:C.gold,fontWeight:700,fontSize:13}}>{fmt(item.price)}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <button type="button" onClick={()=>updateQty(idx,-1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><Minus size={11}/></button>
                      <span style={{fontWeight:800,fontSize:13,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                      <button type="button" onClick={()=>updateQty(idx,1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><Plus size={11}/></button>
                    </div>
                    <div style={{textAlign:"right",minWidth:78}}>
                      <p style={{fontWeight:900,fontSize:13,color:C.white,marginBottom:4}}>{fmt(item.price*item.qty)}</p>
                      <button type="button" onClick={()=>removeItem(idx)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:3,marginLeft:"auto"}}><Trash2 size={10}/>Retirer</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={()=>nav("shop")} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:11,padding:"10px",fontWeight:600,fontSize:13,color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ChevronLeft size={13}/>Continuer mes achats</button>
              </div>
              {/* Summary */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20,alignSelf:"start",position:"sticky",top:76}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,marginBottom:16}}>Récapitulatif</h3>
                <div style={{display:"flex",flexDirection:"column",gap:11}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
                  {hasShipping && (
                    <>
                      <div>
                        <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"flex",alignItems:"center",gap:5,marginBottom:6}}><MapPin size={11}/>Zone de livraison</label>
                        <select value={zone?.id||""} onChange={e=>{const z=zones.find(z=>String(z.id)===e.target.value);setZone(z||null);}}
                          style={{width:"100%",background:C.card2,border:`1.5px solid ${zone?C.gold:C.border}`,borderRadius:9,padding:"9px 11px",color:zone?C.white:C.muted,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}>
                          <option value="">-- Choisir --</option>
                          {zones.map(z=><option key={z.id} value={String(z.id)}>{z.name} — {z.free_above>0&&subtotal>=z.free_above?"Gratuite":fmt(z.price)} ({z.delay})</option>)}
                        </select>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <span style={{color:C.muted,display:"flex",alignItems:"center",gap:4}}><Truck size={11}/>Livraison</span>
                        <span style={{fontWeight:700,color:!zone?C.muted:shipCost===0?C.green:C.white}}>{!zone?"À choisir":shipCost===0?"Gratuite 🎉":fmt(shipCost)}</span>
                      </div>
                      {zone&&zone.free_above>0&&subtotal<zone.free_above&&<p style={{fontSize:11,color:C.muted,background:"#1a1200",padding:"6px 9px",borderRadius:7}}>💡 Encore {fmt(zone.free_above-subtotal)} pour la livraison gratuite</p>}
                      {zone&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted}}><Clock size={10}/>{zone.delay}</div>}
                    </>
                  )}
                  <div style={{height:1,background:C.border}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:900}}><span>Total</span><span style={{color:C.gold}}>{fmt(grandTotal)}</span></div>
                </div>
                <button type="button" className="btn-t" onClick={()=>setPage("checkout")} disabled={hasShipping&&!zone}
                  style={{width:"100%",marginTop:14,background:(!hasShipping||zone)?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:(!hasShipping||zone)?C.bg:C.muted,border:"none",borderRadius:13,padding:"12px",fontWeight:700,fontSize:14,cursor:(!hasShipping||zone)?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
                  {hasShipping&&!zone?"Choisissez une zone":"Passer la commande →"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHECKOUT ─────────────────────────────────────────────────────────── */}
      {page==="checkout" && (
        <div style={{maxWidth:840,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:5}}>✦ Finaliser</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:18}}>Paiement sécurisé</h2>
          <GL/>
          <div className="grid-checkout" style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,marginBottom:14,color:C.gold}}>👤 Vos informations</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                  <Inp field="name" placeholder="Nom complet"/>
                  <Inp field="email" placeholder="Email" type="email"/>
                  <Inp field="tel" placeholder="Téléphone" type="tel"/>
                </div>
              </div>
              {hasShopInCart && zone && (
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Truck size={14} color={C.gold}/><div><p style={{fontWeight:700,fontSize:13,color:C.white}}>{zone.name}</p><p style={{fontSize:11,color:C.muted,marginTop:2}}>{zone.delay}</p></div></div>
                    <span style={{fontWeight:800,fontSize:14,color:shipCost===0?C.green:C.gold}}>{shipCost===0?"Gratuite":fmt(shipCost)}</span>
                  </div>
                </div>
              )}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,marginBottom:14,color:C.gold}}>💳 Paiement</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  {[
                    {id:"fedapay",label:"Mobile Money",color:"#e8a020",sub:"MTN · Moov · Wave · Orange",icon:<Phone size={17} strokeWidth={1.5}/>},
                    {id:"card",label:"Carte bancaire",color:C.stripe,sub:"Bientôt disponible",icon:<CreditCard size={17} strokeWidth={1.5}/>},
                  ].map(m=>(
                    <button type="button" key={m.id} onClick={()=>setPayMethod(m.id)} style={{border:`2px solid ${payMethod===m.id?m.color:C.border}`,borderRadius:11,padding:"12px 8px",background:payMethod===m.id?`${m.color}14`:C.dark,cursor:"pointer",textAlign:"center",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
                      <div style={{marginBottom:4,display:"flex",justifyContent:"center",color:payMethod===m.id?m.color:"#444"}}>{m.icon}</div>
                      <div style={{fontWeight:700,fontSize:12,color:payMethod===m.id?m.color:C.white}}>{m.label}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.sub}</div>
                    </button>
                  ))}
                </div>
                {payMethod==="fedapay" && (
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"#0a1800",borderRadius:9,border:`1px solid ${C.green}44`}}>
                    <Lock size={11} color={C.green}/><span style={{fontSize:12,color:C.green,fontWeight:600}}>Paiement sécurisé via FedaPay</span>
                  </div>
                )}
                {payMethod==="card" && (
                  <div style={{background:`${C.stripe}12`,border:`1px solid ${C.stripe}33`,borderRadius:10,padding:"12px 14px"}}>
                    <p style={{fontSize:12,color:C.stripe,fontWeight:700}}>Bientôt disponible — utilisez Mobile Money en attendant.</p>
                  </div>
                )}
              </div>
            </div>
            {/* Order summary */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18,alignSelf:"start",position:"sticky",top:76}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,marginBottom:13}}>Votre commande</h3>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:13,maxHeight:160,overflowY:"auto"}}>
                {cart.map((item,idx)=>(
                  <div key={idx} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <div style={{width:28,height:28,borderRadius:7,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{item.emoji}</div>
                    <div style={{flex:1}}><p style={{fontWeight:600,fontSize:12,color:C.white}}>{item.name}</p>{item.variantLabel&&<p style={{fontSize:10,color:C.gold}}>{item.variantLabel}</p>}<p style={{color:C.muted,fontSize:10}}>×{item.qty}</p></div>
                    <span style={{fontWeight:800,fontSize:11,color:C.gold,flexShrink:0}}>{fmt(item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{height:1,background:C.border,marginBottom:10}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:10}}><span style={{color:C.muted}}>Livraison</span><span style={{fontWeight:700,color:shipCost===0?C.green:C.white}}>{shipCost===0?"Gratuite":fmt(shipCost)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,marginBottom:14}}><span>Total</span><span style={{color:C.gold}}>{fmt(grandTotal)}</span></div>
              <button type="button" className="btn-t" onClick={handlePay} disabled={processing||payMethod==="card"}
                style={{width:"100%",background:processing||payMethod==="card"?"#2a2a2a":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:processing||payMethod==="card"?C.muted:C.bg,border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:13,cursor:processing||payMethod==="card"?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {processing?<><Spin s={15}/>Traitement…</>:payMethod==="card"?"Carte bientôt disponible":`Confirmer — ${fmt(grandTotal)}`}
              </button>
              <button type="button" onClick={()=>setPage("cart")} style={{width:"100%",marginTop:8,background:"none",border:"none",color:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"6px",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><ChevronLeft size={12}/>Retour au panier</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS ───────────────────────────────────────────────────────────── */}
      {page==="success" && (
        <div style={{maxWidth:480,margin:"60px auto",padding:"0 22px",textAlign:"center"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"44px 36px"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"glow 2s ease infinite"}}><CheckCircle size={34} color={C.bg} strokeWidth={2.5}/></div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:10}}>Commande confirmée !</h2>
            <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:20}}>Merci ! Un email de confirmation vous a été envoyé.</p>
            <div style={{background:"#0f1a0f",border:`1px solid ${C.green}44`,borderRadius:11,padding:"11px 15px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Truck size={14} color={C.green}/><p style={{fontWeight:700,fontSize:13,color:C.green}}>Livraison : {zone?.delay||"3-5 jours"}</p></div>
            <button type="button" className="btn-t" onClick={()=>{setPage("home");setForm({name:"",email:"",tel:""});setErrors({});}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retour à l'accueil</button>
          </div>
        </div>
      )}

      {/* ── RESERVATION SUCCESS ───────────────────────────────────────────────── */}
      {page==="resSuccess" && (
        <div style={{maxWidth:480,margin:"60px auto",padding:"0 22px",textAlign:"center"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"44px 36px"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,#1a6b2e,${C.green})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"glow 2s ease infinite"}}><Calendar size={34} color="#fff" strokeWidth={2}/></div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:10,color:C.green}}>Réservation enregistrée !</h2>
            <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:8}}>Votre acompte de <strong style={{color:C.gold}}>{fmt(window._lastRes?.acompte||0)}</strong> a été reçu.</p>
            <p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:20}}>Notre équipe vous contactera via WhatsApp ou Email pour finaliser votre {window._lastRes?.product||"réservation"}.</p>
            <a href={`${WA}?text=Bonjour%20S-Mall%2C%20j'ai%20réservé%20${encodeURIComponent(window._lastRes?.product||"")}%20-%20Réf:%20${window._lastRes?.resId||""}`} target="_blank" rel="noreferrer"
              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#25d366",color:"#fff",borderRadius:13,padding:"12px",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",marginBottom:12}}>
              <MessageCircle size={17}/>Contacter via WhatsApp
            </a>
            <button type="button" onClick={()=>setPage("home")} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 22px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retour à l'accueil</button>
          </div>
        </div>
      )}

      {/* ── CONTACT ───────────────────────────────────────────────────────────── */}
      {page==="contact" && (
        <div style={{maxWidth:760,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:5}}>✦ Nous contacter</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Parlons-nous</h2>
          <GL/>
          <div className="grid-contact" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,marginBottom:5}}>📬 Message</h3>
              <p style={{fontSize:13,color:C.muted,marginBottom:18}}>Réponse sous 24h</p>
              {contactSent ? (
                <div style={{textAlign:"center",padding:"28px 0"}}>
                  <CheckCircle size={40} color={C.green} strokeWidth={1.5} style={{margin:"0 auto 10px",display:"block"}}/>
                  <p style={{fontWeight:700,fontSize:14,color:C.green,marginBottom:6}}>Message envoyé !</p>
                  <button type="button" onClick={()=>setContactSent(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Envoyer un autre</button>
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:11}}>
                  {[["name","Votre nom *","Nom complet","text"],["email","Email","votre@email.com","email"],["tel","Téléphone","WhatsApp ou mobile","tel"]].map(([f,l,p,t])=>(
                    <div key={f}>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>{l}</label>
                      <input type={t} value={contactForm[f]} onChange={e=>setContactForm(cf=>({...cf,[f]:e.target.value}))} placeholder={p} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Message *</label>
                    <textarea value={contactForm.message} onChange={e=>setContactForm(cf=>({...cf,message:e.target.value}))} placeholder="Votre message…" rows={4} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                  </div>
                  <button type="button" className="btn-t" onClick={submitContact} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Send size={13}/>Envoyer</button>
                </div>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:"linear-gradient(135deg,#0a1f0a,#0f2f0f)",border:"1px solid #25d36644",borderRadius:18,padding:22}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,marginBottom:7,color:"#25d366"}}>💬 WhatsApp</h3>
                <p style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>Réponse instantanée tous les jours !</p>
                <a href={`${WA}?text=Bonjour%20S-Mall`} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,background:"#25d366",color:"#fff",borderRadius:13,padding:"12px",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'DM Sans',sans-serif"}}>
                  <MessageCircle size={17}/>Ouvrir WhatsApp
                </a>
                <p style={{fontSize:11,color:C.muted,marginTop:9,textAlign:"center"}}>Disponible 7j/7 · Réponse rapide</p>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22,flex:1}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,marginBottom:5}}>⭐ Laisser un avis</h3>
                {reviewSent ? (
                  <div style={{textAlign:"center",padding:"16px 0"}}><p style={{fontWeight:700,color:C.green,fontSize:14}}>Merci !</p><p style={{color:C.muted,fontSize:12,marginTop:5}}>Publié après validation.</p></div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:14}}>
                    <input value={reviewForm.name} onChange={e=>setReviewForm(r=>({...r,name:e.target.value}))} placeholder="Votre nom *" style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    <div>
                      <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>Note *</p>
                      <div style={{display:"flex",gap:4}}>
                        {[1,2,3,4,5].map(s=><button type="button" key={s} onClick={()=>setReviewForm(r=>({...r,rating:s}))} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:s<=reviewForm.rating?C.gold:"#333",transition:"transform .1s"}} onMouseEnter={e=>e.target.style.transform="scale(1.2)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>★</button>)}
                      </div>
                    </div>
                    <textarea value={reviewForm.comment} onChange={e=>setReviewForm(r=>({...r,comment:e.target.value}))} placeholder="Commentaire *" rows={3} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                    <button type="button" className="btn-t" onClick={submitReview} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:10,padding:"10px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Star size={12}/>Publier</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${C.border}`,padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginTop:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>✦</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:14,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
        </div>
        <p style={{color:C.muted,fontSize:11}}>Bénin · Togo · Côte d'Ivoire — Mobile Money · FedaPay</p>
        <p style={{color:C.muted,fontSize:11}}>© 2025 S-Mall. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
