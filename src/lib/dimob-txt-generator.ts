import { prisma } from '@/lib/db'

interface DimobData {
  empresa: {
    cnpj: string
    nome: string
    endereco: string
    uf: string
    codigoMunicipio: string
    cpfResponsavel: string
  }
  contratos: Array<{
    sequencial: number
    locador: {
      documento: string
      nome: string
    }
    locatario: {
      documento: string
      nome: string
    }
    contrato: {
      numero: string
      data: string
    }
    valoresMensais: Array<{
      mes: number
      aluguel: number
      comissao: number
      imposto: number
    }>
    imovel: {
      tipo: string
      endereco: string
      cep: string
      codigoMunicipio: string
      uf: string
    }
  }>
}

/**
 * Gera arquivo DIMOB seguindo EXATAMENTE a especificação oficial da Basesoft
 */
export async function gerarArquivoDimobTxt(userId: string, ano: number, ownerId?: string): Promise<string> {
  console.log(`📄 [DIMOB OFICIAL] Gerando arquivo para ano ${ano}, usuário ${userId}${ownerId ? `, proprietário ${ownerId}` : ''}`)
  console.log(`📅 [DIMOB] Buscando pagamentos entre: ${new Date(ano, 0, 1).toISOString().slice(0, 10)} e ${new Date(ano, 11, 31).toISOString().slice(0, 10)}`)

  // Buscar dados da empresa declarante
  const empresa = await prisma.company.findFirst({
    where: {
      users: { some: { id: userId } }
    },
    include: {
      users: {
        where: { id: userId },
        select: { id: true, email: true }
      }
    }
  })

  if (!empresa) {
    throw new Error('Empresa não encontrada para gerar DIMOB')
  }

  // Buscar contratos ativos com pagamentos do ano (filtrado por proprietário se especificado)
  const whereCondition: any = {
    userId: userId,
    status: 'ACTIVE',
    payments: {
      some: {
        status: 'PAID',
        dueDate: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31)
        }
      }
    }
  }

  // Se ownerId foi especificado, filtrar apenas contratos deste proprietário
  if (ownerId) {
    whereCondition.property = {
      ownerId: ownerId
    }
  }

  const contratos = await prisma.contract.findMany({
    where: whereCondition,
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

  console.log(`📄 [DIMOB] Encontrados ${contratos.length} contratos com pagamentos${ownerId ? ' para o proprietário especificado' : ''}`)
  
  // ✅ VALIDAÇÃO CRÍTICA: Filtrar contratos sem pagamentos válidos
  const contratosValidos = contratos.filter(contrato => {
    const temPagamentos = contrato.payments.length > 0
    if (!temPagamentos) {
      console.log(`⚠️ [DIMOB] Contrato ${contrato.id} ignorado: sem pagamentos válidos`)
    }
    return temPagamentos
  })
  
  console.log(`✅ [DIMOB] ${contratosValidos.length} contratos válidos após filtros`)
  
  // Debug: mostrar quantos pagamentos TOTAIS existem para este proprietário/ano (incluindo não-PAID)
  if (contratos.length > 0) {
    const todosPayments = await prisma.payment.findMany({
      where: {
        contract: {
          userId: userId,
          property: ownerId ? { ownerId: ownerId } : undefined
        },
        dueDate: {
          gte: new Date(ano, 0, 1),
          lte: new Date(ano, 11, 31)
        }
      },
      select: {
        status: true,
        dueDate: true,
        amount: true
      },
      orderBy: { dueDate: 'asc' }
    })
    
    console.log(`🔍 [DIMOB DEBUG] Total de pagamentos no ano ${ano}:`, todosPayments.length)
    const statusCount = todosPayments.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`📊 [DIMOB DEBUG] Por status:`, statusCount)
    
    // Mostrar primeiros e últimos pagamentos
    if (todosPayments.length > 0) {
      console.log(`📅 [DIMOB DEBUG] Primeiro pagamento: ${todosPayments[0].dueDate.toISOString().slice(0, 10)} (${todosPayments[0].status})`)
      console.log(`📅 [DIMOB DEBUG] Último pagamento: ${todosPayments[todosPayments.length-1].dueDate.toISOString().slice(0, 10)} (${todosPayments[todosPayments.length-1].status})`)
    }
  }

  if (contratosValidos.length === 0) {
    const errorMsg = ownerId 
      ? 'Nenhum contrato com pagamentos encontrado para este proprietário no ano especificado'
      : 'Nenhum contrato com pagamentos encontrado para o ano especificado'
    throw new Error(errorMsg)
  }

  // Validar dados obrigatórios antes de gerar
  await validarDadosDimob(empresa, contratosValidos)

  // Preparar dados estruturados
  const dimobData: DimobData = {
    empresa: {
      cnpj: limparDocumento(empresa.document, 14),
      nome: empresa.name || empresa.tradeName || 'EMPRESA',
      endereco: empresa.address || 'ENDERECO NAO INFORMADO',
      uf: empresa.state || 'DF',
      codigoMunicipio: '    ', // 4 espaços em branco
      cpfResponsavel: empresa.responsibleCpf || '00000000000'
    },
    contratos: contratosValidos.map((contrato, index) => {
      // Calcular valores mensais
      console.log(`📊 [DIMOB] Contrato ${index + 1}:`)
      console.log(`  📅 Início: ${contrato.startDate.toISOString().slice(0, 10)}`)
      console.log(`  📊 Taxa admin: ${contrato.administrationFeePercentage}%`)
      console.log(`  💰 Pagamentos encontrados: ${contrato.payments.length}`)
      
      // 🚨 DEBUG CRÍTICO: Mostrar TODOS os detalhes dos pagamentos
      console.log(`  🔍 [DIMOB DEBUG] CONTRATO ${contrato.id}:`)
      console.log(`  📅 Total de pagamentos encontrados: ${contrato.payments.length}`)
      
      contrato.payments.forEach((p, i) => {
        const dataFormatada = p.dueDate.toISOString().slice(0, 10)
        const mesJS = p.dueDate.getMonth() // 0-11
        const mesReal = p.dueDate.getMonth() + 1 // 1-12
        const ano = p.dueDate.getFullYear()
        
        console.log(`  💰 Pagamento ${i + 1}:`)
        console.log(`    📅 Data: ${dataFormatada}`)
        console.log(`    🗓️  Mês JS (0-11): ${mesJS}`)
        console.log(`    🗓️  Mês Real (1-12): ${mesReal}`)
        console.log(`    📊 Ano: ${ano}`)
        console.log(`    💵 Valor: R$ ${p.amount}`)
        console.log(`    ✅ Status: ${p.status}`)
        console.log('    ---')
      })
      
      // CORREÇÃO CRÍTICA: Só incluir meses com pagamentos reais para evitar zeros na Receita Federal
      const mesesComPagamentos = new Set(contrato.payments.map(p => p.dueDate.getMonth()))
      console.log(`  🎯 Meses com pagamentos: [${Array.from(mesesComPagamentos).map(m => m + 1).join(', ')}]`)
      
      console.log(`  🔢 [DIMOB DEBUG] Processando 12 meses para contrato ${contrato.id}:`)
      
      const valoresMensais = Array.from({ length: 12 }, (_, mes) => {
        const pagamentosDoMes = contrato.payments.filter(p => p.dueDate.getMonth() === mes)
        const totalAluguel = pagamentosDoMes.reduce((acc, p) => acc + p.amount, 0)
        const totalComissao = totalAluguel * (contrato.administrationFeePercentage / 100)
        
        console.log(`  📊 [MÊS ${mes + 1}]:`)
        console.log(`    🔍 Filtro: p.dueDate.getMonth() === ${mes}`)
        console.log(`    💰 Pagamentos encontrados: ${pagamentosDoMes.length}`)
        
        if (pagamentosDoMes.length > 0) {
          pagamentosDoMes.forEach((p, idx) => {
            console.log(`      💵 Pag ${idx + 1}: ${p.dueDate.toISOString().slice(0, 10)} - R$ ${p.amount}`)
          })
        }
        
        console.log(`    💰 Total Aluguel: R$ ${totalAluguel}`)
        console.log(`    💼 Comissão (${contrato.administrationFeePercentage}%): R$ ${totalComissao.toFixed(2)}`)
        console.log(`    ---`)
        
        return {
          mes: mes + 1, // mês 1-12 para referência
          aluguel: Math.round(totalAluguel * 100), // em centavos
          comissao: Math.round(totalComissao * 100), // em centavos
          imposto: 0 // normalmente zero para PF
        }
      }) // MANTER TODOS OS 12 MESES (com zeros onde necessário)

      // 🚨 VALIDAÇÃO OBRIGATÓRIA: Garantir que temos EXATAMENTE 12 meses
      if (valoresMensais.length !== 12) {
        console.error(`❌ [DIMOB] ERRO CRÍTICO: valoresMensais tem ${valoresMensais.length} meses, deve ter 12!`)
        throw new Error(`DIMOB: Array deve ter 12 meses, encontrado: ${valoresMensais.length}`)
      }
      
      // Validar se os meses estão na ordem correta (1 a 12)
      valoresMensais.forEach((mes, index) => {
        if (mes.mes !== index + 1) {
          console.error(`❌ [DIMOB] ERRO: Mês na posição ${index} deve ser ${index + 1}, encontrado: ${mes.mes}`)
          throw new Error(`DIMOB: Mês fora de ordem na posição ${index}`)
        }
      })
      
      console.log(`✅ [DIMOB] Validação OK: 12 meses completos em ordem correta`)

      return {
        sequencial: index + 1,
        locador: {
          documento: formatarCpfCnpj(contrato.property.owner.document || ''),
          nome: contrato.property.owner.name.toUpperCase()
        },
        locatario: {
          documento: formatarCpfCnpjAlfa(contrato.tenant.document || ''),
          nome: contrato.tenant.name.toUpperCase()
        },
        contrato: {
          numero: contrato.id.slice(-6), // últimos 6 chars do ID
          data: formatarData(contrato.startDate)
        },
        valoresMensais,
        imovel: {
          tipo: contrato.property.dimobPropertyType || 'U',
          endereco: contrato.property.address?.toUpperCase() || 'ENDERECO NAO INFORMADO',
          cep: '72000000', // CEP válido Brasília (faixa 70000-76999)
          codigoMunicipio: '9701', // Código oficial Brasília
          uf: contrato.property.state || 'DF'
        }
      }
    })
  }

  // Gerar conteúdo do arquivo seguindo a especificação EXATA
  return gerarConteudoDimob(dimobData, ano)
}

/**
 * Gera o conteúdo do arquivo seguindo a especificação oficial da Basesoft
 */
function gerarConteudoDimob(data: DimobData, ano: number): string {
  let conteudo = ''

  // === HEADER DA DECLARAÇÃO ===
  conteudo += 'DIMOB' // Sistema (5 posições)
  conteudo += ' '.repeat(369) // Reservado (369 espaços)
  conteudo += '\r\n' // EOL

  // === R01 - DADOS INICIAIS ===
  conteudo += 'R01' // Tipo (3 posições)
  conteudo += data.empresa.cnpj // CNPJ declarante (14 posições)
  conteudo += ano.toString() // Ano-calendário (4 posições)
  conteudo += '0' // Declaração Retificadora (1 posição)
  conteudo += '0'.repeat(10) // Número do Recibo (10 posições)
  conteudo += '0' // Situação Especial (1 posição)
  conteudo += '0'.repeat(8) // Data evento (8 posições)
  conteudo += '00' // Código situação (2 posições)
  conteudo += data.empresa.nome.padEnd(60, ' ').slice(0, 60) // Nome Empresarial (60 posições)
  conteudo += limparDocumento(data.empresa.cpfResponsavel, 11) // CPF Responsável (11 posições)
  conteudo += data.empresa.endereco.padEnd(120, ' ').slice(0, 120) // Endereço (120 posições)
  conteudo += data.empresa.uf.padEnd(2, ' ').slice(0, 2) // UF (2 posições)
  conteudo += '9701' // Código Município Brasília (posições 237-240)
  conteudo += ' '.repeat(20) // Reservado (20 posições)
  conteudo += ' '.repeat(10) // Reservado (10 posições)
  
  // Validar tamanho R01 (deve ter 272 chars sem EOL)
  const r01Length = conteudo.split('\r\n')[1].length
  console.log(`📏 [DIMOB] Tamanho R01: ${r01Length} chars (deve ser 272)`)
  if (r01Length !== 272) {
    console.error(`❌ [DIMOB] R01 com tamanho incorreto: ${r01Length}, esperado: 272`)
  }
  
  conteudo += '\r\n' // EOL

  // === R02 - LOCAÇÕES (uma para cada contrato) ===
  data.contratos.forEach(contrato => {
    conteudo += 'R02' // Tipo (3 posições)
    conteudo += data.empresa.cnpj // CNPJ declarante (14 posições)
    conteudo += ano.toString() // Ano-calendário (4 posições)
    conteudo += contrato.sequencial.toString().padStart(7, '0') // Sequencial (7 posições)
    conteudo += contrato.locador.documento // CPF/CNPJ Locador (14 posições)
    conteudo += contrato.locador.nome.padEnd(60, ' ').slice(0, 60) // Nome Locador (60 posições)
    conteudo += contrato.locatario.documento // CPF/CNPJ Locatário (14 posições)
    conteudo += contrato.locatario.nome.padEnd(60, ' ').slice(0, 60) // Nome Locatário (60 posições)
    conteudo += contrato.contrato.numero.padEnd(6, ' ').slice(0, 6) // Número Contrato (6 posições)
    conteudo += contrato.contrato.data // Data Contrato (8 posições)
    
    // 🚨 VALIDAÇÃO FINAL: Confirmar 12 meses antes de gerar arquivo
    if (contrato.valoresMensais.length !== 12) {
      console.error(`❌ [DIMOB] CONTRATO ${contrato.sequencial}: ${contrato.valoresMensais.length} meses, deve ser 12!`)
      throw new Error(`DIMOB Contrato ${contrato.sequencial}: Deve ter 12 meses, encontrado: ${contrato.valoresMensais.length}`)
    }
    
    console.log(`  📊 [DIMOB] Contrato ${contrato.sequencial}: CONFIRMADO 12 meses completos`)
    
    // 🚨 CORREÇÃO: DIMOB exige exatamente 36 campos (12 meses × 3 valores)
    // valoresMensais já contém todos os 12 meses na ordem correta (Jan=1 a Dez=12)
    contrato.valoresMensais.forEach((mes) => {
      if (mes.aluguel > 0 || mes.comissao > 0) {
        console.log(`  ✅ [DIMOB] Mês ${mes.mes}: R$ ${mes.aluguel/100} (R$ ${mes.comissao/100} comissão)`)
      }
      conteudo += formatarValorR$(mes.aluguel) // Aluguel (14 posições)
      conteudo += formatarValorR$(mes.comissao) // Comissão (14 posições) 
      conteudo += formatarValorR$(mes.imposto) // Imposto (14 posições)
    })
    
    console.log(`  📄 [DIMOB] FORMATO CORRETO: 36 campos incluídos (12 meses obrigatórios)`)
    
    conteudo += contrato.imovel.tipo // Tipo Imóvel (1 posição)
    conteudo += contrato.imovel.endereco.padEnd(60, ' ').slice(0, 60) // Endereço (60 posições)
    conteudo += contrato.imovel.cep.padStart(8, '0').slice(0, 8) // CEP (8 posições)
    conteudo += '9701' // Código Município Brasília (posições 764-767)
    conteudo += ' '.repeat(20) // Reservado (20 posições)
    conteudo += contrato.imovel.uf.padEnd(2, ' ').slice(0, 2) // UF (2 posições)
    conteudo += ' '.repeat(10) // Reservado (10 posições)
    conteudo += '\r\n' // EOL
  })

  // === T9 - TRAILER ===
  conteudo += 'T9' // Tipo (2 posições)
  conteudo += ' '.repeat(100) // Reservado (100 espaços)
  conteudo += '\r\n' // EOL

  console.log(`📄 [DIMOB] Arquivo gerado: ${conteudo.split('\r\n').length - 1} linhas, ${data.contratos.length} contratos`)
  return conteudo
}

/**
 * Formatar valor no padrão R$ do DIMOB (14 posições, centavos, zeros à esquerda)
 */
function formatarValorR$(centavos: number): string {
  return centavos.toString().padStart(14, '0')
}

/**
 * Formatar CPF/CNPJ para 14 posições (CNPJ completo ou CPF alinhado à esquerda)
 */
function formatarCpfCnpj(documento: string): string {
  const limpo = documento.replace(/\D/g, '')
  if (limpo.length === 14) {
    return limpo // CNPJ
  } else {
    return limpo.padStart(11, '0').padEnd(14, ' ') // CPF alinhado à esquerda
  }
}

/**
 * Formatar CPF/CNPJ alfanumérico para locatário (pode aceitar NDP)
 */
function formatarCpfCnpjAlfa(documento: string): string {
  const limpo = documento.replace(/\D/g, '')
  if (limpo.length === 14) {
    return limpo // CNPJ
  } else {
    return limpo.padStart(11, '0').padEnd(14, ' ') // CPF alinhado à esquerda
  }
}

/**
 * Limpar documento removendo caracteres não numéricos
 */
function limparDocumento(documento: string, tamanho: number): string {
  return documento.replace(/\D/g, '').padStart(tamanho, '0')
}

/**
 * Formatar data no padrão DDMMAAAA
 */
function formatarData(data: Date): string {
  const dia = data.getDate().toString().padStart(2, '0')
  const mes = (data.getMonth() + 1).toString().padStart(2, '0')
  const ano = data.getFullYear().toString()
  return `${dia}${mes}${ano}`
}

/**
 * Extrair CEP do endereço (busca padrão 00000-000)
 */
function extrairCep(endereco: string): string {
  const match = endereco.match(/\d{5}-?\d{3}/)
  if (match) {
    return match[0].replace('-', '').padStart(8, '0')
  }
  return '72000000' // CEP válido Brasília
}


/**
 * Validar se todos os campos obrigatórios para DIMOB estão preenchidos
 */
async function validarDadosDimob(empresa: any, contratos: any[]): Promise<void> {
  const erros: string[] = []

  // Validar dados da empresa
  if (!empresa.responsibleCpf) {
    erros.push('❌ CPF do responsável da empresa não informado (obrigatório DIMOB)')
  }
  if (!empresa.municipalityCode) {
    erros.push('❌ Código do município da empresa não informado (obrigatório DIMOB)')
  }
  if (!empresa.document || empresa.document.length < 14) {
    erros.push('❌ CNPJ da empresa inválido (obrigatório DIMOB)')
  }

  // Validar dados dos contratos
  contratos.forEach((contrato, index) => {
    const numero = index + 1

    // Validar proprietário
    if (!contrato.property.owner.document) {
      erros.push(`❌ Contrato ${numero}: CPF/CNPJ do proprietário não informado`)
    }
    if (!contrato.property.owner.name) {
      erros.push(`❌ Contrato ${numero}: Nome do proprietário não informado`)
    }

    // Validar inquilino
    if (!contrato.tenant.document) {
      erros.push(`❌ Contrato ${numero}: CPF/CNPJ do inquilino não informado`)
    }
    if (!contrato.tenant.name) {
      erros.push(`❌ Contrato ${numero}: Nome do inquilino não informado`)
    }

    // Validar imóvel
    if (!contrato.property.dimobPropertyType) {
      erros.push(`❌ Contrato ${numero}: Tipo do imóvel (Urbano/Rural) não informado`)
    }
    if (!contrato.property.municipalityCode) {
      erros.push(`❌ Contrato ${numero}: Código do município do imóvel não informado`)
    }
    if (!contrato.property.extractedCep && !extrairCep(contrato.property.address)) {
      erros.push(`❌ Contrato ${numero}: CEP do imóvel não pode ser extraído do endereço`)
    }

    // Validar se tem pagamentos
    if (contrato.payments.length === 0) {
      erros.push(`❌ Contrato ${numero}: Nenhum pagamento encontrado`)
    }
  })

  // Se houver erros, lançar exceção com todos os problemas
  if (erros.length > 0) {
    const mensagem = [
      '🚨 DADOS OBRIGATÓRIOS FALTANDO PARA DIMOB:',
      '',
      ...erros,
      '',
      '💡 SOLUÇÃO: Complete os dados faltantes antes de gerar o arquivo DIMOB.',
      '   Acesse as configurações da empresa e cadastro dos imóveis para preencher os campos obrigatórios.'
    ].join('\n')
    
    throw new Error(mensagem)
  }
}