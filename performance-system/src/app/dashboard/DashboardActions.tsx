'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as xlsx from 'xlsx';

type DashboardActionsProps = {
  periods: string[];
  selectedPeriod?: string;
  records: any[];
};

export function DashboardActions({ periods, selectedPeriod, records }: DashboardActionsProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handlePeriodChange = (value: string | null) => {
    if (!value) return;
    if (value === '全部周期') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard?period=${value}`);
    }
  };

  const handleExport = () => {
    setIsExporting(true);

    try {
      // 1. Prepare data for Excel — always sort by roster order (employee.sortOrder)
      const sortedForExport = [...records].sort(
        (a, b) => (a.employee.sortOrder ?? 999) - (b.employee.sortOrder ?? 999)
      );
      const dataToExport = sortedForExport.map((r) => ({
        '姓名': r.employee.name,
        '团队': r.employee.team.name,
        '岗位': r.employee.role,
        '考核月份': r.period,
        '考核得分': r.finalScore,
        '考核等级': r.rating,
        '上级评语': r.managerEvaluationText || '',
      }));

      // 2. Create worksheet
      const ws = xlsx.utils.json_to_sheet(dataToExport);

      // 3. Set column widths
      const colWidths = [
        { wch: 15 }, // 姓名
        { wch: 20 }, // 团队
        { wch: 15 }, // 岗位
        { wch: 15 }, // 考核月份
        { wch: 10 }, // 考核得分
        { wch: 10 }, // 考核等级
        { wch: 40 }, // 上级评语
      ];
      ws['!cols'] = colWidths;

      // 4. Create workbook and add worksheet
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, '绩效考核结果');

      // 5. Generate and download file
      const fileName = selectedPeriod
        ? `绩效考核结果_${selectedPeriod}.xlsx`
        : '绩效考核结果_全量.xlsx';

      xlsx.writeFile(wb, fileName);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">考核周期:</span>
        <Select
          value={selectedPeriod || '全部周期'}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择考核周期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="全部周期">全部周期</SelectItem>
            {periods.map(period => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        onClick={handleExport}
        disabled={isExporting || records.length === 0}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        {isExporting ? '导出中...' : '导出 Excel'}
      </Button>
    </div>
  );
}
