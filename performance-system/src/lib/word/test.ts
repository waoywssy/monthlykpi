import { parseEvaluationWord } from './parser';
import path from 'path';

async function test() {
  try {
    const docPath = path.resolve(process.cwd(), '../docs/智慧畅行研发中心季度绩效考核表.docx');
    console.log('Testing with file:', docPath);
    const result = await parseEvaluationWord(docPath);
    console.log('✅ Success!');
    console.log(JSON.stringify(result, null, 2));
  } catch(e) {
    console.error('❌ Error occurred:');
    console.error(e);
  }
}
test();
