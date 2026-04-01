import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/db/config'
import bcrypt from 'bcryptjs'

const IAM_SERVICE_URL = process.env.NEXT_PUBLIC_IAM_URL || 'http://13.229.29.52:5000'

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try local database first
    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name as name,
        u.status,
        r.name as role,
        u.created_at as createdAt
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = @id
    `

    const users = await executeQuery(query, { id: params.id })

    if (users.length === 0) {
      // Fall back to IAM service if not found locally
      const authHeader = request.headers.get('authorization') || ''
      const iamRes = await fetch(`${IAM_SERVICE_URL}/api/users/details/${encodeURIComponent(params.id)}`, {
        headers: {
          Authorization: authHeader,
        },
      })
      
      if (iamRes.ok) {
        const iamData = await iamRes.json()
        return NextResponse.json(iamData.data || iamData)
      }
      
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(users[0])
  } catch (error) {
    console.error('Get user error:', error)
    
    // Try fallback to IAM service
    try {
      const authHeader = request.headers.get('authorization') || ''
      const iamRes = await fetch(`${IAM_SERVICE_URL}/api/users/details/${encodeURIComponent(params.id)}`, {
        headers: {
          Authorization: authHeader,
        },
      })
      
      if (iamRes.ok) {
        const iamData = await iamRes.json()
        return NextResponse.json(iamData.data || iamData)
      }
    } catch (iamError) {
      console.error('IAM fallback error:', iamError)
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, password, role, status } = body

    console.log('PUT /api/users/[id] - Request:', { id: params.id, body })

    // Get role_id if role is provided
    let roleId = null
    if (role) {
      const roleQuery = `SELECT id FROM roles WHERE name = @role`
      const roles = await executeQuery<{ id: string }>(roleQuery, { role })
      if (roles.length > 0) {
        roleId = roles[0].id
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const queryParams: Record<string, any> = { id: params.id }

    if (name) {
      updates.push('full_name = @name')
      queryParams.name = name
    }
    if (email) {
      updates.push('email = @email')
      queryParams.email = email
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10)
      updates.push('password_hash = @password_hash')
      queryParams.password_hash = passwordHash
    }
    if (roleId) {
      updates.push('role_id = @role_id')
      queryParams.role_id = roleId
    }
    if (status) {
      updates.push('status = @status')
      queryParams.status = status
    }

    console.log('Update query params:', { updates, queryParams })

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.status
      WHERE id = @id
    `

    const result = await executeQuery<{
      id: string
      email: string
      full_name: string
      status: string
    }>(updateQuery, queryParams)

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updatedUser = result[0]

    // Get role name
    const roleQuery = roleId 
      ? `SELECT name FROM roles WHERE id = @role_id`
      : `SELECT r.name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = @id`
    
    const roleParams = roleId ? { role_id: roleId } : { id: params.id }
    const roles = await executeQuery<{ name: string }>(roleQuery, roleParams)
    const roleName = roles[0]?.name || role

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.full_name,
      email: updatedUser.email,
      role: roleName,
      status: updatedUser.status,
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    
    if (error.number === 2627 || error.message?.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleteQuery = `DELETE FROM users WHERE id = @id`

    await executeQuery(deleteQuery, { id: params.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}


