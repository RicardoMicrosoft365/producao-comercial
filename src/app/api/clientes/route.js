import { NextResponse } from 'next/server';
import database from '../../../services/db';

/**
 * Endpoint GET para buscar clientes, opcionalmente filtrados por vendedor
 * @param {Request} request - Objeto de requisição
 * @returns {Promise<NextResponse>} Resposta com os clientes
 */
export async function GET(request) {
  try {
    console.log('📩 Recebida requisição para buscar clientes');
    
    // Obter parâmetros da URL
    const url = new URL(request.url);
    const vendedor = url.searchParams.get('vendedor');
    const termo = url.searchParams.get('termo');
    
    // Garantir que o banco de dados esteja inicializado
    await database.initialize();
    
    // Construir a consulta SQL
    let sql = 'SELECT DISTINCT cliente FROM transportes WHERE cliente IS NOT NULL AND cliente != ""';
    const params = [];
    
    // Adicionar filtro por vendedor, se fornecido
    if (vendedor) {
      sql += ' AND vendedor = ?';
      params.push(vendedor);
      console.log(`🔍 Filtrando clientes do vendedor: "${vendedor}"`);
    }
    
    // Adicionar filtro por termo de busca, se fornecido
    if (termo) {
      sql += ' AND cliente LIKE ?';
      params.push(`%${termo}%`);
      console.log(`🔍 Filtrando clientes pelo termo: "${termo}"`);
    }
    
    // Ordenar por nome do cliente
    sql += ' ORDER BY cliente';
    
    console.log('📝 SQL:', sql);
    console.log('📊 Parâmetros:', params);
    
    // Executar a consulta
    const clientes = await new Promise((resolve, reject) => {
      database.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Erro ao buscar clientes:', err.message);
          reject(err);
        } else {
          // Transformar os resultados para o formato esperado pelo frontend
          const clientesMapeados = rows.map(row => ({
            id: row.cliente, // Usar o nome como ID já que não temos ID específico para clientes
            nome: row.cliente
          }));
          console.log(`✅ ${clientesMapeados.length} clientes encontrados`);
          resolve(clientesMapeados);
        }
      });
    });
    
    // Retornar o resultado
    return NextResponse.json({
      success: true,
      clientes: clientes
    });
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('❌ Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao buscar clientes: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 