import { NextResponse } from 'next/server';
import database from '../../../../services/db';

export async function GET() {
  try {
    // Conectar ao banco de dados
    await database.connect();
    
    // Buscar análises agrupadas por vendedor e cliente
    const analises = await new Promise((resolve, reject) => {
      database.db.all(`
        SELECT 
          vendedor,
          cliente,
          COUNT(nf) as registros,
          SUM(total_frete) as valor_total,
          MAX(rowid) as id,
          MAX(data_inclusao) as data_inclusao
        FROM transportes
        WHERE vendedor IS NOT NULL AND vendedor != '' AND cliente IS NOT NULL AND cliente != ''
        GROUP BY vendedor, cliente
        ORDER BY data_inclusao DESC
        LIMIT 10
      `, [], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar análises:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    
    // Formatar os dados para a timeline
    const analisesFormatadas = analises.map((item, index) => ({
      id: item.id || index + 1,
      vendedor: item.vendedor,
      cliente: item.cliente,
      data: item.data_inclusao || new Date().toISOString().split('T')[0],
      registros: item.registros,
      valorTotal: item.valor_total
    }));
    
    // Fechar a conexão com o banco de dados
    await database.close();
    
    return NextResponse.json({
      success: true,
      analises: analisesFormatadas
    });
  } catch (error) {
    console.error('Erro ao buscar últimas análises:', error);
    
    // Garantir que a conexão com o banco seja fechada em caso de erro
    try {
      await database.close();
    } catch (e) {
      console.error('Erro ao fechar conexão:', e);
    }
    
    return NextResponse.json(
      { success: false, message: `Erro ao buscar últimas análises: ${error.message}` },
      { status: 500 }
    );
  }
} 