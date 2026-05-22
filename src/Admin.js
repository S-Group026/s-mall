import { useState, useEffect, useRef, useCallback } from 'react';
import { sb } from './supabase';

// ─── COULEURS ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#0a0a0a", dark:"#111111", card:"#161616", card2:"#1c1c1c",
  border:"#2a2a2a", gold:"#c9a84c", goldL:"#e8c97a", goldD:"#9a7a2e",
  white:"#f5f0e8", muted:"#888880", red:"#e05a4e", green:"#4caf7d",
  orange:"#f59e0b", blue:"#3b82f6", sys:"#e8533f",
};
const fmt = n => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner({size=18}) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:`2px solid ${C.border}`, borderTopColor:C.gold,
      borderRadius:"50%", animation:"spin .7s linear infinite"
    }}/>
  );
}

// ─── HOOK REALTIME ────────────────────────────────────────────────────────────
// Stable, sans boucle infinie — loadFn mémoïsé via useCallback côté appelant
function useRealtimeTable(table, loadFn) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const loadFnRef  = useRef(loadFn);
  const mountedRef = useRef(true);
  const reloadRef  = useRef(null);
  loadFnRef.current = loadFn;

  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      try {
        const { data:d, error } = await loadFnRef.current();
        if (mountedRef.current) {
          if (!error) setData(d || []);
          setLoading(false);
        }
      } catch { if (mountedRef.current) setLoading(false); }
    };
    reloadRef.current = load;
    load();
    const chName = `rt-${table}-${Math.random().toString(36).slice(2)}`;
    const ch = sb.channel(chName)
      .on("postgres_changes", {event:"*", schema:"public", table}, () => {
        setTimeout(() => { if (mountedRef.current) load(); }, 300);
      })
      .subscribe();
    return () => { mountedRef.current = false; sb.removeChannel(ch); };
  }, [table]);

  const reload = useCallback(() => { if (reloadRef.current) reloadRef.current(); }, []);
  return { data, loading, reload };
}

// ─── IMAGE UPLOADER ───────────────────────────────────────────────────────────
function ImageUploader({ productId }) {
  const [images,   setImages]   = useState([]);
  const [uploading,setUploading]= useState(false);
  const fileRef = useRef();

  const load = useCallback(async () => {
    const { data } = await sb.from("product_images").select("*").eq("product_id", productId).order("position");
    setImages(data || []);
  }, [productId]);

  useEffect(() => { if (productId) load(); }, [productId, load]);

  const upload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const path = `product-${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await sb.storage.from("Products").upload(path, file, { upsert:true });
      if (!error) {
        const { data } = sb.storage.from("Products").getPublicUrl(path);
        await sb.from("product_images").insert({ product_id:productId, url:data.publicUrl, position:images.length });
        if (images.length === 0) await sb.from("products").update({ image_url:data.publicUrl }).eq("id", productId);
      }
    }
    await load();
    setUploading(false);
    e.target.value = '';
  };

  const remove = async (img) => {
    await sb.from("product_images").delete().eq("id", img.id);
    const remaining = images.filter(i => i.id !== img.id);
    await sb.from("products").update({ image_url:remaining[0]?.url || null }).eq("id", productId);
    await load();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <label style={{fontSize:12,fontWeight:700,color:C.muted}}>📸 Photos ({images.length})</label>
        <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
          style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:9,padding:"7px 14px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6}}>
          {uploading ? <><Spinner size={13}/>Upload…</> : "📤 Ajouter photos"}
        </button>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {images.length === 0 && (
          <div onClick={() => fileRef.current.click()}
            style={{width:80,height:80,borderRadius:12,background:C.card2,border:`2px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:24,color:C.muted}}>📷</div>
        )}
        {images.map((img, i) => (
          <div key={img.id} style={{position:"relative",width:80,height:80,borderRadius:12,overflow:"hidden",border:`2px solid ${i===0?C.gold:C.border}`,flexShrink:0}}>
            <img src={img.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            {i === 0 && <span style={{position:"absolute",top:2,left:2,background:C.gold,color:C.bg,fontSize:7,fontWeight:800,padding:"1px 4px",borderRadius:4}}>MAIN</span>}
            <button type="button" onClick={() => remove(img)}
              style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.7)",border:"none",color:C.red,borderRadius:5,width:18,height:18,cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        ))}
      </div>
      <p style={{fontSize:11,color:C.muted}}>1ère photo = image principale · JPG, PNG, WEBP</p>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={upload} style={{display:"none"}}/>
    </div>
  );
}

// ─── VARIANTS MANAGER ─────────────────────────────────────────────────────────
function VariantsManager({ productId }) {
  const [variants, setVariants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [vf, setVf] = useState({ color:"", color_hex:"#000000", storage:"", size:"", price:"" });
  const fmt2 = n => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

  const load = useCallback(async () => {
    const { data } = await sb.from("product_variants").select("*").eq("product_id", productId).order("storage").order("color");
    setVariants(data || []);
  }, [productId]);

  useEffect(() => { if (productId) load(); }, [productId, load]);

  const openAdd  = () => { setEditId(null); setVf({ color:"", color_hex:"#000000", storage:"", size:"", price:"" }); setShowForm(true); };
  const openEdit = (v) => { setEditId(v.id); setVf({ color:v.color||"", color_hex:v.color_hex||"#000000", storage:v.storage||"", size:v.size||"", price:String(v.price) }); setShowForm(true); };

  const save = async () => {
    if (!vf.price) return;
    const payload = { product_id:productId, color:vf.color||null, color_hex:vf.color_hex||null, storage:vf.storage||null, size:vf.size||null, price:Number(vf.price), active:true };
    if (editId) await sb.from("product_variants").update(payload).eq("id", editId);
    else        await sb.from("product_variants").insert({ ...payload, stock:999 });
    setShowForm(false); setEditId(null); await load();
  };

  const remove = async (id) => { await sb.from("product_variants").delete().eq("id", id); await load(); };

  const F = ({ label, field, placeholder, type="text" }) => (
    <div>
      <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>{label}</label>
      <input type={type} value={vf[field]} onChange={e => setVf(f => ({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <label style={{fontSize:12,fontWeight:700,color:C.muted}}>🎛️ Variantes ({variants.length})</label>
        <button type="button" onClick={showForm ? () => setShowForm(false) : openAdd}
          style={{background:`${C.blue}20`,border:`1px solid ${C.blue}44`,color:C.blue,borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {showForm ? "✕ Fermer" : "+ Ajouter variante"}
        </button>
      </div>
      {showForm && (
        <div style={{background:C.bg,border:`1px solid ${editId?C.gold:C.blue}44`,borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:12}}>
          <p style={{fontSize:13,fontWeight:700,color:editId?C.gold:C.blue}}>{editId ? "✏️ Modifier" : "➕ Nouvelle variante"}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Couleur (nom)" field="color" placeholder="Ex: Noir, Blanc, Rose…"/>
            <div>
              <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Code couleur</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="color" value={vf.color_hex} onChange={e => setVf(f => ({...f,color_hex:e.target.value}))}
                  style={{width:40,height:34,borderRadius:8,border:`1px solid ${C.border}`,cursor:"pointer",padding:2}}/>
                <div style={{width:22,height:22,borderRadius:"50%",background:vf.color_hex,border:`2px solid ${C.border}`}}/>
                <span style={{fontSize:11,color:C.muted}}>{vf.color_hex}</span>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Capacité</label>
              <select value={vf.storage} onChange={e => setVf(f => ({...f,storage:e.target.value}))}
                style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">— Aucune —</option>
                {["32Go","64Go","128Go","256Go","512Go","1To","2To"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:4}}>Taille</label>
              <select value={vf.size} onChange={e => setVf(f => ({...f,size:e.target.value}))}
                style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 11px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                <option value="">— Aucune —</option>
                {["XS","S","M","L","XL","XXL","3XL","38","39","40","41","42","43","44","45"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <F label="Prix (FCFA) *" field="price" placeholder="450000" type="number"/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button type="button" onClick={save} disabled={!vf.price}
              style={{background:vf.price?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#333",color:vf.price?C.bg:C.muted,border:"none",borderRadius:9,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:vf.price?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif"}}>
              {editId ? "💾 Sauvegarder" : "✓ Ajouter"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:9,padding:"9px 13px",fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
          </div>
        </div>
      )}
      {variants.length > 0 ? (
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {variants.map(v => (
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px"}}>
              {v.color_hex && <div style={{width:20,height:20,borderRadius:"50%",background:v.color_hex,border:"2px solid rgba(255,255,255,0.15)",flexShrink:0}}/>}
              <span style={{fontSize:13,color:C.white,flex:1}}>{[v.storage,v.color,v.size].filter(Boolean).join(" · ") || "Variante"}</span>
              <span style={{fontWeight:800,color:C.gold,fontSize:13,minWidth:110,textAlign:"right"}}>{fmt2(v.price)}</span>
              <div style={{display:"flex",gap:5}}>
                <button type="button" onClick={() => openEdit(v)} style={{background:`${C.gold}15`,border:`1px solid ${C.gold}33`,color:C.gold,borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>✏️</button>
                <button type="button" onClick={() => remove(v.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:7,padding:"4px 9px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:700}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && <p style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Aucune variante. Le produit sera vendu à prix fixe.</p>
      )}
    </div>
  );
}

// ─── MODAL DE CONFIRMATION (remplace window.confirm) ─────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  if (!message) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"28px 32px",maxWidth:380,width:"100%",textAlign:"center"}}>
        <p style={{fontSize:16,fontWeight:700,color:C.white,marginBottom:10}}>⚠️ Confirmation</p>
        <p style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:22}}>{message}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button type="button" onClick={onCancel}
            style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:11,padding:"10px 22px",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
          <button type="button" onClick={onConfirm}
            style={{background:`${C.red}cc`,border:"none",color:"#fff",borderRadius:11,padding:"10px 22px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCTS SECTION ─────────────────────────────────────────────────────────
function ProductsSection() {
  const [CATS, setCATS] = useState([]);
  const productsLoader  = useCallback(() => sb.from("products").select("*").order("id"), []);
  const { data:products, loading, reload:reloadProducts } = useRealtimeTable("products", productsLoader);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [savedId,  setSavedId]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [filterCat,setFilterCat]= useState("all");
  const [confirm,  setConfirm]  = useState(null); // { message, onConfirm }
  const [form, setForm] = useState({ cat:"mode", name:"", price:"", orig_price:"", emoji:"🛍️", desc:"", badge:"", bookable:false, book_type:"", dest:"", active:true, image_url:"", download_url:"" });

  useEffect(() => {
    sb.from("categories").select("*").order("position").then(({ data }) => setCATS(data || []));
  }, []);

  const startNew  = () => { setEditing(null); setSavedId(null); setForm({ cat:"mode", name:"", price:"", orig_price:"", emoji:"🛍️", desc:"", badge:"", bookable:false, book_type:"", dest:"", active:true, image_url:"", download_url:"" }); setShowForm(true); };
  const startEdit = (p) => { setEditing(p); setSavedId(p.id); setForm({ cat:p.cat, name:p.name, price:String(p.price), orig_price:p.orig_price?String(p.orig_price):"", emoji:p.emoji||"🛍️", desc:p.desc||p.description||"", badge:p.badge||"", bookable:!!p.bookable, book_type:p.book_type||"", dest:p.dest||"", active:p.active!==false, image_url:p.image_url||"", download_url:p.download_url||"" }); setShowForm(true); };

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    const payload = { cat:form.cat, name:form.name.trim(), price:Number(form.price), orig_price:form.orig_price?Number(form.orig_price):null, emoji:form.emoji||"🛍️", desc:form.desc, description:form.desc, badge:form.badge||null, bookable:!!form.bookable, book_type:form.book_type||null, dest:form.dest||null, active:form.active, download_url:form.download_url||null };
    if (editing) {
      await sb.from("products").update(payload).eq("id", editing.id);
      setSavedId(editing.id);
      reloadProducts();
    } else {
      const { data, error } = await sb.from("products").insert({ ...payload, image_url:null }).select().single();
      if (data) { setSavedId(data.id); setEditing(data); }
      if (error) console.error("Erreur produit:", error.message);
    }
    setSaving(false);
  };

  const deleteProduct = (id) => {
    setConfirm({
      message: "Supprimer ce produit définitivement ? Cette action est irréversible.",
      onConfirm: async () => {
        setConfirm(null);
        await sb.from("products").delete().eq("id", id);
        if (showForm && (editing?.id === id || savedId === id)) { setShowForm(false); setEditing(null); setSavedId(null); }
      }
    });
  };

  const toggleActive = async (p) => { await sb.from("products").update({ active:!p.active }).eq("id", p.id); };

  const cats     = [{ id:"all", label:"Tous" }, ...CATS];
  const filtered = products.filter(p => (filterCat === "all" || p.cat === filterCat) && (p.name||"").toLowerCase().includes(search.toLowerCase()));

  const inp2 = (field, label, placeholder="", type="text") => (
    <div style={{marginBottom:10}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <input type={type} value={form[field]} onChange={e => setForm(f => ({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <div>
      <ConfirmModal message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Produits</h2>
          <p style={{color:C.muted,fontSize:14}}>{products.length} produit{products.length!==1?"s":""} au total</p>
        </div>
        <button type="button" onClick={showForm ? () => { setShowForm(false); setEditing(null); setSavedId(null); } : startNew}
          style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {showForm ? "✕ Fermer" : "+ Nouveau produit"}
        </button>
      </div>

      {showForm && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24,marginBottom:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:19,marginBottom:18,color:C.gold}}>{editing ? "✏️ Modifier le produit" : "➕ Nouveau produit"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Catégorie</label>
                <select value={form.cat} onChange={e => setForm(f => ({...f,cat:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  {CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              {inp2("name","Nom du produit *","Ex: iPhone 16 Pro Max…")}
              {inp2("emoji","Emoji","📱")}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Description</label>
                <textarea value={form.desc} onChange={e => setForm(f => ({...f,desc:e.target.value}))} placeholder="Description du produit…" rows={3}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
              </div>
              {form.cat === "formation" && (
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
                <select value={form.badge} onChange={e => setForm(f => ({...f,badge:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  <option value="">— Aucun —</option>
                  {["Nouveau","Bestseller","Promo","Premium"].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:12}}>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flex:1,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
                  <input type="checkbox" checked={form.bookable} onChange={e => setForm(f => ({...f,bookable:e.target.checked}))} style={{accentColor:C.gold,width:16,height:16}}/>
                  <span style={{fontSize:13,color:C.white,fontWeight:600}}>Réservable</span>
                </label>
                <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",flex:1,background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px"}}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f,active:e.target.checked}))} style={{accentColor:C.gold,width:16,height:16}}/>
                  <span style={{fontSize:13,color:C.white,fontWeight:600}}>Visible</span>
                </label>
              </div>
              <div style={{display:"flex",gap:8,marginTop:14}}>
                <button type="button" onClick={save} disabled={saving||!form.name||!form.price}
                  style={{flex:1,background:saving||!form.name||!form.price?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:saving||!form.name||!form.price?C.muted:C.bg,border:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {saving ? <><Spinner size={15}/>Sauvegarde…</> : "💾 Sauvegarder"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setSavedId(null); }}
                  style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"11px 18px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14}}>Annuler</button>
              </div>
            </div>
          </div>
          {savedId && (
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            style={{border:"none",outline:"none",background:"transparent",color:C.white,fontSize:14,width:"100%",fontFamily:"'DM Sans',sans-serif"}}/>
          {search && <button type="button" onClick={() => setSearch("")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>×</button>}
        </div>
        {cats.map(c => (
          <button type="button" key={c.id} onClick={() => setFilterCat(c.id)}
            style={{padding:"8px 14px",borderRadius:999,border:`1.5px solid ${filterCat===c.id?C.gold:C.border}`,background:filterCat===c.id?`${C.gold}18`:"transparent",color:filterCat===c.id?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{c.label}</button>
        ))}
      </div>

      {loading ? <div style={{display:"flex",gap:10,alignItems:"center",padding:"30px 0"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {filtered.map(p => (
            <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
              <div style={{height:110,position:"relative",background:"linear-gradient(135deg,#161200,#201a00)"}}>
                {p.image_url ? <img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:38}}>{p.emoji}</div>}
                {!p.active && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.red,fontWeight:800,fontSize:12}}>🔴 Masqué</span></div>}
              </div>
              <div style={{padding:"12px 14px"}}>
                <p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</p>
                <p style={{fontSize:11,color:C.muted,marginBottom:8}}>{CATS.find(c => c.id===p.cat)?.label}{p.badge&&` · ${p.badge}`}</p>
                <p style={{fontWeight:800,fontSize:14,color:C.gold,marginBottom:10}}>{fmt(p.price)}</p>
                <div style={{display:"flex",gap:6}}>
                  <button type="button" onClick={() => startEdit(p)} style={{flex:1,background:`${C.gold}15`,border:`1px solid ${C.gold}33`,color:C.gold,borderRadius:9,padding:"6px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✏️ Modifier</button>
                  <button type="button" onClick={() => toggleActive(p)} style={{background:`${p.active?C.red:C.green}15`,border:`1px solid ${p.active?C.red:C.green}33`,color:p.active?C.red:C.green,borderRadius:9,padding:"6px 8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{p.active?"🙈":"👁"}</button>
                  <button type="button" onClick={() => deleteProduct(p.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:9,padding:"6px 8px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ORDERS SECTION ───────────────────────────────────────────────────────────
function OrdersSection() {
  const ordersLoader = useCallback(() => sb.from("orders").select("*").order("created_at",{ascending:false}), []);
  const { data:orders, loading } = useRealtimeTable("orders", ordersLoader);
  const STATUSES = ["En cours","Confirmé","Expédié","Livré","Annulé"];
  const updateStatus = async (id, status) => { await sb.from("orders").update({ status }).eq("id", id); };

  // Export CSV
  const exportCSV = () => {
    const headers = ["ID","Client","Email","Téléphone","Pays","Total","Statut","Méthode","Date"];
    const rows = orders.map(o => [
      o.id, o.client_name, o.client_email, o.client_tel,
      o.country||"N/A", o.total, o.status, o.pay_method,
      new Date(o.created_at).toLocaleDateString("fr-FR")
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download=`commandes-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Commandes</h2>
          <p style={{color:C.muted,fontSize:14}}>{orders.length} commande{orders.length!==1?"s":""}</p>
        </div>
        {orders.length > 0 && (
          <button type="button" onClick={exportCSV}
            style={{background:`${C.green}20`,border:`1px solid ${C.green}44`,color:C.green,borderRadius:11,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            📥 Exporter CSV
          </button>
        )}
      </div>
      {loading ? <div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div> : orders.length === 0 ? <p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucune commande pour l'instant.</p> : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {orders.map(o => (
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
                    {(o.items||[]).map((item,i) => (
                      <span key={i} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"3px 9px",fontSize:11,color:C.muted}}>
                        {item.emoji} {item.name}{item.variant?` (${item.variant})`:""} ×{item.qty}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                  <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:18,color:C.gold}}>{fmt(o.total)}</span>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
                    style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,padding:"6px 11px",color:C.white,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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

// ─── RESERVATIONS SECTION ─────────────────────────────────────────────────────
function ReservationsSection() {
  const resLoader = useCallback(() => sb.from("reservations").select("*").order("created_at",{ascending:false}), []);
  const { data:reservations, loading } = useRealtimeTable("reservations", resLoader);
  const updateStatus = async (id, status) => { await sb.from("reservations").update({ status }).eq("id", id); };

  const exportCSV = () => {
    const headers = ["ID","Client","Email","Téléphone","Produit","Date","Personnes","Total","Statut","Créé le"];
    const rows = reservations.map(r => [r.id,r.client_name,r.client_email,r.client_tel,r.product_name,r.date_from,r.persons,r.total,r.status,new Date(r.created_at).toLocaleDateString("fr-FR")]);
    const csv = [headers,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`reservations-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Réservations</h2>
          <p style={{color:C.muted,fontSize:14}}>{reservations.length} réservation{reservations.length!==1?"s":""}</p>
        </div>
        {reservations.length > 0 && (
          <button type="button" onClick={exportCSV}
            style={{background:`${C.green}20`,border:`1px solid ${C.green}44`,color:C.green,borderRadius:11,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            📥 Exporter CSV
          </button>
        )}
      </div>
      {loading ? <div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div> : reservations.length === 0 ? <p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucune réservation.</p> : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {reservations.map(r => (
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
                  <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                    style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,padding:"6px 11px",color:C.white,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",cursor:"pointer"}}>
                    {["En attente","Acompte reçu","Confirmé","Annulé"].map(s => <option key={s} value={s}>{s}</option>)}
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

// ─── MESSAGES SECTION ─────────────────────────────────────────────────────────
function MessagesSection() {
  const msgLoader = useCallback(() => sb.from("messages").select("*").order("created_at",{ascending:false}), []);
  const { data:messages, loading } = useRealtimeTable("messages", msgLoader);
  const [selected, setSelected] = useState(null);
  const [reply,    setReply]    = useState("");
  const [sending,  setSending]  = useState(false);
  const unread = messages.filter(m => !m.read).length;

  const EDGE = "https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email";

  const select = async (m) => {
    setSelected(m); setReply(m.reply_text || "");
    if (!m.read) await sb.from("messages").update({ read:true }).eq("id", m.id);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    await sb.from("messages").update({ replied:true, read:true, reply_text:reply }).eq("id", selected.id);
    setSelected(s => ({ ...s, replied:true, reply_text:reply }));
    if (selected.from_email && selected.from_email !== "N/A" && selected.from_email !== "Non renseigné") {
      try {
        await fetch(EDGE, { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ to:selected.from_email, subject:`Réponse S-Mall — ${selected.subject}`, html:`<div style="font-family:sans-serif;max-width:580px;margin:0 auto;background:#0a0a0a;color:#f5f0e8;padding:32px;border-radius:16px;"><h1 style="color:#c9a84c;text-align:center;">✦ S-Mall</h1><div style="background:#161616;border-radius:12px;padding:20px;margin:20px 0;"><p>Bonjour <strong>${selected.from_name}</strong>,</p><div style="border-left:3px solid #c9a84c;padding-left:16px;margin-top:12px;"><p>${reply.replace(/\n/g,"<br/>")}</p></div></div></div>` })
        });
      } catch(e) { console.warn("Reply email failed:", e); }
    }
    setReply(""); setSending(false);
  };

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Messages</h2>
        <p style={{color:C.muted,fontSize:14}}>{unread} non lu{unread!==1?"s":""}</p>
      </div>
      {loading ? <div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div> : (
        <div style={{display:"grid",gridTemplateColumns:"clamp(200px,280px,30%) 1fr",gap:16,minHeight:400}}>
          <div style={{display:"flex",flexDirection:"column",gap:8,overflowY:"auto",maxHeight:600}}>
            {messages.length === 0 ? <p style={{color:C.muted,fontSize:14}}>Aucun message.</p> : messages.map(m => (
              <div key={m.id} onClick={() => select(m)}
                style={{background:selected?.id===m.id?`${C.gold}10`:C.card,border:`1px solid ${selected?.id===m.id?C.gold:C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.white}}>{m.from_name}</span>
                  <span style={{fontSize:10,color:C.muted}}>{new Date(m.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p style={{fontSize:12,color:C.muted,marginBottom:4,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.subject}</p>
                <div style={{display:"flex",gap:6}}>
                  {!m.read  && <span style={{background:C.red,  color:C.white,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:999}}>Non lu</span>}
                  {m.replied && <span style={{background:C.green,color:C.white,fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:999}}>Répondu</span>}
                </div>
              </div>
            ))}
          </div>
          {selected ? (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,color:C.gold,marginBottom:6}}>{selected.subject}</h3>
                <p style={{fontSize:12,color:C.muted}}>👤 {selected.from_name} · 📧 {selected.from_email}</p>
              </div>
              <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:16}}>
                <p style={{fontSize:14,color:C.white,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{selected.message}</p>
              </div>
              {selected.reply_text && (
                <div style={{background:"#0a1a0a",border:`1px solid ${C.green}44`,borderRadius:12,padding:16}}>
                  <p style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:8}}>✓ Votre réponse précédente :</p>
                  <p style={{fontSize:14,color:C.white,lineHeight:1.7}}>{selected.reply_text}</p>
                </div>
              )}
              <div>
                <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={`Répondre à ${selected.from_name}…`} rows={4}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                <button type="button" onClick={sendReply} disabled={sending||!reply.trim()}
                  style={{marginTop:10,background:reply.trim()&&!sending?`linear-gradient(135deg,${C.goldD},${C.gold})`:"#2a2a2a",color:reply.trim()&&!sending?C.bg:C.muted,border:"none",borderRadius:11,padding:"10px 20px",fontWeight:700,fontSize:14,cursor:reply.trim()&&!sending?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>
                  {sending ? <><Spinner size={14}/>Envoi en cours…</> : "✦ Envoyer la réponse"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:40,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:14}}>Sélectionnez un message</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── STATS SECTION ────────────────────────────────────────────────────────────
function StatsSection() {
  const ordersLoader = useCallback(() => sb.from("orders").select("*"), []);
  const resLoader    = useCallback(() => sb.from("reservations").select("*"), []);
  const prodLoader   = useCallback(() => sb.from("products").select("*"), []);
  const revLoader    = useCallback(() => sb.from("reviews").select("*"), []);
  const { data:orders }       = useRealtimeTable("orders", ordersLoader);
  const { data:reservations } = useRealtimeTable("reservations", resLoader);
  const { data:products }     = useRealtimeTable("products", prodLoader);
  const { data:reviews }      = useRealtimeTable("reviews", revLoader);

  const revenue   = orders.reduce((s,o) => s+(o.total||0), 0);
  const confirmed = orders.filter(o => o.status==="Confirmé"||o.status==="Livré").length;

  const cards = [
    { label:"Chiffre d'affaires", value:fmt(revenue), color:C.gold,  icon:"💰" },
    { label:"Total commandes",    value:orders.length, color:C.blue,  icon:"🛒" },
    { label:"Confirmées",         value:confirmed,     color:C.green, icon:"✅" },
    { label:"Réservations",       value:reservations.length, color:C.sys,   icon:"📅" },
    { label:"Produits actifs",    value:products.filter(p=>p.active).length, color:C.goldL, icon:"🛍️" },
    { label:"Avis clients",       value:reviews.length, color:C.orange, icon:"⭐" },
  ];

  return (
    <div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:22}}>Tableau de bord</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:16,marginBottom:28}}>
        {cards.map(c => (
          <div key={c.label} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"20px 22px"}}>
            <p style={{fontSize:22,marginBottom:8}}>{c.icon}</p>
            <p style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{c.label}</p>
            <p style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:22,color:c.color}}>{c.value}</p>
          </div>
        ))}
      </div>
      {orders.length > 0 && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:18,marginBottom:16,color:C.gold}}>Dernières commandes</h3>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {orders.slice(0,5).map(o => (
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

// ─── REVIEWS SECTION ──────────────────────────────────────────────────────────
function ReviewsSection() {
  const revLoader = useCallback(() => sb.from("reviews").select("*").order("created_at",{ascending:false}), []);
  const { data:reviews, loading } = useRealtimeTable("reviews", revLoader);
  const [filter, setFilter] = useState("Tous");
  const [confirm, setConfirm] = useState(null);

  const approve = async (id) => { await sb.from("reviews").update({ approved:true }).eq("id", id); };
  const remove  = (id) => {
    setConfirm({ message:"Supprimer cet avis définitivement ?", onConfirm: async () => { setConfirm(null); await sb.from("reviews").delete().eq("id", id); } });
  };
  const filtered = filter==="Tous" ? reviews : filter==="En attente" ? reviews.filter(r=>!r.approved) : reviews.filter(r=>r.approved);

  return (
    <div>
      <ConfirmModal message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)}/>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Avis clients</h2>
        <p style={{color:C.muted,fontSize:14}}>{reviews.filter(r=>!r.approved).length} en attente · {reviews.filter(r=>r.approved).length} publiés</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {["Tous","En attente","Publiés"].map(f => (
          <button type="button" key={f} onClick={() => setFilter(f)}
            style={{padding:"7px 14px",borderRadius:999,border:`1.5px solid ${filter===f?C.gold:C.border}`,background:filter===f?`${C.gold}18`:"transparent",color:filter===f?C.gold:C.muted,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{f}</button>
        ))}
      </div>
      {loading ? <div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div> : filtered.length === 0 ? <p style={{color:C.muted,textAlign:"center",padding:"40px 0"}}>Aucun avis.</p> : (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(r => (
            <div key={r.id} style={{background:C.card,border:`1px solid ${r.approved?C.border:`${C.orange}44`}`,borderRadius:16,padding:"18px 22px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:800,fontSize:15,color:C.white}}>{r.client_name}</span>
                    <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><span key={s} style={{fontSize:14,color:s<=r.rating?C.gold:"#333"}}>★</span>)}</div>
                    <span style={{background:r.approved?`${C.green}20`:`${C.orange}20`,color:r.approved?C.green:C.orange,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:999}}>{r.approved?"✓ Publié":"⏳ En attente"}</span>
                  </div>
                  <p style={{fontSize:14,color:C.white,lineHeight:1.7,fontStyle:"italic"}}>"{r.comment}"</p>
                  <p style={{fontSize:11,color:C.muted,marginTop:8}}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {!r.approved && <button type="button" onClick={() => approve(r.id)} style={{background:`${C.green}20`,border:`1px solid ${C.green}44`,color:C.green,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>✓ Approuver</button>}
                  <button type="button" onClick={() => remove(r.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}44`,color:C.red,borderRadius:9,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>🗑️ Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CATEGORIES, SHIPPING, BANNERS — inchangés (copier depuis l'original) ─────
// Ces sections ne présentent pas de risques de sécurité spécifiques.
// Copiez CategoriesSection, ShippingSection, BannersSection, CircuitsSection
// depuis votre Admin.js original — elles sont déjà correctes.

function CategoriesSection() {
  const catsLoader=useCallback(()=>sb.from("categories").select("*").order("position"),[]);
  const {data:cats,loading}=useRealtimeTable("categories", catsLoader);
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
        <button type="button" onClick={()=>setShowForm(!showForm)} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{showForm?"✕ Fermer":"+ Nouvelle"}</button>
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
          <button type="button" onClick={save} disabled={saving} style={{marginTop:14,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:11,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            {saving?<Spinner size={14}/>:"💾 Sauvegarder"}
          </button>
        </div>
      )}
      {loading?<div style={{display:"flex",gap:10,alignItems:"center"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {cats.map(c=>(
            <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:4}}>{c.icon} {c.label}</p><p style={{fontSize:11,color:C.muted}}>{c.id} · pos.{c.position}</p></div>
              <button type="button" onClick={()=>remove(c.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:7,padding:"5px 9px",fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SHIPPING SECTION ──────────────────────────────────────────────────────────
function ShippingSection() {
  const shipLoader=useCallback(()=>sb.from("shipping_zones").select("*").order("price"),[]);
  const {data:zones,loading}=useRealtimeTable("shipping_zones", shipLoader);
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
                    <button type="button" onClick={save} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:10,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>💾 Sauvegarder</button>
                    <button type="button" onClick={()=>setEditId(null)} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:10,padding:"9px 14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Annuler</button>
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
                  <button type="button" onClick={()=>startEdit(z)} style={{background:C.card2,border:`1px solid ${C.border}`,color:C.gold,borderRadius:10,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>✏️ Modifier</button>
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
  const bannersLoader=useCallback(()=>sb.from("banners").select("*").order("created_at",{ascending:false}),[]);
  const {data:banners,loading}=useRealtimeTable("banners", bannersLoader);
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
    e.target.value='';
  };

  const save=async()=>{
    if(!bf.media_url){alert("Veuillez d'abord uploader une image ou vidéo.");return;}
    setSaving(true);
    // Essai avec media_url, fallback sur image_url selon le schéma Supabase
    // Colonnes réelles de la table banners : url, type, link + media_url, media_type, link_url (ajoutés)
    const bannerPayload = {
      url:        bf.media_url,
      media_url:  bf.media_url,
      type:       bf.media_type || "image",
      media_type: bf.media_type || "image",
      title:      bf.title.trim() || null,
      position:   bf.position || "home_top",
      link:       bf.link_url.trim() || null,
      link_url:   bf.link_url.trim() || null,
      active:     bf.active,
    };
    const {error} = await sb.from("banners").insert(bannerPayload);
    if(error){
      alert("Erreur bannière: "+error.message);
      setSaving(false);
      return;
    }
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
        <button type="button" onClick={()=>setShowForm(!showForm)} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"9px 18px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{showForm?"✕ Fermer":"+ Nouvelle bannière"}</button>
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
                      <button type="button" onClick={()=>setBf(f=>({...f,media_url:"",media_type:"image"}))} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✕ Supprimer</button>
                    </div>
                  ):(
                    <div>
                      <p style={{color:C.muted,fontSize:13,marginBottom:12}}>Image (JPG, PNG) ou Vidéo (MP4, max 40s)</p>
                      <button type="button" onClick={()=>fileRef.current.click()} disabled={uploading} style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8,margin:"0 auto"}}>
                        {uploading?<><Spinner size={13}/>Upload…</>:"📤 Choisir un fichier"}
                      </button>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*,video/*" onChange={upload} style={{display:"none"}}/>
                </div>
              </div>
              <button type="button" onClick={save} disabled={saving||!bf.media_url}
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
                {(b.media_type||b.type)==="video"
                  ?<video src={b.media_url||b.url} muted style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<img src={b.media_url||b.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                }
                {!b.active&&<div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:C.muted,fontWeight:800}}>🔴 Désactivée</span></div>}
                <span style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.7)",color:(b.position||"home_top")==="home_top"?C.gold:C.blue,fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:999}}>{(b.position||"home_top")==="home_top"?"Haut":"Milieu"}</span>
              </div>
              <div style={{padding:"12px 14px"}}>
                <p style={{fontWeight:700,fontSize:13,color:C.white,marginBottom:3}}>{b.title||"(Sans titre)"}</p>
                <p style={{fontSize:11,color:C.muted,marginBottom:10}}>{(b.media_type||b.type)==="video"?"🎬 Vidéo":"🖼️ Image"} · {new Date(b.created_at).toLocaleDateString("fr-FR")}</p>
                <div style={{display:"flex",gap:7}}>
                  <button type="button" onClick={()=>toggle(b)} style={{flex:1,background:`${b.active?C.red:C.green}15`,border:`1px solid ${b.active?C.red:C.green}33`,color:b.active?C.red:C.green,borderRadius:9,padding:"6px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{b.active?"🙈 Désactiver":"👁 Activer"}</button>
                  <button type="button" onClick={()=>remove(b.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:9,padding:"6px 10px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️</button>
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

// ── CIRCUITS SECTION ──────────────────────────────────────────────────────────
// Cette section a DEUX parties :
// 1. Gestion des circuits individuels (produits cat=circuit)
// 2. Configuration de la page (textes, packs, programme, inclus)

const DEFAULT_CIRCUIT_CONFIG = {
  hero_title:"Circuits Vacances",
  hero_subtitle:"Afrique de l'Ouest — Clé en main",
  hero_desc:"Du transfert aéroport jusqu'à votre départ, S-Group organise chaque détail de votre séjour.",
  saison:"Saison 2026 — 2027",
  conditions:"Acompte de 30 % à la confirmation — Solde 30 jours avant le départ. Paiement échelonné possible sur demande.",
  packs:[
    {id:"benin",name:"Pack Bénin",countries:"Bénin uniquement",color:"#0D2B45",base:1100,
     prices:[{label:"Couple / personne",eur:"1 100 €",fcfa:"721 000 FCFA"},{label:"Solo",eur:"1 400 €",fcfa:"918 000 FCFA"},{label:"Avec billet inclus",eur:"+1 100 €",fcfa:"en option"}],
     note:"+ 110 € / jour supplémentaire"},
    {id:"benin-togo",name:"Pack Bénin + Togo",countries:"2 pays",color:"#1A4560",base:1300,
     prices:[{label:"Couple / personne",eur:"1 300 €",fcfa:"853 000 FCFA"},{label:"Solo",eur:"1 600 €",fcfa:"1 049 000 FCFA"},{label:"Avec billet inclus",eur:"+1 100 €",fcfa:"en option"}],
     note:"+ 130 € / jour supplémentaire"},
    {id:"sous-region",name:"Pack Sous-Région",countries:"3 pays",color:"#0F3520",base:1900,
     prices:[{label:"Couple / personne",eur:"1 900 €",fcfa:"1 246 000 FCFA"},{label:"Solo",eur:"2 200 €",fcfa:"1 443 000 FCFA"},{label:"Avec billet inclus",eur:"+1 100 €",fcfa:"en option"}],
     note:"+ 190 € / jour supplémentaire"},
  ],
  periodes:[
    {type:"basse",label:"Basse Saison",dates:"Août → Octobre 2026",desc:"Conditions idéales, moins de touristes.",tarif:"Prix de base"},
    {type:"haute",label:"Haute Saison",dates:"Nov. 2026 → Jan. 2027",desc:"Fêtes de fin d'année, ambiance festive.",tarif:"Prix de base + 10 %"},
  ],
  inclus:["Transfert aéroport","Hébergement hôtel 3 étoiles","3 repas complets par jour","Guide local S-Group dédié","Véhicule avec chauffeur privé","Toutes excursions & visites guidées","Eau minérale à volonté","Carte SIM locale + Internet","Cadeau souvenir S-Group"],
  non_inclus:["Visa (assisté par S-Group)","Billet international (optionnel)","Dépenses personnelles","Assurance voyage","Pourboires","Activités hors programme","Boissons alcoolisées"],
  programme:[
    {day:"01",location:"Cotonou — Arrivée",desc:"Accueil VIP à l'aéroport, transfert hôtel, déjeuner de bienvenue."},
    {day:"02",location:"Cotonou — Marché Dantokpa",desc:"Visite du plus grand marché d'Afrique de l'Ouest."},
    {day:"03",location:"Ouidah — Histoire & Spiritualité",desc:"Temple des Pythons, Musée d'Histoire, Route des Esclaves."},
    {day:"04",location:"Ganvié — La Venise de l'Afrique",desc:"Traversée en pirogue vers le village lacustre du lac Nokoué."},
    {day:"05",location:"Porto-Novo — La Capitale",desc:"Musée Ethnographique, Grande Mosquée Brasileira, Palais Royal."},
    {day:"06—09",location:"Expériences & Immersion",desc:"Journées culturelles, artisanat, cuisine locale, excursions optionnelles."},
    {day:"10",location:"Cotonou — Départ",desc:"Petit-déjeuner, dîner de clôture, remise du cadeau souvenir & transfert aéroport."},
  ],
};

function CircuitsSection() {
  const [tab, setTab] = useState("circuits");

  const TABS = [
    {id:"circuits", label:"Circuits individuels"},
    {id:"general",  label:"Textes & Général"},
    {id:"packs",    label:"Formules & Tarifs"},
    {id:"periodes", label:"Périodes"},
    {id:"programme",label:"Programme"},
    {id:"inclus",   label:"Inclus / Non inclus"},
  ];

  return (
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:4}}>Page Circuits</h2>
        <p style={{color:C.muted,fontSize:14}}>Gérez les circuits individuels et le contenu de la page</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {TABS.map(t=>(
          <button type="button" key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"9px 18px",borderRadius:999,border:`1.5px solid ${tab===t.id?C.gold:C.border}`,background:tab===t.id?`${C.gold}18`:"transparent",color:tab===t.id?C.gold:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="circuits"  && <CircuitsListTab/>}
      {tab==="general"   && <CircuitsConfigTab activeTab="general"/>}
      {tab==="packs"     && <CircuitsConfigTab activeTab="packs"/>}
      {tab==="periodes"  && <CircuitsConfigTab activeTab="periodes"/>}
      {tab==="programme" && <CircuitsConfigTab activeTab="programme"/>}
      {tab==="inclus"    && <CircuitsConfigTab activeTab="inclus"/>}
    </div>
  );
}

// ── ONGLET 1 : CIRCUITS INDIVIDUELS ──────────────────────────────────────────
function CircuitsListTab() {
  const circuitsLoader = useCallback(()=>sb.from("products").select("*").eq("cat","circuit").order("id"),[]);
  const {data:circuits, loading} = useRealtimeTable("products", circuitsLoader);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [savedId, setSavedId]   = useState(null);
  const [saving,  setSaving]    = useState(false);
  const [form, setForm] = useState({name:"",price:"",orig_price:"",emoji:"✈️",desc:"",badge:"",dest:"",active:true});

  const resetForm = () => setForm({name:"",price:"",orig_price:"",emoji:"✈️",desc:"",badge:"",dest:"",active:true});

  const startNew = () => { setEditing(null); setSavedId(null); resetForm(); setShowForm(true); };
  const startEdit = (p) => {
    setEditing(p); setSavedId(p.id);
    setForm({name:p.name,price:String(p.price),orig_price:p.orig_price?String(p.orig_price):"",emoji:p.emoji||"✈️",desc:p.desc||p.description||"",badge:p.badge||"",dest:p.dest||"",active:p.active!==false});
    setShowForm(true);
  };

  const save = async () => {
    if(!form.name.trim()||!form.price) return;
    setSaving(true);
    const payload = {
      cat:"circuit",
      name:form.name.trim(),
      price:Number(form.price),
      orig_price:form.orig_price?Number(form.orig_price):null,
      emoji:form.emoji||"✈️",
      desc:form.desc,
      description:form.desc,
      badge:form.badge||null,
      dest:form.dest||null,
      active:form.active,
      bookable:true,
      book_type:"circuit",
    };
    if(editing) {
      await sb.from("products").update(payload).eq("id",editing.id);
    } else {
      const {data,error} = await sb.from("products").insert({...payload,image_url:null}).select().single();
      if(data){ setSavedId(data.id); setEditing(data); }
      if(error) { alert("Erreur: "+error.message); setSaving(false); return; }
    }
    setSaving(false);
  };

  const deleteCircuit = async (id) => {
    if(!window.confirm("Supprimer ce circuit ?")) return;
    await sb.from("products").delete().eq("id",id);
    if(editing?.id===id){ setShowForm(false); setEditing(null); setSavedId(null); }
  };

  const toggleActive = async (p) => { await sb.from("products").update({active:!p.active}).eq("id",p.id); };

  const INP = ({label,field,placeholder="",type="text"}) => (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <p style={{color:C.muted,fontSize:14}}>{circuits.length} circuit{circuits.length!==1?"s":""} — s'affichent automatiquement sur la page Circuits</p>
        <button type="button" onClick={showForm?()=>{setShowForm(false);setEditing(null);setSavedId(null);}:startNew}
          style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {showForm?"✕ Fermer":"+ Nouveau circuit"}
        </button>
      </div>

      {showForm && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:24,marginBottom:24}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,color:C.gold,marginBottom:18}}>{editing?"Modifier le circuit":"Nouveau circuit"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <INP label="Nom du circuit *" field="name" placeholder="Ex: Circuit Ouidah & Cotonou 7 jours"/>
              <INP label="Destination" field="dest" placeholder="Ex: Bénin, Togo, Sous-région"/>
              <INP label="Emoji" field="emoji" placeholder="✈️"/>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Description</label>
                <textarea value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Décrivez le circuit, les points forts, les inclus spécifiques…" rows={4}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div>
              <INP label="Prix (FCFA) *" field="price" placeholder="721000" type="number"/>
              <INP label="Prix barré (FCFA)" field="orig_price" placeholder="850000" type="number"/>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>Badge</label>
                <select value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}}>
                  <option value="">— Aucun —</option>
                  {["Nouveau","Bestseller","Promo","Premium"].map(b=><option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                <input type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))} style={{accentColor:C.gold,width:16,height:16}}/>
                <span style={{fontSize:13,color:C.white,fontWeight:600}}>Visible sur le site</span>
              </label>
              <div style={{display:"flex",gap:8}}>
                <button type="button" onClick={save} disabled={saving||!form.name||!form.price}
                  style={{flex:1,background:saving||!form.name||!form.price?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:saving||!form.name||!form.price?C.muted:C.bg,border:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {saving?<><Spinner size={14}/>Sauvegarde…</>:"Sauvegarder"}
                </button>
                <button type="button" onClick={()=>{setShowForm(false);setEditing(null);setSavedId(null);}}
                  style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:12,padding:"11px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
              </div>
            </div>
          </div>
          {savedId && (
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:C.card2,border:`1px solid ${C.gold}33`,borderRadius:14,padding:18}}>
                <ImageUploader productId={savedId}/>
              </div>
            </div>
          )}
        </div>
      )}

      {loading
        ? <div style={{display:"flex",gap:10,alignItems:"center",padding:"30px 0"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>
        : circuits.length===0
          ? <div style={{textAlign:"center",padding:"50px 0",color:C.muted}}>
              <p style={{fontSize:16,fontWeight:700,marginBottom:8}}>Aucun circuit pour l'instant</p>
              <p style={{fontSize:13}}>Ajoutez votre premier circuit via le bouton ci-dessus.</p>
            </div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:16}}>
              {circuits.map(p => (
                <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
                  <div style={{height:130,position:"relative",background:"linear-gradient(135deg,#050e05,#0d1a0d)"}}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:44}}>{p.emoji||"✈️"}</div>
                    }
                    {!p.active && (
                      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{color:C.red,fontWeight:800,fontSize:12}}>Masqué</span>
                      </div>
                    )}
                    {p.badge && (
                      <span style={{position:"absolute",top:8,right:8,background:C.gold,color:C.bg,fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:999}}>{p.badge}</span>
                    )}
                  </div>
                  <div style={{padding:"14px 16px"}}>
                    <p style={{fontWeight:700,fontSize:14,color:C.white,marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</p>
                    <p style={{fontSize:11,color:C.muted,marginBottom:8}}>{p.dest||"Circuit"}{p.badge?` · ${p.badge}`:""}</p>
                    <p style={{fontWeight:800,fontSize:14,color:C.gold,marginBottom:12}}>{new Intl.NumberFormat("fr-FR").format(p.price)} FCFA</p>
                    <div style={{display:"flex",gap:6}}>
                      <button type="button" onClick={()=>startEdit(p)} style={{flex:1,background:`${C.gold}15`,border:`1px solid ${C.gold}33`,color:C.gold,borderRadius:9,padding:"7px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Modifier</button>
                      <button type="button" onClick={()=>toggleActive(p)} style={{background:`${p.active?C.red:C.green}15`,border:`1px solid ${p.active?C.red:C.green}33`,color:p.active?C.red:C.green,borderRadius:9,padding:"7px 10px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{p.active?"Masquer":"Afficher"}</button>
                      <button type="button" onClick={()=>deleteCircuit(p.id)} style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:9,padding:"7px 10px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      }
    </div>
  );
}

// ── ONGLET 2 : CONFIGURATION PAGE CIRCUITS ────────────────────────────────────
function CircuitsConfigTab({activeTab}) {
  const [config,  setConfig]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [cf, setCf] = useState(DEFAULT_CIRCUIT_CONFIG);
  const [editPack, setEditPack] = useState(null);
  const [editDay,  setEditDay]  = useState(null);
  const [newInclus,    setNewInclus]    = useState("");
  const [newNonInclus, setNewNonInclus] = useState("");

  useEffect(()=>{
    sb.from("circuit_config").select("*").single()
      .then(({data})=>{ if(data){setConfig(data);setCf({...DEFAULT_CIRCUIT_CONFIG,...data});} setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  const save = async () => {
    setSaving(true);
    if(config) {
      await sb.from("circuit_config").update(cf).eq("id",config.id);
    } else {
      const {data} = await sb.from("circuit_config").insert(cf).select().single();
      if(data) setConfig(data);
    }
    setSaving(false);
    alert("Modifications sauvegardées !");
  };

  const INP = ({label,field,placeholder=""}) => (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <input value={cf[field]||""} onChange={e=>setCf(x=>({...x,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
    </div>
  );

  const TA = ({label,field,rows=3}) => (
    <div style={{marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{label}</label>
      <textarea value={cf[field]||""} onChange={e=>setCf(x=>({...x,[field]:e.target.value}))} rows={rows}
        style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
    </div>
  );

  if(loading) return <div style={{display:"flex",gap:10,alignItems:"center",padding:"30px 0"}}><Spinner/><span style={{color:C.muted}}>Chargement…</span></div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}>
        <button type="button" onClick={save} disabled={saving}
          style={{background:saving?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:saving?C.muted:C.bg,border:"none",borderRadius:12,padding:"10px 22px",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:8}}>
          {saving?<><Spinner size={14}/>Sauvegarde…</>:"Sauvegarder les modifications"}
        </button>
      </div>

      {/* GÉNÉRAL */}
      {activeTab==="general" && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:26}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:800,fontSize:17,color:C.gold,marginBottom:20}}>Textes de la page</h3>
          <INP label="Titre principal" field="hero_title" placeholder="Circuits Vacances"/>
          <INP label="Sous-titre" field="hero_subtitle" placeholder="Afrique de l'Ouest — Clé en main"/>
          <TA  label="Description (accroche)" field="hero_desc" rows={3}/>
          <INP label="Badge saison" field="saison" placeholder="Saison 2026 — 2027"/>
          <TA  label="Conditions de paiement" field="conditions" rows={3}/>
        </div>
      )}

      {/* PACKS */}
      {activeTab==="packs" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {(cf.packs||[]).map((pack,pi)=>(
            <div key={pack.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,overflow:"hidden"}}>
              <div style={{background:pack.color||C.bg,padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontWeight:800,fontSize:15,color:C.white}}>{pack.name}</p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:2}}>{pack.countries}</p>
                </div>
                <button type="button" onClick={()=>setEditPack(editPack===pi?null:pi)}
                  style={{background:`${C.gold}20`,border:`1px solid ${C.gold}44`,color:C.gold,borderRadius:9,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                  {editPack===pi?"Fermer":"Modifier"}
                </button>
              </div>
              {editPack===pi && (
                <div style={{padding:22}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
                    {[["name","Nom"],["countries","Pays / description"],["color","Couleur (hex)"],["base","Prix de base (€)"],["note","Note tarifaire"]].map(([f,l])=>(
                      <div key={f}>
                        <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:5}}>{l}</label>
                        <input value={pack[f]||""} onChange={e=>{const np=[...cf.packs];np[pi]={...np[pi],[f]:e.target.value};setCf(x=>({...x,packs:np}));}}
                          style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:12,fontWeight:700,color:C.muted,marginBottom:10}}>Lignes de prix</p>
                  {(pack.prices||[]).map((pr,pri)=>(
                    <div key={pri} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
                      {[["label","Libellé"],["eur","Prix €"],["fcfa","Prix FCFA"]].map(([f,l])=>(
                        <div key={f}>
                          <label style={{fontSize:10,color:C.muted,display:"block",marginBottom:3}}>{l}</label>
                          <input value={pr[f]||""} onChange={e=>{const np=[...cf.packs];const npr=[...(np[pi].prices||[])];npr[pri]={...npr[pri],[f]:e.target.value};np[pi]={...np[pi],prices:npr};setCf(x=>({...x,packs:np}));}}
                            style={{width:"100%",background:C.bg,border:`1px solid ${C.border}`,borderRadius:7,padding:"7px 10px",color:C.white,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                        </div>
                      ))}
                      <button type="button" onClick={()=>{const np=[...cf.packs];np[pi]={...np[pi],prices:(np[pi].prices||[]).filter((_,j)=>j!==pri)};setCf(x=>({...x,packs:np}));}}
                        style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:7,padding:"7px 10px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:14}}>✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={()=>{const np=[...cf.packs];np[pi]={...np[pi],prices:[...(np[pi].prices||[]),{label:"",eur:"",fcfa:""}]};setCf(x=>({...x,packs:np}));}}
                    style={{background:`${C.blue}15`,border:`1px solid ${C.blue}33`,color:C.blue,borderRadius:9,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:6}}>
                    + Ajouter une ligne de prix
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PÉRIODES */}
      {activeTab==="periodes" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {(cf.periodes||[]).map((p,pi)=>(
            <div key={pi} style={{background:C.card,border:`1px solid ${pi===1?C.gold+"44":C.border}`,borderRadius:18,padding:22}}>
              <p style={{fontWeight:800,fontSize:15,color:pi===1?C.gold:C.blue,marginBottom:16}}>{p.label||"Saison"}</p>
              {[["type","Type (basse/haute)"],["label","Titre"],["dates","Dates"],["desc","Description"],["tarif","Tarif affiché"]].map(([f,l])=>(
                <div key={f} style={{marginBottom:10}}>
                  <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>{l}</label>
                  <input value={p[f]||""} onChange={e=>{const np=[...cf.periodes];np[pi]={...np[pi],[f]:e.target.value};setCf(x=>({...x,periodes:np}));}}
                    style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.white,fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* PROGRAMME */}
      {activeTab==="programme" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(cf.programme||[]).map((item,di)=>(
            <div key={di} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 18px",cursor:"pointer"}} onClick={()=>setEditDay(editDay===di?null:di)}>
                <div style={{width:44,height:44,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,color:C.bg,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,flexShrink:0}}>J{item.day}</div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:13,color:C.gold}}>{item.location}</p>
                  <p style={{fontSize:11,color:C.muted}}>{(item.desc||"").slice(0,70)}…</p>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button type="button" onClick={e=>{e.stopPropagation();const np=[...cf.programme];if(di>0){[np[di-1],np[di]]=[np[di],np[di-1]];setCf(x=>({...x,programme:np}));}}}
                    style={{background:C.card2,border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:12}} title="Monter">↑</button>
                  <button type="button" onClick={e=>{e.stopPropagation();const np=[...cf.programme];if(di<np.length-1){[np[di],np[di+1]]=[np[di+1],np[di]];setCf(x=>({...x,programme:np}));}}}
                    style={{background:C.card2,border:`1px solid ${C.border}`,color:C.muted,borderRadius:7,padding:"4px 8px",cursor:"pointer",fontSize:12}} title="Descendre">↓</button>
                  <button type="button" onClick={e=>{e.stopPropagation();if(window.confirm("Supprimer ce jour ?")){const np=[...cf.programme];np.splice(di,1);setCf(x=>({...x,programme:np}));setEditDay(null);}}}
// ═══════════════════════════════════════════════════════════════════════════
// SECTION ACOMPTES — Suivi + Modification complète
// ═══════════════════════════════════════════════════════════════════════════
function AcomptesSection() {
  const resLoader = useCallback(() =>
    sb.from('reservations').select('*').order('created_at', { ascending: false }), []);
  const { data: reservations, loading, reload } = useRealtimeTable('reservations', resLoader);

  const [filter, setFilter]       = useState('Tous');
  const [search, setSearch]       = useState('');
  const [editing, setEditing]     = useState(null); // réservation en cours d'édition
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [confirm, setConfirm]     = useState(null);
  const [paiement, setPaiement]   = useState(null); // modal paiement partiel
  const [pForm, setPForm]         = useState({ montant: '', mode: 'Mobile Money', note: '' });

  const STATUSES = ['En attente', 'Acompte reçu', 'Acompte partiel', 'Confirmé', 'Annulé'];
  const STATUS_COLOR = {
    'En attente':    C.orange,
    'Acompte reçu':  C.blue,
    'Acompte partiel': C.sys,
    'Confirmé':      C.green,
    'Annulé':        C.red,
  };

  // Calcul intelligent selon le type
  const getInfo = (r) => {
    const pct_default = r.book_type === 'circuit' ? 30 : 10;
    const pct = r.acompte_pct || pct_default;
    const total = r.total_estime || Math.round((r.total || 0) / (pct / 100));
    const acompte_du = Math.round(total * pct / 100);
    const acompte_recu = r.acompte_recu || r.total || 0;
    const solde = total - acompte_recu;
    const paiements = r.paiements || [];
    return { pct, total, acompte_du, acompte_recu, solde, paiements };
  };

  const filtered = reservations.filter(r => {
    const matchFilter = filter === 'Tous' || r.status === filter;
    const matchSearch = !search || (r.client_name||'').toLowerCase().includes(search.toLowerCase())
      || (r.product_name||'').toLowerCase().includes(search.toLowerCase())
      || (r.id||'').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalEncaisse = reservations.reduce((s, r) => {
    const { acompte_recu } = getInfo(r);
    return ['Acompte reçu','Acompte partiel','Confirmé'].includes(r.status) ? s + acompte_recu : s;
  }, 0);

  const totalSoldes = reservations.reduce((s, r) => {
    const { solde } = getInfo(r);
    return ['Acompte reçu','Acompte partiel'].includes(r.status) ? s + solde : s;
  }, 0);

  // Ouvrir l'éditeur
  const openEdit = (r) => {
    const { pct, total, acompte_du, acompte_recu } = getInfo(r);
    setEditing(r);
    setEditForm({
      acompte_pct: String(pct),
      total_estime: String(total),
      acompte_recu: String(acompte_recu),
      status: r.status,
      note_admin: r.note_admin || '',
    });
  };

  // Sauvegarder les modifications
  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const total_estime = Number(editForm.total_estime);
    const acompte_pct  = Number(editForm.acompte_pct);
    const acompte_recu = Number(editForm.acompte_recu);
    const acompte_du   = Math.round(total_estime * acompte_pct / 100);
    const solde        = total_estime - acompte_recu;

    await sb.from('reservations').update({
      acompte_pct,
      total_estime,
      acompte_recu,
      total: acompte_recu, // on garde total = acompte reçu pour compatibilité
      status: editForm.status,
      note_admin: editForm.note_admin,
    }).eq('id', editing.id);

    // Notifier le client si statut changé
    if (editForm.status !== editing.status && editing.client_email && editing.client_email !== 'N/A') {
      try {
        await fetch('https://bgsqouczemoqazhcyzga.supabase.co/functions/v1/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: editing.client_email,
            subject: `Mise à jour réservation S-Mall — ${editing.product_name}`,
            html: `<div style="font-family:sans-serif;background:#080808;color:#f4ede0;padding:28px;border-radius:14px;max-width:520px;margin:auto;">
              <h1 style="font-family:Georgia,serif;color:#c8a84b;text-align:center;">S-MALL</h1>
              <div style="background:#0f0f0f;border-radius:10px;padding:20px;margin:16px 0;border:0.5px solid rgba(200,168,75,0.2);">
                <p>Bonjour <strong>${editing.client_name}</strong>,</p>
                <p style="margin-top:10px;">Votre réservation <strong>${editing.product_name}</strong> a été mise à jour.</p>
                <div style="margin-top:14px;padding:12px;background:#1a1a1a;border-radius:8px;">
                  <p>Statut : <strong style="color:#c8a84b;">${editForm.status}</strong></p>
                  <p>Acompte reçu : <strong style="color:#c8a84b;">${new Intl.NumberFormat('fr-FR').format(acompte_recu)} FCFA</strong></p>
                  <p>Solde restant : <strong>${new Intl.NumberFormat('fr-FR').format(solde)} FCFA</strong></p>
                </div>
                ${editForm.note_admin ? `<p style="margin-top:12px;color:#8a8278;">Note : ${editForm.note_admin}</p>` : ''}
              </div>
              <p style="text-align:center;color:#5a5450;font-size:12px;">S-Mall · Cotonou, Bénin</p>
            </div>`,
          }),
        });
      } catch (e) { console.warn('Email failed:', e); }
    }

    setSaving(false);
    setEditing(null);
    reload();
  };

  // Enregistrer un paiement partiel
  const savePaiement = async () => {
    if (!paiement || !pForm.montant) return;
    setSaving(true);
    const montant = Number(pForm.montant);
    const ancien_recu = getInfo(paiement).acompte_recu;
    const nouveau_recu = ancien_recu + montant;
    const { total } = getInfo(paiement);
    const nouveau_statut = nouveau_recu >= total ? 'Confirmé'
      : nouveau_recu > 0 ? 'Acompte partiel'
      : paiement.status;

    // Historique des paiements
    const historique = paiement.paiements || [];
    historique.push({
      date: new Date().toISOString(),
      montant,
      mode: pForm.mode,
      note: pForm.note,
    });

    await sb.from('reservations').update({
      acompte_recu: nouveau_recu,
      total: nouveau_recu,
      status: nouveau_statut,
      paiements: historique,
    }).eq('id', paiement.id);

    setPaiement(null);
    setPForm({ montant: '', mode: 'Mobile Money', note: '' });
    setSaving(false);
    reload();
  };

  const updateStatus = async (id, status) => {
    await sb.from('reservations').update({ status }).eq('id', id);
  };

  const INP = ({ label, field, type = 'text', help }) => (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{label}</label>
      <input type={type} value={editForm[field] || ''} onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
        style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.white, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
      {help && <p style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{help}</p>}
    </div>
  );

  return (
    <div>
      <ConfirmModal message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />

      {/* MODAL ÉDITION */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setEditing(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.card, border: `1px solid ${C.gold}44`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Modifier la réservation</p>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 18, color: C.white }}>{editing.client_name} — {editing.product_name}</h3>
              </div>
              <button type="button" onClick={() => setEditing(null)}
                style={{ background: 'none', border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Statut */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>Statut</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.white, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Total estimé */}
              <INP label="Total estimé (FCFA)" field="total_estime" type="number"
                help="Le montant total de la prestation. L'acompte sera calculé en % de ce montant." />

              {/* % Acompte */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>
                  Pourcentage d'acompte : <span style={{ color: C.gold }}>{editForm.acompte_pct}%</span>
                </label>
                <input type="range" min="5" max="100" step="5"
                  value={editForm.acompte_pct || 10}
                  onChange={e => setEditForm(f => ({ ...f, acompte_pct: e.target.value }))}
                  style={{ width: '100%', accentColor: C.gold }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginTop: 4 }}>
                  <span>5%</span>
                  <span style={{ color: C.gold, fontWeight: 700 }}>
                    → Acompte dû : {new Intl.NumberFormat('fr-FR').format(
                      Math.round((Number(editForm.total_estime) || 0) * Number(editForm.acompte_pct) / 100)
                    )} FCFA
                  </span>
                  <span>100%</span>
                </div>
              </div>

              {/* Acompte déjà reçu */}
              <INP label="Acompte déjà reçu (FCFA)" field="acompte_recu" type="number"
                help="Montant total effectivement encaissé à ce jour." />

              {/* Résumé calculé */}
              {editForm.total_estime && (
                <div style={{ background: `${C.gold}0a`, border: `0.5px solid ${C.gold}33`, borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Récapitulatif</p>
                  {[
                    ['Total estimé', `${new Intl.NumberFormat('fr-FR').format(Number(editForm.total_estime))} FCFA`],
                    [`Acompte (${editForm.acompte_pct}%)`, `${new Intl.NumberFormat('fr-FR').format(Math.round(Number(editForm.total_estime) * Number(editForm.acompte_pct) / 100))} FCFA`],
                    ['Déjà reçu', `${new Intl.NumberFormat('fr-FR').format(Number(editForm.acompte_recu))} FCFA`],
                    ['Solde restant', `${new Intl.NumberFormat('fr-FR').format(Number(editForm.total_estime) - Number(editForm.acompte_recu))} FCFA`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: C.muted }}>{k}</span>
                      <span style={{ fontWeight: 700, color: k === 'Solde restant' ? C.orange : C.white }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Note admin */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>Note interne (admin uniquement)</label>
                <textarea value={editForm.note_admin || ''} onChange={e => setEditForm(f => ({ ...f, note_admin: e.target.value }))}
                  placeholder="Ex: arrangement accordé, paiement en 3 fois…" rows={2}
                  style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.white, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={saveEdit} disabled={saving}
                  style={{ flex: 1, background: saving ? '#333' : `linear-gradient(135deg,${C.goldD},${C.gold})`, color: saving ? C.muted : C.bg, border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {saving ? <><Spinner size={14} />Sauvegarde…</> : '💾 Sauvegarder'}
                </button>
                <button type="button" onClick={() => setEditing(null)}
                  style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: 12, padding: '12px 18px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT PARTIEL */}
      {paiement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setPaiement(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.card, border: `1px solid ${C.green}44`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 10, color: C.green, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Enregistrer un paiement</p>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 17, color: C.white }}>{paiement.client_name}</h3>
              </div>
              <button type="button" onClick={() => setPaiement(null)}
                style={{ background: 'none', border: `0.5px solid ${C.border}`, color: C.muted, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            {/* Historique des paiements */}
            {(paiement.paiements || []).length > 0 && (
              <div style={{ background: C.card2, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>Historique</p>
                {(paiement.paiements || []).map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5, paddingBottom: 5, borderBottom: i < paiement.paiements.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
                    <span style={{ color: C.muted }}>{new Date(p.date).toLocaleDateString('fr-FR')} · {p.mode}</span>
                    <span style={{ fontWeight: 700, color: C.green }}>+{new Intl.NumberFormat('fr-FR').format(p.montant)} FCFA</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>Montant reçu (FCFA) *</label>
                <input type="number" value={pForm.montant} onChange={e => setPForm(f => ({ ...f, montant: e.target.value }))}
                  placeholder="Ex: 50000"
                  style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.white, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>Mode de paiement</label>
                <select value={pForm.mode} onChange={e => setPForm(f => ({ ...f, mode: e.target.value }))}
                  style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.white, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}>
                  {['Mobile Money', 'Virement bancaire', 'Carte bancaire', 'Espèces', 'PayPal', 'Autre'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>Note (optionnel)</label>
                <input value={pForm.note} onChange={e => setPForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Ex: reçu MTN #12345"
                  style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.white, fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {pForm.montant && (
                <div style={{ background: `${C.green}0d`, border: `0.5px solid ${C.green}33`, borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: C.muted }}>Déjà reçu</span>
                    <span style={{ fontWeight: 600 }}>{new Intl.NumberFormat('fr-FR').format(getInfo(paiement).acompte_recu)} FCFA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: C.muted }}>+ Ce paiement</span>
                    <span style={{ fontWeight: 600, color: C.green }}>+{new Intl.NumberFormat('fr-FR').format(Number(pForm.montant))} FCFA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `0.5px solid ${C.border}`, paddingTop: 6 }}>
                    <span style={{ color: C.muted }}>Nouveau total reçu</span>
                    <span style={{ fontWeight: 800, color: C.gold }}>{new Intl.NumberFormat('fr-FR').format(getInfo(paiement).acompte_recu + Number(pForm.montant))} FCFA</span>
                  </div>
                </div>
              )}

              <button type="button" onClick={savePaiement} disabled={saving || !pForm.montant}
                style={{ background: pForm.montant && !saving ? `linear-gradient(135deg,#1a6b2e,${C.green})` : '#333', color: pForm.montant && !saving ? '#fff' : C.muted, border: 'none', borderRadius: 12, padding: '12px', fontWeight: 700, fontSize: 14, cursor: pForm.montant && !saving ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? <><Spinner size={14} />Enregistrement…</> : '✓ Enregistrer le paiement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EN-TÊTE */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 24, marginBottom: 4 }}>Gestion des Acomptes</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Modifiez les acomptes, enregistrez les paiements partiels, suivez les soldes</p>
      </div>

      {/* CARTES RÉSUMÉ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total encaissé', val: fmt(totalEncaisse), color: C.green },
          { label: 'Soldes à recevoir', val: fmt(totalSoldes), color: C.orange },
          { label: 'En attente', val: reservations.filter(r => r.status === 'En attente').length, color: C.red },
          { label: 'Confirmées', val: reservations.filter(r => r.status === 'Confirmé').length, color: C.gold },
        ].map(c => (
          <div key={c.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{c.label}</p>
            <p style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 20, color: c.color }}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* FILTRES + RECHERCHE */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', gap: 8 }}>
          <span style={{ color: C.gold }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Client, produit, réf…"
            style={{ border: 'none', outline: 'none', background: 'transparent', color: C.white, fontSize: 13, width: '100%', fontFamily: "'DM Sans',sans-serif" }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Tous', ...STATUSES].map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              style={{ padding: '7px 14px', borderRadius: 999, border: `1.5px solid ${filter === f ? C.gold : C.border}`, background: filter === f ? `${C.gold}18` : 'transparent', color: filter === f ? C.gold : C.muted, fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      {loading
        ? <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Spinner /><span style={{ color: C.muted }}>Chargement…</span></div>
        : filtered.length === 0
          ? <p style={{ color: C.muted, textAlign: 'center', padding: '40px 0' }}>Aucune réservation trouvée.</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.map(r => {
                const { pct, total, acompte_du, acompte_recu, solde, paiements } = getInfo(r);
                const progression = total > 0 ? Math.min(100, Math.round(acompte_recu / total * 100)) : 0;
                return (
                  <div key={r.id} style={{ background: C.card, border: `1px solid ${STATUS_COLOR[r.status] || C.border}33`, borderRadius: 16, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>

                      {/* Infos */}
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 18 }}>{r.product_emoji || '📅'}</span>
                          <span style={{ fontWeight: 800, fontSize: 15, color: C.white }}>{r.client_name}</span>
                          <span style={{ fontSize: 12, color: C.muted }}>— {r.product_name}</span>
                          <span style={{ background: `${STATUS_COLOR[r.status] || C.border}20`, color: STATUS_COLOR[r.status] || C.muted, fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>{r.status}</span>
                        </div>
                        <p style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>📞 {r.client_tel} · 📅 {r.date_from} · Réf: {r.id}</p>
                        {r.note_admin && <p style={{ fontSize: 11, color: C.orange, marginBottom: 6, fontStyle: 'italic' }}>📝 {r.note_admin}</p>}

                        {/* Barre de progression */}
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 4 }}>
                            <span>Reçu : <strong style={{ color: C.green }}>{new Intl.NumberFormat('fr-FR').format(acompte_recu)} FCFA</strong></span>
                            <span>Solde : <strong style={{ color: C.orange }}>{new Intl.NumberFormat('fr-FR').format(solde)} FCFA</strong></span>
                            <span>Total : <strong style={{ color: C.white }}>{new Intl.NumberFormat('fr-FR').format(total)} FCFA</strong></span>
                          </div>
                          <div style={{ height: 6, background: C.card2, borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progression}%`, background: `linear-gradient(90deg,${C.goldD},${C.gold})`, borderRadius: 999, transition: 'width .4s' }} />
                          </div>
                          <p style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{progression}% encaissé · Acompte {pct}%</p>
                        </div>

                        {/* Historique paiements */}
                        {paiements.length > 0 && (
                          <div style={{ marginTop: 8, fontSize: 11, color: C.muted }}>
                            {paiements.map((p, i) => (
                              <span key={i} style={{ marginRight: 10 }}>
                                {new Date(p.date).toLocaleDateString('fr-FR')} : +{new Intl.NumberFormat('fr-FR').format(p.montant)} FCFA ({p.mode})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
                        <button type="button" onClick={() => openEdit(r)}
                          style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}33`, color: C.gold, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
                          ✏️ Modifier acompte
                        </button>
                        <button type="button" onClick={() => { setPaiement(r); setPForm({ montant: '', mode: 'Mobile Money', note: '' }); }}
                          style={{ background: `${C.green}15`, border: `1px solid ${C.green}33`, color: C.green, borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>
                          + Enregistrer paiement
                        </button>
                        {r.status === 'En attente' && r.client_tel && (
                          <a href={`https://wa.me/${r.client_tel.replace(/\D/g,'')}?text=Bonjour%20${encodeURIComponent(r.client_name)}%2C%20votre%20r%C3%A9servation%20${encodeURIComponent(r.product_name||'')}%20est%20en%20attente%20d'acompte%20(${pct}%25%20soit%20${new Intl.NumberFormat('fr-FR').format(acompte_du)}%20FCFA).%20Merci%20de%20r%C3%A9gulariser.%20%E2%80%94%20S-Mall`}
                            target="_blank" rel="noreferrer"
                            style={{ background: '#25d36615', border: '1px solid #25d36633', color: '#25d366', borderRadius: 10, padding: '7px 14px', fontWeight: 700, fontSize: 12, textDecoration: 'none', fontFamily: "'DM Sans',sans-serif", textAlign: 'center' }}>
                            💬 Relancer
                          </a>
                        )}
                        <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)}
                          style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 12px', color: C.white, fontSize: 11, fontFamily: "'DM Sans',sans-serif", outline: 'none', cursor: 'pointer' }}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
      }
    </div>
  );
}
// ─── MENU ─────────────────────────────────────────────────────────────────────
const MENU = [
  { id:"stats",        label:"Tableau de bord", icon:"📊" },
  { id:"products",     label:"Produits",         icon:"🛍️" },
  { id:"orders",       label:"Commandes",         icon:"🛒" },
  { id:"reservations", label:"Réservations",      icon:"📅" },
  { id:"messages",     label:"Messages",          icon:"💬" },
  { id:"reviews",      label:"Avis clients",      icon:"⭐" },
  { id:"acomptes",     label:"Acomptes",          icon:"💳" },
  { id:"banners",      label:"Bannières",         icon:"🖼️" },
  { id:"categories",   label:"Catégories",        icon:"🏷️" },
  { id:"shipping",     label:"Livraisons",        icon:"🚚" },
  { id:"circuits",     label:"Circuits",          icon:"✈️" },
];

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function SMallAdmin() {
  const [user,    setUser]    = useState(null);      // session Supabase Auth
  const [loading, setLoading] = useState(true);      // chargement initial session
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [err,     setErr]     = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [section, setSection] = useState("stats");
  const [toast,   setToast]   = useState(null);

  const showToast = useCallback((msg, color=C.green) => {
    setToast({ msg, color }); setTimeout(() => setToast(null), 3000);
  }, []);

  const msgLoader = useCallback(() => sb.from("messages").select("id,read"), []);
  const revLoader = useCallback(() => sb.from("reviews").select("id,approved"), []);
  const { data:messages } = useRealtimeTable("messages", msgLoader);
  const { data:reviews }  = useRealtimeTable("reviews",  revLoader);
  const unreadMsg  = messages.filter(m => !m.read).length;
  const pendingRev = reviews.filter(r => !r.approved).length;

  // ── Vérifie la session existante au chargement ──
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    // Écoute les changements d'état auth (login/logout/refresh)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Connexion via Supabase Auth ──
  const tryLogin = async () => {
    if (!email.trim() || !pwd) return;
    setLoggingIn(true); setErr("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pwd });
    if (error) {
      setErr("Email ou mot de passe incorrect.");
      setPwd("");
    }
    setLoggingIn(false);
  };

  // ── Déconnexion via Supabase Auth ──
  const logout = async () => {
    await sb.auth.signOut();
    setSection("stats");
  };

  // ── Écran de chargement initial ──
  if (loading) {
    return (
      <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <Spinner size={36}/>
      </div>
    );
  }

  // ── Écran de connexion ──
  if (!user) {
    return (
      <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes spin{to{transform:rotate(360deg)}}@keyframes glow{0%,100%{box-shadow:0 0 14px #c9a84c55}50%{box-shadow:0 0 30px #c9a84c99}}`}</style>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"48px 40px",width:380,textAlign:"center"}}>
          <div style={{width:60,height:60,borderRadius:15,background:`linear-gradient(135deg,${C.goldD},${C.gold})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 20px",animation:"glow 3s ease infinite"}}>✦</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:24,marginBottom:6,color:C.gold}}>S-Mall Admin</h1>
          <p style={{color:C.muted,fontSize:13,marginBottom:28}}>Connexion sécurisée</p>

          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key==="Enter" && tryLogin()}
              placeholder="Email administrateur"
              autoFocus
              style={{width:"100%",background:C.card2,border:`1.5px solid ${err?C.red:C.border}`,borderRadius:12,padding:"12px 16px",color:C.white,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center",boxSizing:"border-box"}}
            />
            <input
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              onKeyDown={e => e.key==="Enter" && tryLogin()}
              placeholder="Mot de passe"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${err?C.red:C.border}`,borderRadius:12,padding:"12px 16px",color:C.white,fontSize:15,fontFamily:"'DM Sans',sans-serif",outline:"none",textAlign:"center",boxSizing:"border-box"}}
            />
          </div>

          <button type="button" onClick={tryLogin} disabled={loggingIn||!email||!pwd}
            style={{width:"100%",background:loggingIn||!email||!pwd?"#333":`linear-gradient(135deg,${C.goldD},${C.gold})`,color:loggingIn||!email||!pwd?C.muted:C.bg,border:"none",borderRadius:13,padding:"13px",fontWeight:700,fontSize:15,cursor:loggingIn||!email||!pwd?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loggingIn ? <><Spinner size={16}/>Connexion…</> : "Connexion"}
          </button>

          {err && <p style={{color:C.red,fontSize:13,marginTop:12,fontWeight:600}}>{err}</p>}

          <p style={{color:C.muted,fontSize:11,marginTop:16,lineHeight:1.6}}>
            Accès réservé aux administrateurs autorisés.<br/>
            Authentification via Supabase Auth.
          </p>
        </div>
      </div>
    );
  }

  // ── Interface Admin ──
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
            <span style={{fontSize:11,color:C.green,fontWeight:600}}>Connecté · Supabase Auth</span>
          </div>
          <p style={{fontSize:10,color:C.muted,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={user.email}>{user.email}</p>
        </div>

        <nav style={{flex:1,padding:"12px 10px"}}>
          {MENU.map(m => (
            <button type="button" key={m.id} onClick={() => setSection(m.id)}
              style={{width:"100%",background:section===m.id?`${C.gold}18`:"transparent",border:`1px solid ${section===m.id?C.gold+"44":"transparent"}`,borderRadius:10,padding:"10px 14px",color:section===m.id?C.gold:C.muted,fontWeight:section===m.id?700:600,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",marginBottom:3,display:"flex",alignItems:"center",gap:10,transition:"all .2s"}}>
              <span>{m.icon}</span>
              <span style={{flex:1}}>{m.label}</span>
              {m.id==="messages" && unreadMsg>0  && <span style={{background:C.red,   color:C.white,borderRadius:999,padding:"1px 6px",fontSize:10,fontWeight:800}}>{unreadMsg}</span>}
              {m.id==="reviews"  && pendingRev>0  && <span style={{background:C.orange,color:C.white,borderRadius:999,padding:"1px 6px",fontSize:10,fontWeight:800}}>{pendingRev}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:"14px 18px",borderTop:`1px solid ${C.border}`}}>
          <button type="button" onClick={logout}
            style={{width:"100%",background:`${C.red}15`,border:`1px solid ${C.red}33`,color:C.red,borderRadius:10,padding:"9px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            ⏻ Déconnexion
          </button>
        </div>
      </aside>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:16,right:16,zIndex:9999,background:C.card,border:`1px solid ${toast.color}`,color:toast.color,padding:"11px 20px",borderRadius:12,fontWeight:700,fontSize:13,boxShadow:"0 8px 28px rgba(0,0,0,.7)",maxWidth:320,pointerEvents:"none"}}>
          {toast.msg}
        </div>
      )}

      {/* MAIN */}
      <main style={{flex:1,padding:"32px 36px",overflowY:"auto"}}>
        {section==="stats"        && <StatsSection showToast={showToast}/>}
        {section==="products"     && <ProductsSection showToast={showToast}/>}
        {section==="orders"       && <OrdersSection showToast={showToast}/>}
        {section==="reservations" && <ReservationsSection showToast={showToast}/>}
        {section==="messages"     && <MessagesSection showToast={showToast}/>}
        {section==="reviews"      && <ReviewsSection showToast={showToast}/>}
        {section==="acomptes"     && <AcomptesSection/>}
        {section==="banners"      && <BannersSection/>}
        {section==="categories"   && <CategoriesSection/>}
        {section==="shipping"     && <ShippingSection/>}
        {section==="circuits"     && <CircuitsSection/>}
        {/* Copier BannersSection, CategoriesSection, ShippingSection, CircuitsSection depuis l'original */}
      </main>
    </div>
  );
}
