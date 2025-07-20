require('dotenv').config(); // Carrega variáveis do .env
const mysql = require('mysql2/promise');

// Configuração da conexão via variáveis de ambiente
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Cria tabela de contatos (se não existir)
async function initDB() {
  const sql = `
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await pool.query(sql);
  console.log('✅ Tabela "contacts" pronta!');
}

initDB();

module.exports = pool;