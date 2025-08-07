import { prisma } from '@/lib/db'

export interface ComprovanteData {
  ano: number
  locador: {
    nome: string
    documento: string // CPF/CNPJ
  }
  locatario: {
    nome: string
    documento: string // CPF/CNPJ
  }
  imovel: {
    endereco: string
    numeroContrato: string
    dataContrato: string
  }
  imobiliaria: {
    nome: string
    cnpj: string
    endereco: string
    cidade: string
  }
  rendimentosPorMes: Array<{
    mes: string
    rendimentoBruto: number
    valorComissao: number
    impostoRetido: number
    valorLiquido: number
  }>
  totais: {
    rendimentoBruto: number
    valorComissao: number
    impostoRetido: number
    valorLiquido: number
  }
}

/**
 * Gera os dados do comprovante de rendimentos para um proprietário/contrato específico
 */
export async function gerarComprovanteRendimentos(
  ownerId: string, 
  contractId: string, 
  ano: number,
  userId: string
): Promise<ComprovanteData | null> {
  
  console.log(`📋 Gerando comprovante de rendimentos - Owner: ${ownerId}, Contract: ${contractId}, Ano: ${ano}`)
  
  try {
    // Buscar o contrato com todas as informações
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        userId: userId, // Verificar que pertence ao usuário
        status: 'ACTIVE'
      },
      include: {
        property: {
          include: { owner: true }
        },
        tenant: true,
        user: {
          include: { company: true }
        }
      }
    })
    
    if (!contract) {
      console.log('❌ Contrato não encontrado ou não autorizado')
      return null
    }
    
    // Buscar todos os pagamentos PAGOS do contrato no ano específico
    const startDate = new Date(ano, 0, 1) // 1º de janeiro
    const endDate = new Date(ano, 11, 31, 23, 59, 59) // 31 de dezembro
    
    // ✅ CORRIGIDO: Buscar pagamentos PAID usando dueDate se paidDate for null
    const paymentsYear = await prisma.payment.findMany({
      where: {
        contractId: contractId,
        status: 'PAID',
        OR: [
          {
            paidDate: {
              gte: startDate,
              lte: endDate
            }
          },
          {
            paidDate: null,
            dueDate: {
              gte: startDate,
              lte: endDate
            }
          }
        ]
      },
      orderBy: [
        { paidDate: 'asc' },
        { dueDate: 'asc' }
      ]
    })
    
    console.log(`💰 Encontrados ${paymentsYear.length} pagamentos pagos em ${ano}`)
    
    if (paymentsYear.length === 0) {
      console.log('❌ Nenhum pagamento pago encontrado para o ano')
      return null
    }
    
    // Agrupar pagamentos por mês
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    
    const rendimentosPorMes = meses.map((nomeDoMes, index) => {
      const pagamentosDoMes = paymentsYear.filter(payment => {
        // Usar paidDate se existir, senão usar dueDate
        const dataReferencia = payment.paidDate || payment.dueDate
        const mesPagamento = dataReferencia.getMonth()
        return mesPagamento === index
      })
      
      const rendimentoBruto = pagamentosDoMes.reduce((total, payment) => total + payment.amount, 0)
      const valorComissao = rendimentoBruto * (contract.administrationFeePercentage / 100) // Taxa da imobiliária
      const impostoRetido = 0 // Normalmente não há retenção na fonte para PF
      const valorLiquido = rendimentoBruto - valorComissao
      
      return {
        mes: nomeDoMes,
        rendimentoBruto,
        valorComissao,
        impostoRetido,
        valorLiquido
      }
    })
    
    // Calcular totais
    const totais = rendimentosPorMes.reduce(
      (acc, mes) => ({
        rendimentoBruto: acc.rendimentoBruto + mes.rendimentoBruto,
        valorComissao: acc.valorComissao + mes.valorComissao,
        impostoRetido: acc.impostoRetido + mes.impostoRetido,
        valorLiquido: acc.valorLiquido + mes.valorLiquido
      }),
      { rendimentoBruto: 0, valorComissao: 0, impostoRetido: 0, valorLiquido: 0 }
    )
    
    const comprovanteData: ComprovanteData = {
      ano,
      locador: {
        nome: contract.property.owner.name,
        documento: contract.property.owner.document || 'Não informado'
      },
      locatario: {
        nome: contract.tenant.name,
        documento: contract.tenant.document || 'Não informado'
      },
      imovel: {
        endereco: contract.property.address || 'Endereço não informado',
        numeroContrato: contract.contractNumber || contract.id,
        dataContrato: contract.startDate.toLocaleDateString('pt-BR')
      },
      imobiliaria: {
        nome: contract.user.company?.tradeName || contract.user.company?.name || 'Imobiliária',
        cnpj: contract.user.company?.document || 'CNPJ não informado',
        endereco: contract.user.company?.address || 'Endereço não informado',
        cidade: contract.user.company?.city || 'Cidade não informada'
      },
      rendimentosPorMes,
      totais
    }
    
    console.log(`✅ Comprovante gerado - Total anual: R$ ${totais.valorLiquido.toFixed(2)}`)
    return comprovanteData
    
  } catch (error) {
    console.error('❌ Erro ao gerar comprovante:', error)
    return null
  }
}

/**
 * Gera HTML do comprovante para conversão em PDF
 */
export function gerarHTMLComprovante(data: ComprovanteData): string {
  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Comprovante Anual de Rendimentos</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            margin: 20mm; 
            line-height: 1.4;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .title { 
            font-size: 16pt; 
            font-weight: bold; 
            margin-bottom: 10px;
        }
        .subtitle { 
            font-size: 12pt; 
            margin-bottom: 20px;
        }
        .section { 
            margin-bottom: 20px;
        }
        .section-title { 
            font-weight: bold; 
            font-size: 11pt;
            background-color: #f0f0f0;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
        }
        .field { 
            margin-bottom: 5px;
        }
        .field-label { 
            font-weight: bold;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0;
        }
        th, td { 
            border: 1px solid #333; 
            padding: 8px; 
            text-align: left;
        }
        th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
            text-align: center;
        }
        .number { 
            text-align: right;
        }
        .total-row { 
            font-weight: bold; 
            background-color: #f9f9f9;
        }
        .signature-area {
            margin-top: 40px;
            text-align: center;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            margin: 30px auto 10px auto;
        }
        .footer {
            margin-top: 30px;
            font-size: 8pt;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">COMPROVANTE ANUAL DE RENDIMENTOS DE ALUGUÉIS</div>
        <div class="subtitle">Ano-calendário: ${data.ano}</div>
    </div>

    <div class="section">
        <div class="section-title">1. BENEFICIÁRIO DO RENDIMENTO (LOCADOR)</div>
        <div class="field"><span class="field-label">Nome/Nome Empresarial:</span> ${data.locador.nome}</div>
        <div class="field"><span class="field-label">CPF/CNPJ:</span> ${data.locador.documento}</div>
    </div>

    <div class="section">
        <div class="section-title">2. FONTE PAGADORA (LOCATÁRIO)</div>
        <div class="field"><span class="field-label">Nome/Nome Empresarial:</span> ${data.locatario.nome}</div>
        <div class="field"><span class="field-label">CPF/CNPJ:</span> ${data.locatario.documento}</div>
    </div>

    <div class="section">
        <div class="section-title">3. RENDIMENTOS (em Reais)</div>
        <table>
            <thead>
                <tr>
                    <th>Mês</th>
                    <th>Rendimento Bruto</th>
                    <th>Valor Comissão</th>
                    <th>Imposto Retido</th>
                    <th>Valor Líquido</th>
                </tr>
            </thead>
            <tbody>
                ${data.rendimentosPorMes.map(mes => `
                <tr>
                    <td>${mes.mes}</td>
                    <td class="number">${formatCurrency(mes.rendimentoBruto)}</td>
                    <td class="number">${formatCurrency(mes.valorComissao)}</td>
                    <td class="number">${formatCurrency(mes.impostoRetido)}</td>
                    <td class="number">${formatCurrency(mes.valorLiquido)}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td><strong>TOTAL</strong></td>
                    <td class="number"><strong>${formatCurrency(data.totais.rendimentoBruto)}</strong></td>
                    <td class="number"><strong>${formatCurrency(data.totais.valorComissao)}</strong></td>
                    <td class="number"><strong>${formatCurrency(data.totais.impostoRetido)}</strong></td>
                    <td class="number"><strong>${formatCurrency(data.totais.valorLiquido)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <div class="section-title">4. DADOS DO IMÓVEL</div>
        <div class="field"><span class="field-label">Contrato nº:</span> ${data.imovel.numeroContrato}</div>
        <div class="field"><span class="field-label">Data do contrato:</span> ${data.imovel.dataContrato}</div>
        <div class="field"><span class="field-label">Endereço do imóvel:</span> ${data.imovel.endereco}</div>
    </div>

    <div class="section">
        <div class="section-title">5. INFORMAÇÕES COMPLEMENTARES</div>
        <div class="field"><span class="field-label">CNPJ da administradora (Imobiliária):</span> ${data.imobiliaria.cnpj}</div>
        <div class="field"><span class="field-label">Nome da imobiliária:</span> ${data.imobiliaria.nome}</div>
        <div class="field"><span class="field-label">Endereço:</span> ${data.imobiliaria.endereco}</div>
    </div>

    <div class="section">
        <div class="section-title">6. RESPONSÁVEL PELAS INFORMAÇÕES</div>
        <div class="field"><span class="field-label">Cidade e Data:</span> ${data.imobiliaria.cidade}, ${new Date().toLocaleDateString('pt-BR')}</div>
        
        <div class="signature-area">
            <div class="signature-line"></div>
            <div>Assinatura do Responsável</div>
        </div>
    </div>

    <div class="footer">
        Este documento foi gerado automaticamente pelo sistema ${data.imobiliaria.nome} em ${new Date().toLocaleString('pt-BR')}
    </div>
</body>
</html>
  `
}