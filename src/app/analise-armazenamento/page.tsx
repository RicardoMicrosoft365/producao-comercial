'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import FileUploader, { ModoVisualizacao } from '../../components/FileUploader';
import DataTable from '../../components/DataTable';
import DataSummary from '../../components/DataSummary';
import Link from 'next/link';
import Router from 'next/router';
import { useRouter } from 'next/navigation';
import { FaCalendarAlt, FaUser, FaBuilding, FaTruck, FaArrowRight, FaDatabase, FaCheck } from 'react-icons/fa';

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

export default function AnaliseArmazenamento() {
  const [data, setData] = useState<DadosFreteRow[]>([]);
  const [filteredData, setFilteredData] = useState<DadosFreteRow[]>([]);
  const [isSalvo, setIsSalvo] = useState(false);
  const router = useRouter();
  
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
    
    // Se contém os metadados de Vendedor e Cliente, podemos assumir que foi salvo
    if (formattedData.length > 0 && formattedData[0].Vendedor && formattedData[0].Cliente) {
      setIsSalvo(true);
    }
  };

  const calcularTotais = () => {
    if (data.length === 0) return { registros: 0, valorTotal: 0 };
    
    const registros = data.length;
    let valorTotal = 0;
    
    data.forEach(row => {
      valorTotal += row['Total Frete'] || 0;
    });
    
    return { registros, valorTotal };
  };
  
  const navegarParaConsulta = () => {
    if (data.length > 0 && data[0].Vendedor && data[0].Cliente) {
      // Navegar para a página de consulta com os parâmetros de vendedor e cliente
      router.push(`/consultar-analises?vendedor=${encodeURIComponent(data[0].Vendedor)}&cliente=${encodeURIComponent(data[0].Cliente)}`);
    }
  };

  // Preparar dados com datas convertidas para string para exibição
  const displayData = filteredData.map(row => ({
    ...row,
    Data: formatDateForDisplay(row.Data)
  }));
  
  // Obter totais para exibir no card
  const { registros, valorTotal } = calcularTotais();
  
  // Obter a data atual para o card
  const dataAtual = formatDateForDisplay(new Date());

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Análise com Armazenamento</h1>
          <Link href="/analise-volumetria" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
            Voltar
          </Link>
        </div>

        <section className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <FileUploader 
            onDataProcessed={handleDataProcessed} 
            modoFixo={ModoVisualizacao.ARMAZENAMENTO}
            ocultarBotoesModo={true}
          />
        </section>

        {isSalvo && (
          <section className="mb-12">
            <div className="bg-green-900/30 border border-green-500 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-green-400 mb-6 flex items-center">
                <FaCheck className="mr-3" />
                Dados Salvos com Sucesso!
              </h2>
              <p className="mb-6">Os dados foram salvos com sucesso e estarão disponíveis para consultas futuras.</p>
              
              {/* Card de análise salva - similar ao da página de consulta */}
              <div className="relative bg-gray-800/70 rounded-lg overflow-hidden border border-gray-700 my-6">
                {/* Linha de conexão vertical */}
                <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-green-600 to-green-900 rounded-full"></div>
                
                <div className="ml-12 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="text-xl font-semibold text-white flex items-center">
                      <FaUser className="mr-2 text-blue-400" /> {data[0]?.Vendedor || ''}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center mt-2 md:mt-0">
                      <FaCalendarAlt className="mr-1" /> {formatDateBR(dataAtual)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <FaBuilding className="mr-2 text-yellow-400" /> 
                      <span className="text-gray-300">{data[0]?.Cliente || ''}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FaTruck className="mr-2 text-green-400" /> 
                      <span className="text-gray-300 truncate text-responsive">{registros} fretes</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FaBuilding className="mr-2 text-yellow-400" /> 
                      <span className="text-gray-300 truncate text-responsive">{formatCurrency(valorTotal)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-right">
                    <button 
                      onClick={navegarParaConsulta}
                      className="text-green-400 text-sm font-medium flex items-center justify-end hover:text-green-300 ml-auto"
                    >
                      Visualizar análise <FaArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm">
                  Vendedor: {data[0]?.Vendedor || ''}
                </span>
                <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm">
                  Cliente: {data[0]?.Cliente || ''}
                </span>
              </div>
            </div>
          </section>
        )}

        {data.length > 0 && (
          <>
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

        {data.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-xl mb-4">Nenhum dado para exibir</p>
            <p className="text-gray-400 mb-6">Preencha as informações de vendedor e cliente e faça o upload de um arquivo para salvar a análise.</p>
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