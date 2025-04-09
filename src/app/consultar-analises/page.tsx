'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import FileUploader, { ModoVisualizacao } from '../../components/FileUploader';
import DataTable from '../../components/DataTable';
import DataSummary from '../../components/DataSummary';
import AnalyticsPanel from '../../components/AnalyticsPanel';
import HeatMap from '../../components/HeatMap';
import Link from 'next/link';
import { FaCalendarAlt, FaUser, FaBuilding, FaTruck, FaArrowRight, FaDatabase } from 'react-icons/fa';

interface DadosFreteRow {
  Data: string | Date;
  'Cidade Origem': string;
  'UF Origem': string;
  'Base Origem': string;
  NF: string | number;
  'Valor da Nota': number;
  Volumes: number;
  Peso: number;
  'Cidade Destino': string;
  'UF Destino': string;
  Base: string;
  Setor: string;
  'Frete Peso': number;
  Seguro: number;
  'Total Frete': number;
  Vendedor?: string;
  Cliente?: string;
  [key: string]: any;
}

interface TimelineItem {
  id: number;
  vendedor: string;
  cliente: string;
  data: string;
  registros: number;
  valorTotal: number;
}

// Função para formatar data para exibição
const formatDateForDisplay = (date: Date | string): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return String(date);
  
  return dateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar data em formato brasileiro
const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function ConsultarAnalises() {
  const [data, setData] = useState<DadosFreteRow[]>([]);
  const [filteredData, setFilteredData] = useState<DadosFreteRow[]>([]);
  const [isConsultaRealizada, setIsConsultaRealizada] = useState(false);
  const [filtrosConsulta, setFiltrosConsulta] = useState<{vendedor?: string, cliente?: string}>({});
  const [ultimasAnalises, setUltimasAnalises] = useState<TimelineItem[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);
  const [isCarregandoAnalise, setIsCarregandoAnalise] = useState(false);
  
  // Verificar parâmetros na URL ao carregar a página
  useEffect(() => {
    // Função para extrair parâmetros da URL
    const obterParametrosURL = () => {
      // Verificar se window está disponível (estamos no cliente)
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const vendedor = searchParams.get('vendedor');
        const cliente = searchParams.get('cliente');
        
        // Se temos os dois parâmetros, carregar a análise automaticamente
        if (vendedor && cliente) {
          console.log('Parâmetros detectados na URL:', { vendedor, cliente });
          
          // Criar objeto TimelineItem para passar para a função de carregamento
          const item: TimelineItem = {
            id: 0, // ID não importa neste caso
            vendedor: vendedor,
            cliente: cliente,
            data: formatDateForDisplay(new Date()), // Data atual
            registros: 0, // Será atualizado quando os dados forem carregados
            valorTotal: 0 // Será atualizado quando os dados forem carregados
          };
          
          // Carregar a análise com os parâmetros da URL
          carregarAnaliseTimeline(item);
        }
      }
    };
    
    // Executar apenas se ainda não foi realizada uma consulta
    if (!isConsultaRealizada && !isCarregandoAnalise) {
      obterParametrosURL();
    }
  }, [isConsultaRealizada, isCarregandoAnalise]);
  
  // Buscar as últimas análises para a timeline
  useEffect(() => {
    const fetchUltimasAnalises = async () => {
      try {
        setIsLoadingTimeline(true);
        
        // Buscar dados reais do banco de dados
        const response = await fetch('/api/transportes/ultimas-analises');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar últimas análises');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.analises)) {
          setUltimasAnalises(data.analises);
        } else {
          console.error('Formato de resposta inválido:', data);
        }
        
        setIsLoadingTimeline(false);
      } catch (error) {
        console.error('Erro ao buscar últimas análises:', error);
        setIsLoadingTimeline(false);
      }
    };
    
    if (!isConsultaRealizada) {
      fetchUltimasAnalises();
    }
  }, [isConsultaRealizada]);
  
  const handleDataProcessed = (processedData: DadosFreteRow[]) => {
    const formattedData = processedData.map(row => {
      let dataValue = row.Data;
      
      // Converter para objeto Date se for string
      if (typeof dataValue === 'string') {
        dataValue = new Date(dataValue);
      }
      
      return {
        ...row,
        Data: dataValue
      };
    });
    
    setData(formattedData);
    setFilteredData(formattedData);
    setIsConsultaRealizada(true);
    
    // Capturar os filtros da consulta
    if (formattedData.length > 0) {
      setFiltrosConsulta({
        vendedor: formattedData[0].Vendedor,
        cliente: formattedData[0].Cliente
      });
    }
  };

  // Função para atualizar dados filtrados (callback para AnalyticsPanel)
  const handleFilterChange = (newFilteredData: DadosFreteRow[]) => {
    setFilteredData(newFilteredData);
  };

  // Preparar dados com datas convertidas para string para exibição
  const displayData = filteredData.map(row => ({
    ...row,
    Data: formatDateForDisplay(row.Data)
  }));
  
  // Função para carregar uma análise da timeline
  const carregarAnaliseTimeline = (item: TimelineItem) => {
    setFiltrosConsulta({
      vendedor: item.vendedor,
      cliente: item.cliente
    });
    
    // Indicar que estamos carregando uma análise
    setIsCarregandoAnalise(true);
    
    // Buscar os dados dessa análise específica usando a API
    fetch(`/api/transportes/consulta?vendedor=${encodeURIComponent(item.vendedor)}&cliente=${encodeURIComponent(item.cliente)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Erro ao buscar dados da análise');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && Array.isArray(data.registros)) {
          // Processar dados recebidos
          const processedData = data.registros.map((row: any) => ({
            ...row,
            Data: new Date(row.Data)
          }));
          
          setData(processedData);
          setFilteredData(processedData);
          setIsConsultaRealizada(true);
          setIsCarregandoAnalise(false);
        } else {
          console.error('Formato de resposta inválido:', data);
          setIsCarregandoAnalise(false);
        }
      })
      .catch(error => {
        console.error('Erro ao carregar análise:', error);
        // Mostrar mensagem de erro para o usuário
        alert('Erro ao carregar os dados da análise. Por favor, tente novamente.');
        setIsCarregandoAnalise(false);
      });
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Consultar Análises Salvas</h1>
          <Link href="/analise-volumetria" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
            Voltar
          </Link>
        </div>

        <section className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <FileUploader 
            onDataProcessed={handleDataProcessed}
            modoFixo={ModoVisualizacao.VISUALIZACAO_SALVA}
            ocultarBotoesModo={true}
          />
        </section>

        {!isConsultaRealizada && (
          <section className="mb-12">
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg border border-purple-500/30">
              <h2 className="text-2xl font-semibold text-purple-300 mb-6 flex items-center">
                <FaDatabase className="mr-3" />
                Análises Recentes
              </h2>
              
              {isLoadingTimeline ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : ultimasAnalises.length > 0 ? (
                <div className="relative">
                  {/* Linha de conexão vertical */}
                  <div className="absolute left-6 top-6 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-blue-900 rounded-full"></div>
                  
                  <div className="space-y-8">
                    {ultimasAnalises.map((item, index) => (
                      <div 
                        key={item.id}
                        className="relative flex items-start cursor-pointer group"
                        onClick={() => carregarAnaliseTimeline(item)}
                      >
                        {/* Círculo da timeline */}
                        <div className="z-10 h-12 w-12 flex items-center justify-center rounded-full bg-gray-800 border-2 border-purple-500 shadow-lg group-hover:bg-purple-900 transition-colors duration-300">
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        
                        {/* Card de conteúdo */}
                        <div className="ml-6 bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700 flex-1 group-hover:border-purple-500 group-hover:bg-gray-800/80 transition-colors duration-300">
                          <div className="p-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                              <div className="text-xl font-semibold text-white group-hover:text-purple-300 transition-colors flex items-center">
                                <FaUser className="mr-2 text-blue-400" /> {item.vendedor}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center mt-2 md:mt-0">
                                <FaCalendarAlt className="mr-1" /> {formatDateBR(item.data)}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center">
                                <FaBuilding className="mr-2 text-yellow-400" /> 
                                <span className="text-gray-300">{item.cliente}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <FaTruck className="mr-2 text-green-400" /> 
                                <span className="text-gray-300 truncate text-responsive">
                                  {item.registros} fretes
                                </span>
                              </div>
                              
                              <div className="flex items-center">
                                <FaBuilding className="mr-2 text-yellow-400" /> 
                                <span className="text-gray-300 truncate text-responsive">
                                  {formatCurrency(item.valorTotal)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-4 text-right">
                              <span className="text-purple-400 text-sm font-medium flex items-center justify-end group-hover:text-purple-300">
                                Visualizar análise <FaArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <p className="text-xl mb-4">Nenhuma análise encontrada</p>
                  <p className="text-gray-400 mb-4">Não foram encontradas análises salvas no banco de dados.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {isConsultaRealizada && data.length > 0 && (
          <>
            <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold text-purple-400 mb-4">Resultados da Consulta</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="text-gray-300">Filtros aplicados:</span>
                {filtrosConsulta.vendedor && (
                  <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
                    Vendedor: {filtrosConsulta.vendedor}
                  </span>
                )}
                {filtrosConsulta.cliente && (
                  <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm">
                    Cliente: {filtrosConsulta.cliente}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">{data.length} registros encontrados na consulta.</p>
            </div>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Análise de Dados</h2>
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <AnalyticsPanel 
                  data={data} 
                  filteredData={filteredData} 
                  onFilterChange={handleFilterChange} 
                />
              </div>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Resumo dos Dados</h2>
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <DataSummary data={displayData} />
              </div>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Dados</h2>
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <DataTable data={displayData} maxRows={10} />
              </div>
              <div className="text-right mt-2 text-sm text-gray-400">
                {filteredData.length} de {data.length} registros exibidos
              </div>
            </section>
          </>
        )}

        {isConsultaRealizada && data.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl mb-4">Nenhum resultado encontrado</p>
            <p className="text-gray-400 mb-6">Não foram encontrados dados que correspondam aos critérios da consulta.</p>
            <button 
              onClick={() => setIsConsultaRealizada(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
            >
              Nova Consulta
            </button>
          </div>
        )}

        {!isConsultaRealizada && !data.length && ultimasAnalises.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center mt-8">
            <p className="text-xl mb-4">Faça sua consulta</p>
            <p className="text-gray-400 mb-6">Selecione um vendedor e/ou cliente para consultar as análises armazenadas ou clique em uma das análises recentes acima.</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .text-responsive {
          font-size: 1rem;
          word-break: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        
        @media (max-width: 640px) {
          .text-responsive {
            font-size: 0.875rem;
          }
        }
        
        @media (max-width: 480px) {
          .text-responsive {
            font-size: 0.75rem;
          }
        }
        
        @media screen and (max-width: 1024px) and (min-width: 768px) {
          .text-responsive {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </main>
  );
} 