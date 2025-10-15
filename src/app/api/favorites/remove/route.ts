import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongoose';
import User, { IAttraction } from '@/models/User';

export async function DELETE(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: 'JWT_SECRET environment variable is not configured' },
      { status: 500 }
    );
  }

  try {
    const { attractionId } = await request.json();

    // Validate input
    if (!attractionId) {
      return NextResponse.json(
        { error: 'Attraction ID is required' },
        { status: 400 }
      );
    }

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove attraction from favorites
    const initialLength = user.favorites.length;
    user.favorites = user.favorites.filter((fav: IAttraction) => fav.id !== attractionId);
    
    if (user.favorites.length === initialLength) {
      return NextResponse.json(
        { error: 'Attraction not found in favorites' },
        { status: 404 }
      );
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Attraction removed from favorites',
      favorites: user.favorites
    });

  } catch (error) {
    console.error('Remove from favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
