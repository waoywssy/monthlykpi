import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    });
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role || null,
        teamId: data.teamId,
      },
      include: {
        team: {
          include: {
            department: true
          }
        }
      }
    });
    
    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error(`Error updating employee:`, error);
    return NextResponse.json(
      { error: 'Failed to update employee', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        evaluations: true,
        subordinates: true
      }
    });
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Cannot delete if there are evaluations attached
    if (existingEmployee.evaluations.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete employee with existing evaluations' },
        { status: 400 }
      );
    }
    
    // Delete employee
    await prisma.employee.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error(`Error deleting employee:`, error);
    return NextResponse.json(
      { error: 'Failed to delete employee', details: error.message },
      { status: 500 }
    );
  }
}
