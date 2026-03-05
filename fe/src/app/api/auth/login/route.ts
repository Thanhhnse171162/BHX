import { NextRequest, NextResponse } from 'next/server'
import { getDbConnection } from '@/lib/db/config'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface LoginRequest {
  email: string
  password: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
const JWT_EXPIRES_IN = '24h'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Email và mật khẩu là bắt buộc' 
        },
        { status: 400 }
      )
    }

    console.log('🔍 Login attempt for:', email)

    // Kết nối database trực tiếp
    const pool = await getDbConnection()
    
    // Tìm user trong database
    const result = await pool.request()
      .input('email', email)
      .query(`
        SELECT id, email, password_hash, full_name, role_id, status, email_verified
        FROM users
        WHERE email = @email
      `)

    if (result.recordset.length === 0) {
      console.log('❌ User not found:', email)
      return NextResponse.json(
        { 
          success: false,
          message: 'Email hoặc mật khẩu không đúng' 
        },
        { status: 401 }
      )
    }

    const user = result.recordset[0]

    // Kiểm tra trạng thái user
    if (user.status !== 'ACTIVE') {
      console.log('❌ User not active:', email, '- Status:', user.status)
      return NextResponse.json(
        { 
          success: false,
          message: 'Tài khoản đã bị vô hiệu hóa' 
        },
        { status: 403 }
      )
    }

    // Xác thực password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email)
      return NextResponse.json(
        { 
          success: false,
          message: 'Email hoặc mật khẩu không đúng' 
        },
        { status: 401 }
      )
    }

    // Tạo JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roleId: user.role_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    console.log('✅ Login successful for:', email)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken: token,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        userId: user.id,
      }
    })

  } catch (error) {
    console.error('❌ Login error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại sau.' 
      },
      { status: 500 }
    )
  }
} 
     
