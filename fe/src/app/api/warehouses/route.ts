import { NextResponse } from 'next/server'
import sql from 'mssql'

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
    
    // Get filter parameters
    const id = searchParams.get('id')
    const name = searchParams.get('name')
    const location = searchParams.get('location')
    const capacityMin = searchParams.get('capacity_min')
    const capacityMax = searchParams.get('capacity_max')
    const status = searchParams.get('status')
    const isDeleted = searchParams.get('is_deleted')
    const createdAtFrom = searchParams.get('created_at_from')
    const createdAtTo = searchParams.get('created_at_to')
    const createdBy = searchParams.get('created_by')

    const pool = await sql.connect(config)
    
    let query = `
      SELECT 
        id,
        name,
        location,
        capacity,
        status,
        is_deleted,
        created_at,
        created_by
      FROM warehouses
      WHERE 1=1
    `
    
    const params: any = {}
    
    if (id) {
      query += ` AND id LIKE @id`
      params.id = `%${id}%`
    }
    
    if (name) {
      query += ` AND name LIKE @name`
      params.name = `%${name}%`
    }
    
    if (location) {
      query += ` AND location LIKE @location`
      params.location = `%${location}%`
    }
    
    if (capacityMin) {
      query += ` AND capacity >= @capacityMin`
      params.capacityMin = parseInt(capacityMin)
    }
    
    if (capacityMax) {
      query += ` AND capacity <= @capacityMax`
      params.capacityMax = parseInt(capacityMax)
    }
    
    if (status) {
      query += ` AND status = @status`
      params.status = status
    }
    
    if (isDeleted !== null && isDeleted !== undefined && isDeleted !== '') {
      query += ` AND is_deleted = @isDeleted`
      params.isDeleted = parseInt(isDeleted)
    }
    
    if (createdAtFrom) {
      query += ` AND created_at >= @createdAtFrom`
      params.createdAtFrom = createdAtFrom
    }
    
    if (createdAtTo) {
      query += ` AND created_at <= @createdAtTo`
      params.createdAtTo = createdAtTo
    }
    
    if (createdBy) {
      query += ` AND created_by LIKE @createdBy`
      params.createdBy = `%${createdBy}%`
    }
    
    query += ` ORDER BY created_at DESC`
    
    const request = pool.request()
    
    // Add parameters to request
    Object.keys(params).forEach(key => {
      request.input(key, params[key])
    })
    
    const result = await request.query(query)
    
    await pool.close()
    
    return NextResponse.json({
      success: true,
      data: result.recordset
    })
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
