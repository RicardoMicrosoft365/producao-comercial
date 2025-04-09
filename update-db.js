const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const DB_DIR = path.join(process.cwd(), 'database');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'transportes.db');

// Check if database file exists
if (!fs.existsSync(DB_PATH)) {
  console.error('Banco de dados não encontrado. Execute primeiro create-db.js para criar o banco.');
  process.exit(1);
}

// Connect to the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  
  console.log('Banco de dados SQLite conectado.');
  
  // Check if columns already exist
  db.all("PRAGMA table_info(transportes)", [], (err, columns) => {
    if (err) {
      console.error('Erro ao verificar colunas:', err.message);
      db.close();
      process.exit(1);
    }
    
    const columnNames = columns.map(col => col.name);
    console.log('Colunas atuais:', columnNames.join(', '));
    
    // Check if 'vendedor' and 'cliente' columns already exist
    const vendedorExists = columnNames.includes('vendedor');
    const clienteExists = columnNames.includes('cliente');
    
    if (vendedorExists && clienteExists) {
      console.log('Colunas "vendedor" e "cliente" já existem no banco de dados. Nenhuma atualização necessária.');
      db.close();
      process.exit(0);
    }
    
    // Add missing columns
    const operations = [];
    
    if (!vendedorExists) {
      operations.push(new Promise((resolve, reject) => {
        db.run("ALTER TABLE transportes ADD COLUMN vendedor TEXT", (err) => {
          if (err) {
            console.error('Erro ao adicionar coluna vendedor:', err.message);
            reject(err);
          } else {
            console.log('Coluna "vendedor" adicionada com sucesso.');
            resolve();
          }
        });
      }));
    }
    
    if (!clienteExists) {
      operations.push(new Promise((resolve, reject) => {
        db.run("ALTER TABLE transportes ADD COLUMN cliente TEXT", (err) => {
          if (err) {
            console.error('Erro ao adicionar coluna cliente:', err.message);
            reject(err);
          } else {
            console.log('Coluna "cliente" adicionada com sucesso.');
            resolve();
          }
        });
      }));
    }
    
    // Execute operations and close the database
    Promise.all(operations)
      .then(() => {
        console.log('Atualização do banco de dados concluída com sucesso!');
        db.close();
      })
      .catch((err) => {
        console.error('Erro durante a atualização do banco de dados:', err);
        db.close();
        process.exit(1);
      });
  });
}); 