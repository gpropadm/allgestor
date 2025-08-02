'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function AgentQLDashboard() {
  const [activeTab, setActiveTab] = useState('leads');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Função para formatar preço com máscara
  const formatPrice = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Converte para número e formata
    if (numbers === '') return '';
    
    const number = parseInt(numbers);
    return number.toLocaleString('pt-BR');
  };

  // Função para converter preço formatado de volta para número
  const parsePrice = (formattedValue: string): number => {
    const numbers = formattedValue.replace(/\D/g, '');
    return numbers === '' ? 0 : parseInt(numbers);
  };

  // Estados para cada funcionalidade
  const [leadCapture, setLeadCapture] = useState({
    propertyType: 'APARTMENT',
    transactionType: 'RENT',
    location: '',
    priceMin: 0,
    priceMax: 5000,
    bedrooms: '',
    bathrooms: '',
    area: '',
    portals: ['olx']
  });

  // Estados para campos formatados
  const [priceMinFormatted, setPriceMinFormatted] = useState('');
  const [priceMaxFormatted, setPriceMaxFormatted] = useState('5.000');

  const [registryExtract, setRegistryExtract] = useState({
    registryNumber: '',
    city: 'São Paulo'
  });

  const [iptuExtract, setIptuExtract] = useState({
    propertyCode: '',
    city: 'São Paulo'
  });

  const [marketMonitor, setMarketMonitor] = useState({
    propertyType: 'APARTMENT',
    location: '',
    priceRange: { min: 0, max: 0 }
  });

  const [syncConfig, setSyncConfig] = useState({
    enabled: false,
    portals: ['olx'],
    interval: 60
  });

  const [publishData, setPublishData] = useState({
    title: '',
    description: '',
    price: 0,
    type: 'APARTMENT',
    location: '',
    portals: ['olx']
  });

  const handleLeadCapture = async () => {
    if (!leadCapture.location) {
      alert('Digite a localização desejada');
      return;
    }

    if (leadCapture.priceMax <= leadCapture.priceMin) {
      alert('Preço máximo deve ser maior que o mínimo');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchCriteria: leadCapture,
          portals: leadCapture.portals
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao capturar leads');
    }
    setLoading(false);
  };

  const handleRegistryExtract = async () => {
    if (!registryExtract.registryNumber) {
      alert('Digite o número da matrícula');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/registry/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registryExtract)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao extrair dados do cartório');
    }
    setLoading(false);
  };

  const handleIPTUExtract = async () => {
    if (!iptuExtract.propertyCode) {
      alert('Digite o código do imóvel');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/iptu/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iptuExtract)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao extrair dados do IPTU');
    }
    setLoading(false);
  };

  const handleMarketMonitor = async () => {
    if (!marketMonitor.location) {
      alert('Digite a localização para análise');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/market/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(marketMonitor)
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro no monitoramento de mercado');
    }
    setLoading(false);
  };

  const handleSyncSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agentql/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', config: syncConfig })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao configurar sincronização');
    }
    setLoading(false);
  };

  const handleStartSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agentql/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar sincronização');
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!publishData.title || !publishData.price) {
      alert('Título e preço são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/agentql/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          propertyData: publishData, 
          portals: publishData.portals 
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao publicar propriedade');
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'leads', name: 'Captura de Leads', icon: '🎯' },
    { id: 'registry', name: 'Dados Cartório', icon: '📋' },
    { id: 'iptu', name: 'Consulta IPTU', icon: '🏠' },
    { id: 'market', name: 'Monitor Mercado', icon: '📊' },
    { id: 'sync', name: 'Sincronização', icon: '🔄' },
    { id: 'publish', name: 'Publicar', icon: '📢' }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">AgentQL Dashboard</h1>
          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            IA Powered
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulários */}
          <div className="bg-white p-6 rounded-lg shadow">
            {activeTab === 'leads' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Buscar Imóveis nos Portais</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Busca Inteligente</h4>
                  <p className="text-blue-700 text-sm">
                    Configure seus critérios e buscaremos automaticamente em todos os portais selecionados
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Imóvel
                    </label>
                    <select
                      value={leadCapture.propertyType}
                      onChange={(e) => setLeadCapture({...leadCapture, propertyType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="APARTMENT">Apartamento</option>
                      <option value="HOUSE">Casa</option>
                      <option value="COMMERCIAL">Comercial</option>
                      <option value="LAND">Terreno</option>
                      <option value="STUDIO">Quitinete</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Finalidade
                    </label>
                    <select
                      value={leadCapture.transactionType}
                      onChange={(e) => setLeadCapture({...leadCapture, transactionType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="RENT">Aluguel</option>
                      <option value="SALE">Venda</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={leadCapture.location}
                    onChange={(e) => setLeadCapture({...leadCapture, location: e.target.value})}
                    placeholder="Ex: Vila Madalena, São Paulo ou Copacabana, RJ"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Mín (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="text"
                        value={priceMinFormatted}
                        onChange={(e) => {
                          const formatted = formatPrice(e.target.value);
                          setPriceMinFormatted(formatted);
                          setLeadCapture({...leadCapture, priceMin: parsePrice(formatted)});
                        }}
                        placeholder="500"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Máx (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">R$</span>
                      <input
                        type="text"
                        value={priceMaxFormatted}
                        onChange={(e) => {
                          const formatted = formatPrice(e.target.value);
                          setPriceMaxFormatted(formatted);
                          setLeadCapture({...leadCapture, priceMax: parsePrice(formatted)});
                        }}
                        placeholder="5.000"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quartos
                    </label>
                    <select
                      value={leadCapture.bedrooms}
                      onChange={(e) => setLeadCapture({...leadCapture, bedrooms: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Qualquer</option>
                      <option value="1">1 quarto</option>
                      <option value="2">2 quartos</option>
                      <option value="3">3 quartos</option>
                      <option value="4+">4+ quartos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banheiros
                    </label>
                    <select
                      value={leadCapture.bathrooms}
                      onChange={(e) => setLeadCapture({...leadCapture, bathrooms: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Qualquer</option>
                      <option value="1">1 banheiro</option>
                      <option value="2">2 banheiros</option>
                      <option value="3+">3+ banheiros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área (m²)
                    </label>
                    <input
                      type="number"
                      value={leadCapture.area}
                      onChange={(e) => setLeadCapture({...leadCapture, area: e.target.value})}
                      placeholder="Ex: 50"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portais para Buscar
                  </label>
                  <div className="space-y-2">
                    {['olx', 'zapimoveis', 'vivareal'].map(portal => (
                      <label key={portal} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={leadCapture.portals.includes(portal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLeadCapture({
                                ...leadCapture, 
                                portals: [...leadCapture.portals, portal]
                              });
                            } else {
                              setLeadCapture({
                                ...leadCapture, 
                                portals: leadCapture.portals.filter(p => p !== portal)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          {portal === 'zapimoveis' ? 'ZAP Imóveis' : portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleLeadCapture}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Buscando...' : `Buscar em ${leadCapture.portals.length} Portal(is)`}
                </button>
              </div>
            )}

            {activeTab === 'registry' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Extrair Dados do Cartório</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da Matrícula
                  </label>
                  <input
                    type="text"
                    value={registryExtract.registryNumber}
                    onChange={(e) => setRegistryExtract({...registryExtract, registryNumber: e.target.value})}
                    placeholder="Ex: 123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <select
                    value={registryExtract.city}
                    onChange={(e) => setRegistryExtract({...registryExtract, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="São Paulo">São Paulo</option>
                    <option value="Rio de Janeiro">Rio de Janeiro</option>
                    <option value="Belo Horizonte">Belo Horizonte</option>
                  </select>
                </div>

                <button
                  onClick={handleRegistryExtract}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Extraindo...' : 'Extrair Dados'}
                </button>
              </div>
            )}

            {activeTab === 'iptu' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Consultar IPTU</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Imóvel
                  </label>
                  <input
                    type="text"
                    value={iptuExtract.propertyCode}
                    onChange={(e) => setIptuExtract({...iptuExtract, propertyCode: e.target.value})}
                    placeholder="Ex: 12345-6789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={iptuExtract.city}
                    onChange={(e) => setIptuExtract({...iptuExtract, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <optgroup label="Região Norte">
                      <option value="Acre">Acre (AC)</option>
                      <option value="Amapá">Amapá (AP)</option>
                      <option value="Amazonas">Amazonas (AM)</option>
                      <option value="Pará">Pará (PA)</option>
                      <option value="Rondônia">Rondônia (RO)</option>
                      <option value="Roraima">Roraima (RR)</option>
                      <option value="Tocantins">Tocantins (TO)</option>
                    </optgroup>
                    
                    <optgroup label="Região Nordeste">
                      <option value="Alagoas">Alagoas (AL)</option>
                      <option value="Bahia">Bahia (BA)</option>
                      <option value="Ceará">Ceará (CE)</option>
                      <option value="Maranhão">Maranhão (MA)</option>
                      <option value="Paraíba">Paraíba (PB)</option>
                      <option value="Pernambuco">Pernambuco (PE)</option>
                      <option value="Piauí">Piauí (PI)</option>
                      <option value="Rio Grande do Norte">Rio Grande do Norte (RN)</option>
                      <option value="Sergipe">Sergipe (SE)</option>
                    </optgroup>
                    
                    <optgroup label="Região Centro-Oeste">
                      <option value="Distrito Federal">Distrito Federal (DF)</option>
                      <option value="Goiás">Goiás (GO)</option>
                      <option value="Mato Grosso">Mato Grosso (MT)</option>
                      <option value="Mato Grosso do Sul">Mato Grosso do Sul (MS)</option>
                    </optgroup>
                    
                    <optgroup label="Região Sudeste">
                      <option value="Espírito Santo">Espírito Santo (ES)</option>
                      <option value="Minas Gerais">Minas Gerais (MG)</option>
                      <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
                      <option value="São Paulo">São Paulo (SP)</option>
                    </optgroup>
                    
                    <optgroup label="Região Sul">
                      <option value="Paraná">Paraná (PR)</option>
                      <option value="Rio Grande do Sul">Rio Grande do Sul (RS)</option>
                      <option value="Santa Catarina">Santa Catarina (SC)</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Cobertura nacional - todos os 26 estados + DF
                  </p>
                </div>

                <button
                  onClick={handleIPTUExtract}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Consultando...' : 'Consultar IPTU'}
                </button>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Monitor de Mercado</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Imóvel
                  </label>
                  <select
                    value={marketMonitor.propertyType}
                    onChange={(e) => setMarketMonitor({...marketMonitor, propertyType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="APARTMENT">Apartamento</option>
                    <option value="HOUSE">Casa</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="LAND">Terreno</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={marketMonitor.location}
                    onChange={(e) => setMarketMonitor({...marketMonitor, location: e.target.value})}
                    placeholder="Ex: Vila Madalena, SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Mín (R$)
                    </label>
                    <input
                      type="number"
                      value={marketMonitor.priceRange.min}
                      onChange={(e) => setMarketMonitor({
                        ...marketMonitor, 
                        priceRange: {...marketMonitor.priceRange, min: Number(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Máx (R$)
                    </label>
                    <input
                      type="number"
                      value={marketMonitor.priceRange.max}
                      onChange={(e) => setMarketMonitor({
                        ...marketMonitor, 
                        priceRange: {...marketMonitor.priceRange, max: Number(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <button
                  onClick={handleMarketMonitor}
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Analisando...' : 'Analisar Mercado'}
                </button>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurar Sincronização Automática</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Sincronização Inteligente</h4>
                  <p className="text-blue-700 text-sm">
                    Configure a captura automática de leads e monitoramento de mercado em tempo real.
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={syncConfig.enabled}
                      onChange={(e) => setSyncConfig({...syncConfig, enabled: e.target.checked})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Ativar sincronização automática
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portais para Monitorar
                  </label>
                  <div className="space-y-2">
                    {['olx', 'zapimoveis', 'vivareal'].map(portal => (
                      <label key={portal} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={syncConfig.portals.includes(portal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSyncConfig({
                                ...syncConfig, 
                                portals: [...syncConfig.portals, portal]
                              });
                            } else {
                              setSyncConfig({
                                ...syncConfig, 
                                portals: syncConfig.portals.filter(p => p !== portal)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {portal === 'zapimoveis' ? 'ZAP Imóveis' : portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervalo de Sincronização
                  </label>
                  <select
                    value={syncConfig.interval}
                    onChange={(e) => setSyncConfig({...syncConfig, interval: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={180}>3 horas</option>
                    <option value={360}>6 horas</option>
                    <option value={720}>12 horas</option>
                    <option value={1440}>24 horas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSyncSetup}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Configurando...' : 'Configurar Sync'}
                  </button>
                  <button
                    onClick={handleStartSync}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Executando...' : 'Executar Agora'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'publish' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Publicar em Múltiplos Portais</h3>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Publicação Cruzada</h4>
                  <p className="text-purple-700 text-sm">
                    Publique sua propriedade simultaneamente em vários portais imobiliários.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Anúncio
                  </label>
                  <input
                    type="text"
                    value={publishData.title}
                    onChange={(e) => setPublishData({...publishData, title: e.target.value})}
                    placeholder="Ex: Apartamento 2 quartos Vila Madalena"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={publishData.description}
                    onChange={(e) => setPublishData({...publishData, description: e.target.value})}
                    placeholder="Descreva as características do imóvel..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço (R$)
                    </label>
                    <input
                      type="number"
                      value={publishData.price}
                      onChange={(e) => setPublishData({...publishData, price: Number(e.target.value)})}
                      placeholder="2500"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={publishData.type}
                      onChange={(e) => setPublishData({...publishData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="APARTMENT">Apartamento</option>
                      <option value="HOUSE">Casa</option>
                      <option value="COMMERCIAL">Comercial</option>
                      <option value="LAND">Terreno</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={publishData.location}
                    onChange={(e) => setPublishData({...publishData, location: e.target.value})}
                    placeholder="Vila Madalena, São Paulo, SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portais de Destino
                  </label>
                  <div className="space-y-2">
                    {['olx', 'zapimoveis', 'vivareal'].map(portal => (
                      <label key={portal} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={publishData.portals.includes(portal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPublishData({
                                ...publishData, 
                                portals: [...publishData.portals, portal]
                              });
                            } else {
                              setPublishData({
                                ...publishData, 
                                portals: publishData.portals.filter(p => p !== portal)
                              });
                            }
                          }}
                          className="w-4 h-4 text-purple-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {portal === 'zapimoveis' ? 'ZAP Imóveis' : portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handlePublish}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? 'Publicando...' : `Publicar em ${publishData.portals.length} Portal(is)`}
                </button>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Resultados</h3>
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3">Processando...</span>
              </div>
            )}

            {results && !loading && (
              <div className="space-y-4">
                {results.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-red-800">
                      <strong>Erro:</strong> {results.error}
                    </div>
                    {results.details && (
                      <div className="text-red-600 text-sm mt-2">
                        {results.details}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Lead Capture Results */}
                    {results.results && activeTab === 'leads' && (
                      <div>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                          <div className="text-blue-800">
                            <strong>✅ Busca Concluída!</strong> Encontrados {results.totalLeads || 0} imóveis
                          </div>
                          <div className="text-blue-700 text-sm mt-1">
                            Critérios: {results.searchCriteria?.propertyType === 'APARTMENT' ? 'Apartamento' : 
                                       results.searchCriteria?.propertyType === 'HOUSE' ? 'Casa' : 
                                       results.searchCriteria?.propertyType} • {' '}
                            {results.searchCriteria?.transactionType === 'RENT' ? 'Aluguel' : 'Venda'} • {' '}
                            {results.searchCriteria?.location} • {' '}
                            R$ {results.searchCriteria?.priceMin} - R$ {results.searchCriteria?.priceMax}
                          </div>
                        </div>
                        
                        {results.results.map((portalResult: any, index: number) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold capitalize">
                                {portalResult.portal === 'zapimoveis' ? 'ZAP Imóveis' : 
                                 portalResult.portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                              </h4>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                {portalResult.count} imóveis
                              </span>
                            </div>
                            
                            {portalResult.error ? (
                              <div className="text-red-600 text-sm">❌ {portalResult.error}</div>
                            ) : (
                              <div className="space-y-3">
                                {portalResult.leads?.slice(0, 3).map((lead: any, leadIndex: number) => (
                                  <div key={leadIndex} className="border-l-4 border-blue-400 pl-4 py-2 bg-gray-50">
                                    <div className="font-medium text-gray-900">{lead.title}</div>
                                    <div className="text-green-600 font-semibold">R$ {lead.price?.toLocaleString('pt-BR')}</div>
                                    <div className="text-gray-600 text-sm">{lead.location}</div>
                                    {lead.contact && (
                                      <div className="text-blue-600 text-sm">📞 {lead.contact}</div>
                                    )}
                                  </div>
                                ))}
                                {portalResult.count > 3 && (
                                  <div className="text-gray-500 text-sm">
                                    ... e mais {portalResult.count - 3} imóveis
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* IPTU Results */}
                    {results.data && activeTab === 'iptu' && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                          <div className="text-green-800">
                            <strong>✅ Consulta IPTU Realizada!</strong>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600 text-sm">Código do Imóvel:</span>
                              <div className="font-medium">{results.data.propertyCode}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm">Estado:</span>
                              <div className="font-medium">{results.data.state}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm">Valor Anual:</span>
                              <div className="font-medium text-green-600">R$ {results.data.annualValue?.toLocaleString('pt-BR')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm">Status:</span>
                              <div className={`font-medium ${results.data.status === 'Em dia' ? 'text-green-600' : 'text-red-600'}`}>
                                {results.data.status}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="text-gray-600 text-sm">Valor Venal:</span>
                              <div className="font-medium">R$ {results.data.propertyValue?.toLocaleString('pt-BR')}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm">Área:</span>
                              <div className="font-medium">{results.data.area}</div>
                            </div>
                            <div>
                              <span className="text-gray-600 text-sm">Vencimento:</span>
                              <div className="font-medium">{results.data.dueDate}</div>
                            </div>
                          </div>
                        </div>
                        
                        {results.data.installments && results.data.installments.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium text-gray-900 mb-2">Parcelas:</h5>
                            <div className="space-y-1">
                              {results.data.installments.map((installment: any, index: number) => (
                                <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                                  <span>{installment.parcela}ª parcela</span>
                                  <span className="font-medium">R$ {installment.valor}</span>
                                  <span className="text-gray-600">{installment.vencimento}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Market Analysis Results */}
                    {results.marketData && activeTab === 'market' && (
                      <div>
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-4">
                          <div className="text-purple-800">
                            <strong>✅ Análise de Mercado Concluída!</strong>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {results.insights && (
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h5 className="font-medium text-blue-900 mb-2">📊 Insights do Mercado</h5>
                              <ul className="space-y-1">
                                {results.insights.map((insight: string, index: number) => (
                                  <li key={index} className="text-blue-800 text-sm">• {insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {results.marketData.map((portalData: any, index: number) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-semibold capitalize">
                                  {portalData.portal === 'zapimoveis' ? 'ZAP Imóveis' : 
                                   portalData.portal === 'vivareal' ? 'Viva Real' : 'OLX'}
                                </h4>
                                <div className="text-right">
                                  <div className="text-sm text-gray-600">{portalData.propertyCount} imóveis</div>
                                  <div className="font-semibold text-green-600">
                                    Média: R$ {portalData.averagePrice?.toLocaleString('pt-BR')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Registry Results */}
                    {results.data && activeTab === 'registry' && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                          <div className="text-green-800">
                            <strong>✅ Dados do Cartório Extraídos!</strong>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <span className="text-gray-600 text-sm">Número da Matrícula:</span>
                            <div className="font-medium">{results.data.registryNumber}</div>
                          </div>
                          {results.data.ownerName && (
                            <div>
                              <span className="text-gray-600 text-sm">Proprietário:</span>
                              <div className="font-medium">{results.data.ownerName}</div>
                            </div>
                          )}
                          {results.data.propertyAddress && (
                            <div>
                              <span className="text-gray-600 text-sm">Endereço:</span>
                              <div className="font-medium">{results.data.propertyAddress}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Generic Success */}
                    {results.success && !results.results && !results.data && !results.marketData && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="text-green-800">
                          <strong>✅ Operação realizada com sucesso!</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!results && !loading && (
              <div className="text-gray-500 text-center py-8">
                Selecione uma função e execute para ver os resultados
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <div>
                <h4 className="font-semibold text-blue-900">Leads Automáticos</h4>
                <p className="text-blue-700 text-sm">Capture leads de múltiplos portais</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📋</span>
              <div>
                <h4 className="font-semibold text-green-900">Dados Cartório</h4>
                <p className="text-green-700 text-sm">Extraia matrículas automaticamente</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🏠</span>
              <div>
                <h4 className="font-semibold text-purple-900">IPTU Automático</h4>
                <p className="text-purple-700 text-sm">Consulte IPTU sem manual</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h4 className="font-semibold text-orange-900">Intel. Mercado</h4>
                <p className="text-orange-700 text-sm">Monitore concorrência em tempo real</p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔄</span>
              <div>
                <h4 className="font-semibold text-cyan-900">Sync Automático</h4>
                <p className="text-cyan-700 text-sm">Sincronização inteligente 24/7</p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📢</span>
              <div>
                <h4 className="font-semibold text-pink-900">Multi Publicação</h4>
                <p className="text-pink-700 text-sm">Publique em todos os portais</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}