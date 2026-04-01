import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/config'
import bcrypt from 'bcryptjs'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

// GET /api/users - List all users from local database
export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name as name,
        u.phone,
        u.status,
        r.name as role,
        u.role_id,
        GETDATE() as createdAt
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE r.name NOT IN ('CUSTOMER', 'Customer')
      ORDER BY u.id DESC
    `

    const users = await executeQuery(query)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    
    // Fall back to IAM service
    try {
      const authHeader = request.headers.get('authorization') || ''
      const iamRes = await fetch(`${IAM_SERVICE_URL}/api/users/list`, {
        headers: {
          Authorization: authHeader,
        },
      })
      
      if (iamRes.ok) {
        const iamData = await iamRes.json()
        return NextResponse.json(Array.isArray(iamData) ? iamData : iamData.data || [])
      }
    } catch (iamError) {
      console.error('IAM fallback error:', iamError)
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user in local database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, locationId } = body

    console.log('📝 Create user request:', { name, email, role, locationId })

    if (!name || !email || !password || !role) {
      console.error('❌ Missing required fields:', { name, email, password, role })
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Get role_id from role name (case-insensitive, trim whitespace)
    const roleQuery = `SELECT id FROM roles WHERE LOWER(TRIM(name)) = LOWER(TRIM(@role))`
    const roles = await executeQuery<{ id: string }>(roleQuery, { role: String(role).trim() })
    
    if (roles.length === 0) {
      console.error('❌ Role not found:', role)
      // Log available roles for debugging
      const allRolesQuery = `SELECT id, name FROM roles`
      const allRoles = await executeQuery(allRolesQuery)
      console.log('📋 Available roles:', allRoles)
      return NextResponse.json(
        { error: `Role "${role}" not found in database` },
        { status: 400 }
      )
    }

    const roleId = roles[0].id
    console.log('✅ Role ID found:', roleId)

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)
    console.log('✅ Password hashed')

    // Insert user with IdentityDB structure
    let insertQuery = `
      INSERT INTO users (id, email, password_hash, full_name, role_id, status, email_verified`

    const insertParams: Record<string, any> = {
      email,
      password_hash: passwordHash,
      name,
      role_id: roleId,
    }

    // Add locationId if provided
    if (locationId) {
      insertQuery += `, warehouse_id`
      insertParams.warehouse_id = locationId
    }

    insertQuery += `)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.status
      VALUES (NEWID(), @email, @password_hash, @name, @role_id, 'ACTIVE', 0`

    if (locationId) {
      insertQuery += `, @warehouse_id`
    }

    insertQuery += `)`

    console.log('📝 Insert query:', insertQuery)
    console.log('🔧 Insert params:', insertParams)

    const result = await executeQuery<{
      id: string
      email: string
      full_name: string
      status: string
    }>(insertQuery, insertParams)

    if (result.length === 0) {
      console.error('❌ Insert returned no result')
      return NextResponse.json(
        { error: 'Failed to create user - insert returned no result' },
        { status: 500 }
      )
    }

    const newUser = result[0]
    console.log('✅ User created:', newUser.id)

    return NextResponse.json({
      id: newUser.id,
      name: newUser.full_name,
      email: newUser.email,
      role,
      status: newUser.status,
      locationId: locationId || undefined,
    }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Create user error:', error)
    const errorMessage = error.message || String(error)
    const errorCode = error.code

    if (error.number === 2627 || errorMessage.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    if (errorMessage.includes('warehouse_id') || errorMessage.includes('Invalid column')) {
      console.warn('⚠️  warehouse_id column might not exist, user was not created')
      return NextResponse.json(
        { error: 'Database schema error: warehouse_id column not found. Try creating user with Admin role instead.' },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Cannot insert')) {
      return NextResponse.json(
        { error: `Database error: ${errorMessage}` },
        { status: 400 }
      )
    }

    // Detect database connection issues (both Vercel and local)
    const isConnectionError = 
      errorMessage.includes('connect') ||
      errorMessage.includes('localhost') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorCode === 'ESOCKET' ||
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT'

    if (isConnectionError) {
      console.warn('⚠️  Database connection unavailable on Vercel:', errorMessage)
      return NextResponse.json(
        { error: 'Database connection failed. User creation is only available in local development.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: `Failed to create user: ${errorMessage}` },
      { status: 500 }
    )
  }
}