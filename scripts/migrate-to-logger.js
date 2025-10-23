/**
 * Automated migration: console.* → Winston logger
 * Oracle Red Bull Racing - Maintenance Script
 *
 * This script automatically replaces all console.* calls with Winston logger
 * and adds the necessary import statements.
 *
 * Usage: node scripts/migrate-to-logger.js
 */

const fs = require('fs');
const path = require('path');

// Replacement patterns
const replacements = [
  {
    from: /console\.log\(/g,
    to: "logger.info(",
    type: 'log'
  },
  {
    from: /console\.error\(/g,
    to: "logger.error(",
    type: 'error'
  },
  {
    from: /console\.warn\(/g,
    to: "logger.warn(",
    type: 'warn'
  },
  {
    from: /console\.debug\(/g,
    to: "logger.debug(",
    type: 'debug'
  },
  {
    from: /console\.info\(/g,
    to: "logger.info(",
    type: 'info'
  },
];

const stats = {
  filesModified: 0,
  totalReplacements: 0,
  byType: { log: 0, error: 0, warn: 0, debug: 0, info: 0 },
  filesWithImport: 0,
  filesNeedImport: 0,
  errors: [],
};

function hasLoggerImport(content) {
  return content.includes("from '@/lib/logger'") ||
         content.includes('from "@/lib/logger"') ||
         content.includes("from '@/lib/logger';") ||
         content.includes('from "@/lib/logger";');
}

function addLoggerImport(content) {
  // Check if file already has imports
  const importRegex = /^import\s+.*\s+from\s+['"].*['"];?\s*$/m;
  const match = content.match(importRegex);

  if (match) {
    // Find the position of the last import
    const lastImportIndex = content.lastIndexOf(match[0]) + match[0].length;
    const importLine = "\nimport { logger } from '@/lib/logger';";

    return content.slice(0, lastImportIndex) + importLine + content.slice(lastImportIndex);
  }

  // No imports found, check if file starts with a comment block
  if (content.startsWith('/**') || content.startsWith('/*')) {
    const commentEndIndex = content.indexOf('*/') + 2;
    const importLine = "\n\nimport { logger } from '@/lib/logger';\n";
    return content.slice(0, commentEndIndex) + importLine + content.slice(commentEndIndex);
  }

  // Add at beginning of file
  return "import { logger } from '@/lib/logger';\n\n" + content;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileReplacements = 0;

    // Apply replacements
    replacements.forEach(({ from, to, type }) => {
      const matches = content.match(from);
      if (matches) {
        const count = matches.length;
        content = content.replace(from, to);
        modified = true;
        fileReplacements += count;
        stats.byType[type] += count;
      }
    });

    if (modified) {
      // Check if logger import exists
      if (!hasLoggerImport(content)) {
        content = addLoggerImport(content);
        stats.filesNeedImport++;
      } else {
        stats.filesWithImport++;
      }

      // Write modified content
      fs.writeFileSync(filePath, content, 'utf8');

      stats.filesModified++;
      stats.totalReplacements += fileReplacements;

      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✅ ${relativePath} (${fileReplacements} replacements)`);
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir, excludeDirs = ['node_modules', '.next', 'dist', 'build', 'coverage']) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file) && !file.startsWith('.')) {
          walkDirectory(filePath, excludeDirs);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Skip type definition files
        if (!file.endsWith('.d.ts')) {
          processFile(filePath);
        }
      }
    });
  } catch (error) {
    console.error(`❌ Error walking directory ${dir}:`, error.message);
  }
}

// Main execution
console.log('🏎️  Oracle Red Bull Racing - Logger Migration Script');
console.log('=====================================================');
console.log('🚀 Starting console.* → logger migration...\n');

const srcDir = path.join(process.cwd(), 'src');

if (!fs.existsSync(srcDir)) {
  console.error('❌ Error: src/ directory not found!');
  console.error('   Make sure you run this script from the project root directory.');
  process.exit(1);
}

walkDirectory(srcDir);

console.log('\n=====================================================');
console.log('📊 Migration Complete!\n');
console.log('Statistics:');
console.log(`  Files modified: ${stats.filesModified}`);
console.log(`  Total replacements: ${stats.totalReplacements}`);
console.log(`  By type:`);
console.log(`    console.log   → logger.info:  ${stats.byType.log}`);
console.log(`    console.error → logger.error: ${stats.byType.error}`);
console.log(`    console.warn  → logger.warn:  ${stats.byType.warn}`);
console.log(`    console.debug → logger.debug: ${stats.byType.debug}`);
console.log(`    console.info  → logger.info:  ${stats.byType.info}`);
console.log(`\n  Logger import:`);
console.log(`    Already had import: ${stats.filesWithImport}`);
console.log(`    Import added: ${stats.filesNeedImport}`);

if (stats.errors.length > 0) {
  console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
  stats.errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

console.log('\n✅ All done! Winston logger is now active across the project.');
console.log('');
console.log('Next steps:');
console.log('  1. Review changes: git diff');
console.log('  2. Build project: npm run build');
console.log('  3. Run tests: npm test');
console.log('  4. Commit changes: git add . && git commit -m "Migrate console.* to Winston logger"');
console.log('');
