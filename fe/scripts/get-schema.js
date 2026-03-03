/**
 * Get database schema
 */
const sql = require('mssql')

const config = {
  user: 'sa',
  password: '12345',
  server: 'localhost',
  database: 'ProductDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
}

async function getSchema() {
  try {
    const pool = await sql.connect(config)
    
    // Get products columns
    console.log('📦 Products table columns:')
    const productsColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `)
    console.table(productsColumns.recordset)
    
    // Get categories columns
    console.log('\n📁 Categories table columns:')
    const categoriesColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'categories' AND TABLE_SCHEMA = 'dbo'
      ORDER BY ORDINAL_POSITION
    `)
    console.table(categoriesColumns.recordset)
    
    await pool.close()
  } catch (error) {
    console.error('Error:', error)
  }
}

getSchema()
