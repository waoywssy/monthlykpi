const fs = require('fs');
const file = 'src/app/api/collections/upload/route.ts';
let code = fs.readFileSync(file, 'utf8');

// Update the creation to include category
code = code.replace(
  /description: projectCategory,/,
  'category: projectCategory,\n                description: \'\','
);

// Add an update block if the project exists but might lack category
code = code.replace(
  /if \(!project\) \{/,
  `if (!project) {`
);

// Actually, let's just make it simpler - if project exists, update its category if missing
code = code.replace(
  `let project = await prisma.project.findUnique({
            where: { name: projectName }
          });`,
  `let project = await prisma.project.findUnique({
            where: { name: projectName }
          });
          
          if (project && projectCategory && !project.category) {
            project = await prisma.project.update({
              where: { id: project.id },
              data: { category: projectCategory }
            });
          }`
);

fs.writeFileSync(file, code);
