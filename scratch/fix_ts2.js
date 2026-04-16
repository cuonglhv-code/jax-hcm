const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'server', 'src', 'modules');

function walkDir(dirPath, callback) {
  fs.readdirSync(dirPath).forEach(f => {
    let dirPathFile = path.join(dirPath, f);
    let isDirectory = fs.statSync(dirPathFile).isDirectory();
    if (isDirectory) {
      walkDir(dirPathFile, callback);
    } else {
      callback(path.join(dirPathFile));
    }
  });
}

walkDir(dir, function(filePath) {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix buildPaginationMeta
    content = content.replace(/buildPaginationMeta/g, "buildMeta");
    
    // Fix getPagination(req) -> getPagination(req.query)
    content = content.replace(/getPagination\(req\)/g, "getPagination(req.query as any)");
    
    // Fix Not Found and Forbidden
    content = content.replace(/NotFoundError/g, "AppError");
    content = content.replace(/ForbiddenError/g, "AppError");

    // Fix payroll.routes.ts type issue (req.user as JwtPayload -> req.user as any)
    if (filePath.includes('payroll.routes.ts')) {
      content = content.replace(/as JwtPayload/g, "as any");
      content = content.replace(/req\.user\.employeeId/g, "(req.user as any).employeeId");
    }

    // Fix performance controller TS 
    if (filePath.includes('performance.controller.ts')) {
       content = content.replace(/req\.user!\.employeeId!/g, "(req.user as any).employeeId");
    }
    
    // Fix learning controller TS 
    if (filePath.includes('learning.controller.ts')) {
       content = content.replace(/req\.user!\.employeeId!/g, "(req.user as any).employeeId");
    }
    
    // Fix leave controller TS 
    if (filePath.includes('leave.controller.ts')) {
       content = content.replace(/req\.user!\.employeeId/g, "(req.user as any).employeeId");
    }

    // Fix recruitment service
    if (filePath.includes('recruitment.service.ts')) {
       content = content.replace(/const grouped \= \{/g, "const grouped: Record<string, any[]> = {");
       content = content.replace(/if \(req \&\& parseInt\(reqStats\.hired_count as string, 10\) \>\= req\.headcount\)/g, "if (req && reqStats && parseInt(reqStats.hired_count as string, 10) >= req.headcount)");
    }
    
    // Fix learning service
    if (filePath.includes('learning.service.ts')) {
       content = content.replace(/\.andWhereNull/g, ".whereNull");
    }

    fs.writeFileSync(filePath, content);
  }
});
