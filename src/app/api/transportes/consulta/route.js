import { NextResponse } from 'next/server';
import database from '../../../../services/db';

export async function GET(request) {
  try {
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const vendedor = searchParams.get('vendedor');
    const cliente = searchParams.get('cliente');
    
    // Conectar ao banco de dados
    await database.connect();
    
    // Construir a consulta SQL com base nos parâmetros
    let sql = 'SELECT * FROM transportes WHERE 1=1';
    const params = [];
    
    if (vendedor) {
      sql += ' AND vendedor = ?';
      params.push(vendedor);
    }
    
    if (cliente) {
      sql += ' AND cliente = ?';
      params.push(cliente);
    }
    
    // Buscar registros
    const registros = await new Promise((resolve, reject) => {
      database.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Erro ao buscar registros:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    // Formatar os dados para o formato esperado pelo frontend
    const registrosFormatados = registros.map(row => ({
      Data: row.data,
      'Cidade Origem': row.cidade_origem,
      'UF Origem': row.uf_origem,
      'Base Origem': row.base_origem,
      NF: row.nf,
      'Valor da Nota': row.valor_da_nota,
      Volumes: row.volumes,
      Peso: row.peso_real,
      'Cidade Destino': row.cidade_destino,
      'UF Destino': row.uf_destino,
      Base: row.base,
      Setor: row.setor,
      'Frete Peso': row.frete_peso,
      Seguro: row.seguro,
      'Total Frete': row.total_frete,
      Vendedor: row.vendedor,
      Cliente: row.cliente
    }));
    
    // Fechar a conexão com o banco de dados
    await database.close();
    
    return NextResponse.json({
      success: true,
      registros: registrosFormatados
    });
  } catch (error) {
    console.error('Erro ao consultar transportes:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { success: false, message: `Erro ao consultar transportes: ${error.message}` },
      { status: 500 }
    );
  }
} 