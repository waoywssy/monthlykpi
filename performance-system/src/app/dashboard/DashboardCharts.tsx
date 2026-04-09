'use client';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function DashboardCharts({ records }: { records: any[] }) {
  const [selectedTeam, setSelectedTeam] = useState<string>('研发中心');

  if (!records || records.length === 0) return null;

  // Process data for charts
  const ratingData = [
    { name: 'A', value: records.filter(r => r.rating === 'A').length, color: '#10b981' },
    { name: 'B+', value: records.filter(r => r.rating === 'B+').length, color: '#0ea5e9' },
    { name: 'B', value: records.filter(r => r.rating === 'B').length, color: '#3b82f6' },
    { name: 'C', value: records.filter(r => r.rating === 'C').length, color: '#f59e0b' },
    { name: 'D', value: records.filter(r => r.rating === 'D').length, color: '#ef4444' },
  ].filter(r => r.value > 0);

  // Extract unique team names
  const uniqueTeams = Array.from(new Set(records.map(r => r.employee?.team?.name).filter(Boolean)));

  // Filter records based on selected team
  const filteredRecords = selectedTeam === '研发中心'
    ? records
    : records.filter(r => r.employee?.team?.name === selectedTeam);

  const top10 = [...filteredRecords].sort((a, b) => b.finalScore - a.finalScore).slice(0, 10).map(r => ({
    name: r.employee.name,
    selfScore: r.selfTotal,
    managerScore: r.managerTotal,
    finalScore: r.finalScore
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>当前周期评级分布</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ratingData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={(props: any) => `${props.name}级: ${props.value}人`}
              >
                {ratingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>当前周期得分排行 (TOP 10)</CardTitle>
          <Select value={selectedTeam} onValueChange={(val) => val && setSelectedTeam(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择研发中心/团队" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="研发中心">研发中心</SelectItem>
              {uniqueTeams.map((team) => (
                <SelectItem key={team} value={team}>
                  {team}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top10}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="finalScore" name="最终得分" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="selfScore" name="自评打分" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar dataKey="managerScore" name="上级打分" fill="#fb923c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
