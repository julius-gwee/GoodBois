param(
  [string]$MessageFile
)

$ErrorActionPreference = "Stop"

if (-not $MessageFile -or -not (Test-Path -LiteralPath $MessageFile)) {
  exit 0
}

$message = Get-Content -LiteralPath $MessageFile -Raw
$firstLine = ($message -split "`r?`n")[0]

if ($firstLine -notmatch '^(feat|bugfix|docs|chore|test|refactor|epic): .+') {
  Write-Error "Commit message must start with category, e.g. 'feat: add hazard export'. Allowed: feat, bugfix, docs, chore, test, refactor, epic."
  exit 1
}

exit 0
