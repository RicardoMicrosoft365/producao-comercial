import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { FaUpload, FaInfoCircle, FaSave, FaBolt, FaChartLine, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';

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
  [key: string]: any; // Para permitir acesso dinâmico às propriedades
}

interface FileUploaderProps {
  onDataProcessed: (data: DadosFreteRow[]) => void;
  // Novo parâmetro para definir o modo inicial e desativar a troca
  modoFixo?: ModoVisualizacao;
  // Ocultar os botões de troca de modo
  ocultarBotoesModo?: boolean;
  // Filtros iniciais a serem aplicados quando componente carrega
  filtrosIniciais?: { vendedor?: string, cliente?: string };
  // Se deve aplicar filtros automaticamente ao carregar
  autoFiltrar?: boolean;
}

// Enum para os modos de visualização - agora exportado
export enum ModoVisualizacao {
  RAPIDA = 'rapida',
  ARMAZENAMENTO = 'armazenamento',
  VISUALIZACAO_SALVA = 'visualizacao_salva'
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onDataProcessed, 
  modoFixo, 
  ocultarBotoesModo = false,
  filtrosIniciais,
  autoFiltrar = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>(modoFixo || ModoVisualizacao.RAPIDA);
  const [nomeVendedor, setNomeVendedor] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [mostrarFormularioArmazenamento, setMostrarFormularioArmazenamento] = useState(false);
  const [mostrarFormularioConsulta, setMostrarFormularioConsulta] = useState(false);
  const [isConsultando, setIsConsultando] = useState(false);
  
  // Estados para sugestões de vendedores
  const [vendedores, setVendedores] = useState<{id: number, nome: string}[]>([]);
  const [filteredVendedores, setFilteredVendedores] = useState<{id: number, nome: string}[]>([]);
  const [showVendedoresSuggestions, setShowVendedoresSuggestions] = useState(false);
  const [isLoadingVendedores, setIsLoadingVendedores] = useState(false);
  
  // Estados para sugestões de clientes
  const [clientes, setClientes] = useState<{id: string, nome: string}[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<{id: string, nome: string}[]>([]);
  const [showClientesSuggestions, setShowClientesSuggestions] = useState(false);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vendedorInputRef = useRef<HTMLInputElement>(null);
  const clienteInputRef = useRef<HTMLInputElement>(null);
  const vendedorSuggestionBoxRef = useRef<HTMLDivElement>(null);
  const clienteSuggestionBoxRef = useRef<HTMLDivElement>(null);

  // Efeito para configurar o modo correto no carregamento
  useEffect(() => {
    if (modoFixo) {
      setModoVisualizacao(modoFixo);
      
      // Configurar formulários conforme o modo
      if (modoFixo === ModoVisualizacao.ARMAZENAMENTO) {
        setMostrarFormularioArmazenamento(true);
        setMostrarFormularioConsulta(false);
      } else if (modoFixo === ModoVisualizacao.VISUALIZACAO_SALVA) {
        setMostrarFormularioArmazenamento(false);
        setMostrarFormularioConsulta(true);
      } else {
        setMostrarFormularioArmazenamento(false);
        setMostrarFormularioConsulta(false);
      }
    }
  }, [modoFixo]);

  // Efeito para aplicar os filtros iniciais quando disponíveis
  useEffect(() => {
    if (filtrosIniciais) {
      console.log("FileUploader recebeu filtros iniciais:", filtrosIniciais);
      
      // Garantir que estamos no modo de consulta
      if (modoVisualizacao !== ModoVisualizacao.VISUALIZACAO_SALVA) {
        console.log("Alterando modo para VISUALIZACAO_SALVA");
        toggleModoVisualizacao(ModoVisualizacao.VISUALIZACAO_SALVA);
      }
      
      // Preencher campos com os valores dos filtros
      if (filtrosIniciais.vendedor) {
        console.log("Definindo vendedor:", filtrosIniciais.vendedor);
        setNomeVendedor(filtrosIniciais.vendedor);
        
        // Buscar clientes para este vendedor
        fetchClientes(filtrosIniciais.vendedor);
      }
      
      if (filtrosIniciais.cliente) {
        console.log("Definindo cliente:", filtrosIniciais.cliente);
        setNomeCliente(filtrosIniciais.cliente);
      }
      
      // Mostrar formulário de consulta
      setMostrarFormularioConsulta(true);
    }
  }, [filtrosIniciais, modoVisualizacao]);

  // Efeito para executar busca automática quando autoFiltrar for true
  useEffect(() => {
    if (autoFiltrar && filtrosIniciais && 
        (filtrosIniciais.vendedor || filtrosIniciais.cliente)) {
      
      console.log("AutoFiltrar está ativado, preparando para buscar dados...");
      
      // Verificar se já estamos no modo de consulta
      if (modoVisualizacao !== ModoVisualizacao.VISUALIZACAO_SALVA) {
        console.log("Não estamos no modo de consulta, aguardando mudança de modo...");
        return;
      }
      
      // Garantir que temos pelo menos um filtro definido
      if (!nomeVendedor && !nomeCliente) {
        console.log("Nenhum filtro aplicado ainda. Aguardando...");
        return;
      }
      
      console.log("Executando busca automática com filtros:", { vendedor: nomeVendedor, cliente: nomeCliente });
      
      // Pequeno delay para garantir que a interface carregou
      const timer = setTimeout(() => {
        console.log("Executando handleBuscarDados()");
        handleBuscarDados();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFiltrar, filtrosIniciais, modoVisualizacao, nomeVendedor, nomeCliente]);

  // Carregar lista de vendedores quando o componente é montado
  useEffect(() => {
    fetchVendedores();
  }, []);
  
  // Carregar lista de clientes quando o vendedor é selecionado
  useEffect(() => {
    if (nomeVendedor && mostrarFormularioConsulta) {
      fetchClientes(nomeVendedor);
    }
  }, [nomeVendedor, mostrarFormularioConsulta]);
  
  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fechar sugestões de vendedores
      if (vendedorSuggestionBoxRef.current && !vendedorSuggestionBoxRef.current.contains(event.target as Node) && 
          vendedorInputRef.current && !vendedorInputRef.current.contains(event.target as Node)) {
        setShowVendedoresSuggestions(false);
      }
      
      // Fechar sugestões de clientes
      if (clienteSuggestionBoxRef.current && !clienteSuggestionBoxRef.current.contains(event.target as Node) && 
          clienteInputRef.current && !clienteInputRef.current.contains(event.target as Node)) {
        setShowClientesSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Função para buscar vendedores do banco de dados
  const fetchVendedores = async (termo?: string) => {
    try {
      setIsLoadingVendedores(true);
      const url = termo 
        ? `/api/vendedores?termo=${encodeURIComponent(termo)}` 
        : '/api/vendedores';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar vendedores');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.vendedores)) {
        if (termo) {
          setFilteredVendedores(data.vendedores);
        } else {
          setVendedores(data.vendedores);
          setFilteredVendedores(data.vendedores);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
    } finally {
      setIsLoadingVendedores(false);
    }
  };
  
  // Função para buscar clientes do banco de dados filtrados por vendedor
  const fetchClientes = async (vendedor: string, termo?: string) => {
    try {
      setIsLoadingClientes(true);
      
      let url = `/api/clientes?vendedor=${encodeURIComponent(vendedor)}`;
      if (termo) {
        url += `&termo=${encodeURIComponent(termo)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.clientes)) {
        if (termo) {
          setFilteredClientes(data.clientes);
        } else {
          setClientes(data.clientes);
          setFilteredClientes(data.clientes);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setIsLoadingClientes(false);
    }
  };
  
  // Função para filtrar vendedores conforme o usuário digita
  const handleVendedorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNomeVendedor(value);
    
    if (value.trim().length > 0) {
      // Filtra localmente para resposta imediata
      const filtered = vendedores.filter(v => 
        v.nome.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredVendedores(filtered);
      
      // Também busca no servidor para resultados mais completos
      fetchVendedores(value);
      
      setShowVendedoresSuggestions(true);
    } else {
      setFilteredVendedores(vendedores);
      setShowVendedoresSuggestions(false);
    }
  };
  
  // Função para filtrar clientes conforme o usuário digita
  const handleClienteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNomeCliente(value);
    
    if (value.trim().length > 0 && nomeVendedor) {
      // Filtra localmente para resposta imediata
      const filtered = clientes.filter(c => 
        c.nome.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClientes(filtered);
      
      // Também busca no servidor para resultados mais completos
      fetchClientes(nomeVendedor, value);
      
      setShowClientesSuggestions(true);
    } else {
      setFilteredClientes(clientes);
      setShowClientesSuggestions(false);
    }
  };
  
  // Função para selecionar um vendedor da lista
  const selectVendedor = (nome: string) => {
    setNomeVendedor(nome);
    setShowVendedoresSuggestions(false);
    
    // Limpar cliente quando vendedor muda
    if (mostrarFormularioConsulta) {
      setNomeCliente('');
      fetchClientes(nome);
    }
  };
  
  // Função para selecionar um cliente da lista
  const selectCliente = (nome: string) => {
    setNomeCliente(nome);
    setShowClientesSuggestions(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Função para converter string para número, tratando vírgula como separador decimal
  const parseNumeroDecimal = (valor: any): number => {
    if (typeof valor === 'number') return valor;
    
    if (typeof valor === 'string') {
      // Remover caracteres não numéricos, exceto vírgula e ponto
      // Substituir vírgula por ponto para o parseFloat funcionar
      const valorLimpo = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
      return parseFloat(valorLimpo);
    }
    
    return 0;
  };
  
  // Função para processar e padronizar uma data
  const processarData = (dataValue: any): Date => {
    // Se já for um objeto Date
    if (dataValue instanceof Date) {
      return new Date(dataValue.getFullYear(), dataValue.getMonth(), dataValue.getDate(), 0, 0, 0, 0);
    }
    
    // Se for uma string, tentar converter para Date
    if (typeof dataValue === 'string') {
      // Tentar identificar o formato da data (DD/MM/AAAA ou AAAA-MM-DD)
      let dataParts;
      
      // Verificar se é no formato brasileiro DD/MM/AAAA
      if (dataValue.includes('/')) {
        dataParts = dataValue.split('/');
        if (dataParts.length === 3) {
          const dia = parseInt(dataParts[0], 10);
          const mes = parseInt(dataParts[1], 10) - 1; // Mês em JS é base 0
          const ano = parseInt(dataParts[2], 10);
          
          // Retornar data normalizada
          return new Date(ano, mes, dia, 0, 0, 0, 0);
        }
      }
      
      // Verificar se é no formato ISO AAAA-MM-DD
      if (dataValue.includes('-')) {
        dataParts = dataValue.split('-');
        if (dataParts.length === 3) {
          const ano = parseInt(dataParts[0], 10);
          const mes = parseInt(dataParts[1], 10) - 1; // Mês em JS é base 0
          const dia = parseInt(dataParts[2], 10);
          
          // Retornar data normalizada
          return new Date(ano, mes, dia, 0, 0, 0, 0);
        }
      }
      
      // Se não conseguiu identificar o formato, usar o construtor padrão
      const data = new Date(dataValue);
      if (!isNaN(data.getTime())) {
        return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
      }
    }
    
    // Se não conseguiu processar ou o valor é inválido, retornar data atual
    console.warn(`Não foi possível processar a data: ${dataValue}`);
    return new Date();
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    // Se está no modo de armazenamento, verificar dados obrigatórios
    if (modoVisualizacao === ModoVisualizacao.ARMAZENAMENTO) {
      if (!nomeVendedor.trim() || !nomeCliente.trim()) {
        setError('É necessário informar o nome do vendedor e do cliente para armazenar os dados.');
        setIsProcessing(false);
        return;
      }
    }
    
    try {
      // Verificar se é um arquivo Excel
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        throw new Error('O arquivo deve ser do tipo Excel (.xlsx ou .xls)');
      }
      
      setFileName(file.name);
      
      // Ler o arquivo como array buffer
      const buffer = await file.arrayBuffer();
      
      // Configurar opções para garantir que as datas sejam processadas corretamente
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true, // Isso garante que as células de data sejam interpretadas como objetos Date
        dateNF: 'dd/mm/yyyy' // Formato preferido para saída
      });
      
      // Pegar a primeira planilha
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json<DadosFreteRow>(worksheet, {
        raw: false, // Não queremos valores brutos
        dateNF: 'yyyy-mm-dd', // ISO formato para compatibilidade
      });
      
      if (jsonData.length === 0) {
        throw new Error('Nenhum dado encontrado na planilha');
      }
      
      // Verificar se contém as colunas esperadas
      const requiredColumns = [
        'Data', 'Cidade Origem', 'UF Origem', 'Base Origem', 'NF', 
        'Valor da Nota', 'Volumes', 'Peso', 'Cidade Destino', 'UF Destino', 
        'Base', 'Setor', 'Frete Peso', 'Seguro', 'Total Frete'
      ];
      
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias ausentes: ${missingColumns.join(', ')}`);
      }
      
      // Lista de campos monetários
      const camposMonetarios = ['Valor da Nota', 'Frete Peso', 'Seguro', 'Total Frete'];
      // Lista de campos numéricos não monetários
      const camposNumericos = ['Volumes', 'Peso'];
      
      // Garantir que todas as datas estejam em formato string ISO e os campos monetários sejam números
      const processedData = jsonData.map((row, index) => {
        // Criar um novo objeto para as transformações
        const newRow = { ...row };
        
        // Processar o campo Data - agora usando nossa função dedicada
        try {
          const dataOriginal = row.Data;
          const dataProcessada = processarData(dataOriginal);
          
          // Log para depuração dos primeiros registros
          if (index < 5) {
            console.log(`Linha ${index+1} - Data original: ${String(dataOriginal)}, Data processada: ${dataProcessada.toISOString()}`);
          }
          
          newRow.Data = dataProcessada;
        } catch (err) {
          console.error(`Erro ao processar data na linha ${index+1}:`, err);
          // Se ocorrer erro ao processar a data, manter o valor original
        }
        
        // Processar os campos monetários
        camposMonetarios.forEach(campo => {
          if (campo in row) {
            // Garantir que o valor seja numérico, interpretando vírgula como separador decimal
            newRow[campo] = parseNumeroDecimal(row[campo]);
          }
        });
        
        // Processar outros campos numéricos (Volumes, Peso)
        camposNumericos.forEach(campo => {
          if (campo in row) {
            // Garantir que o valor seja numérico
            newRow[campo] = parseNumeroDecimal(row[campo]);
          }
        });
        
        return newRow;
      });
      
      // Log para debug
      console.log('Primeiros registros processados:', processedData.slice(0, 3));
      
      // Se estiver no modo armazenamento, adicionar metadados e enviar para a API
      if (modoVisualizacao === ModoVisualizacao.ARMAZENAMENTO) {
        try {
          // Mapear os dados do formato Excel para o formato do banco de dados
          const dadosFormatadosParaDB = processedData.map(row => {
            // Garantir que a data seja convertida para string no formato ISO (YYYY-MM-DD)
            let dataFormatada = '';
            if (row.Data instanceof Date) {
              dataFormatada = row.Data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            } else if (typeof row.Data === 'string') {
              dataFormatada = row.Data;
            }
            
            // Obter a data atual para o campo data_inclusao
            const dataAtual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
            console.log(`Gerando data_inclusao para o registro: ${dataAtual}`);
            
            // Converter nomes de colunas para o formato do banco de dados (snake_case)
            return {
              data: dataFormatada,
              cidade_origem: row['Cidade Origem'] || '',
              uf_origem: row['UF Origem'] || '',
              base_origem: row['Base Origem'] || '',
              nf: row.NF || '',
              valor_da_nota: typeof row['Valor da Nota'] === 'number' ? row['Valor da Nota'] : 0,
              volumes: typeof row.Volumes === 'number' ? row.Volumes : 0,
              peso_real: typeof row.Peso === 'number' ? row.Peso : 0, // O campo 'Peso' do Excel corresponde a 'peso_real' no DB
              peso_cubado: 0, // Valor padrão se não existir
              cidade_destino: row['Cidade Destino'] || '',
              uf_destino: row['UF Destino'] || '',
              base: row.Base || '',
              setor: row.Setor || '',
              frete_peso: typeof row['Frete Peso'] === 'number' ? row['Frete Peso'] : 0,
              seguro: typeof row.Seguro === 'number' ? row.Seguro : 0,
              total_frete: typeof row['Total Frete'] === 'number' ? row['Total Frete'] : 0,
              vendedor: nomeVendedor,
              cliente: nomeCliente,
              data_inclusao: dataAtual // Adicionar a data de inclusão
            };
          });
          
          console.log('Dados formatados para o DB:', dadosFormatadosParaDB.slice(0, 2));
          
          // Enviar para a API
          const response = await fetch('/api/transportes/armazenar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transportes: dadosFormatadosParaDB,
              vendedor: nomeVendedor,
              cliente: nomeCliente
            }),
          });
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(`Erro ao armazenar dados: ${result.message}`);
          }
          
          console.log(`Dados armazenados com sucesso: ${result.count} registros`);
          
          // Adicionar metadados aos dados para exibição (mantém o formato original para exibição)
          const dataComMetadados = processedData.map(row => ({
            ...row,
            Vendedor: nomeVendedor,
            Cliente: nomeCliente
          }));
          
          // Processar os dados e enviar para o componente pai (para exibição)
          onDataProcessed(dataComMetadados);
        } catch (apiError: any) {
          console.error('Erro ao enviar dados para API:', apiError);
          setError(`Erro ao armazenar dados: ${apiError.message}`);
          // Ainda assim mostrar os dados para o usuário
          onDataProcessed(processedData);
        }
      } else {
        // Modo de visualização rápida - comportamento atual
        onDataProcessed(processedData);
      }
      
    } catch (err: any) {
      console.error('Erro ao processar arquivo:', err);
      setError(err.message || 'Erro ao processar o arquivo');
      setFileName(null);
    } finally {
      setIsProcessing(false);
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
    
    setIsDragging(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleBuscarDados = async () => {
    // Validar se pelo menos um dos campos foi preenchido
    if (!nomeVendedor.trim() && !nomeCliente.trim()) {
      console.error('Erro: Nenhum filtro preenchido');
      setError('É necessário informar o nome do vendedor ou do cliente para consultar os dados.');
      return;
    }
    
    setIsConsultando(true);
    setError(null);
    
    console.log('Iniciando busca com parâmetros:', { 
      vendedor: nomeVendedor, 
      cliente: nomeCliente 
    });
    
    try {
      // Verificar se estamos em modo de desenvolvimento com filtros da URL
      // Se estamos em desenvolvimento e recebemos filtros iniciais, podemos usar dados mockados
      // para demonstração em vez de chamar a API
      if (process.env.NODE_ENV === 'development' && filtrosIniciais) {
        console.log('Usando dados de mock para demonstração em modo de desenvolvimento');
        
        // Criar dados de demonstração
        const dadosMockados = gerarDadosMockados(nomeVendedor, nomeCliente);
        
        // Simular um delay para parecer uma chamada de API real
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('Dados mockados:', dadosMockados.length, 'registros');
        
        // Enviar dados mockados para o componente pai
        onDataProcessed(dadosMockados);
        return;
      }
      
      // Montar os parâmetros de consulta
      const params = new URLSearchParams();
      if (nomeVendedor) params.append('vendedor', nomeVendedor);
      if (nomeCliente) params.append('cliente', nomeCliente);
      
      const url = `/api/transportes/consultar?${params.toString()}`;
      console.log('Chamando API:', url);
      
      // Buscar os dados do banco
      const response = await fetch(url);
      console.log('Resposta HTTP:', response.status);
      
      const result = await response.json();
      console.log('Dados recebidos:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao consultar dados');
      }
      
      if (!result.data || result.data.length === 0) {
        throw new Error('Nenhum registro encontrado com os critérios informados');
      }
      
      console.log(`Dados consultados: ${result.data.length} registros`);
      
      // Converter os dados do formato do banco para o formato esperado pelo componente
      const dadosFormatados = result.data.map((item: any) => ({
        Data: new Date(item.data),
        'Cidade Origem': item.cidade_origem,
        'UF Origem': item.uf_origem,
        'Base Origem': item.base_origem,
        NF: item.nf,
        'Valor da Nota': item.valor_da_nota,
        Volumes: item.volumes,
        Peso: item.peso_real,
        'Cidade Destino': item.cidade_destino,
        'UF Destino': item.uf_destino,
        Base: item.base,
        Setor: item.setor,
        'Frete Peso': item.frete_peso,
        Seguro: item.seguro,
        'Total Frete': item.total_frete,
        Vendedor: item.vendedor,
        Cliente: item.cliente
      }));
      
      console.log('Dados formatados:', dadosFormatados.length, 'registros');
      
      // Processar os dados e enviar para o componente pai (para exibição)
      onDataProcessed(dadosFormatados);
      
    } catch (err: any) {
      console.error('Erro ao consultar dados:', err);
      setError(err.message || 'Erro ao consultar dados');
    } finally {
      setIsConsultando(false);
    }
  };

  // Função para gerar dados mockados para desenvolvimento e testes
  const gerarDadosMockados = (vendedor: string, cliente: string): DadosFreteRow[] => {
    // Gerar entre 10 e 30 registros aleatórios
    const quantidadeRegistros = Math.floor(Math.random() * 20) + 10;
    
    // Lista de cidades e UFs para variar os dados
    const cidades = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba', 'Porto Alegre'];
    const ufs = ['SP', 'RJ', 'MG', 'DF', 'PR', 'RS'];
    const setores = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'];
    const bases = ['Base SP', 'Base RJ', 'Base MG', 'Base PR', 'Base RS'];
    
    // Data atual para referência
    const hoje = new Date();
    
    // Gerar registros aleatórios
    const registros: DadosFreteRow[] = [];
    
    for (let i = 0; i < quantidadeRegistros; i++) {
      // Gerar data aleatória nos últimos 6 meses
      const dataAleatoria = new Date(hoje);
      dataAleatoria.setDate(hoje.getDate() - Math.floor(Math.random() * 180));
      
      // Selecionar cidade e UF aleatórias
      const cidadeOrigemIndex = Math.floor(Math.random() * cidades.length);
      const cidadeDestinoIndex = Math.floor(Math.random() * cidades.length);
      const ufOrigemIndex = Math.floor(Math.random() * ufs.length);
      const ufDestinoIndex = Math.floor(Math.random() * ufs.length);
      const setorIndex = Math.floor(Math.random() * setores.length);
      const baseIndex = Math.floor(Math.random() * bases.length);
      
      // Gerar valores aleatórios para dados numéricos
      const valorNota = Math.random() * 10000 + 1000; // Entre 1000 e 11000
      const volumes = Math.floor(Math.random() * 20) + 1; // Entre 1 e 20
      const peso = Math.random() * 1000 + 10; // Entre 10 e 1010
      const fretePeso = valorNota * 0.05; // 5% do valor da nota
      const seguro = valorNota * 0.02; // 2% do valor da nota
      const totalFrete = fretePeso + seguro;
      
      // Criar o registro
      registros.push({
        Data: dataAleatoria,
        'Cidade Origem': cidades[cidadeOrigemIndex],
        'UF Origem': ufs[ufOrigemIndex],
        'Base Origem': bases[baseIndex],
        NF: `NF-${10000 + i}`,
        'Valor da Nota': valorNota,
        Volumes: volumes,
        Peso: peso,
        'Cidade Destino': cidades[cidadeDestinoIndex],
        'UF Destino': ufs[ufDestinoIndex],
        Base: bases[baseIndex],
        Setor: setores[setorIndex],
        'Frete Peso': fretePeso,
        Seguro: seguro,
        'Total Frete': totalFrete,
        Vendedor: vendedor,
        Cliente: cliente
      });
    }
    
    return registros;
  };

  const toggleModoVisualizacao = (modo: ModoVisualizacao) => {
    setModoVisualizacao(modo);
    
    // Resetar estados
    setError(null);
    setFileName(null);
    
    if (modo === ModoVisualizacao.ARMAZENAMENTO) {
      setMostrarFormularioArmazenamento(true);
      setMostrarFormularioConsulta(false);
    } else if (modo === ModoVisualizacao.VISUALIZACAO_SALVA) {
      setMostrarFormularioArmazenamento(false);
      setMostrarFormularioConsulta(true);
    } else {
      setMostrarFormularioArmazenamento(false);
      setMostrarFormularioConsulta(false);
    }
  };

  return (
    <div className="w-full">
      {/* Opções de Visualização */}
      {!ocultarBotoesModo && (
        <div className="flex space-x-4 mb-6">
          <button
            className={`flex items-center px-6 py-2 rounded-md transition-all ${
              modoVisualizacao === ModoVisualizacao.RAPIDA
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => toggleModoVisualizacao(ModoVisualizacao.RAPIDA)}
          >
            <FaBolt className="mr-2" />
            Visualização Rápida
          </button>
          
          <button
            className={`flex items-center px-6 py-2 rounded-md transition-all ${
              modoVisualizacao === ModoVisualizacao.ARMAZENAMENTO
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => toggleModoVisualizacao(ModoVisualizacao.ARMAZENAMENTO)}
          >
            <FaSave className="mr-2" />
            Análise com Armazenamento
          </button>
          
          <button
            className={`flex items-center px-6 py-2 rounded-md transition-all ${
              modoVisualizacao === ModoVisualizacao.VISUALIZACAO_SALVA
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => toggleModoVisualizacao(ModoVisualizacao.VISUALIZACAO_SALVA)}
            id="btn-consultar-analises-salvas"
          >
            <FaChartLine className="mr-2" />
            Consultar Análises Salvas
          </button>
        </div>
      )}
      
      {/* Formulário para modo Armazenamento */}
      {mostrarFormularioArmazenamento && (
        <div className="mb-6 p-4 bg-gray-800 border border-gray-700 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Informações para Armazenamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-gray-300 mb-2" htmlFor="nomeVendedor">
                Nome do Vendedor *
              </label>
              <div className="relative">
                <input
                  id="nomeVendedor"
                  type="text"
                  value={nomeVendedor}
                  onChange={handleVendedorInputChange}
                  onFocus={() => setShowVendedoresSuggestions(true)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-10"
                  placeholder="Insira o nome do vendedor"
                  ref={vendedorInputRef}
                  required
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isLoadingVendedores ? (
                    <div className="h-4 w-4 border-2 border-gray-400 border-t-gray-200 rounded-full animate-spin"></div>
                  ) : (
                    <FaSearch className="text-gray-400" />
                  )}
                </div>
              
                {/* Lista de sugestões de vendedores */}
                {showVendedoresSuggestions && filteredVendedores.length > 0 && (
                  <div 
                    ref={vendedorSuggestionBoxRef}
                    className="absolute z-10 mt-1 w-full left-0 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    <ul className="py-1">
                      {filteredVendedores.map((vendedor) => (
                        <li 
                          key={vendedor.id}
                          className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white"
                          onClick={() => selectVendedor(vendedor.nome)}
                        >
                          {vendedor.nome}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2" htmlFor="nomeCliente">
                Nome do Cliente *
              </label>
              <input
                id="nomeCliente"
                type="text"
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                placeholder="Insira o nome do cliente"
                required
                autoComplete="off"
              />
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">* Campos obrigatórios para o armazenamento de dados</p>
        </div>
      )}
      
      {/* Formulário para consulta de dados salvos */}
      {mostrarFormularioConsulta && (
        <div className="mb-6 p-4 bg-gray-800 border border-purple-700 rounded-md">
          <h3 className="text-lg font-semibold mb-4">Consultar Análises Salvas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Vendedor
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="consultaVendedor"
                  value={nomeVendedor}
                  onChange={handleVendedorInputChange}
                  onFocus={() => setShowVendedoresSuggestions(true)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-10"
                  placeholder="Digite o nome do vendedor"
                  ref={vendedorInputRef}
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isLoadingVendedores ? (
                    <div className="h-4 w-4 border-2 border-gray-400 border-t-gray-200 rounded-full animate-spin"></div>
                  ) : (
                    <FaSearch className="text-gray-400" />
                  )}
                </div>
                
                {/* Lista de sugestões de vendedores */}
                {showVendedoresSuggestions && (
                  <div 
                    ref={vendedorSuggestionBoxRef}
                    className="absolute z-10 mt-1 w-full left-0 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingVendedores ? (
                      <div className="py-2 px-4 text-center text-gray-300">Carregando...</div>
                    ) : filteredVendedores.length > 0 ? (
                      <ul className="py-1">
                        {filteredVendedores.map((vendedor) => (
                          <li 
                            key={vendedor.id}
                            className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white"
                            onClick={() => selectVendedor(vendedor.nome)}
                          >
                            {vendedor.nome}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-2 px-4 text-center text-gray-300">Nenhum vendedor encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 text-sm font-semibold mb-2">
                Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="consultaCliente"
                  value={nomeCliente}
                  onChange={handleClienteInputChange}
                  onFocus={() => nomeVendedor && setShowClientesSuggestions(true)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-10"
                  placeholder={nomeVendedor ? "Digite o nome do cliente" : "Selecione um vendedor primeiro"}
                  disabled={!nomeVendedor}
                  ref={clienteInputRef}
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isLoadingClientes ? (
                    <div className="h-4 w-4 border-2 border-gray-400 border-t-gray-200 rounded-full animate-spin"></div>
                  ) : (
                    <FaSearch className="text-gray-400" />
                  )}
                </div>
                
                {/* Lista de sugestões de clientes */}
                {showClientesSuggestions && (
                  <div 
                    ref={clienteSuggestionBoxRef}
                    className="absolute z-10 mt-1 w-full left-0 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    {isLoadingClientes ? (
                      <div className="py-2 px-4 text-center text-gray-300">Carregando...</div>
                    ) : filteredClientes.length > 0 ? (
                      <ul className="py-1">
                        {filteredClientes.map((cliente) => (
                          <li 
                            key={cliente.id}
                            className="px-4 py-2 hover:bg-gray-600 cursor-pointer text-white"
                            onClick={() => selectCliente(cliente.nome)}
                          >
                            {cliente.nome}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-2 px-4 text-center text-gray-300">Nenhum cliente encontrado</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex mt-4">
            <button
              id="btnBuscarAnalises"
              type="submit"
              className="w-full flex justify-center items-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              onClick={handleBuscarDados}
              disabled={isConsultando || (!nomeVendedor && !nomeCliente)}
            >
              {isConsultando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Consultando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path>
                  </svg>
                  Buscar Dados
                </>
              )}
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">Preencha pelo menos um dos campos para consultar dados armazenados</p>
        </div>
      )}
      
      {modoVisualizacao !== ModoVisualizacao.VISUALIZACAO_SALVA && (
        <div 
          className={`border-dashed border-2 ${isDragging ? 'border-primary' : 'border-gray-500'} rounded-lg p-12 text-center transition-colors`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-xl">Processando arquivo...</p>
            </div>
          ) : fileName ? (
            <div className="flex flex-col items-center">
              <div className="text-3xl text-green-500 mb-4">✓</div>
              <h3 className="text-xl font-semibold mb-2">Arquivo carregado com sucesso</h3>
              <p className="text-gray-400 mb-2">{fileName}</p>
              <button 
                onClick={handleButtonClick}
                className="bg-secondary hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded text-sm transition-all mt-2"
              >
                Selecionar outro arquivo
              </button>
            </div>
          ) : (
            <>
              <div className="text-5xl text-primary mb-4 flex justify-center">
                <FaUpload />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {modoVisualizacao === ModoVisualizacao.RAPIDA
                  ? "Arraste e solte o arquivo Excel para visualização"
                  : "Arraste e solte o arquivo Excel para armazenamento"}
              </h3>
              <p className="text-gray-400 mb-4">ou</p>
              <button 
                onClick={handleButtonClick}
                className="bg-primary hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded text-lg transition-all"
              >
                Selecione um arquivo
              </button>
              
              <div className="mt-6 flex items-center justify-center">
                <button
                  className="text-gray-400 text-sm flex items-center"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <FaInfoCircle className="mr-1" />
                  {showInfo ? 'Ocultar formato esperado' : 'Ver formato esperado'}
                </button>
              </div>
              
              {showInfo && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg text-left text-xs">
                  <p className="font-semibold mb-2">O arquivo XLSX deve conter as seguintes colunas:</p>
                  <code className="block bg-gray-900 p-2 rounded text-gray-300 overflow-x-auto whitespace-nowrap">
                    Data | Cidade Origem | UF Origem | Base Origem | NF | Valor da Nota | Volumes | Peso | Cidade Destino | UF Destino | Base | Setor | Frete Peso | Seguro | Total Frete
                  </code>
                  <p className="mt-2 font-semibold">Importante:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>O campo 'Data' será exibido no formato brasileiro (DD/MM/YYYY)</li>
                    <li>Os campos 'Valor da Nota', 'Frete Peso', 'Seguro' e 'Total Frete' serão exibidos como valores monetários (R$)</li>
                    <li>Os valores decimais no arquivo devem usar vírgula como separador (ex: 51,17)</li>
                  </ul>
                </div>
              )}
              
              <p className="text-gray-400 mt-4 text-sm">
                Formato suportado: Excel (.xlsx)
              </p>
            </>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".xlsx,.xls" 
            className="hidden" 
          />
        </div>
      )}
      
      {error && (
        <div className="mt-4 bg-red-900/50 text-red-200 p-3 rounded-lg">
          <p className="font-medium">Erro:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 