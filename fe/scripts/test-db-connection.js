const sql = require('mssql')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  console.log('📂 Looking for .env.local at:', envPath)
  
  if (fs.existsSync(envPath)) {
    console.log('✅ .env.local file found')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split(/\r?\n/)
    lines.forEach((line, index) => {
      line = line.trim()
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) return
      
      const eqIndex = line.indexOf('=')
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim()
        const value = line.substring(eqIndex + 1).trim()
        process.env[key] = value
        if (key.startsWith('DB_')) {
          console.log(`   Loaded: ${key} = ${key.includes('PASSWORD') ? '***' : value}`)
        }
      }
    })
  } else {
    console.log('❌ .env.local file not found')
  }
  console.log()
}

loadEnv()

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'IdentityDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
}

console.log('🔍 Checking database connection...\n')
console.log('📋 Configuration:')
console.log('   Server:', config.server)
console.log('   Database:', config.database)
console.log('   User:', config.user)
console.log('   Password:', config.password ? '***' : '(empty)')
console.log('   Encrypt:', config.options.encrypt)
console.log('   Trust Certificate:', config.options.trustServerCertificate)
console.log('\n' + '='.repeat(50) + '\n')

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect...')
    const pool = await sql.connect(config)
    
    console.log('✅ Connected successfully!\n')
    
    // Test a simple query
    console.log('🔄 Testing query execution...')
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as currentDB')
    
    console.log('✅ Query executed successfully!\n')
    console.log('📊 Database Info:')
    console.log('   Current Database:', result.recordset[0].currentDB)
    console.log('   SQL Server Version:', result.recordset[0].version.split('\n')[0])
    
    // List tables in the database
    console.log('\n🔄 Fetching tables...')
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `)
    
    if (tables.recordset.length > 0) {
      console.log(`✅ Found ${tables.recordset.length} tables:`)
      tables.recordset.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.TABLE_NAME}`)
      })
    } else {
      console.log('⚠️  No tables found in database')
    }
    
    await pool.close()
    console.log('\n✅ Connection test completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Connection failed!\n')
    console.error('Error details:')
    console.error('   Type:', error.name)
    console.error('   Message:', error.message)
    
    if (error.code) {
      console.error('   Code:', error.code)
    }
    
    console.error('\n💡 Common issues and solutions:')
    console.error('   1. SQL Server not running → Start SQL Server service')
    console.error('   2. Wrong credentials → Check DB_USER and DB_PASSWORD')
    console.error('   3. Server not found → Check DB_SERVER address')
    console.error('   4. Database not exist → Check DB_NAME')
    console.error('   5. Firewall blocking → Check SQL Server port (default 1433)')
    console.error('   6. Missing .env file → Create .env with database credentials')
    
    process.exit(1)
  }
}

testConnection()
