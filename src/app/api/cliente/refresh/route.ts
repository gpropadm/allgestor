import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'ID do contrato é obrigatório' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 Atualizando dados do contrato:', contractId);

    // Buscar contrato com dados atualizados
    const contract = await prisma.contract.findUnique({
      where: {
        id: contractId,
        status: 'ACTIVE'
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        tenant: {
          select: {
            name: true,
            phone: true,
            document: true
          }
        },
        payments: {
          orderBy: {
            dueDate: 'desc'
          }
        }
      }
    });

    if (!contract) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Contrato não encontrado ou inativo' 
        },
        { status: 404 }
      );
    }

    // Formatar dados para o cliente
    const clientData = {
      id: contract.id,
      property: {
        title: contract.property.title,
        address: contract.property.address,
        propertyType: contract.property.propertyType,
        owner: contract.property.owner
      },
      rentAmount: contract.rentAmount,
      startDate: contract.startDate.toISOString(),
      endDate: contract.endDate.toISOString(),
      tenant: contract.tenant,
      payments: contract.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        status: payment.status,
        boletoUrl: payment.boletoUrl,
        paidDate: payment.paidDate ? payment.paidDate.toISOString() : null,
        paymentMethod: payment.paymentMethod
      }))
    };

    console.log('✅ Dados atualizados:', {
      contractId: contract.id,
      paymentsCount: contract.payments.length
    });

    return NextResponse.json({
      success: true,
      contract: clientData
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar dados do cliente:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}