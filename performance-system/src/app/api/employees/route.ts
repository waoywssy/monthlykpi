import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const teamId = typeof data.teamId === 'string' ? data.teamId.trim() : '';
    
    // Validate required fields
    if (!name || !teamId) {
      return NextResponse.json(
        { error: 'Name and teamId are required' },
        { status: 400 }
      );
    }

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        name,
        teamId,
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee already exists in the selected team' },
        { status: 409 }
      );
    }
    
    // Create new employee
    const employee = await prisma.employee.create({
      data: {
        name,
        role: typeof data.role === 'string' && data.role.trim() ? data.role.trim() : null,
        teamId,
        isRegular: data.isRegular !== undefined ? data.isRegular : true,
        salary: data.salary === '' || data.salary === undefined || data.salary === null
          ? null
          : Number(data.salary),
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
