'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, CheckCircle2, AlertCircle, AlertTriangle, FileText, Save, Pencil, RotateCcw, User, Users, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Types matching parser output ─── */
interface ScoreDetail {
  category: string;
  name: string;
  weight: number;
  selfScore: number;
  managerScore: number;
}

interface ParsedData {
  employeeInfo: {
    name: string;
    team: string;
    role: string;
    manager: string;
    period: string;
  };
  scores: ScoreDetail[];
  selfTotal: number;
  managerTotal: number;
  finalScore: number;
  rating: string;
  selfEvaluationText: string;
  managerEvaluationText: string;
}

/* ─── Score recalculation ─── */
function recalculate(scores: ScoreDetail[]) {
  let selfTotal = 0;
  let managerTotal = 0;
  for (const s of scores) {
    selfTotal += (s.selfScore * 10 * s.weight);
    managerTotal += (s.managerScore * 10 * s.weight);
  }
  selfTotal = Math.round(selfTotal * 100) / 100;
  managerTotal = Math.round(managerTotal * 100) / 100;
  const finalScore = Math.round((selfTotal * 0.2 + managerTotal * 0.8) * 100) / 100;
  let rating = 'D';
  if (finalScore >= 95) rating = 'A';
  else if (finalScore >= 90) rating = 'B+';
  else if (finalScore >= 80) rating = 'B';
  else if (finalScore >= 70) rating = 'C';
  return { selfTotal, managerTotal, finalScore, rating };
}

/* ─── Category meta ─── */
const CATEGORY_META: Record<string, { color: string; bgClass: string }> = {
  '业绩结果': { color: 'text-indigo-600', bgClass: 'bg-indigo-50 dark:bg-indigo-950/30' },
  '核心能力': { color: 'text-emerald-600', bgClass: 'bg-emerald-50 dark:bg-emerald-950/30' },
  '态度行为': { color: 'text-amber-600', bgClass: 'bg-amber-50 dark:bg-amber-950/30' },
};

/* ━━━━━━━━━━━━━━ Page Component ━━━━━━━━━━━━━━ */
export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [data, setData] = useState<ParsedData | null>(null);
  const [scoresEdited, setScoresEdited] = useState(false);

  /* ─── Derived totals ─── */
  /* 未手动修改分数时使用文档原始值，修改后才重新计算 */
  const derived = useMemo(() => {
    if (!data) return null;
    if (scoresEdited) return recalculate(data.scores);
    return {
      selfTotal: data.selfTotal,
      managerTotal: data.managerTotal,
      finalScore: data.finalScore,
      rating: data.rating,
    };
  }, [data, scoresEdited]);

  /* ─── 始终根据单项分数重算，用于校验 ─── */
  const calculated = useMemo(() => {
    if (!data) return null;
    return recalculate(data.scores);
  }, [data]);

  const [globalPeriod, setGlobalPeriodState] = useState('');

  /* ─── File upload ─── */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setData(null);
    setParseError(null);
    setIsSaved(false);
    setScoresEdited(false);

    const toastId = toast.loading('正在解析文档…');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (json.success && json.data) {
        // If a global period is set, override the parsed period
        if (globalPeriod && globalPeriod !== "none") {
          json.data.employeeInfo.period = globalPeriod;
        }
        setData(json.data);
        toast.success(`解析成功！员工：${json.data.employeeInfo.name}`, { id: toastId });
      } else {
        setParseError(json.error || '解析失败');
        toast.error(`解析失败: ${json.error}`, { id: toastId });
      }
    } catch {
      setParseError('网络请求失败');
      toast.error('网络请求失败', { id: toastId });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  }, [globalPeriod]);

  /* ─── Generate Period Options ─── */
  const periodOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const options: string[] = [];

    // // Previous year (last 3 months)
    // options.push(`${currentYear - 1}-10`);
    // options.push(`${currentYear - 1}-11`);
    // options.push(`${currentYear - 1}-12`);

    // Current year months
    for (let i = 1; i <= 12; i++) {
      options.push(`${currentYear}-${i.toString().padStart(2, '0')}`);
    }

    // // Next year (first 3 months)
    // options.push(`${currentYear + 1}-01`);
    // options.push(`${currentYear + 1}-02`);
    // options.push(`${currentYear + 1}-03`);

    return options;
  }, []);

  /* ─── Score editing ─── */
  const updateScore = useCallback((idx: number, field: 'selfScore' | 'managerScore', val: string) => {
    setData(prev => {
      if (!prev) return prev;
      const scores = [...prev.scores];
      scores[idx] = { ...scores[idx], [field]: parseFloat(val) || 0 };
      return { ...prev, scores };
    });
    setScoresEdited(true);
    setIsSaved(false);
  }, []);

  /* ─── Info editing ─── */
  const updateInfo = useCallback((field: keyof ParsedData['employeeInfo'], val: string) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, employeeInfo: { ...prev.employeeInfo, [field]: val } };
    });
    setIsSaved(false);
  }, []);

  const setGlobalPeriod = useCallback((period: string) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, employeeInfo: { ...prev.employeeInfo, period } };
    });
    setIsSaved(false);
  }, []);

  /* ─── Text editing ─── */
  const updateText = useCallback((field: 'selfEvaluationText' | 'managerEvaluationText', val: string) => {
    setData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: val };
    });
    setIsSaved(false);
  }, []);

  /* ─── Save to DB ─── */
  const handleSave = useCallback(async () => {
    if (!data || !derived) return;

    // Check for mismatch between parsed data and derived scores (unless manually edited)
    if (!scoresEdited && calculated) {
      const isMismatch =
        Math.abs(derived.selfTotal - calculated.selfTotal) > 0.01 ||
        Math.abs(derived.managerTotal - calculated.managerTotal) > 0.01 ||
        Math.abs(derived.finalScore - calculated.finalScore) > 0.01 ||
        derived.rating !== calculated.rating;

      if (isMismatch) {
        toast.error('数据存在不一致，请先确认后保存');
        return;
      }
    }

    setIsSaving(true);
    const toastId = toast.loading('正在保存到数据库…');

    try {
      const payload = {
        ...data,
        selfTotal: derived.selfTotal,
        managerTotal: derived.managerTotal,
        finalScore: derived.finalScore,
        rating: derived.rating,
      };
      const res = await fetch('/api/upload/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setIsSaved(true);
        toast.success(`保存成功！已入库 ${json.savedScoresCount} 项评分明细`, { id: toastId });
      } else {
        toast.error(`保存失败: ${json.error}`, { id: toastId });
      }
    } catch {
      toast.error('保存请求失败', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }, [data, derived, calculated, scoresEdited]);

  /* ─── Reset ─── */
  const handleReset = useCallback(() => {
    setData(null);
    setParseError(null);
    setIsSaved(false);
  }, []);

  /* ━━━━━━━━━━━━━━ Render ━━━━━━━━━━━━━━ */
  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">绩效考核表导入</h1>
          <p className="text-muted-foreground mt-1">上传 Word 文档 → 预览核对 → 编辑修正 → 确认入库</p>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1.5" /> 重新上传
          </Button>
        )}
      </div>

      {/* ─── Upload Area ─── */}
      {!data && !parseError && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>上传 Word 文档</CardTitle>
            <CardDescription>
              解析《智慧畅行研发中心季度绩效考核表.docx》，提取所有评分数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="global-period" className="text-sm font-medium">统一考核周期（可选）</label>
              <Select value={globalPeriod} onValueChange={(val) => setGlobalPeriodState(val || "")}>
                <SelectTrigger id="global-period" className="max-w-md">
                  <SelectValue placeholder="例如：2026-01（留空则使用文档内提取的周期）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">使用文档内提取的周期</SelectItem>
                  {periodOptions.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">设置后，上传的文件将统一使用此周期（上传后仍可单独修改）。</p>
            </div>

            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed rounded-xl border-muted-foreground/25 bg-muted/5 hover:bg-muted/10 hover:border-primary/40 transition-all duration-200 cursor-pointer group">
              <UploadCloud className="w-14 h-14 text-muted-foreground/60 mb-4 group-hover:text-primary/60 transition-colors" />
              <div className="flex text-sm text-muted-foreground">
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none hover:text-primary/80">
                  <span>选择文件</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".docx" onChange={handleFileUpload} disabled={isUploading} />
                </label>
                <p className="pl-1">或拖拽文件到这里</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isUploading ? '正在解析中…' : '支持 .docx 格式'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Parse Error ─── */}
      {parseError && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">解析失败</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive/80">{parseError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" /> 重新上传
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ━━━━━━━━━━ Parsed Data Display ━━━━━━━━━━ */}
      {data && derived && (
        <>
          {/* ─── Status Bar ─── */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/40 border">
            <div className="flex items-center gap-2">
              {isSaved ? (
                <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 已入库</Badge>
              ) : (
                <Badge variant="secondary"><Pencil className="w-3.5 h-3.5 mr-1" /> 待核对</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {isSaved ? '数据已保存到数据库' : '请核对数据后点击「确认入库」'}
              </span>
            </div>
            <Button onClick={handleSave} disabled={isSaving || isSaved} size="sm"
              className={isSaved ? 'bg-green-600 hover:bg-green-600' : ''}>
              {isSaving ? '保存中…' : isSaved ? '已保存' : <><Save className="w-4 h-4 mr-1.5" /> 确认入库</>}
            </Button>
          </div>

          {/* ─── Employee Info (editable) ─── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><User className="w-5 h-5" /> 员工基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoField icon={<User className="w-4 h-4" />} label="员工姓名" value={data.employeeInfo.name} onChange={(v) => updateInfo('name', v)} />
                <InfoField icon={<Users className="w-4 h-4" />} label="所在团队" value={data.employeeInfo.team} onChange={(v) => updateInfo('team', v)} />
                <InfoField icon={<Briefcase className="w-4 h-4" />} label="现任职位/角色" value={data.employeeInfo.role} onChange={(v) => updateInfo('role', v)} />
                <InfoField icon={<User className="w-4 h-4" />} label="团队负责人" value={data.employeeInfo.manager} onChange={(v) => updateInfo('manager', v)} />
                <InfoField icon={<Calendar className="w-4 h-4" />} label="考核周期" value={data.employeeInfo.period} onChange={(v) => updateInfo('period', v)} />
              </div>
            </CardContent>
          </Card>

          {/* ─── Summary Cards ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard label="自评小计" value={derived.selfTotal} color="text-blue-600"
              mismatch={!scoresEdited && calculated && Math.abs(derived.selfTotal - calculated.selfTotal) > 0.01 ? calculated.selfTotal : undefined} />
            <SummaryCard label="上级评分小计" value={derived.managerTotal} color="text-orange-600"
              mismatch={!scoresEdited && calculated && Math.abs(derived.managerTotal - calculated.managerTotal) > 0.01 ? calculated.managerTotal : undefined} />
            <SummaryCard label="综合考评得分" value={derived.finalScore} color="text-primary" highlight
              mismatch={!scoresEdited && calculated && Math.abs(derived.finalScore - calculated.finalScore) > 0.01 ? calculated.finalScore : undefined} />
            <SummaryCard label="季度评级" value={derived.rating} color="text-primary" large
              mismatch={!scoresEdited && calculated && derived.rating !== calculated.rating ? calculated.rating : undefined} />
          </div>

          {/* ─── Score Table (editable) ─── */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> 打分明细</CardTitle>
              <CardDescription>点击分数直接编辑，总分和评级将自动重新计算</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[100px]">考核维度</TableHead>
                      <TableHead>指标名称</TableHead>
                      <TableHead className="w-[70px] text-center">权重</TableHead>
                      <TableHead className="w-[110px] text-center text-blue-600">自评得分</TableHead>
                      <TableHead className="w-[110px] text-center text-orange-600">上级评分</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.scores.map((s, idx) => {
                      const meta = CATEGORY_META[s.category] || { color: 'text-foreground', bgClass: '' };
                      // Show category label only on first row of each category
                      const isFirstInCategory = idx === 0 || data.scores[idx - 1].category !== s.category;
                      const categoryRowSpan = data.scores.filter(x => x.category === s.category).length;

                      return (
                        <TableRow key={idx} className={meta.bgClass}>
                          {isFirstInCategory && (
                            <TableCell rowSpan={categoryRowSpan} className={`font-semibold text-xs ${meta.color} align-middle`}>
                              {s.category}
                            </TableCell>
                          )}
                          <TableCell className="font-medium text-sm">{s.name}</TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">{(s.weight * 100).toFixed(0)}%</TableCell>
                          <TableCell className="text-center p-1">
                            <Input
                              type="number"
                              min={0} max={10} step={0.5}
                              value={s.selfScore}
                              onChange={(e) => updateScore(idx, 'selfScore', e.target.value)}
                              className="w-16 mx-auto text-center text-blue-600 font-semibold h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </TableCell>
                          <TableCell className="text-center p-1">
                            <Input
                              type="number"
                              min={0} max={10} step={0.5}
                              value={s.managerScore}
                              onChange={(e) => updateScore(idx, 'managerScore', e.target.value)}
                              className="w-16 mx-auto text-center text-orange-600 font-semibold h-8 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* ─── Evaluation Texts (editable) ─── */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-blue-600 flex items-center gap-2"><Pencil className="w-4 h-4" /> 员工自评</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={data.selfEvaluationText}
                  onChange={(e) => updateText('selfEvaluationText', e.target.value)}
                  className="min-h-[120px] text-sm"
                  placeholder="暂无自评内容"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-orange-600 flex items-center gap-2"><Pencil className="w-4 h-4" /> 上级评价</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={data.managerEvaluationText}
                  onChange={(e) => updateText('managerEvaluationText', e.target.value)}
                  className="min-h-[120px] text-sm"
                  placeholder="暂无上级评价内容"
                />
              </CardContent>
            </Card>
          </div>

          {/* ─── Save Bar (bottom) ─── */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-1.5" /> 重新上传</Button>
            <Button onClick={handleSave} disabled={isSaving || isSaved} size="lg"
              className={isSaved ? 'bg-green-600 hover:bg-green-600' : ''}>
              {isSaving ? '保存中…' : isSaved ? <><CheckCircle2 className="w-4 h-4 mr-1.5" /> 已保存</> : <><Save className="w-4 h-4 mr-1.5" /> 确认入库</>}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ━━━━━━━━━━ Sub-components ━━━━━━━━━━ */

function InfoField({ icon, label, value, onChange }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground flex items-center gap-1.5">{icon}{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" />
    </div>
  );
}

function SummaryCard({ label, value, color, highlight, large, mismatch }: {
  label: string; value: number | string; color: string; highlight?: boolean; large?: boolean;
  mismatch?: number | string;
}) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/40'} ${mismatch !== undefined ? 'border-amber-400/60' : ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-bold ${large ? 'text-3xl' : 'text-2xl'} ${color}`}>{value}</p>
      {mismatch !== undefined && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>按明细重算应为 <strong>{mismatch}</strong></span>
        </div>
      )}
    </div>
  );
}
