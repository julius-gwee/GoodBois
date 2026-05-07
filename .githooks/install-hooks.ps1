$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel
$hooksDir = Join-Path $repoRoot ".githooks"
$gitHooksDir = Join-Path $repoRoot ".git\hooks"

Copy-Item -LiteralPath (Join-Path $hooksDir "pre-commit.ps1") -Destination (Join-Path $gitHooksDir "pre-commit.ps1") -Force
Copy-Item -LiteralPath (Join-Path $hooksDir "commit-msg.ps1") -Destination (Join-Path $gitHooksDir "commit-msg.ps1") -Force

$preCommitShim = @'
#!/bin/sh
powershell.exe -ExecutionPolicy Bypass -File ".git/hooks/pre-commit.ps1"
'@

$commitMsgShim = @'
#!/bin/sh
powershell.exe -ExecutionPolicy Bypass -File ".git/hooks/commit-msg.ps1" "$1"
'@

Set-Content -LiteralPath (Join-Path $gitHooksDir "pre-commit") -Value $preCommitShim -NoNewline
Set-Content -LiteralPath (Join-Path $gitHooksDir "commit-msg") -Value $commitMsgShim -NoNewline

Write-Host "Installed Care Access Map git hooks."
