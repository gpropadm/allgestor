// Sistema de Automação de Documentos
// Gera contratos, propostas e documentos automaticamente

import { prisma } from './prisma'

interface DocumentVariable {
  name: string
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean'
  description: string
  required: boolean
  defaultValue?: any
}

interface DocumentTemplate {
  id?: string
  name: string
  documentType: 'contract' | 'proposal' | 'receipt' | 'report' | 'agreement'
  templateContent: string
  variables: DocumentVariable[]
  companyId: string
}

interface DocumentData {
  leadName: string
  leadEmail: string
  leadPhone: string
  leadDocument?: string
  propertyTitle?: string
  propertyAddress?: string
  propertyValue?: number
  rentPrice?: number
  salePrice?: number
  ownerName?: string
  ownerDocument?: string
  companyName: string
  companyDocument: string
  companyAddress: string
  agentName: string
  agentCRECI?: string
  [key: string]: any
}

export class DocumentAutomation {
  
  // === CRIAÇÃO DE TEMPLATES ===
  
  async createTemplate(template: DocumentTemplate) {
    try {
      const created = await prisma.documentTemplate.create({
        data: {
          name: template.name,
          documentType: template.documentType,
          templateContent: template.templateContent,
          variables: JSON.stringify(template.variables),
          companyId: template.companyId
        }
      })
      
      return { success: true, data: created }
    } catch (error) {
      return { success: false, error: `Erro ao criar template: ${error}` }
    }
  }
  
  // === GERAÇÃO DE DOCUMENTOS ===
  
  async generateDocument(templateId: string, data: DocumentData, leadId?: string, propertyId?: string) {
    try {
      // Buscar o template
      const template = await prisma.documentTemplate.findUnique({
        where: { id: templateId }
      })
      
      if (!template) {
        throw new Error('Template não encontrado')
      }
      
      // Processar o conteúdo
      const processedContent = this.processTemplate(template.templateContent, data)
      
      // Gerar PDF (simulado aqui, mas seria integração real)
      const documentUrl = await this.generatePDF(processedContent, template.name, data)
      
      // Salvar no banco
      const document = await prisma.generatedDocument.create({
        data: {
          templateId,
          leadId,
          propertyId,
          documentUrl,
          documentStatus: 'draft',
          variablesUsed: JSON.stringify(data)
        }
      })
      
      return { 
        success: true, 
        data: { 
          document,
          content: processedContent,
          downloadUrl: documentUrl 
        } 
      }
    } catch (error) {
      return { success: false, error: `Erro ao gerar documento: ${error}` }
    }
  }
  
  // === PROCESSAMENTO DE TEMPLATES ===
  
  private processTemplate(template: string, data: DocumentData): string {
    let processed = template
    
    // Substituir variáveis simples {{variableName}}
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      const formattedValue = this.formatValue(value, key)
      processed = processed.replace(placeholder, formattedValue)
    })
    
    // Processar funções especiais
    processed = this.processSpecialFunctions(processed, data)
    
    // Processar condicionais
    processed = this.processConditionals(processed, data)
    
    // Processar loops
    processed = this.processLoops(processed, data)
    
    return processed
  }
  
  private formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return ''
    
    // Formatação de moeda
    if (key.includes('Price') || key.includes('Value') || key.includes('Amount')) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(Number(value))
    }
    
    // Formatação de data
    if (key.includes('Date') && value instanceof Date) {
      return value.toLocaleDateString('pt-BR')
    }
    
    // Formatação de documento (CPF/CNPJ)
    if (key.includes('Document') && typeof value === 'string') {
      return this.formatDocument(value)
    }
    
    // Formatação de telefone
    if (key.includes('Phone') && typeof value === 'string') {
      return this.formatPhone(value)
    }
    
    return String(value)
  }
  
  private processSpecialFunctions(content: string, data: DocumentData): string {
    let processed = content
    
    // {{today}} - data atual
    processed = processed.replace(/{{today}}/g, new Date().toLocaleDateString('pt-BR'))
    
    // {{now}} - data e hora atual
    processed = processed.replace(/{{now}}/g, new Date().toLocaleString('pt-BR'))
    
    // {{upperCase:variableName}} - texto em maiúsculo
    processed = processed.replace(/{{upperCase:(\w+)}}/g, (match, varName) => {
      return (data[varName] || '').toString().toUpperCase()
    })
    
    // {{lowerCase:variableName}} - texto em minúsculo
    processed = processed.replace(/{{lowerCase:(\w+)}}/g, (match, varName) => {
      return (data[varName] || '').toString().toLowerCase()
    })
    
    // {{capitalize:variableName}} - primeira letra maiúscula
    processed = processed.replace(/{{capitalize:(\w+)}}/g, (match, varName) => {
      const value = (data[varName] || '').toString()
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    })
    
    // {{currency:variableName}} - formatação de moeda
    processed = processed.replace(/{{currency:(\w+)}}/g, (match, varName) => {
      const value = Number(data[varName] || 0)
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    })
    
    // {{extenso:variableName}} - número por extenso
    processed = processed.replace(/{{extenso:(\w+)}}/g, (match, varName) => {
      const value = Number(data[varName] || 0)
      return this.numberToWords(value)
    })
    
    return processed
  }
  
  private processConditionals(content: string, data: DocumentData): string {
    let processed = content
    
    // {{if:variableName}}content{{/if}}
    processed = processed.replace(/{{if:(\w+)}}(.*?){{\/if}}/gs, (match, varName, content) => {
      return data[varName] ? content : ''
    })
    
    // {{ifNot:variableName}}content{{/ifNot}}
    processed = processed.replace(/{{ifNot:(\w+)}}(.*?){{\/ifNot}}/gs, (match, varName, content) => {
      return !data[varName] ? content : ''
    })
    
    // {{ifEquals:variableName:value}}content{{/ifEquals}}
    processed = processed.replace(/{{ifEquals:(\w+):(.+?)}}(.*?){{\/ifEquals}}/gs, (match, varName, value, content) => {
      return data[varName] === value ? content : ''
    })
    
    return processed
  }
  
  private processLoops(content: string, data: DocumentData): string {
    // {{forEach:arrayName}}content{{/forEach}}
    return content.replace(/{{forEach:(\w+)}}(.*?){{\/forEach}}/gs, (match, arrayName, loopContent) => {
      const array = data[arrayName]
      if (!Array.isArray(array)) return ''
      
      return array.map((item, index) => {
        let itemContent = loopContent
        
        // Substituir {{item.property}} e {{index}}
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            itemContent = itemContent.replace(
              new RegExp(`{{item\\.${key}}}`, 'g'),
              this.formatValue(value, key)
            )
          })
        } else {
          itemContent = itemContent.replace(/{{item}}/g, String(item))
        }
        
        itemContent = itemContent.replace(/{{index}}/g, String(index + 1))
        
        return itemContent
      }).join('')
    })
  }
  
  // === FORMATAÇÃO DE DADOS ===
  
  private formatDocument(doc: string): string {
    const numbers = doc.replace(/\D/g, '')
    
    if (numbers.length === 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else if (numbers.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    
    return doc
  }
  
  private formatPhone(phone: string): string {
    const numbers = phone.replace(/\D/g, '')
    
    if (numbers.length === 11) {
      // Celular: (00) 00000-0000
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    } else if (numbers.length === 10) {
      // Fixo: (00) 0000-0000
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    
    return phone
  }
  
  private numberToWords(num: number): string {
    // Implementação simplificada - seria mais robusta em produção
    const ones = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
    
    if (num === 0) return 'zero'
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 ? ' e ' + ones[num % 10] : '')
    }
    
    // Para números maiores, uma implementação mais completa seria necessária
    return num.toString()
  }
  
  // === GERAÇÃO DE PDF ===
  
  private async generatePDF(content: string, fileName: string, data: DocumentData): Promise<string> {
    // Simulação - em produção seria integração com biblioteca PDF
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '_')
    const documentUrl = `/documents/${sanitizedFileName}_${timestamp}.pdf`
    
    // Aqui seria a integração real com bibliotecas como:
    // - Puppeteer para HTML to PDF
    // - PDFKit para geração programática
    // - jsPDF para cliente
    console.log(`📄 PDF gerado: ${documentUrl}`)
    console.log(`Conteúdo: ${content.substring(0, 200)}...`)
    
    return documentUrl
  }
  
  // === TEMPLATES PADRÃO ===
  
  async createDefaultTemplates(companyId: string) {
    const templates = [
      {
        name: 'Contrato de Locação Residencial',
        documentType: 'contract' as const,
        templateContent: this.getContractTemplate(),
        variables: this.getContractVariables(),
        companyId
      },
      {
        name: 'Proposta de Compra e Venda',
        documentType: 'proposal' as const,
        templateContent: this.getProposalTemplate(),
        variables: this.getProposalVariables(),
        companyId
      },
      {
        name: 'Recibo de Sinal',
        documentType: 'receipt' as const,
        templateContent: this.getReceiptTemplate(),
        variables: this.getReceiptVariables(),
        companyId
      }
    ]
    
    const created = []
    for (const template of templates) {
      const result = await this.createTemplate(template)
      if (result.success) {
        created.push(result.data)
      }
    }
    
    return { success: true, data: created }
  }
  
  private getContractTemplate(): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="text-align: center; color: #333;">CONTRATO DE LOCAÇÃO RESIDENCIAL</h1>
      
      <p><strong>LOCADOR:</strong> {{ownerName}}, {{ownerNationality}}, {{ownerMaritalStatus}}, 
      {{ownerProfession}}, portador do CPF {{ownerDocument}}, residente e domiciliado à {{ownerAddress}}.</p>
      
      <p><strong>LOCATÁRIO:</strong> {{leadName}}, {{leadNationality}}, {{leadMaritalStatus}}, 
      {{leadProfession}}, portador do CPF {{leadDocument}}, residente e domiciliado à {{leadAddress}}.</p>
      
      <h2>CLÁUSULA 1ª - DO OBJETO</h2>
      <p>O presente contrato tem por objeto a locação do imóvel situado à {{propertyAddress}}, 
      com {{propertyBedrooms}} dormitórios, {{propertyBathrooms}} banheiros, 
      com área de {{propertyArea}}m².</p>
      
      <h2>CLÁUSULA 2ª - DO PRAZO</h2>
      <p>O prazo de locação é de {{contractTermMonths}} meses, iniciando-se em {{contractStartDate}} 
      e terminando em {{contractEndDate}}, renovável por acordo entre as partes.</p>
      
      <h2>CLÁUSULA 3ª - DO VALOR</h2>
      <p>O valor mensal do aluguel é de {{currency:rentPrice}} ({{extenso:rentPrice}}), 
      vencível todo dia {{paymentDay}} de cada mês.</p>
      
      {{if:depositAmount}}
      <p>Foi pago o valor de {{currency:depositAmount}} a título de caução/depósito.</p>
      {{/if}}
      
      <h2>CLÁUSULA 4ª - DAS RESPONSABILIDADES</h2>
      <p>O locatário se responsabiliza por:</p>
      <ul>
        <li>Pagar pontualmente o aluguel;</li>
        <li>Manter o imóvel em bom estado de conservação;</li>
        <li>Não realizar alterações sem autorização;</li>
        <li>{{if:includingIPTU}}Pagar IPTU;{{/if}}</li>
        <li>{{if:includingCondo}}Pagar condomínio;{{/if}}</li>
      </ul>
      
      <h2>CLÁUSULA 5ª - DA ADMINISTRAÇÃO</h2>
      <p>A administração do contrato fica a cargo da {{companyName}}, 
      CNPJ {{companyDocument}}, situada à {{companyAddress}}, 
      que receberá taxa de administração de {{adminFeePercent}}%.</p>
      
      <p style="margin-top: 40px;">Local e data: {{companyCity}}, {{today}}</p>
      
      <div style="margin-top: 60px;">
        <div style="float: left; width: 45%;">
          <p>_________________________________</p>
          <p style="text-align: center;">{{ownerName}}<br>LOCADOR</p>
        </div>
        
        <div style="float: right; width: 45%;">
          <p>_________________________________</p>
          <p style="text-align: center;">{{leadName}}<br>LOCATÁRIO</p>
        </div>
        
        <div style="clear: both; margin-top: 40px; text-align: center;">
          <p>_________________________________</p>
          <p>{{companyName}}<br>ADMINISTRADORA</p>
        </div>
      </div>
    </div>
    `
  }
  
  private getContractVariables(): DocumentVariable[] {
    return [
      { name: 'ownerName', type: 'text', description: 'Nome do proprietário', required: true },
      { name: 'ownerDocument', type: 'text', description: 'CPF do proprietário', required: true },
      { name: 'ownerAddress', type: 'text', description: 'Endereço do proprietário', required: true },
      { name: 'leadName', type: 'text', description: 'Nome do locatário', required: true },
      { name: 'leadDocument', type: 'text', description: 'CPF do locatário', required: true },
      { name: 'leadAddress', type: 'text', description: 'Endereço do locatário', required: true },
      { name: 'propertyAddress', type: 'text', description: 'Endereço do imóvel', required: true },
      { name: 'propertyBedrooms', type: 'number', description: 'Número de quartos', required: true },
      { name: 'propertyBathrooms', type: 'number', description: 'Número de banheiros', required: true },
      { name: 'propertyArea', type: 'number', description: 'Área em m²', required: true },
      { name: 'rentPrice', type: 'currency', description: 'Valor do aluguel', required: true },
      { name: 'contractStartDate', type: 'date', description: 'Data de início', required: true },
      { name: 'contractEndDate', type: 'date', description: 'Data de término', required: true },
      { name: 'contractTermMonths', type: 'number', description: 'Prazo em meses', required: true },
      { name: 'paymentDay', type: 'number', description: 'Dia de vencimento', required: true },
      { name: 'adminFeePercent', type: 'number', description: 'Taxa de administração (%)', required: true },
      { name: 'depositAmount', type: 'currency', description: 'Valor da caução', required: false },
      { name: 'companyName', type: 'text', description: 'Nome da imobiliária', required: true },
      { name: 'companyDocument', type: 'text', description: 'CNPJ da imobiliária', required: true },
      { name: 'companyAddress', type: 'text', description: 'Endereço da imobiliária', required: true }
    ]
  }
  
  private getProposalTemplate(): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="text-align: center; color: #333;">PROPOSTA DE COMPRA E VENDA</h1>
      
      <p><strong>PROPONENTE:</strong> {{leadName}}, {{leadNationality}}, {{leadMaritalStatus}}, 
      portador do CPF {{leadDocument}}, residente à {{leadAddress}}.</p>
      
      <p><strong>IMÓVEL:</strong> {{propertyTitle}}<br>
      Endereço: {{propertyAddress}}<br>
      Características: {{propertyBedrooms}} dormitórios, {{propertyBathrooms}} banheiros, {{propertyArea}}m²</p>
      
      <h2>CONDIÇÕES DA PROPOSTA</h2>
      <p><strong>Valor Proposto:</strong> {{currency:proposedValue}} ({{extenso:proposedValue}})</p>
      
      {{if:downPayment}}
      <p><strong>Entrada:</strong> {{currency:downPayment}} ({{extenso:downPayment}})</p>
      {{/if}}
      
      {{if:financingAmount}}
      <p><strong>Financiamento:</strong> {{currency:financingAmount}} através do {{bankName}}</p>
      {{/if}}
      
      <p><strong>Prazo para Resposta:</strong> {{responseDeadline}}</p>
      <p><strong>Prazo para Documentação:</strong> {{documentationDeadline}}</p>
      
      <h2>CONDIÇÕES GERAIS</h2>
      <ul>
        <li>Imóvel livre e desembaraçado de qualquer ônus;</li>
        <li>Documentação em ordem;</li>
        <li>{{if:includesFurniture}}Imóvel com mobília conforme vistoria;{{/if}}</li>
        <li>{{if:needsFinancing}}Sujeito à aprovação de crédito;{{/if}}</li>
      </ul>
      
      <p style="margin-top: 40px;">{{companyCity}}, {{today}}</p>
      
      <div style="margin-top: 60px;">
        <p>_________________________________</p>
        <p style="text-align: center;">{{leadName}}<br>PROPONENTE</p>
      </div>
      
      <div style="margin-top: 40px;">
        <p>_________________________________</p>
        <p style="text-align: center;">{{agentName}} - CRECI {{agentCRECI}}<br>{{companyName}}</p>
      </div>
    </div>
    `
  }
  
  private getProposalVariables(): DocumentVariable[] {
    return [
      { name: 'leadName', type: 'text', description: 'Nome do proponente', required: true },
      { name: 'leadDocument', type: 'text', description: 'CPF do proponente', required: true },
      { name: 'leadAddress', type: 'text', description: 'Endereço do proponente', required: true },
      { name: 'propertyTitle', type: 'text', description: 'Título do imóvel', required: true },
      { name: 'propertyAddress', type: 'text', description: 'Endereço do imóvel', required: true },
      { name: 'proposedValue', type: 'currency', description: 'Valor proposto', required: true },
      { name: 'downPayment', type: 'currency', description: 'Valor da entrada', required: false },
      { name: 'financingAmount', type: 'currency', description: 'Valor do financiamento', required: false },
      { name: 'bankName', type: 'text', description: 'Banco para financiamento', required: false },
      { name: 'responseDeadline', type: 'date', description: 'Prazo para resposta', required: true },
      { name: 'documentationDeadline', type: 'date', description: 'Prazo para documentação', required: true },
      { name: 'agentName', type: 'text', description: 'Nome do corretor', required: true },
      { name: 'agentCRECI', type: 'text', description: 'CRECI do corretor', required: true }
    ]
  }
  
  private getReceiptTemplate(): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="text-align: center; color: #333;">RECIBO DE SINAL</h1>
      
      <p style="text-align: center; font-size: 18px; margin: 30px 0;">
        <strong>{{currency:amount}}</strong>
      </p>
      
      <p>Recebi de {{payerName}}, portador do CPF {{payerDocument}}, 
      a quantia de {{currency:amount}} ({{extenso:amount}}), 
      referente ao sinal/arras do {{transactionType}} do imóvel localizado à {{propertyAddress}}.</p>
      
      {{if:propertyValue}}
      <p>Valor total do {{transactionType}}: {{currency:propertyValue}}</p>
      {{/if}}
      
      <p>Para maior clareza, firmo o presente recibo.</p>
      
      <p style="margin-top: 40px;">{{companyCity}}, {{today}}</p>
      
      <div style="margin-top: 60px; text-align: center;">
        <p>_________________________________</p>
        <p>{{receiverName}}</p>
        <p>CPF: {{receiverDocument}}</p>
      </div>
      
      <div style="margin-top: 40px; text-align: center;">
        <p style="font-size: 12px;">{{companyName}} - {{companyPhone}}</p>
      </div>
    </div>
    `
  }
  
  private getReceiptVariables(): DocumentVariable[] {
    return [
      { name: 'amount', type: 'currency', description: 'Valor recebido', required: true },
      { name: 'payerName', type: 'text', description: 'Nome de quem paga', required: true },
      { name: 'payerDocument', type: 'text', description: 'CPF de quem paga', required: true },
      { name: 'receiverName', type: 'text', description: 'Nome de quem recebe', required: true },
      { name: 'receiverDocument', type: 'text', description: 'CPF de quem recebe', required: true },
      { name: 'transactionType', type: 'text', description: 'Tipo de transação (locação/venda)', required: true },
      { name: 'propertyAddress', type: 'text', description: 'Endereço do imóvel', required: true },
      { name: 'propertyValue', type: 'currency', description: 'Valor total do imóvel', required: false }
    ]
  }
  
  // === ASSINATURA ELETRÔNICA ===
  
  async sendForSignature(documentId: string, signatories: Array<{name: string, email: string, type: 'signer' | 'witness'}>) {
    try {
      const document = await prisma.generatedDocument.findUnique({
        where: { id: documentId }
      })
      
      if (!document) {
        throw new Error('Documento não encontrado')
      }
      
      // Simular envio para plataforma de assinatura (ex: DocuSign, ClickSign)
      console.log(`📝 Enviando documento ${documentId} para assinatura:`)
      signatories.forEach(signatory => {
        console.log(`  - ${signatory.name} (${signatory.email}) - ${signatory.type}`)
      })
      
      await prisma.generatedDocument.update({
        where: { id: documentId },
        data: { documentStatus: 'sent' }
      })
      
      return { success: true, message: 'Documento enviado para assinatura' }
    } catch (error) {
      return { success: false, error: `Erro ao enviar para assinatura: ${error}` }
    }
  }
}

export const documentAutomation = new DocumentAutomation()