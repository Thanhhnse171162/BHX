import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/config'
import bcrypt from 'bcryptjs'

// GET /api/users - List all users
export async function GET(_request: NextRequest) {
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
      WHERE u.role_id != 1
      ORDER BY u.id DESC
    `

    const users = await executeQuery(query)

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Get role_id from role name
    const roleQuery = `SELECT id FROM roles WHERE name = @role`
    const roles = await executeQuery<{ id: string }>(roleQuery, { role })
    
    if (roles.length === 0) {
      console.error('Role not found:', role)
      return NextResponse.json(
        { error: `Role "${role}" not found in database` },
        { status: 400 }
      )
    }

    const roleId = roles[0].id

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert user with IdentityDB structure
    const insertQuery = `
      INSERT INTO users (id, email, password_hash, full_name, role_id, status, email_verified)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.status
      VALUES (NEWID(), @email, @password_hash, @name, @role_id, 'ACTIVE', 0)
    `

    const result = await executeQuery<{
      id: string
      email: string
      full_name: string
      status: string
    }>(insertQuery, {
      email,
      password_hash: passwordHash,
      name,
      role_id: roleId,
    })

    if (result.length === 0) {
      console.error('Insert returned no result')
      return NextResponse.json(
        { error: 'Failed to create user - insert returned no result' },
        { status: 500 }
      )
    }

    const newUser = result[0]

    return NextResponse.json({
      id: newUser.id,
      name: newUser.full_name,
      email: newUser.email,
      role,
      status: newUser.status,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create user error:', error)
    
    // Handle duplicate email error
    if (error.number === 2627 || error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Handle specific database errors
    if (error.message?.includes('Cannot insert')) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: `Failed to create user: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}


