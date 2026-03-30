import sql from 'mssql'

function getHostFromUrl(value?: string): string | undefined {
  if (!value) return undefined

  try {
    return new URL(value).hostname
  } catch {
    return undefined
  }
}

function createProductDbConfig(): sql.config {
  const inferredProductServer =
    process.env.PRODUCT_DB_SERVER ||
    getHostFromUrl(process.env.CATALOG_URL) ||
    getHostFromUrl(process.env.NEXT_PUBLIC_CATALOG_URL) ||
    getHostFromUrl(process.env.NEXT_PUBLIC_API_BASE_URL)

  if (process.env.NODE_ENV === 'production' && !inferredProductServer) {
    throw new Error('Missing ProductDB server configuration: set PRODUCT_DB_SERVER for production runtime.')
  }

  return {
    user: process.env.PRODUCT_DB_USER || 'sa',
    password: process.env.PRODUCT_DB_PASSWORD || '12345',
    server: inferredProductServer || 'localhost',
    database: process.env.PRODUCT_DB_NAME || 'ProductDB',
    options: {
      encrypt: process.env.PRODUCT_DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.PRODUCT_DB_TRUST_CERT === 'true',
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
}

/**
 * ProductDB Connection Configuration
 * Separate connection pool for ProductDB (Catalog & Products)
 */

// Debug: Log environment variables
console.log('🛒 ProductDB Config:', {
  user: process.env.PRODUCT_DB_USER,
  hasPassword: !!process.env.PRODUCT_DB_PASSWORD,
  server: process.env.PRODUCT_DB_SERVER,
  database: process.env.PRODUCT_DB_NAME,
  encrypt: process.env.PRODUCT_DB_ENCRYPT,
  trustCert: process.env.PRODUCT_DB_TRUST_CERT,
})

let productPool: sql.ConnectionPool | null = null

/**
 * Get ProductDB connection pool
 */
export async function getProductDbConnection(): Promise<sql.ConnectionPool> {
  if (productPool && productPool.connected) {
    return productPool
  }

  try {
    const productDbConfig = createProductDbConfig()
    productPool = await sql.connect(productDbConfig)
    console.log('✅ ProductDB connected successfully')
    return productPool
  } catch (error) {
    console.error('❌ ProductDB connection error:', error)
    throw error
  }
}

/**
 * Close ProductDB connection
 */
export async function closeProductDbConnection(): Promise<void> {
  if (productPool) {
    await productPool.close()
    productPool = null
    console.log('🔌 ProductDB connection closed')
  }
}

/**
 * Execute query on ProductDB
 */
export async function executeProductQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getProductDbConnection()
  const request = pool.request()

  // Add parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        request.input(key, sql.NVarChar(sql.MAX), value)
      } else if (typeof value === 'number') {
        // Check if it's a decimal or integer
        if (Number.isInteger(value)) {
          request.input(key, sql.Int, value)
        } else {
          request.input(key, sql.Decimal(18, 2), value)
        }
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value)
      } else if (value instanceof Date) {
        request.input(key, sql.DateTime, value)
      } else if (value === null || value === undefined) {
        request.input(key, sql.NVarChar(sql.MAX), null)
      } else {
        request.input(key, value)
      }
    })
  }

  const result = await request.query(query)
  return result.recordset as T[]
}

/**
 * Execute stored procedure on ProductDB
 */
export async function executeProductProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getProductDbConnection()
  const request = pool.request()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        request.input(key, sql.NVarChar(sql.MAX), value)
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          request.input(key, sql.Int, value)
        } else {
          request.input(key, sql.Decimal(18, 2), value)
        }
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value)
      } else if (value instanceof Date) {
        request.input(key, sql.DateTime, value)
      } else {
        request.input(key, value)
      }
    })
  }

  const result = await request.execute(procedureName)
  return result.recordset as T[]
}

export { sql }
