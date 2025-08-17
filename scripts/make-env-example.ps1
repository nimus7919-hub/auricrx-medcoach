# Generates .env.example from .env.development and .env.production (Windows/PowerShell only)

$envFiles = @(".env.development", ".env.production")
$keys = @()

foreach ($file in $envFiles) {
  if (Test-Path $file) {
    Get-Content -LiteralPath $file | ForEach-Object {
      $line = $_.Trim()
      # skip comments and blanks
      if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { return }
      # match KEY=VALUE
      if ($line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$") {
        $keys += $Matches[1]
      }
    }
  }
}

# Sort keys and dedupe
$sorted = $keys | Sort-Object -Unique

# Build output lines (KEY=)
if ($sorted.Count -eq 0) {
  $output = @(
    "# No keys found in .env.development or .env.production",
    "OPENAI_API_KEY=",
    "API_MODEL="
  )
} else {
  $output = $sorted | ForEach-Object { "$_=" }
}

Set-Content -Path ".env.example" -Value $output -Encoding UTF8
Write-Host "✅ Generated .env.example with the following keys:" -ForegroundColor Green
$sorted | ForEach-Object { Write-Host " - $_" }
