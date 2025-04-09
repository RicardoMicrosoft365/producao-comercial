'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '../../components/Header';
import FileUploader from '../../components/FileUploader';
import DataTable from '../../components/DataTable';
import DataSummary from '../../components/DataSummary';
import AnalyticsPanel from '../../components/AnalyticsPanel';
import DateFilter from '../../components/DateFilter';
import HeatMap from '../../components/HeatMap';
import Link from 'next/link';

// Interface para os dados da planilha
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

// Função para normalizar uma data para comparação (ignorando horas)
const normalizeDate = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Função para extrair apenas a parte de data (dia, mês, ano) de uma string ISO ou objeto Date
const extractDateParts = (dateValue: string | Date): { dia: number, mes: number, ano: number } => {
  let date: Date;
  
  if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    date = new Date(dateValue);
  }
  
  if (isNaN(date.getTime())) {
    console.error('Data inválida:', dateValue);
    return { dia: 0, mes: 0, ano: 0 };
  }
  
  return {
    dia: date.getDate(),
    mes: date.getMonth() + 1, // Mês é base 0 em JavaScript
    ano: date.getFullYear()
  };
};

// Função para converter string DD/MM/YYYY para objeto Date
const parseDateBR = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Mês em JS é base 0
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
};

export default function AnaliseVolumetria() {
  const [data, setData] = useState<DadosFreteRow[]>([]);
  const [filteredData, setFilteredData] = useState<DadosFreteRow[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);
  
  // Ref para debounce
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [info, ...prev.slice(0, 9)]); // Manter no máximo 10 entradas
  };

  // Função de callback para atualizar dados filtrados
  const updateFilteredData = useCallback((newFilteredData: DadosFreteRow[]) => {
    setFilteredData(newFilteredData);
  }, []);

  // Função de filtro com debounce
  const debouncedFilterData = useCallback((filterFn: () => void) => {
    setIsFiltering(true);
    
    // Limpar timeout anterior se existir
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Definir novo timeout
    filterTimeoutRef.current = setTimeout(() => {
      // Executar a função de filtro
      filterFn();
      setIsFiltering(false);
    }, 300);
  }, []);
  
  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, []);

  const handleDataProcessed = (processedData: DadosFreteRow[]) => {
    // Garantir que as datas estejam no formato correto e convertidas para Date
    const formattedData = processedData.map(row => {
      let dataValue = row.Data;
      
      // Imprimir as primeiras 5 datas para depuração
      if (processedData.indexOf(row) < 5) {
        console.log(`Tipo de Data: ${typeof dataValue}`, dataValue);
      }
      
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
    
    // Adicionar informações para depuração
    addDebugInfo(`Carregados ${formattedData.length} registros`);
    
    // Exibir informações de datas para depuração
    if (formattedData.length > 0) {
      const primeirasLinhas = formattedData.slice(0, 3);
      primeirasLinhas.forEach((row, idx) => {
        const dataStr = row.Data instanceof Date 
          ? `${row.Data.getDate()}/${row.Data.getMonth()+1}/${row.Data.getFullYear()}` 
          : String(row.Data);
        addDebugInfo(`Linha ${idx+1}: Data = ${dataStr}`);
      });
    }
  };

  const handleDateFilterChange = (newStartDate: Date | null, newEndDate: Date | null) => {
    // Normalizar as datas para evitar problemas com horas
    const normalizedStartDate = newStartDate ? normalizeDate(newStartDate) : null;
    const normalizedEndDate = newEndDate ? normalizeDate(newEndDate) : null;
    
    setStartDate(normalizedStartDate);
    setEndDate(normalizedEndDate);
    
    // Log para depuração sem tantos detalhes para evitar sobrecarga
    const startDateStr = normalizedStartDate ? 
      `${normalizedStartDate.getDate()}/${normalizedStartDate.getMonth()+1}/${normalizedStartDate.getFullYear()}` : 
      'nenhuma';
    const endDateStr = normalizedEndDate ? 
      `${normalizedEndDate.getDate()}/${normalizedEndDate.getMonth()+1}/${normalizedEndDate.getFullYear()}` : 
      'nenhuma';
    
    addDebugInfo(`Filtro alterado: ${startDateStr} a ${endDateStr}`);
  };

  // Aplicar filtro quando as datas ou os dados mudarem - versão otimizada
  useEffect(() => {
    // Evitar filtragem durante o carregamento inicial
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }

    // Se não há filtros de data, retorne todos os dados
    if (!startDate && !endDate) {
      setFilteredData(data);
      return;
    }

    // Função de filtragem real
    const applyFilter = () => {
      // Cache de datas normalizadas para melhorar performance
      const dateCache = new Map<string, { parts: { dia: number, mes: number, ano: number }, valid: boolean }>();
      
      const result = data.filter(row => {
        // Usar cache para evitar recálculos de datas
        const rowDateStr = String(row.Data);
        
        if (!dateCache.has(rowDateStr)) {
          try {
            const rowDate = row.Data instanceof Date ? row.Data : new Date(rowDateStr);
            const isValid = !isNaN(rowDate.getTime());
            const parts = isValid ? extractDateParts(rowDate) : { dia: 0, mes: 0, ano: 0 };
            dateCache.set(rowDateStr, { parts, valid: isValid });
          } catch (error) {
            console.error('Erro ao processar data:', rowDateStr, error);
            dateCache.set(rowDateStr, { parts: { dia: 0, mes: 0, ano: 0 }, valid: false });
          }
        }
        
        const cacheEntry = dateCache.get(rowDateStr);
        if (!cacheEntry?.valid) return false;
        
        const rowDateParts = cacheEntry.parts;
        
        // Verificar se a data está dentro do intervalo
        if (startDate) {
          const startDateParts = extractDateParts(startDate);
          
          // Verificar se a data da linha é anterior à data inicial
          if (
            rowDateParts.ano < startDateParts.ano || 
            (rowDateParts.ano === startDateParts.ano && rowDateParts.mes < startDateParts.mes) ||
            (rowDateParts.ano === startDateParts.ano && rowDateParts.mes === startDateParts.mes && rowDateParts.dia < startDateParts.dia)
          ) {
            return false;
          }
        }
        
        if (endDate) {
          const endDateParts = extractDateParts(endDate);
          
          // Verificar se a data da linha é posterior à data final
          if (
            rowDateParts.ano > endDateParts.ano || 
            (rowDateParts.ano === endDateParts.ano && rowDateParts.mes > endDateParts.mes) ||
            (rowDateParts.ano === endDateParts.ano && rowDateParts.mes === endDateParts.mes && rowDateParts.dia > endDateParts.dia)
          ) {
            return false;
          }
        }
        
        return true;
      });

      // Log simples para depuração
      addDebugInfo(`Filtro aplicado: ${result.length} de ${data.length} registros`);
      
      setFilteredData(result);
    };
    
    // Usar debounce para evitar múltiplas renderizações
    debouncedFilterData(applyFilter);
    
  }, [data, startDate, endDate, debouncedFilterData]);

  // Preparar dados com datas convertidas para string para exibição
  const prepareDataForDisplay = useCallback((dataArray: DadosFreteRow[]): DadosFreteRow[] => {
    return dataArray.map(row => ({
      ...row,
      // Converter Data para string no formato YYYY-MM-DD
      Data: formatDateForDisplay(row.Data)
    }));
  }, []);

  const displayData = useMemo(() => prepareDataForDisplay(filteredData), [filteredData, prepareDataForDisplay]);

  // Memoizar o componente DataTable para evitar renderizações desnecessárias
  const memoizedDataTable = useMemo(() => {
    return <DataTable data={displayData} maxRows={10} />;
  }, [displayData]);

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <Header />
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-8">Análise de Volumetria</h1>
        
        {/* Navegação para páginas específicas */}
        <section className="mb-8 grid gap-6 md:grid-cols-3">
          <Link href="/visualizacao-rapida">
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:bg-gray-700 transition-colors cursor-pointer h-full">
              <div className="flex items-center mb-4 text-amber-500">
                <span className="text-3xl mr-3">👁️</span>
                <h2 className="text-2xl font-bold">Visualização Rápida</h2>
              </div>
              <p className="text-gray-300">Upload rápido de arquivos para visualização sem armazenamento de dados.</p>
            </div>
          </Link>
          
          <Link href="/analise-armazenamento">
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:bg-gray-700 transition-colors cursor-pointer h-full">
              <div className="flex items-center mb-4 text-green-500">
                <span className="text-3xl mr-3">💾</span>
                <h2 className="text-2xl font-bold">Análise com Armazenamento</h2>
              </div>
              <p className="text-gray-300">Upload de dados com armazenamento permanente para análises futuras.</p>
            </div>
          </Link>
          
          <Link href="/consultar-analises">
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg hover:bg-gray-700 transition-colors cursor-pointer h-full">
              <div className="flex items-center mb-4 text-purple-500">
                <span className="text-3xl mr-3">📋</span>
                <h2 className="text-2xl font-bold">Consultar Análises Salvas</h2>
              </div>
              <p className="text-gray-300">Consulte análises de volumetria armazenadas anteriormente.</p>
            </div>
          </Link>
        </section>
        
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-6">Análise de Volumetria</h2>
          <p className="mb-4">
            Este sistema permite analisar e gerenciar dados de volumetria de fretes e transportes. Utilize as opções acima para:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4 text-gray-300">
            <li><strong className="text-amber-500">Visualização Rápida</strong>: Faça upload e analise dados sem salvá-los no banco de dados.</li>
            <li><strong className="text-green-500">Análise com Armazenamento</strong>: Faça upload, analise e salve os dados para consultas futuras.</li>
            <li><strong className="text-purple-500">Consultar Análises Salvas</strong>: Busque e visualize dados que foram salvos anteriormente.</li>
          </ul>
        </div>
      </div>
    </main>
  );
} 