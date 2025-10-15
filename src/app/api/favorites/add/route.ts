import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: 'JWT_SECRET environment variable is not configured' },
      { status: 500 }
    );
  }

  try {
    const { attraction } = await request.json();

    // Validate input
    if (!attraction || !attraction.id || !attraction.name) {
      return NextResponse.json(
        { error: 'Attraction data is required' },
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

    // Check if attraction is already in favorites
    const existingFavorite = user.favorites.find((fav: any) => fav.id === attraction.id);
    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Attraction already in favorites' },
        { status: 400 }
      );
    }

    // Add attraction to favorites
    const favoriteAttraction = {
      id: attraction.id,
      name: attraction.name,
      description: attraction.description || '',
      image: attraction.image || '',
      category: attraction.category || 'Popular',
      rating: attraction.rating || 4,
      lat: attraction.lat || 0,
      lng: attraction.lng || 0,
      city: attraction.city || 'Unknown',
      addedAt: new Date()
    };

    user.favorites.push(favoriteAttraction);
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Attraction added to favorites',
      favorites: user.favorites
    });

  } catch (error) {
    console.error('Add to favorites error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
