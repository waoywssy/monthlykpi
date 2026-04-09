import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target, UserCheck } from 'lucide-react';
import { DashboardCharts } from './DashboardCharts';
import { DashboardActions } from './DashboardActions';
import { DashboardTable } from './DashboardTable';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;

  // 1. Fetch all distinct periods for the dropdown
  const periodRecords = await prisma.evaluationRecord.findMany({
    select: { period: true },
    distinct: ['period'],
    orderBy: { period: 'desc' }
  });
  const periods = periodRecords.map(r => r.period);

  // 2. Build query based on selected period
  const whereClause = period ? { period } : {};

  // 3. Fetch records
  const records = await prisma.evaluationRecord.findMany({
    where: whereClause,
    include: {
      employee: {
        include: {
          team: true
        }
      }
    },
    orderBy: {
      finalScore: 'desc'
    }
  });

  if (records.length === 0 && !period) {
    return (
      <div className="container mx-auto py-10 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">绩效看板</h1>
        <Card>
          <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="w-12 h-12 mb-4 text-muted-foreground/50" />
            <p>暂无考核数据</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalEmployees = records.length;
  const avgScore = totalEmployees > 0
    ? (records.reduce((acc, curr) => acc + curr.finalScore, 0) / totalEmployees).toFixed(1)
    : '0.0';
  const topRatingCount = records.filter(r => r.rating === 'A' || r.rating === 'B+').length;

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <BarChart3 className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">研发中心绩效看板</h1>
            <p className="text-muted-foreground mt-1">全局考核数据概览与排行榜</p>
          </div>
        </div>
        
        <DashboardActions 
          periods={periods} 
          selectedPeriod={period} 
          records={records} 
        />
      </div>
      
      {records.length === 0 ? (
        <Card className="mb-8">
          <CardContent className="h-40 flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="w-10 h-10 mb-2 text-muted-foreground/30" />
            <p>选定周期暂无数据</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full mr-4">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">当前周期归档人数</p>
                  <h3 className="text-3xl font-bold">{totalEmployees}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-4 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full mr-4">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">当前周期平均得分</p>
                  <h3 className="text-3xl font-bold">{avgScore}</h3>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
              <CardContent className="p-6 flex items-center">
                <div className="p-4 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full mr-4">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">当前周期优秀人数 (A & B+)</p>
                  <h3 className="text-3xl font-bold">{topRatingCount} <span className="text-sm font-normal text-muted-foreground">({Math.round(topRatingCount/totalEmployees*100)}%)</span></h3>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DashboardCharts records={records} />
          
          <DashboardTable records={records} />
        </>
      )}
    </div>
  );
}
