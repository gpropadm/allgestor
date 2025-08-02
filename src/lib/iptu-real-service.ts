// Serviço real de consulta IPTU usando API oficial
export class IPTURealService {
  private baseUrl = 'https://api.infosimples.com/api/v2/consultas/sefaz-df-iptu';
  private apiToken: string;

  constructor() {
    this.apiToken = process.env.INFOSIMPLES_API_TOKEN || '';
  }

  async consultarIPTU(inscricaoImobiliaria: string): Promise<any> {
    if (!this.apiToken) {
      throw new Error('INFOSIMPLES_API_TOKEN não configurado');
    }

    try {
      console.log(`Consultando IPTU real para inscrição: ${inscricaoImobiliaria}`);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          inscricao_imobiliaria: inscricaoImobiliaria,
          timeout: 30000
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Verificar se a consulta foi bem-sucedida
      if (data.code !== 200) {
        throw new Error(`Erro na consulta: ${data.code} - ${data.message || 'Erro desconhecido'}`);
      }

      return this.processarDadosIPTU(data.data, inscricaoImobiliaria);

    } catch (error) {
      console.error('Erro ao consultar IPTU real:', error);
      throw error;
    }
  }

  private processarDadosIPTU(dadosAPI: any, inscricaoImobiliaria: string) {
    // Processar dados reais da API
    const dados = {
      propertyCode: inscricaoImobiliaria,
      state: 'Distrito Federal',
      source: 'SEFAZ-DF (Dados Oficiais)',
      extractedAt: new Date(),
      
      // Dados básicos do imóvel
      proprietario: dadosAPI.proprietario || 'Não informado',
      endereco: dadosAPI.endereco || 'Não informado',
      bairro: dadosAPI.bairro || 'Não informado',
      
      // Dados do IPTU
      valorVenal: dadosAPI.valor_venal || 0,
      areaTerreno: dadosAPI.area_terreno || 'Não informado',
      areaConstruida: dadosAPI.area_construida || 'Não informado',
      
      // Situação fiscal
      situacaoFiscal: dadosAPI.situacao_fiscal || 'Não informado',
      debitosVencidos: dadosAPI.debitos_vencidos || [],
      
      // Valores atuais
      annualValue: dadosAPI.valor_iptu_anual || 0,
      valorCota: dadosAPI.valor_cota || 0,
      numeroCota: dadosAPI.numero_cota || 1,
      
      // Vencimentos
      dueDate: dadosAPI.vencimento_cota || new Date().toISOString().split('T')[0],
      
      // Status baseado na situação fiscal
      status: this.determinarStatus(dadosAPI),
      
      // Parcelas (se disponível)
      installments: this.processarParcelas(dadosAPI),
      
      // Informações adicionais
      inscricaoImobiliaria: inscricaoImobiliaria,
      codigoLogradouro: dadosAPI.codigo_logradouro || 'Não informado',
      complemento: dadosAPI.complemento || '',
      
      // Dados técnicos
      fracaoIdeal: dadosAPI.fracao_ideal || 'Não informado',
      testadaPrincipal: dadosAPI.testada_principal || 'Não informado',
      
      // Observações importantes
      observacoes: [
        'Dados obtidos diretamente da SEFAZ-DF',
        'Informações atualizadas em tempo real',
        'Para pagamento, utilize os canais oficiais do GDF'
      ]
    };

    return dados;
  }

  private determinarStatus(dadosAPI: any): string {
    if (dadosAPI.debitos_vencidos && dadosAPI.debitos_vencidos.length > 0) {
      return 'Pendente - Com débitos em atraso';
    }
    
    if (dadosAPI.situacao_fiscal) {
      const situacao = dadosAPI.situacao_fiscal.toLowerCase();
      if (situacao.includes('quite') || situacao.includes('adimplente')) {
        return 'Em dia';
      }
      if (situacao.includes('pendente') || situacao.includes('devedor')) {
        return 'Pendente';
      }
    }
    
    return 'Consultar situação no site oficial';
  }

  private processarParcelas(dadosAPI: any): any[] {
    const parcelas = [];
    
    // Se tem cota única
    if (dadosAPI.valor_cota && dadosAPI.vencimento_cota) {
      parcelas.push({
        parcela: 1,
        tipo: 'Cota única',
        valor: dadosAPI.valor_cota,
        vencimento: dadosAPI.vencimento_cota,
        status: 'Vigente'
      });
    }
    
    // Se tem parcelamento
    if (dadosAPI.parcelas && Array.isArray(dadosAPI.parcelas)) {
      dadosAPI.parcelas.forEach((parcela: any, index: number) => {
        parcelas.push({
          parcela: index + 1,
          tipo: 'Parcelado',
          valor: parcela.valor || 0,
          vencimento: parcela.vencimento || '',
          status: parcela.status || 'Vigente'
        });
      });
    }
    
    return parcelas;
  }

  // Método para testar a API
  async testarConexao(): Promise<boolean> {
    try {
      // Fazer uma consulta de teste com uma inscrição fictícia
      await this.consultarIPTU('00000000001');
      return true;
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      return false;
    }
  }

  // Método para validar formato da inscrição imobiliária
  static validarInscricaoImobiliaria(inscricao: string): boolean {
    // Remove caracteres não numéricos
    const apenasNumeros = inscricao.replace(/\D/g, '');
    
    // Inscrição imobiliária do DF geralmente tem 11 dígitos
    return apenasNumeros.length >= 8 && apenasNumeros.length <= 15;
  }

  // Método para formatar inscrição imobiliária
  static formatarInscricaoImobiliaria(inscricao: string): string {
    const apenasNumeros = inscricao.replace(/\D/g, '');
    
    // Formato comum: XX.XXX.XXX-X
    if (apenasNumeros.length === 11) {
      return `${apenasNumeros.substring(0, 2)}.${apenasNumeros.substring(2, 5)}.${apenasNumeros.substring(5, 8)}-${apenasNumeros.substring(8)}`;
    }
    
    return apenasNumeros;
  }
}

export default IPTURealService;