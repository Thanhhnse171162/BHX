import { NextRequest, NextResponse } from 'next/server'

const DAMAGE_REPORT_SERVICE_URL =
  process.env.INVENTORY_URL ||
  process.env.NEXT_PUBLIC_INVENTORY_URL ||
  'http://13.229.29.52:5003'

async function parseResponseBody(response: Response) {
  const raw = await response.text()
  if (!raw || !raw.trim()) return null

  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

async function tryFetchDamageReports(url: string, headers: HeadersInit) {
  const response = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  })

  const result = await parseResponseBody(response)
  return { response, result }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const queryString = searchParams.toString()
    const authHeader = request.headers.get('authorization')

    const headers: HeadersInit = {
      Accept: '*/*',
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }

    if (id) {
      const encodedId = encodeURIComponent(id)
      const detailCandidates = [
        `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/${encodedId}`,
        `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/Get-Damage-Report-By-Id/${encodedId}`,
        `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/Get-Damage-Report/${encodedId}`,
        `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/Get-Damage-Report-By-Id?id=${encodedId}`,
      ]

      for (const candidate of detailCandidates) {
        const { response, result } = await tryFetchDamageReports(candidate, headers)
        if (response.ok) {
          return NextResponse.json(result, { status: response.status })
        }
        if (response.status === 404) {
          continue
        }
        return NextResponse.json(result ?? { message: 'Error fetching damage report detail' }, { status: response.status })
      }

      return NextResponse.json({ success: false, message: 'Damage report detail not found' }, { status: 404 })
    }

    const candidates = [
      `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/Get-All-Damage-Reports${queryString ? `?${queryString}` : ''}`,
      `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports${queryString ? `?${queryString}` : ''}`,
      `${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/Get-Damage-Reports${queryString ? `?${queryString}` : ''}`,
    ]

    for (const candidate of candidates) {
      const { response, result } = await tryFetchDamageReports(candidate, headers)
      if (response.ok) {
        return NextResponse.json(result, { status: response.status })
      }

      // Keep trying when endpoint is missing on backend.
      if (response.status === 404) {
        continue
      }

      return NextResponse.json(result ?? { message: 'Error fetching damage reports' }, { status: response.status })
    }

    // Backend currently may expose only create endpoint; avoid surfacing 404 to FE.
    return NextResponse.json({ success: true, data: [] }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể tải báo cáo hư hại',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const incomingContentType = request.headers.get('content-type')

    const headers: HeadersInit = {
      Accept: '*/*',
    }

    if (authHeader) {
      headers.Authorization = authHeader
    }
    if (incomingContentType) {
      headers['Content-Type'] = incomingContentType
    }

    // Keep multipart body as-is so boundary/files are preserved.
    const rawBody = await request.arrayBuffer()

    const response = await fetch(`${DAMAGE_REPORT_SERVICE_URL}/api/damage-reports/Create-Damage-Report`, {
      method: 'POST',
      headers,
      body: rawBody.byteLength > 0 ? rawBody : undefined,
    })

    const result = await parseResponseBody(response)
    if (!response.ok) {
      return NextResponse.json(result ?? { message: 'Error creating damage report' }, { status: response.status })
    }

    return NextResponse.json(result, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể tạo báo cáo hư hại',
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
