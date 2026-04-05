import { useState, useEffect } from 'react';
import { ShoppingBag, Cpu, GraduationCap, Plane, Map, Car, Home, Sparkles, TrendingUp, Flame, ShoppingCart, Calendar, Search, ChevronLeft, Lock, CreditCard, CheckCircle, Truck, MessageCircle, Send, Star, Phone, ArrowRight, Minus, Plus, Trash2, Tag, X, MapPin, Clock, Eye } from 'https://esm.sh/lucide-react@0.383.0';
import { sb } from './supabase';

const C = {
  black:"#0a0a0a", dark:"#111111", card:"#161616", card2:"#1c1c1c",
  border:"#2a2a2a", gold:"#c9a84c", goldL:"#e8c97a", goldD:"#9a7a2e",
  white:"#f5f0e8", muted:"#888880", red:"#e05a4e", green:"#4caf7d",
  orange:"#f59e0b", blue:"#3b82f6", stripe:"#635BFF", sys:"#e8533f",
};
const fmt = n => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const pct = (o,s) => Math.round((1-s/o)*100);
const uid = () => "CMD-" + Date.now().toString(36).toUpperCase();
const rid = () => "RES-" + Date.now().toString(36).toUpperCase();
const EDGE = "https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email";

const DEFAULT_CATS = [
  {id:"all",label:"Tout",icon:"✦"},
  {id:"mode",label:"Mode",icon:"👗"},
  {id:"tech",label:"Électronique",icon:"📱"},
  {id:"formation",label:"Formations",icon:"🎓"},
  {id:"avion",label:"Vols",icon:"✈️"},
  {id:"circuit",label:"Circuits",icon:"🗺️"},
  {id:"voiture",label:"Voitures",icon:"🚗"},
  {id:"appart",label:"Appartements",icon:"🏠"},
];
const CAT_ICON = {
  mode:()=><ShoppingBag size={28} strokeWidth={1.5}/>,
  tech:()=><Cpu size={28} strokeWidth={1.5}/>,
  formation:()=><GraduationCap size={28} strokeWidth={1.5}/>,
  avion:()=><Plane size={28} strokeWidth={1.5}/>,
  circuit:()=><Map size={28} strokeWidth={1.5}/>,
  voiture:()=><Car size={28} strokeWidth={1.5}/>,
  appart:()=><Home size={28} strokeWidth={1.5}/>,
  all:()=><Sparkles size={28} strokeWidth={1.5}/>,
};
const BADGE_C = {Nouveau:C.green,Bestseller:C.gold,Promo:C.red,Premium:"#9b59b6"};

// ── MINI CALENDAR ─────────────────────────────────────────────────────────────
function MiniCalendar({label,value,onChange}) {
  const [open,setOpen]=useState(false);
  const today=new Date();
  const [view,setView]=useState({y:today.getFullYear(),m:today.getMonth()});
  const days=new Date(view.y,view.m+1,0).getDate();
  const first=new Date(view.y,view.m,1).getDay();
  const months=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const pick=d=>{
    const dt=new Date(view.y,view.m,d);
    if(dt<new Date(today.getFullYear(),today.getMonth(),today.getDate()))return;
    onChange(`${String(d).padStart(2,"0")}/${String(view.m+1).padStart(2,"0")}/${view.y}`);
    setOpen(false);
  };
  return (
    <div style={{position:"relative"}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:6}}>{label}</label>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",background:C.card2,border:`1.5px solid ${value?C.gold:C.border}`,borderRadius:10,padding:"10px 14px",color:value?C.gold:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{value||"JJ/MM/AAAA"}</span><Calendar size={15} color={value?C.gold:C.muted}/>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:500,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,width:240,boxShadow:"0 16px 40px rgba(0,0,0,0.8)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:6,padding:"2px 8px",cursor:"pointer"}}>‹</button>
            <span style={{fontWeight:700,fontSize:13,color:C.white}}>{months[view.m]} {view.y}</span>
            <button onClick={()=>setView(v=>v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:6,padding:"2px 8px",cursor:"pointer"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
            {["D","L","M","M","J","V","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.muted,fontWeight:700}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {Array(first).fill(null).map((_,i)=><div key={"e"+i}/>)}
            {Array(days).fill(null).map((_,i)=>{
              const d=i+1,dt=new Date(view.y,view.m,d);
              const past=dt<new Date(today.getFullYear(),today.getMonth(),today.getDate());
              const sel=value===`${String(d).padStart(2,"0")}/${String(view.m+1).padStart(2,"0")}/${view.y}`;
              return <button key={d} onClick={()=>!past&&pick(d)} style={{textAlign:"center",fontSize:12,padding:"4px 0",borderRadius:6,border:"none",background:sel?C.gold:past?"transparent":C.card2,color:sel?C.black:past?C.border:C.white,cursor:past?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:sel?800:400}}>{d}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── BOOKING MODAL ─────────────────────────────────────────────────────────────
function BookingModal({product,onClose,onConfirm}) {
  const [df,setDf]=useState("");const [dt,setDt]=useState("");const [qty,setQty]=useState(1);const [err,setErr]=useState("");
  const showTo=product.book_type!=="circuit";
  const nights=()=>{if(!df||!showTo||!dt)return 1;try{const[a,b,c]=df.split("/").map(Number);const[x,y,z]=dt.split("/").map(Number);return Math.max(1,(new Date(z,y-1,x)-new Date(c,b-1,a))/86400000);}catch{return 1;}};
  const total=product.price*(product.book_type==="vol"||product.book_type==="circuit"?qty:nights()*qty);
  const confirm=()=>{if(!df){setErr("Choisissez une date");return;}if(showTo&&!dt){setErr("Choisissez une date de retour");return;}setErr("");onConfirm({dateFrom:df,dateTo:showTo?dt:null,passengers:qty,total});};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:32,width:"100%",maxWidth:460}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:C.gold}}>{product.name}</h3>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={14}/></button>
        </div>
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,marginBottom:20}}/>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <MiniCalendar label={product.book_type==="vol"?"Date de départ":"Date d'arrivée"} value={df} onChange={setDf}/>
          {showTo&&<MiniCalendar label={product.book_type==="vol"?"Date de retour":"Date de départ"} value={dt} onChange={setDt}/>}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:6}}>{product.book_type==="vol"?"Passagers":"Participants"}</label>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={13}/></button>
              <span style={{fontWeight:800,fontSize:18,minWidth:24,textAlign:"center"}}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={13}/></button>
              <span style={{fontSize:12,color:C.muted}}>× {fmt(product.price)}</span>
            </div>
          </div>
          {err&&<p style={{color:C.red,fontSize:12,fontWeight:600}}>⚠ {err}</p>}
          <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:C.muted,fontWeight:600}}>Total estimé</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:C.gold}}>{fmt(total)}</span>
          </div>
          <button onClick={confirm} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✦ Confirmer la réservation</button>
        </div>
      </div>
    </div>
  );
}

// ── IMAGE GALLERY ─────────────────────────────────────────────────────────────
function ImageGallery({productId,mainImage,emoji}) {
  const [imgs,setImgs]=useState([]);
  const [cur,setCur]=useState(0);
  useEffect(()=>{
    if(!productId) { if(mainImage) setImgs([mainImage]); return; }
    sb.from("product_images").select("*").eq("product_id",productId).order("position")
      .then(({data})=>{
        if(data&&data.length>0) setImgs(data.map(i=>i.url));
        else if(mainImage) setImgs([mainImage]);
        else setImgs([]);
      })
      .catch(()=>{ if(mainImage) setImgs([mainImage]); else setImgs([]); });
  },[productId,mainImage]);
  if(imgs.length===0)return <div style={{height:280,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,background:"linear-gradient(135deg,#161200,#201a00)"}}>{emoji||"🛍️"}</div>;
  return (
    <div style={{position:"relative",height:280,background:"#000",overflow:"hidden"}}>
      <img src={imgs[cur]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      {imgs.length>1&&(
        <>
          <button onClick={()=>setCur(c=>c===0?imgs.length-1:c-1)} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",borderRadius:"50%",width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>‹</button>
          <button onClick={()=>setCur(c=>c===imgs.length-1?0:c+1)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",borderRadius:"50%",width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>›</button>
          <div style={{position:"absolute",bottom:10,left:0,right:0,display:"flex",gap:6,justifyContent:"center"}}>
            {imgs.map((_,i)=><button key={i} onClick={()=>setCur(i)} style={{width:i===cur?20:7,height:7,borderRadius:999,background:i===cur?C.gold:"rgba(255,255,255,0.4)",border:"none",cursor:"pointer",padding:0,transition:"all .2s"}}/>)}
          </div>
          <span style={{position:"absolute",bottom:10,right:12,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:999}}>{cur+1}/{imgs.length}</span>
        </>
      )}
    </div>
  );
}

// ── VARIANT SELECTOR ─────────────────────────────────────────────────────────
function VariantSelector({product,onAddToCart,onBooking}) {
  const [variants,setVariants]=useState([]);
  const [selStorage,setSelStorage]=useState(null);
  const [selColor,setSelColor]=useState(null);
  const [selSize,setSelSize]=useState(null);

  useEffect(()=>{
    setSelStorage(null);setSelColor(null);setSelSize(null);setVariants([]);
    if(!product?.id) return;
    sb.from("product_variants").select("*").eq("product_id",product.id).eq("active",true)
      .then(({data})=>setVariants(data||[]))
      .catch(()=>setVariants([]));
  },[product?.id]);

  useEffect(()=>{setSelColor(null);},[selStorage]);

  const storages=[...new Set(variants.filter(v=>v.storage).map(v=>v.storage))];
  const sizes=[...new Set(variants.filter(v=>v.size).map(v=>v.size))];

  // Colors available for selected storage (or all colors if no storage variants)
  const colorsAvail = selStorage
    ? [...new Map(variants.filter(v=>v.storage===selStorage&&v.color).map(v=>[v.color,{name:v.color,hex:v.color_hex||"#888"}])).values()]
    : [...new Map(variants.filter(v=>!v.storage&&v.color).map(v=>[v.color,{name:v.color,hex:v.color_hex||"#888"}])).values()];

  const hasVariants=variants.length>0;

  const matched=hasVariants?variants.find(v=>
    (storages.length===0||v.storage===selStorage)&&
    (colorsAvail.length===0||v.color===selColor)&&
    (sizes.length===0||v.size===selSize)
  ):null;

  const price=matched?matched.price:(hasVariants&&variants.length>0?Math.min(...variants.map(v=>v.price)):product.price);
  const canAdd=!hasVariants||!!matched;

  const missing=[
    storages.length>0&&!selStorage?"une capacité":null,
    colorsAvail.length>0&&!selColor?"une couleur":null,
    sizes.length>0&&!selSize?"une taille":null,
  ].filter(Boolean);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {storages.length>0&&(
        <div>
          <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Capacité</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {storages.map(s=>{
              const minP=Math.min(...variants.filter(v=>v.storage===s).map(v=>v.price));
              return (
                <button key={s} onClick={()=>setSelStorage(selStorage===s?null:s)}
                  style={{padding:"8px 14px",borderRadius:10,border:`2px solid ${selStorage===s?C.gold:C.border}`,background:selStorage===s?`${C.gold}18`:C.card2,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all .15s"}}>
                  <span style={{fontWeight:700,fontSize:13,color:selStorage===s?C.gold:C.white}}>{s}</span>
                  <span style={{fontSize:10,color:C.muted}}>{fmt(minP)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {colorsAvail.length>0&&(
        <div>
          <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Couleur{selColor&&<span style={{color:C.white,fontWeight:400}}> — {selColor}</span>}</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {colorsAvail.map(c=>(
              <button key={c.name} onClick={()=>setSelColor(selColor===c.name?null:c.name)} title={c.name}
                style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:999,border:`2px solid ${selColor===c.name?C.gold:"transparent"}`,background:C.card2,cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:c.hex,border:"1px solid rgba(255,255,255,0.2)",flexShrink:0}}/>
                <span style={{fontSize:12,color:selColor===c.name?C.gold:C.muted,fontWeight:600}}>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sizes.length>0&&(
        <div>
          <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Taille</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {sizes.map(s=>(
              <button key={s} onClick={()=>setSelSize(selSize===s?null:s)}
                style={{width:46,height:46,borderRadius:10,border:`2px solid ${selSize===s?C.gold:C.border}`,background:selSize===s?`${C.gold}18`:C.card2,color:selSize===s?C.gold:C.white,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{background:C.card2,border:`1px solid ${matched||!hasVariants?C.gold:C.border}`,borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"border .2s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:C.gold}}>{fmt(price)}</span>
          {product.orig_price&&<span style={{textDecoration:"line-through",color:C.muted,fontSize:13}}>{fmt(product.orig_price)}</span>}
        </div>
        {matched&&<span style={{fontSize:11,color:C.green,fontWeight:700,background:`${C.green}15`,padding:"3px 10px",borderRadius:999}}>✓ Prêt</span>}
        {hasVariants&&!matched&&missing.length===0&&<span style={{fontSize:11,color:C.orange}}>Choisir ↑</span>}
      </div>

      {hasVariants&&!matched&&missing.length>0&&(
        <p style={{fontSize:12,color:C.orange,textAlign:"center",fontWeight:600,background:`${C.orange}10`,padding:"8px",borderRadius:8}}>
          Veuillez sélectionner {missing.join(" et ")}
        </p>
      )}

      <div style={{display:"flex",gap:10}}>
        {product.bookable&&(
          <button onClick={onBooking} style={{flex:1,background:`${C.blue}22`,border:`1.5px solid ${C.blue}`,color:C.blue,borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Calendar size={15}/>Réserver
          </button>
        )}
        <button onClick={()=>canAdd&&onAddToCart(product,matched)} disabled={!canAdd}
          style={{flex:2,background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:canAdd?C.black:C.muted,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:canAdd?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
          <ShoppingCart size={15}/>{canAdd?"Ajouter au panier":"Sélectionner les options"}
        </button>
      </div>
    </div>
  );
}

// ── BANNER SLIDER ─────────────────────────────────────────────────────────────
function BannerSlider({banners}) {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    if(banners.length<=1)return;
    const t=setInterval(()=>setIdx(i=>(i+1)%banners.length),5000);
    return ()=>clearInterval(t);
  },[banners.length]);
  if(!banners||banners.length===0)return null;
  const b=banners[idx];
  return (
    <div style={{position:"relative",width:"100%",borderRadius:18,overflow:"hidden",background:C.card,border:`1px solid ${C.border}`,cursor:b.link_url?"pointer":"default"}}
      onClick={()=>b.link_url&&window.open(b.link_url,"_blank")}>
      {b.media_type==="video"
        ?<video src={b.media_url} autoPlay muted loop playsInline style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
        :<img src={b.media_url} alt={b.title||"Bannière"} style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
      }
      {b.title&&(
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.75))",padding:"24px 18px 14px"}}>
          <p style={{color:C.white,fontWeight:700,fontSize:15}}>{b.title}</p>
        </div>
      )}
      {banners.length>1&&(
        <div style={{position:"absolute",bottom:10,right:14,display:"flex",gap:5}}>
          {banners.map((_,i)=>(
            <div key={i} onClick={e=>{e.stopPropagation();setIdx(i);}}
              style={{width:i===idx?18:6,height:6,borderRadius:999,background:i===idx?C.gold:"rgba(255,255,255,0.5)",cursor:"pointer",transition:"all .2s"}}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function SMallClient() {
  const [products,setProducts]=useState([]);
  const [CATS,setCATS]=useState(DEFAULT_CATS);
  const [shippingZones,setShippingZones]=useState([]);
  const [banners,setBanners]=useState([]);
  const [reviews,setReviews]=useState([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("home");
  const [cat,setCat]=useState("all");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState([]);
  const [booking,setBooking]=useState(null);
  const [selProd,setSelProd]=useState(null);
  const [shippingZone,setShippingZone]=useState(null);
  const [payMethod,setPayMethod]=useState("fedapay");
  const [form,setForm]=useState({name:"",email:"",tel:""});
  const [errors,setErrors]=useState({});
  const [processing,setProcessing]=useState(false);
  const [notif,setNotif]=useState(null);
  const [reviewForm,setReviewForm]=useState({name:"",email:"",rating:5,comment:""});
  const [reviewSent,setReviewSent]=useState(false);
  const [contactForm,setContactForm]=useState({name:"",email:"",tel:"",message:""});
  const [contactSent,setContactSent]=useState(false);

  // Load products
  useEffect(()=>{
    const load=async()=>{
      const {data}=await sb.from("products").select("*").eq("active",true).order("id");
      setProducts(data||[]);setLoading(false);
    };
    load();
    const ch=sb.channel("prod-live").on("postgres_changes",{event:"*",schema:"public",table:"products"},load).subscribe();
    return ()=>sb.removeChannel(ch);
  },[]);

  // Load categories
  useEffect(()=>{
    const load=()=>sb.from("categories").select("*").order("position").then(({data})=>{
      if(data&&data.length>0)setCATS([{id:"all",label:"Tout",icon:"✦"},...data]);
    });
    load();
    const ch=sb.channel("cats-live").on("postgres_changes",{event:"*",schema:"public",table:"categories"},load).subscribe();
    return ()=>sb.removeChannel(ch);
  },[]);

  // Load shipping zones
  useEffect(()=>{
    sb.from("shipping_zones").select("*").order("price").then(({data})=>{
      if(data&&data.length>0)setShippingZones(data);
      else setShippingZones([
        {id:1,name:"Cotonou",price:1500,free_above:50000,delay:"24-48h"},
        {id:2,name:"Bénin (hors Cotonou)",price:3000,free_above:100000,delay:"2-4 jours"},
        {id:3,name:"Togo",price:5000,free_above:150000,delay:"3-5 jours"},
        {id:4,name:"Côte d'Ivoire",price:7500,free_above:200000,delay:"4-6 jours"},
        {id:5,name:"International",price:25000,free_above:500000,delay:"7-14 jours"},
      ]);
    });
  },[]);

  // Load banners
  useEffect(()=>{
    const load=()=>sb.from("banners").select("*").eq("active",true).order("created_at",{ascending:false}).then(({data})=>setBanners(data||[]));
    load();
    const ch=sb.channel("ban-live").on("postgres_changes",{event:"*",schema:"public",table:"banners"},load).subscribe();
    return ()=>sb.removeChannel(ch);
  },[]);

  // Load reviews
  useEffect(()=>{
    const load=()=>sb.from("reviews").select("*").eq("approved",true).order("created_at",{ascending:false}).then(({data})=>setReviews(data||[]));
    load();
    const ch=sb.channel("rev-live").on("postgres_changes",{event:"*",schema:"public",table:"reviews"},load).subscribe();
    return ()=>sb.removeChannel(ch);
  },[]);

  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const subtotal=cart.reduce((s,i)=>s+(i.booking?i.price:i.price*i.qty),0);
  const shippingCost=shippingZone?(shippingZone.free_above>0&&subtotal>=shippingZone.free_above?0:shippingZone.price):0;
  const grandTotal=subtotal+shippingCost;

  const notify=(msg,color=C.gold)=>{setNotif({msg,color});setTimeout(()=>setNotif(null),3500);};

  const addToCart=(p,variant=null)=>{
    const price=variant?variant.price:p.price;
    const vLabel=variant?[variant.color,variant.storage,variant.size].filter(Boolean).join(" · "):null;
    setCart(prev=>{
      const ex=prev.find(i=>i._id===p.id+(vLabel||"")&&!i.booking);
      if(ex)return prev.map(i=>i._id===p.id+(vLabel||"")&&!i.booking?{...i,qty:i.qty+1}:i);
      return [...prev,{...p,price,variantLabel:vLabel,qty:1,_id:p.id+(vLabel||"")}];
    });
    notify(`✦ ${p.name}${vLabel?` (${vLabel})`:""} ajouté au panier`);
  };

  const addBooking=(p,info)=>{
    setCart(prev=>[...prev,{...p,_id:p.id+"_b_"+Date.now(),qty:1,booking:info,price:info.total}]);
    notify(`✦ ${p.name} réservé`);
  };

  const removeItem=idx=>setCart(prev=>prev.filter((_,i)=>i!==idx));
  const updateQty=(idx,d)=>setCart(prev=>prev.map((it,i)=>i===idx?{...it,qty:Math.max(1,it.qty+d)}:it));
  const filtered=products.filter(p=>(cat==="all"||p.cat===cat)&&(p.name||"").toLowerCase().includes(search.toLowerCase()));

  const validate=()=>{
    const e={};
    if(!form.name.trim())e.name="Requis";
    if(!form.email.includes("@"))e.email="Email invalide";
    if(!form.tel.trim())e.tel="Requis";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handlePay=async()=>{
    if(!validate())return;
    if(!shippingZone){notify("Choisissez une zone de livraison",C.red);setPage("cart");return;}
    setProcessing(true);
    try {
      const orderId=uid();
      const safeName=form.name.trim().slice(0,100);
      const safeEmail=form.email.toLowerCase().trim();
      const safeTel=form.tel.trim().slice(0,20);
      const shopItems=cart.filter(i=>!i.booking);
      const bookItems=cart.filter(i=>i.booking);

      if(shopItems.length>0){
        await sb.from("orders").insert({
          id:orderId,client_name:safeName,client_email:safeEmail,client_tel:safeTel,
          items:shopItems.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price,variant:i.variantLabel||null})),
          subtotal,shipping:shippingCost,total:grandTotal,pay_method:payMethod,
          status:"En cours",country:shippingZone.name,
        });
      }
      for(const item of bookItems){
        await sb.from("reservations").insert({
          id:rid(),client_name:safeName,client_email:safeEmail,client_tel:safeTel,
          product_id:item.id,product_name:item.name,product_emoji:item.emoji,
          book_type:item.book_type||"autre",date_from:item.booking.dateFrom,
          date_to:item.booking.dateTo||null,persons:item.booking.passengers,
          total:item.booking.total,status:"En attente",
        });
      }

      // Email confirmation
      if(safeEmail){
        try {
          await fetch(EDGE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
            to:safeEmail,
            subject:`✦ Confirmation commande S-Mall — ${orderId}`,
            html:`<div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0a0a0a;color:#f5f0e8;padding:32px;border-radius:16px;">
              <h1 style="color:#c9a84c;text-align:center;">✦ S-Mall</h1>
              <div style="background:#161616;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
                <h2 style="color:#c9a84c;">Commande confirmée !</h2>
                <p style="color:#888;">Réf : <strong style="color:#f5f0e8;">${orderId}</strong></p>
              </div>
              <p>Bonjour <strong>${safeName}</strong>,<br/>Merci pour votre commande de <strong style="color:#c9a84c;">${fmt(grandTotal)}</strong>.<br/>Zone de livraison : ${shippingZone.name} · ${shippingZone.delay}</p>
              <p style="color:#555;font-size:12px;text-align:center;margin-top:20px;"><a href="https://wa.me/2250150512408" style="color:#c9a84c;">WhatsApp</a> · sgroupmall.vercel.app</p>
            </div>`
          })});
        } catch(e){}
      }

      // FedaPay
      if(payMethod==="fedapay"&&window.FedaPay){
        window.FedaPay.init({
          public_key:"pk_live_EzI5k531w-Iu-LUAu4I2sluv",
          transaction:{amount:grandTotal,description:`Commande S-Mall ${orderId}`},
          customer:{firstname:safeName.split(" ")[0],lastname:safeName.split(" ").slice(1).join(" ")||".",email:safeEmail,phone_number:{number:safeTel,country:"bj"}},
          onComplete:async(resp)=>{
            if(resp.reason==="DIALOG DISMISSED"){setProcessing(false);notify("Paiement annulé",C.red);return;}
            await sb.from("orders").update({status:"Confirmé"}).eq("id",orderId);
            setProcessing(false);setPage("success");setCart([]);setShippingZone(null);
          }
        }).open();
      } else {
        setProcessing(false);setPage("success");setCart([]);setShippingZone(null);
      }
    } catch(err){
      setProcessing(false);notify("Erreur. Réessayez.",C.red);
    }
  };

  const submitReview=async()=>{
    if(!reviewForm.name.trim()||!reviewForm.comment.trim()){notify("Remplis tous les champs",C.red);return;}
    await sb.from("reviews").insert({client_name:reviewForm.name,client_email:reviewForm.email,rating:reviewForm.rating,comment:reviewForm.comment,approved:false});
    setReviewSent(true);notify("✦ Avis envoyé — merci !");
  };

  const submitContact=async()=>{
    if(!contactForm.name.trim()||!contactForm.message.trim()){notify("Remplis nom et message",C.red);return;}
    await sb.from("messages").insert({
      from_name:contactForm.name,from_email:contactForm.email||"Non renseigné",
      subject:`Contact S-Mall — ${contactForm.name}`,
      message:contactForm.tel?`Tel: ${contactForm.tel}\n\n${contactForm.message}`:contactForm.message,
    });
    setContactSent(true);notify("✦ Message envoyé !");
  };

  const Inp=({field,placeholder,type="text"})=>(
    <div>
      <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:"#1c1c1c",border:`1.5px solid ${errors[field]?C.red:C.border}`,borderRadius:10,padding:"11px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
      {errors[field]&&<p style={{color:C.red,fontSize:11,marginTop:4}}>{errors[field]}</p>}
    </div>
  );

  const GL=()=><div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 0 24px"}}/>;

  const Card=({p,i})=>(
    <div className="pc" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,overflow:"hidden",animation:`fadeUp .35s ease ${i*.04}s both`}}>
      <div onClick={()=>setSelProd(p)} style={{background:"linear-gradient(135deg,#161200,#201a00)",height:155,position:"relative",overflow:"hidden",cursor:"pointer"}}>
        {p.image_url?<img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:52}}>{p.emoji}</div>}
        {p.badge&&<span style={{position:"absolute",top:10,right:10,background:BADGE_C[p.badge]||C.gold,color:p.badge==="Bestseller"?C.black:C.white,fontSize:9,fontWeight:800,padding:"3px 9px",borderRadius:999,textTransform:"uppercase"}}>{p.badge}</span>}
        {p.orig_price&&<span style={{position:"absolute",top:10,left:10,background:C.red,color:C.white,fontSize:9,fontWeight:800,padding:"3px 9px",borderRadius:999}}>-{pct(p.orig_price,p.price)}%</span>}
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.6))",padding:"12px 8px 6px",textAlign:"center"}}>
          <span style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{CATS.find(c=>c.id===p.cat)?.label}</span>
        </div>
      </div>
      <div style={{padding:16}}>
        <h3 onClick={()=>setSelProd(p)} style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,marginBottom:4,color:C.white,cursor:"pointer",lineHeight:1.3}}>{p.name}</h3>
        <p style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.5}}>{(p.desc||p.description||"").slice(0,65)}{(p.desc||p.description||"").length>65?"…":""}</p>
        <div style={{marginBottom:12}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:900,color:C.gold}}>{fmt(p.price)}</span>
          {p.orig_price&&<span style={{textDecoration:"line-through",color:C.muted,fontSize:11,marginLeft:6}}>{fmt(p.orig_price)}</span>}
        </div>
        <div style={{display:"flex",gap:7}}>
          <button onClick={()=>setSelProd(p)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"7px",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <Eye size={12}/>Détail
          </button>
          {p.bookable
            ?<button onClick={()=>setBooking(p)} style={{flex:1,background:`${C.blue}22`,border:`1.5px solid ${C.blue}`,color:C.blue,borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Calendar size={11}/>Réserver</button>
            :<button onClick={()=>addToCart(p)} style={{flex:1,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ShoppingCart size={11}/>Ajouter</button>
          }
        </div>
      </div>
    </div>
  );

  const homeBanners=banners.filter(b=>b.position==="home_top");
  const midBanners=banners.filter(b=>b.position==="home_mid");

  return (
    <div style={{background:C.black,minHeight:"100vh",color:C.white,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${C.goldD};border-radius:10px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 14px ${C.gold}55}50%{box-shadow:0 0 30px ${C.gold}99}}
        .pc{transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:0 4px 20px rgba(0,0,0,0.4);}
        .pc:hover{transform:translateY(-4px)!important;box-shadow:0 16px 40px rgba(201,168,76,0.15)!important;}
        .btn-g{transition:all .2s;}.btn-g:hover{filter:brightness(1.1);}
        .nav-a{cursor:pointer;transition:color .2s;}.nav-a:hover{color:${C.gold}!important;}
        select option{background:${C.card2};color:${C.white};}
      `}</style>

      {notif&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:C.card,border:`1px solid ${notif.color}`,color:notif.color,padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,0.5)",animation:"fadeUp .3s ease",maxWidth:300}}>{notif.msg}</div>}
      {booking&&<BookingModal product={booking} onClose={()=>setBooking(null)} onConfirm={info=>{addBooking(booking,info);setBooking(null);}}/>}

      {/* PRODUCT MODAL */}
      {selProd&&selProd.id&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setSelProd(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:28,width:"100%",maxWidth:680,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.95)"}}>
            <div style={{position:"relative",borderRadius:"28px 28px 0 0",overflow:"hidden"}}>
              <ImageGallery productId={selProd.id} mainImage={selProd.image_url} emoji={selProd.emoji}/>
              {selProd.orig_price&&<span style={{position:"absolute",top:14,left:14,background:C.red,color:C.white,fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:999,zIndex:10}}>-{pct(selProd.orig_price,selProd.price)}%</span>}
              {selProd.badge&&<span style={{position:"absolute",top:14,right:50,background:BADGE_C[selProd.badge]||C.gold,color:selProd.badge==="Bestseller"?C.black:C.white,fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:999,zIndex:10}}>{selProd.badge}</span>}
              <button onClick={()=>setSelProd(null)} style={{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.7)",border:"none",color:C.white,borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10}}><X size={15}/></button>
            </div>
            <div style={{padding:"24px 28px"}}>
              <p style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:6}}>{CATS.find(c=>c.id===selProd.cat)?.label}</p>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:C.white,marginBottom:10}}>{selProd.name}</h2>
              <p style={{fontSize:14,color:C.muted,lineHeight:1.8,marginBottom:16}}>{selProd.desc||selProd.description||"Aucune description disponible."}</p>
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,marginBottom:18}}/>
              <VariantSelector
                product={selProd}
                onAddToCart={(p,v)=>{addToCart(p,v);setSelProd(null);}}
                onBooking={()=>{setBooking(selProd);setSelProd(null);}}
              />
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{background:"rgba(10,10,10,0.97)",backdropFilter:"blur(12px)",padding:"0 32px",height:66,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("home")}>
          <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,animation:"glow 3s ease infinite"}}>✦</div>
          <div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:19,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
            <span style={{fontSize:8,color:C.muted,display:"block",letterSpacing:3,textTransform:"uppercase"}}>Premium Store</span>
          </div>
        </div>
        <div style={{display:"flex",gap:22,alignItems:"center"}}>
          {[["Accueil","home"],["Boutique","shop"],["Voyages","voyages"],["Formations","formations"],["Contact","contact"]].map(([l,k])=>(
            <span key={k} className="nav-a" style={{fontWeight:600,fontSize:13,color:page===k?C.gold:C.muted}}
              onClick={()=>{if(k==="home")setPage("home");else if(k==="shop"){setCat("all");setPage("shop");}else if(k==="voyages"){setCat("avion");setPage("shop");}else if(k==="contact")setPage("contact");else{setCat("formation");setPage("shop");}}}>
              {l}
            </span>
          ))}
        </div>
        <button className="btn-g" onClick={()=>setPage("cart")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Sans',sans-serif"}}>
          <ShoppingCart size={16}/>{cartCount>0&&<span style={{background:C.black,color:C.gold,borderRadius:999,padding:"1px 7px",fontSize:11,fontWeight:800}}>{cartCount}</span>}Panier
        </button>
      </nav>

      {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:12}}><span style={{display:"inline-block",width:22,height:22,border:`3px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .8s linear infinite"}}/><span style={{color:C.muted,fontSize:15}}>Chargement…</span></div>}

      {/* HOME */}
      {!loading&&page==="home"&&(
        <div>
          {/* HERO */}
          <div style={{position:"relative",overflow:"hidden",padding:"80px 60px 70px",background:"linear-gradient(135deg,#0a0a0a 0%,#1a1400 50%,#0a0a0a 100%)"}}>
            <div style={{position:"absolute",top:"-80px",left:"-60px",width:"400px",height:"400px",borderRadius:"50%",background:`radial-gradient(circle,${C.gold}15 0%,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{maxWidth:640,animation:"fadeUp .7s ease"}}>
              <p style={{color:C.gold,fontWeight:700,letterSpacing:4,textTransform:"uppercase",fontSize:11,marginBottom:14}}>✦ Bienvenue sur S-Mall</p>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:48,fontWeight:900,lineHeight:1.1,marginBottom:18}}>Mode. Tech. Voyages.<br/><span style={{background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tout en un lieu.</span></h1>
              <p style={{color:C.muted,fontSize:15,lineHeight:1.7,maxWidth:480,marginBottom:28}}>Vêtements, électronique, formations, vols, circuits Bénin · Togo · CIV, voitures & appartements.</p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <button className="btn-g" onClick={()=>{setCat("all");setPage("shop");}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"13px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>Explorer<ArrowRight size={15}/></button>
                <button onClick={()=>{setCat("circuit");setPage("shop");}} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:14,padding:"13px 22px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Circuits</button>
                <button onClick={()=>{setCat("avion");setPage("shop");}} style={{background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 22px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Vols</button>
              </div>
            </div>
          </div>

          {/* BANNER TOP */}
          {homeBanners.length>0&&(
            <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 28px 0"}}>
              <BannerSlider banners={homeBanners}/>
            </div>
          )}

          {/* CATEGORIES */}
          <div style={{maxWidth:1200,margin:"0 auto",padding:"44px 28px"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:8}}>✦ Nos univers</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,textAlign:"center",marginBottom:8}}>Que cherchez-vous ?</h2>
            <GL/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:14}}>
              {CATS.filter(c=>c.id!=="all").map((c,i)=>(
                <div key={c.id} className="pc" onClick={()=>{setCat(c.id);setPage("shop");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"20px 14px",textAlign:"center",cursor:"pointer",animation:`fadeUp .4s ease ${i*.05}s both`}}>
                  <div style={{color:C.gold,display:"flex",justifyContent:"center",marginBottom:10}}>{CAT_ICON[c.id]?CAT_ICON[c.id]():<Tag size={28} strokeWidth={1.5} color={C.gold}/>}</div>
                  <p style={{fontWeight:700,fontSize:13,color:C.white}}>{c.label}</p>
                  <p style={{fontSize:11,color:C.gold,marginTop:3}}>{products.filter(p=>p.cat===c.id).length} articles</p>
                </div>
              ))}
            </div>
          </div>

          {/* PROMOS */}
          {products.filter(p=>p.orig_price).length>0&&(
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 44px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Flame size={16} color={C.red}/><p style={{color:C.red,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Offres du moment</p></div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:8}}>Promotions en cours</h2>
              <GL/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:18}}>
                {products.filter(p=>p.orig_price).slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}
              </div>
            </div>
          )}

          {/* BANNER MID */}
          {midBanners.length>0&&(
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 44px"}}>
              <BannerSlider banners={midBanners}/>
            </div>
          )}

          {/* NOUVEAUTES */}
          {products.filter(p=>p.badge==="Nouveau").length>0&&(
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 44px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Sparkles size={16} color={C.green}/><p style={{color:C.green,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Tout juste arrivé</p></div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:8}}>Nouveautés</h2>
              <GL/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:18}}>
                {products.filter(p=>p.badge==="Nouveau").slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}
              </div>
            </div>
          )}

          {/* BESTSELLERS */}
          {products.filter(p=>p.badge==="Bestseller").length>0&&(
            <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 44px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><TrendingUp size={16} color={C.gold}/><p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Les plus demandés</p></div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:8}}>Bestsellers</h2>
              <GL/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:18}}>
                {products.filter(p=>p.badge==="Bestseller").slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}
              </div>
            </div>
          )}

          {/* AVIS */}
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 44px"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:8}}>⭐ Témoignages</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,textAlign:"center",marginBottom:8}}>Ce que disent nos clients</h2>
            <GL/>
            {reviews.length===0?(
              <div style={{textAlign:"center",padding:"30px 0",color:C.muted}}>
                <Star size={40} color={C.muted} strokeWidth={1} style={{margin:"0 auto 10px",display:"block"}}/>
                <p style={{fontSize:14,fontWeight:600}}>Soyez le premier à laisser un avis !</p>
                <button onClick={()=>setPage("contact")} style={{marginTop:14,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"10px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Laisser un avis</button>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
                {reviews.slice(0,6).map((r,i)=>(
                  <div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px",animation:`fadeUp .4s ease ${i*.06}s both`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div><p style={{fontWeight:700,fontSize:14,color:C.white}}>{r.client_name}</p><p style={{fontSize:11,color:C.muted}}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p></div>
                      <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:15,color:s<=r.rating?C.gold:"#333"}}>★</span>)}</div>
                    </div>
                    <p style={{fontSize:13,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{textAlign:"center",marginTop:20}}>
              <button onClick={()=>setPage("contact")} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:12,padding:"10px 24px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✦ Laisser un avis</button>
            </div>
          </div>

          {/* FOOTER BANNER */}
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 50px"}}>
            <div style={{background:"linear-gradient(135deg,#1c0a08,#2a1008)",border:`1px solid ${C.sys}44`,borderRadius:20,padding:"32px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
              <div>
                <p style={{color:C.sys,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:8}}>⚡ Formations en ligne</p>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:6}}>Formations & Ebooks</h3>
                <p style={{color:C.muted,fontSize:13,maxWidth:400,lineHeight:1.6}}>Accédez à nos formations et recevez votre lien d'accès automatiquement après paiement.</p>
              </div>
              <button className="btn-g" onClick={()=>{setCat("formation");setPage("shop");}} style={{background:`linear-gradient(135deg,#c0392b,${C.sys})`,color:C.white,border:"none",borderRadius:14,padding:"12px 24px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Voir les formations →</button>
            </div>
          </div>
        </div>
      )}

      {/* SHOP */}
      {!loading&&page==="shop"&&(
        <div style={{maxWidth:1200,margin:"0 auto",padding:"40px 28px",animation:"fadeUp .4s ease"}}>
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"9px 14px",gap:8}}>
              <Search size={15} color={C.gold}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {CATS.map(c=>(
                <button key={c.id} onClick={()=>setCat(c.id)} style={{padding:"7px 14px",borderRadius:999,border:`1.5px solid ${cat===c.id?C.gold:C.border}`,background:cat===c.id?`${C.gold}18`:"transparent",color:cat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>{c.label}</button>
              ))}
            </div>
          </div>
          <p style={{color:C.muted,fontSize:13,marginBottom:18}}>{filtered.length} article{filtered.length!==1?"s":""}</p>
          {filtered.length===0
            ?<div style={{textAlign:"center",padding:"60px 0",color:C.muted}}><Search size={48} strokeWidth={1} style={{margin:"0 auto 12px",display:"block"}}/><p style={{fontWeight:700,fontSize:16}}>Aucun résultat</p></div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:18}}>{filtered.map((p,i)=><Card key={p.id} p={p} i={i}/>)}</div>
          }
        </div>
      )}

      {/* CART */}
      {page==="cart"&&(
        <div style={{maxWidth:960,margin:"0 auto",padding:"40px 28px",animation:"fadeUp .4s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:6}}>✦ Mon panier</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:20}}>{cartCount} article{cartCount!==1?"s":""}</h2>
          <GL/>
          {cart.length===0?(
            <div style={{textAlign:"center",padding:"70px 0"}}>
              <ShoppingCart size={56} strokeWidth={1} color={C.muted} style={{margin:"0 auto 14px",display:"block"}}/>
              <p style={{fontWeight:700,fontSize:16,color:C.muted,marginBottom:20}}>Votre panier est vide</p>
              <button className="btn-g" onClick={()=>setPage("shop")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Parcourir la boutique</button>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 310px",gap:22,alignItems:"start"}}>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {cart.map((item,idx)=>(
                  <div key={idx} style={{background:C.card,border:`1px solid ${item.booking?C.blue:C.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:52,height:52,borderRadius:12,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,overflow:"hidden",border:`1px solid ${C.border}`}}>
                      {item.image_url?<img src={item.image_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span>{item.emoji}</span>}
                    </div>
                    <div style={{flex:1}}>
                      <h4 style={{fontWeight:700,fontSize:14,marginBottom:2,color:C.white}}>{item.name}</h4>
                      {item.variantLabel&&<p style={{fontSize:11,color:C.gold,marginBottom:2}}>{item.variantLabel}</p>}
                      {item.booking&&<p style={{fontSize:11,color:C.blue,marginBottom:2}}>📅 {item.booking.dateFrom}{item.booking.dateTo?` → ${item.booking.dateTo}`:""} · {item.booking.passengers} pers.</p>}
                      <p style={{color:C.gold,fontWeight:700,fontSize:13}}>{fmt(item.price)}</p>
                    </div>
                    {!item.booking&&(
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <button onClick={()=>updateQty(idx,-1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><Minus size={11}/></button>
                        <span style={{fontWeight:800,fontSize:13,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                        <button onClick={()=>updateQty(idx,1)} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><Plus size={11}/></button>
                      </div>
                    )}
                    <div style={{textAlign:"right",minWidth:80}}>
                      <p style={{fontWeight:900,fontSize:14,color:C.white,marginBottom:4}}>{fmt(item.booking?item.price:item.price*item.qty)}</p>
                      <button onClick={()=>removeItem(idx)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:3,marginLeft:"auto"}}><Trash2 size={10}/>Retirer</button>
                    </div>
                  </div>
                ))}
                <button onClick={()=>setPage("shop")} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px",fontWeight:600,fontSize:13,color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><ChevronLeft size={14}/>Continuer mes achats</button>
              </div>

              {/* RECAP */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22,position:"sticky",top:80}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,marginBottom:18}}>Récapitulatif</h3>
                <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>

                  {/* ZONE DE LIVRAISON */}
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"flex",alignItems:"center",gap:5,marginBottom:7}}><MapPin size={12}/>Zone de livraison</label>
                    <select value={shippingZone?.id||""} onChange={e=>{const z=shippingZones.find(z=>String(z.id)===e.target.value);setShippingZone(z||null);}}
                      style={{width:"100%",background:C.card2,border:`1.5px solid ${shippingZone?C.gold:C.border}`,borderRadius:10,padding:"9px 12px",color:shippingZone?C.white:C.muted,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}>
                      <option value="">-- Choisir votre zone --</option>
                      {shippingZones.map(z=>(
                        <option key={z.id} value={String(z.id)}>
                          {z.name} — {z.free_above>0&&subtotal>=z.free_above?"Gratuite":fmt(z.price)} ({z.delay})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}>
                    <span style={{color:C.muted,display:"flex",alignItems:"center",gap:4}}><Truck size={12}/>Livraison</span>
                    <span style={{fontWeight:700,color:!shippingZone?C.muted:shippingCost===0?C.green:C.white}}>
                      {!shippingZone?"À choisir":shippingCost===0?"Gratuite 🎉":fmt(shippingCost)}
                    </span>
                  </div>

                  {shippingZone&&shippingZone.free_above>0&&subtotal<shippingZone.free_above&&(
                    <p style={{fontSize:11,color:C.muted,background:"#1a1200",padding:"7px 10px",borderRadius:8,border:`1px solid ${C.border}`}}>
                      💡 Encore {fmt(shippingZone.free_above-subtotal)} pour la livraison gratuite
                    </p>
                  )}

                  {shippingZone&&(
                    <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:C.muted}}>
                      <Clock size={11}/>{shippingZone.delay}
                    </div>
                  )}

                  <div style={{height:1,background:C.border}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:900}}>
                    <span>Total</span><span style={{color:C.gold}}>{fmt(grandTotal)}</span>
                  </div>
                </div>
                <button className="btn-g" onClick={()=>setPage("checkout")} disabled={!shippingZone}
                  style={{width:"100%",background:shippingZone?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:shippingZone?C.black:C.muted,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:shippingZone?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
                  {shippingZone?"Passer la commande →":"Choisissez une zone"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT */}
      {page==="checkout"&&(
        <div style={{maxWidth:860,margin:"0 auto",padding:"40px 28px",animation:"fadeUp .4s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:6}}>✦ Finaliser</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:20}}>Paiement sécurisé</h2>
          <GL/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:22,alignItems:"start"}}>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,marginBottom:16,color:C.gold}}>👤 Vos informations</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Inp field="name" placeholder="Nom complet"/>
                  <Inp field="email" placeholder="Email" type="email"/>
                  <Inp field="tel" placeholder="Téléphone" type="tel"/>
                </div>
              </div>
              {shippingZone&&(
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,marginBottom:14,color:C.gold,display:"flex",alignItems:"center",gap:8}}><Truck size={15}/>Livraison</h3>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:3}}>{shippingZone.name}</p><p style={{fontSize:12,color:C.muted,display:"flex",alignItems:"center",gap:5}}><Clock size={11}/>{shippingZone.delay}</p></div>
                    <span style={{fontWeight:800,fontSize:15,color:shippingCost===0?C.green:C.gold}}>{shippingCost===0?"Gratuite":fmt(shippingCost)}</span>
                  </div>
                </div>
              )}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:16,marginBottom:16,color:C.gold}}>💳 Méthode de paiement</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {[
                    {id:"fedapay",label:"Mobile Money",color:"#e8a020",sub:"MTN · Moov · Wave · Orange",icon:<Phone size={18} strokeWidth={1.5}/>},
                    {id:"card",label:"Carte bancaire",color:C.stripe,sub:"Visa · Mastercard (bientôt)",icon:<CreditCard size={18} strokeWidth={1.5}/>},
                  ].map(m=>(
                    <button key={m.id} onClick={()=>setPayMethod(m.id)} style={{border:`2px solid ${payMethod===m.id?m.color:C.border}`,borderRadius:12,padding:"12px 8px",background:payMethod===m.id?`${m.color}15`:C.dark,cursor:"pointer",textAlign:"center",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
                      <div style={{marginBottom:5,display:"flex",justifyContent:"center",color:payMethod===m.id?m.color:"#555"}}>{m.icon}</div>
                      <div style={{fontWeight:700,fontSize:12,color:payMethod===m.id?m.color:C.white}}>{m.label}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.sub}</div>
                    </button>
                  ))}
                </div>
                {payMethod==="fedapay"&&(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                      {[{label:"MTN",color:"#ffcb00"},{label:"Moov",color:"#00a651"},{label:"Wave",color:"#1ba8de"},{label:"Orange",color:"#ff6600"}].map(m=>(
                        <div key={m.label} style={{background:C.card2,border:`1px solid ${m.color}33`,borderRadius:9,padding:"8px 4px",textAlign:"center"}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:m.color,margin:"0 auto 5px"}}/>
                          <div style={{fontSize:10,color:m.color,fontWeight:700}}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",background:"#0a1800",borderRadius:10,border:`1px solid ${C.green}44`}}>
                      <Lock size={12} color={C.green}/><span style={{fontSize:12,color:C.green,fontWeight:600}}>Paiement sécurisé via FedaPay</span>
                    </div>
                  </div>
                )}
                {payMethod==="card"&&(
                  <div style={{background:`${C.stripe}12`,border:`1px solid ${C.stripe}33`,borderRadius:12,padding:"14px 16px"}}>
                    <p style={{fontWeight:700,fontSize:12,color:C.stripe,marginBottom:6}}>💳 Bientôt disponible</p>
                    <p style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Le paiement par carte sera disponible très prochainement. Utilisez Mobile Money en attendant.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:20,position:"sticky",top:80}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,marginBottom:14}}>Votre commande</h3>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14,maxHeight:180,overflowY:"auto"}}>
                {cart.map((item,idx)=>(
                  <div key={idx} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <div style={{width:30,height:30,borderRadius:8,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{item.emoji}</div>
                    <div style={{flex:1}}>
                      <p style={{fontWeight:600,fontSize:12,color:C.white}}>{item.name}</p>
                      {item.variantLabel&&<p style={{fontSize:10,color:C.gold}}>{item.variantLabel}</p>}
                      {item.booking&&<p style={{fontSize:10,color:C.blue}}>📅 {item.booking.dateFrom}</p>}
                      <p style={{color:C.muted,fontSize:10}}>×{item.qty||1}</p>
                    </div>
                    <span style={{fontWeight:800,fontSize:12,color:C.gold,flexShrink:0}}>{fmt(item.booking?item.price:item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{height:1,background:C.border,marginBottom:10}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,fontSize:12}}><span style={{color:C.muted}}>Livraison</span><span style={{fontWeight:700,color:shippingCost===0?C.green:C.white}}>{shippingCost===0?"Gratuite":fmt(shippingCost)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:900,marginBottom:16}}><span>Total</span><span style={{color:C.gold}}>{fmt(grandTotal)}</span></div>
              <button className="btn-g" onClick={handlePay} disabled={processing||payMethod==="card"}
                style={{width:"100%",background:processing||payMethod==="card"?"#2a2a2a":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:processing||payMethod==="card"?C.muted:C.black,border:"none",borderRadius:13,padding:"13px",fontWeight:700,fontSize:13,cursor:processing||payMethod==="card"?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {processing?<><span style={{display:"inline-block",width:15,height:15,border:`2px solid ${C.muted}`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Traitement…</>:payMethod==="card"?"Carte bientôt disponible":`Confirmer — ${fmt(grandTotal)}`}
              </button>
              <button onClick={()=>setPage("cart")} style={{width:"100%",marginTop:8,background:"none",border:"none",color:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"6px",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ChevronLeft size={13}/>Retour au panier</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {page==="success"&&(
        <div style={{maxWidth:500,margin:"60px auto",padding:"0 24px",textAlign:"center"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:28,padding:"48px 40px"}}>
            <div style={{width:78,height:78,borderRadius:"50%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 22px",animation:"glow 2s ease infinite"}}>
              <CheckCircle size={36} color={C.black} strokeWidth={2.5}/>
            </div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:10}}>Commande confirmée !</h2>
            <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:22}}>Merci pour votre confiance. Un email de confirmation vous a été envoyé.</p>
            <div style={{background:"#0f1a0f",border:`1px solid ${C.green}44`,borderRadius:12,padding:"12px 16px",marginBottom:22,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <Truck size={15} color={C.green}/><p style={{fontWeight:700,fontSize:13,color:C.green}}>Livraison estimée : {shippingZone?.delay||"3-5 jours"}</p>
            </div>
            <button className="btn-g" onClick={()=>{setPage("home");setForm({name:"",email:"",tel:""});setErrors({});}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"13px 32px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retour à l'accueil</button>
          </div>
        </div>
      )}

      {/* CONTACT */}
      {page==="contact"&&(
        <div style={{maxWidth:780,margin:"0 auto",padding:"40px 28px",animation:"fadeUp .4s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:6}}>✦ Nous contacter</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:8}}>Parlons-nous</h2>
          <GL/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:22}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:26}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:5}}>📬 Envoyez un message</h3>
              <p style={{fontSize:13,color:C.muted,marginBottom:20}}>Réponse sous 24h</p>
              {contactSent?(
                <div style={{textAlign:"center",padding:"30px 0"}}>
                  <CheckCircle size={44} color={C.green} strokeWidth={1.5} style={{margin:"0 auto 12px",display:"block"}}/>
                  <p style={{fontWeight:700,fontSize:15,color:C.green,marginBottom:6}}>Message envoyé !</p>
                  <p style={{color:C.muted,fontSize:13,marginBottom:18}}>Nous vous répondrons rapidement.</p>
                  <button onClick={()=>setContactSent(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"8px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Envoyer un autre</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[["name","Votre nom *","Nom complet","text"],["email","Email","votre@email.com","email"],["tel","Téléphone","WhatsApp ou mobile","tel"]].map(([f,l,p,t])=>(
                    <div key={f}>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{l}</label>
                      <input type={t} value={contactForm[f]} onChange={e=>setContactForm(cf=>({...cf,[f]:e.target.value}))} placeholder={p}
                        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Message *</label>
                    <textarea value={contactForm.message} onChange={e=>setContactForm(cf=>({...cf,message:e.target.value}))} placeholder="Votre message…" rows={4}
                      style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                  </div>
                  <button onClick={submitContact} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Send size={14}/>Envoyer</button>
                </div>
              )}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{background:"linear-gradient(135deg,#0a1f0a,#0f2f0f)",border:"1px solid #25d36633",borderRadius:20,padding:24}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:8,color:"#25d366"}}>💬 WhatsApp Direct</h3>
                <p style={{fontSize:13,color:C.muted,marginBottom:18,lineHeight:1.6}}>Réponse instantanée tous les jours !</p>
                <a href="https://wa.me/2250150512408?text=Bonjour%20S-Mall" target="_blank" rel="noreferrer"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#25d366",color:"#fff",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'DM Sans',sans-serif"}}>
                  <MessageCircle size={18}/>Ouvrir WhatsApp
                </a>
                <p style={{fontSize:11,color:C.muted,marginTop:10,textAlign:"center"}}>Disponible 7j/7 · Réponse rapide</p>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24,flex:1}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:5}}>⭐ Laisser un avis</h3>
                <p style={{fontSize:13,color:C.muted,marginBottom:16}}>Partagez votre expérience</p>
                {reviewSent?(
                  <div style={{textAlign:"center",padding:"16px 0"}}>
                    <p style={{fontWeight:700,color:C.green,fontSize:14}}>Merci pour votre avis !</p>
                    <p style={{color:C.muted,fontSize:12,marginTop:5}}>Publié après validation.</p>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Votre nom *</label>
                      <input value={reviewForm.name} onChange={e=>setReviewForm(r=>({...r,name:e.target.value}))} placeholder="Nom complet"
                        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:6}}>Note *</label>
                      <div style={{display:"flex",gap:5}}>
                        {[1,2,3,4,5].map(s=>(
                          <button key={s} onClick={()=>setReviewForm(r=>({...r,rating:s}))} style={{fontSize:24,background:"none",border:"none",cursor:"pointer",color:s<=reviewForm.rating?C.gold:"#333",transition:"transform .15s"}} onMouseEnter={e=>e.target.style.transform="scale(1.2)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Commentaire *</label>
                      <textarea value={reviewForm.comment} onChange={e=>setReviewForm(r=>({...r,comment:e.target.value}))} placeholder="Votre expérience…" rows={3}
                        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                    </div>
                    <button onClick={submitReview} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:11,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Star size={13}/>Publier mon avis</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${C.border}`,padding:"22px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginTop:20}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:26,height:26,borderRadius:7,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>✦</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:14,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
        </div>
        <p style={{color:C.muted,fontSize:11}}>Bénin · Togo · Côte d'Ivoire — Mobile Money · FedaPay</p>
        <p style={{color:C.muted,fontSize:11}}>© 2025 S-Mall. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
