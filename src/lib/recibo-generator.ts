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
  imobiliariaInscricaoMunicipal?: string
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
    const marginLeft = 43  // 15mm
    const marginRight = 43 // 15mm
    const marginTop = 57   // 20mm
    const marginBottom = 57 // 20mm
    
    // Cores padrão NFS-e
    const headerColor = rgb(0.1, 0.1, 0.1)
    const textColor = rgb(0.2, 0.2, 0.2)
    const grayColor = rgb(0.6, 0.6, 0.6)
    const borderColor = rgb(0.8, 0.8, 0.8)
    
    // Função helper para desenhar linha horizontal
    const drawHorizontalLine = (x: number, y: number, width: number, thickness = 1) => {
      page.drawLine({
        start: { x, y },
        end: { x: x + width, y },
        thickness,
        color: borderColor,
      })
    }
    
    // Função helper para desenhar caixa com borda
    const drawBox = (x: number, y: number, width: number, height: number, fillColor = rgb(1, 1, 1)) => {
      page.drawRectangle({
        x,
        y: y - height,
        width,
        height,
        color: fillColor,
        borderColor: borderColor,
        borderWidth: 1,
      })
    }
    
    const contentWidth = width - marginLeft - marginRight
    let currentY = height - marginTop
    
    // =============================================================
    // 1. CABEÇALHO INSTITUCIONAL (estilo NFS-e)
    // =============================================================
    
    // Caixa do cabeçalho
    drawBox(marginLeft, currentY, contentWidth, 60, rgb(0.95, 0.95, 0.95))
    
    // Título principal centralizado
    page.drawText('RECIBO DE SERVIÇO ELETRÔNICO', {
      x: marginLeft + contentWidth/2 - 120,
      y: currentY - 20,
      size: 14,
      font: fontBold,
      color: headerColor,
    })
    
    // Subtítulo
    page.drawText('Sistema de Administração Predial', {
      x: marginLeft + contentWidth/2 - 90,
      y: currentY - 35,
      size: 10,
      font: font,
      color: textColor,
    })
    
    // Dados de contato
    page.drawText(`${data.imobiliariaTelefone} - ${data.imobiliariaEmail}`, {
      x: marginLeft + contentWidth/2 - 80,
      y: currentY - 50,
      size: 9,
      font: font,
      color: grayColor,
    })
    
    currentY -= 80
    
    // =============================================================
    // 2. IDENTIFICAÇÃO DO DOCUMENTO
    // =============================================================
    
    drawBox(marginLeft, currentY, contentWidth, 50)
    
    // Linha 1: Tipo e número
    page.drawText('Recibo de Administração Predial', {
      x: marginLeft + 10,
      y: currentY - 15,
      size: 12,
      font: fontBold,
      color: headerColor,
    })
    
    page.drawText(`Número: ${data.numeroRecibo}`, {
      x: marginLeft + contentWidth - 150,
      y: currentY - 15,
      size: 11,
      font: fontBold,
      color: headerColor,
    })
    
    // Linha 2: Datas
    const dataFormatada = data.dataPagamento.toLocaleDateString('pt-BR')
    const competenciaFormatada = data.competencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    
    page.drawText(`Data de Geração: ${dataFormatada}`, {
      x: marginLeft + 10,
      y: currentY - 35,
      size: 10,
      font: font,
      color: textColor,
    })
    
    page.drawText(`Competência: ${competenciaFormatada}`, {
      x: marginLeft + contentWidth - 200,
      y: currentY - 35,
      size: 10,
      font: font,
      color: textColor,
    })
    
    currentY -= 70
    
    // =============================================================
    // 3. DADOS DO PRESTADOR (IMOBILIÁRIA)
    // =============================================================
    
    page.drawText('DADOS DO PRESTADOR', {
      x: marginLeft,
      y: currentY,
      size: 11,
      font: fontBold,
      color: headerColor,
    })
    
    currentY -= 5
    drawHorizontalLine(marginLeft, currentY, contentWidth)
    currentY -= 15
    
    drawBox(marginLeft, currentY, contentWidth, 80)
    
    // Razão Social
    page.drawText('Razão Social:', {
      x: marginLeft + 10,
      y: currentY - 15,
      size: 9,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText(data.imobiliariaRazaoSocial, {
      x: marginLeft + 85,
      y: currentY - 15,
      size: 10,
      font: font,
      color: textColor,
    })
    
    // CNPJ e Inscrição Municipal
    page.drawText('CNPJ:', {
      x: marginLeft + 10,
      y: currentY - 35,
      size: 9,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText(data.imobiliariaCnpj, {
      x: marginLeft + 50,
      y: currentY - 35,
      size: 10,
      font: font,
      color: textColor,
    })
    
    if (data.imobiliariaInscricaoMunicipal) {
      page.drawText('Inscrição Municipal:', {
        x: marginLeft + 250,
        y: currentY - 35,
        size: 9,
        font: fontBold,
        color: textColor,
      })
      
      page.drawText(data.imobiliariaInscricaoMunicipal, {
        x: marginLeft + 370,
        y: currentY - 35,
        size: 10,
        font: font,
        color: textColor,
      })
    }
    
    // Endereço
    page.drawText('Endereço:', {
      x: marginLeft + 10,
      y: currentY - 55,
      size: 9,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText(data.imobiliariaEndereco, {
      x: marginLeft + 70,
      y: currentY - 55,
      size: 10,
      font: font,
      color: textColor,
    })
    
    currentY -= 100
    
    // =============================================================
    // 4. DADOS DO TOMADOR (INQUILINO)
    // =============================================================
    
    page.drawText('DADOS DO TOMADOR DE SERVIÇOS', {
      x: marginLeft,
      y: currentY,
      size: 11,
      font: fontBold,
      color: headerColor,
    })
    
    currentY -= 5
    drawHorizontalLine(marginLeft, currentY, contentWidth)
    currentY -= 15
    
    drawBox(marginLeft, currentY, contentWidth, 60)
    
    // Nome do inquilino
    page.drawText('Nome/Razão Social:', {
      x: marginLeft + 10,
      y: currentY - 15,
      size: 9,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText(data.inquilinoNome, {
      x: marginLeft + 120,
      y: currentY - 15,
      size: 10,
      font: font,
      color: textColor,
    })
    
    // CPF
    page.drawText('CPF/CNPJ:', {
      x: marginLeft + 10,
      y: currentY - 35,
      size: 9,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText(data.inquilinoDoc, {
      x: marginLeft + 80,
      y: currentY - 35,
      size: 10,
      font: font,
      color: textColor,
    })
    
    // Endereço do imóvel
    page.drawText('Endereço do Imóvel:', {
      x: marginLeft + 250,
      y: currentY - 35,
      size: 9,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText(data.imovelEndereco.substring(0, 40), {
      x: marginLeft + 250,
      y: currentY - 50,
      size: 9,
      font: font,
      color: textColor,
    })
    
    currentY -= 80
    
    // =============================================================
    // 5. DESCRIÇÃO DOS SERVIÇOS
    // =============================================================
    
    page.drawText('DESCRIÇÃO DOS SERVIÇOS', {
      x: marginLeft,
      y: currentY,
      size: 11,
      font: fontBold,
      color: headerColor,
    })
    
    currentY -= 5
    drawHorizontalLine(marginLeft, currentY, contentWidth)
    currentY -= 15
    
    drawBox(marginLeft, currentY, contentWidth, 40)
    
    page.drawText(`Administração de aluguel referente a ${competenciaFormatada}.`, {
      x: marginLeft + 10,
      y: currentY - 15,
      size: 11,
      font: font,
      color: textColor,
    })
    
    page.drawText(`Proprietário: ${data.proprietarioNome} (${data.proprietarioDoc})`, {
      x: marginLeft + 10,
      y: currentY - 30,
      size: 10,
      font: font,
      color: textColor,
    })
    
    currentY -= 60
    
    // =============================================================
    // 6. DETALHAMENTO DOS VALORES
    // =============================================================
    
    page.drawText('DETALHAMENTO DOS VALORES', {
      x: marginLeft,
      y: currentY,
      size: 11,
      font: fontBold,
      color: headerColor,
    })
    
    currentY -= 5
    drawHorizontalLine(marginLeft, currentY, contentWidth)
    currentY -= 15
    
    drawBox(marginLeft, currentY, contentWidth, 120)
    
    // Tabela de valores
    const tableY = currentY - 15
    const col1 = marginLeft + 20
    const col2 = marginLeft + contentWidth - 120
    
    // Cabeçalho da tabela
    page.drawText('Discriminação', {
      x: col1,
      y: tableY,
      size: 10,
      font: fontBold,
      color: textColor,
    })
    
    page.drawText('Valor (R$)', {
      x: col2,
      y: tableY,
      size: 10,
      font: fontBold,
      color: textColor,
    })
    
    // Linha separadora
    drawHorizontalLine(col1 - 10, tableY - 5, contentWidth - 20)
    
    // Linhas da tabela
    const rows = [
      ['Valor total dos serviços:', data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      [`Taxa de administração (${data.percentualTaxa}%):`, data.taxaAdministracao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Valor repassado ao proprietário:', data.valorRepassado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
    ]
    
    let rowY = tableY - 25
    rows.forEach((row, index) => {
      page.drawText(row[0], {
        x: col1,
        y: rowY - (index * 20),
        size: 10,
        font: font,
        color: textColor,
      })
      
      page.drawText(row[1], {
        x: col2,
        y: rowY - (index * 20),
        size: 10,
        font: font,
        color: textColor,
      })
    })
    
    // Valor líquido (destaque)
    const liquidoY = rowY - 80
    drawHorizontalLine(col1 - 10, liquidoY + 10, contentWidth - 20)
    
    page.drawText('VALOR LÍQUIDO DO RECIBO:', {
      x: col1,
      y: liquidoY,
      size: 11,
      font: fontBold,
      color: headerColor,
    })
    
    page.drawText(`R$ ${data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, {
      x: col2,
      y: liquidoY,
      size: 12,
      font: fontBold,
      color: headerColor,
    })
    
    currentY -= 150
    
    // =============================================================
    // 7. RODAPÉ INFORMATIVO
    // =============================================================
    
    if (currentY > marginBottom + 60) {
      // Linha separadora
      drawHorizontalLine(marginLeft, currentY, contentWidth)
      currentY -= 20
      
      // Informações legais
      page.drawText('DOCUMENTO GERADO ELETRONICAMENTE', {
        x: marginLeft + contentWidth/2 - 90,
        y: currentY,
        size: 9,
        font: fontBold,
        color: grayColor,
      })
      
      currentY -= 15
      
      page.drawText(`Autenticidade: ${data.numeroRecibo} | ${dataFormatada}`, {
        x: marginLeft + contentWidth/2 - 70,
        y: currentY,
        size: 8,
        font: font,
        color: grayColor,
      })
    }
    
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