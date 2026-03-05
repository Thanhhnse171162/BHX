const sql = require('mssql')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split(/\r?\n/)
    lines.forEach((line) => {
      line = line.trim()
      if (!line || line.startsWith('#')) return
      const eqIndex = line.indexOf('=')
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim()
        const value = line.substring(eqIndex + 1).trim()
        process.env[key] = value
      }
    })
  }
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

// Common passwords to test
const commonPasswords = [
  'Admin@123',
  'admin123',
  'Admin123',
  'password',
  'Password123',
  '12345',
  '123456',
  'admin',
]

async function testPasswords() {
  try {
    console.log('🔄 Connecting to database...')
    const pool = await sql.connect(config)
    console.log('✅ Connected!\n')
    
    // Get admin user
    const result = await pool.request()
      .input('email', 'admin@company.com')
      .query('SELECT password_hash FROM users WHERE email = @email')
    
    if (result.recordset.length === 0) {
      console.log('❌ Admin user not found!')
      return
    }

    const storedHash = result.recordset[0].password_hash
    console.log('🔍 Testing common passwords for admin@company.com...\n')

    for (const testPassword of commonPasswords) {
      const isMatch = await bcrypt.compare(testPassword, storedHash)
      if (isMatch) {
        console.log(`✅ PASSWORD FOUND: "${testPassword}"`)
        console.log(`\n🎉 You can login with:`)
        console.log(`   Email: admin@company.com`)
        console.log(`   Password: ${testPassword}`)
        await pool.close()
        return
      } else {
        console.log(`❌ Not "${testPassword}"`)
      }
    }

    console.log('\n⚠️  None of the common passwords matched.')
    console.log('💡 You may need to reset the password using reset-admin-password.js script')
    
    await pool.close()
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

testPasswords()
