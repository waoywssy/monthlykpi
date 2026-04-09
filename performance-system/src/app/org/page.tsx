import { prisma } from '@/lib/prisma';
import { Building } from 'lucide-react';
import OrgClient from './org-client';

export const dynamic = 'force-dynamic';

export default async function OrgPage() {
  const departments = await prisma.department.findMany({
    include: {
      teams: {
        include: {
          employees: true
        }
      }
    }
  });

  // Extract all teams for the dropdown
  const allTeams = departments.flatMap(dept => 
    dept.teams.map(team => ({
      id: team.id,
      name: team.name,
      departmentName: dept.name
    }))
  );

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex items-center space-x-4 mb-8">
        <Building className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">组织架构与人员</h1>
          <p className="text-muted-foreground mt-1">自动从考核表导入中学习并建立的组织架构树，您也可以手动管理人员信息。</p>
        </div>
      </div>
      
      <OrgClient initialDepartments={departments} allTeams={allTeams} />
    </div>
  );
}
