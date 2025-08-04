-- Criar tabela de assistentes IA
CREATE TABLE ai_assistants (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    personality TEXT,
    speciality VARCHAR(200),
    system_prompt TEXT NOT NULL,
    context_file_path VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    
    INDEX idx_ai_assistants_user (user_id),
    INDEX idx_ai_assistants_company (company_id),
    INDEX idx_ai_assistants_active (is_active)
);

-- Criar tabela de conversas com assistentes
CREATE TABLE ai_conversations (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    assistant_id VARCHAR(36) NOT NULL,
    title VARCHAR(200),
    context_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE CASCADE,
    
    INDEX idx_ai_conversations_user (user_id),
    INDEX idx_ai_conversations_assistant (assistant_id)
);

-- Criar tabela de mensagens das conversas
CREATE TABLE ai_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id VARCHAR(36) NOT NULL,
    type ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    mcp_data JSON,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
    
    INDEX idx_ai_messages_conversation (conversation_id),
    INDEX idx_ai_messages_created (created_at)
);

-- Inserir assistentes padrão para todas as empresas existentes
INSERT INTO ai_assistants (user_id, company_id, name, role, personality, speciality, system_prompt, is_primary) 
SELECT 
    u.id,
    u.company_id,
    'SOFIA',
    'Especialista em Vendas',
    'Persuasiva, focada em resultados, estratégica',
    'Leads, pipeline, oportunidades, argumentos de venda',
    'Você é SOFIA, especialista EXCLUSIVAMENTE em vendas imobiliárias. Você analisa leads, identifica oportunidades quentes, sugere estratégias de venda e gera argumentos personalizados. Seja sempre otimista, focada em resultados e use dados do CRM para insights precisos.',
    true
FROM users u 
WHERE u.company_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM ai_assistants a 
    WHERE a.user_id = u.id AND a.name = 'SOFIA'
);