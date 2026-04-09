'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteRecordButton } from './DeleteRecordButton';
import Link from 'next/link';

type SortMode = 'score_desc' | 'score_asc' | 'roster';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'score_desc', label: '得分从高到低' },
  { value: 'score_asc', label: '得分从低到高' },
  { value: 'roster', label: '花名册顺序' },
];

type DashboardTableProps = {
  records: any[];
};

export function DashboardTable({ records }: DashboardTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>('score_desc');

  const sortedRecords = useMemo(() => {
    const sorted = [...records];
    switch (sortMode) {
      case 'score_desc':
        sorted.sort((a, b) => b.finalScore - a.finalScore);
        break;
      case 'score_asc':
        sorted.sort((a, b) => a.finalScore - b.finalScore);
        break;
      case 'roster':
        sorted.sort((a, b) => (a.employee.sortOrder ?? 999) - (b.employee.sortOrder ?? 999));
        break;
    }
    return sorted;
  }, [records, sortMode]);

  const isRanking = sortMode === 'score_desc';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>研发中心绩效汇总</CardTitle>
            <CardDescription className="mt-1">
              {sortMode === 'roster' ? '按员工花名册顺序排列' : '按考核得分排列'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">排序方式:</span>
            <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">{isRanking ? '排名' : '序号'}</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>团队</TableHead>
              <TableHead>考核周期</TableHead>
              <TableHead className="text-center">自评总计</TableHead>
              <TableHead className="text-center">上级总计</TableHead>
              <TableHead className="text-center">最终得分</TableHead>
              <TableHead className="text-center">评级</TableHead>
              <TableHead className="text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecords.map((r, i) => (
              <TableRow key={r.id} className="group">
                <TableCell className="text-center font-bold">
                  {isRanking
                    ? (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1)
                    : i + 1
                  }
                </TableCell>
                <TableCell className="font-semibold">
                  <Link href={`/dashboard/record/${r.id}`} className="hover:underline text-primary">
                    {r.employee.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.employee.team.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.period}</TableCell>
                <TableCell className="text-center text-blue-600">{r.selfTotal}</TableCell>
                <TableCell className="text-center text-orange-600">{r.managerTotal}</TableCell>
                <TableCell className="text-center font-bold text-lg text-primary">{r.finalScore}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={r.rating === 'A' ? 'default' : r.rating === 'D' ? 'destructive' : 'secondary'}>
                    {r.rating}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link href={`/dashboard/record/${r.id}`} className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      查看详情
                    </Link>
                    <DeleteRecordButton id={r.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
