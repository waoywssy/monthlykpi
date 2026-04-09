"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { allocateBonuses, type BonusInput } from "@/lib/bonus/allocation";
import { DollarSign, Users, Award, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecordRow extends BonusInput {
  employeeId: string;
  period: string;
}

interface Props {
  allRecords: RecordRow[];
  allPeriods: string[];
  defaultPeriod: string;
}

export default function BonusCalculatorClient({
  allRecords,
  allPeriods,
  defaultPeriod,
}: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(defaultPeriod);
  const [useLatestOnly, setUseLatestOnly] = useState<boolean>(false);
  const [totalPool, setTotalPool] = useState(100000);
  const [calculated, setCalculated] = useState<
    ReturnType<typeof allocateBonuses>
  >([]);

  // 根据周期选项过滤数据
  const filteredData = useMemo<BonusInput[]>(() => {
    if (useLatestOnly) {
      // 每人取最新一条（period 字典序最大）
      const map = new Map<string, RecordRow>();
      allRecords.forEach((r) => {
        const existing = map.get(r.employeeId);
        if (!existing || r.period > existing.period) map.set(r.employeeId, r);
      });
      return Array.from(map.values()).sort(
        (a, b) => b.finalScore - a.finalScore,
      );
    }
    if (!selectedPeriod) return [];
    return allRecords
      .filter((r) => r.period === selectedPeriod)
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [allRecords, selectedPeriod, useLatestOnly]);

  function handleCalculate() {
    if (filteredData.length === 0) return;
    setCalculated(allocateBonuses(filteredData, totalPool));
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex items-center space-x-4 mb-8">
        <DollarSign className="w-10 h-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">提成分配测算</h1>
          <p className="text-muted-foreground mt-1">
            基于考核录入结果的奖金加权分配引擎
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ── 左侧设置面板 ── */}
        <Card className="col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>分配参数设置</CardTitle>
            <CardDescription>选择考核周期并设定奖金总额</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 周期选择 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Calendar className="w-4 h-4" /> 考核周期
              </Label>
              {allPeriods.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  暂无数据，请先导入考核表
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {/* 混合模式 */}
                  <button
                    onClick={() => {
                      setUseLatestOnly(true);
                      setSelectedPeriod("");
                      setCalculated([]);
                    }}
                    className={cn(
                      "text-left px-3 py-2 rounded-md text-sm border transition-colors",
                      useLatestOnly
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-input",
                    )}
                  >
                    每人最新记录（混合）
                  </button>
                  {/* 各周期 */}
                  {allPeriods.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setUseLatestOnly(false);
                        setSelectedPeriod(p);
                        setCalculated([]);
                      }}
                      className={cn(
                        "text-left px-3 py-2 rounded-md text-sm border transition-colors",
                        !useLatestOnly && selectedPeriod === p
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 奖金池 */}
            <div className="space-y-2">
              <Label htmlFor="pool" className="text-base">
                团队总额度 (¥)
              </Label>
              <Input
                id="pool"
                type="number"
                value={totalPool}
                className="text-xl font-bold h-12"
                min={0}
                onChange={(e) =>
                  setTotalPool(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </div>

            {/* 数据摘要 */}
            <div className="bg-background rounded-md p-3 space-y-1.5 text-sm border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">参与分配人数：</span>
                <span className="font-semibold">{filteredData.length} 人</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">数据周期：</span>
                <span className="font-semibold text-primary truncate ml-2">
                  {useLatestOnly ? "最新混合" : selectedPeriod || "—"}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              size="lg"
              className="w-full text-base h-11"
              disabled={filteredData.length === 0}
            >
              执行分配测算
            </Button>
          </CardContent>
        </Card>

        {/* ── 右侧结果 ── */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>分配结果报表</span>
              {calculated.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  共发放 ¥{totalPool.toLocaleString("zh-CN")}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          {calculated.length > 0 && (
            <div className="px-6 pb-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from(new Set(calculated.map(r => r.team))).map(team => {
                const teamRecords = calculated.filter(r => r.team === team);
                const teamTotal = teamRecords.reduce((sum, r) => sum + r.bonus, 0);
                const teamScore = teamRecords.reduce((sum, r) => sum + Math.max(r.finalScore, 0), 0);
                return (
                  <div key={team} className="bg-muted/30 p-3 rounded-lg border">
                    <div className="font-medium text-sm">{team}</div>
                    <div className="text-lg font-bold text-green-600">¥{teamTotal.toLocaleString('zh-CN')}</div>
                    <div className="text-xs text-muted-foreground mt-1">团队总分: {teamScore}</div>
                  </div>
                );
              })}
            </div>
          )}
          <CardContent>
            {calculated.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>员工 / 团队</TableHead>
                      <TableHead>考核周期</TableHead>
                      <TableHead className="text-center">核算总分</TableHead>
                      <TableHead className="text-center">评级</TableHead>
                      <TableHead className="text-right">分配占比</TableHead>
                      <TableHead className="text-right text-green-700">
                        应发提成 (¥)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculated.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium flex items-center">
                            {index === 0 && (
                              <Award className="w-4 h-4 text-yellow-500 mr-1" />
                            )}
                            {row.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.team}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.period}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {row.finalScore}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              row.rating === "A"
                                ? "default"
                                : row.rating === "D"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {row.rating}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {row.shareText}
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg text-green-600">
                          {row.bonusFormatted}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <Users className="w-12 h-12 mb-4 text-muted-foreground/50" />
                {filteredData.length > 0 ? (
                  <p>
                    已选择 {filteredData.length} 人，点击左侧「执行分配测算」
                  </p>
                ) : (
                  <>
                    <p>请先在左侧选择考核周期</p>
                    {allRecords.length === 0 && (
                      <p className="text-sm text-destructive mt-2">
                        数据库中暂无考核记录，请先到「导入考核表」页面上传文档
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
