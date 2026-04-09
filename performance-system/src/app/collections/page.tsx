'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Download, RefreshCw, Filter } from 'lucide-react';
import { format } from 'date-fns';

type Project = {
  id: string;
  name: string;
  clientName: string | null;
};

type Collection = {
  id: string;
  projectId: string;
  project: Project;
  amount: number;
  date: string;
  period: string;
  notes: string | null;
  createdAt: string;
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  
  // Derived data
  const periods = Array.from(new Set(collections.map(c => c.period))).sort().reverse();
  
  const filteredCollections = collections.filter(c => {
    if (selectedProject !== 'all' && c.projectId !== selectedProject) return false;
    if (selectedPeriod !== 'all' && c.period !== selectedPeriod) return false;
    return true;
  });

  const totalAmount = filteredCollections.reduce((sum, c) => sum + c.amount, 0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [colRes, projRes] = await Promise.all([
        fetch('/api/collections'),
        fetch('/api/projects')
      ]);
      
      if (colRes.ok) setCollections(await colRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (error) {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/collections/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || '上传失败');
      }
      
      toast.success(data.message || '回款数据导入成功');
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || '回款数据导入失败，请检查文件格式');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">项目回款管理</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button disabled={uploading}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? '导入中...' : '导入2026年市场回款统计表'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="md:col-span-1 bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-blue-600 mb-1">选中条件回款总额</p>
            <p className="text-3xl font-bold text-blue-900">
              {totalAmount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
            </p>
            <p className="text-xs text-blue-500 mt-2">共 {filteredCollections.length} 笔回款记录</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="space-y-2">
                  <Label>项目筛选</Label>
                  <Select value={selectedProject} onValueChange={(v) => setSelectedProject(v || "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="全部项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部项目</SelectItem>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>期间筛选</Label>
                  <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v || "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="全部期间" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部期间</SelectItem>
                      {periods.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>回款日期</TableHead>
                <TableHead>期间</TableHead>
                <TableHead>项目名称</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead className="text-right">回款金额</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</TableCell>
                </TableRow>
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无回款数据</TableCell>
                </TableRow>
              ) : (
                filteredCollections.map(collection => (
                  <TableRow key={collection.id}>
                    <TableCell>{format(new Date(collection.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{collection.period}</TableCell>
                    <TableCell className="font-medium">{collection.project?.name || '-'}</TableCell>
                    <TableCell>{collection.project?.clientName || '-'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {collection.amount.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate" title={collection.notes || ''}>
                      {collection.notes || '-'}
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
