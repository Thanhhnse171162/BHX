const sql = require('mssql')
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

async function checkUsers() {
  try {
    console.log('🔄 Connecting to database...')
    const pool = await sql.connect(config)
    console.log('✅ Connected!\n')
    
    // Check users table structure
    console.log('📋 Users table structure:')
    const structure = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `)
    
    structure.recordset.forEach(col => {
      console.log(`   ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''}) ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`)
    })
    
    // Check existing users
    console.log('\n👥 Existing users:')
    const users = await pool.request().query(`
      SELECT id, email, full_name, role_id, status, phone, email_verified
      FROM users
    `)
    
    if (users.recordset.length > 0) {
      console.log(`   Found ${users.recordset.length} user(s):\n`)
      users.recordset.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`)
        console.log(`      Name: ${user.full_name || 'N/A'}`)
        console.log(`      Phone: ${user.phone || 'N/A'}`)
        console.log(`      Role ID: ${user.role_id}`)
        console.log(`      Status: ${user.status}`)
        console.log(`      Email Verified: ${user.email_verified}`)
        console.log()
      })
    } else {
      console.log('   ⚠️ No users found in database!')
    }
    
    // Check if admin@company.com exists
    console.log('🔍 Checking for admin@company.com:')
    const admin = await pool.request()
      .input('email', sql.NVarChar, 'admin@company.com')
      .query('SELECT * FROM users WHERE email = @email')
    
    if (admin.recordset.length > 0) {
      console.log('   ✅ Admin user exists')
      const adminUser = admin.recordset[0]
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Name: ${adminUser.full_name || 'N/A'}`)
      console.log(`   Password stored: ${adminUser.password_hash ? 'Yes (hashed)' : 'No'}`)
      console.log(`   Status: ${adminUser.status}`)
      console.log(`   Email Verified: ${adminUser.email_verified}`)
    } else {
      console.log('   ❌ Admin user NOT found!')
      console.log('   You need to create an admin user first.')
    }
    
    await pool.close()
    console.log('\n✅ Check completed!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

checkUsers()
