import { useState, useEffect } from 'react';
import { sb } from './supabase';









const C = {
  black:"#0a0a0a",dark:"#111111",card:"#161616",card2:"#1c1c1c",
  border:"#2a2a2a",gold:"#c9a84c",goldL:"#e8c97a",goldD:"#9a7a2e",
  white:"#f5f0e8",muted:"#888880",red:"#e05a4e",green:"#4caf7d",
  stripe:"#635BFF",paypal:"#009cde",sys:"#e8533f",blue:"#3b82f6",
};
const fmt = n => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const pct = (o,s) => Math.round((1-s/o)*100);
const uid = () => "CMD-" + Date.now().toString(36).toUpperCase();
const rid = () => "RES-" + Date.now().toString(36).toUpperCase();

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
const BADGE_C = {Nouveau:C.green,Bestseller:C.gold,Promo:C.red,Premium:"#9b59b6"};

// ─── CALENDAR ────────────────────────────────────────────────────────────────
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
        <span>{value||"JJ/MM/AAAA"}</span><span>📅</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:500,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,width:240,boxShadow:"0 16px 40px rgba(0,0,0,0.8)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setView(v=>v.m===0?{y:v.y-1,m:11}:{...v,m:v.m-1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>‹</button>
            <span style={{fontWeight:700,fontSize:13,color:C.white}}>{months[view.m]} {view.y}</span>
            <button onClick={()=>setView(v=>v.m===11?{y:v.y+1,m:0}:{...v,m:v.m+1})} style={{background:"none",border:`1px solid ${C.border}`,color:C.gold,borderRadius:6,padding:"2px 8px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>›</button>
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

// ─── BOOKING MODAL ───────────────────────────────────────────────────────────
function BookingModal({product,onClose,onConfirm}) {
  const [df,setDf]=useState(""); const [dt,setDt]=useState(""); const [qty,setQty]=useState(1); const [err,setErr]=useState("");
  const isCircuit=product.book_type==="circuit";
  const showTo=!isCircuit;
  const nights=()=>{if(!df||!showTo||!dt)return 1;try{const[a,b,c]=df.split("/").map(Number);const[x,y,z]=dt.split("/").map(Number);return Math.max(1,(new Date(z,y-1,x)-new Date(c,b-1,a))/86400000);}catch{return 1;}};
  const total=product.price*(product.book_type==="vol"||isCircuit?qty:nights()*qty);
  const confirm=()=>{if(!df){setErr("Choisissez une date");return;}if(showTo&&!dt){setErr("Choisissez une date de retour");return;}setErr("");onConfirm({dateFrom:df,dateTo:showTo?dt:null,passengers:qty,total});};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:32,width:"100%",maxWidth:460,animation:"fadeUp .3s ease",boxShadow:"0 24px 60px rgba(0,0,0,0.9)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:19,color:C.gold}}>{product.emoji} {product.name}</h3>
            <p style={{fontSize:12,color:C.muted,marginTop:3}}>{product.desc}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:15,flexShrink:0,marginLeft:10}}>✕</button>
        </div>
        <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,marginBottom:20}}/>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <MiniCalendar label={product.book_type==="vol"?"Date de départ":"Date d'arrivée"} value={df} onChange={setDf}/>
          {showTo&&<MiniCalendar label={product.book_type==="vol"?"Date de retour":"Date de départ"} value={dt} onChange={setDt}/>}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:6}}>{product.book_type==="vol"?"Passagers":product.book_type==="circuit"?"Participants":"Nombre"}</label>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,fontSize:18,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:800}}>−</button>
              <span style={{fontWeight:800,fontSize:18,minWidth:24,textAlign:"center",color:C.white}}>{qty}</span>
              <button onClick={()=>setQty(q=>q+1)} style={{width:36,height:36,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.card2,color:C.gold,fontSize:18,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:800}}>+</button>
              <span style={{fontSize:12,color:C.muted}}>× {fmt(product.price)}</span>
            </div>
          </div>
          {err&&<p style={{color:C.red,fontSize:12,fontWeight:600}}>⚠ {err}</p>}
          <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"13px 17px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:C.muted,fontWeight:600}}>Total estimé</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:C.gold}}>{fmt(total)}</span>
          </div>
          <button onClick={confirm} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>✦ Confirmer la réservation</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CLIENT APP ─────────────────────────────────────────────────────────
export default function SMallClient() {
  const [products,setProducts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState("home");
  const [cat,setCat]=useState("all");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState([]);
  const [booking,setBooking]=useState(null);
  const [payMethod,setPayMethod]=useState("stripe");
  const [form,setForm]=useState({name:"",email:"",tel:"",card:"",expiry:"",cvv:"",paypalEmail:"",sysEmail:""});
  const [errors,setErrors]=useState({});
  const [processing,setProcessing]=useState(false);
  const [notif,setNotif]=useState(null);
  const [selectedProduct,setSelectedProduct]=useState(null);
  const [CATS,setCATS]=useState(DEFAULT_CATS);
  const [reviews,setReviews]=useState([]);
  const [reviewForm,setReviewForm]=useState({name:"",email:"",rating:5,comment:""});
  const [reviewSent,setReviewSent]=useState(false);
  const [contactForm,setContactForm]=useState({name:"",email:"",tel:"",message:""});
  const [contactSent,setContactSent]=useState(false);

  // ── CHARGEMENT AVIS CLIENTS ──────────────────────────────────────────────
  useEffect(()=>{
    const loadReviews = async () => {
      const {data} = await sb.from("reviews").select("*").eq("approved",true).order("created_at",{ascending:false});
      if(data) setReviews(data);
    };
    loadReviews();
    const chRev = sb.channel("reviews-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"reviews"},()=>loadReviews())
      .subscribe();
    return () => sb.removeChannel(chRev);
  },[]);

  // ── CHARGEMENT TEMPS RÉEL DES CATÉGORIES ─────────────────────────────────
  useEffect(()=>{
    const loadCats = async () => {
      const {data} = await sb.from("categories").select("*").order("position");
      if(data&&data.length>0){
        setCATS([{id:"all",label:"Tout",icon:"✦"},...data]);
      }
    };
    loadCats();
    const chCat = sb.channel("categories-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"categories"},()=>loadCats())
      .subscribe();
    return () => sb.removeChannel(chCat);
  },[]);

  // ── CHARGEMENT TEMPS RÉEL DES PRODUITS ──────────────────────────────────
  useEffect(()=>{
    const load = async () => {
      const {data,error} = await sb.from("products").select("*").eq("active",true).order("id");
      if(!error) setProducts(data||[]);
      setLoading(false);
    };
    load();

    // Écoute les changements en temps réel
    const channel = sb.channel("products-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"products"},()=>load())
      .subscribe();

    return () => sb.removeChannel(channel);
  },[]);

  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const subtotal=cart.reduce((s,i)=>s+(i.booking?i.price:i.price*i.qty),0);
  const shipping=subtotal>100000?0:2500;
  const grandTotal=subtotal+shipping;

  const notify=(msg,color=C.gold)=>{setNotif({msg,color});setTimeout(()=>setNotif(null),3000);};

  const addToCart=(p,bookInfo=null)=>{
    if(bookInfo){setCart(prev=>[...prev,{...p,id:p.id+"_"+Date.now(),qty:1,booking:bookInfo,price:bookInfo.total}]);}
    else{setCart(prev=>{const ex=prev.find(i=>i.id===p.id&&!i.booking);if(ex)return prev.map(i=>i.id===p.id&&!i.booking?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1}];});}
    notify(`✦ ${p.name} ${bookInfo?"réservé":"ajouté"}`);
  };
  const removeItem=idx=>setCart(prev=>prev.filter((_,i)=>i!==idx));
  const updateQty=(idx,d)=>setCart(prev=>prev.map((it,i)=>i===idx?{...it,qty:Math.max(1,it.qty+d)}:it));
  const filtered=products.filter(p=>(cat==="all"||p.cat===cat)&&p.name.toLowerCase().includes(search.toLowerCase()));

  const FEDAPAY_PUBLIC_KEY = "pk_live_EzI5k531w-Iu-LUAu4I2sluv";

  const submitReview = async () => {
    if(!reviewForm.name.trim()||!reviewForm.comment.trim()){notify("Remplis tous les champs",C.red);return;}
    await sb.from("reviews").insert({
      client_name:reviewForm.name,
      client_email:reviewForm.email,
      rating:reviewForm.rating,
      comment:reviewForm.comment,
      approved:false,
    });
    setReviewSent(true);
    setReviewForm({name:"",email:"",rating:5,comment:""});
    notify("✦ Avis envoyé ! Il sera publié après validation.");
  };

  const submitContact = async () => {
    if(!contactForm.name.trim()||!contactForm.message.trim()){notify("Remplis nom et message",C.red);return;}
    await sb.from("messages").insert({
      from_name:contactForm.name,
      from_email:contactForm.email||"Non renseigné",
      subject:`Contact S-Mall — ${contactForm.name}`,
      message:contactForm.tel?`Tel: ${contactForm.tel}\n\n${contactForm.message}`:contactForm.message,
    });
    setContactSent(true);
    setContactForm({name:"",email:"",tel:"",message:""});
    notify("✦ Message envoyé ! Nous vous répondrons rapidement.");
  };

  const validate=()=>{
    const e={};
    if(!form.name.trim())e.name="Requis";
    if(!form.email.includes("@"))e.email="Email invalide";
    if(!form.tel.trim())e.tel="Requis";
    if(payMethod==="stripe"){if((form.card||"").replace(/\s/g,"").length<16)e.card="Invalide";if(!(form.expiry||"").match(/^\d{2}\/\d{2}$/))e.expiry="MM/AA";if((form.cvv||"").length<3)e.cvv="CVV invalide";}
    if(payMethod==="paypal"&&!(form.paypalEmail||"").includes("@"))e.paypalEmail="Email invalide";
    if(payMethod==="systeme"&&!(form.sysEmail||"").includes("@"))e.sysEmail="Email invalide";
    setErrors(e);return Object.keys(e).length===0;
  };

  const handlePay=async()=>{
    if(!validate())return;
    setProcessing(true);
    try {
      const orderId = uid();
      const bookItems = cart.filter(i=>i.booking);
      const shopItems = cart.filter(i=>!i.booking);

      // Enregistrer la commande dans Supabase
      if(shopItems.length>0){
        await sb.from("orders").insert({
          id: orderId,
          client_name: form.name,
          client_email: form.email,
          client_tel: form.tel,
          items: shopItems.map(i=>({name:i.name,emoji:i.emoji,qty:i.qty,price:i.price})),
          subtotal,
          shipping,
          total: grandTotal,
          pay_method: "FedaPay",
          status: "En attente paiement",
          country: "Afrique de l'Ouest",
        });
      }

      // Enregistrer les réservations
      for(const item of bookItems){
        await sb.from("reservations").insert({
          id: rid(),
          client_name: form.name,
          client_email: form.email,
          client_tel: form.tel,
          product_id: item.id,
          product_name: item.name,
          product_emoji: item.emoji,
          book_type: item.book_type||"autre",
          date_from: item.booking.dateFrom,
          date_to: item.booking.dateTo||null,
          persons: item.booking.passengers,
          total: item.booking.total,
          status: "En attente",
        });
      }

      // Lancer le paiement selon la méthode choisie
      if(payMethod==="fedapay"){
        window.FedaPay.init({
          public_key: FEDAPAY_PUBLIC_KEY,
          transaction: { amount: grandTotal, description: `Commande S-Mall ${orderId}` },
          customer: {
            firstname: form.name.split(" ")[0],
            lastname: form.name.split(" ").slice(1).join(" ")||".",
            email: form.email,
            phone_number: { number: form.tel, country: "bj" },
          },
          onComplete: async (resp) => {
            if(resp.reason === "DIALOG DISMISSED"){ setProcessing(false); notify("❌ Paiement annulé.", C.red); return; }
            await sb.from("orders").update({status:"En cours"}).eq("id",orderId);
            await sendConfirmEmail();
            setProcessing(false); setPage("success"); setCart([]);
          }
        }).open();
      } else {
        // Stripe, PayPal, Systeme.io → simulation (à connecter plus tard)
        setTimeout(async()=>{
          await sb.from("orders").update({status:"En cours"}).eq("id",orderId);
          await sendConfirmEmail();
          setProcessing(false); setPage("success"); setCart([]);
        }, 1800);
      }

    } catch(err){
      setProcessing(false);
      notify("❌ Erreur. Réessayez.",C.red);
    }
  };

  const inp=(field,placeholder,type="text",max=null)=>(
    <div>
      <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder} maxLength={max}
        style={{width:"100%",background:"#1c1c1c",border:`1.5px solid ${errors[field]?C.red:C.border}`,borderRadius:10,padding:"11px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
      {errors[field]&&<p style={{color:C.red,fontSize:11,marginTop:4}}>{errors[field]}</p>}
    </div>
  );

  const GL=()=><div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 0 24px"}}/>;

  const Card=({p,i})=>(
    <div className="pc" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:22,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.4)",animation:`fadeUp .35s ease ${i*.04}s both`}}>
      <div onClick={()=>setSelectedProduct(p)} style={{background:"linear-gradient(135deg,#161200,#201a00)",padding:"26px 14px",textAlign:"center",position:"relative",borderBottom:`1px solid ${C.border}`,minHeight:140,overflow:"hidden",cursor:"pointer"}}>
        {p.badge&&<span style={{position:"absolute",top:10,right:10,background:BADGE_C[p.badge]||C.gold,color:p.badge==="Bestseller"?C.black:C.white,fontSize:9,fontWeight:800,padding:"3px 9px",borderRadius:999,textTransform:"uppercase",zIndex:2}}>{p.badge}</span>}
        {p.orig_price&&<span style={{position:"absolute",top:10,left:10,background:C.red,color:C.white,fontSize:9,fontWeight:800,padding:"3px 9px",borderRadius:999,zIndex:2}}>-{pct(p.orig_price,p.price)}%</span>}
        {p.dest==="systeme"&&<span style={{position:"absolute",bottom:8,left:10,background:C.sys,color:C.white,fontSize:8,fontWeight:800,padding:"2px 7px",borderRadius:999,textTransform:"uppercase",zIndex:2}}>Systeme.io</span>}
        {p.image_url?<img src={p.image_url} alt={p.name} style={{width:"100%",height:140,objectFit:"cover",position:"absolute",top:0,left:0}}/>:<div style={{fontSize:50,paddingTop:20}}>{p.emoji}</div>}
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,0.7))",padding:"20px 8px 8px",zIndex:2}}>
          <span style={{fontSize:10,color:C.gold,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{CATS.find(c=>c.id===p.cat)?.label}</span>
        </div>
      </div>
      <div style={{padding:18}}>
        <h3 onClick={()=>setSelectedProduct(p)} style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,marginBottom:5,color:C.white,cursor:"pointer"}}>{p.name}</h3>
        <p style={{fontSize:12,color:C.muted,marginBottom:13,lineHeight:1.5}}>{p.desc}</p>
        <div style={{marginBottom:13}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:900,color:C.gold}}>{fmt(p.price)}</span>
            {p.orig_price&&<span style={{textDecoration:"line-through",color:C.muted,fontSize:12}}>{fmt(p.orig_price)}</span>}
          </div>
          {p.orig_price&&<p style={{fontSize:11,color:C.green,fontWeight:700,marginTop:2}}>Économie : {fmt(p.orig_price-p.price)}</p>}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <button onClick={()=>setSelectedProduct(p)} style={{flex:1,background:"transparent",border:`1.5px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"8px",fontWeight:600,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>👁 Voir détail</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          {p.bookable&&<button onClick={()=>setBooking(p)} style={{flex:1,background:`${C.blue}22`,border:`1.5px solid ${C.blue}`,color:C.blue,borderRadius:10,padding:"9px 8px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>📅 Réserver</button>}
          <button onClick={()=>addToCart(p)} style={{flex:1,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:10,padding:"9px 8px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🛒 {p.bookable?"Acheter":"Ajouter"}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:C.black,minHeight:"100vh",color:C.white,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#111;}::-webkit-scrollbar-thumb{background:${C.goldD};border-radius:10px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes glow{0%,100%{box-shadow:0 0 14px ${C.gold}55}50%{box-shadow:0 0 30px ${C.gold}99}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .pc:hover{transform:translateY(-5px)!important;box-shadow:0 18px 44px rgba(201,168,76,0.18)!important;}.pc{transition:all .3s cubic-bezier(.4,0,.2,1);}
        .btn-g:hover{filter:brightness(1.15);box-shadow:0 6px 22px ${C.gold}66!important;}.btn-g{transition:all .2s;}
        .cat:hover{border-color:${C.gold}!important;color:${C.gold}!important;}.cat{transition:all .2s;cursor:pointer;}
        .nav-a:hover{color:${C.gold}!important;}.nav-a{transition:color .2s;cursor:pointer;}
      `}</style>

      {notif&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:C.card,border:`1px solid ${notif.color}`,color:notif.color,padding:"12px 22px",borderRadius:12,fontWeight:700,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,0.5)",animation:"fadeUp .3s ease"}}>{notif.msg}</div>}
      {booking&&<BookingModal product={booking} onClose={()=>setBooking(null)} onConfirm={info=>{addToCart(booking,info);setBooking(null);}}/>
}
      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setSelectedProduct(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:28,width:"100%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",animation:"fadeUp .3s ease",boxShadow:"0 24px 80px rgba(0,0,0,0.95)"}}>
            {/* Image */}
            <div style={{position:"relative",height:280,background:"linear-gradient(135deg,#161200,#201a00)",overflow:"hidden",borderRadius:"28px 28px 0 0",flexShrink:0}}>
              {selectedProduct.image_url
                ?<img src={selectedProduct.image_url} alt={selectedProduct.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:80}}>{selectedProduct.emoji}</div>
              }
              {selectedProduct.orig_price&&<span style={{position:"absolute",top:16,left:16,background:C.red,color:C.white,fontSize:12,fontWeight:800,padding:"5px 12px",borderRadius:999}}>-{pct(selectedProduct.orig_price,selectedProduct.price)}%</span>}
              {selectedProduct.badge&&<span style={{position:"absolute",top:16,right:52,background:BADGE_C[selectedProduct.badge]||C.gold,color:selectedProduct.badge==="Bestseller"?C.black:C.white,fontSize:11,fontWeight:800,padding:"4px 12px",borderRadius:999}}>{selectedProduct.badge}</span>}
              <button onClick={()=>setSelectedProduct(null)} style={{position:"absolute",top:14,right:14,background:"rgba(0,0,0,0.6)",border:`1px solid ${C.border}`,color:C.white,borderRadius:10,width:34,height:34,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            {/* Content */}
            <div style={{padding:"28px 32px"}}>
              <p style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:8}}>{CATS.find(c=>c.id===selectedProduct.cat)?.icon} {CATS.find(c=>c.id===selectedProduct.cat)?.label}</p>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.white,marginBottom:12}}>{selectedProduct.name}</h2>
              <p style={{fontSize:15,color:C.muted,lineHeight:1.8,marginBottom:22}}>{selectedProduct.desc||selectedProduct.description||"Aucune description disponible."}</p>
              <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,marginBottom:22}}/>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28}}>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:C.gold}}>{fmt(selectedProduct.price)}</span>
                {selectedProduct.orig_price&&<span style={{textDecoration:"line-through",color:C.muted,fontSize:16}}>{fmt(selectedProduct.orig_price)}</span>}
                {selectedProduct.orig_price&&<span style={{background:`${C.green}20`,color:C.green,fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:999}}>Économie : {fmt(selectedProduct.orig_price-selectedProduct.price)}</span>}
              </div>
              <div style={{display:"flex",gap:12}}>
                {selectedProduct.bookable&&(
                  <button onClick={()=>{setBooking(selectedProduct);setSelectedProduct(null);}} style={{flex:1,background:`${C.blue}22`,border:`1.5px solid ${C.blue}`,color:C.blue,borderRadius:14,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>📅 Réserver</button>
                )}
                <button className="btn-g" onClick={()=>{addToCart(selectedProduct);setSelectedProduct(null);}} style={{flex:2,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🛒 Ajouter au panier</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* NAV */}
      <nav style={{background:"rgba(10,10,10,0.97)",backdropFilter:"blur(12px)",padding:"0 36px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setPage("home")}>
          <div style={{width:38,height:38,borderRadius:10,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,animation:"glow 3s ease infinite"}}>✦</div>
          <div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:20,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
            <span style={{fontSize:9,color:C.muted,display:"block",letterSpacing:3,textTransform:"uppercase"}}>Premium Store</span>
          </div>
        </div>
        <div style={{display:"flex",gap:26,alignItems:"center"}}>
          {[["Accueil","home"],["Boutique","shop"],["Voyages","voyages"],["Formations","formations"],["Contact","contact"]].map(([l,k])=>(
            <span key={k} className="nav-a" style={{fontWeight:600,fontSize:14,color:page===k?C.gold:C.muted}} onClick={()=>{if(k==="home")setPage("home");else if(k==="shop"){setCat("all");setPage("shop");}else if(k==="voyages"){setCat("avion");setPage("shop");}else if(k==="contact"){setPage("contact");}else{setCat("formation");setPage("shop");}}}>{l}</span>
          ))}
        </div>
        <button className="btn-g" onClick={()=>setPage("cart")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"'DM Sans',sans-serif"}}>
          🛒 {cartCount>0&&<span style={{background:C.black,color:C.gold,borderRadius:999,padding:"2px 8px",fontSize:12,fontWeight:800}}>{cartCount}</span>} Panier
        </button>
      </nav>

      {/* LOADING */}
      {loading&&(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",gap:14}}>
          <span style={{display:"inline-block",width:24,height:24,border:`3px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
          <span style={{color:C.muted,fontSize:15,fontWeight:600}}>Chargement des produits…</span>
        </div>
      )}

      {/* HOME */}
      {!loading&&page==="home"&&(
        <div>
          <div style={{position:"relative",overflow:"hidden",padding:"90px 60px 80px",background:"linear-gradient(135deg,#0a0a0a 0%,#1a1400 50%,#0a0a0a 100%)"}}>
            <div style={{position:"absolute",top:"-100px",left:"-80px",width:"450px",height:"450px",borderRadius:"50%",background:`radial-gradient(circle,${C.gold}18 0%,transparent 70%)`,pointerEvents:"none"}}/>
            <div style={{maxWidth:680,animation:"fadeUp .7s ease"}}>
              <p style={{color:C.gold,fontWeight:700,letterSpacing:4,textTransform:"uppercase",fontSize:11,marginBottom:16}}>✦ &nbsp; Bienvenue sur S-Mall</p>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:900,lineHeight:1.1,marginBottom:20}}>Mode. Tech. Voyages.<br/><span style={{background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Tout en un lieu.</span></h1>
              <p style={{color:C.muted,fontSize:16,lineHeight:1.7,maxWidth:500,marginBottom:32}}>Vêtements, électronique, formations, billets d'avion, circuits Bénin · Togo · Côte d'Ivoire, location voitures & appartements.</p>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <button className="btn-g" onClick={()=>{setCat("all");setPage("shop");}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"14px 30px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Explorer →</button>
                <button onClick={()=>{setCat("circuit");setPage("shop");}} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:14,padding:"14px 26px",fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗺️ Circuits</button>
                <button onClick={()=>{setCat("avion");setPage("shop");}} style={{background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 26px",fontWeight:600,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✈️ Vols</button>
              </div>
            </div>
          </div>

          <div style={{maxWidth:1200,margin:"0 auto",padding:"50px 28px"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:8}}>✦ &nbsp; Nos univers</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,textAlign:"center",marginBottom:8}}>Que cherchez-vous ?</h2>
            <GL/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:14}}>
              {CATS.filter(c=>c.id!=="all").map((c,i)=>(
                <div key={c.id} className="pc" onClick={()=>{setCat(c.id);setPage("shop");}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 14px",textAlign:"center",cursor:"pointer",animation:`fadeUp .4s ease ${i*.06}s both`}}>
                  <div style={{fontSize:32,marginBottom:8}}>{c.icon}</div>
                  <p style={{fontWeight:700,fontSize:13,color:C.white}}>{c.label}</p>
                  <p style={{fontSize:11,color:C.gold,marginTop:3}}>{products.filter(p=>p.cat===c.id).length} articles</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 50px"}}>
            <p style={{color:C.red,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:8}}>🔥 &nbsp; Offres du moment</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:8}}>Promotions en cours</h2>
            <GL/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:20}}>
              {products.filter(p=>p.orig_price).slice(0,4).map((p,i)=><Card key={p.id} p={p} i={i}/>)}
            </div>
          </div>

          {/* AVIS CLIENTS */}
          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 50px"}}>
            <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,textAlign:"center",marginBottom:8}}>⭐ &nbsp; Témoignages</p>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,textAlign:"center",marginBottom:8}}>Ce que disent nos clients</h2>
            <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 0 28px"}}/>
            {reviews.length===0?(
              <div style={{textAlign:"center",padding:"40px 0",color:C.muted}}>
                <div style={{fontSize:44,marginBottom:10}}>⭐</div>
                <p style={{fontSize:15,fontWeight:600}}>Soyez le premier à laisser un avis !</p>
                <button onClick={()=>setPage("contact")} style={{marginTop:14,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"11px 24px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Laisser un avis →</button>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:18}}>
                {reviews.slice(0,6).map((r,i)=>(
                  <div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 20px",animation:`fadeUp .4s ease ${i*.06}s both`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                      <div>
                        <p style={{fontWeight:700,fontSize:15,color:C.white,marginBottom:3}}>{r.client_name}</p>
                        <p style={{fontSize:11,color:C.muted}}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:16,color:s<=r.rating?C.gold:"#333"}}>★</span>)}</div>
                    </div>
                    <p style={{fontSize:14,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{textAlign:"center",marginTop:22}}>
              <button onClick={()=>setPage("contact")} style={{background:"transparent",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:12,padding:"11px 26px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✦ Laisser un avis</button>
            </div>
          </div>

          <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px 60px"}}>
            <div style={{background:"linear-gradient(135deg,#1c0a08,#2a1008)",border:`1px solid ${C.sys}44`,borderRadius:22,padding:"36px 44px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
              <div>
                <p style={{color:C.sys,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:8}}>⚡ &nbsp; Propulsé par Systeme.io</p>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,marginBottom:8}}>Formations & Tunnels de Vente</h3>
                <p style={{color:C.muted,fontSize:14,maxWidth:460,lineHeight:1.6}}>Accédez à nos formations en ligne, automatisation email et suivi personnalisé.</p>
              </div>
              <button className="btn-g" onClick={()=>{setCat("formation");setPage("shop");}} style={{background:`linear-gradient(135deg,#c0392b,${C.sys})`,color:C.white,border:"none",borderRadius:14,padding:"13px 28px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Voir les formations →</button>
            </div>
          </div>
        </div>
      )}

      {/* SHOP */}
      {!loading&&page==="shop"&&(
        <div style={{maxWidth:1200,margin:"0 auto",padding:"44px 28px",animation:"fadeUp .4s ease"}}>
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 14px",gap:8}}>
              <span style={{color:C.gold}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
            </div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
              {CATS.map(c=>(
                <button key={c.id} className="cat" onClick={()=>setCat(c.id)} style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${cat===c.id?C.gold:C.border}`,background:cat===c.id?`${C.gold}18`:"transparent",color:cat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{c.icon} {c.label}</button>
              ))}
            </div>
          </div>
          <p style={{color:C.muted,fontSize:13,marginBottom:18}}>{filtered.length} article{filtered.length!==1?"s":""} trouvé{filtered.length!==1?"s":""}</p>
          {filtered.length===0?(<div style={{textAlign:"center",padding:"80px 0",color:C.muted}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><p style={{fontWeight:700,fontSize:17}}>Aucun résultat</p></div>):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(255px,1fr))",gap:20}}>
              {filtered.map((p,i)=><Card key={p.id} p={p} i={i}/>)}
            </div>
          )}
        </div>
      )}

      {/* CART */}
      {page==="cart"&&(
        <div style={{maxWidth:960,margin:"0 auto",padding:"44px 28px",animation:"fadeUp .4s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:6}}>✦ &nbsp; Mon panier</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginBottom:22}}>{cartCount} article{cartCount!==1?"s":""}</h2>
          <GL/>
          {cart.length===0?(
            <div style={{textAlign:"center",padding:"80px 0"}}>
              <div style={{fontSize:60,marginBottom:14}}>🛒</div>
              <p style={{fontWeight:700,fontSize:17,color:C.muted,marginBottom:22}}>Votre panier est vide</p>
              <button className="btn-g" onClick={()=>setPage("shop")} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"13px 30px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Parcourir la boutique →</button>
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"1fr 310px",gap:24}}>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {cart.map((item,idx)=>(
                  <div key={idx} style={{background:C.card,border:`1px solid ${item.booking?C.blue:C.border}`,borderRadius:16,padding:"16px 18px",display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:56,height:56,borderRadius:12,background:"#1c1600",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,border:`1px solid ${C.border}`}}>{item.emoji}</div>
                    <div style={{flex:1}}>
                      <h4 style={{fontWeight:700,fontSize:15,marginBottom:3}}>{item.name}</h4>
                      {item.booking&&<div style={{fontSize:11,color:C.blue,marginBottom:3,fontWeight:600}}>📅 {item.booking.dateFrom}{item.booking.dateTo?` → ${item.booking.dateTo}`:""} · {item.booking.passengers} pers.</div>}
                      <p style={{color:C.gold,fontWeight:700,fontSize:14}}>{fmt(item.price)}</p>
                    </div>
                    {!item.booking&&(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <button onClick={()=>updateQty(idx,-1)} style={{width:28,height:28,borderRadius:7,border:`1.5px solid ${C.border}`,background:"transparent",cursor:"pointer",fontWeight:800,fontSize:15,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>−</button>
                        <span style={{fontWeight:800,fontSize:14,minWidth:18,textAlign:"center"}}>{item.qty}</span>
                        <button onClick={()=>updateQty(idx,1)} style={{width:28,height:28,borderRadius:7,border:`1.5px solid ${C.border}`,background:"transparent",cursor:"pointer",fontWeight:800,fontSize:15,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>+</button>
                      </div>
                    )}
                    <div style={{textAlign:"right",minWidth:85}}>
                      <p style={{fontWeight:900,fontSize:15,color:C.white}}>{fmt(item.booking?item.price:item.price*item.qty)}</p>
                      <button onClick={()=>removeItem(idx)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",marginTop:3}}>Retirer</button>
                    </div>
                  </div>
                ))}
                <button onClick={()=>setPage("shop")} style={{background:"none",border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px",fontWeight:600,fontSize:14,color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>← Continuer mes achats</button>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24,height:"fit-content"}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:19,marginBottom:18}}>Récapitulatif</h3>
                <div style={{display:"flex",flexDirection:"column",gap:11,marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}><span style={{color:C.muted}}>Livraison</span><span style={{fontWeight:700,color:shipping===0?C.green:C.white}}>{shipping===0?"Gratuite 🎉":fmt(shipping)}</span></div>
                  {shipping>0&&<p style={{fontSize:11,color:C.muted,background:"#1a1200",padding:"7px 11px",borderRadius:9,border:`1px solid ${C.border}`}}>💡 Encore {fmt(100000-subtotal)} pour la livraison offerte</p>}
                  <div style={{height:1,background:C.border}}/>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontFamily:"'Playfair Display',serif",fontWeight:900}}><span>Total</span><span style={{color:C.gold}}>{fmt(grandTotal)}</span></div>
                </div>
                <button className="btn-g" onClick={()=>setPage("checkout")} style={{width:"100%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Passer la commande →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT */}
      {page==="checkout"&&(
        <div style={{maxWidth:880,margin:"0 auto",padding:"44px 28px",animation:"fadeUp .4s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:6}}>✦ &nbsp; Finaliser</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginBottom:22}}>Paiement sécurisé</h2>
          <GL/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:24}}>
            <div style={{display:"flex",flexDirection:"column",gap:20}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,marginBottom:18,color:C.gold}}>👤 Vos informations</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>{inp("name","Nom complet")}{inp("email","Email","email")}{inp("tel","Téléphone","tel")}</div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:17,marginBottom:18,color:C.gold}}>💳 Méthode de paiement</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                  {[{id:"fedapay",label:"Mobile Money",icon:"📱",color:"#e8a020",sub:"MTN · Moov · Wave"},{id:"stripe",label:"Carte",icon:"💳",color:C.stripe,sub:"Visa/MasterCard"},{id:"paypal",label:"PayPal",icon:"🅿️",color:C.paypal,sub:"Sécurisé"},{id:"systeme",label:"Systeme.io",icon:"⚡",color:C.sys,sub:"Formations"}].map(m=>(
                    <button key={m.id} onClick={()=>setPayMethod(m.id)} style={{border:`2px solid ${payMethod===m.id?m.color:C.border}`,borderRadius:12,padding:"13px 8px",background:payMethod===m.id?`${m.color}18`:C.dark,cursor:"pointer",textAlign:"center",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
                      <div style={{fontSize:22,marginBottom:5}}>{m.icon}</div>
                      <div style={{fontWeight:700,fontSize:12,color:payMethod===m.id?m.color:C.white}}>{m.label}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:2}}>{m.sub}</div>
                    </button>
                  ))}
                </div>
                {payMethod==="fedapay"&&<div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{[{icon:"📱",label:"MTN MoMo"},{icon:"💳",label:"Moov/Flooz"},{icon:"🌊",label:"Wave"}].map((m,i)=><div key={i} style={{background:C.card2,border:`1px solid #e8a02044`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{m.icon}</div><div style={{fontSize:10,color:"#e8a020",fontWeight:700}}>{m.label}</div></div>)}</div><div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",background:"#1a1000",borderRadius:10,border:`1px solid #e8a02044`}}><span>🔒</span><span style={{fontSize:12,color:"#e8a020",fontWeight:600}}>Paiement Mobile Money sécurisé via FedaPay · Bénin</span></div></div>}
                {payMethod==="stripe"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{inp("card","Numéro de carte")}<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{inp("expiry","MM/AA",undefined,5)}{inp("cvv","CVV",undefined,4)}</div><div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",background:"#0f1c0f",borderRadius:10,border:`1px solid ${C.green}44`}}><span>🔒</span><span style={{fontSize:12,color:C.green,fontWeight:600}}>SSL sécurisé via Stripe</span></div></div>}
                {payMethod==="paypal"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{inp("paypalEmail","Email PayPal","email")}<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",background:"#001525",borderRadius:10,border:`1px solid ${C.paypal}44`}}><span>🔒</span><span style={{fontSize:12,color:C.paypal,fontWeight:600}}>Redirection sécurisée PayPal</span></div></div>}
                {payMethod==="systeme"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>{inp("sysEmail","Email Systeme.io","email")}<div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 13px",background:"#1a0500",borderRadius:10,border:`1px solid ${C.sys}44`}}><span>⚡</span><span style={{fontSize:12,color:C.sys,fontWeight:600}}>Accès automatique via Systeme.io</span></div></div>}
              </div>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22,height:"fit-content",position:"sticky",top:80}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,marginBottom:16}}>Votre commande</h3>
              <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:16,maxHeight:200,overflowY:"auto"}}>
                {cart.map((item,idx)=>(
                  <div key={idx} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                    <div style={{width:34,height:34,borderRadius:9,background:"#1c1600",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{item.emoji}</div>
                    <div style={{flex:1}}><p style={{fontWeight:600,fontSize:12,color:C.white}}>{item.name}</p>{item.booking&&<p style={{fontSize:10,color:C.blue}}>📅 {item.booking.dateFrom}</p>}<p style={{color:C.muted,fontSize:11}}>×{item.qty||1}</p></div>
                    <span style={{fontWeight:800,fontSize:12,color:C.gold}}>{fmt(item.booking?item.price:item.price*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div style={{height:1,background:C.border,marginBottom:12}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7,fontSize:13}}><span style={{color:C.muted}}>Sous-total</span><span style={{fontWeight:700}}>{fmt(subtotal)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,fontSize:13}}><span style={{color:C.muted}}>Livraison</span><span style={{fontWeight:700,color:shipping===0?C.green:C.white}}>{shipping===0?"Gratuite":fmt(shipping)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontFamily:"'Playfair Display',serif",fontWeight:900,marginBottom:18}}><span>Total</span><span style={{color:C.gold}}>{fmt(grandTotal)}</span></div>
              <button className="btn-g" onClick={handlePay} disabled={processing} style={{width:"100%",background:processing?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:processing?C.muted:C.black,border:"none",borderRadius:13,padding:"14px",fontWeight:700,fontSize:14,cursor:processing?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:9}}>
                {processing?<><span style={{display:"inline-block",width:17,height:17,border:"3px solid #33330033",borderTopColor:C.gold,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>Enregistrement…</>:`Confirmer — ${fmt(grandTotal)}`}
              </button>
              <button onClick={()=>setPage("cart")} style={{width:"100%",marginTop:9,background:"none",border:"none",color:C.muted,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"7px"}}>← Retour au panier</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {page==="success"&&(
        <div style={{maxWidth:520,margin:"70px auto",padding:"0 24px",textAlign:"center",animation:"fadeUp .5s ease"}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:28,padding:"52px 44px"}}>
            <div style={{width:84,height:84,borderRadius:"50%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 24px",animation:"glow 2s ease infinite",color:C.black,fontWeight:900}}>✦</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:10}}>Commande confirmée !</h2>
            <p style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:26}}>Merci pour votre confiance.<br/><span style={{color:C.gold,fontWeight:700}}>S-Mall</span> vous remercie de votre achat.<br/>Un email de confirmation vous a été envoyé.</p>
            <div style={{background:"#0f1a0f",border:`1px solid ${C.green}44`,borderRadius:12,padding:"14px 18px",marginBottom:26}}>
              <p style={{fontWeight:700,fontSize:13,color:C.green}}>🚚 Livraison estimée : 3–5 jours ouvrés</p>
            </div>
            <button className="btn-g" onClick={()=>{setPage("home");setForm({name:"",email:"",tel:"",card:"",expiry:"",cvv:"",paypalEmail:"",sysEmail:""});}} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:14,padding:"14px 34px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Retour à l'accueil →</button>
          </div>
        </div>
      )}

      {/* CONTACT PAGE */}
      {page==="contact"&&(
        <div style={{maxWidth:800,margin:"0 auto",padding:"44px 28px",animation:"fadeUp .4s ease"}}>
          <p style={{color:C.gold,fontWeight:700,letterSpacing:3,textTransform:"uppercase",fontSize:11,marginBottom:6}}>✦ &nbsp; Nous contacter</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:900,marginBottom:8}}>Parlons-nous</h2>
          <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"0 0 32px"}}/>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {/* FORMULAIRE CONTACT */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:6,color:C.white}}>📬 Envoyez-nous un message</h3>
              <p style={{fontSize:13,color:C.muted,marginBottom:22}}>Nous vous répondons sous 24h</p>
              {contactSent?(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{fontSize:50,marginBottom:12}}>✅</div>
                  <p style={{fontWeight:700,fontSize:16,color:C.green,marginBottom:8}}>Message envoyé !</p>
                  <p style={{color:C.muted,fontSize:13,marginBottom:20}}>Nous vous répondrons rapidement.</p>
                  <button onClick={()=>setContactSent(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"9px 18px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Envoyer un autre message</button>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:13}}>
                  {[["name","Votre nom *","Nom complet"],["email","Email","votre@email.com"],["tel","Téléphone","WhatsApp ou mobile"]].map(([f,l,p])=>(
                    <div key={f}>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{l}</label>
                      <input value={contactForm[f]} onChange={e=>setContactForm(cf=>({...cf,[f]:e.target.value}))} placeholder={p}
                        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                  ))}
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Message *</label>
                    <textarea value={contactForm.message} onChange={e=>setContactForm(cf=>({...cf,message:e.target.value}))} placeholder="Votre message…" rows={4}
                      style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                  </div>
                  <button onClick={submitContact} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✦ Envoyer le message</button>
                </div>
              )}
            </div>

            {/* WHATSAPP + AVIS */}
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* WhatsApp */}
              <div style={{background:"linear-gradient(135deg,#0a1f0a,#0f2f0f)",border:"1px solid #25d36633",borderRadius:20,padding:28}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:6,color:"#25d366"}}>💬 WhatsApp Direct</h3>
                <p style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>Discutez avec nous directement sur WhatsApp pour une réponse instantanée !</p>
                <a href="https://wa.me/2250150512408?text=Bonjour%20S-Mall%2C%20j'aimerais%20avoir%20plus%20d'informations" target="_blank" rel="noreferrer"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#25d366",color:"#fff",borderRadius:14,padding:"14px",fontWeight:700,fontSize:15,textDecoration:"none",fontFamily:"'DM Sans',sans-serif"}}>
                  <span style={{fontSize:22}}>💬</span> Ouvrir WhatsApp
                </a>
                <p style={{fontSize:11,color:C.muted,marginTop:12,textAlign:"center"}}>+225 01 50 51 24 08 · Côte d'Ivoire</p>
              </div>

              {/* Avis */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:28,flex:1}}>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:20,marginBottom:6,color:C.white}}>⭐ Laisser un avis</h3>
                <p style={{fontSize:13,color:C.muted,marginBottom:18}}>Partagez votre expérience avec S-Mall</p>
                {reviewSent?(
                  <div style={{textAlign:"center",padding:"20px 0"}}>
                    <div style={{fontSize:40,marginBottom:10}}>🙏</div>
                    <p style={{fontWeight:700,color:C.green,fontSize:14}}>Merci pour votre avis !</p>
                    <p style={{color:C.muted,fontSize:12,marginTop:6}}>Il sera publié après validation.</p>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Votre nom *</label>
                      <input value={reviewForm.name} onChange={e=>setReviewForm(rf=>({...rf,name:e.target.value}))} placeholder="Nom complet"
                        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:8}}>Note *</label>
                      <div style={{display:"flex",gap:6}}>
                        {[1,2,3,4,5].map(s=>(
                          <button key={s} onClick={()=>setReviewForm(rf=>({...rf,rating:s}))}
                            style={{fontSize:26,background:"none",border:"none",cursor:"pointer",color:s<=reviewForm.rating?C.gold:"#333",transition:"transform .15s"}}
                            onMouseEnter={e=>e.target.style.transform="scale(1.2)"}
                            onMouseLeave={e=>e.target.style.transform="scale(1)"}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Commentaire *</label>
                      <textarea value={reviewForm.comment} onChange={e=>setReviewForm(rf=>({...rf,comment:e.target.value}))} placeholder="Votre expérience avec S-Mall…" rows={3}
                        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                    </div>
                    <button onClick={submitReview} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.black,border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>⭐ Publier mon avis</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer style={{borderTop:`1px solid ${C.border}`,padding:"28px 36px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>✦</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:15,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
        </div>
        <p style={{color:C.muted,fontSize:12}}>Bénin · Togo · Côte d'Ivoire — Stripe · PayPal · Systeme.io</p>
        <p style={{color:C.muted,fontSize:11}}>© 2025 S-Mall. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
