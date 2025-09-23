import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongoose'
import User, { IUser } from '@/models/User'

export async function PUT(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return NextResponse.json({ success: false, error: 'JWT_SECRET is not configured' }, { status: 500 });
  }
  try {
    await connectDB();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'No token provided' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }
    
    if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Incorrect current password' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
