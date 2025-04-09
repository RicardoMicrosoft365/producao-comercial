/**
 * Script para manipulação direta de vendedores no banco de dados
 * Este arquivo pode ser executado diretamente para adicionar, atualizar ou remover vendedores
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho para o banco de dados
const DB_DIR = path.join(process.cwd(), 'database');
const DB_PATH = path.join(DB_DIR, 'transportes.db');

// Garantir que o diretório existe
if (!fs.existsSync(DB_DIR)) {
  console.log(`🔨 Criando diretório do banco de dados: ${DB_DIR}`);
  fs.mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Conecta ao banco de dados
 * @returns {Promise<sqlite3.Database>} Conexão com o banco de dados
 */
function conectarBanco() {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Conectando ao banco de dados em: ${DB_PATH}`);
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err.message);
        reject(err);
      } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        resolve(db);
      }
    });
  });
}

/**
 * Fecha a conexão com o banco de dados
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @returns {Promise<void>}
 */
function fecharBanco(db) {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Erro ao fechar banco de dados:', err.message);
        reject(err);
      } else {
        console.log('🔌 Conexão com o banco de dados fechada');
        resolve();
      }
    });
  });
}

/**
 * Cria a tabela de vendedores se não existir
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @returns {Promise<void>}
 */
function criarTabelaVendedores(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS vendedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL UNIQUE
      )
    `, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabela de vendedores:', err.message);
        reject(err);
      } else {
        console.log('✅ Tabela de vendedores verificada/criada com sucesso');
        resolve();
      }
    });
  });
}

/**
 * Verifica se já existem vendedores no banco de dados
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @returns {Promise<number>} Número de vendedores
 */
function contarVendedores(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM vendedores', (err, row) => {
      if (err) {
        console.error('❌ Erro ao contar vendedores:', err.message);
        reject(err);
      } else {
        console.log(`ℹ️ Total de vendedores: ${row.count}`);
        resolve(row.count);
      }
    });
  });
}

/**
 * Insere vendedores padrão no banco de dados
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @returns {Promise<void>}
 */
async function inserirVendedoresPadrao(db) {
  const vendedoresPadrao = [
    'Amélia Oliveira',
    'Fernando Ribeiro',
    'Agustinho Ormeneze',
    'Sandro Roberto',
    'Alex Borges',
    'Clovis Cunha',
    'Fabio Rosa',
    'Evandro Lima',
    'Rogério Silva'
  ];
  
  console.log(`ℹ️ Inserindo ${vendedoresPadrao.length} vendedores padrão...`);
  
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', async (err) => {
      if (err) {
        console.error('❌ Erro ao iniciar transação:', err.message);
        reject(err);
        return;
      }
      
      try {
        for (const nome of vendedoresPadrao) {
          await new Promise((resolveInsert, rejectInsert) => {
            db.run('INSERT OR IGNORE INTO vendedores (nome) VALUES (?)', [nome], (err) => {
              if (err) {
                console.error(`❌ Erro ao inserir vendedor "${nome}":`, err.message);
                rejectInsert(err);
              } else {
                console.log(`✅ Vendedor "${nome}" inserido ou já existente`);
                resolveInsert();
              }
            });
          });
        }
        
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('❌ Erro ao finalizar transação:', err.message);
            reject(err);
          } else {
            console.log('✅ Vendedores padrão inseridos com sucesso');
            resolve();
          }
        });
      } catch (error) {
        db.run('ROLLBACK', () => {
          console.error('❌ Transação revertida devido a erro:', error.message);
          reject(error);
        });
      }
    });
  });
}

/**
 * Adiciona um novo vendedor
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @param {string} nome - Nome do vendedor
 * @returns {Promise<number>} ID do vendedor inserido
 */
function adicionarVendedor(db, nome) {
  return new Promise((resolve, reject) => {
    if (!nome || nome.trim() === '') {
      reject(new Error('Nome do vendedor é obrigatório'));
      return;
    }
    
    db.run('INSERT INTO vendedores (nome) VALUES (?)', [nome.trim()], function(err) {
      if (err) {
        // Se o erro for de chave duplicada, informar que o vendedor já existe
        if (err.message.includes('UNIQUE constraint failed')) {
          console.error(`❌ Vendedor "${nome}" já existe`);
          reject(new Error(`Vendedor "${nome}" já existe`));
        } else {
          console.error(`❌ Erro ao adicionar vendedor "${nome}":`, err.message);
          reject(err);
        }
      } else {
        console.log(`✅ Vendedor "${nome}" adicionado com ID ${this.lastID}`);
        resolve(this.lastID);
      }
    });
  });
}

/**
 * Lista todos os vendedores
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @returns {Promise<Array>} Lista de vendedores
 */
function listarVendedores(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, nome FROM vendedores ORDER BY nome', (err, rows) => {
      if (err) {
        console.error('❌ Erro ao listar vendedores:', err.message);
        reject(err);
      } else {
        console.log(`✅ ${rows.length} vendedores encontrados`);
        resolve(rows);
      }
    });
  });
}

/**
 * Busca vendedores por nome
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @param {string} termo - Termo de busca
 * @returns {Promise<Array>} Lista de vendedores encontrados
 */
function buscarVendedores(db, termo) {
  return new Promise((resolve, reject) => {
    if (!termo || termo.trim() === '') {
      return listarVendedores(db).then(resolve).catch(reject);
    }
    
    const termoBusca = `%${termo.trim()}%`;
    db.all('SELECT id, nome FROM vendedores WHERE nome LIKE ? ORDER BY nome', [termoBusca], (err, rows) => {
      if (err) {
        console.error(`❌ Erro ao buscar vendedores com termo "${termo}":`, err.message);
        reject(err);
      } else {
        console.log(`✅ ${rows.length} vendedores encontrados com o termo "${termo}"`);
        resolve(rows);
      }
    });
  });
}

/**
 * Atualiza o nome de um vendedor
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @param {number} id - ID do vendedor
 * @param {string} novoNome - Novo nome do vendedor
 * @returns {Promise<boolean>} Verdadeiro se a atualização foi bem-sucedida
 */
function atualizarVendedor(db, id, novoNome) {
  return new Promise((resolve, reject) => {
    if (!id || isNaN(parseInt(id))) {
      reject(new Error('ID do vendedor inválido'));
      return;
    }
    
    if (!novoNome || novoNome.trim() === '') {
      reject(new Error('Nome do vendedor é obrigatório'));
      return;
    }
    
    db.run('UPDATE vendedores SET nome = ? WHERE id = ?', [novoNome.trim(), id], function(err) {
      if (err) {
        console.error(`❌ Erro ao atualizar vendedor com ID ${id}:`, err.message);
        reject(err);
      } else if (this.changes === 0) {
        console.error(`❌ Vendedor com ID ${id} não encontrado`);
        reject(new Error(`Vendedor com ID ${id} não encontrado`));
      } else {
        console.log(`✅ Vendedor com ID ${id} atualizado para "${novoNome}"`);
        resolve(true);
      }
    });
  });
}

/**
 * Remove um vendedor
 * @param {sqlite3.Database} db - Conexão com o banco de dados
 * @param {number} id - ID do vendedor
 * @returns {Promise<boolean>} Verdadeiro se a remoção foi bem-sucedida
 */
function removerVendedor(db, id) {
  return new Promise((resolve, reject) => {
    if (!id || isNaN(parseInt(id))) {
      reject(new Error('ID do vendedor inválido'));
      return;
    }
    
    db.run('DELETE FROM vendedores WHERE id = ?', [id], function(err) {
      if (err) {
        console.error(`❌ Erro ao remover vendedor com ID ${id}:`, err.message);
        reject(err);
      } else if (this.changes === 0) {
        console.error(`❌ Vendedor com ID ${id} não encontrado`);
        reject(new Error(`Vendedor com ID ${id} não encontrado`));
      } else {
        console.log(`✅ Vendedor com ID ${id} removido com sucesso`);
        resolve(true);
      }
    });
  });
}

/**
 * Função principal que executa as operações básicas
 */
async function main() {
  let db = null;
  
  try {
    // Conectar ao banco de dados
    db = await conectarBanco();
    
    // Criar tabela de vendedores se não existir
    await criarTabelaVendedores(db);
    
    // Verificar se já existem vendedores
    const count = await contarVendedores(db);
    
    // Se não houver vendedores, inserir os padrão
    if (count === 0) {
      await inserirVendedoresPadrao(db);
    }
    
    // Listar todos os vendedores
    const vendedores = await listarVendedores(db);
    console.table(vendedores);
    
    // Exemplos de uso (comentados para não executar por padrão)
    /*
    // Adicionar um novo vendedor
    const novoId = await adicionarVendedor(db, 'João Silva');
    console.log(`Novo vendedor adicionado com ID: ${novoId}`);
    
    // Buscar vendedores com "Silva" no nome
    const resultadoBusca = await buscarVendedores(db, 'Silva');
    console.table(resultadoBusca);
    
    // Atualizar um vendedor
    await atualizarVendedor(db, novoId, 'João Silva Junior');
    
    // Remover um vendedor
    await removerVendedor(db, novoId);
    */
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
  } finally {
    // Fechar a conexão com o banco de dados
    if (db) {
      await fecharBanco(db);
    }
  }
}

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  main().catch(console.error);
}

// Exportar funções para uso em outros scripts
module.exports = {
  conectarBanco,
  fecharBanco,
  criarTabelaVendedores,
  contarVendedores,
  inserirVendedoresPadrao,
  adicionarVendedor,
  listarVendedores,
  buscarVendedores,
  atualizarVendedor,
  removerVendedor
}; 