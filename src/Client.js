import { useState, useEffect } from 'react';
import { ShoppingCart, Calendar, Search, ChevronLeft, Lock, CreditCard, CheckCircle, Truck, MessageCircle, Send, Star, Phone, ArrowRight, Minus, Plus, Trash2, X, MapPin, Clock, Eye, Percent, Flame, Sparkles, TrendingUp, ShoppingBag, Cpu, GraduationCap, Plane, Map, Car, Home, Tag } from 'lucide-react';
import { sb } from './supabase';

const C={bg:"#0a0a0a",card:"#161616",card2:"#1c1c1c",border:"#2a2a2a",gold:"#c9a84c",goldL:"#e8c97a",goldD:"#9a7a2e",white:"#f5f0e8",muted:"#888880",red:"#e05a4e",green:"#4caf7d",orange:"#f59e0b",blue:"#3b82f6"};
const fmt=n=>new Intl.NumberFormat("fr-FR").format(Math.round(n))+" FCFA";
const pct=(o,s)=>Math.round((1-s/o)*100);
const uid=()=>"CMD-"+Date.now().toString(36).toUpperCase();
const rid=()=>"RES-"+Date.now().toString(36).toUpperCase();
const WA="https://wa.me/2250150512408";
const EDGE="https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email";
const BOOKING=["avion","circuit","voiture","appart"];
const NO_SHIP=["avion","circuit","voiture","appart","formation"];
const BADGE_C={Nouveau:C.green,Bestseller:C.gold,Promo:C.red,Premium:"#9b59b6"};

const CatIcon=({id})=>{const p={size:26,strokeWidth:1.5,color:C.gold};switch(id){case"mode":return<ShoppingBag {...p}/>;case"tech":return<Cpu {...p}/>;case"formation":return<GraduationCap {...p}/>;case"avion":return<Plane {...p}/>;case"circuit":return<Map {...p}/>;case"voiture":return<Car {...p}/>;case"appart":return<Home {...p}/>;default:return<Sparkles {...p}/>;}};

const Spin=({s=20})=><span style={{display:"inline-block",width:s,height:s,border:"2.5px solid #2a2a2a",borderTopColor:C.gold,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;
const GL=()=><div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 0 20px"}}/>;

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0a0a0a;color:#f5f0e8;font-family:'DM Sans',sans-serif;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#9a7a2e;border-radius:4px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{box-shadow:0 0 12px #c9a84c55}50%{box-shadow:0 0 28px #c9a84c99}}
.ch{transition:transform .25s,box-shadow .25s;}.ch:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(201,168,76,.15)!important;}
.bt{transition:filter .15s;}.bt:hover{filter:brightness(1.1);}
.nl{cursor:pointer;transition:color .2s;}.nl:hover{color:#c9a84c!important;}
select option{background:#1c1c1c;color:#f5f0e8;}
@media(max-width:768px){.nav-d{display:none!important;}.gc{grid-template-columns:1fr!important;}.hs{padding:52px 22px 44px!important;}}
`;

export default function App() {
  // ── ALL DATA IN ONE PLACE ──
  const [products,setProducts]=useState([]);
  const [cats,setCats]=useState([{id:"all",label:"Tout"},{id:"mode",label:"Mode"},{id:"tech",label:"Électronique"},{id:"formation",label:"Formations"},{id:"avion",label:"Vols"},{id:"circuit",label:"Circuits"},{id:"voiture",label:"Voitures"},{id:"appart",label:"Appartements"}]);
  const [zones,setZones]=useState([]);
  const [banners,setBanners]=useState([]);
  const [reviews,setReviews]=useState([]);
  const [allVariants,setAllVariants]=useState({}); // {productId: [...variants]}
  const [allImages,setAllImages]=useState({});     // {productId: [...urls]}
  const [loading,setLoading]=useState(true);

  // ── UI STATE ──
  const [page,setPage]=useState("home");
  const [cat,setCat]=useState("all");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState([]);
  const [zone,setZone]=useState(null);
  const [pay,setPay]=useState("fedapay");
  const [modal,setModal]=useState(null); // product object or null
  const [bookModal,setBookModal]=useState(null); // {product,price,acompte}
  const [form,setForm]=useState({name:"",email:"",tel:""});
  const [errs,setErrs]=useState({});
  const [proc,setProc]=useState(false);
  const [notif,setNotif]=useState(null);
  const [rvForm,setRvForm]=useState({name:"",email:"",rating:5,comment:""});
  const [rvSent,setRvSent]=useState(false);
  const [ctForm,setCtForm]=useState({name:"",email:"",tel:"",message:""});
  const [ctSent,setCtSent]=useState(false);
  const [bannerIdx,setBannerIdx]=useState(0);
  const [lastRes,setLastRes]=useState(null);

  // ── LOAD EVERYTHING AT ONCE ──
  useEffect(()=>{
    const loadAll=async()=>{
      try{
        const [p,c,z,b,r,v,img]=await Promise.all([
          sb.from("products").select("*").eq("active",true).order("id"),
          sb.from("categories").select("*").order("position"),
          sb.from("shipping_zones").select("*").order("price"),
          sb.from("banners").select("*").eq("active",true).order("created_at",{ascending:false}),
          sb.from("reviews").select("*").eq("approved",true).order("created_at",{ascending:false}),
          sb.from("product_variants").select("*").eq("active",true),
          sb.from("product_images").select("*").order("position"),
        ]);
        if(p.data) setProducts(p.data);
        if(c.data&&c.data.length>0) setCats([{id:"all",label:"Tout"},...c.data]);
        if(z.data&&z.data.length>0) setZones(z.data);
        else setZones([{id:1,name:"Cotonou",price:1500,free_above:50000,delay:"24-48h"},{id:2,name:"Bénin (hors Cotonou)",price:3000,free_above:100000,delay:"2-4 jours"},{id:3,name:"Togo",price:5000,free_above:150000,delay:"3-5 jours"},{id:4,name:"Côte d'Ivoire",price:7500,free_above:200000,delay:"4-6 jours"},{id:5,name:"International",price:25000,free_above:500000,delay:"7-14 jours"}]);
        if(b.data) setBanners(b.data);
        if(r.data) setReviews(r.data);
        // Group variants by product
        if(v.data){
          const vMap={};
          v.data.forEach(x=>{if(!vMap[x.product_id])vMap[x.product_id]=[];vMap[x.product_id].push(x);});
          setAllVariants(vMap);
        }
        // Group images by product
        if(img.data){
          const iMap={};
          img.data.forEach(x=>{if(!iMap[x.product_id])iMap[x.product_id]=[];iMap[x.product_id].push(x.url);});
          setAllImages(iMap);
        }
      }catch(e){console.error(e);}
      setLoading(false);
    };
    loadAll();
    // Realtime
    const ch=sb.channel("app-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"products"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"banners"},loadAll)
      .on("postgres_changes",{event:"*",schema:"public",table:"reviews"},loadAll)
      .subscribe();
    return()=>sb.removeChannel(ch);
  },[]);

  // Banner auto-slide
  useEffect(()=>{
    if(banners.length<=1)return;
    const t=setInterval(()=>setBannerIdx(i=>(i+1)%banners.length),5000);
    return()=>clearInterval(t);
  },[banners.length]);

  // ── COMPUTED ──
  const cartN=cart.reduce((s,i)=>s+i.qty,0);
  const subtotal=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const needsShip=cart.some(i=>!NO_SHIP.includes(i.cat));
  const shipCost=zone&&needsShip?(zone.free_above>0&&subtotal>=zone.free_above?0:zone.price):0;
  const total=subtotal+shipCost;
  const filtered=products.filter(p=>(cat==="all"||p.cat===cat)&&(p.name||"").toLowerCase().includes(search.toLowerCase()));
  const promos=products.filter(p=>p.orig_price);
  const news=products.filter(p=>p.badge==="Nouveau");
  const best=products.filter(p=>p.badge==="Bestseller");
  const topBanners=banners.filter(b=>!b.position||b.position==="home_top");
  const midBanners=banners.filter(b=>b.position==="home_mid");

  const notify=(msg,color=C.gold)=>{setNotif({msg,color});setTimeout(()=>setNotif(null),3500);};

  const go=(k)=>{setSearch("");if(k==="home")setPage("home");else if(k==="shop"){setCat("all");setPage("shop");}else if(k==="voyages"){setCat("avion");setPage("shop");}else if(k==="formations"){setCat("formation");setPage("shop");}else setPage(k);};

  const addCart=(p,variant)=>{
    const price=variant?variant.price:p.price;
    const vl=variant?[variant.color,variant.storage,variant.size].filter(Boolean).join(" · "):null;
    const key=String(p.id)+(vl||"");
    setCart(prev=>{const ex=prev.find(i=>i._key===key);if(ex)return prev.map(i=>i._key===key?{...i,qty:i.qty+1}:i);return[...prev,{...p,price,variantLabel:vl,qty:1,_key:key}];});
    notify(`✦ ${p.name}${vl?" ("+vl+")":""} ajouté`);
    setModal(null);
  };

  const openBook=(product,price,acompte)=>{setModal(null);setBookModal({product,price,acompte});};

  const doBook=async(info)=>{
    const resId=rid();
    const amt=info.acompte*info.qty;
    await sb.from("reservations").insert({id:resId,client_name:info.name,client_email:info.email||"N/A",client_tel:info.tel,product_id:info.product.id,product_name:info.product.name,product_emoji:info.product.emoji,book_type:info.product.cat,date_from:info.date,persons:info.qty,total:amt,status:"En attente"});
    try{await fetch(EDGE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:"agencesgroup23@gmail.com",subject:`🔔 Réservation — ${info.product.name}`,html:`<div style="font-family:sans-serif;background:#0a0a0a;color:#f5f0e8;padding:24px;border-radius:12px;"><h2 style="color:#c9a84c;">🔔 Réservation S-Mall</h2><p><b>Produit:</b> ${info.product.name}</p><p><b>Client:</b> ${info.name} / ${info.tel}</p><p><b>Date:</b> ${info.date} · ${info.qty} pers.</p><p><b>Acompte:</b> ${fmt(amt)}</p><p><b>Réf:</b> ${resId}</p></div>`})});}catch(e){}
    setBookModal(null);
    setProc(true);
    if(window.FedaPay){
      window.FedaPay.init({public_key:"pk_live_EzI5k531w-Iu-LUAu4I2sluv",transaction:{amount:amt,description:`Acompte ${info.product.name}`},customer:{firstname:info.name.split(" ")[0],lastname:info.name.split(" ").slice(1).join(" ")||".",email:info.email||"client@smallet.com",phone_number:{number:info.tel,country:"bj"}},onComplete:async(r)=>{if(r.reason==="DIALOG DISMISSED"){setProc(false);notify("Annulé",C.red);return;}await sb.from("reservations").update({status:"Acompte reçu"}).eq("id",resId);setProc(false);setLastRes({name:info.name,product:info.product.name,acompte:amt,resId});setPage("resOk");}}).open();
    }else{setProc(false);setLastRes({name:info.name,product:info.product.name,acompte:amt,resId});setPage("resOk");}
  };

  const validate=()=>{const e={};if(!form.name.trim())e.name="Requis";if(!form.email.includes("@"))e.email="Email invalide";if(!form.tel.trim())e.tel="Requis";setErrs(e);return!Object.keys(e).length;};

  const doPay=async()=>{
    if(!validate())return;
    if(needsShip&&!zone){notify("Choisissez une zone de livraison",C.red);return;}
    setProc(true);
    try{
      const oid=uid();
      await sb.from("orders").insert({id:oid,client_name:form.name.trim(),client_email:form.email.trim(),client_tel:form.tel.trim(),items:cart.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price,variant:i.variantLabel||null})),subtotal,shipping:shipCost,total,pay_method:pay,status:"En cours",country:zone?.name||"N/A"});
      try{const dlItems=cart.filter(i=>i.download_url);const dlSection=dlItems.map(i=>`<div style="background:#0a1a0a;border:1px solid #4caf7d44;border-radius:8px;padding:12px;margin:8px 0;"><p style="color:#4caf7d;font-weight:bold;">${i.name}</p><a href="${i.download_url}" style="color:#c9a84c;">${i.download_url}</a></div>`).join("");await fetch(EDGE,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({to:form.email.trim(),subject:`✦ Confirmation S-Mall — ${oid}`,html:`<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0a0a0a;color:#f5f0e8;padding:28px;border-radius:14px;"><h1 style="color:#c9a84c;text-align:center;">✦ S-Mall</h1><div style="background:#161616;border-radius:10px;padding:18px;margin:16px 0;text-align:center;"><h2 style="color:#c9a84c;">Commande confirmée !</h2><p style="color:#888;">Réf : <b style="color:#f5f0e8;">${oid}</b></p></div><p>Bonjour <b>${form.name}</b>,<br/>Merci pour votre commande de <b style="color:#c9a84c;">${fmt(total)}</b>.</p>${dlSection}<p style="color:#555;font-size:12px;text-align:center;margin-top:16px;"><a href="${WA}" style="color:#c9a84c;">WhatsApp</a> · sgroupmall.vercel.app</p></div>`})});}catch(e){}
      if(window.FedaPay){
        // FedaPay handles both Mobile Money and Card payments
        window.FedaPay.init({
          public_key:"pk_live_EzI5k531w-Iu-LUAu4I2sluv",
          transaction:{amount:total,description:`Commande S-Mall ${oid}`},
          customer:{firstname:form.name.split(" ")[0],lastname:form.name.split(" ").slice(1).join(" ")||".",email:form.email,phone_number:{number:form.tel,country:"bj"}},
          onComplete:async(r)=>{
            if(r.reason==="DIALOG DISMISSED"){setProc(false);notify("Annulé",C.red);return;}
            await sb.from("orders").update({status:"Confirmé"}).eq("id",oid);
            setProc(false);setCart([]);setZone(null);setPage("ok");
          }
        }).open();
      } else {setProc(false);setCart([]);setZone(null);setPage("ok");}
    }catch(e){setProc(false);notify("Erreur. Réessayez.",C.red);}
  };

  // ── MINI COMPONENTS (no async/useEffect) ──
  const Banner=({items})=>{
    if(!items||!items.length)return null;
    const b=items[Math.min(bannerIdx,items.length-1)];
    if(!b||!b.media_url)return null;
    return(
      <div style={{position:"relative",borderRadius:16,overflow:"hidden",cursor:b.link_url?"pointer":"default"}} onClick={()=>b.link_url&&window.open(b.link_url,"_blank")}>
        {b.media_type==="video"?<video src={b.media_url} autoPlay muted loop playsInline style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>:<img src={b.media_url} alt={b.title||""} style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>}
        {b.title&&<div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.75))",padding:"20px 16px 12px"}}><p style={{color:"#fff",fontWeight:700,fontSize:15}}>{b.title}</p></div>}
        {items.length>1&&<div style={{position:"absolute",bottom:10,right:12,display:"flex",gap:5}}>{items.map((_,i)=><div key={i} onClick={e=>{e.stopPropagation();setBannerIdx(i);}} style={{width:i===bannerIdx?18:6,height:6,borderRadius:999,background:i===bannerIdx?C.gold:"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s"}}/>)}</div>}
      </div>
    );
  };

  const Card=({p,i})=>{
    const isB=BOOKING.includes(p.cat);
    const imgs=allImages[p.id]||[];
    const img=imgs[0]||p.image_url;
    return(
      <div className="ch" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,overflow:"hidden",animation:`fadeUp .3s ease ${Math.min(i,8)*.04}s both`}}>
        <div onClick={()=>setModal(p)} style={{height:150,position:"relative",overflow:"hidden",cursor:"pointer",background:"linear-gradient(135deg,#161200,#201a00)"}}>
          {img?<img src={img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:52}}>{p.emoji}</div>}
          {p.badge&&<span style={{position:"absolute",top:8,right:8,background:BADGE_C[p.badge]||C.gold,color:p.badge==="Bestseller"?C.bg:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,textTransform:"uppercase"}}>{p.badge}</span>}
          {p.orig_price&&<span style={{position:"absolute",top:8,left:8,background:C.red,color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999}}>-{pct(p.orig_price,p.price)}%</span>}
          {isB&&<span style={{position:"absolute",bottom:8,left:8,background:"rgba(245,158,11,.85)",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999,display:"flex",alignItems:"center",gap:3}}><Percent size={8}/>Acompte 10%</span>}
        </div>
        <div style={{padding:"14px 16px"}}>
          <p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:3,cursor:"pointer",lineHeight:1.3}} onClick={()=>setModal(p)}>{p.name}</p>
          <p style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.5}}>{(p.desc||p.description||"").slice(0,60)}{(p.desc||p.description||"").length>60?"…":""}</p>
          <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:900,color:C.gold,marginBottom:10}}>{fmt(p.price)}</p>
          <div style={{display:"flex",gap:7}}>
            <button type="button" onClick={()=>setModal(p)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"7px",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Eye size={11}/>Détail</button>
            {isB?<button type="button" className="bt" onClick={()=>setModal(p)} style={{flex:1,background:`${C.blue}20`,border:`1.5px solid ${C.blue}`,color:C.blue,borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Calendar size={11}/>Réserver</button>
            :<button type="button" className="bt" onClick={()=>addCart(p,null)} style={{flex:1,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ShoppingCart size={11}/>Ajouter</button>}
          </div>
        </div>
      </div>
    );
  };

  // ── MODAL (uses pre-loaded data — NO async) ──
  const Modal=()=>{
    if(!modal)return null;
    const p=modal;
    const variants=allVariants[p.id]||[];
    const imgs=allImages[p.id]||[];
    const allImgs=imgs.length>0?imgs:(p.image_url?[p.image_url]:[]);
    const isB=BOOKING.includes(p.cat);
    const [cur,setCur]=useState(0);
    const [selS,setSelS]=useState(null);
    const [selC,setSelC]=useState(null);
    const [selZ,setSelZ]=useState(null);
    const storages=[...new Set(variants.filter(v=>v.storage).map(v=>v.storage))];
    const sizes=[...new Set(variants.filter(v=>v.size).map(v=>v.size))];
    const colors=storages.length>0?(selS?[...new Map(variants.filter(v=>v.storage===selS&&v.color).map(v=>[v.color,{name:v.color,hex:v.color_hex||"#888"}])).values()]:[]):[...new Map(variants.filter(v=>v.color).map(v=>[v.color,{name:v.color,hex:v.color_hex||"#888"}])).values()];
    const hasV=variants.length>0;
    const matched=hasV?variants.find(v=>(storages.length===0||v.storage===selS)&&(colors.length===0||v.color===selC)&&(sizes.length===0||v.size===selZ)):null;
    const price=matched?matched.price:(hasV?Math.min(...variants.map(v=>v.price)):p.price);
    const acompte=Math.round(price*.10);
    const canAdd=!hasV||!!matched;
    const cat=cats.find(c=>c.id===p.cat);
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.93)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={()=>setModal(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,width:"100%",maxWidth:640,margin:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.95)"}}>
          <div style={{position:"relative",borderRadius:"22px 22px 0 0",overflow:"hidden",height:260,background:"#000"}}>
            {allImgs.length>0?<img src={allImgs[cur]} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>:<div style={{height:260,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,background:"linear-gradient(135deg,#161200,#201a00)"}}>{p.emoji}</div>}
            {allImgs.length>1&&<>
              <button type="button" onClick={()=>setCur(c=>c===0?allImgs.length-1:c-1)} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.6)",border:"none",color:"#fff",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
              <button type="button" onClick={()=>setCur(c=>c===allImgs.length-1?0:c+1)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.6)",border:"none",color:"#fff",borderRadius:"50%",width:34,height:34,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
              <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",display:"flex",gap:5}}>{allImgs.map((_,i)=><button key={i} type="button" onClick={()=>setCur(i)} style={{width:i===cur?18:6,height:6,borderRadius:999,background:i===cur?C.gold:"rgba(255,255,255,.4)",border:"none",cursor:"pointer",padding:0,transition:"all .2s"}}/>)}</div>
            </>}
            {p.orig_price&&<span style={{position:"absolute",top:10,left:10,background:C.red,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:999,zIndex:5}}>-{pct(p.orig_price,p.price)}%</span>}
            {p.badge&&<span style={{position:"absolute",top:10,right:44,background:BADGE_C[p.badge]||C.gold,color:p.badge==="Bestseller"?C.bg:"#fff",fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:999,zIndex:5}}>{p.badge}</span>}
            <button type="button" onClick={()=>setModal(null)} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.7)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",zIndex:5,fontSize:18}}>×</button>
          </div>
          <div style={{padding:"20px 24px"}}>
            {cat&&<p style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:5}}>{cat.label}</p>}
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:900,color:C.white,marginBottom:8,lineHeight:1.3}}>{p.name}</h2>
            {(p.desc||p.description)&&<p style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:12}}>{p.desc||p.description}</p>}
            <GL/>
            {storages.length>0&&<div style={{marginBottom:14}}><p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Capacité</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{storages.map(s=>{const minP=Math.min(...variants.filter(v=>v.storage===s).map(v=>v.price));return<button key={s} type="button" onClick={()=>{setSelS(selS===s?null:s);setSelC(null);}} style={{padding:"7px 14px",borderRadius:10,border:`2px solid ${selS===s?C.gold:C.border}`,background:selS===s?`${C.gold}18`:C.card2,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all .15s"}}><span style={{fontWeight:700,fontSize:13,color:selS===s?C.gold:C.white}}>{s}</span><span style={{fontSize:10,color:C.muted}}>{fmt(minP)}</span></button>;})}}</div></div>}
            {colors.length>0&&<div style={{marginBottom:14}}><p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Couleur{selC?<span style={{color:C.white,fontWeight:400}}> — {selC}</span>:""}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{colors.map(col=><button key={col.name} type="button" onClick={()=>setSelC(selC===col.name?null:col.name)} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:999,border:`2px solid ${selC===col.name?C.gold:"transparent"}`,background:C.card2,cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}><div style={{width:16,height:16,borderRadius:"50%",background:col.hex,border:"1px solid rgba(255,255,255,.2)",flexShrink:0}}/><span style={{fontSize:12,color:selC===col.name?C.gold:C.muted,fontWeight:600}}>{col.name}</span></button>)}</div></div>}
            {sizes.length>0&&<div style={{marginBottom:14}}><p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:8}}>Taille</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{sizes.map(s=><button key={s} type="button" onClick={()=>setSelZ(selZ===s?null:s)} style={{width:44,height:44,borderRadius:10,border:`2px solid ${selZ===s?C.gold:C.border}`,background:selZ===s?`${C.gold}18`:C.card2,color:selZ===s?C.gold:C.white,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}>{s}</button>)}</div></div>}
            <div style={{background:C.card2,border:`1px solid ${matched||!hasV?C.gold:C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:12,transition:"border-color .2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:isB?8:0}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,color:C.gold}}>{fmt(price)}</span>
                {p.orig_price&&<span style={{textDecoration:"line-through",color:C.muted,fontSize:13}}>{fmt(p.orig_price)}</span>}
                {matched&&<span style={{fontSize:11,color:C.green,fontWeight:700,background:`${C.green}15`,padding:"2px 9px",borderRadius:999}}>✓</span>}
              </div>
              {isB&&<div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",background:`${C.orange}12`,border:`1px solid ${C.orange}33`,borderRadius:8}}><Percent size={12} color={C.orange}/><span style={{fontSize:12,color:C.orange,fontWeight:700}}>Acompte 10% : {fmt(acompte)}</span></div>}
            </div>
            {hasV&&!matched&&<p style={{fontSize:12,color:C.orange,fontWeight:600,background:`${C.orange}10`,padding:"8px 12px",borderRadius:8,textAlign:"center",marginBottom:12}}>Veuillez sélectionner vos options</p>}
            {isB
              ?<button type="button" className="bt" onClick={()=>canAdd&&openBook(p,price,acompte)} disabled={!canAdd} style={{width:"100%",background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:canAdd?C.bg:C.muted,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:canAdd?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Calendar size={15}/>{canAdd?`Réserver — acompte ${fmt(acompte)}`:"Sélectionner les options"}</button>
              :<button type="button" className="bt" onClick={()=>canAdd&&addCart(p,matched)} disabled={!canAdd} style={{width:"100%",background:canAdd?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:canAdd?C.bg:C.muted,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:14,cursor:canAdd?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><ShoppingCart size={15}/>{canAdd?"Ajouter au panier":"Sélectionner les options"}</button>
            }
          </div>
        </div>
      </div>
    );
  };

  const BookModal=()=>{
    if(!bookModal)return null;
    const {product,price,acompte}=bookModal;
    const [bf,setBf]=useState({name:"",email:"",tel:"",date:"",qty:1});
    const [err,setErr]=useState("");
    const [calOpen,setCalOpen]=useState(false);
    const today=new Date();
    const [view,setView]=useState({y:today.getFullYear(),m:today.getMonth()});
    const days=new Date(view.y,view.m+1,0).getDate();
    const first=new Date(view.y,view.m,1).getDay();
    const MONTHS=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    const pickDate=d=>{const dt=new Date(view.y,view.m,d);if(dt<new Date(today.getFullYear(),today.getMonth(),today.getDate()))return;setBf(f=>({...f,date:`${String(d).padStart(2,"0")}/${String(view.m+1).padStart(2,"0")}/${view.y}`}));setCalOpen(false);};
    const confirm=()=>{if(!bf.name.trim()||!bf.tel.trim()||!bf.date){setErr("Remplissez tous les champs");return;}setErr("");doBook({...bf,product,acompte,price});};
    return(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setBookModal(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,padding:28,width:"100%",maxWidth:440}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div><h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:C.gold}}>{product.name}</h3><p style={{fontSize:12,color:C.muted,marginTop:3}}>Réservation avec acompte 10%</p></div>
            <button type="button" onClick={()=>setBookModal(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={13}/></button>
          </div>
          <GL/>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[["name","Votre nom *","text"],["email","Email","email"],["tel","Téléphone / WhatsApp *","tel"]].map(([f,l,t])=>(
              <div key={f}><label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>{l}</label><input type={t} value={bf[f]} onChange={e=>setBf(x=>({...x,[f]:e.target.value}))} placeholder={l.replace(" *","")} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/></div>
            ))}
            <div style={{position:"relative"}}>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Date souhaitée *</label>
              <button type="button" onClick={()=>setCalOpen(o=>!o)} style={{width:"100%",background:C.card2,border:`1.5px solid ${bf.date?C.gold:C.border}`,borderRadius:10,padding:"10px 13px",color:bf.date?C.gold:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>{bf.date||"Choisir une date"}</span><Calendar size={14} color={bf.date?C.gold:C.muted}/></button>
              {calOpen&&<div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:600,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,width:240,boxShadow:"0 20px 50px rgba(0,0,0,.9)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <button type="button" onClick={()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:7,padding:"3px 10px",cursor:"pointer"}}>‹</button>
                  <span style={{fontWeight:700,fontSize:13,color:C.white}}>{MONTHS[view.m]} {view.y}</span>
                  <button type="button" onClick={()=>setView(v=>v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:7,padding:"3px 10px",cursor:"pointer"}}>›</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["Di","Lu","Ma","Me","Je","Ve","Sa"].map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:C.muted,fontWeight:700}}>{d}</div>)}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                  {Array(first).fill(null).map((_,i)=><div key={"e"+i}/>)}
                  {Array(days).fill(null).map((_,i)=>{const d=i+1,dt=new Date(view.y,view.m,d),past=dt<new Date(today.getFullYear(),today.getMonth(),today.getDate());return<button key={d} type="button" onClick={()=>pickDate(d)} style={{textAlign:"center",fontSize:12,padding:"5px 0",borderRadius:7,border:"none",background:past?"transparent":C.card2,color:past?C.border:C.white,cursor:past?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif"}}>{d}</button>;})}
                </div>
              </div>}
            </div>
            <div><label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:6}}>Nombre de personnes</label><div style={{display:"flex",alignItems:"center",gap:12}}><button type="button" onClick={()=>setBf(f=>({...f,qty:Math.max(1,f.qty-1)}))} style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Minus size={13}/></button><span style={{fontWeight:800,fontSize:18,minWidth:20,textAlign:"center"}}>{bf.qty}</span><button type="button" onClick={()=>setBf(f=>({...f,qty:f.qty+1}))} style={{width:34,height:34,borderRadius:9,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Plus size={13}/></button></div></div>
            {err&&<p style={{color:C.red,fontSize:12,fontWeight:600}}>⚠ {err}</p>}
            <div style={{background:`${C.orange}12`,border:`1px solid ${C.orange}33`,borderRadius:12,padding:"12px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:6}}><span style={{color:C.muted}}>Montant total</span><span style={{fontWeight:700}}>{fmt(price*bf.qty)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:15}}><span style={{color:C.orange,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><Percent size={13}/>Acompte (10%)</span><span style={{fontWeight:900,color:C.orange}}>{fmt(acompte*bf.qty)}</span></div>
            </div>
            <button type="button" className="bt" onClick={confirm} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"13px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Calendar size={15}/>Confirmer — {fmt(acompte*bf.qty)}</button>
            <p style={{fontSize:11,color:C.muted,textAlign:"center"}}>Le solde ({fmt((price-acompte)*bf.qty)}) sera finalisé via WhatsApp/Email</p>
          </div>
        </div>
      </div>
    );
  };

  const InpF=({f,pl,t="text"})=><div><input type={t} value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} placeholder={pl} style={{width:"100%",background:C.card2,border:`1.5px solid ${errs[f]?C.red:C.border}`,borderRadius:10,padding:"11px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>{errs[f]&&<p style={{color:C.red,fontSize:11,marginTop:3}}>{errs[f]}</p>}</div>;

  // ── RENDER ──
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.white,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{CSS}</style>
      {notif&&<div style={{position:"fixed",top:16,right:16,zIndex:9999,background:C.card,border:`1px solid ${notif.color}`,color:notif.color,padding:"11px 18px",borderRadius:12,fontWeight:700,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,.6)",animation:"fadeUp .3s ease",maxWidth:280,pointerEvents:"none"}}>{notif.msg}</div>}
      <Modal/>
      <BookModal/>

      {/* NAV */}
      <nav style={{background:"rgba(10,10,10,.97)",backdropFilter:"blur(12px)",padding:"0 28px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>go("home")}>
          <div style={{width:34,height:34,borderRadius:9,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,animation:"glow 3s ease infinite"}}>✦</div>
          <div><span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span><span style={{fontSize:8,color:C.muted,display:"block",letterSpacing:3,textTransform:"uppercase"}}>Premium Store</span></div>
        </div>
        <div className="nav-d" style={{display:"flex",gap:20,alignItems:"center"}}>
          {[["Accueil","home"],["Boutique","shop"],["Voyages","voyages"],["Formations","formations"],["Contact","contact"]].map(([l,k])=><span key={k} className="nl" style={{fontWeight:600,fontSize:13,color:page===k?C.gold:C.muted}} onClick={()=>go(k)}>{l}</span>)}
        </div>
        <button type="button" className="bt" onClick={()=>setPage("cart")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"9px 16px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"'DM Sans',sans-serif"}}>
          <ShoppingCart size={15}/>{cartN>0&&<span style={{background:C.bg,color:C.gold,borderRadius:999,padding:"1px 6px",fontSize:11,fontWeight:800}}>{cartN}</span>}Panier
        </button>
      </nav>

      {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"80px 0"}}><Spin s={24}/><span style={{color:C.muted,fontSize:15}}>Chargement…</span></div>}

      {/* HOME */}
      {!loading&&page==="home"&&<div>
        <div className="hs" style={{position:"relative",overflow:"hidden",padding:"80px 56px 70px",background:"linear-gradient(135deg,#0a0a0a 0%,#1a1400 50%,#0a0a0a 100%)"}}>
          <div style={{position:"absolute",top:-80,left:-60,width:380,height:380,borderRadius:"50%",background:`radial-gradient(circle,${C.gold}14 0%,transparent 70%)`,pointerEvents:"none"}}/>
          <div style={{maxWidth:620,animation:"fadeUp .6s ease"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:4,textTransform:"uppercase",fontSize:11,marginBottom:14}}>✦ Bienvenue sur S-Mall</p>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:46,fontWeight:900,lineHeight:1.1,marginBottom:16}}>Mode. Tech. Voyages.<br/><span style={{background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tout en un lieu.</span></h1>
            <p style={{color:C.muted,fontSize:15,lineHeight:1.7,maxWidth:460,marginBottom:28}}>Vêtements, électronique, formations, vols, circuits Bénin · Togo · CIV, voitures & appartements.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button type="button" className="bt" onClick={()=>go("shop")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"13px 26px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>Explorer<ArrowRight size={14}/></button>
              <button type="button" onClick={()=>{setCat("circuit");setPage("shop");}} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:13,padding:"13px 20px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Circuits</button>
              <button type="button" onClick={()=>{setCat("avion");setPage("shop");}} style={{background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,borderRadius:13,padding:"13px 20px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Vols</button>
            </div>
          </div>
        </div>
        {topBanners.length>0&&<div style={{maxWidth:1180,margin:"0 auto",padding:"22px 28px 0"}}><Banner items={topBanners}/></div>}
        <div style={{maxWidth:1180,margin:"0 auto",padding:"40px 28px"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:6}}>✦ Nos univers</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,textAlign:"center",marginBottom:8}}>Que cherchez-vous ?</h2>
          <GL/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:12}}>
            {cats.filter(c=>c.id!=="all").map((c,i)=><div key={c.id} className="ch" onClick={()=>{setCat(c.id);setPage("shop");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 12px",textAlign:"center",cursor:"pointer",animation:`fadeUp .35s ease ${i*.04}s both`}}><div style={{display:"flex",justifyContent:"center",marginBottom:8}}><CatIcon id={c.id}/></div><p style={{fontWeight:700,fontSize:12,color:C.white}}>{c.label}</p><p style={{fontSize:10,color:C.gold,marginTop:2}}>{products.filter(p=>p.cat===c.id).length} articles</p></div>)}
          </div>
        </div>
        {promos.length>0&&<div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><Flame size={15} color={C.red}/><p style={{color:C.red,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Offres du moment</p></div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Promotions</h2><GL/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>{promos.slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}</div></div>}
        {midBanners.length>0&&<div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}><Banner items={midBanners}/></div>}
        {news.length>0&&<div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><Sparkles size={15} color={C.green}/><p style={{color:C.green,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Tout juste arrivé</p></div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Nouveautés</h2><GL/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>{news.slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}</div></div>}
        {best.length>0&&<div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}><TrendingUp size={15} color={C.gold}/><p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11}}>Les plus demandés</p></div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Bestsellers</h2><GL/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>{best.slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}</div></div>}
        <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 40px"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:6}}>⭐ Témoignages</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,textAlign:"center",marginBottom:8}}>Ce que disent nos clients</h2>
          <GL/>
          {reviews.length===0?<div style={{textAlign:"center",padding:"28px 0",color:C.muted}}><Star size={38} strokeWidth={1} style={{margin:"0 auto 10px",display:"block"}} color={C.muted}/><p style={{fontSize:14,fontWeight:600}}>Soyez le premier à laisser un avis !</p><button type="button" onClick={()=>setPage("contact")} style={{marginTop:12,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Laisser un avis</button></div>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>{reviews.slice(0,6).map((r,i)=><div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",animation:`fadeUp .35s ease ${i*.05}s both`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div><p style={{fontWeight:700,fontSize:14,color:C.white}}>{r.client_name}</p><p style={{fontSize:10,color:C.muted}}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p></div><div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:13,color:s<=r.rating?C.gold:"#333"}}>★</span>)}</div></div><p style={{fontSize:13,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>"{r.comment}"</p></div>)}</div>}
          <div style={{textAlign:"center",marginTop:18}}><button type="button" onClick={()=>setPage("contact")} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:11,padding:"9px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✦ Laisser un avis</button></div>
        </div>
        <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 48px"}}><div style={{background:"linear-gradient(135deg,#1c0a08,#2a1008)",border:"1px solid rgba(232,83,63,.27)",borderRadius:18,padding:"28px 36px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:18}}><div><p style={{color:"#e8533f",fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:7}}>⚡ Formations en ligne</p><h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,marginBottom:5}}>Formations & Ebooks</h3><p style={{color:C.muted,fontSize:13,maxWidth:380,lineHeight:1.6}}>Lien d'accès envoyé automatiquement par email dès le paiement.</p></div><button type="button" className="bt" onClick={()=>{setCat("formation");setPage("shop");}} style={{background:"linear-gradient(135deg,#c0392b,#e8533f)",color:"#fff",border:"none",borderRadius:13,padding:"11px 22px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Voir les formations →</button></div></div>
      </div>}

      {/* SHOP */}
      {!loading&&page==="shop"&&<div style={{maxWidth:1180,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
        <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"9px 14px",gap:8}}><Search size={14} color={C.gold}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>{search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer"}}><X size={13}/></button>}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cats.map(c=><button key={c.id} type="button" onClick={()=>setCat(c.id)} style={{padding:"7px 13px",borderRadius:999,border:`1.5px solid ${cat===c.id?C.gold:C.border}`,background:cat===c.id?`${C.gold}18`:"transparent",color:cat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>{c.label}</button>)}</div>
        </div>
        <p style={{color:C.muted,fontSize:12,marginBottom:16}}>{filtered.length} article{filtered.length!==1?"s":""}</p>
        {filtered.length===0?<div style={{textAlign:"center",padding:"60px 0",color:C.muted}}><Search size={44} strokeWidth={1} style={{margin:"0 auto 12px",display:"block"}} color={C.muted}/><p style={{fontSize:15,fontWeight:600}}>Aucun résultat</p></div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>{filtered.map((p,i)=><Card key={p.id} p={p} i={i}/>)}</div>}
      </div>}

      {/* CART */}
      {page==="cart"&&<div style={{maxWidth:940,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
        <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:5}}>✦ Mon panier</p>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,marginBottom:18}}>{cartN} article{cartN!==1?"s":""}</h2>
        <GL/>
        {cart.length===0?<div style={{textAlign:"center",padding:"70px 0"}}><ShoppingCart size={52} strokeWidth={1} color={C.muted} style={{margin:"0 auto 14px",display:"block"}}/><p style={{fontWeight:700,fontSize:16,color:C.muted,marginBottom:18}}>Votre panier est vide</p><button type="button" className="bt" onClick={()=>go("shop")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"12px 26px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Parcourir la boutique</button></div>
        :<div className="gc" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {cart.map((item,idx)=><div key={idx} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:50,height:50,borderRadius:11,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,overflow:"hidden",border:`1px solid ${C.border}`}}>{item.image_url?<img src={item.image_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:<span>{item.emoji}</span>}</div>
              <div style={{flex:1}}><p style={{fontWeight:700,fontSize:13,color:C.white,marginBottom:2}}>{item.name}</p>{item.variantLabel&&<p style={{fontSize:11,color:C.gold,marginBottom:2}}>{item.variantLabel}</p>}<p style={{color:C.gold,fontWeight:700,fontSize:13}}>{fmt(item.price)}</p></div>
              <div style={{display:"flex",alignItems:"center",gap:7}}><button type="button" onClick={()=>setCart(prev=>prev.map((it,i)=>i===idx?{...it,qty:Math.max(1,it.qty-1)}:it))} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><Minus size={11}/></button><span style={{fontWeight:800,fontSize:13,minWidth:18,textAlign:"center"}}>{item.qty}</span><button type="button" onClick={()=>setCart(prev=>prev.map((it,i)=>i===idx?{...it,qty:it.qty+1}:it))} style={{width:26,height:26,borderRadius:7,border:`1px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}><Plus size={11}/></button></div>
              <div style={{textAlign:"right",minWidth:78}}><p style={{fontWeight:900,fontSize:13,color:C.white,marginBottom:4}}>{fmt(item.price*item.qty)}</p><button type="button" onClick={()=>setCart(prev=>prev.filter((_,i)=>i!==idx))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:3,marginLeft:"auto"}}><Trash2 size={10}/>Retirer</button></div>
            </div>)}
            <button type="button" onClick={()=>go("shop")} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:11,padding:"10px",fontWeight:600,fontSize:13,color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ChevronLeft size={13}/>Continuer mes achats</button>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20,position:"sticky",top:76}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,marginBottom:16}}>Récapitulatif</h3>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
              {needsShip&&<div><label style={{fontSize:12,fontWeight:700,color:C.muted,display:"flex",alignItems:"center",gap:5,marginBottom:7}}><MapPin size={11}/>Zone de livraison</label><select value={zone?.id||""} onChange={e=>{const z=zones.find(z=>String(z.id)===e.target.value);setZone(z||null);}} style={{width:"100%",background:C.card2,border:`1.5px solid ${zone?C.gold:C.border}`,borderRadius:9,padding:"9px 11px",color:zone?C.white:C.muted,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}><option value="">-- Choisir --</option>{zones.map(z=><option key={z.id} value={String(z.id)}>{z.name} — {z.free_above>0&&subtotal>=z.free_above?"Gratuite":fmt(z.price)} ({z.delay})</option>)}</select></div>}
              {needsShip&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13}}><span style={{color:C.muted,display:"flex",alignItems:"center",gap:4}}><Truck size={11}/>Livraison</span><span style={{fontWeight:700,color:!zone?C.muted:shipCost===0?C.green:C.white}}>{!zone?"À choisir":shipCost===0?"Gratuite 🎉":fmt(shipCost)}</span></div>}
              {zone&&zone.free_above>0&&subtotal<zone.free_above&&<p style={{fontSize:11,color:C.muted,background:"#1a1200",padding:"6px 9px",borderRadius:7}}>💡 Encore {fmt(zone.free_above-subtotal)} pour la livraison gratuite</p>}
              {zone&&<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:C.muted}}><Clock size={10}/>{zone.delay}</div>}
              <div style={{height:1,background:C.border}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontFamily:"'Playfair Display',serif",fontWeight:900}}><span>Total</span><span style={{color:C.gold}}>{fmt(total)}</span></div>
            </div>
            <button type="button" className="bt" onClick={()=>setPage("checkout")} disabled={needsShip&&!zone} style={{width:"100%",marginTop:14,background:(!needsShip||zone)?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:(!needsShip||zone)?C.bg:C.muted,border:"none",borderRadius:13,padding:"12px",fontWeight:700,fontSize:14,cursor:(!needsShip||zone)?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>{needsShip&&!zone?"Choisissez une zone":"Passer la commande →"}</button>
          </div>
        </div>}
      </div>}

      {/* CHECKOUT */}
      {page==="checkout"&&<div style={{maxWidth:840,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
        <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:5}}>✦ Finaliser</p>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:18}}>Paiement sécurisé</h2>
        <GL/>
        <div className="gc" style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20,alignItems:"start"}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,marginBottom:14,color:C.gold}}>👤 Vos informations</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}><InpF f="name" pl="Nom complet"/><InpF f="email" pl="Email" t="email"/><InpF f="tel" pl="Téléphone" t="tel"/></div>
            </div>
            {needsShip&&zone&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:8}}><Truck size={14} color={C.gold}/><div><p style={{fontWeight:700,fontSize:13,color:C.white}}>{zone.name}</p><p style={{fontSize:11,color:C.muted,marginTop:2}}>{zone.delay}</p></div></div><span style={{fontWeight:800,fontSize:14,color:shipCost===0?C.green:C.gold}}>{shipCost===0?"Gratuite":fmt(shipCost)}</span></div></div>}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:15,marginBottom:14,color:C.gold}}>💳 Paiement</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[{id:"fedapay",l:"Mobile Money",c:"#e8a020",s:"MTN · Moov · Wave · Orange",i:<Phone size={17} strokeWidth={1.5}/>},{id:"card",l:"Carte Visa/Mastercard",c:"#635BFF",s:"Cartes internationales",i:<CreditCard size={17} strokeWidth={1.5}/>}].map(m=><button key={m.id} type="button" onClick={()=>setPay(m.id)} style={{border:`2px solid ${pay===m.id?m.c:C.border}`,borderRadius:11,padding:"12px 8px",background:pay===m.id?`${m.c}14`:"#111",cursor:"pointer",textAlign:"center",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}><div style={{marginBottom:4,display:"flex",justifyContent:"center",color:pay===m.id?m.c:"#444"}}>{m.i}</div><div style={{fontWeight:700,fontSize:12,color:pay===m.id?m.c:C.white}}>{m.l}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.s}</div></button>)}
              </div>
              {pay==="fedapay"&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"#0a1800",borderRadius:9,border:`1px solid ${C.green}44`}}><Lock size={11} color={C.green}/><span style={{fontSize:12,color:C.green,fontWeight:600}}>Paiement sécurisé via FedaPay</span></div>}
              {pay==="card"&&<div style={{background:"#635BFF12",border:"1px solid #635BFF33",borderRadius:10,padding:"12px 14px"}}><p style={{fontWeight:700,fontSize:12,color:"#635BFF",marginBottom:6}}>💳 Paiement par carte via FedaPay</p><p style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Visa · Mastercard · Cartes internationales acceptées.<br/>Vous serez redirigé vers la page sécurisée FedaPay.</p><div style={{display:"flex",alignItems:"center",gap:7,marginTop:10,padding:"7px 10px",background:"#0a1800",borderRadius:8,border:`1px solid ${C.green}44`}}><Lock size={11} color={C.green}/><span style={{fontSize:11,color:C.green,fontWeight:600}}>SSL sécurisé · FedaPay</span></div></div>}
            </div>
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:18,position:"sticky",top:76}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,marginBottom:13}}>Votre commande</h3>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:13,maxHeight:160,overflowY:"auto"}}>
              {cart.map((item,idx)=><div key={idx} style={{display:"flex",gap:8,alignItems:"flex-start"}}><div style={{width:28,height:28,borderRadius:7,background:C.card2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{item.emoji}</div><div style={{flex:1}}><p style={{fontWeight:600,fontSize:12,color:C.white}}>{item.name}</p>{item.variantLabel&&<p style={{fontSize:10,color:C.gold}}>{item.variantLabel}</p>}<p style={{color:C.muted,fontSize:10}}>×{item.qty}</p></div><span style={{fontWeight:800,fontSize:11,color:C.gold,flexShrink:0}}>{fmt(item.price*item.qty)}</span></div>)}
            </div>
            <div style={{height:1,background:C.border,marginBottom:10}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:10}}><span style={{color:C.muted}}>Livraison</span><span style={{fontWeight:700,color:shipCost===0?C.green:C.white}}>{shipCost===0?"Gratuite":fmt(shipCost)}</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,marginBottom:14}}><span>Total</span><span style={{color:C.gold}}>{fmt(total)}</span></div>
            <button type="button" className="bt" onClick={doPay} disabled={proc} style={{width:"100%",background:proc?"#2a2a2a":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:proc?C.muted:C.bg,border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:13,cursor:proc?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{proc?<><Spin s={15}/>Traitement…</>:`Confirmer — ${fmt(total)}`}</button>
            <button type="button" onClick={()=>setPage("cart")} style={{width:"100%",marginTop:8,background:"none",border:"none",color:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"6px",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><ChevronLeft size={12}/>Retour au panier</button>
          </div>
        </div>
      </div>}

      {/* SUCCESS */}
      {page==="ok"&&<div style={{maxWidth:480,margin:"60px auto",padding:"0 22px",textAlign:"center"}}><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"44px 36px"}}><div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"glow 2s ease infinite"}}><CheckCircle size={34} color={C.bg} strokeWidth={2.5}/></div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,marginBottom:10}}>Commande confirmée !</h2><p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:20}}>Merci ! Un email de confirmation vous a été envoyé.</p><button type="button" className="bt" onClick={()=>{setPage("home");setForm({name:"",email:"",tel:""});setErrs({});}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retour à l'accueil</button></div></div>}

      {/* RESERVATION SUCCESS */}
      {page==="resOk"&&<div style={{maxWidth:480,margin:"60px auto",padding:"0 22px",textAlign:"center"}}><div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"44px 36px"}}><div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,#1a6b2e,${C.green})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"glow 2s ease infinite"}}><Calendar size={34} color="#fff" strokeWidth={2}/></div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:900,marginBottom:10,color:C.green}}>Réservation enregistrée !</h2><p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:8}}>Votre acompte de <strong style={{color:C.gold}}>{fmt(lastRes?.acompte||0)}</strong> a été reçu.</p><p style={{color:C.muted,fontSize:13,lineHeight:1.7,marginBottom:20}}>Notre équipe vous contactera via WhatsApp/Email pour finaliser.</p><a href={`${WA}?text=Bonjour%20S-Mall%2C%20j'ai%20réservé%20${encodeURIComponent(lastRes?.product||"")}%20-%20Réf:%20${lastRes?.resId||""}`} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#25d366",color:"#fff",borderRadius:13,padding:"12px",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'DM Sans',sans-serif",marginBottom:12}}><MessageCircle size={17}/>Contacter via WhatsApp</a><button type="button" onClick={()=>setPage("home")} style={{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 22px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retour à l'accueil</button></div></div>}

      {/* CONTACT */}
      {page==="contact"&&<div style={{maxWidth:760,margin:"0 auto",padding:"36px 28px",animation:"fadeUp .35s ease"}}>
        <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:5}}>✦ Nous contacter</p>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Parlons-nous</h2>
        <GL/>
        <div className="gc" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,marginBottom:5}}>📬 Message</h3>
            <p style={{fontSize:13,color:C.muted,marginBottom:18}}>Réponse sous 24h</p>
            {ctSent?<div style={{textAlign:"center",padding:"28px 0"}}><CheckCircle size={40} color={C.green} strokeWidth={1.5} style={{margin:"0 auto 10px",display:"block"}}/><p style={{fontWeight:700,fontSize:14,color:C.green,marginBottom:6}}>Message envoyé !</p><button type="button" onClick={()=>setCtSent(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Envoyer un autre</button></div>
            :<div style={{display:"flex",flexDirection:"column",gap:11}}>
              {[["name","Votre nom *","Nom complet","text"],["email","Email","votre@email.com","email"],["tel","Téléphone","WhatsApp ou mobile","tel"]].map(([f,l,p,t])=><div key={f}><label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>{l}</label><input type={t} value={ctForm[f]} onChange={e=>setCtForm(cf=>({...cf,[f]:e.target.value}))} placeholder={p} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/></div>)}
              <div><label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Message *</label><textarea value={ctForm.message} onChange={e=>setCtForm(cf=>({...cf,message:e.target.value}))} placeholder="Votre message…" rows={4} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"10px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/></div>
              <button type="button" className="bt" onClick={async()=>{if(!ctForm.name.trim()||!ctForm.message.trim()){notify("Remplissez nom et message",C.red);return;}await sb.from("messages").insert({from_name:ctForm.name,from_email:ctForm.email||"N/A",subject:`Contact S-Mall — ${ctForm.name}`,message:ctForm.tel?`Tél: ${ctForm.tel}\n\n${ctForm.message}`:ctForm.message});setCtSent(true);notify("✦ Message envoyé !");}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}><Send size={13}/>Envoyer</button>
            </div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"linear-gradient(135deg,#0a1f0a,#0f2f0f)",border:"1px solid #25d36644",borderRadius:18,padding:22}}><h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,marginBottom:7,color:"#25d366"}}>💬 WhatsApp</h3><p style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>Réponse instantanée tous les jours !</p><a href={`${WA}?text=Bonjour%20S-Mall`} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:9,background:"#25d366",color:"#fff",borderRadius:13,padding:"12px",fontWeight:700,fontSize:14,textDecoration:"none",fontFamily:"'DM Sans',sans-serif"}}><MessageCircle size={17}/>Ouvrir WhatsApp</a><p style={{fontSize:11,color:C.muted,marginTop:9,textAlign:"center"}}>Disponible 7j/7 · Réponse rapide</p></div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:22,flex:1}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,marginBottom:5}}>⭐ Laisser un avis</h3>
              {rvSent?<div style={{textAlign:"center",padding:"16px 0"}}><p style={{fontWeight:700,color:C.green,fontSize:14}}>Merci !</p><p style={{color:C.muted,fontSize:12,marginTop:5}}>Publié après validation.</p></div>
              :<div style={{display:"flex",flexDirection:"column",gap:10,marginTop:14}}>
                <input value={rvForm.name} onChange={e=>setRvForm(r=>({...r,name:e.target.value}))} placeholder="Votre nom *" style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                <div><p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:5}}>Note *</p><div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(s=><button key={s} type="button" onClick={()=>setRvForm(r=>({...r,rating:s}))} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:s<=rvForm.rating?C.gold:"#333",transition:"transform .1s"}} onMouseEnter={e=>e.target.style.transform="scale(1.2)"} onMouseLeave={e=>e.target.style.transform="scale(1)"}>★</button>)}</div></div>
                <textarea value={rvForm.comment} onChange={e=>setRvForm(r=>({...r,comment:e.target.value}))} placeholder="Commentaire *" rows={3} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:9,padding:"9px 13px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                <button type="button" className="bt" onClick={async()=>{if(!rvForm.name.trim()||!rvForm.comment.trim()){notify("Remplissez tous les champs",C.red);return;}await sb.from("reviews").insert({client_name:rvForm.name,client_email:rvForm.email,rating:rvForm.rating,comment:rvForm.comment,approved:false});setRvSent(true);notify("✦ Avis envoyé !");}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:10,padding:"10px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Star size={12}/>Publier</button>
              </div>}
            </div>
          </div>
        </div>
      </div>}

      <footer style={{borderTop:`1px solid ${C.border}`,padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginTop:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>✦</div><span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:14,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span></div>
        <p style={{color:C.muted,fontSize:11}}>Bénin · Togo · Côte d'Ivoire — Mobile Money · FedaPay</p>
        <p style={{color:C.muted,fontSize:11}}>© 2025 S-Mall. Tous droits réservés.</p>
      </footer>
    </div>
  );
}

