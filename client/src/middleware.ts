import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const customHeader = request.headers.get('x-custom-header')
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value

  console.log('Authorization:', authHeader)
  console.log('X-Custom-Header:', customHeader)
  console.log('Access Token:', accessToken)
  console.log('Refresh Token:', refreshToken)

  return NextResponse.next()
}