import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Upload, Users, DollarSign } from 'lucide-react';

export default function Home() {
  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">研发中心绩效管理系统</h1>
          <p className="text-muted-foreground mt-2">部门绩效考核、自动算分与提成分配平台</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/upload">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Upload className="w-8 h-8 text-primary mb-2" />
              <CardTitle>导入考核表</CardTitle>
              <CardDescription>解析 Word 文档并自动计算得分</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/dashboard">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>绩效看板</CardTitle>
              <CardDescription>查看团队与个人的季度考核排行</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/bonus">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <DollarSign className="w-8 h-8 text-primary mb-2" />
              <CardTitle>提成测算</CardTitle>
              <CardDescription>基于绩效分数的奖金二次分配</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/org">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <Users className="w-8 h-8 text-primary mb-2" />
              <CardTitle>组织架构</CardTitle>
              <CardDescription>管理部门、团队与人员信息</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
