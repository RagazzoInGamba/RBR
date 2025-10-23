# Oracle Red Bull Racing - Batch Rate Limiting Application Script
# PowerShell script to apply rate limiting to remaining API routes
# Date: 2025-10-22

$filesModified = 0
$handlersAdded = 0

Write-Host "🏎️  Oracle Red Bull Racing - Rate Limiting Batch Application" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Define files and their categories
$files = @(
    @{ Path = "src\app\api\kitchen\menus\route.ts"; Category = "MODERATE"; Handlers = @("GET", "POST") },
    @{ Path = "src\app\api\kitchen\menus\[id]\route.ts"; Category = "MODERATE"; Handlers = @("GET", "PATCH", "DELETE") },
    @{ Path = "src\app\api\kitchen\orders\route.ts"; Category = "MODERATE"; Handlers = @("GET") },
    @{ Path = "src\app\api\kitchen\orders\[id]\status\route.ts"; Category = "MODERATE"; Handlers = @("PATCH") },
    @{ Path = "src\app\api\stats\super-admin\route.ts"; Category = "STATS"; Handlers = @("GET") },
    @{ Path = "src\app\api\stats\customer-admin\route.ts"; Category = "STATS"; Handlers = @("GET") },
    @{ Path = "src\app\api\stats\kitchen\route.ts"; Category = "STATS"; Handlers = @("GET") },
    @{ Path = "src\app\api\stats\user\route.ts"; Category = "STATS"; Handlers = @("GET") },
    @{ Path = "src\app\api\stats\dashboard\route.ts"; Category = "STATS"; Handlers = @("GET") },
    @{ Path = "src\app\api\customer\groups\route.ts"; Category = "MODERATE"; Handlers = @("GET", "POST") },
    @{ Path = "src\app\api\customer\groups\[id]\route.ts"; Category = "MODERATE"; Handlers = @("GET", "PATCH", "DELETE") },
    @{ Path = "src\app\api\customer\employees\route.ts"; Category = "MODERATE"; Handlers = @("GET", "POST") },
    @{ Path = "src\app\api\customer\employees\[id]\route.ts"; Category = "MODERATE"; Handlers = @("GET", "PATCH", "DELETE") },
    @{ Path = "src\app\api\booking\[id]\route.ts"; Category = "STRICT"; Handlers = @("GET", "PATCH", "DELETE") },
    @{ Path = "src\app\api\booking\route.ts"; Category = "RELAXED"; Handlers = @("GET") },
    @{ Path = "src\app\api\booking\rules\route.ts"; Category = "RELAXED"; Handlers = @("GET") },
    @{ Path = "src\app\api\menu\available\route.ts"; Category = "RELAXED"; Handlers = @("GET") },
    @{ Path = "src\app\api\profile\route.ts"; Category = "DEFAULT"; Handlers = @("GET", "PATCH") },
    @{ Path = "src\app\api\profile\password\route.ts"; Category = "STRICT"; Handlers = @("PATCH") },
    @{ Path = "src\app\api\notifications\route.ts"; Category = "DEFAULT"; Handlers = @("GET") },
    @{ Path = "src\app\api\notifications\[id]\route.ts"; Category = "DEFAULT"; Handlers = @("PATCH", "DELETE") },
    @{ Path = "src\app\api\health\route.ts"; Category = "RELAXED"; Handlers = @("GET") }
)

function Add-RateLimitToFile {
    param(
        [string]$FilePath,
        [string]$Category,
        [string[]]$Handlers
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "⚠️  File not found: $FilePath" -ForegroundColor Yellow
        return $false
    }

    $content = Get-Content $FilePath -Raw
    $modified = $false

    # Check if import already exists
    if ($content -notmatch "from '@/lib/rate-limit-middleware'") {
        # Find the last import and add our import after it
        $content = $content -replace "(import.*from.*;\s*\n)(\nexport|\nconst|\ninterface|\ntype|\n/\*\*)", "`$1import { withRateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit-middleware';`n`$2"
        $modified = $true
    }

    foreach ($handler in $Handlers) {
        $pattern = "export async function $handler\((.*?)\) \{\s*\n\s*(try|const|//)"
        $replacement = @"
export async function $handler(`$1) {
  // Rate limiting: $Category
  const rateLimitResponse = await withRateLimitMiddleware(request, RATE_LIMITS.$Category);
  if (rateLimitResponse) return rateLimitResponse;

  `$2
"@

        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $script:handlersAdded++
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content -Path $FilePath -Value $content -NoNewline
        return $true
    }

    return $false
}

Write-Host "Processing $($files.Count) API route files..." -ForegroundColor Green
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file.Path
    Write-Host "📝 Processing: $($file.Path)" -ForegroundColor White
    Write-Host "   Category: $($file.Category) | Handlers: $($file.Handlers -join ', ')" -ForegroundColor Gray

    $result = Add-RateLimitToFile -FilePath $fullPath -Category $file.Category -Handlers $file.Handlers

    if ($result) {
        $filesModified++
        Write-Host "   ✅ Modified successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  Skipped (already has rate limiting or error)" -ForegroundColor Yellow
    }

    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✅ Batch application complete!" -ForegroundColor Green
Write-Host "   Files modified: $filesModified" -ForegroundColor White
Write-Host "   Handlers added: $handlersAdded" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes with git diff" -ForegroundColor White
Write-Host "2. Build project to verify no TypeScript errors" -ForegroundColor White
Write-Host "3. Test rate limiting on key endpoints" -ForegroundColor White
Write-Host ""
