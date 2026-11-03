import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, apiBase, authClient } from './api.js';
import './styles.css';

const navigation = [
  { id: 'overview', label: 'Vue générale', roles: ['admin', 'employee', 'client'] },
  { id: 'clients', label: 'Clients', roles: ['admin', 'employee'] },
  { id: 'employees', label: 'Employés', roles: ['admin'] },
  { id: 'services', label: 'Services', roles: ['admin', 'employee', 'client'] },
  { id: 'requests', label: 'Demandes', roles: ['admin', 'employee', 'client'] },
  { id: 'quotes', label: 'Devis', roles: ['admin', 'employee', 'client'] },
  { id: 'invoices', label: 'Factures', roles: ['admin', 'employee', 'client'] },
  { id: 'delivery-notes', label: 'Bons de livraison', roles: ['admin', 'employee', 'client'] },
  { id: 'payments', label: 'Paiements', roles: ['admin', 'employee', 'client'] },\n  { id: 'reports', label: 'Rapports financiers', roles: ['admin'] },
];

const resources = {
  clients: { title: 'Clients', path: '/clients', columns: ['client_number', 'company_name', 'contact_name', 'email', 'phone'] },
  employees: { title: 'Employés', path: '/employees', columns: ['employee_number', 'full_name', 'email', 'job_title', 'employment_status'] },
  services: { title: 'Catalogue des services', path: '/services', columns: ['code', 'name_fr', 'unit', 'default_unit_price', 'currency'] },
  requests: { title: 'Demandes de service', path: '/requests', columns: ['request_number', 'title', 'service_name', 'status', 'requested_at'] },
  quotes: { title: 'Devis', path: '/quotes', columns: ['quote_number', 'contact_name', 'status', 'issue_date', 'total', 'currency'] },
  invoices: { title: 'Factures', path: '/invoices', columns: ['invoice_number', 'contact_name', 'status', 'issue_date', 'total', 'amount_paid', 'currency'] },
  'delivery-notes': { title: 'Bons de livraison', path: '/delivery-notes', columns: ['delivery_number', 'contact_name', 'status', 'delivery_date', 'invoice_id'] },
  payments: { title: 'Paiements', path: '/payments', columns: ['payment_number', 'invoice_number', 'amount', 'currency', 'payment_method', 'payment_date'] },
};

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = mode === 'signup'
        ? await authClient.signUp.email({ email: form.email, password: form.password, name: form.name })
        : await authClient.signIn.email({ email: form.email, password: form.password });
      if (result.error) throw new Error(result.error.message || 'Échec de connexion');
      if (mode === 'signup') {
        await api('/auth/register-client', { method: 'POST', body: JSON.stringify({ fullName: form.name, email: form.email, companyName: form.companyName, phone: form.phone }) });
      }
      await onAuthenticated();
    } catch (err) { setError(err.message || 'Une erreur est survenue'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <div className="brand auth-brand"><span className="brand-mark">S</span><span>SDMON <small>BUSINESS SPACE</small></span></div>
    <p className="eyebrow">ESPACE SÉCURISÉ</p><h1>{mode === 'signin' ? 'Connexion' : 'Créer un compte client'}</h1>
    <p className="auth-subtitle">Accédez à vos services et à votre espace de gestion SDMON.</p>
    {mode === 'signup' && <><label>Nom complet<input required value={form.name} onChange={change('name')} autoComplete="name" /></label><label>Entreprise (facultatif)<input value={form.companyName} onChange={change('companyName')} /></label><label>Téléphone<input value={form.phone} onChange={change('phone')} /></label></>}
    <label>Adresse e-mail<input required type="email" value={form.email} onChange={change('email')} autoComplete="email" /></label>
    <label>Mot de passe<input required minLength="8" type="password" value={form.password} onChange={change('password')} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} /></label>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="primary-button" disabled={busy}>{busy ? 'Veuillez patienter…' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}</button>
    <button type="button" className="text-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'Créer un compte client' : 'Déjà inscrit ? Se connecter'}</button>
  </form></main>;
}

function DataTable({ rows, columns }) {
  if (!rows?.length) return <div className="empty-state">Aucune donnée disponible pour le moment.</div>;
  const label = (key) => key.replaceAll('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  return <div className="table-wrap"><table><thead><tr>{columns.map((key) => <th key={key}>{label(key)}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.id || index}>{columns.map((key) => <td key={key}>{row[key] == null ? '—' : String(row[key])}</td>)}</tr>)}</tbody></table></div>;
}

function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [active, setActive] = useState('overview');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);\n  const [reportData, setReportData] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestForm, setRequestForm] = useState({ title: '', description: '', serviceId: '' });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: '', amount: '', paymentMethod: 'cash', paymentDate: new Date().toISOString().slice(0, 10), reference: '' });

  const loadProfile = useCallback(async () => {
    const session = await authClient.getSession();
    const user = session.data?.user || session.data?.session?.user || null;
    setSessionUser(user);
    if (!user) { setProfile(null); return; }
    const linked = await api('/auth/unlinked-identity');
    if (!linked.data.linked) { setProfile({ unlinked: true, email: linked.data.email || user.email, name: linked.data.name || user.name, bootstrapEligible: linked.data.bootstrapEligible }); return; }
    const me = await api('/auth/me');
    setProfile(me.data);
  }, []);

  useEffect(() => { loadProfile().catch((err) => setError(err.message)); }, [loadProfile]);

  const visibleNavigation = useMemo(() => navigation.filter((item) => !profile || item.roles.includes(profile.role)), [profile]);

  const loadModule = useCallback(async () => {
    if (!profile || profile.unlinked) return;
    setLoading(true); setError('');
    try {
      if (active === 'overview') {
        if (profile.role === 'admin') setSummary(await api('/dashboard/summary'));
        else setSummary(null);
        setRows([]);
      } else {
        const resource = resources[active];
        if (!resource) return;
        const result = await api(resource.path);
        setRows(result.data || []);
      }
      if (active === 'services' || active === 'overview') {
        const result = await api('/services'); setServices(result.data || []);
      }
    } catch (err) { setError(err.message); setRows([]); }
    finally { setLoading(false); }
  }, [active, profile]);

  useEffect(() => { loadModule(); }, [loadModule]);

  async function signOut() {
    await authClient.signOut();
    setSessionUser(null); setProfile(null); setSummary(null); setRows([]);
  }

  async function submitRequest(event) {
    event.preventDefault(); setError('');
    try {
      await api('/requests', { method: 'POST', body: JSON.stringify(requestForm) });
      setRequestForm({ title: '', description: '', serviceId: '' }); await loadModule();
    } catch (err) { setError(err.message); }
  }


  async function submitModule(event) {
    event.preventDefault(); setError('');
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (active === 'services') {
        await api('/services', { method: 'POST', body: JSON.stringify({ code: form.code, nameFr: form.nameFr, unit: form.unit || 'forfait', unitPrice: Number(form.unitPrice), currency: form.currency }) });
      } else if (active === 'quotes') {
        await api('/quotes', { method: 'POST', body: JSON.stringify({ clientId: form.clientId, requestId: form.requestId || null, currency: form.currency, validUntil: form.validUntil || null, items: [{ description: form.description, quantity: Number(form.quantity), unitPrice: Number(form.unitPrice), taxRate: Number(form.taxRate || 0) }] }) });
      } else if (active === 'invoices') {
        await api('/invoices', { method: 'POST', body: JSON.stringify({ quoteId: form.quoteId, dueDate: form.dueDate || null }) });
      } else if (active === 'delivery-notes') {
        await api('/delivery-notes', { method: 'POST', body: JSON.stringify({ clientId: form.clientId, requestId: form.requestId || null, invoiceId: form.invoiceId || null, deliveredTo: form.deliveredTo || null, items: [{ description: form.description, quantity: Number(form.quantity), unit: form.unit || 'unité' }] }) });
      } else if (active === 'requests') {
        await api(`/requests/${form.requestId}/status`, { method: 'PATCH', body: JSON.stringify({ status: form.status, assignedEmployeeId: form.assignedEmployeeId || undefined }) });
      } else if (active === 'employees') {
        await api('/auth/users', { method: 'POST', body: JSON.stringify({ authSubject: form.authSubject, email: form.email, fullName: form.fullName, role: form.role, phone: form.phone, jobTitle: form.jobTitle }) });
      }
      await loadModule();
    } catch (err) { setError(err.message); }
  }
\n  async function submitPayment(event) {
    event.preventDefault(); setError('');
    try {
      await api('/payments', { method: 'POST', body: JSON.stringify(paymentForm) });
      setPaymentForm({ invoiceId: '', amount: '', paymentMethod: 'cash', paymentDate: new Date().toISOString().slice(0, 10), reference: '' });
      await loadModule();
    } catch (err) { setError(err.message); }
  }

  if (!sessionUser) return <AuthScreen onAuthenticated={loadProfile} />;
  if (!profile) return <main className="auth-page"><div className="auth-card">Chargement du profil…</div></main>;
  if (profile.unlinked) return <main className="auth-page"><section className="auth-card"><h1>Compte non activé</h1><p>Votre identité est authentifiée, mais aucun rôle SDMON ne lui est attribué.</p><p>{profile.email}</p>{profile.bootstrapEligible && <button className="primary-button" onClick={async () => { try { await api('/auth/bootstrap-admin', { method: 'POST', body: JSON.stringify({ fullName: profile.name || profile.email }) }); await loadProfile(); } catch (err) { setError(err.message); } }}>Configurer le premier compte administrateur</button>}{error && <p className="error-message">{error}</p>}<button className="text-button" onClick={signOut}>Se déconnecter</button></section></main>;

  const activeLabel = visibleNavigation.find((item) => item.id === active)?.label || 'Vue générale';
  const resource = resources[active];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="SDMON"><span className="brand-mark">S</span><span>SDMON <small>BUSINESS SPACE</small></span></a>
      <p className="nav-caption">ESPACE DE TRAVAIL</p>
      <nav aria-label="Navigation principale">{visibleNavigation.map((item) => <button key={item.id} className={active === item.id ? 'nav-item active' : 'nav-item'} onClick={() => setActive(item.id)}>{item.label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="profile-avatar">{(profile.fullName || profile.email || 'U').slice(0, 1).toUpperCase()}</span><span><strong>{profile.fullName || profile.email}</strong><small>{profile.role}</small></span><button className="logout-button" onClick={signOut}>Quitter</button></div>
    </aside>
    <main className="workspace">
      <header className="workspace-header"><div><span className="breadcrumb">SDMON / {activeLabel}</span><h1>{active === 'overview' ? 'Tableau de bord' : resource?.title}</h1></div><span className="dev-tag"><i /> CONNECTÉ</span></header>
      {error && <p className="error-message page-error" role="alert">{error}</p>}
      {active === 'reports' && profile.role === 'admin' ? <section className="panel"><div className="panel-heading"><div><h3>Rapports financiers</h3><p>Les montants sont ventilés par devise ; aucune conversion DJF/USD n'est supposée.</p></div><button className="secondary-button" onClick={loadModule}>Actualiser</button></div><h4>Facturation par devise</h4><DataTable rows={reportData?.invoiced || []} columns={['currency','total']} /><h4>Encaissements par devise</h4><DataTable rows={reportData?.collected || []} columns={['currency','total']} /><h4>Soldes clients restants</h4><DataTable rows={reportData?.outstanding || []} columns={['currency','total']} /><h4>Encaissements mensuels</h4><DataTable rows={reportData?.monthlyCollections || []} columns={['month','currency','total']} /></section> : null}\n      {active === 'overview' ? <><section className="welcome-panel"><div><p className="eyebrow">GESTION INTÉGRÉE SDMON</p><h2>Bienvenue, {profile.fullName || 'utilisateur'}.</h2><p>Votre espace SDMON est connecté à l'API de gestion.</p></div><div className="welcome-mark">S</div></section>
        {profile.role === 'admin' && <section className="metrics">
          <article><span>Clients</span><strong>{summary?.clients ?? '—'}</strong><small>Comptes clients</small></article>
          <article><span>Employés actifs</span><strong>{summary?.activeEmployees ?? '—'}</strong><small>Effectif actif</small></article>
          <article><span>Demandes ouvertes</span><strong>{summary?.openRequests ?? '—'}</strong><small>À traiter</small></article>
          <article><span>Factures émises</span><strong>{summary?.issuedInvoices ?? '—'}</strong><small>Hors brouillons</small></article>
        </section>}
        <section className="panel"><div className="panel-heading"><div><h3>Accès rapides</h3><p>Modules autorisés pour votre rôle : {profile.role}</p></div></div><div className="quick-links">{visibleNavigation.filter((item) => item.id !== 'overview').map((item) => <button key={item.id} onClick={() => setActive(item.id)}><strong>{item.label}</strong><b>›</b></button>)}</div></section>
      </> : <section className="panel">
        <div className="panel-heading"><div><h3>{resource?.title}</h3><p>Données chargées depuis la base SDMON</p></div><button className="secondary-button" onClick={loadModule}>Actualiser</button></div>

        {['admin', 'employee'].includes(profile.role) && ['services', 'quotes', 'invoices', 'delivery-notes', 'requests'].includes(active) && <form className="inline-form" onSubmit={submitModule}>
          <h3>{active === 'services' ? 'Ajouter un service' : active === 'quotes' ? 'Créer un devis' : active === 'invoices' ? 'Émettre une facture depuis un devis accepté' : active === 'delivery-notes' ? 'Créer un bon de livraison' : 'Mettre à jour une demande'}</h3>
          {active === 'services' && <><label>Code<input name="code" required placeholder="WEB-001" /></label><label>Nom du service<input name="nameFr" required /></label><label>Prix unitaire<input name="unitPrice" type="number" min="0" step="0.01" required /></label><label>Devise<select name="currency"><option>DJF</option><option>USD</option></select></label><label>Unité<input name="unit" defaultValue="forfait" /></label></>}
          {active === 'quotes' && <><label>ID client<input name="clientId" required /></label><label>ID demande (facultatif)<input name="requestId" /></label><label>Description<input name="description" required /></label><label>Quantité<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label><label>Prix unitaire<input name="unitPrice" type="number" min="0" step="0.01" required /></label><label>Taxe (%)<input name="taxRate" type="number" min="0" max="100" step="0.01" defaultValue="0" /></label><label>Devise<select name="currency"><option>DJF</option><option>USD</option></select></label><label>Valide jusqu'au<input name="validUntil" type="date" /></label></>}
          {active === 'invoices' && <><label>ID du devis accepté<input name="quoteId" required /></label><label>Date d'échéance<input name="dueDate" type="date" /></label></>}
          {active === 'delivery-notes' && <><label>ID client<input name="clientId" required /></label><label>ID demande<input name="requestId" /></label><label>ID facture<input name="invoiceId" /></label><label>Destinataire<input name="deliveredTo" /></label><label>Description<input name="description" required /></label><label>Quantité<input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label><label>Unité<input name="unit" defaultValue="unité" /></label></>}
          {active === 'requests' && <><label>ID demande<input name="requestId" required /></label><label>Nouveau statut<select name="status"><option value="reviewing">En examen</option><option value="quoted">Devis préparé</option><option value="approved">Approuvée</option><option value="in_progress">En cours</option><option value="completed">Terminée</option><option value="rejected">Rejetée</option><option value="cancelled">Annulée</option></select></label><label>ID employé à affecter (admin)<input name="assignedEmployeeId" placeholder="UUID facultatif" /></label></>}
          <button className="primary-button">Enregistrer</button>
        </form>}
        {active === 'employees' && profile.role === 'admin' && <form className="inline-form" onSubmit={submitModule}><h3>Associer un compte Neon Auth à un rôle SDMON</h3><p>L'utilisateur doit d'abord avoir créé son compte Neon Auth. Renseignez son identifiant de sujet (sub) vérifié.</p><label>Auth subject<input name="authSubject" required /></label><label>E-mail<input name="email" type="email" required /></label><label>Nom complet<input name="fullName" required /></label><label>Rôle<select name="role"><option value="employee">Employé</option><option value="client">Client</option></select></label><label>Téléphone<input name="phone" /></label><label>Fonction<input name="jobTitle" /></label><button className="primary-button">Créer le profil</button></form>}
\n        {active === 'requests' && profile.role === 'client' && <form className="inline-form" onSubmit={submitRequest}><h3>Nouvelle demande</h3><label>Titre<input required minLength="3" value={requestForm.title} onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })} /></label><label>Service<select value={requestForm.serviceId} onChange={(e) => setRequestForm({ ...requestForm, serviceId: e.target.value })}><option value="">Non précisé</option>{services.map((s) => <option key={s.id} value={s.id}>{s.name_fr}</option>)}</select></label><label>Description<textarea value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} /></label><button className="primary-button">Envoyer la demande</button></form>}
        {active === 'payments' && ['admin', 'employee'].includes(profile.role) && <form className="inline-form" onSubmit={submitPayment}><h3>Enregistrer un paiement</h3><p>Le paiement est rapproché d'une facture existante ; le dépassement du solde est refusé par l'API.</p><label>ID de facture<input required value={paymentForm.invoiceId} onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })} /></label><label>Montant<input required type="number" min="0.01" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} /></label><label>Méthode<select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}><option value="cash">Espèces</option><option value="bank_transfer">Virement</option><option value="cheque">Chèque</option><option value="mobile_money">Mobile money</option><option value="other">Autre</option></select></label><label>Date<input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} /></label><label>Référence<input value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} /></label><button className="primary-button">Enregistrer</button></form>}
        {loading ? <div className="empty-state">Chargement…</div> : <DataTable rows={rows} columns={resource?.columns || []} />}
      </section>}
      <footer className="workspace-footer"><span>SDMON · Développements, maintenances et outils numériques</span><span>API : {apiBase}</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
