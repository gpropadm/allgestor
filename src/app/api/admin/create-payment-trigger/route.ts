import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isUserAdmin } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Verificar se é admin
    const userIsAdmin = await isUserAdmin(user.id)
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Acesso negado. Apenas admins podem executar esta ação.' }, { status: 403 })
    }
    
    console.log('🔧 Criando trigger para geração automática de pagamentos...')
    
    // SQL do trigger
    const triggerSQL = `
-- Função que gera os pagamentos
CREATE OR REPLACE FUNCTION generate_payments_for_new_contract()
RETURNS TRIGGER AS $$
DECLARE
    payment_date DATE;
    end_date DATE;
    current_month INTEGER;
    current_year INTEGER;
    payment_month INTEGER;
    payment_year INTEGER;
    payment_status TEXT;
    day_of_month INTEGER;
    payment_id TEXT;
BEGIN
    -- Só gerar pagamentos para contratos ACTIVE
    IF NEW.status != 'ACTIVE' THEN
        RETURN NEW;
    END IF;
    
    -- Verificar se já existem pagamentos para este contrato
    IF EXISTS (SELECT 1 FROM "Payment" WHERE "contractId" = NEW.id) THEN
        RETURN NEW;
    END IF;
    
    -- Obter data atual
    current_month := EXTRACT(MONTH FROM CURRENT_DATE);
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Configurar variáveis
    payment_date := NEW."startDate";
    end_date := NEW."endDate";
    day_of_month := EXTRACT(DAY FROM NEW."startDate");
    
    -- Ajustar para o dia correto do mês
    payment_date := DATE(EXTRACT(YEAR FROM payment_date) || '-' || 
                         LPAD(EXTRACT(MONTH FROM payment_date)::text, 2, '0') || '-' || 
                         LPAD(day_of_month::text, 2, '0'));
    
    -- Se a data de pagamento é anterior à data de início, usar próximo mês
    IF payment_date < NEW."startDate" THEN
        payment_date := payment_date + INTERVAL '1 month';
    END IF;
    
    -- Gerar pagamentos mensais até o fim do contrato
    WHILE payment_date <= end_date LOOP
        payment_month := EXTRACT(MONTH FROM payment_date);
        payment_year := EXTRACT(YEAR FROM payment_date);
        
        -- Determinar status baseado na data atual
        IF payment_year < current_year OR 
           (payment_year = current_year AND payment_month < current_month) THEN
            payment_status := 'OVERDUE';
        ELSE
            payment_status := 'PENDING';
        END IF;
        
        -- Gerar ID único simples
        payment_id := 'pay_' || extract(epoch from now())::bigint::text || '_' || floor(random() * 10000)::text;
        
        -- Inserir o pagamento
        INSERT INTO "Payment" (
            id,
            "contractId",
            amount,
            "dueDate",
            status,
            "createdAt",
            "updatedAt"
        ) VALUES (
            payment_id,
            NEW.id,
            NEW."rentAmount",
            payment_date,
            payment_status,
            NOW(),
            NOW()
        );
        
        -- Próximo mês
        payment_date := payment_date + INTERVAL '1 month';
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_generate_payments ON "Contract";

-- Criar o trigger
CREATE TRIGGER trigger_generate_payments
    AFTER INSERT ON "Contract"
    FOR EACH ROW
    EXECUTE FUNCTION generate_payments_for_new_contract();
    `
    
    // Executar o SQL
    await prisma.$executeRawUnsafe(triggerSQL)
    
    console.log('✅ Trigger criado com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Trigger de pagamentos criado com sucesso! Novos contratos irão gerar pagamentos automaticamente.',
      details: 'O trigger será executado automaticamente sempre que um novo contrato for criado.'
    })
    
  } catch (error) {
    console.error('❌ Erro ao criar trigger:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: 'Verifique se o banco PostgreSQL suporta triggers e funções.'
    }, { status: 500 })
  }
}