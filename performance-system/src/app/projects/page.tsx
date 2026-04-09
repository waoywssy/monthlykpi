'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type Project = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  clientName: string | null;
  totalAmount: number;
  status: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
      category: '',
    description: '',
    clientName: '',
    totalAmount: '',
    status: 'IN_PROGRESS'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      toast.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success(editingProject ? '更新成功' : '创建成功');
      setIsDialogOpen(false);
      fetchProjects();
      resetForm();
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此项目吗？')) return;
    
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      
      toast.success('删除成功');
      fetchProjects();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      category: project.category || '',
      description: project.description || '',
      clientName: project.clientName || '',
      totalAmount: project.totalAmount.toString(),
      status: project.status
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      clientName: '',
      totalAmount: '',
      status: 'IN_PROGRESS'
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">项目管理</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger>
            <Button>新增项目</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? '编辑项目' : '新增项目'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">项目名称</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
                            <div className="space-y-2">
                <Label htmlFor="category">项目分类</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">客户名称</Label>
                <Input 
                  id="clientName" 
                  value={formData.clientName} 
                  onChange={e => setFormData({...formData, clientName: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">项目总金额</Label>
                <Input 
                  id="totalAmount" 
                  type="number" 
                  step="0.01" 
                  value={formData.totalAmount} 
                  onChange={e => setFormData({...formData, totalAmount: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">项目状态</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={v => setFormData({...formData, status: v || "IN_PROGRESS"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_PROGRESS">进行中</SelectItem>
                    <SelectItem value="COMPLETED">已完成</SelectItem>
                    <SelectItem value="CANCELLED">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">备注说明</Label>
                <Input 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>项目分类</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead>总金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无项目数据</TableCell>
                </TableRow>
              ) : (
                projects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.category || '-'}</TableCell>
                    <TableCell>{project.clientName || '-'}</TableCell>
                    <TableCell>{project.totalAmount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}</TableCell>
                    <TableCell>
                      {project.status === 'IN_PROGRESS' && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">进行中</span>}
                      {project.status === 'COMPLETED' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">已完成</span>}
                      {project.status === 'CANCELLED' && <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded text-xs">已取消</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(project)}>编辑</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}>删除</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
