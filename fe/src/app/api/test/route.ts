import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Warehouse list API is working',
    env: {
      api_base: process.env.NEXT_PUBLIC_API_BASE_URL,
    }
  })
}
