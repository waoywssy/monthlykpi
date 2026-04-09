import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  Calendar,
  Target,
  Award,
  CheckCircle2,
  TrendingUp,
  Presentation,
  AlertCircle,
  FileText,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const record = await prisma.evaluationRecord.findUnique({
    where: { id: resolvedParams.id },
    include: {
      employee: {
        include: {
          team: true,
        },
      },
      scores: true,
    },
  });

  if (!record) {
    notFound();
  }

  const { employee } = record;

  // Group scores by category

  const getRatingColor = (rating: string | null) => {
    switch (rating) {
      case "A":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "C":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "D":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回看板
      </Link>

      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        <Card className="flex-1 shadow-md w-full">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{employee.name}</h1>
                  <div className="flex items-center text-muted-foreground mt-1 gap-4">
                    <span className="flex items-center gap-1">
                      <Presentation className="w-4 h-4" /> {employee.team.name}
                    </span>
                    {employee.role && (
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" /> {employee.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> 考核周期
                  </span>
                  <Badge variant="outline" className="font-medium">
                    {record.period}
                  </Badge>
                </div>
                <div
                  className={`px-4 py-1.5 rounded-full font-bold flex items-center gap-1.5 border ${getRatingColor(record.rating)}`}
                >
                  <Award className="w-4 h-4" />
                  绩效评级: {record.rating || "暂无"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              最终得分
            </p>
            <div className="text-4xl font-bold text-primary">
              {record.finalScore}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              上级评分总计
            </p>
            <div className="text-4xl font-bold text-orange-600">
              {record.managerTotal}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              自评得分总计
            </p>
            <div className="text-4xl font-bold text-blue-600">
              {record.selfTotal}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" /> 打分明细
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[150px]">考核维度</TableHead>
                  <TableHead>指标名称</TableHead>
                  <TableHead className="w-[100px] text-center">权重</TableHead>
                  <TableHead className="w-[110px] text-center text-blue-600">
                    自评得分
                  </TableHead>
                  <TableHead className="w-[110px] text-center text-orange-600">
                    上级评分
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.scores.map((s, idx) => {
                  const isFirstInCategory =
                    idx === 0 || record.scores[idx - 1].category !== s.category;
                  const categoryRowSpan = record.scores.filter(
                    (x) => x.category === s.category,
                  ).length;

                  // Same styling as upload page for specific categories
                  const isTeamwork = s.category === "团队协作与影响力" || s.category === "技术能力提升";
                  const bgClass = isTeamwork ? "bg-orange-50/30" : "";
                  const colorClass = isTeamwork
                    ? "text-orange-700"
                    : "text-blue-700";

                  return (
                    <TableRow key={idx} className={bgClass}>
                      {isFirstInCategory && (
                        <TableCell
                          rowSpan={categoryRowSpan}
                          className={`font-semibold text-xs ${colorClass} align-middle`}
                        >
                          {s.category}
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm">
                        {s.name}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {(s.weight * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="text-center text-blue-600 font-semibold">
                        {s.selfScore}
                      </TableCell>
                      <TableCell className="text-center text-orange-600 font-semibold">
                        {s.managerScore}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {(record.selfEvaluationText || record.managerEvaluationText) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {record.selfEvaluationText && (
            <Card className="border-blue-100 dark:border-blue-900/50">
              <CardHeader className="bg-blue-50/50 dark:bg-blue-900/20 pb-4">
                <CardTitle className="text-blue-800 dark:text-blue-400 text-lg flex items-center gap-2">
                  <User className="w-5 h-5" /> 自我总结与期望
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {record.selfEvaluationText}
                </p>
              </CardContent>
            </Card>
          )}

          {record.managerEvaluationText && (
            <Card className="border-orange-100 dark:border-orange-900/50">
              <CardHeader className="bg-orange-50/50 dark:bg-orange-900/20 pb-4">
                <CardTitle className="text-orange-800 dark:text-orange-400 text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> 上级综合评语
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {record.managerEvaluationText}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
