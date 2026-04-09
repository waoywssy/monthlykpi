'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, UserSquare, Plus, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Department = {
  id: string;
  name: string;
  teams: Team[];
};

type Team = {
  id: string;
  name: string;
  departmentId: string;
  employees: Employee[];
};

type Employee = {
  id: string;
  name: string;
  role: string | null;
  teamId: string;
  isRegular?: boolean;
  salary?: number | null;
};

type OrgClientProps = {
  initialDepartments: Department[];
  allTeams: { id: string; name: string; departmentName: string }[];
};

export default function OrgClient({ initialDepartments, allTeams }: OrgClientProps) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  
  // Modal states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [currentEmployee, setCurrentEmployee] = useState<{id?: string, name: string, role: string, teamId: string}>({
    name: '',
    role: '',
    teamId: ''
  });
  
  const [employeeToDelete, setEmployeeToDelete] = useState<{id: string, name: string} | null>(null);

  const handleAddEmployee = (teamId?: string) => {
    setCurrentEmployee({
      name: '',
      role: '',
      teamId: teamId || ''
    });
    setModalMode('add');
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee({
      id: employee.id,
      name: employee.name,
      role: employee.role || '',
      teamId: employee.teamId
    });
    setModalMode('edit');
    setIsEmployeeModalOpen(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setEmployeeToDelete({ id, name });
    setIsDeleteModalOpen(true);
  };

  const saveEmployee = async () => {
    if (!currentEmployee.name || !currentEmployee.teamId) {
      toast.error('请填写必填项（姓名、团队）');
      return;
    }

    setIsLoading(true);
    try {
      const url = modalMode === 'add' 
        ? '/api/employees' 
        : `/api/employees/${currentEmployee.id}`;
        
      const method = modalMode === 'add' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentEmployee),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '保存失败');
      }

      toast.success(modalMode === 'add' ? '人员添加成功' : '人员信息更新成功');
      setIsEmployeeModalOpen(false);
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除失败');
      }

      toast.success('人员删除成功');
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {departments.length === 0 ? (
        <Card>
          <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <p>暂无组织架构数据</p>
            <p className="text-sm mt-2">请先到导入页面上传至少一份绩效考核表，系统会自动建立架构档案。</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-end">
            <Button onClick={() => handleAddEmployee()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              添加人员
            </Button>
          </div>
          
          {departments.map(dept => (
            <Card key={dept.id} className="border-primary/20">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center text-2xl">
                  <Building className="w-6 h-6 mr-2 text-primary" />
                  {dept.name}
                  <Badge variant="outline" className="ml-4 font-normal">
                    {dept.teams.length} 个团队
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dept.teams.map(team => (
                    <div key={team.id} className="border rounded-lg p-4 bg-muted/20 relative group">
                      <div className="flex items-center justify-between border-b pb-2 mb-4">
                        <h3 className="font-bold text-lg flex items-center">
                          <Users className="w-5 h-5 mr-2 text-muted-foreground" />
                          {team.name}
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            ({team.employees.length} 人)
                          </span>
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleAddEmployee(team.id)}
                          title="在团队中添加人员"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {team.employees.map(emp => (
                          <div key={emp.id} className="flex items-start justify-between bg-background p-2 rounded border text-sm group/emp">
                            <div className="flex items-start">
                              <UserSquare className="w-8 h-8 mr-3 text-primary/70" />
                              <div>
                                <p className="font-semibold">{emp.name}</p>
                                <p className="text-xs text-muted-foreground">{emp.role || '未分配岗位'}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 opacity-0 group-hover/emp:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => handleEditEmployee(emp)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteClick(emp.id, emp.name)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee Modal */}
      <Dialog open={isEmployeeModalOpen} onOpenChange={setIsEmployeeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{modalMode === 'add' ? '添加人员' : '编辑人员信息'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                姓名 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={currentEmployee.name}
                onChange={(e) => setCurrentEmployee({...currentEmployee, name: e.target.value})}
                className="col-span-3"
                placeholder="员工姓名"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                岗位
              </Label>
              <Input
                id="role"
                value={currentEmployee.role}
                onChange={(e) => setCurrentEmployee({...currentEmployee, role: e.target.value})}
                className="col-span-3"
                placeholder="例如: 产品经理 (选填)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team" className="text-right">
                所属团队 <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                <Select 
                  value={currentEmployee.teamId || undefined} 
                  onValueChange={(value) => setCurrentEmployee({...currentEmployee, teamId: value || ''})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择所属团队" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.departmentName} - {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmployeeModalOpen(false)} disabled={isLoading}>
              取消
            </Button>
            <Button onClick={saveEmployee} disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除员工 <strong>{employeeToDelete?.name}</strong> 吗？
              如果该员工已有相关的绩效考核记录，将无法被删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading}>
              取消
            </Button>
            <Button variant="destructive" onClick={deleteEmployee} disabled={isLoading}>
              {isLoading ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
