-- SDMON business application schema.
-- Draft migration: review and apply only to an isolated development branch.
-- Authentication identities are supplied by Neon Managed Auth; passwords are never stored here.

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'employee', 'client')),
  is_active boolean NOT NULL DEFAULT true,
  preferred_language text NOT NULL DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE RESTRICT,
  employee_number text UNIQUE,
  job_title text,
  phone text,
  start_date date,
  employment_status text NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active', 'inactive', 'on_leave')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES app_users(id) ON DELETE RESTRICT,
  client_number text UNIQUE,
  company_name text,
  contact_name text NOT NULL,
  email text,
  phone text,
  address text,
  tax_identifier text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_fr text NOT NULL,
  name_en text,
  description_fr text,
  description_en text,
  unit text NOT NULL DEFAULT 'forfait',
  default_unit_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (default_unit_price >= 0),
  currency char(3) NOT NULL DEFAULT 'DJF' CHECK (currency IN ('DJF', 'USD')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  assigned_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewing', 'quoted', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  currency char(3) NOT NULL DEFAULT 'DJF' CHECK (currency IN ('DJF', 'USD')),
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  currency char(3) NOT NULL DEFAULT 'DJF' CHECK (currency IN ('DJF', 'USD')),
  subtotal numeric(14,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE delivery_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  request_id uuid REFERENCES service_requests(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'delivered', 'cancelled')),
  delivery_date date,
  delivered_to text,
  notes text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE delivery_note_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_note_id uuid NOT NULL REFERENCES delivery_notes(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'unité',
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text NOT NULL UNIQUE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'DJF' CHECK (currency IN ('DJF', 'USD')),
  payment_method text NOT NULL
    CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'mobile_money', 'other')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  received_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES app_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_users_role ON app_users(role, is_active);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_clients_contact ON clients(contact_name);
CREATE INDEX idx_requests_client_status ON service_requests(client_id, status);
CREATE INDEX idx_requests_assignee ON service_requests(assigned_employee_id, status);
CREATE INDEX idx_quotes_client_date ON quotes(client_id, issue_date DESC);
CREATE INDEX idx_invoices_client_status ON invoices(client_id, status);
CREATE INDEX idx_payments_invoice_date ON payments(invoice_id, payment_date DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
