import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface ReciboData {
  numeroRecibo: string
  competencia: Date
  dataPagamento: Date
  valorTotal: number
  taxaAdministracao: number
  percentualTaxa: number
  valorRepassado: number
  
  // Dados da imobiliária
  imobiliariaRazaoSocial: string
  imobiliariaCnpj: string
  imobiliariaEndereco: string
  imobiliariaTelefone: string
  imobiliariaEmail: string
  
  // Dados do contrato
  proprietarioNome: string
  proprietarioDoc: string
  inquilinoNome: string
  inquilinoDoc: string
  imovelEndereco: string
  
  observacoes?: string
}

export class ReciboGenerator {
  static async gerarReciboPDF(data: ReciboData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89]) // A4
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const margin = 50
    
    // Cores
    const primaryColor = rgb(0.96, 0.24, 0.42) // #f63c6a
    const textColor = rgb(0.2, 0.2, 0.2)
    const grayColor = rgb(0.5, 0.5, 0.5)
    
    let yPosition = height - margin
    
    // CABEÇALHO - Dados da Imobiliária
    page.drawRectangle({
      x: margin,
      y: yPosition - 80,
      width: width - 2 * margin,
      height: 80,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: primaryColor,
      borderWidth: 2,
    })
    
    // Logo placeholder (área para logo)
    page.drawRectangle({
      x: margin + 10,
      y: yPosition - 70,
      width: 60,
      height: 60,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: grayColor,
      borderWidth: 1,
    })
    
    page.drawText('LOGO', {
      x: margin + 25,
      y: yPosition - 45,
      size: 10,
      font: font,
      color: grayColor,
    })
    
    // Dados da imobiliária
    page.drawText(data.imobiliariaRazaoSocial, {
      x: margin + 85,
      y: yPosition - 25,
      size: 16,
      font: fontBold,
      color: primaryColor,
    })
    
    page.drawText(`CNPJ: ${data.imobiliariaCnpj}`, {
      x: margin + 85,
      y: yPosition - 45,
      size: 10,
      font: font,
      color: textColor,
    })
    
    page.drawText(`${data.imobiliariaTelefone} | ${data.imobiliariaEmail}`, {
      x: margin + 85,
      y: yPosition - 60,
      size: 10,
      font: font,
      color: textColor,
    })
    
    yPosition -= 120
    
    // TÍTULO DO RECIBO
    page.drawText('RECIBO DE ADMINISTRAÇÃO PREDIAL', {
      x: width / 2 - 150,
      y: yPosition,
      size: 18,
      font: fontBold,
      color: primaryColor,
    })
    
    page.drawText(`Recibo Nº: ${data.numeroRecibo}`, {
      x: width - margin - 120,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: textColor,
    })
    
    yPosition -= 40
    
    // Data do recibo
    const dataFormatada = data.dataPagamento.toLocaleDateString('pt-BR')
    const competenciaFormatada = data.competencia.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    })
    
    page.drawText(`São Paulo, ${dataFormatada}`, {
      x: width - margin - 100,
      y: yPosition,
      size: 10,
      font: font,
      color: textColor,
    })
    
    yPosition -= 50
    
    // CORPO DO RECIBO
    const textoRecibo = [
      `Recebemos do inquilino ${data.inquilinoNome}, CPF ${data.inquilinoDoc},`,
      `o valor de R$ ${data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} referente ao aluguel do imóvel localizado`,
      `na ${data.imovelEndereco}, relativo à competência ${competenciaFormatada}.`,
      '',
      'DISCRIMINAÇÃO DOS VALORES:',
      '',
      `• Valor total recebido: R$ ${data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `• Taxa de administração (${data.percentualTaxa}%): R$ ${data.taxaAdministracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `• Valor repassado ao proprietário: R$ ${data.valorRepassado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      '',
      'DADOS DO CONTRATO:',
      '',
      `Proprietário: ${data.proprietarioNome}`,
      `CPF/CNPJ: ${data.proprietarioDoc}`,
      `Inquilino: ${data.inquilinoNome}`,
      `CPF/CNPJ: ${data.inquilinoDoc}`,
      `Imóvel: ${data.imovelEndereco}`,
    ]
    
    textoRecibo.forEach((linha, index) => {
      const fontSize = linha.startsWith('•') ? 11 : 
                      linha.startsWith('DISCRIMINAÇÃO') || linha.startsWith('DADOS DO CONTRATO') ? 12 : 11
      const fontType = linha.startsWith('DISCRIMINAÇÃO') || linha.startsWith('DADOS DO CONTRATO') ? fontBold : font
      const cor = linha.startsWith('•') ? textColor : 
                  linha.startsWith('DISCRIMINAÇÃO') || linha.startsWith('DADOS DO CONTRATO') ? primaryColor : textColor
      
      page.drawText(linha, {
        x: margin,
        y: yPosition - (index * 20),
        size: fontSize,
        font: fontType,
        color: cor,
      })
    })
    
    yPosition -= (textoRecibo.length * 20) + 30
    
    // Observações (se houver)
    if (data.observacoes) {
      page.drawText('OBSERVAÇÕES:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: fontBold,
        color: primaryColor,
      })
      
      page.drawText(data.observacoes, {
        x: margin,
        y: yPosition - 20,
        size: 10,
        font: font,
        color: textColor,
      })
      
      yPosition -= 60
    }
    
    // ASSINATURA
    yPosition -= 30
    
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: margin + 200, y: yPosition },
      thickness: 1,
      color: grayColor,
    })
    
    page.drawText(data.imobiliariaRazaoSocial, {
      x: margin,
      y: yPosition - 15,
      size: 10,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText('Administração Predial', {
      x: margin,
      y: yPosition - 30,
      size: 9,
      font: font,
      color: grayColor,
    })
    
    // RODAPÉ
    const rodapeY = 50
    
    page.drawLine({
      start: { x: margin, y: rodapeY + 30 },
      end: { x: width - margin, y: rodapeY + 30 },
      thickness: 1,
      color: primaryColor,
    })
    
    page.drawText(data.imobiliariaEndereco, {
      x: width / 2 - 100,
      y: rodapeY + 10,
      size: 9,
      font: font,
      color: grayColor,
    })
    
    page.drawText(`${data.imobiliariaTelefone} | ${data.imobiliariaEmail}`, {
      x: width / 2 - 80,
      y: rodapeY - 5,
      size: 9,
      font: font,
      color: grayColor,
    })
    
    return await pdfDoc.save()
  }
  
  static gerarNumeroRecibo(userId: string, ano: number, mes: number, sequencial: number): string {
    // Formato: USERID-AAAAMM-NNNN
    const userIdShort = userId.substring(0, 6).toUpperCase()
    const anoMes = `${ano}${mes.toString().padStart(2, '0')}`
    const seq = sequencial.toString().padStart(4, '0')
    
    return `${userIdShort}-${anoMes}-${seq}`
  }
  
  static formatarCompetencia(data: Date): string {
    return data.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    })
  }
  
  static calcularValores(valorTotal: number, percentualTaxa: number) {
    const taxaAdministracao = (valorTotal * percentualTaxa) / 100
    const valorRepassado = valorTotal - taxaAdministracao
    
    return {
      taxaAdministracao: Math.round(taxaAdministracao * 100) / 100,
      valorRepassado: Math.round(valorRepassado * 100) / 100,
    }
  }
}