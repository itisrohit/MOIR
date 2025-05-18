import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const accessToken = request.cookies.get('accessToken')?.value
  const refreshToken = request.cookies.get('refreshToken')?.value
  // Check if the route starts with /v and protect it
  if (path.startsWith('/v')) {
    // If neither token exists, redirect to login
    if (!accessToken && !refreshToken) {
      console.log('No token found, redirecting to login')
      return NextResponse.redirect(new URL('/auth', request.url))
    }
    
    // If at least one token exists, allow the request
    console.log('Token found, allowing access')
  }

  return NextResponse.next()
}

// Configure which routes this middleware applies to
export const config = {
  matcher: ['/v', '/v/:path*']
}

fetch('https://capstone-4haj.onrender.com/api/v1/user/profile', {
  method: 'GET',
  credentials: 'include' // Important to include cookies
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => console.log('Data:', data))
.catch(error => console.error('Error:', error));