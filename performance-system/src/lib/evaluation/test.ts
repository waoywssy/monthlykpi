import { parseEvaluationWord } from '../word/parser';
import { calculateScore } from './engine';
import path from 'path';

async function test() {
  try {
    const docPath = path.resolve(process.cwd(), '../docs/智慧畅行研发中心季度绩效考核表.docx');
    const parsed = await parseEvaluationWord(docPath);
    const result = await calculateScore(parsed);
    
    console.log('Calculation Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
