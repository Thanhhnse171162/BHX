/**
 * Test ProductDB Connection Script
 * Run: node scripts/test-productdb-connection.js
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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

async function testProductDBConnection() {
  console.log('🔍 Testing ProductDB Connection...')
  console.log('📋 Config:', {
    user: config.user,
    server: config.server,
    database: config.database,
  })

  try {
    // Connect
    console.log('\n⏳ Connecting to ProductDB...')
    const pool = await sql.connect(config)
    console.log('✅ Connected to ProductDB successfully!')

    // Test 1: Get products count
    console.log('\n📦 Test 1: Count products...')
    const countResult = await pool.request().query('SELECT COUNT(*) as total FROM dbo.products')
    console.log(`   Total products: ${countResult.recordset[0].total}`)

    // Test 2: Get sample products
    console.log('\n📦 Test 2: Get sample products...')
    const productsResult = await pool.request().query(`
      SELECT TOP 5 
        id, sku, name, brand, origin, price, unit
      FROM dbo.products
      ORDER BY created_at DESC
    `)
    console.log(`   Found ${productsResult.recordset.length} products:`)
    console.table(productsResult.recordset)

    // Test 3: Get categories count
    console.log('\n📁 Test 3: Count categories...')
    const categoriesCountResult = await pool.request().query('SELECT COUNT(*) as total FROM dbo.categories')
    console.log(`   Total categories: ${categoriesCountResult.recordset[0].total}`)

    // Test 4: Get sample categories
    console.log('\n📁 Test 4: Get sample categories...')
    const categoriesResult = await pool.request().query(`
      SELECT TOP 5 
        id, name, status
      FROM dbo.categories
      WHERE is_deleted = 0
      ORDER BY name ASC
    `)
    console.log(`   Found ${categoriesResult.recordset.length} categories:`)
    console.table(categoriesResult.recordset)

    // Test 5: Search test
    console.log('\n🔍 Test 5: Search products containing "Rau"...')
    const searchResult = await pool.request()
      .input('search', sql.NVarChar, '%Rau%')
      .query('SELECT TOP 3 id, sku, name, price FROM dbo.products WHERE name LIKE @search')
    console.log(`   Found ${searchResult.recordset.length} products:`)
    console.table(searchResult.recordset)

    // Test 6: Query with parameters
    console.log('\n💰 Test 6: Products under 20000 VND...')
    const priceResult = await pool.request()
      .input('maxPrice', sql.Decimal(18, 2), 20000)
      .query('SELECT TOP 5 id, name, price FROM dbo.products WHERE price < @maxPrice ORDER BY price DESC')
    console.log(`   Found ${priceResult.recordset.length} products:`)
    console.table(priceResult.recordset)

    // Close connection
    await pool.close()
    console.log('\n🔌 Connection closed')
    console.log('\n✅ All tests passed!')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\n📝 Details:', error)
    process.exit(1)
  }
}

// Run test
testProductDBConnection()
