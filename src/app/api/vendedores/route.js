import { NextResponse } from 'next/server';
import database from '../../../services/db';

/**
 * Endpoint GET para buscar vendedores
 * @param {Request} request - Objeto de requisição
 * @returns {Promise<NextResponse>} Resposta com os vendedores
 */
export async function GET(request) {
  try {
    console.log('📩 Recebida requisição para buscar vendedores');
    
    // Obter parâmetros da URL
    const url = new URL(request.url);
    const termo = url.searchParams.get('termo');
    
    // Garantir que o banco de dados esteja inicializado
    await database.initialize();
    
    let resultado;
    
    // Se um termo de busca foi fornecido, buscar vendedores que correspondem ao termo
    if (termo) {
      console.log(`🔍 Buscando vendedores com o termo: "${termo}"`);
      resultado = await database.searchVendedores(termo);
    } else {
      // Caso contrário, buscar todos os vendedores
      console.log('🔍 Buscando todos os vendedores');
      resultado = await database.getVendedores();
    }
    
    // Retornar o resultado
    return NextResponse.json({
      success: true,
      vendedores: resultado
    });
  } catch (error) {
    console.error('❌ Erro ao buscar vendedores:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('❌ Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao buscar vendedores: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint POST para adicionar um novo vendedor
 * @param {Request} request - Objeto de requisição
 * @returns {Promise<NextResponse>} Resposta de sucesso ou erro
 */
export async function POST(request) {
  try {
    console.log('📩 Recebida requisição para adicionar novo vendedor');
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Validar dados
    if (!data.nome) {
      return NextResponse.json(
        { success: false, message: 'Nome do vendedor é obrigatório' },
        { status: 400 }
      );
    }
    
    // Garantir que o banco de dados esteja inicializado
    await database.initialize();
    
    // Verificar se o vendedor já existe
    const vendedores = await database.searchVendedores(data.nome);
    if (vendedores.some(v => v.nome.toLowerCase() === data.nome.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Vendedor já existe' },
        { status: 409 }
      );
    }
    
    // Adicionar vendedor
    const id = await new Promise((resolve, reject) => {
      database.db.run('INSERT INTO vendedores (nome) VALUES (?)', [data.nome], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Vendedor adicionado com sucesso',
      vendedor: { id, nome: data.nome }
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar vendedor:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('❌ Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Erro ao adicionar vendedor: ${error.message}` 
      },
      { status: 500 }
    );
  }
} 