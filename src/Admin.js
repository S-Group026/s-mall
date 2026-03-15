import { useState, useEffect } from 'react';
import { sb } from './supabase';









const C = {
  bg:"#080c14",dark:"#0d1117",card:"#111827",card2:"#1a2235",
  border:"#1e2d45",gold:"#c9a84c",goldL:"#e8c97a",goldD:"#9a7a2e",
  white:"#e8edf5",muted:"#5a6a82",red:"#e05a4e",green:"#22c55e",
  blue:"#3b82f6",purple:"#8b5cf6",orange:"#f59e0b",cyan:"#06b6d4",
  stripe:"#635BFF",paypal:"#009cde",sys:"#e8533f",
};
const fmt = n => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const CATS = [
  {id:"mode",label:"Mode",icon:"👗"},
  {id:"tech",label:"Électronique",icon:"📱"},
  {id:"formation",label:"Formations",icon:"🎓"},
  {id:"avion",label:"Vols",icon:"✈️"},
  {id:"circuit",label:"Circuits",icon:"🗺️"},
  {id:"voiture",label:"Voitures",icon:"🚗"},
  {id:"appart",label:"Appartements",icon:"🏠"},
];
const BADGE_C = {Nouveau:C.green,Bestseller:C.gold,Promo:C.red,Premium:C.purple};
const STATUS_C = {"Livré":C.green,"Confirmé":C.blue,"En cours":C.orange,"Annulé":C.red,"En attente":C.orange,"Confirmée":C.green,"Annulée":C.red,"Fidèle":C.blue,"VIP":C.gold,"Nouveau":C.green,"Inactif":C.muted};

const Badge = ({status}) => (
  <span style={{background:`${STATUS_C[status]||C.muted}20`,color:STATUS_C[status]||C.muted,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:999,whiteSpace:"nowrap"}}>{status}</span>
);
const Spinner = ({size=20}) => <span style={{display:"inline-block",width:size,height:size,border:`3px solid #1e2d45`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;

// ─── HOOK TEMPS RÉEL ─────────────────────────────────────────────────────────
function useRealtimeTable(table, query = sb.from(table).select("*").order("created_at", {ascending:false})) {
  const [data,setData] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const load = async () => {
      const {data:rows} = await query;
      setData(rows||[]);
      setLoading(false);
    };
    load();
    const ch = sb.channel(`${table}-live`)
      .on("postgres_changes",{event:"*",schema:"public",table},()=>load())
      .subscribe();
    return ()=>sb.removeChannel(ch);
  },[table]);

  return {data,setData,loading};
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({icon,label,value,sub,color=C.gold,i=0}) => (
  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 24px",animation:`fadeUp .4s ease ${i*.07}s both`}}>
    <div style={{width:44,height:44,borderRadius:12,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:14}}>{icon}</div>
    <p style={{fontSize:26,fontWeight:900,fontFamily:"'Playfair Display',serif",color:C.white,marginBottom:4}}>{value}</p>
    <p style={{fontSize:13,fontWeight:700,color:C.white,marginBottom:2}}>{label}</p>
    {sub&&<p style={{fontSize:11,color:C.muted}}>{sub}</p>}
  </div>
);

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard() {
  const {data:orders,loading:lo} = useRealtimeTable("orders");
  const {data:reservations,loading:lr} = useRealtimeTable("reservations");
  const {data:products,loading:lp} = useRealtimeTable("products",sb.from("products").select("*"));
  const {data:messages,loading:lm} = useRealtimeTable("messages");

  const revenue = orders.filter(o=>o.status!=="Annulé").reduce((s,o)=>s+o.total,0);
  const resRev  = reservations.filter(r=>r.status==="Confirmée").reduce((s,r)=>s+r.total,0);

  if(lo||lr||lp||lm) return <div style={{display:"flex",gap:14,alignItems:"center",padding:"40px 0"}}><Spinner/><span style={{color:C.muted,fontSize:15}}>Chargement…</span></div>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:28}}>
      <div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,marginBottom:4}}>Tableau de bord</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:C.green,display:"inline-block",animation:"pulse 2s ease infinite"}}/>
          <p style={{color:C.muted,fontSize:14}}>Synchronisé en temps réel avec Supabase</p>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16}}>
        <StatCard i={0} icon="💰" label="Revenus commandes" value={fmt(revenue)} sub={`${orders.filter(o=>o.status!=="Annulé").length} confirmées`} color={C.gold}/>
        <StatCard i={1} icon="📅" label="Revenus réservations" value={fmt(resRev)} sub={`${reservations.filter(r=>r.status==="Confirmée").length} confirmées`} color={C.purple}/>
        <StatCard i={2} icon="📦" label="Commandes" value={orders.length} sub={`${orders.filter(o=>o.status==="En cours").length} en cours`} color={C.blue}/>
        <StatCard i={3} icon="🗓️" label="Réservations" value={reservations.length} sub={`${reservations.filter(r=>r.status==="En attente").length} en attente`} color={C.cyan}/>
        <StatCard i={4} icon="🛍️" label="Produits actifs" value={products.filter(p=>p.active).length} sub={`${products.filter(p=>p.orig_price).length} en promo`} color={C.orange}/>
        <StatCard i={5} icon="💬" label="Messages" value={messages.filter(m=>!m.read).length} sub="non lus" color={C.red}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:18}}>⚡ Dernières commandes</h3>
          {orders.length===0?<p style={{color:C.muted,fontSize:13}}>Aucune commande pour l'instant.</p>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {orders.slice(0,6).map(o=>(
                <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:C.card2,borderRadius:12,border:`1px solid ${C.border}`}}>
                  <div>
                    <p style={{fontWeight:700,fontSize:13,color:C.white}}>{o.client_name}</p>
                    <p style={{fontSize:11,color:C.muted}}>{o.id} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <p style={{fontWeight:800,fontSize:13,color:C.gold,marginBottom:3}}>{fmt(o.total)}</p>
                    <Badge status={o.status}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:18}}>⚡ Réservations récentes</h3>
          {reservations.length===0?<p style={{color:C.muted,fontSize:13}}>Aucune réservation pour l'instant.</p>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {reservations.slice(0,6).map(r=>(
                <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:C.card2,borderRadius:12,border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{fontSize:20}}>{r.product_emoji}</span>
                    <div>
                      <p style={{fontWeight:700,fontSize:13,color:C.white}}>{r.client_name}</p>
                      <p style={{fontSize:11,color:C.muted}}>{r.date_from} · {r.persons} pers.</p>
                    </div>
                  </div>
                  <Badge status={r.status}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS SECTION ────────────────────────────────────────────────────────
function ProductsSection() {
  const {data:products,setData:setProducts,loading} = useRealtimeTable("products",sb.from("products").select("*").order("id"));
  const [search,setSearch]=useState("");
  const [filterCat,setFilterCat]=useState("all");
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({cat:"mode",name:"",price:"",orig_price:"",emoji:"🛍️",desc:"",badge:"",bookable:false,book_type:"",dest:"",active:true});
  const [saving,setSaving]=useState(false);
  const [notif,setNotif]=useState(null);

  const notify=(msg,color=C.green)=>{setNotif({msg,color});setTimeout(()=>setNotif(null),3000);};

  const filtered=products.filter(p=>(filterCat==="all"||p.cat===filterCat)&&p.name.toLowerCase().includes(search.toLowerCase()));

  const startEdit=p=>{setEditing(p.id);setForm({...p,price:String(p.price),orig_price:String(p.orig_price||"")});setShowForm(true);};
  const startNew=()=>{setEditing(null);setForm({cat:"mode",name:"",price:"",orig_price:"",emoji:"🛍️",desc:"",badge:"",bookable:false,book_type:"",dest:"",active:true});setShowForm(true);};

  const save=async()=>{
    setSaving(true);
    const payload={cat:form.cat,name:form.name,price:Number(form.price),orig_price:form.orig_price?Number(form.orig_price):null,emoji:form.emoji,desc:form.desc,badge:form.badge||null,bookable:!!form.bookable,book_type:form.book_type||null,dest:form.dest||null,active:form.active};
    if(editing){
      const {error}=await sb.from("products").update(payload).eq("id",editing);
      if(!error)notify("✓ Produit mis à jour — visible côté client instantanément !");
      else notify("❌ Erreur lors de la mise à jour",C.red);
    } else {
      const {error}=await sb.from("products").insert(payload);
      if(!error)notify("✓ Produit ajouté — visible côté client instantanément !");
      else notify("❌ Erreur lors de l'ajout",C.red);
    }
    setSaving(false);
    setShowForm(false);
  };

  const toggle=async(p)=>{
    await sb.from("products").update({active:!p.active}).eq("id",p.id);
    notify(p.active?"⏸ Produit désactivé côté client":"▶ Produit réactivé côté client",p.active?C.orange:C.green);
  };

  const remove=async(id)=>{
    await sb.from("products").delete().eq("id",id);
    notify("🗑️ Produit supprimé",C.red);
  };

  const inp2=(field,label,placeholder="",type="text")=>(
    <div>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <input type={type} value={form[field]||""} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <div>
      {notif&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:C.card,border:`1px solid ${notif.color}`,color:notif.color,padding:"12px 22px",borderRadius:12,fontWeight:700,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,0.5)",animation:"fadeUp .3s ease"}}>{notif.msg}</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Produits & Catalogue</h2>
          <p style={{color:C.muted,fontSize:14}}>Toute modification est répercutée instantanément côté client</p>
        </div>
        <button onClick={startNew} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Nouvel article</button>
      </div>

      {showForm&&(
        <div style={{background:C.card,border:`1px solid ${C.gold}44`,borderRadius:18,padding:24,marginBottom:22,animation:"fadeUp .3s ease"}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:C.gold,marginBottom:18}}>{editing?"Modifier l'article":"Nouvel article"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14}}>
            {inp2("name","Nom du produit","Ex: Sneakers Urban...")}
            {inp2("emoji","Emoji","👗")}
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Catégorie</label>
              <select value={form.cat||""} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                {CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:14}}>{inp2("desc","Description","Description courte du produit…")}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}}>
            {inp2("price","Prix actuel (FCFA)","45000","number")}
            {inp2("orig_price","Prix barré / original","60000 (optionnel)","number")}
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Badge</label>
              <select value={form.badge||""} onChange={e=>setForm(f=>({...f,badge:e.target.value||null}))} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">— Aucun —</option>
                <option value="Nouveau">🟢 Nouveau</option>
                <option value="Promo">🔴 Promo</option>
                <option value="Bestseller">⭐ Bestseller</option>
                <option value="Premium">💜 Premium</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Paiement via</label>
              <select value={form.dest||""} onChange={e=>setForm(f=>({...f,dest:e.target.value||null}))} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">Standard</option>
                <option value="stripe">💳 Stripe</option>
                <option value="paypal">🅿️ PayPal</option>
                <option value="systeme">⚡ Systeme.io</option>
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Type de réservation</label>
              <select value={form.book_type||""} onChange={e=>setForm(f=>({...f,book_type:e.target.value||null,bookable:!!e.target.value}))} style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">— Pas de réservation —</option>
                <option value="vol">✈️ Vol</option>
                <option value="circuit">🗺️ Circuit</option>
                <option value="voiture">🚗 Voiture</option>
                <option value="appart">🏠 Appartement</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:24}}>
              <input type="checkbox" checked={!!form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))} id="active" style={{width:18,height:18,accentColor:C.gold,cursor:"pointer"}}/>
              <label htmlFor="active" style={{fontSize:14,fontWeight:600,color:C.white,cursor:"pointer"}}>Produit visible côté client</label>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={save} disabled={saving||!form.name||!form.price} style={{background:saving||!form.name||!form.price?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:saving||!form.name||!form.price?C.muted:C.bg,border:"none",borderRadius:12,padding:"12px 24px",fontWeight:700,fontSize:14,cursor:saving?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>
              {saving?<><Spinner size={16}/>Sauvegarde…</>:"💾 Sauvegarder & publier"}
            </button>
            <button onClick={()=>setShowForm(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"12px 18px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Annuler</button>
          </div>
        </div>
      )}

      {loading?<div style={{display:"flex",gap:10,alignItems:"center",padding:"30px 0"}}><Spinner/><span style={{color:C.muted}}>Chargement des produits…</span></div>:(
        <>
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 14px",gap:8}}>
              <span style={{color:C.gold}}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
            </div>
            {[{id:"all",label:"Tous"},...CATS].map(c=>(
              <button key={c.id} onClick={()=>setFilterCat(c.id)} style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${filterCat===c.id?C.gold:C.border}`,background:filterCat===c.id?`${C.gold}18`:"transparent",color:filterCat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{c.label}</button>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
            {filtered.map(p=>(
              <div key={p.id} style={{background:C.card,border:`1px solid ${p.active?C.border:"#111"}`,borderRadius:16,padding:18,display:"flex",gap:14,alignItems:"center",opacity:p.active?1:0.45}}>
                <div style={{fontSize:32,flexShrink:0}}>{p.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,fontSize:14,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.name}</p>
                  <p style={{fontSize:11,color:C.muted,marginBottom:5}}>{CATS.find(c=>c.id===p.cat)?.label}{!p.active&&" · 🔴 Masqué"}</p>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,color:C.gold,fontSize:14}}>{fmt(p.price)}</span>
                    {p.orig_price&&<span style={{textDecoration:"line-through",color:C.muted,fontSize:11}}>{fmt(p.orig_price)}</span>}
                    {p.badge&&<span style={{background:`${BADGE_C[p.badge]||C.gold}25`,color:BADGE_C[p.badge]||C.gold,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:999}}>{p.badge}</span>}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                  <button onClick={()=>startEdit(p)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.gold,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>✏️ Éditer</button>
                  <button onClick={()=>toggle(p)} style={{background:"none",border:`1px solid ${p.active?C.orange:C.green}44`,color:p.active?C.orange:C.green,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{p.active?"⏸ Masquer":"▶ Afficher"}</button>
                  <button onClick={()=>remove(p.id)} style={{background:"none",border:`1px solid ${C.red}44`,color:C.red,borderRadius:8,padding:"5px 11px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>🗑️ Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── ORDERS SECTION ──────────────────────────────────────────────────────────
function OrdersSection() {
  const {data:orders,loading} = useRealtimeTable("orders");
  const [filter,setFilter]=useState("Tous");
  const statuses=["Tous","En cours","Confirmé","Livré","Annulé"];
  const filtered=filter==="Tous"?orders:orders.filter(o=>o.status===filter);

  const updateStatus=async(id,status)=>{await sb.from("orders").update({status}).eq("id",id);};

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Suivi des commandes</h2>
        <p style={{color:C.muted,fontSize:14}}>{orders.length} commandes · {fmt(orders.filter(o=>o.status!=="Annulé").reduce((s,o)=>s+o.total,0))} de revenus</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {statuses.map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:"8px 16px",borderRadius:999,border:`1.5px solid ${filter===s?(STATUS_C[s]||C.gold):C.border}`,background:filter===s?`${STATUS_C[s]||C.gold}18`:"transparent",color:filter===s?(STATUS_C[s]||C.gold):C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{s}</button>
        ))}
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:filtered.length===0?<p style={{color:C.muted,fontSize:14,padding:"40px 0",textAlign:"center"}}>Aucune commande {filter!=="Tous"?`avec le statut "${filter}"`:""} pour l'instant.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(o=>(
            <div key={o.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                    <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:16,color:C.white}}>{o.client_name}</span>
                    <span style={{fontSize:12,color:C.muted}}>{o.id}</span>
                    <Badge status={o.status}/>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
                    {(o.items||[]).map((item,i)=>(
                      <span key={i} style={{fontSize:12,background:C.card2,padding:"3px 10px",borderRadius:9,color:C.muted}}>{item.emoji} {item.name} ×{item.qty}</span>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:14,fontSize:12,color:C.muted,flexWrap:"wrap"}}>
                    <span>📧 {o.client_email}</span>
                    <span>📱 {o.client_tel}</span>
                    <span>💳 {o.pay_method}</span>
                    <span>📅 {new Date(o.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:20,color:C.gold,marginBottom:8}}>{fmt(o.total)}</p>
                  <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.white,borderRadius:9,padding:"7px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",outline:"none"}}>
                    {["En cours","Confirmé","Livré","Annulé"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RESERVATIONS SECTION ────────────────────────────────────────────────────
function ReservationsSection() {
  const {data:reservations,loading} = useRealtimeTable("reservations");
  const [filter,setFilter]=useState("Tous");
  const types=["Tous","vol","circuit","voiture","appart"];
  const filtered=filter==="Tous"?reservations:reservations.filter(r=>r.book_type===filter);

  const update=async(id,status)=>{await sb.from("reservations").update({status}).eq("id",id);};

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Suivi des réservations</h2>
        <p style={{color:C.muted,fontSize:14}}>{reservations.length} réservations · {reservations.filter(r=>r.status==="En attente").length} en attente</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {types.map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${filter===t?C.gold:C.border}`,background:filter===t?`${C.gold}18`:"transparent",color:filter===t?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"}}>{t==="Tous"?"Tous":CATS.find(c=>c.id===t)?.label||t}</button>
        ))}
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:filtered.length===0?<p style={{color:C.muted,fontSize:14,padding:"40px 0",textAlign:"center"}}>Aucune réservation pour l'instant.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(r=>(
            <div key={r.id} style={{background:C.card,border:`1px solid ${r.status==="En attente"?`${C.orange}55`:C.border}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <div style={{width:52,height:52,borderRadius:14,background:`${C.gold}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,border:`1px solid ${C.border}`}}>{r.product_emoji}</div>
                  <div>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:5}}>
                      <span style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:16,color:C.white}}>{r.client_name}</span>
                      <span style={{fontSize:12,color:C.muted}}>{r.id}</span>
                      <Badge status={r.status}/>
                    </div>
                    <p style={{fontSize:14,fontWeight:600,color:C.white,marginBottom:5}}>{r.product_name}</p>
                    <div style={{display:"flex",gap:14,fontSize:12,color:C.muted,flexWrap:"wrap"}}>
                      <span>📅 Départ : {r.date_from}</span>
                      {r.date_to&&<span>↩ Retour : {r.date_to}</span>}
                      <span>👥 {r.persons} pers.</span>
                      <span>📧 {r.client_email}</span>
                      <span>📱 {r.client_tel}</span>
                    </div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <p style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:20,color:C.gold,marginBottom:8}}>{fmt(r.total)}</p>
                  <select value={r.status} onChange={e=>update(r.id,e.target.value)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.white,borderRadius:9,padding:"7px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",outline:"none"}}>
                    {["En attente","Confirmée","Annulée"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STATS SECTION ───────────────────────────────────────────────────────────
function StatsSection() {
  const {data:orders} = useRealtimeTable("orders");
  const {data:reservations} = useRealtimeTable("reservations");
  const totalRev=orders.filter(o=>o.status!=="Annulé").reduce((s,o)=>s+o.total,0);
  const resRev=reservations.filter(r=>r.status==="Confirmée").reduce((s,r)=>s+r.total,0);
  const byMethod=["Stripe","PayPal","Systeme.io"].map(m=>({label:m,count:orders.filter(o=>o.pay_method===m).length,rev:orders.filter(o=>o.pay_method===m&&o.status!=="Annulé").reduce((s,o)=>s+o.total,0)}));

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Statistiques & Revenus</h2>
        <p style={{color:C.muted,fontSize:14}}>Données en temps réel depuis Supabase</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:24}}>
        <StatCard i={0} icon="💰" label="Revenus commandes" value={fmt(totalRev)} color={C.gold}/>
        <StatCard i={1} icon="📅" label="Revenus réservations" value={fmt(resRev)} color={C.purple}/>
        <StatCard i={2} icon="💵" label="Total général" value={fmt(totalRev+resRev)} color={C.green}/>
        <StatCard i={3} icon="🛒" label="Panier moyen" value={orders.length?fmt((totalRev)/orders.length):fmt(0)} color={C.blue}/>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24,marginBottom:20}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:18}}>Répartition par méthode de paiement</h3>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {byMethod.map((m,i)=>(
            <div key={m.label}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700,color:C.white}}>{["💳","🅿️","⚡"][i]} {m.label}</span>
                <span style={{fontSize:13,fontWeight:800,color:[C.stripe,C.paypal,C.sys][i]}}>{m.count} commandes · {fmt(m.rev)}</span>
              </div>
              <div style={{height:10,background:C.card2,borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:orders.length?`${(m.count/orders.length)*100}%`:"0%",background:`linear-gradient(90deg,${[C.stripe,C.paypal,C.sys][i]}88,${[C.stripe,C.paypal,C.sys][i]})`,borderRadius:999,transition:"width 1s ease"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
        <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:18}}>Statut des commandes</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
          {["En cours","Confirmé","Livré","Annulé"].map(s=>{
            const cnt=orders.filter(o=>o.status===s).length;
            return (
              <div key={s} style={{background:C.card2,border:`1px solid ${STATUS_C[s]||C.border}33`,borderRadius:14,padding:"18px 16px",textAlign:"center"}}>
                <p style={{fontSize:28,fontWeight:900,fontFamily:"'Playfair Display',serif",color:STATUS_C[s]||C.white,marginBottom:4}}>{cnt}</p>
                <p style={{fontSize:13,fontWeight:700,color:C.white}}>{s}</p>
                <p style={{fontSize:11,color:C.muted,marginTop:2}}>{orders.length?Math.round(cnt/orders.length*100):0}% du total</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MESSAGES SECTION ────────────────────────────────────────────────────────
function MessagesSection() {
  const {data:messages,setData:setMessages,loading} = useRealtimeTable("messages");
  const [selected,setSelected]=useState(null);
  const [reply,setReply]=useState("");
  const [sending,setSending]=useState(false);

  const markRead=async id=>{
    await sb.from("messages").update({read:true}).eq("id",id);
    setMessages(l=>l.map(m=>m.id===id?{...m,read:true}:m));
  };

  const sendReply=async()=>{
    if(!reply.trim()||!selected)return;
    setSending(true);
    await sb.from("messages").update({replied:true,read:true,reply_text:reply}).eq("id",selected.id);
    setMessages(l=>l.map(m=>m.id===selected.id?{...m,replied:true,read:true,reply_text:reply}:m));
    setSelected(s=>({...s,replied:true,reply_text:reply}));
    setReply("");
    setSending(false);
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:20,height:"72vh"}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 20px",borderBottom:`1px solid ${C.border}`}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:20,marginBottom:2}}>Messages</h2>
          <p style={{color:C.muted,fontSize:13}}>{messages.filter(m=>!m.read).length} non lu{messages.filter(m=>!m.read).length!==1?"s":""}</p>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {loading?<div style={{padding:20,display:"flex",gap:10,alignItems:"center"}}><Spinner size={16}/><span style={{color:C.muted,fontSize:13}}>Chargement…</span></div>:messages.length===0?<p style={{padding:20,color:C.muted,fontSize:13}}>Aucun message.</p>:messages.map(m=>(
            <div key={m.id} onClick={()=>{setSelected(m);markRead(m.id);}} style={{padding:"14px 20px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",background:selected?.id===m.id?C.card2:"transparent",borderLeft:`3px solid ${selected?.id===m.id?C.gold:!m.read?C.blue:"transparent"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontWeight:m.read?600:800,fontSize:14,color:m.read?C.muted:C.white}}>{m.from_name}</span>
                <span style={{fontSize:11,color:C.muted}}>{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
              <p style={{fontWeight:m.read?500:700,fontSize:13,color:m.read?C.muted:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}>{m.subject}</p>
              <div style={{display:"flex",gap:6}}>
                {!m.read&&<span style={{background:`${C.blue}22`,color:C.blue,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:999}}>Nouveau</span>}
                {m.replied&&<span style={{background:`${C.green}22`,color:C.green,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:999}}>Répondu</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {selected?(
          <>
            <div style={{padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:6}}>{selected.subject}</h3>
              <div style={{display:"flex",gap:14,fontSize:13,color:C.muted,flexWrap:"wrap"}}>
                <span>👤 {selected.from_name}</span>
                <span>📧 {selected.from_email}</span>
                <span>📅 {new Date(selected.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
            <div style={{flex:1,padding:24,overflowY:"auto"}}>
              <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",marginBottom:16}}>
                <p style={{fontSize:15,lineHeight:1.7,color:C.white}}>{selected.message}</p>
              </div>
              {selected.reply_text&&(
                <div style={{background:`${C.green}10`,border:`1px solid ${C.green}33`,borderRadius:14,padding:"14px 18px"}}>
                  <p style={{fontSize:12,color:C.green,fontWeight:700,marginBottom:6}}>✓ Votre réponse :</p>
                  <p style={{fontSize:14,color:C.white,lineHeight:1.6}}>{selected.reply_text}</p>
                </div>
              )}
            </div>
            <div style={{padding:"16px 24px",borderTop:`1px solid ${C.border}`}}>
              <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder={`Répondre à ${selected.from_name}…`} rows={3}
                style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box",marginBottom:10}}/>
              <button onClick={sendReply} disabled={!reply.trim()||sending} style={{background:!reply.trim()||sending?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:!reply.trim()||sending?C.muted:C.bg,border:"none",borderRadius:12,padding:"11px 24px",fontWeight:700,fontSize:14,cursor:!reply.trim()||sending?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                {sending?<><Spinner size={16}/>Envoi…</>:"✦ Envoyer la réponse"}
              </button>
            </div>
          </>
        ):(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:C.muted}}>
            <div style={{fontSize:48}}>💬</div>
            <p style={{fontWeight:700,fontSize:16}}>Sélectionnez un message</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ADMIN ───────────────────────────────────────────────────────────────
const MENU=[
  {id:"dashboard",label:"Tableau de bord",icon:"📊"},
  {id:"products",label:"Produits",icon:"🛍️"},
  {id:"orders",label:"Commandes",icon:"📦"},
  {id:"reservations",label:"Réservations",icon:"📅"},
  {id:"stats",label:"Statistiques",icon:"📈"},
  {id:"messages",label:"Messages",icon:"💬"},
];

export default function SMallAdmin() {
  const [auth,setAuth]=useState(false);
  const [pwd,setPwd]=useState("");
  const [err,setErr]=useState("");
  const [section,setSection]=useState("dashboard");
  const {data:messages}=useRealtimeTable("messages");
  const unread=messages.filter(m=>!m.read).length;

  const login=()=>{if(pwd==="small2025"){setAuth(true);setErr("");}else setErr("Mot de passe incorrect.");};

  if(!auth) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%,100%{box-shadow:0 0 14px ${C.gold}55}50%{box-shadow:0 0 30px ${C.gold}99}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:28,padding:"52px 48px",width:"100%",maxWidth:400,textAlign:"center",animation:"fadeUp .5s ease",boxShadow:"0 24px 60px rgba(0,0,0,0.6)"}}>
        <div style={{width:72,height:72,borderRadius:20,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 22px",animation:"glow 3s ease infinite"}}>✦</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:26,marginBottom:4,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall Admin</h1>
        <p style={{color:C.muted,fontSize:14,marginBottom:32}}>Panneau de gestion privé · Supabase</p>
        <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Mot de passe…"
          style={{width:"100%",background:C.card2,border:`1.5px solid ${err?C.red:C.border}`,borderRadius:12,padding:"13px 16px",color:C.white,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:err?8:16,textAlign:"center",letterSpacing:4}}/>
        {err&&<p style={{color:C.red,fontSize:13,marginBottom:14,fontWeight:600}}>{err}</p>}
        <button onClick={login} style={{width:"100%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:14,padding:"14px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Accéder au panneau →</button>
      </div>
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",fontFamily:"'DM Sans',sans-serif",color:C.white}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#0d1117;}::-webkit-scrollbar-thumb{background:${C.goldD};border-radius:10px;}@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes glow{0%,100%{box-shadow:0 0 14px ${C.gold}55}50%{box-shadow:0 0 30px ${C.gold}99}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}.menu-item:hover{background:${C.card2}!important;color:${C.gold}!important;}.menu-item{transition:all .2s;cursor:pointer;}`}</style>

      {/* SIDEBAR */}
      <aside style={{width:232,background:C.dark,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div style={{padding:"22px 18px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,animation:"glow 3s ease infinite"}}>✦</div>
            <div>
              <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:17,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</span>
              <span style={{fontSize:9,color:C.muted,display:"block",letterSpacing:2,textTransform:"uppercase"}}>Admin Panel</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:C.green,display:"inline-block",animation:"pulse 2s ease infinite"}}/>
            <span style={{fontSize:11,color:C.green,fontWeight:600}}>Connecté · Supabase</span>
          </div>
        </div>

        <nav style={{flex:1,padding:"14px 10px",display:"flex",flexDirection:"column",gap:3}}>
          {MENU.map(m=>(
            <button key={m.id} className="menu-item" onClick={()=>setSection(m.id)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:12,border:"none",background:section===m.id?C.card2:"transparent",color:section===m.id?C.gold:C.muted,fontWeight:section===m.id?700:600,fontSize:14,textAlign:"left",fontFamily:"'DM Sans',sans-serif",width:"100%"}}>
              <span style={{fontSize:18}}>{m.icon}</span>
              {m.label}
              {m.id==="messages"&&unread>0&&<span style={{marginLeft:"auto",background:C.red,color:C.white,borderRadius:999,padding:"1px 7px",fontSize:11,fontWeight:800}}>{unread}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setAuth(false)} style={{width:"100%",background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"9px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>⏻ Déconnexion</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{flex:1,padding:"36px",overflowY:"auto",maxHeight:"100vh"}}>
        {section==="dashboard"    && <Dashboard/>}
        {section==="products"     && <ProductsSection/>}
        {section==="orders"       && <OrdersSection/>}
        {section==="reservations" && <ReservationsSection/>}
        {section==="stats"        && <StatsSection/>}
        {section==="messages"     && <MessagesSection/>}
      </main>
    </div>
  );
}
