import { NextResponse } from 'next/server'
import sql from 'mssql'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_API_URL ||
  'http://localhost:5003'

const config = {
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME || '',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = `${INVENTORY_SERVICE_URL}/api/Warehouse${queryString ? `?${queryString}` : ''}`

    const authHeader = request.headers.get('authorization') || ''

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: '*/*',
        Authorization: authHeader,
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    console.error('Error fetching warehouses:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch warehouses',
        error: error.message
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, location, capacity, status, created_by } = body

    if (!name || !location || !capacity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name, location, and capacity are required'
        },
        { status: 400 }
      )
    }

    const pool = await sql.connect(config)
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('location', sql.NVarChar, location)
      .input('capacity', sql.Int, capacity)
      .input('status', sql.VarChar, status || 'ACTIVE')
      .input('is_deleted', sql.Int, 0)
      .input('created_by', sql.VarChar, created_by || '')
      .query(`
        INSERT INTO warehouses (name, location, capacity, status, is_deleted, created_at, created_by)
        OUTPUT INSERTED.*
        VALUES (@name, @location, @capacity, @status, @is_deleted, GETDATE(), @created_by)
      `)

    await pool.close()

    return NextResponse.json({
      success: true,
      message: 'Warehouse created successfully',
      data: result.recordset[0]
    })
  } catch (error: any) {
    console.error('Error creating warehouse:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create warehouse',
        error: error.message
      },
      { status: 500 }
    )
  }
}
