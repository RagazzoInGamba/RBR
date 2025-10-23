/**
 * Script to replace all console.log/error with structured logger
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  // API Routes
  'src/app/api/booking/route.ts',
  'src/app/api/booking/[id]/route.ts',
  'src/app/api/booking/rules/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/kitchen/recipes/route.ts',
  'src/app/api/kitchen/recipes/[id]/route.ts',
  'src/app/api/kitchen/menus/route.ts',
  'src/app/api/kitchen/menus/[id]/route.ts',
  'src/app/api/kitchen/orders/route.ts',
  'src/app/api/kitchen/orders/[id]/status/route.ts',
  'src/app/api/customer/employees/route.ts',
  'src/app/api/customer/employees/[id]/route.ts',
  'src/app/api/stats/super-admin/route.ts',
  'src/app/api/stats/kitchen/route.ts',
  'src/app/api/stats/customer-admin/route.ts',
  'src/app/api/stats/user/route.ts',
  'src/app/api/stats/dashboard/route.ts',
  'src/app/api/menu/available/route.ts',
  // Components
  'src/components/auth/LoginForm.tsx',
  // Pages
  'src/app/(dashboard)/super-admin/users/page.tsx',
  'src/app/(dashboard)/kitchen/recipes/page.tsx',
  'src/app/error.tsx',
];

const transformations = [
  {
    // Import statement
    from: /^(import .+?;\n)/,
    to: (match) => match + "import { apiLogger } from '@/lib/logger';\n",
    test: (content) => content.includes("from 'next/server'") && !content.includes("from '@/lib/logger'"),
  },
  {
    // console.error('[API] ...')
    from: /console\.error\('\[API\] (.+?)',\s*(.+?)\);/g,
    to: "apiLogger.error('$1', $2);",
  },
  {
    // console.log/error generic
    from: /console\.(log|error|warn|debug|info)\((.+?)\);/g,
    to: (match, level, args) => {
      const logLevel = level === 'log' ? 'info' : level;
      return `apiLogger.${logLevel}(${args});`;
    },
  },
];

let totalReplacements = 0;

filesToUpdate.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let replacements = 0;

  // Check if logger import needed
  if (content.match(/console\.(log|error|warn|debug|info)/)) {
    // Add import if not present
    if (!content.includes("from '@/lib/logger'")) {
      const importMatch = content.match(/^(import .+?from 'next\/server';)/m);
      if (importMatch) {
        content = content.replace(
          importMatch[0],
          importMatch[0] + "\nimport { apiLogger } from '@/lib/logger';"
        );
        replacements++;
      }
    }

    // Replace console statements
    const consoleMatches = content.match(/console\.(log|error|warn|debug|info)\([^)]+\);/g);
    if (consoleMatches) {
      consoleMatches.forEach((match) => {
        // Extract the log level and message
        const logMatch = match.match(/console\.(log|error|warn|debug|info)\((.+)\);/);
        if (logMatch) {
          const [, level, args] = logMatch;
          const logLevel = level === 'log' ? 'info' : level;

          // Handle different console patterns
          if (args.includes("'[API]")) {
            // Pattern: console.error('[API] Message', error)
            const apiMatch = args.match(/'\[API\]\s*(.+?)',\s*(.+)/);
            if (apiMatch) {
              const [, message, errorVar] = apiMatch;
              const replacement = `apiLogger.${logLevel}('${message}', ${errorVar});`;
              content = content.replace(match, replacement);
              replacements++;
            }
          } else {
            // Generic pattern
            content = content.replace(match, `apiLogger.${logLevel}(${args});`);
            replacements++;
          }
        }
      });
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated ${filePath} (${replacements} replacements)`);
    totalReplacements += replacements;
  } else {
    console.log(`ℹ️  No changes needed: ${filePath}`);
  }
});

console.log(`\n✨ Total replacements: ${totalReplacements}`);
