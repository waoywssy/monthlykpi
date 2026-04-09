import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.teamId) {
      return NextResponse.json(
        { error: 'Name and teamId are required' },
        { status: 400 }
      );
    }
    
    // Create new employee
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        role: data.role || null,
        teamId: data.teamId,
        isRegular: data.isRegular !== undefined ? data.isRegular : true,
        salary: data.salary ? Number(data.salary) : null,
      },
      include: {
        team: {
          include: {
            department: true
          }
        }
      }
    });
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    );
  }
}
