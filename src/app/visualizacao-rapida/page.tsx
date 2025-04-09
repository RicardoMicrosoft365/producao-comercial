'use client';

import React, { useState } from 'react';
import Header from '../../components/Header';
import FileUploader, { ModoVisualizacao } from '../../components/FileUploader';
import DataTable from '../../components/DataTable';
import DataSummary from '../../components/DataSummary';
import Link from 'next/link';

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
  [key: string]: any;
}

// Função para formatar data para exibição
const formatDateForDisplay = (date: Date | string): string => {
  if (!date) return '';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return String(date);
  
  return dateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

export default function VisualizacaoRapida() {
  const [data, setData] = useState<DadosFreteRow[]>([]);
  const [filteredData, setFilteredData] = useState<DadosFreteRow[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
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
  };

  // Preparar dados com datas convertidas para string para exibição
  const displayData = filteredData.map(row => ({
    ...row,
    Data: formatDateForDisplay(row.Data)
  }));

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Visualização Rápida</h1>
          <Link href="/analise-volumetria" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors">
            Voltar
          </Link>
        </div>

        <section className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <FileUploader 
            onDataProcessed={handleDataProcessed}
            modoFixo={ModoVisualizacao.RAPIDA}
            ocultarBotoesModo={true}
          />
        </section>

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
            <p className="text-gray-400 mb-6">Faça o upload de um arquivo para visualizar os dados rapidamente.</p>
          </div>
        )}
      </div>
    </main>
  );
} 