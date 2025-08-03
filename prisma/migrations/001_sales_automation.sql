-- Sales Automation Database Schema
-- Adiciona todas as tabelas necessárias para as 10 funcionalidades

-- 1. Sistema de Follow-up Automático
CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL, -- 'lead_created', 'visit_scheduled', etc
  active BOOLEAN DEFAULT true,
  company_id VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_up_steps (
  id VARCHAR(30) PRIMARY KEY,
  sequence_id VARCHAR(30) NOT NULL,
  step_order INTEGER NOT NULL,
  delay_days INTEGER NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  action_type VARCHAR(50) NOT NULL, -- 'email', 'whatsapp', 'call_reminder'
  template_subject VARCHAR(255),
  template_content TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sequence_id) REFERENCES follow_up_sequences(id)
);

CREATE TABLE IF NOT EXISTS follow_up_executions (
  id VARCHAR(30) PRIMARY KEY,
  lead_id VARCHAR(30) NOT NULL,
  step_id VARCHAR(30) NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  executed_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'executed', 'failed', 'cancelled'
  result TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (step_id) REFERENCES follow_up_steps(id)
);

-- 2. Lead Scoring Inteligente
CREATE TABLE IF NOT EXISTS lead_scores (
  id VARCHAR(30) PRIMARY KEY,
  lead_id VARCHAR(30) NOT NULL,
  score_value INTEGER NOT NULL,
  factors JSON, -- Fatores que contribuíram para o score
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id VARCHAR(30) PRIMARY KEY,
  lead_id VARCHAR(30) NOT NULL,
  activity_type VARCHAR(100) NOT NULL, -- 'email_opened', 'whatsapp_replied', 'property_viewed'
  activity_data JSON,
  score_impact INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sistema de Pipeline Visual (Kanban)
CREATE TABLE IF NOT EXISTS sales_stages (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  company_id VARCHAR(30) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_opportunities (
  id VARCHAR(30) PRIMARY KEY,
  lead_id VARCHAR(30) NOT NULL,
  property_id VARCHAR(30),
  stage_id VARCHAR(30) NOT NULL,
  value DECIMAL(12,2),
  probability INTEGER DEFAULT 50, -- 0-100%
  expected_close_date DATE,
  notes TEXT,
  company_id VARCHAR(30) NOT NULL,
  user_id VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES sales_stages(id)
);

-- 4. WhatsApp Business Integration
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id VARCHAR(30) PRIMARY KEY,
  lead_id VARCHAR(30) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  session_status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'blocked'
  last_message_at TIMESTAMP,
  company_id VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id VARCHAR(30) PRIMARY KEY,
  session_id VARCHAR(30) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'document', 'template'
  content TEXT,
  direction VARCHAR(10) NOT NULL, -- 'sent', 'received'
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  template_name VARCHAR(255),
  media_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES whatsapp_sessions(id)
);

-- 5. Simulador Financeiro
CREATE TABLE IF NOT EXISTS financing_simulations (
  id VARCHAR(30) PRIMARY KEY,
  lead_id VARCHAR(30) NOT NULL,
  property_id VARCHAR(30) NOT NULL,
  property_value DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  loan_term_months INTEGER NOT NULL,
  monthly_payment DECIMAL(10,2) NOT NULL,
  total_interest DECIMAL(12,2) NOT NULL,
  bank_name VARCHAR(255),
  approved BOOLEAN DEFAULT false,
  approval_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tours Virtuais 360°
CREATE TABLE IF NOT EXISTS virtual_tours (
  id VARCHAR(30) PRIMARY KEY,
  property_id VARCHAR(30) NOT NULL,
  tour_name VARCHAR(255) NOT NULL,
  tour_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  tour_type VARCHAR(50) DEFAULT '360', -- '360', 'video', 'interactive'
  view_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tour_views (
  id VARCHAR(30) PRIMARY KEY,
  tour_id VARCHAR(30) NOT NULL,
  lead_id VARCHAR(30),
  ip_address VARCHAR(45),
  user_agent TEXT,
  view_duration INTEGER, -- em segundos
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES virtual_tours(id)
);

-- 7. Análise Preditiva
CREATE TABLE IF NOT EXISTS prediction_models (
  id VARCHAR(30) PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  model_type VARCHAR(100) NOT NULL, -- 'lead_conversion', 'price_prediction', 'time_to_close'
  model_data JSON, -- Parâmetros do modelo ML
  accuracy DECIMAL(5,2),
  last_trained TIMESTAMP,
  active BOOLEAN DEFAULT true,
  company_id VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS predictions (
  id VARCHAR(30) PRIMARY KEY,
  model_id VARCHAR(30) NOT NULL,
  target_id VARCHAR(30) NOT NULL, -- lead_id ou property_id
  target_type VARCHAR(50) NOT NULL, -- 'lead', 'property'
  prediction_value DECIMAL(10,2),
  confidence DECIMAL(5,2),
  factors JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_id) REFERENCES prediction_models(id)
);

-- 8. Automação de Documentos
CREATE TABLE IF NOT EXISTS document_templates (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- 'contract', 'proposal', 'receipt'
  template_content TEXT NOT NULL, -- HTML com placeholders
  variables JSON, -- Lista de variáveis disponíveis
  company_id VARCHAR(30) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS generated_documents (
  id VARCHAR(30) PRIMARY KEY,
  template_id VARCHAR(30) NOT NULL,
  lead_id VARCHAR(30),
  property_id VARCHAR(30),
  document_url VARCHAR(500),
  document_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'signed', 'rejected'
  variables_used JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES document_templates(id)
);

-- 9. Geolocalização e Mapas
CREATE TABLE IF NOT EXISTS location_data (
  id VARCHAR(30) PRIMARY KEY,
  property_id VARCHAR(30) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address_formatted TEXT,
  neighborhood VARCHAR(255),
  nearby_points JSON, -- Escolas, hospitais, etc
  walkability_score INTEGER,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Relatórios e Analytics
CREATE TABLE IF NOT EXISTS conversion_metrics (
  id VARCHAR(30) PRIMARY KEY,
  metric_date DATE NOT NULL,
  company_id VARCHAR(30) NOT NULL,
  user_id VARCHAR(30),
  source VARCHAR(100), -- 'website', 'facebook', 'google'
  leads_generated INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  average_deal_value DECIMAL(12,2),
  total_revenue DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_follow_up_executions_scheduled ON follow_up_executions(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_sales_opportunities_stage ON sales_opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_lead ON whatsapp_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_predictions_target ON predictions(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_location_data_property ON location_data(property_id);
CREATE INDEX IF NOT EXISTS idx_conversion_metrics_date ON conversion_metrics(metric_date, company_id);