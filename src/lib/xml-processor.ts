// Processador de XMLs de NFS-e para DIMOB
// Extrai dados essenciais para geração do arquivo DIMOB

export interface NFSeData {
  numeroNota: string
  dataEmissao: string
  competencia: string
  valorServicos: number
  valorLiquido: number
  valorIss: number
  valorPis: number
  valorCofins: number
  valorInss: number
  valorIr: number
  codigoServico: string
  discriminacao: string
  tomador: {
    cnpjCpf: string
    razaoSocial: string
    endereco: {
      logradouro: string
      numero: string
      complemento?: string
      bairro: string
      cidade: string
      uf: string
      cep: string
    }
  }
  prestador: {
    cnpjCpf: string
    razaoSocial: string
    inscricaoMunicipal: string
  }
}

export class XMLProcessor {
  
  /**
   * Processa XML de NFS-e e extrai dados estruturados
   */
  static async processNFSeXML(xmlContent: string): Promise<NFSeData> {
    try {
      // Remove quebras de linha e espaços extras
      const cleanXml = xmlContent.replace(/\n|\r/g, '').replace(/>\s+</g, '><')
      
      // Função helper para extrair valores do XML
      const extractValue = (xml: string, tag: string): string => {
        const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i')
        const match = xml.match(regex)
        return match ? match[1].trim() : ''
      }

      // Função helper para extrair valores numéricos
      const extractNumber = (xml: string, tag: string): number => {
        const value = extractValue(xml, tag)
        return value ? parseFloat(value.replace(',', '.')) : 0
      }

      // Extração dos dados principais da nota
      const numeroNota = extractValue(cleanXml, 'Numero') || 
                        extractValue(cleanXml, 'NumeroNfse') ||
                        extractValue(cleanXml, 'NumeroRps')

      const dataEmissao = extractValue(cleanXml, 'DataEmissao') ||
                         extractValue(cleanXml, 'DataEmissaoNfse') ||
                         extractValue(cleanXml, 'DataEmissaoRps')

      const competencia = extractValue(cleanXml, 'Competencia') ||
                         dataEmissao

      // Valores da nota
      const valorServicos = extractNumber(cleanXml, 'ValorServicos')
      const valorLiquido = extractNumber(cleanXml, 'ValorLiquidoNfse') || 
                          extractNumber(cleanXml, 'ValorLiquido') ||
                          valorServicos

      const valorIss = extractNumber(cleanXml, 'ValorIss')
      const valorPis = extractNumber(cleanXml, 'ValorPis')
      const valorCofins = extractNumber(cleanXml, 'ValorCofins')
      const valorInss = extractNumber(cleanXml, 'ValorInss')
      const valorIr = extractNumber(cleanXml, 'ValorIr')

      // Código do serviço
      const codigoServico = extractValue(cleanXml, 'CodigoTributacaoMunicipio') ||
                           extractValue(cleanXml, 'ItemListaServico') ||
                           extractValue(cleanXml, 'CodigoServico')

      // Discriminação/descrição
      const discriminacao = extractValue(cleanXml, 'Discriminacao') ||
                           extractValue(cleanXml, 'DescricaoServico')

      // Dados do tomador (cliente que paga o serviço)
      const tomadorCnpjCpf = extractValue(cleanXml, 'CpfCnpj') ||
                            extractValue(cleanXml, 'Cnpj') ||
                            extractValue(cleanXml, 'Cpf')

      const tomadorRazaoSocial = extractValue(cleanXml, 'RazaoSocial') ||
                                extractValue(cleanXml, 'NomeRazaoSocial')

      // Endereço do tomador
      const endereco = {
        logradouro: extractValue(cleanXml, 'Endereco') || 
                   extractValue(cleanXml, 'Logradouro'),
        numero: extractValue(cleanXml, 'Numero'),
        complemento: extractValue(cleanXml, 'Complemento'),
        bairro: extractValue(cleanXml, 'Bairro'),
        cidade: extractValue(cleanXml, 'Cidade') || 
               extractValue(cleanXml, 'CodigoMunicipio'),
        uf: extractValue(cleanXml, 'Uf') || 
           extractValue(cleanXml, 'Estado'),
        cep: extractValue(cleanXml, 'Cep')
      }

      // Dados do prestador (imobiliária)
      const prestadorCnpjCpf = extractValue(cleanXml, 'Cnpj') // Do prestador
      const prestadorRazaoSocial = extractValue(cleanXml, 'RazaoSocial') // Do prestador
      const inscricaoMunicipal = extractValue(cleanXml, 'InscricaoMunicipal')

      const nfseData: NFSeData = {
        numeroNota,
        dataEmissao,
        competencia,
        valorServicos,
        valorLiquido,
        valorIss,
        valorPis,
        valorCofins,
        valorInss,
        valorIr,
        codigoServico,
        discriminacao,
        tomador: {
          cnpjCpf: tomadorCnpjCpf,
          razaoSocial: tomadorRazaoSocial,
          endereco
        },
        prestador: {
          cnpjCpf: prestadorCnpjCpf,
          razaoSocial: prestadorRazaoSocial,
          inscricaoMunicipal
        }
      }

      // Validação básica
      if (!numeroNota || !dataEmissao || valorServicos <= 0) {
        throw new Error('XML inválido: dados obrigatórios não encontrados')
      }

      return nfseData

    } catch (error) {
      console.error('Erro ao processar XML:', error)
      throw new Error(`Erro ao processar XML de NFS-e: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }

  /**
   * Valida se o XML é uma NFS-e válida
   */
  static validateNFSeXML(xmlContent: string): boolean {
    try {
      // Verifica se contém tags essenciais de NFS-e
      const requiredTags = [
        'CompNfse', 'Nfse', 'InfNfse', 'RPS', 'NumeroRps', 'Numero'
      ]
      
      const hasRequiredTag = requiredTags.some(tag => 
        xmlContent.toLowerCase().includes(`<${tag.toLowerCase()}`)
      )

      return hasRequiredTag
    } catch (error) {
      return false
    }
  }

  /**
   * Extrai múltiplas NFS-e de um XML (caso contenha várias)
   */
  static async processMultipleNFSe(xmlContent: string): Promise<NFSeData[]> {
    try {
      // Se contém múltiplas notas, processa cada uma
      const nfseBlocks = this.extractNFSeBlocks(xmlContent)
      
      if (nfseBlocks.length <= 1) {
        // XML simples com uma nota apenas
        const single = await this.processNFSeXML(xmlContent)
        return [single]
      }

      // Processa cada bloco de NFS-e
      const results: NFSeData[] = []
      for (const block of nfseBlocks) {
        try {
          const nfseData = await this.processNFSeXML(block)
          results.push(nfseData)
        } catch (error) {
          console.warn('Erro ao processar bloco de NFS-e:', error)
          // Continua processando outros blocos
        }
      }

      return results

    } catch (error) {
      console.error('Erro ao processar múltiplas NFS-e:', error)
      throw error
    }
  }

  /**
   * Helper: extrai blocos individuais de NFS-e de um XML com múltiplas notas
   */
  private static extractNFSeBlocks(xmlContent: string): string[] {
    const blocks: string[] = []
    
    // Padrões comuns para separar múltiplas NFS-e
    const patterns = [
      /<CompNfse>.*?<\/CompNfse>/gis,
      /<Nfse>.*?<\/Nfse>/gis,
      /<RPS>.*?<\/RPS>/gis
    ]

    for (const pattern of patterns) {
      const matches = xmlContent.match(pattern)
      if (matches && matches.length > 0) {
        return matches
      }
    }

    // Se não encontrou padrões múltiplos, retorna o XML inteiro
    return [xmlContent]
  }

  /**
   * Formatar data no padrão brasileiro
   */
  static formatDate(dateString: string): string {
    try {
      // Tenta vários formatos de data
      let date: Date

      if (dateString.includes('T')) {
        // ISO format: 2024-01-15T10:30:00
        date = new Date(dateString)
      } else if (dateString.includes('-')) {
        // Format: 2024-01-15
        date = new Date(dateString)
      } else if (dateString.includes('/')) {
        // Format: 15/01/2024 or 01/15/2024
        const [part1, part2, part3] = dateString.split('/')
        if (part1.length === 4) {
          // YYYY/MM/DD
          date = new Date(`${part1}-${part2}-${part3}`)
        } else {
          // DD/MM/YYYY or MM/DD/YYYY - assume DD/MM/YYYY (padrão brasileiro)
          date = new Date(`${part3}-${part2}-${part1}`)
        }
      } else {
        throw new Error('Formato de data não reconhecido')
      }

      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      console.warn('Erro ao formatar data:', dateString, error)
      return dateString
    }
  }

  /**
   * Formatar valor monetário
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
}