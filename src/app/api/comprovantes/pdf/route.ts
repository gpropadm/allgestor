import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { gerarComprovanteRendimentos, gerarHTMLComprovante } from '@/lib/comprovante-rendimentos'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { ownerId, contractId, ano } = await request.json()
    
    console.log('📄 POST /api/comprovantes/pdf - Gerando HTML para PDF:', { ownerId, contractId, ano })
    
    if (!ownerId || !contractId || !ano) {
      return NextResponse.json({
        error: 'Parâmetros obrigatórios: ownerId, contractId, ano'
      }, { status: 400 })
    }
    
    // Gerar os dados do comprovante
    const comprovanteData = await gerarComprovanteRendimentos(ownerId, contractId, ano, user.id)
    
    if (!comprovanteData) {
      return NextResponse.json({
        error: 'Não foi possível gerar o comprovante. Verifique se existem pagamentos pagos no ano especificado.'
      }, { status: 404 })
    }
    
    // Gerar HTML otimizado para PDF
    const html = gerarHTMLComprovanteParaPDF(comprovanteData)
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Filename': `comprovante-rendimentos-${comprovanteData.locador.nome.replace(/[^a-zA-Z0-9]/g, '-')}-${ano}.pdf`
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar HTML para PDF:', error)
    return NextResponse.json({
      error: 'Erro ao gerar comprovante para PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// HTML otimizado para conversão em PDF via browser
function gerarHTMLComprovanteParaPDF(data: any): string {
  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Comprovante Anual de Rendimentos - ${data.locador.nome} - ${data.ano}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            margin: 0; 
            line-height: 1.4;
            color: #000;
        }
        
        .header { 
            width: 100%;
            display: flex;
            margin-bottom: 5px;
            border: 2px solid #333;
            box-sizing: border-box;
        }
        
        .header-left {
            flex: 0 0 30%;
            width: 30%;
            padding: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-right: 2px solid #333;
            box-sizing: border-box;
        }
        
        .header-right {
            flex: 0 0 70%;
            width: 70%;
            padding: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            box-sizing: border-box;
            position: relative;
        }
        
        .company-name { 
            font-size: 22pt; 
            font-weight: bold; 
            color: #f63c6a;
            margin: 0;
            text-align: center;
        }
        
        .title { 
            font-size: 14pt; 
            font-weight: bold; 
            margin: 0 0 10px 0;
            line-height: 1.2;
            text-align: center;
        }
        
        .subtitle { 
            font-size: 12pt; 
            margin: 0;
            line-height: 1.2;
            text-align: right;
            position: absolute;
            bottom: 15px;
            right: 15px;
        }
        
        .section { 
            margin-bottom: 5px;
            page-break-inside: avoid;
        }
        
        .section-title { 
            font-weight: bold; 
            font-size: 11pt;
            background-color: #f0f0f0;
            padding: 8px;
            margin-bottom: 10px;
            border: 1px solid #333;
        }
        
        .section-title-no-border { 
            font-weight: bold; 
            font-size: 10pt;
            padding: 2px 0;
            margin-bottom: 0px;
            border: none;
            background: none;
        }
        
        .beneficiary-section {
            display: flex;
            border: 1px solid #333;
            margin-bottom: 0px;
            box-sizing: border-box;
            min-height: 18px;
        }
        
        .beneficiary-left {
            flex: 0 0 70%;
            width: 70%;
            padding: 1px 15px;
            border-right: 1px solid #333;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: left;
        }
        
        .beneficiary-right {
            flex: 0 0 30%;
            width: 30%;
            padding: 1px 15px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: left;
        }
        
        .field-label-small {
            font-size: 9pt;
            color: #666;
            margin: 0 0 5px 0;
            font-weight: normal;
        }
        
        .field-value {
            font-size: 11pt;
            font-weight: normal;
            margin: 0;
            color: #000;
        }
        
        .property-section {
            display: flex;
            border: 1px solid #333;
            margin-bottom: 0px;
            box-sizing: border-box;
            min-height: 18px;
        }
        
        .property-col-25 {
            flex: 0 0 25%;
            width: 25%;
            padding: 1px 15px;
            border-right: 1px solid #333;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: left;
        }
        
        .property-col-50 {
            flex: 0 0 50%;
            width: 50%;
            padding: 1px 15px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: left;
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
            margin: 2px 0 0px 0;
            page-break-inside: avoid;
        }
        
        th, td { 
            border: 1px solid #333; 
            padding: 4px; 
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
            margin-top: 15px;
            text-align: center;
            page-break-inside: avoid;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            margin: 15px auto 5px auto;
        }
        
        .footer {
            margin-top: 10px;
            font-size: 8pt;
            text-align: center;
            color: #666;
        }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
    <script>
        // Auto-print quando carregado
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</head>
<body>
    <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #f63c6a; color: white; border: none; border-radius: 5px; cursor: pointer;">
            📄 Salvar como PDF
        </button>
    </div>

    <div class="header">
        <div class="header-left">
            <div class="company-name">All Gestor</div>
        </div>
        <div class="header-right">
            <div class="title">COMPROVANTE ANUAL DE RENDIMENTOS DE ALUGUÉIS</div>
            <div class="subtitle">Ano-calendário: ${data.ano}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title-no-border">1. BENEFICIÁRIO DO RENDIMENTO (LOCADOR)</div>
        <div class="beneficiary-section">
            <div class="beneficiary-left">
                <div class="field-label-small">Nome/Nome Empresarial:</div>
                <div class="field-value">${data.locador.nome}</div>
            </div>
            <div class="beneficiary-right">
                <div class="field-label-small">CPF/CNPJ:</div>
                <div class="field-value">${data.locador.documento}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title-no-border">2. FONTE PAGADORA (LOCATÁRIO)</div>
        <div class="beneficiary-section">
            <div class="beneficiary-left">
                <div class="field-label-small">Nome/Nome Empresarial:</div>
                <div class="field-value">${data.locatario.nome}</div>
            </div>
            <div class="beneficiary-right">
                <div class="field-label-small">CPF/CNPJ:</div>
                <div class="field-value">${data.locatario.documento}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title-no-border">3. RENDIMENTOS (em Reais)</div>
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
                ${data.rendimentosPorMes.map((mes: any) => `
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
        <div class="section-title-no-border">4. DADOS DO IMÓVEL</div>
        <div class="property-section">
            <div class="property-col-25">
                <div class="field-label-small">Contrato nº:</div>
                <div class="field-value">${data.imovel.numeroContrato}</div>
            </div>
            <div class="property-col-25">
                <div class="field-label-small">Data do contrato:</div>
                <div class="field-value">${data.imovel.dataContrato}</div>
            </div>
            <div class="property-col-50">
                <div class="field-label-small">Endereço do imóvel:</div>
                <div class="field-value">${data.imovel.endereco}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title-no-border">5. INFORMAÇÕES COMPLEMENTARES</div>
        <div class="property-section">
            <div class="property-col-25">
                <div class="field-label-small">CNPJ da administradora (Imobiliária):</div>
                <div class="field-value">${data.imobiliaria.cnpj}</div>
            </div>
            <div class="property-col-25">
                <div class="field-label-small">Nome da imobiliária:</div>
                <div class="field-value">${data.imobiliaria.nome}</div>
            </div>
            <div class="property-col-50">
                <div class="field-label-small">Endereço:</div>
                <div class="field-value">${data.imobiliaria.endereco}</div>
            </div>
        </div>
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