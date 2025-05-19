import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users } from '@/src/db';
import { userMiddleware, isAuthenticated } from '@/app/api/middleware/user';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return userMiddleware(request, async (req) => {
    if (!isAuthenticated(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is updating their own role or is an admin
    if (req.user?.userId !== parseInt(params.id) && req.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    try {
      const body = await request.json();
      
      if (!body.role) {
        return NextResponse.json(
          { error: 'Role is required' },
          { status: 400 }
        );
      }

      // Update user role in the database
      const userId = parseInt(params.id);
      const updatedUser = await db.update(users)
        .set({
          user_role: body.role,
        })
        .where(eq(users.user_id, userId))
        .returning();

      if (updatedUser.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser[0].user_id,
          role: updatedUser[0].user_role
        }
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }
  });
}