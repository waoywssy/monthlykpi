const fs = require('fs');

// 1. 修复 API 路由：将 scoreDetails 和 evaluationText 返回给前端
const routePath = 'src/app/api/upload/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

routeCode = routeCode.replace(
  /scores: calculatedScores,\n\s+savedScoresCount: record.scores.length\n\s+\}/,
  `scores: calculatedScores,
        savedScoresCount: record.scores.length,
        scoreDetails: record.scores, // 补充返回明细列表
        evaluationText: {
          self: record.selfEvaluationText,
          manager: record.managerEvaluationText
        }
      }`
);

fs.writeFileSync(routePath, routeCode);

// 2. 修复前端页面：增加可选链保护，防止 map 报错
const pagePath = 'src/app/upload/page.tsx';
let pageCode = fs.readFileSync(pagePath, 'utf8');

pageCode = pageCode.replace(
  /\(result\.data as any\)\.scoreDetails\.map\(/g,
  '(result.data as any).scoreDetails?.map('
);

fs.writeFileSync(pagePath, pageCode);

console.log("Fix applied!");
