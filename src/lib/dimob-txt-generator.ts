import { prisma } from '@/lib/db'

interface DimobContract {
  id: string
  cnpjDeclarante: string
  nomeDeclarante: string
  cpfLocador: string
  nomeLocador: string
  cpfLocatario: string
  nomeLocatario: string
  enderecoImovel: string
  dataInicioContrato: string
  valoresMensais: number[] // 12 meses
  totalAnual: number
}

/**
 * Gera arquivo DIMOB no formato .txt para importação na Receita Federal
 */
export async function gerarArquivoDimobTxt(userId: string, ano: number): Promise<string> {
  console.log(`📄 [DIMOB] Gerando arquivo para ano ${ano}, usuário ${userId}`)

  // Buscar dados da empresa declarante
  const empresa = await prisma.company.findFirst({
    where: {
      users: { some: { id: userId } }
    }
  })

  if (!empresa) {
    throw new Error('Empresa não encontrada para gerar DIMOB')
  }

  // Buscar contratos ativos do usuário
  const contratos = await prisma.contract.findMany({
    where: {
      userId: userId,
      status: 'ACTIVE'
    },
    include: {
      property: {
        include: { owner: true }
      },
      tenant: true,
      payments: {
        where: {
          status: 'PAID',
          dueDate: {
            gte: new Date(ano, 0, 1),
            lte: new Date(ano, 11, 31)
          }
        },
        orderBy: { dueDate: 'asc' }
      }
    }
  })

  console.log(`📄 [DIMOB] Encontrados ${contratos.length} contratos`)

  // Processar cada contrato
  const dimobContracts: DimobContract[] = contratos.map(contrato => {
    // Calcular valores mensais
    const valoresMensais = Array(12).fill(0)
    
    contrato.payments.forEach(payment => {
      const mes = payment.dueDate.getMonth()
      valoresMensais[mes] += payment.amount
    })

    const totalAnual = valoresMensais.reduce((sum, valor) => sum + valor, 0)

    return {
      id: contrato.id,
      cnpjDeclarante: empresa.document.replace(/\D/g, ''),
      nomeDeclarante: empresa.name,
      cpfLocador: contrato.property.owner.document.replace(/\D/g, ''),
      nomeLocador: contrato.property.owner.name,
      cpfLocatario: contrato.tenant.document.replace(/\D/g, ''),
      nomeLocatario: contrato.tenant.name,
      enderecoImovel: contrato.property.address,
      dataInicioContrato: contrato.startDate.toISOString().slice(0, 10).replace(/-/g, ''),
      valoresMensais,
      totalAnual
    }
  })

  // Gerar conteúdo do arquivo
  let conteudo = ''

  // === CABEÇALHO DIMOB ===
  const cnpj = empresa.document.replace(/\D/g, '')
  const totalGeralAnual = dimobContracts.reduce((sum, c) => sum + c.totalAnual, 0)
  
  // Linha DIMOB (cabeçalho)
  conteudo += 'DIMOB       ' // DIMOB + espaços (12 chars)
  conteudo += ano.toString() // Ano (4 chars)
  conteudo += cnpj // CNPJ (14 chars)
  conteudo += '280' // Código fixo
  conteudo += ' '.repeat(78) // Espaços reservados
  conteudo += totalGeralAnual.toString().padStart(15, '0') // Total geral
  conteudo += '0'.repeat(60) // Zeros reservados
  conteudo += cnpj.slice(-11) // Últimos 11 dígitos do CNPJ
  conteudo += ' '.repeat(89) // Espaços finais
  conteudo += '\n'

  // === REGISTRO R01 (Responsável) ===
  conteudo += 'R01'
  conteudo += cnpj // CNPJ
  conteudo += ano.toString()
  conteudo += '0'.repeat(36) // Zeros reservados
  conteudo += ' '.repeat(76) // Espaços reservados
  conteudo += '0'.repeat(11) // Zeros
  conteudo += ' '.repeat(126) // Espaços reservados
  conteudo += '0'.repeat(4) // Zeros
  conteudo += ' '.repeat(56) // Espaços reservados
  conteudo += '04236958659' // CPF responsável (fixo por enquanto)
  conteudo += '\n'

  // === REGISTROS R02 (Contratos) ===
  dimobContracts.forEach(contrato => {
    conteudo += 'R02'
    conteudo += contrato.cnpjDeclarante // CNPJ (14)
    conteudo += ano.toString() // Ano (4)
    conteudo += '0'.repeat(12) // Zeros reservados
    conteudo += contrato.cpfLocador.padEnd(11, ' ') // CPF locador (11)
    conteudo += '00   ' // Código + espaços (5)
    conteudo += contrato.nomeLocador.padEnd(60, ' ').slice(0, 60) // Nome locador (60)
    conteudo += contrato.cpfLocatario.padEnd(11, ' ') // CPF locatário (11)
    conteudo += '  ' // Espaços (2)
    conteudo += contrato.nomeLocatario.padEnd(60, ' ').slice(0, 60) // Nome locatário (60)
    conteudo += '025' // Código fixo
    conteudo += '46 ' // Código + espaço
    conteudo += contrato.dataInicioContrato // Data início (8)
    
    // Valores mensais (12 meses x 15 posições cada = 180 chars)
    contrato.valoresMensais.forEach(valor => {
      conteudo += valor.toString().padStart(15, '0')
    })
    
    conteudo += contrato.enderecoImovel.padEnd(120, ' ').slice(0, 120) // Endereço (120)
    conteudo += '725422209701' // CEP + código
    conteudo += 'BRASILIA            ' // Cidade (20)
    conteudo += 'DF' // UF (2)
    conteudo += '23' // Código
    conteudo += contrato.cnpjDeclarante.slice(-8) // Final do CNPJ
    conteudo += '\n'
  })

  // === REGISTRO T9 (Totalização) ===
  conteudo += 'T9'
  conteudo += cnpj // CNPJ
  conteudo += ano.toString() // Ano
  conteudo += contratos.length.toString().padStart(8, '0') // Quantidade de contratos
  conteudo += ' '.repeat(82) // Espaços reservados
  conteudo += '2226911536' // Código fixo
  conteudo += '\n'

  // === REGISTRO R1 (Final) ===
  conteudo += 'R1'
  conteudo += cnpj.slice(0, -1) // CNPJ sem último dígito
  conteudo += '0945488657' // Código fixo
  conteudo += '\n'

  // === REGISTRO R9 (Fim de arquivo) ===
  conteudo += 'R9'
  conteudo += cnpj // CNPJ
  conteudo += '0'.repeat(25) // Zeros finais
  conteudo += '\n'

  console.log(`📄 [DIMOB] Arquivo gerado com ${contratos.length} contratos`)
  return conteudo
}

/**
 * Formatar valor monetário para o padrão DIMOB (centavos, sem vírgulas)
 */
function formatarValorDimob(valor: number): string {
  return Math.round(valor * 100).toString().padStart(15, '0')
}

/**
 * Limpar e padronizar documento (CPF/CNPJ)
 */
function limparDocumento(documento: string): string {
  return documento.replace(/\D/g, '').padEnd(11, '0').slice(0, 11)
}