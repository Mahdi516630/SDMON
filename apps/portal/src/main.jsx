import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="SDMON">
          <span className="brand-mark">S</span>
          <span>SDMON <small>WORKSPACE</small></span>
        </a>
        <span className="environment">ENVIRONNEMENT DE DÉVELOPPEMENT</span>
      </header>

      <section className="welcome">
        <p className="eyebrow">PLATEFORME DE GESTION</p>
        <h1>Bienvenue dans votre espace SDMON.</h1>
        <p className="intro">
          Le portail unifié pour les clients, les employés et l'administration.
          Les modules seront activés progressivement après validation de la sécurité
          et de la base de données.
        </p>
        <div className="status-card">
          <span className="status-dot" />
          <div>
            <strong>Socle applicatif initialisé</strong>
            <p>Interface isolée du site public. Aucun compte ni document réel n'est encore connecté.</p>
          </div>
        </div>
      </section>

      <section className="modules" aria-label="Modules prévus">
        <article><span>01</span><h2>Administration</h2><p>Gestion des utilisateurs, services, opérations et rapports.</p><small>À développer</small></article>
        <article><span>02</span><h2>Espace employé</h2><p>Tâches affectées, suivi des dossiers et historique d'activité.</p><small>À développer</small></article>
        <article><span>03</span><h2>Espace client</h2><p>Demandes, devis, factures et suivi des prestations.</p><small>À développer</small></article>
      </section>

      <footer>
        <span>SDMON · Développements, maintenances et outils numériques</span>
        <span>API cible : {apiUrl}</span>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
