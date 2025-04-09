import { NextResponse } from 'next/server';
import database from '../../../../services/db';

export async function POST(request) {
  try {
    console.log('📩 Recebida requisição para armazenar dados de transporte');
    
    // Obter dados da requisição
    const data = await request.json();
    
    // Verificar se os dados obrigatórios estão presentes
    if (!data || !Array.isArray(data.transportes) || data.transportes.length === 0) {
      console.error('❌ Dados inválidos na requisição:', data);
      return NextResponse.json(
        { success: false, message: 'Dados inválidos ou ausentes' },
        { status: 400 }
      );
    }

    if (!data.vendedor || !data.cliente) {
      console.error('❌ Vendedor ou cliente ausentes:', { vendedor: data.vendedor, cliente: data.cliente });
      return NextResponse.json(
        { success: false, message: 'Vendedor e Cliente são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`ℹ️ Recebidos ${data.transportes.length} registros para armazenamento`);
    console.log(`ℹ️ Vendedor: ${data.vendedor}, Cliente: ${data.cliente}`);
    
    // Amostra dos dados para depuração
    if (data.transportes.length > 0) {
      console.log('📊 Exemplo do primeiro registro:', JSON.stringify(data.transportes[0], null, 2));
    }

    // Garantir que o banco de dados esteja inicializado
    await database.initialize();
    
    // Conectar ao banco de dados
    await database.connect();
    
    // Inicializar contador de registros inseridos
    let registrosInseridos = 0;
    let erros = [];
    
    // Inserir registros no banco de dados
    for (const transporte of data.transportes) {
      try {
        // Verificar se os campos obrigatórios estão presentes
        const camposObrigatorios = ['data', 'cidade_origem', 'uf_origem', 'nf'];
        const camposFaltantes = camposObrigatorios.filter(campo => !transporte[campo]);
        
        if (camposFaltantes.length > 0) {
          console.warn(`⚠️ Registro com campos obrigatórios ausentes: ${camposFaltantes.join(', ')}`);
          erros.push(`Registro NF:${transporte.nf || 'N/A'} - Campos ausentes: ${camposFaltantes.join(', ')}`);
          continue;
        }
        
        // Garantir que temos uma data_inclusao
        if (!transporte.data_inclusao) {
          console.log('ℹ️ Data de inclusão não encontrada, adicionando data atual');
          transporte.data_inclusao = new Date().toISOString().split('T')[0];
        }
        
        console.log(`📅 Data de inclusão para NF=${transporte.nf}: ${transporte.data_inclusao}`);
        
        // Registrar tentativa de inserção
        console.log(`📥 Tentando inserir registro: NF=${transporte.nf || 'N/A'}`);
        
        // Inserir no banco de dados
        const id = await database.insertTransporte(transporte);
        console.log(`✅ Registro inserido com ID: ${id}`);
        registrosInseridos++;
      } catch (err) {
        console.error('❌ Erro ao inserir registro:', err);
        erros.push(`${err.message} (NF: ${transporte.nf || 'N/A'})`);
      }
    }
    
    // Fechar a conexão com o banco de dados
    await database.close();
    
    // Verificar se houve erros
    if (registrosInseridos === 0 && erros.length > 0) {
      console.error('❌ Nenhum registro foi inserido, retornando erro');
      return NextResponse.json({
        success: false,
        message: 'Nenhum registro foi inserido devido a erros',
        errors: erros
      }, { status: 500 });
    }
    
    // Retornar resultado com sucesso parcial se houver erros
    const mensagem = erros.length > 0 
      ? `${registrosInseridos} registros armazenados com sucesso, porém ocorreram ${erros.length} erros.`
      : `${registrosInseridos} registros armazenados com sucesso.`;
      
    console.log(`ℹ️ ${mensagem}`);
    
    return NextResponse.json({
      success: true,
      message: mensagem,
      count: registrosInseridos,
      errors: erros.length > 0 ? erros : undefined
    });
  } catch (error) {
    console.error('❌ Erro ao armazenar transportes:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('❌ Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { success: false, message: `Erro ao armazenar transportes: ${error.message}` },
      { status: 500 }
    );
  }
} 