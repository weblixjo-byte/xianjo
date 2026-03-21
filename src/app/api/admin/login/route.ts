export const runtime = 'experimental-edge';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ success: false, error: "النظام غير مهيأ بعد (كلمة المرور مفقودة)" }, { status: 500 });
    }

    if (password === adminPassword) {
      // Set an HTTP-Only secure cookie to bind the session
      const response = NextResponse.json({ success: true, message: "تم تسجيل الدخول بنجاح" });
      
      response.cookies.set({
        name: 'admin_auth',
        value: password, // Forcing the middleware to check this exact string guarantees unforgeability without complex JWTs.
        maxAge: 60 * 60 * 24 * 7, // 7 days expiration
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return response;
    }

    return NextResponse.json({ success: false, error: "كلمة المرور غير صحيحة" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
