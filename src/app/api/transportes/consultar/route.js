import { NextResponse } from 'next/server';
import database from '../../../../services/db';

export async function GET(request) {
  try {
    console.log('📩 Recebida requisição para consultar dados de transporte');
    
    // Obter parâmetros da URL
    const url = new URL(request.url);
    const vendedor = url.searchParams.get('vendedor');
    const cliente = url.searchParams.get('cliente');
    
    // Verificar se ao menos um parâmetro foi fornecido
    if (!vendedor && !cliente) {
      console.error('❌ Nenhum parâmetro de filtro fornecido');
      return NextResponse.json(
        { success: false, message: 'É necessário informar pelo menos o vendedor ou o cliente' },
        { status: 400 }
      );
    }

    console.log(`ℹ️ Parâmetros recebidos: Vendedor="${vendedor || ''}", Cliente="${cliente || ''}"`);
    
    // Garantir que o banco de dados esteja inicializado
    await database.initialize();
    
    // Conectar ao banco de dados
    await database.connect();
    
    // Preparar filtros para consulta
    const filtros = {};
    if (vendedor) {
      filtros.vendedor = vendedor;
    }
    if (cliente) {
      filtros.cliente = cliente;
    }
    
    console.log(`🔍 Consultando transportes com filtros:`, filtros);
    
    // Consultar dados no banco
    const resultado = await database.searchTransportes(filtros);
    
    // Fechar a conexão com o banco de dados
    await database.close();
    
    // Verificar se há resultados
    if (!resultado || resultado.length === 0) {
      console.log('ℹ️ Nenhum registro encontrado para os critérios informados');
      return NextResponse.json(
        { success: false, message: 'Nenhum registro encontrado para os critérios informados' },
        { status: 404 }
      );
    }
    
    console.log(`✅ Consulta realizada com sucesso. ${resultado.length} registros encontrados`);
    
    return NextResponse.json({
      success: true,
      message: `${resultado.length} registros encontrados`,
      data: resultado
    });
  } catch (error) {
    console.error('❌ Erro ao consultar transportes:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('❌ Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { success: false, message: `Erro ao consultar transportes: ${error.message}` },
      { status: 500 }
    );
  }
} 