import { NextResponse } from 'next/server'

// Mock incident store — replace with real DB query when incidents table is ready
// e.g. SELECT COUNT(*) FROM incidents WHERE status = 'unresolved'
const MOCK_UNRESOLVED_INCIDENTS = 3

export async function GET() {
  try {
    // TODO: replace with real DB call, e.g.:
    // const result = await db.query('SELECT COUNT(*) as count FROM incidents WHERE status = $1', ['unresolved'])
    // const count = parseInt(result.rows[0].count, 10)

    const count = MOCK_UNRESOLVED_INCIDENTS

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Failed to fetch incident count:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}
