$ErrorActionPreference = "Stop"

$staged = git diff --cached --name-only

if (-not $staged) {
  exit 0
}

$secretPattern = '(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*["''][^"'']{8,}'
$blocked = @()

foreach ($file in $staged) {
  if (-not (Test-Path -LiteralPath $file)) {
    continue
  }

  $content = Get-Content -LiteralPath $file -Raw -ErrorAction SilentlyContinue
  if ($content -match $secretPattern) {
    $blocked += $file
  }
}

if ($blocked.Count -gt 0) {
  Write-Error "Possible secret detected in staged files: $($blocked -join ', ')"
  exit 1
}

$contractTouched = $staged | Where-Object { $_ -match 'data-contracts\.md|types|schema|model' }
$docsTouched = $staged | Where-Object { $_ -match '^docs/' }

if ($contractTouched -and -not $docsTouched) {
  Write-Warning "Shared data/model files changed without docs updates. Continue only if this is intentional."
}

exit 0
