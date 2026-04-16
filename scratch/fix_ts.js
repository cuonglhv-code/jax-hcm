const fs = require('fs');
const glob = require('glob'); // Note: we can just use native fs since we know paths
const path = require('path');

const dir = path.join(__dirname, 'server', 'src', 'modules');
const modules = ['recruitment', 'performance', 'leave', 'learning', 'employees', 'payroll'];

for (const mod of modules) {
  const cPath = path.join(dir, mod, `${mod}.controller.ts`);
  if (fs.existsSync(cPath)) {
    let content = fs.readFileSync(cPath, 'utf8');
    content = content.replace(/getPagination\(req\)/g, "getPagination(req.query as any)");
    content = content.replace(/buildPaginationMeta/g, "buildMeta");
    content = content.replace(/import { getPagination, buildMeta } from '\.\.\/\.\.\/utils\/pagination';/g, "import { getPagination, buildMeta } from '../../utils/pagination';");
    fs.writeFileSync(cPath, content);
  }

  const sPath = path.join(dir, mod, `${mod}.service.ts`);
  if (fs.existsSync(sPath)) {
    let content = fs.readFileSync(sPath, 'utf8');
    content = content.replace(/buildPaginationMeta/g, "buildMeta");
    content = content.replace(/NotFoundError/g, "AppError");
    content = content.replace(/ForbiddenError/g, "AppError");
    fs.writeFileSync(sPath, content);
  }

  const rPath = path.join(dir, mod, `${mod}.routes.ts`);
  if (fs.existsSync(rPath)) {
    let content = fs.readFileSync(rPath, 'utf8');
    content = content.replace(/buildPaginationMeta/g, "buildMeta");
    content = content.replace(/NotFoundError/g, "AppError");
    content = content.replace(/ForbiddenError/g, "AppError");
    // Change JwtPayload to AuthUser casting
    content = content.replace(/req\.user as JwtPayload/g, "req.user as unknown as import('@hcm/shared').AuthUser");
    fs.writeFileSync(rPath, content);
  }
}

// Fix learning service typo
const lServicePath = path.join(dir, 'learning', 'learning.service.ts');
if (fs.existsSync(lServicePath)) {
   let content = fs.readFileSync(lServicePath, 'utf8');
   content = content.replace(/\.andWhereNull\(/g, ".whereNull(");
   fs.writeFileSync(lServicePath, content);
}

// Fix recruitment service TS error for grouped array
const rServicePath = path.join(dir, 'recruitment', 'recruitment.service.ts');
if (fs.existsSync(rServicePath)) {
   let content = fs.readFileSync(rServicePath, 'utf8');
   content = content.replace(/const grouped = \{/g, "const grouped: Record<string, any[]> = {");
   content = content.replace(/if \(req && parseInt\(reqStats\.hired_count(.*)\)/g, "if (req && reqStats && parseInt(reqStats.hired_count as string, 10))");
   fs.writeFileSync(rServicePath, content);
}
