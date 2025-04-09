/**
 * Script para adicionar um novo vendedor
 * Uso: node adicionar-vendedor.js "Nome do Vendedor"
 */

const { conectarBanco, fecharBanco, adicionarVendedor, listarVendedores } = require('./vendedor');

async function main() {
  // Verificar se o nome do vendedor foi fornecido
  const nomeVendedor = process.argv[2];
  
  if (!nomeVendedor) {
    console.error('❌ Erro: Nome do vendedor não fornecido');
    console.log('Uso: node adicionar-vendedor.js "Nome do Vendedor"');
    process.exit(1);
  }
  
  let db = null;
  
  try {
    // Conectar ao banco de dados
    db = await conectarBanco();
    
    // Adicionar o vendedor
    const id = await adicionarVendedor(db, nomeVendedor);
    console.log(`✅ Vendedor "${nomeVendedor}" adicionado com ID ${id}`);
    
    // Listar todos os vendedores
    console.log('\n📋 Lista atualizada de vendedores:');
    const vendedores = await listarVendedores(db);
    console.table(vendedores);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    // Fechar a conexão com o banco de dados
    if (db) {
      await fecharBanco(db);
    }
  }
}

// Executar a função principal
main().catch(console.error); 