import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const navigation = [
  { id: 'overview', label: 'Vue générale', icon: '▦' },
  { id: 'clients', label: 'Clients', icon: '◉' },
  { id: 'employees', label: 'Employés', icon: '♙' },
  { id: 'services', label: 'Services', icon: '◇' },
  { id: 'requests', label: 'Demandes', icon: '▤' },
  { id: 'quotes', label: 'Devis', icon: '▧' },
  { id: 'invoices', label: 'Factures', icon: '▣' },
  { id: 'payments', label: 'Paiements', icon: '↗' },
];

const moduleDetails = {
  clients: ['Gestion des clients', 'Fiches clients, coordonnées et historique commercial.'],
  employees: ['Gestion des employés', 'Comptes, fonctions, affectations et statuts.'],
  services: ['Catalogue des services', 'Prestations, descriptions et tarifs en FDJ.'],
  requests: ['Demandes de service', 'Réception, affectation et suivi des demandes.'],
  quotes: ['Devis', 'Création, validation, numérotation et export PDF.'],
  invoices: ['Factures et livraisons', 'Facturation, bons de livraison et suivi des soldes.'],
  payments: ['Paiements manuels', 'Enregistrement des espèces, virements et autres règlements.'],
};

function App() {
  const [active, setActive] = useState('overview');
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  const activeLabel = navigation.find((item) => item.id === active)?.label ?? 'Vue générale';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="SDMON">
          <span className="brand-mark">S</span>
          <span>SDMON <small>BUSINESS SPACE</small></span>
        </a>
        <p className="nav-caption">ESPACE DE TRAVAIL</p>
        <nav aria-label="Navigation principale">
          {navigation.map((item) => (
            <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.id)}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="profile-avatar">M</span>
          <span><strong>Administration</strong><small>Compte de démonstration</small></span>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div><span className="breadcrumb">SDMON / {activeLabel}</span><h1>{active === 'overview' ? 'Tableau de bord' : moduleDetails[active]?.[0]}</h1></div>
          <span className="dev-tag"><i /> PRÉVISUALISATION</span>
        </header>

        {active === 'overview' ? (
          <>
            <section className="welcome-panel">
              <div><p className="eyebrow">GESTION INTÉGRÉE SDMON</p><h2>Bonjour, bienvenue dans votre espace.</h2><p>Retrouvez progressivement vos opérations commerciales et administratives dans un seul outil.</p></div>
              <div className="welcome-mark">S</div>
            </section>
            <section className="metrics">
              <article><span>Clients</span><strong>—</strong><small>En attente de connexion</small></article>
              <article><span>Employés actifs</span><strong>—</strong><small>En attente de connexion</small></article>
              <article><span>Demandes ouvertes</span><strong>—</strong><small>En attente de connexion</small></article>
              <article><span>Factures émises</span><strong>—</strong><small>En attente de connexion</small></article>
            </section>
            <section className="content-grid">
              <article className="panel">
                <div className="panel-heading"><div><h3>Modules de gestion</h3><p>Accès aux principales fonctions SDMON</p></div><span className="soft-label">7 modules</span></div>
                <div className="quick-links">
                  {navigation.slice(1).map((item) => (
                    <button key={item.id} onClick={() => setActive(item.id)}><span>{item.icon}</span><strong>{item.label}</strong><b>›</b></button>
                  ))}
                </div>
              </article>
              <article className="panel system-panel">
                <h3>État de la plateforme</h3>
                <p>Interface isolée du site public. Les données réelles ne sont pas encore connectées.</p>
                <div className="system-line"><span>Interface</span><strong className="ok">Initialisée</strong></div>
                <div className="system-line"><span>API</span><strong>À configurer</strong></div>
                <div className="system-line"><span>Base de données</span><strong>En attente de validation</strong></div>
                <div className="system-line"><span>Authentification</span><strong>À configurer</strong></div>
              </article>
            </section>
          </>
        ) : (
          <section className="module-placeholder">
            <div className="placeholder-icon">{navigation.find((item) => item.id === active)?.icon}</div>
            <p className="eyebrow">MODULE SDMON</p>
            <h2>{moduleDetails[active]?.[0]}</h2>
            <p>{moduleDetails[active]?.[1]}</p>
            <span className="soft-label">Structure préparée · Développement en cours</span>
            <button className="back-button" onClick={() => setActive('overview')}>Retour au tableau de bord</button>
          </section>
        )}

        <footer className="workspace-footer"><span>SDMON · Développements, maintenances et outils numériques</span><span>API cible : {apiUrl}</span></footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
