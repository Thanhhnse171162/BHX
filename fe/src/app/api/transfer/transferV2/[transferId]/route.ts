import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://localhost:5003'

/**
 * PATCH /api/transfer/transferV2/:transferId
 * Proxy to backend: PATCH /api/Transfer/transferV2/:transferId
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ transferId: string }> }
) {
  try {
    const { transferId } = await params
    const url = `${INVENTORY_SERVICE_URL}/api/Transfer/transferV2/${transferId}`

    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = authHeader || (cookieToken ? `Bearer ${cookieToken}` : '')

    // Some backends fail when PATCH has a JSON body; send no body.
    const response = await axios.request({
      method: 'PATCH',
      url,
      headers: {
        Authorization: authorization,
        Accept: '*/*',
      },
    })

    return NextResponse.json(response.data, { status: response.status })
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('transferV2 proxy error', {
        transferId: (await params).transferId,
        status: error.response?.status,
        data: error.response?.data,
      })
      return NextResponse.json(
        {
          success: false,
          message:
            (error.response?.data as any)?.message ||
            (typeof error.response?.data === 'string' ? error.response?.data : undefined) ||
            'Error completing transfer',
          data: error.response?.data ?? null,
          error: error.response?.data?.error || undefined,
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

