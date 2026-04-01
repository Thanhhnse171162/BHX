import sql from 'mssql'

function getHostFromUrl(value?: string): string | undefined {
  if (!value) return undefined

  try {
    return new URL(value).hostname
  } catch {
    return undefined
  }
}

function createDbConfig(): sql.config {
  const inferredServer =
    process.env.DB_SERVER ||
    getHostFromUrl(process.env.IAM_URL) ||
    getHostFromUrl(process.env.NEXT_PUBLIC_IAM_URL) ||
    getHostFromUrl(process.env.NEXT_PUBLIC_API_BASE_URL)


  
  if (process.env.NODE_ENV === 'production' && !inferredServer) {
    console.warn('⚠️ Warning: DB_SERVER not configured, falling back to localhost. Set DB_SERVER env var for production.')
  }

  return {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '12345',
    server: inferredServer || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    database: process.env.DB_NAME || 'IdentityDB',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true', // Use true for Azure
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // Use true for local dev
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  }
}

// Debug: Log environment variables
console.log('🔧 DB Config:', {
  user: process.env.DB_USER,
  hasPassword: !!process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: process.env.DB_PORT || 1433,
  database: process.env.DB_NAME,
  encrypt: process.env.DB_ENCRYPT,
  trustCert: process.env.DB_TRUST_CERT,
})

let pool: sql.ConnectionPool | null = null

export async function getDbConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool
  }

  try {
    const config = createDbConfig()
    pool = await sql.connect(config)
    console.log('Database connected successfully')
    return pool
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

export async function closeDbConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

// Helper function to execute queries
export async function executeQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getDbConnection()
  const request = pool.request()

  // Add parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Explicitly set SQL type for string values to handle long strings like password hashes
      if (typeof value === 'string') {
        // Use NVarChar with max length for long strings
        if (value.length > 255 || key.toLowerCase().includes('hash') || key.toLowerCase().includes('password')) {
          request.input(key, sql.NVarChar(sql.MAX), value)
        } else {
          request.input(key, sql.NVarChar(255), value)
        }
      } else if (typeof value === 'number') {
        request.input(key, sql.Int, value)
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value)
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

// Helper function to execute stored procedures
export async function executeProcedure<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getDbConnection()
  const request = pool.request()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Explicitly set SQL type for string values
      if (typeof value === 'string') {
        if (value.length > 255 || key.toLowerCase().includes('hash') || key.toLowerCase().includes('password')) {
          request.input(key, sql.NVarChar(sql.MAX), value)
        } else {
          request.input(key, sql.NVarChar(255), value)
        }
      } else if (typeof value === 'number') {
        request.input(key, sql.Int, value)
      } else if (typeof value === 'boolean') {
        request.input(key, sql.Bit, value)
      } else if (value === null || value === undefined) {
        request.input(key, sql.NVarChar(sql.MAX), null)
      } else {
        request.input(key, value)
      }
    })
  }

  const result = await request.execute(procedureName)
  return result.recordset as T[]
}


