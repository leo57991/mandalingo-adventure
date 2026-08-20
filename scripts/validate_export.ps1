$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$godotExecutable = Join-Path $repositoryRoot ".tools\godot-4.7.1\Godot_v4.7.1-stable_win64_console.exe"
$godotProject = Join-Path $repositoryRoot "godot"
$webExport = Join-Path $repositoryRoot "godot-web\index.html"
$webPack = Join-Path $repositoryRoot "godot-web\index.pck"

if (-not (Test-Path -LiteralPath $godotExecutable)) {
  throw "Bundled Godot executable was not found at $godotExecutable"
}

Push-Location $repositoryRoot
try {
  npm run check
  & $godotExecutable --headless --path $godotProject --editor --quit
  if ($LASTEXITCODE -ne 0) { throw "Godot project validation failed with exit code $LASTEXITCODE" }
  & $godotExecutable --headless --path $godotProject --export-release Web $webExport
  if ($LASTEXITCODE -ne 0) { throw "Godot Web export failed with exit code $LASTEXITCODE" }
  if (-not (Test-Path -LiteralPath $webPack)) { throw "Godot Web export did not create index.pck" }
  if ((Get-Item -LiteralPath $webPack).Length -lt 1MB) { throw "Godot Web pack is unexpectedly small" }
  git diff --check
  if ($LASTEXITCODE -ne 0) { throw "git diff --check failed" }
}
finally {
  Pop-Location
}
