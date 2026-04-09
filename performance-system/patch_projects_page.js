const fs = require('fs');
const file = 'src/app/projects/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add category to type
code = code.replace(
  /name: string;/,
  'name: string;\n  category: string | null;'
);

// Add to form state
code = code.replace(
  /name: '',/,
  "name: '',\n    category: '',"
);

code = code.replace(
  /name: project.name,/,
  "name: project.name,\n      category: project.category || '',"
);

// Add to table header
code = code.replace(
  /<TableHead>项目名称<\/TableHead>/,
  '<TableHead>项目名称</TableHead>\n                <TableHead>项目分类</TableHead>'
);

// Add to table body
code = code.replace(
  /<TableCell className="font-medium">{project.name}<\/TableCell>/,
  '<TableCell className="font-medium">{project.name}</TableCell>\n                    <TableCell>{project.category || \'-\'}</TableCell>'
);

const formInput = `              <div className="space-y-2">
                <Label htmlFor="category">项目分类</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                />
              </div>`;

code = code.replace(
  /<div className="space-y-2">\s*<Label htmlFor="clientName">/,
  `${formInput}\n              <div className="space-y-2">\n                <Label htmlFor="clientName">`
);

fs.writeFileSync(file, code);
