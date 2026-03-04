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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, location, capacity, status } = body
    const { id } = params

    const pool = await sql.connect(config)
    
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .input('name', sql.NVarChar, name)
      .input('location', sql.NVarChar, location)
      .input('capacity', sql.Int, capacity)
      .input('status', sql.VarChar, status)
      .query(`
        UPDATE warehouses
        SET 
          name = @name,
          location = @location,
          capacity = @capacity,
          status = @status
        OUTPUT INSERTED.*
        WHERE id = @id AND is_deleted = 0
      `)

    await pool.close()

    if (result.recordset.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Warehouse not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Warehouse updated successfully',
      data: result.recordset[0]
    })
  } catch (error: any) {
    console.error('Error updating warehouse:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update warehouse',
        error: error.message
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const pool = await sql.connect(config)
    
    // Soft delete - set is_deleted = 1
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query(`
        UPDATE warehouses
        SET is_deleted = 1
        WHERE id = @id AND is_deleted = 0
      `)

    await pool.close()

    if (result.rowsAffected[0] === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Warehouse not found or already deleted'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully (soft delete)'
    })
  } catch (error: any) {
    console.error('Error deleting warehouse:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete warehouse',
        error: error.message
      },
      { status: 500 }
    )
  }
}
