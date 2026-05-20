// ─── LegalPages.js ────────────────────────────────────────────────────────────
// Contient :
//   - CookieBanner    : bandeau de consentement (à monter en haut de SMall)
//   - PrivacyPage     : politique de confidentialité complète
//   - TermsPage       : conditions générales de vente
//
// INTÉGRATION dans Client.js :
//   1. Importer : import { CookieBanner, PrivacyPage, TermsPage } from './LegalPages';
//   2. Dans le state de SMall : ajouter 'privacy' et 'terms' comme valeurs de `page`
//   3. Ajouter <CookieBanner/> juste après <style>{CSS}</style>
//   4. Ajouter dans le footer les liens :
//      <span onClick={() => go('privacy')} style={{cursor:'pointer',color:C.gold}}>Politique de confidentialité</span>
//      <span onClick={() => go('terms')}   style={{cursor:'pointer',color:C.gold}}>CGV</span>
//   5. Ajouter dans le render :
//      {!loading && page==='privacy' && <PrivacyPage onBack={() => go('home')}/>}
//      {!loading && page==='terms'   && <TermsPage   onBack={() => go('home')}/>}
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

const C = {
  bg:'#0a0a0a', card:'#161616', card2:'#1c1c1c', border:'#2a2a2a',
  gold:'#c9a84c', goldL:'#e8c97a', goldD:'#9a7a2e',
  white:'#f5f0e8', muted:'#888880', green:'#4caf7d', red:'#e05a4e',
};

const STORAGE_KEY = 'smallet_cookie_consent';

// ── BANDEAU COOKIES ───────────────────────────────────────────────────────────
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // N'afficher que si le consentement n'a pas encore été donné
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const decline = () => {
    // En cas de refus : on note le refus mais on ne stocke PAS le panier
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:10000,
      background:C.card, borderTop:`1px solid ${C.border}`,
      padding:'16px 24px', display:'flex', alignItems:'center',
      justifyContent:'space-between', flexWrap:'wrap', gap:14,
      boxShadow:'0 -8px 30px rgba(0,0,0,0.6)',
    }}>
      <div style={{flex:1, minWidth:280}}>
        <p style={{fontWeight:700, fontSize:14, color:C.white, marginBottom:4}}>🍪 Ce site utilise des cookies</p>
        <p style={{fontSize:12, color:C.muted, lineHeight:1.7}}>
          Nous utilisons uniquement le stockage local pour mémoriser votre panier et vos préférences.
          Aucun cookie publicitaire ou de traçage tiers. Voir notre{' '}
          <span style={{color:C.gold, cursor:'pointer', textDecoration:'underline'}}
            onClick={() => { window.dispatchEvent(new CustomEvent('smallet-go', { detail:'privacy' })); }}>
            politique de confidentialité
          </span>.
        </p>
      </div>
      <div style={{display:'flex', gap:10, flexShrink:0}}>
        <button type="button" onClick={decline}
          style={{background:'none', border:`1px solid ${C.border}`, color:C.muted, borderRadius:10, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif"}}>
          Refuser
        </button>
        <button type="button" onClick={accept}
          style={{background:`linear-gradient(135deg,${C.goldD},${C.gold})`, color:C.bg, border:'none', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif"}}>
          Accepter
        </button>
      </div>
    </div>
  );
}

// ── SECTION DE PAGE LÉGALE ────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{marginBottom:32}}>
      <h2 style={{fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:20, color:C.gold, marginBottom:12, borderBottom:`1px solid ${C.border}`, paddingBottom:8}}>{title}</h2>
      <div style={{fontSize:14, color:C.muted, lineHeight:1.9}}>{children}</div>
    </div>
  );
}

function P({ children }) {
  return <p style={{marginBottom:10}}>{children}</p>;
}

function Li({ children }) {
  return (
    <div style={{display:'flex', gap:10, marginBottom:8, alignItems:'flex-start'}}>
      <span style={{color:C.gold, flexShrink:0, marginTop:2}}>✦</span>
      <span>{children}</span>
    </div>
  );
}

// ── POLITIQUE DE CONFIDENTIALITÉ ──────────────────────────────────────────────
export function PrivacyPage({ onBack }) {
  return (
    <div style={{maxWidth:820, margin:'0 auto', padding:'40px 28px', animation:'fadeUp .35s ease'}}>
      <button type="button" onClick={onBack}
        style={{background:'none', border:`1px solid ${C.border}`, color:C.muted, borderRadius:10, padding:'8px 16px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:28, display:'flex', alignItems:'center', gap:6}}>
        ← Retour
      </button>

      <p style={{color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:10, marginBottom:10}}>Légal</p>
      <h1 style={{fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:36, marginBottom:6, color:C.white}}>Politique de confidentialité</h1>
      <p style={{color:C.muted, fontSize:13, marginBottom:36}}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {year:'numeric',month:'long',day:'numeric'})}</p>

      <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'32px 36px'}}>

        <Section title="1. Responsable du traitement">
          <P>Le site S-Mall est édité par <strong style={{color:C.white}}>S-Group</strong>, agence spécialisée dans le commerce en ligne et les services de voyage en Afrique de l'Ouest.</P>
          <P>Contact : <a href="mailto:agencesgroup23@gmail.com" style={{color:C.gold}}>agencesgroup23@gmail.com</a> · WhatsApp : +225 01 50 51 24 08</P>
        </Section>

        <Section title="2. Données collectées">
          <P>Dans le cadre de nos services, nous collectons les données suivantes :</P>
          <Li><strong style={{color:C.white}}>Commandes :</strong> nom, email, téléphone, adresse de livraison, articles commandés, montant total.</Li>
          <Li><strong style={{color:C.white}}>Réservations :</strong> nom, email, téléphone, date souhaitée, nombre de personnes.</Li>
          <Li><strong style={{color:C.white}}>Messages :</strong> nom, email, message saisi dans le formulaire de contact.</Li>
          <Li><strong style={{color:C.white}}>Avis :</strong> nom, note, commentaire (soumis volontairement).</Li>
          <Li><strong style={{color:C.white}}>Stockage local :</strong> contenu du panier et préférence de consentement cookies (stocké sur votre appareil uniquement).</Li>
        </Section>

        <Section title="3. Finalités du traitement">
          <Li>Traitement et suivi de vos commandes et réservations.</Li>
          <Li>Communication relative à votre commande (confirmation, suivi, livraison).</Li>
          <Li>Réponse à vos messages et demandes d'information.</Li>
          <Li>Amélioration de nos services et affichage des avis clients approuvés.</Li>
          <Li>Traitement des paiements via FedaPay (prestataire tiers certifié).</Li>
        </Section>

        <Section title="4. Base légale du traitement">
          <Li><strong style={{color:C.white}}>Exécution du contrat :</strong> traitement des commandes et réservations.</Li>
          <Li><strong style={{color:C.white}}>Intérêt légitime :</strong> réponse aux messages, amélioration du service.</Li>
          <Li><strong style={{color:C.white}}>Consentement :</strong> publication des avis clients, utilisation du stockage local.</Li>
        </Section>

        <Section title="5. Durée de conservation">
          <Li>Commandes et réservations : 3 ans à compter de la date de la transaction.</Li>
          <Li>Messages : 1 an à compter de la réception.</Li>
          <Li>Avis clients : jusqu'à suppression par l'administrateur ou sur demande.</Li>
          <Li>Données de paiement : non stockées sur nos serveurs (gérées par FedaPay).</Li>
        </Section>

        <Section title="6. Partage des données">
          <P>Vos données personnelles ne sont <strong style={{color:C.white}}>jamais vendues</strong> à des tiers. Elles peuvent être partagées uniquement avec :</P>
          <Li><strong style={{color:C.white}}>FedaPay</strong> : pour le traitement sécurisé des paiements.</Li>
          <Li><strong style={{color:C.white}}>Supabase</strong> : hébergeur de la base de données (serveurs sécurisés).</Li>
          <Li><strong style={{color:C.white}}>Nos équipes internes</strong> pour le traitement de votre commande.</Li>
        </Section>

        <Section title="7. Sécurité des données">
          <Li>Connexions chiffrées via HTTPS (TLS 1.3).</Li>
          <Li>Base de données protégée par Row Level Security (RLS).</Li>
          <Li>Authentification admin via Supabase Auth — aucun mot de passe en clair.</Li>
          <Li>Paiements gérés exclusivement par FedaPay (PCI-DSS compliant).</Li>
          <Li>Aucun cookie publicitaire ou de traçage tiers.</Li>
        </Section>

        <Section title="8. Vos droits">
          <P>Conformément à la réglementation applicable sur la protection des données personnelles, vous disposez des droits suivants :</P>
          <Li><strong style={{color:C.white}}>Droit d'accès :</strong> obtenir une copie de vos données.</Li>
          <Li><strong style={{color:C.white}}>Droit de rectification :</strong> corriger des données inexactes.</Li>
          <Li><strong style={{color:C.white}}>Droit à l'effacement :</strong> demander la suppression de vos données.</Li>
          <Li><strong style={{color:C.white}}>Droit à la portabilité :</strong> recevoir vos données dans un format structuré.</Li>
          <Li><strong style={{color:C.white}}>Droit d'opposition :</strong> vous opposer à certains traitements.</Li>
          <P>Pour exercer ces droits, contactez-nous à : <a href="mailto:agencesgroup23@gmail.com" style={{color:C.gold}}>agencesgroup23@gmail.com</a></P>
        </Section>

        <Section title="9. Cookies et stockage local">
          <P>S-Mall n'utilise <strong style={{color:C.white}}>aucun cookie de traçage</strong>. Nous utilisons uniquement le <em>localStorage</em> de votre navigateur pour :</P>
          <Li>Mémoriser le contenu de votre panier entre deux visites.</Li>
          <Li>Enregistrer votre préférence de consentement.</Li>
          <P>Vous pouvez effacer ces données à tout moment depuis les paramètres de votre navigateur.</P>
        </Section>

        <Section title="10. Modifications">
          <P>Nous nous réservons le droit de modifier cette politique à tout moment. La date de dernière mise à jour est indiquée en haut de ce document. En continuant à utiliser le site après une modification, vous acceptez la politique mise à jour.</P>
        </Section>

      </div>
    </div>
  );
}

// ── CONDITIONS GÉNÉRALES DE VENTE ─────────────────────────────────────────────
export function TermsPage({ onBack }) {
  return (
    <div style={{maxWidth:820, margin:'0 auto', padding:'40px 28px', animation:'fadeUp .35s ease'}}>
      <button type="button" onClick={onBack}
        style={{background:'none', border:`1px solid ${C.border}`, color:C.muted, borderRadius:10, padding:'8px 16px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:28, display:'flex', alignItems:'center', gap:6}}>
        ← Retour
      </button>

      <p style={{color:C.gold, fontWeight:700, letterSpacing:3, textTransform:'uppercase', fontSize:10, marginBottom:10}}>Légal</p>
      <h1 style={{fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:36, marginBottom:6, color:C.white}}>Conditions Générales de Vente</h1>
      <p style={{color:C.muted, fontSize:13, marginBottom:36}}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {year:'numeric',month:'long',day:'numeric'})}</p>

      <div style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'32px 36px'}}>

        <Section title="1. Objet et champ d'application">
          <P>Les présentes Conditions Générales de Vente (CGV) régissent toutes les ventes de produits et services effectuées sur le site S-Mall, édité par S-Group. Toute commande implique l'acceptation pleine et entière des présentes CGV.</P>
        </Section>

        <Section title="2. Produits et services">
          <P>S-Mall propose :</P>
          <Li><strong style={{color:C.white}}>Produits physiques</strong> (mode, électronique) : livrés selon les zones et délais affichés.</Li>
          <Li><strong style={{color:C.white}}>Formations et ebooks</strong> : accès numérique envoyé par email après paiement.</Li>
          <Li><strong style={{color:C.white}}>Circuits touristiques</strong> : réservation avec acompte de 30 %, solde 30 jours avant le départ.</Li>
          <Li><strong style={{color:C.white}}>Voitures et appartements</strong> : réservation avec acompte de 10 %, solde finalisé via WhatsApp.</Li>
        </Section>

        <Section title="3. Prix">
          <P>Tous les prix sont indiqués en Francs CFA (FCFA) et sont susceptibles d'être modifiés sans préavis. Le prix applicable est celui affiché au moment de la validation de la commande.</P>
          <P>Les frais de livraison sont affichés clairement dans le panier avant paiement et varient selon la zone géographique.</P>
        </Section>

        <Section title="4. Commande et paiement">
          <P>La commande est confirmée après paiement complet ou versement de l'acompte requis. Les moyens de paiement acceptés sont :</P>
          <Li>Mobile Money (MTN, Moov, Wave, Orange)</Li>
          <Li>Carte bancaire Visa / Mastercard</Li>
          <Li>Virement bancaire (sur demande)</Li>
          <Li>Espèces (pour les retraits sur place)</Li>
          <P>Les paiements en ligne sont traités de façon sécurisée par <strong style={{color:C.white}}>FedaPay</strong>.</P>
        </Section>

        <Section title="5. Livraison">
          <P>Les délais de livraison sont indicatifs et varient selon la zone géographique (24h à 14 jours). S-Group ne saurait être tenu responsable des retards causés par des événements extérieurs (douanes, grèves, force majeure).</P>
          <P>La livraison est gratuite à partir d'un certain montant, affiché dans le panier selon votre zone.</P>
        </Section>

        <Section title="6. Droit de rétractation et remboursements">
          <P><strong style={{color:C.white}}>Produits physiques :</strong> vous disposez de 7 jours à compter de la réception pour signaler un produit défectueux ou non conforme. Contactez-nous par email ou WhatsApp.</P>
          <P><strong style={{color:C.white}}>Formations et ebooks :</strong> compte tenu de leur nature numérique, aucun remboursement n'est possible après envoi du lien d'accès.</P>
          <P><strong style={{color:C.white}}>Circuits et réservations :</strong> l'acompte est non remboursable en cas d'annulation à moins de 30 jours du départ. Au-delà, un remboursement partiel peut être étudié au cas par cas.</P>
        </Section>

        <Section title="7. Responsabilité">
          <P>S-Group s'engage à livrer les produits et services conformes aux descriptions affichées. Sa responsabilité ne saurait être engagée en cas de dommages indirects, pertes d'exploitation ou préjudices consécutifs à l'utilisation des produits.</P>
        </Section>

        <Section title="8. Données personnelles">
          <P>Le traitement de vos données personnelles dans le cadre de vos commandes est régi par notre <strong style={{color:C.white}}>Politique de Confidentialité</strong>, disponible sur ce site.</P>
        </Section>

        <Section title="9. Litiges">
          <P>En cas de litige, nous vous invitons d'abord à nous contacter à l'adresse <a href="mailto:agencesgroup23@gmail.com" style={{color:C.gold}}>agencesgroup23@gmail.com</a> pour une résolution amiable. À défaut d'accord, les tribunaux compétents de Cotonou (Bénin) seront saisis.</P>
        </Section>

        <Section title="10. Droit applicable">
          <P>Les présentes CGV sont soumises au droit béninois. Toute question relative à leur interprétation ou exécution sera soumise à la compétence exclusive des juridictions de Cotonou.</P>
        </Section>

      </div>
    </div>
  );
}

// ── FOOTER LÉGAL (à remplacer dans Client.js) ─────────────────────────────────
// Remplacez le <footer> existant dans Client.js par celui-ci :
//
// <footer style={{ borderTop:`1px solid ${C.border}`, padding:'20px 28px',
//   display:'flex', justifyContent:'space-between', alignItems:'center',
//   flexWrap:'wrap', gap:10, marginTop:24 }}>
//   <div style={{ display:'flex', alignItems:'center', gap:8 }}>
//     <div style={{ width:24, height:24, borderRadius:6, background:`linear-gradient(135deg,${C.goldD},${C.gold})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✦</div>
//     <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:14, background:`linear-gradient(90deg,${C.gold},${C.goldL})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>S-Mall</span>
//   </div>
//   <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
//     <span className="lnk" onClick={() => go('privacy')} style={{ fontSize:12, color:C.muted, cursor:'pointer' }}>Politique de confidentialité</span>
//     <span className="lnk" onClick={() => go('terms')}   style={{ fontSize:12, color:C.muted, cursor:'pointer' }}>CGV</span>
//     <span style={{ fontSize:11, color:C.muted }}>© 2025 S-Mall — S-Group · </span>
//   </div>
// </footer>
