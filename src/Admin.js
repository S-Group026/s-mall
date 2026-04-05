import { useState, useEffect, useRef } from 'react';
import { sb } from './supabase';

const C = {
  bg:"#0a0a0a", dark:"#111111", card:"#161616", card2:"#1c1c1c",
  border:"#2a2a2a", gold:"#c9a84c", goldL:"#e8c97a", goldD:"#9a7a2e",
  white:"#f5f0e8", muted:"#888880", red:"#e05a4e", green:"#4caf7d",
  orange:"#f59e0b", blue:"#3b82f6", sys:"#e8533f",
};
const fmt = n => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

function Spinner({size=18}) {
  return <span style={{display:"inline-block",width:size,height:size,border:`2px solid ${C.border}`,borderTopColor:C.gold,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;
}

function useRealtimeTable(table, loadFn) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async()=>{ const {data:d}=await loadFn(); setData(d||[]); setLoading(false); };
  useEffect(()=>{
    load();
    const ch = sb.channel(`rt-${table}-${Date.now()}`).on("postgres_changes",{event:"*",schema:"public",table},load).subscribe();
    return ()=>sb.removeChannel(ch);
  },[]);
  return {data,loading};
}

// ── IMAGE UPLOADER ────────────────────────────────────────────────────────────
function ImageUploader({productId}) {
  const [images,setImages]=useState([]);
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef();

  const load=async()=>{ const {data}=await sb.from("product_images").select("*").eq("product_id",productId).order("position"); setImages(data||[]); };
  useEffect(()=>{ if(productId)load(); },[productId]);

  const upload=async(e)=>{
    const files=Array.from(e.target.files);
    if(!files.length)return;
    setUploading(true);
    for(const file of files){
      const ext=file.name.split(".").pop();
      const path=`product-${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const {error}=await sb.storage.from("Products").upload(path,file,{upsert:true});
      if(!error){
        const {data}=sb.storage.from("Products").getPublicUrl(path);
        await sb.from("product_images").insert({product_id:productId,url:data.publicUrl,position:images.length});
        if(images.length===0) await sb.from("products").update({image_url:data.publicUrl}).eq("id",productId);
      }
    }
    await load();
    setUploading(false);
  };

  const remove=async(img)=>{
    await sb.from("product_images").delete().eq("id",img.id);
    const remaining=images.filter(i=>i.id!==img.id);
    await sb.from("products").update({image_url:remaining[0]?.url||null}).eq("id",productId);
    await load();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <label style={{fontSize:12,fontWeight:700,color:C.muted}}>📸 Photos ({images.length})</label>
        <button onClick={()=>fileRef.current.click()} disabled={uploading} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:9,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
          {uploading?<><Spinner size={13}/>Upload…</>:"📤 Ajouter photos"}
        </button>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {images.length===0&&(
          <div onClick={()=>fileRef.current.click()} style={{width:80,height:80,borderRadius:12,background:C.card2,border:`2px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:24,color:C.muted}}>📷</div>
        )}
        {images.map((img,i)=>(
          <div key={img.id} style={{position:"relative",width:80,height:80,borderRadius:12,overflow:"hidden",border:`2px solid ${i===0?C.gold:C.border}`,flexShrink:0}}>
            <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            {i===0&&<span style={{position:"absolute",top:2,left:2,background:C.gold,color:C.bg,fontSize:7,fontWeight:800,padding:"1px 4px",borderRadius:4}}>MAIN</span>}
            <button onClick={()=>remove(img)} style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.7)",border:"none",color:C.red,borderRadius:5,width:18,height:18,cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        ))}
      </div>
      <p style={{fontSize:11,color:C.muted}}>1ère photo = image principale · JPG, PNG, WEBP</p>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} style={{display:"none"}}/>
    </div>
  );
}

// ── VARIANTS MANAGER ──────────────────────────────────────────────────────────
function VariantsManager({productId}) {
  const [variants,setVariants]=useState([]);
  const [showForm,setShowForm]=useState(false);
  const [editId,setEditId]=useState(null);
  const [vf,setVf]=useState({color:"",color_hex:"#000000",storage:"",size:"",price:""});
  const fmt2=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";

  const load=async()=>{ const {data}=await sb.from("product_variants").select("*").eq("product_id",productId).order("storage").order("color"); setVariants(data||[]); };
  useEffect(()=>{ if(productId)load(); },[productId]);

  const openAdd=()=>{ setEditId(null);setVf({color:"",color_hex:"#000000",storage:"",size:"",price:""});setShowForm(true); };
  const openEdit=(v)=>{ setEditId(v.id);setVf({color:v.color||"",color_hex:v.color_hex||"#000000",storage:v.storage||"",size:v.size||"",price:String(v.price)});setShowForm(true); };

  const save=async()=>{
    if(!vf.price)return;
    const payload={product_id:productId,color:vf.color||null,color_hex:vf.color_hex||null,storage:vf.storage||null,size:vf.size||null,price:Number(vf.price),active:true};
    if(editId) await sb.from("product_variants").update(payload).eq("id",editId);
    else await sb.from("product_variants").insert({...payload,stock:999});
    setShowForm(false);setEditId(null);await load();
  };

  const remove=async(id)=>{ await sb.from("product_variants").delete().eq("id",id);await load(); };

  const F=({label,field,placeholder,type="text"})=>(
    <div>
      <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>{label}</label>
      <input type={type} value={vf[field]} onChange={e=>setVf(f=>({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <label style={{fontSize:12,fontWeight:700,color:C.muted}}>🎛️ Variantes ({variants.length})</label>
        <button onClick={showForm?()=>setShowForm(false):openAdd} style={{background:`${C.blue}20`,border:`1px solid ${C.blue}44`,color:C.blue,borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {showForm?"✕ Fermer":"+ Ajouter variante"}
        </button>
      </div>

      {showForm&&(
        <div style={{background:C.bg,border:`1px solid ${editId?C.gold:C.blue}44`,borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:12}}>
          <p style={{fontSize:13,fontWeight:700,color:editId?C.gold:C.blue}}>{editId?"✏️ Modifier":"➕ Nouvelle variante"}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Couleur (nom)" field="color" placeholder="Ex: Noir, Blanc, Rose…"/>
            <div>
              <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Code couleur</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="color" value={vf.color_hex} onChange={e=>setVf(f=>({...f,color_hex:e.target.value}))}
                  style={{width:40,height:34,borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer",padding:2}}/>
                <div style={{width:22,height:22,borderRadius:"50%",background:vf.color_hex,border:`2px solid ${C.border}`}}/>
                <span style={{fontSize:11,color:C.muted}}>{vf.color_hex}</span>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Capacité</label>
              <select value={vf.storage} onChange={e=>setVf(f=>({...f,storage:e.target.value}))}
                style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">— Aucune —</option>
                {["32Go","64Go","128Go","256Go","512Go","1To","2To"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Taille</label>
              <select value={vf.size} onChange={e=>setVf(f=>({...f,size:e.target.value}))}
                style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">— Aucune —</option>
                {["XS","S","M","L","XL","XXL","3XL","38","39","40","41","42","43","44","45"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <F label="Prix (FCFA) *" field="price" placeholder="450000" type="number"/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={save} disabled={!vf.price}
              style={{background:vf.price?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#333",color:vf.price?C.bg:C.muted,border:"none",borderRadius:9,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:vf.price?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
              {editId?"💾 Sauvegarder":"✓ Ajouter"}
            </button>
            <button onClick={()=>setShowForm(false)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"9px 13px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
          </div>
        </div>
      )}

      {variants.length>0?(
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {variants.map(v=>(
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px"}}>
              {v.color_hex&&<div style={{width:20,height:20,borderRadius:"50%",background:v.color_hex,border:"2px solid rgba(255,255,255,0.15)",flexShrink:0}}/>}
              <span style={{fontSize:13,color:C.white,flex:1}}>{[v.storage,v.color,v.size].filter(Boolean).join(" · ")||"Variante"}</span>
              <span style={{fontWeight:800,color:C.gold,fontSize:13,minWidth:110,textAlign:"right"}}>{fmt2(v.price)}</span>
              <div style={{display:"flex",gap:5}}>
                <button onClick={()=>openEdit(v)} style={{background:`${C.gold}15`,border:`1px solid ${C.gold}33`,color:C.gold,borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>✏️</button>
                <button onClick={()=>remove(v.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ):(
        !showForm&&<p style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Aucune variante. Le produit sera vendu à prix fixe.</p>
      )}
    </div>
  );
}

// ── PRODUCTS SECTION ──────────────────────────────────────────────────────────
function ProductsSection() {
  const [CATS,setCATS]=useState([]);
  const {data:products,loading}=useRealtimeTable("products", ()=>sb.from("products").select("*").order("id"));
  const [showForm,setShowForm]=useState(false);
  const [editing,setEditing]=useState(null);
  const [savedId,setSavedId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [search,setSearch]=useState("");
  const [filterCat,setFilterCat]=useState("all");
  const [form,setForm]=useState({cat:"mode",name:"",price:"",orig_price:"",emoji:"🛍️",desc:"",badge:"",bookable:false,book_type:"",dest:"",active:true,image_url:"",download_url:""});

  useEffect(()=>{
    sb.from("categories").select("*").order("position").then(({data})=>setCATS(data||[]));
  },[]);

  const startNew=()=>{ setEditing(null);setSavedId(null);setForm({cat:"mode",name:"",price:"",orig_price:"",emoji:"🛍️",desc:"",badge:"",bookable:false,book_type:"",dest:"",active:true,image_url:"",download_url:""});setShowForm(true); };
  const startEdit=(p)=>{ setEditing(p);setSavedId(p.id);setForm({cat:p.cat,name:p.name,price:String(p.price),orig_price:p.orig_price?String(p.orig_price):"",emoji:p.emoji||"🛍️",desc:p.desc||p.description||"",badge:p.badge||"",bookable:!!p.bookable,book_type:p.book_type||"",dest:p.dest||"",active:p.active!==false,image_url:p.image_url||"",download_url:p.download_url||""});setShowForm(true); };

  const save=async()=>{
    if(!form.name.trim()||!form.price){return;}
    setSaving(true);
    const payload={cat:form.cat,name:form.name.trim(),price:Number(form.price),orig_price:form.orig_price?Number(form.orig_price):null,emoji:form.emoji||"🛍️",description:form.desc,badge:form.badge||null,bookable:!!form.bookable,book_type:form.book_type||null,dest:form.dest||null,active:form.active,download_url:form.download_url||null};
    if(editing){
      await sb.from("products").update(payload).eq("id",editing.id);
      setSavedId(editing.id);
    } else {
      const {data,error}=await sb.from("products").insert({...payload,image_url:null}).select().single();
      if(data){setSavedId(data.id);setEditing(data);}
      if(error)alert("Erreur: "+error.message);
    }
    setSaving(false);
  };

  const deleteProduct=async(id)=>{
    if(!window.confirm("Supprimer ce produit ?"))return;
    await sb.from("products").delete().eq("id",id);
    if(showForm&&(editing?.id===id||savedId===id)){setShowForm(false);setEditing(null);setSavedId(null);}
  };

  const toggleActive=async(p)=>{ await sb.from("products").update({active:!p.active}).eq("id",p.id); };

  const cats=[{id:"all",label:"Tous"},...CATS];
  const filtered=products.filter(p=>(filterCat==="all"||p.cat===filterCat)&&(p.name||"").toLowerCase().includes(search.toLowerCase()));

  const inp2=(field,label,placeholder="",type="text")=>(
    <div style={{marginBottom:10}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Produits</h2>
          <p style={{color:C.muted,fontSize:14}}>{products.length} produit{products.length!==1?"s":""} au total</p>
        </div>
        <button onClick={showForm?()=>{setShowForm(false);setEditing(null);setSavedId(null);}:startNew}
          style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {showForm?"✕ Fermer":"+ Nouveau produit"}
        </button>
      </div>

      {showForm&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24,marginBottom:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:19,marginBottom:18,color:C.gold}}>{editing?"✏️ Modifier le produit":"➕ Nouveau produit"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Catégorie</label>
                <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  {CATS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              {inp2("name","Nom du produit *","Ex: iPhone 16 Pro Max…")}
              {inp2("emoji","Emoji","📱")}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Description</label>
                <textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Description du produit…" rows={3}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
              </div>
              {(form.cat==="formation"||form.dest==="systeme")&&(
                <div style={{background:`${C.sys}10`,border:`1px solid ${C.sys}33`,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
                  <p style={{fontWeight:700,fontSize:13,color:C.sys,marginBottom:8}}>⚡ Lien formation / ebook</p>
                  {inp2("download_url","Lien de téléchargement","https://… (PDF ou Systeme.io)")}
                  <p style={{fontSize:11,color:C.muted}}>Envoyé automatiquement au client après paiement.</p>
                </div>
              )}
            </div>
            <div>
              {inp2("price","Prix actuel (FCFA) *","450000","number")}
              {inp2("orig_price","Prix barré (FCFA)","600000","number")}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Badge</label>
                <select value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  <option value="">— Aucun —</option>
                  {["Nouveau","Bestseller","Promo","Premium"].map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:12}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flex:1,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
                  <input type="checkbox" checked={form.bookable} onChange={e=>setForm(f=>({...f,bookable:e.target.checked}))} style={{accentColor:C.gold,width:16,height:16}}/>
                  <span style={{fontSize:13,color:C.white,fontWeight:600}}>Réservable</span>
                </label>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flex:1,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
                  <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))} style={{accentColor:C.gold,width:16,height:16}}/>
                  <span style={{fontSize:13,color:C.white,fontWeight:600}}>Visible</span>
                </label>
              </div>
              {form.bookable&&(
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Type de réservation</label>
                  <select value={form.book_type} onChange={e=>setForm(f=>({...f,book_type:e.target.value}))}
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                    <option value="">— Choisir —</option>
                    {["vol","circuit","voiture","appart"].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button onClick={save} disabled={saving||!form.name||!form.price}
                  style={{flex:1,background:saving||!form.name||!form.price?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:saving||!form.name||!form.price?C.muted:C.bg,border:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {saving?<><Spinner size={15}/>Sauvegarde…</>:"💾 Sauvegarder"}
                </button>
                <button onClick={()=>{setShowForm(false);setEditing(null);setSavedId(null);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"11px 18px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Annuler</button>
              </div>
            </div>
          </div>

          {savedId&&(
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:C.card2,border:`1px solid ${C.gold}33`,borderRadius:14,padding:18}}>
                <ImageUploader productId={savedId}/>
              </div>
              <div style={{background:C.card2,border:`1px solid ${C.blue}33`,borderRadius:14,padding:18}}>
                <VariantsManager productId={savedId}/>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 14px",gap:8}}>
          <span style={{color:C.gold}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher…" style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
        </div>
        {cats.map(c=>(
          <button key={c.id} onClick={()=>setFilterCat(c.id)} style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${filterCat===c.id?C.gold:C.border}`,background:filterCat===c.id?`${C.gold}18`:"transparent",color:filterCat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{c.label}</button>
        ))}
      </div>

      {loading?<div style={{display:"flex",gap:10,alignItems:"center",padding:"30px 0"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {filtered.map(p=>(
            <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
              <div style={{height:110,position:"relative",background:"linear-gradient(135deg,#161200,#201a00)"}}>
                {p.image_url?<img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:38}}>{p.emoji}</div>}
                {!p.active&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.red,fontWeight:800,fontSize:12}}>🔴 Masqué</span></div>}
              </div>
              <div style={{padding:"12px 14px"}}>
                <p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</p>
                <p style={{fontSize:11,color:C.muted,marginBottom:8}}>{CATS.find(c=>c.id===p.cat)?.label}{p.badge&&` · ${p.badge}`}</p>
                <p style={{fontWeight:800,fontSize:14,color:C.gold,marginBottom:10}}>{fmt(p.price)}</p>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>startEdit(p)} style={{flex:1,background:`${C.gold}15`,border:`1px solid ${C.gold}33`,color:C.gold,borderRadius:9,padding:"6px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✏️ Modifier</button>
                  <button onClick={()=>toggleActive(p)} style={{background:`${p.active?C.red:C.green}15`,border:`1px solid ${p.active?C.red:C.green}33`,color:p.active?C.red:C.green,borderRadius:9,padding:"6px 8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{p.active?"🙈":"👁"}</button>
                  <button onClick={()=>deleteProduct(p.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:9,padding:"6px 8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ORDERS SECTION ────────────────────────────────────────────────────────────
function OrdersSection() {
  const {data:orders,loading}=useRealtimeTable("orders", ()=>sb.from("orders").select("*").order("created_at",{ascending:false}));
  const STATUSES=["En cours","Confirmé","Expédié","Livré","Annulé"];
  const updateStatus=async(id,status)=>{ await sb.from("orders").update({status}).eq("id",id); };

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Commandes</h2>
        <p style={{color:C.muted,fontSize:14}}>{orders.length} commande{orders.length!==1?"s":""}</p>
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:orders.length===0?<p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucune commande pour l'instant.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {orders.map(o=>(
            <div key={o.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,fontSize:15,color:C.white}}>{o.client_name}</span>
                    <span style={{fontSize:12,color:C.muted}}>#{o.id}</span>
                    <span style={{background:`${o.status==="Livré"?C.green:o.status==="Annulé"?C.red:C.gold}20`,color:o.status==="Livré"?C.green:o.status==="Annulé"?C.red:C.gold,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:999}}>{o.status}</span>
                  </div>
                  <p style={{fontSize:12,color:C.muted,marginBottom:4}}>📧 {o.client_email} · 📞 {o.client_tel}</p>
                  <p style={{fontSize:12,color:C.muted,marginBottom:6}}>📍 {o.country||"N/A"} · 💳 {o.pay_method} · {new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {(o.items||[]).map((item,i)=>(
                      <span key={i} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"3px 9px",fontSize:11,color:C.muted}}>
                        {item.emoji} {item.name}{item.variant?` (${item.variant})`:""} ×{item.qty}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:C.gold}}>{fmt(o.total)}</span>
                  <select value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}
                    style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,padding:"6px 11px",color:C.white,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
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

// ── RESERVATIONS SECTION ──────────────────────────────────────────────────────
function ReservationsSection() {
  const {data:reservations,loading}=useRealtimeTable("reservations", ()=>sb.from("reservations").select("*").order("created_at",{ascending:false}));
  const updateStatus=async(id,status)=>{ await sb.from("reservations").update({status}).eq("id",id); };

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Réservations</h2>
        <p style={{color:C.muted,fontSize:14}}>{reservations.length} réservation{reservations.length!==1?"s":""}</p>
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:reservations.length===0?<p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucune réservation.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {reservations.map(r=>(
            <div key={r.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:20}}>{r.product_emoji}</span>
                    <span style={{fontWeight:800,fontSize:15,color:C.white}}>{r.client_name}</span>
                    <span style={{fontSize:12,color:C.muted}}>— {r.product_name}</span>
                    <span style={{background:`${r.status==="Confirmé"?C.green:r.status==="Annulé"?C.red:C.gold}20`,color:r.status==="Confirmé"?C.green:r.status==="Annulé"?C.red:C.gold,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:999}}>{r.status}</span>
                  </div>
                  <p style={{fontSize:12,color:C.muted,marginBottom:3}}>📧 {r.client_email} · 📞 {r.client_tel}</p>
                  <p style={{fontSize:12,color:C.muted}}>📅 {r.date_from}{r.date_to?` → ${r.date_to}`:""} · 👥 {r.persons} pers. · {new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:C.gold}}>{fmt(r.total)}</span>
                  <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}
                    style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,padding:"6px 11px",color:C.white,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}>
                    {["En attente","Confirmé","Annulé"].map(s=><option key={s} value={s}>{s}</option>)}
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

// ── MESSAGES SECTION ──────────────────────────────────────────────────────────
function MessagesSection() {
  const {data:messages,loading}=useRealtimeTable("messages", ()=>sb.from("messages").select("*").order("created_at",{ascending:false}));
  const [selected,setSelected]=useState(null);
  const [reply,setReply]=useState("");
  const [sending,setSending]=useState(false);
  const unread=messages.filter(m=>!m.read).length;

  const select=async(m)=>{
    setSelected(m);setReply(m.reply_text||"");
    if(!m.read) await sb.from("messages").update({read:true}).eq("id",m.id);
  };

  const sendReply=async()=>{
    if(!reply.trim()||!selected)return;
    setSending(true);
    await sb.from("messages").update({replied:true,read:true,reply_text:reply}).eq("id",selected.id);
    setSelected(s=>({...s,replied:true,reply_text:reply}));
    if(selected.from_email&&selected.from_email!=="Non renseigné"){
      try {
        await fetch("https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            to:selected.from_email,
            subject:`Réponse S-Mall — ${selected.subject}`,
            html:`<div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0a0a0a;color:#f5f0e8;padding:32px;border-radius:16px;"><h1 style="color:#c9a84c;text-align:center;">✦ S-Mall</h1><div style="background:#161616;border-radius:12px;padding:20px;margin:20px 0;"><p>Bonjour <strong>${selected.from_name}</strong>,</p><p style="color:#888;">En réponse à : <em>${selected.subject}</em></p><div style="border-left:3px solid #c9a84c;padding-left:16px;margin-top:12px;"><p>${reply}</p></div></div><p style="color:#555;font-size:12px;text-align:center;"><a href="https://wa.me/2250150512408" style="color:#c9a84c;">WhatsApp</a> · sgroupmall.vercel.app</p></div>`
          })
        });
      } catch(e){}
    }
    setReply("");setSending(false);
  };

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Messages</h2>
        <p style={{color:C.muted,fontSize:14}}>{unread} non lu{unread!==1?"s":""}</p>
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:(
        <div style={{display:"grid",gridTemplateColumns:"clamp(200px,280px,30%) 1fr",gap:16,minHeight:400}}>
          <div style={{display:"flex",flexDirection:"column",gap:8,overflowY:"auto",maxHeight:600}}>
            {messages.length===0?<p style={{color:C.muted,fontSize:14}}>Aucun message.</p>:messages.map(m=>(
              <div key={m.id} onClick={()=>select(m)} style={{background:selected?.id===m.id?`${C.gold}10`:C.card,border:`1px solid ${selected?.id===m.id?C.gold:C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.white}}>{m.from_name}</span>
                  <span style={{fontSize:10,color:C.muted}}>{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p style={{fontSize:12,color:C.muted,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.subject}</p>
                <div style={{display:"flex",gap:6}}>
                  {!m.read&&<span style={{background:C.red,color:C.white,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:999}}>Non lu</span>}
                  {m.replied&&<span style={{background:C.green,color:C.white,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:999}}>Répondu</span>}
                </div>
              </div>
            ))}
          </div>
          {selected?(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:C.gold,marginBottom:6}}>{selected.subject}</h3>
                <p style={{fontSize:12,color:C.muted}}>👤 {selected.from_name} · 📧 {selected.from_email}</p>
              </div>
              <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                <p style={{fontSize:14,color:C.white,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{selected.message}</p>
              </div>
              {selected.reply_text&&(
                <div style={{background:"#0a1a0a",border:`1px solid ${C.green}44`,borderRadius:12,padding:16}}>
                  <p style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:8}}>✓ Votre réponse :</p>
                  <p style={{fontSize:14,color:C.white,lineHeight:1.7}}>{selected.reply_text}</p>
                </div>
              )}
              <div>
                <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder={`Répondre à ${selected.from_name}…`} rows={4}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                <button onClick={sendReply} disabled={sending||!reply.trim()}
                  style={{marginTop:10,background:reply.trim()&&!sending?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:reply.trim()&&!sending?C.bg:C.muted,border:"none",borderRadius:11,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:reply.trim()&&!sending?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                  {sending?<><Spinner size={14}/>Envoi en cours…</>:"✦ Envoyer la réponse"}
                </button>
              </div>
            </div>
          ):(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:14}}>Sélectionnez un message</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── STATS SECTION ─────────────────────────────────────────────────────────────
function StatsSection() {
  const {data:orders}=useRealtimeTable("orders", ()=>sb.from("orders").select("*"));
  const {data:reservations}=useRealtimeTable("reservations", ()=>sb.from("reservations").select("*"));
  const {data:products}=useRealtimeTable("products", ()=>sb.from("products").select("*"));
  const {data:reviews}=useRealtimeTable("reviews", ()=>sb.from("reviews").select("*"));

  const revenue=orders.reduce((s,o)=>s+(o.total||0),0);
  const confirmed=orders.filter(o=>o.status==="Confirmé"||o.status==="Livré").length;

  const cards=[
    {label:"Chiffre d'affaires",value:fmt(revenue),color:C.gold,icon:"💰"},
    {label:"Total commandes",value:orders.length,color:C.blue,icon:"🛒"},
    {label:"Confirmées",value:confirmed,color:C.green,icon:"✅"},
    {label:"Réservations",value:reservations.length,color:C.sys,icon:"📅"},
    {label:"Produits actifs",value:products.filter(p=>p.active).length,color:C.goldL,icon:"🛍️"},
    {label:"Avis clients",value:reviews.length,color:C.orange,icon:"⭐"},
  ];

  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:22}}>Tableau de bord</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:28}}>
        {cards.map(c=>(
          <div key={c.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px"}}>
            <p style={{fontSize:22,marginBottom:8}}>{c.icon}</p>
            <p style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{c.label}</p>
            <p style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:22,color:c.color}}>{c.value}</p>
          </div>
        ))}
      </div>
      {orders.length>0&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:16,color:C.gold}}>Dernières commandes</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {orders.slice(0,5).map(o=>(
              <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:C.card2,borderRadius:10}}>
                <div>
                  <span style={{fontWeight:700,fontSize:13,color:C.white}}>{o.client_name}</span>
                  <span style={{fontSize:11,color:C.muted,marginLeft:8}}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{background:`${o.status==="Livré"?C.green:o.status==="Annulé"?C.red:C.gold}20`,color:o.status==="Livré"?C.green:o.status==="Annulé"?C.red:C.gold,fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:999}}>{o.status}</span>
                  <span style={{fontWeight:800,fontSize:14,color:C.gold}}>{fmt(o.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── REVIEWS SECTION ───────────────────────────────────────────────────────────
function ReviewsSection() {
  const {data:reviews,loading}=useRealtimeTable("reviews", ()=>sb.from("reviews").select("*").order("created_at",{ascending:false}));
  const [filter,setFilter]=useState("Tous");
  const approve=async(id)=>{ await sb.from("reviews").update({approved:true}).eq("id",id); };
  const remove=async(id)=>{ await sb.from("reviews").delete().eq("id",id); };
  const filtered=filter==="Tous"?reviews:filter==="En attente"?reviews.filter(r=>!r.approved):reviews.filter(r=>r.approved);

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Avis clients</h2>
        <p style={{color:C.muted,fontSize:14}}>{reviews.filter(r=>!r.approved).length} en attente · {reviews.filter(r=>r.approved).length} publiés</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {["Tous","En attente","Publiés"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"7px 14px",borderRadius:999,border:`1.5px solid ${filter===f?C.gold:C.border}`,background:filter===f?`${C.gold}18`:"transparent",color:filter===f?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{f}</button>
        ))}
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:filtered.length===0?<p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucun avis.</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(r=>(
            <div key={r.id} style={{background:C.card,border:`1px solid ${r.approved?C.border:`${C.orange}44`}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,fontSize:15,color:C.white}}>{r.client_name}</span>
                    <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:14,color:s<=r.rating?C.gold:"#333"}}>★</span>)}</div>
                    <span style={{background:r.approved?`${C.green}20`:`${C.orange}20`,color:r.approved?C.green:C.orange,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:999}}>{r.approved?"✓ Publié":"⏳ En attente"}</span>
                  </div>
                  {r.client_email&&<p style={{fontSize:12,color:C.muted,marginBottom:8}}>📧 {r.client_email}</p>}
                  <p style={{fontSize:14,color:C.white,lineHeight:1.7,fontStyle:"italic"}}>"{r.comment}"</p>
                  <p style={{fontSize:11,color:C.muted,marginTop:8}}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {!r.approved&&<button onClick={()=>approve(r.id)} style={{background:`${C.green}20`,border:`1px solid ${C.green}44`,color:C.green,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>✓ Approuver</button>}
                  <button onClick={()=>remove(r.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}44`,color:C.red,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>🗑️ Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── CATEGORIES SECTION ────────────────────────────────────────────────────────
function CategoriesSection() {
  const {data:cats,loading}=useRealtimeTable("categories", ()=>sb.from("categories").select("*").order("position"));
  const [showForm,setShowForm]=useState(false);
  const [cf,setCf]=useState({id:"",label:"",icon:"🏷️",position:0});
  const [saving,setSaving]=useState(false);

  const save=async()=>{
    if(!cf.id||!cf.label)return;
    setSaving(true);
    await sb.from("categories").upsert({id:cf.id,label:cf.label,icon:cf.icon,position:Number(cf.position)});
    setShowForm(false);setCf({id:"",label:"",icon:"🏷️",position:0});setSaving(false);
  };
  const remove=async(id)=>{ if(!window.confirm("Supprimer cette catégorie ?"))return; await sb.from("categories").delete().eq("id",id); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24}}>Catégories</h2>
        <button onClick={()=>setShowForm(!showForm)} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{showForm?"✕ Fermer":"+ Nouvelle"}</button>
      </div>
      {showForm&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,marginBottom:20}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
            {[["id","ID (ex: tech)","tech"],["label","Nom","Électronique"],["icon","Icône","📱"],["position","Position","1"]].map(([f,l,p])=>(
              <div key={f}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{l}</label>
                <input value={cf[f]} onChange={e=>setCf(c=>({...c,[f]:e.target.value}))} placeholder={p}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} style={{marginTop:14,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            {saving?<Spinner size={14}/>:"💾 Sauvegarder"}
          </button>
        </div>
      )}
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {cats.map(c=>(
            <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:4}}>{c.icon} {c.label}</p><p style={{fontSize:11,color:C.muted}}>{c.id} · pos.{c.position}</p></div>
              <button onClick={()=>remove(c.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:7,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SHIPPING SECTION ──────────────────────────────────────────────────────────
function ShippingSection() {
  const {data:zones,loading}=useRealtimeTable("shipping_zones", ()=>sb.from("shipping_zones").select("*").order("price"));
  const [editId,setEditId]=useState(null);
  const [ef,setEf]=useState({price:"",free_above:"",delay:""});

  const startEdit=(z)=>{ setEditId(z.id);setEf({price:String(z.price),free_above:String(z.free_above||0),delay:z.delay}); };
  const save=async()=>{ await sb.from("shipping_zones").update({price:Number(ef.price),free_above:Number(ef.free_above)||0,delay:ef.delay}).eq("id",editId);setEditId(null); };

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Zones de livraison</h2>
        <p style={{color:C.muted,fontSize:14}}>Configurez les frais et délais par zone</p>
      </div>
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {zones.map(z=>(
            <div key={z.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 22px"}}>
              {editId===z.id?(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,color:C.gold}}>{z.name}</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                    {[["price","Prix livraison (FCFA)"],["free_above","Gratuit à partir de (FCFA)"],["delay","Délai"]].map(([f,l])=>(
                      <div key={f}>
                        <label style={{fontSize:12,color:C.muted,display:"block",marginBottom:5}}>{l}</label>
                        <input type={f==="delay"?"text":"number"} value={ef[f]} onChange={e=>setEf(x=>({...x,[f]:e.target.value}))}
                          style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={save} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:10,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>💾 Sauvegarder</button>
                    <button onClick={()=>setEditId(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"9px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Annuler</button>
                  </div>
                </div>
              ):(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <h3 style={{fontWeight:700,fontSize:16,color:C.white,marginBottom:6}}>📍 {z.name}</h3>
                    <div style={{display:"flex",gap:16,fontSize:13,color:C.muted,flexWrap:"wrap"}}>
                      <span>💰 {fmt(z.price)}</span>
                      <span>🎁 Gratuit dès {fmt(z.free_above||0)}</span>
                      <span>⏱ {z.delay}</span>
                    </div>
                  </div>
                  <button onClick={()=>startEdit(z)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.gold,borderRadius:10,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>✏️ Modifier</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── BANNERS SECTION ───────────────────────────────────────────────────────────
function BannersSection() {
  const {data:banners,loading}=useRealtimeTable("banners", ()=>sb.from("banners").select("*").order("created_at",{ascending:false}));
  const [showForm,setShowForm]=useState(false);
  const [bf,setBf]=useState({title:"",media_url:"",media_type:"image",link_url:"",position:"home_top",active:true});
  const [saving,setSaving]=useState(false);
  const fileRef=useRef();
  const [uploading,setUploading]=useState(false);

  const upload=async(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    setUploading(true);
    const ext=file.name.split(".").pop();
    const path=`banner-${Date.now()}.${ext}`;
    const isVideo=file.type.startsWith("video/");
    const {error}=await sb.storage.from("Products").upload(path,file,{upsert:true});
    if(!error){
      const {data}=sb.storage.from("Products").getPublicUrl(path);
      setBf(f=>({...f,media_url:data.publicUrl,media_type:isVideo?"video":"image"}));
    }
    setUploading(false);
  };

  const save=async()=>{
    if(!bf.media_url){alert("Veuillez d'abord uploader une image ou vidéo.");return;}
    setSaving(true);
    const {error}=await sb.from("banners").insert({
      title:bf.title||null,
      media_url:bf.media_url,
      media_type:bf.media_type,
      link_url:bf.link_url||null,
      position:bf.position,
      active:bf.active
    });
    if(error){alert("Erreur: "+error.message);setSaving(false);return;}
    setShowForm(false);
    setBf({title:"",media_url:"",media_type:"image",link_url:"",position:"home_top",active:true});
    setSaving(false);
  };

  const remove=async(id)=>{ if(!window.confirm("Supprimer cette bannière ?"))return; await sb.from("banners").delete().eq("id",id); };
  const toggle=async(b)=>{ await sb.from("banners").update({active:!b.active}).eq("id",b.id); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Bannières publicitaires</h2>
          <p style={{color:C.muted,fontSize:14}}>Images et vidéos (max 40 secondes) sur la page d'accueil</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{showForm?"✕ Fermer":"+ Nouvelle bannière"}</button>
      </div>

      {showForm&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24,marginBottom:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:C.gold,marginBottom:18}}>➕ Nouvelle bannière</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Titre (optionnel)</label>
                <input value={bf.title} onChange={e=>setBf(f=>({...f,title:e.target.value}))} placeholder="Ex: Soldes d'été -30%"
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Lien cliquable (optionnel)</label>
                <input value={bf.link_url} onChange={e=>setBf(f=>({...f,link_url:e.target.value}))} placeholder="https://…"
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Position</label>
                <select value={bf.position} onChange={e=>setBf(f=>({...f,position:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  <option value="home_top">Accueil — Haut (après le héro)</option>
                  <option value="home_mid">Accueil — Milieu (entre promos et nouveautés)</option>
                </select>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
                <input type="checkbox" checked={bf.active} onChange={e=>setBf(f=>({...f,active:e.target.checked}))} style={{accentColor:C.gold,width:16,height:16}}/>
                <span style={{fontSize:13,color:C.white,fontWeight:600}}>Activer immédiatement</span>
              </label>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Image ou Vidéo *</label>
                <div style={{border:`2px dashed ${bf.media_url?C.gold:C.border}`,borderRadius:14,padding:"20px",textAlign:"center",background:C.card2}}>
                  {bf.media_url?(
                    <div>
                      {bf.media_type==="video"
                        ?<video src={bf.media_url} controls style={{width:"100%",maxHeight:150,borderRadius:10,marginBottom:10}}/>
                        :<img src={bf.media_url} alt="" style={{width:"100%",maxHeight:150,objectFit:"cover",borderRadius:10,marginBottom:10}}/>
                      }
                      <button onClick={()=>setBf(f=>({...f,media_url:"",media_type:"image"}))} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✕ Supprimer</button>
                    </div>
                  ):(
                    <div>
                      <p style={{color:C.muted,fontSize:13,marginBottom:12}}>Image (JPG, PNG) ou Vidéo (MP4, max 40s)</p>
                      <button onClick={()=>fileRef.current.click()} disabled={uploading} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8,margin:"0 auto"}}>
                        {uploading?<><Spinner size={13}/>Upload…</>:"📤 Choisir un fichier"}
                      </button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,video/*" onChange={upload} style={{display:"none"}}/>
                </div>
              </div>
              <button onClick={save} disabled={saving||!bf.media_url}
                style={{background:bf.media_url&&!saving?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#333",color:bf.media_url&&!saving?C.bg:C.muted,border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:14,cursor:bf.media_url&&!saving?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                {saving?<><Spinner size={15}/>Sauvegarde…</>:"💾 Publier la bannière"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:banners.length===0?<p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucune bannière. Créez votre première bannière !</p>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {banners.map(b=>(
            <div key={b.id} style={{background:C.card,border:`1px solid ${b.active?C.gold:C.border}44`,borderRadius:16,overflow:"hidden"}}>
              <div style={{position:"relative",height:140}}>
                {b.media_type==="video"
                  ?<video src={b.media_url} muted style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<img src={b.media_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                }
                {!b.active&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.muted,fontWeight:800}}>🔴 Désactivée</span></div>}
                <span style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.7)",color:b.position==="home_top"?C.gold:C.blue,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:999}}>{b.position==="home_top"?"Haut":"Milieu"}</span>
              </div>
              <div style={{padding:"12px 14px"}}>
                <p style={{fontWeight:700,fontSize:13,color:C.white,marginBottom:3}}>{b.title||"(Sans titre)"}</p>
                <p style={{fontSize:11,color:C.muted,marginBottom:10}}>{b.media_type==="video"?"🎬 Vidéo":"🖼️ Image"} · {new Date(b.created_at).toLocaleDateString("fr-FR")}</p>
                <div style={{display:"flex",gap:7}}>
                  <button onClick={()=>toggle(b)} style={{flex:1,background:`${b.active?C.red:C.green}15`,border:`1px solid ${b.active?C.red:C.green}33`,color:b.active?C.red:C.green,borderRadius:9,padding:"6px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{b.active?"🙈 Désactiver":"👁 Activer"}</button>
                  <button onClick={()=>remove(b.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:9,padding:"6px 10px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN ADMIN ────────────────────────────────────────────────────────────────
const MENU=[
  {id:"stats",label:"Tableau de bord",icon:"📊"},
  {id:"products",label:"Produits",icon:"🛍️"},
  {id:"orders",label:"Commandes",icon:"🛒"},
  {id:"reservations",label:"Réservations",icon:"📅"},
  {id:"messages",label:"Messages",icon:"💬"},
  {id:"reviews",label:"Avis clients",icon:"⭐"},
  {id:"banners",label:"Bannières",icon:"🖼️"},
  {id:"categories",label:"Catégories",icon:"🏷️"},
  {id:"shipping",label:"Livraisons",icon:"🚚"},
];

export default function SMallAdmin() {
  const [auth,setAuth]=useState(false);
  const [pwd,setPwd]=useState("");
  const [section,setSection]=useState("stats");
  const {data:messages}=useRealtimeTable("messages", ()=>sb.from("messages").select("id,read"));
  const {data:reviews}=useRealtimeTable("reviews", ()=>sb.from("reviews").select("id,approved"));
  const unreadMsg=messages.filter(m=>!m.read).length;
  const pendingRev=reviews.filter(r=>!r.approved).length;

  if(!auth){
    return (
      <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes glow{0%,100%{box-shadow:0 0 14px #c9a84c55}50%{box-shadow:0 0 30px #c9a84c99}}`}</style>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"48px 40px",width:360,textAlign:"center"}}>
          <div style={{width:60,height:60,borderRadius:15,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 20px",animation:"glow 3s ease infinite"}}>✦</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:6,color:C.gold}}>S-Mall Admin</h1>
          <p style={{color:C.muted,fontSize:13,marginBottom:28}}>Accès sécurisé</p>
          <input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&pwd==="small2025"&&setAuth(true)} placeholder="Mot de passe" autoFocus
            style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.white,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center",marginBottom:14,boxSizing:"border-box"}}/>
          <button onClick={()=>pwd==="small2025"&&setAuth(true)} style={{width:"100%",background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:13,padding:"13px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Connexion</button>
          {pwd&&pwd!=="small2025"&&<p style={{color:C.red,fontSize:12,marginTop:10}}>Mot de passe incorrect</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",fontFamily:"'DM Sans',sans-serif",color:C.white}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${C.goldD};border-radius:10px;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes glow{0%,100%{box-shadow:0 0 14px ${C.gold}55}50%{box-shadow:0 0 30px ${C.gold}99}}select option{background:${C.card2};color:${C.white};}`}</style>

      {/* SIDEBAR */}
      <aside style={{width:220,background:C.dark,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
        <div style={{padding:"22px 18px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,animation:"glow 3s ease infinite"}}>✦</div>
            <div>
              <p style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:16,background:`linear-gradient(90deg,${C.gold},${C.goldL})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>S-Mall</p>
              <p style={{fontSize:9,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>Admin Panel</p>
            </div>
          </div>
          <div style={{marginTop:10,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:C.green,animation:"glow 2s ease infinite"}}/>
            <span style={{fontSize:11,color:C.green,fontWeight:600}}>Connecté · Supabase</span>
          </div>
        </div>
        <nav style={{flex:1,padding:"12px 10px"}}>
          {MENU.map(m=>(
            <button key={m.id} onClick={()=>setSection(m.id)}
              style={{width:"100%",background:section===m.id?`${C.gold}18`:"transparent",border:`1px solid ${section===m.id?C.gold+"44":"transparent"}`,borderRadius:10,padding:"10px 14px",color:section===m.id?C.gold:C.muted,fontWeight:section===m.id?700:600,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",marginBottom:3,display:"flex",alignItems:"center",gap:10,transition:"all .2s"}}>
              <span>{m.icon}</span>
              <span style={{flex:1}}>{m.label}</span>
              {m.id==="messages"&&unreadMsg>0&&<span style={{background:C.red,color:C.white,borderRadius:999,padding:"1px 6px",fontSize:10,fontWeight:800}}>{unreadMsg}</span>}
              {m.id==="reviews"&&pendingRev>0&&<span style={{background:C.orange,color:C.white,borderRadius:999,padding:"1px 6px",fontSize:10,fontWeight:800}}>{pendingRev}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setAuth(false)} style={{width:"100%",background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:10,padding:"9px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>⏻ Déconnexion</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{flex:1,padding:"32px 36px",overflowY:"auto"}}>
        {section==="stats"       && <StatsSection/>}
        {section==="products"    && <ProductsSection/>}
        {section==="orders"      && <OrdersSection/>}
        {section==="reservations"&& <ReservationsSection/>}
        {section==="messages"    && <MessagesSection/>}
        {section==="reviews"     && <ReviewsSection/>}
        {section==="banners"     && <BannersSection/>}
        {section==="categories"  && <CategoriesSection/>}
        {section==="shipping"    && <ShippingSection/>}
      </main>
    </div>
  );
}
