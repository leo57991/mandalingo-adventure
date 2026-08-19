param(
    [string]$GodotPath = ".tools\godot-4.7.1\Godot_v4.7.1-stable_win64_console.exe"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$godotExecutable = Join-Path $repoRoot $GodotPath

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot "godot\project.godot"))) {
    throw "Mandalingo Godot project was not found at $repoRoot"
}
if (-not (Test-Path -LiteralPath $godotExecutable)) {
    throw "Godot executable was not found at $godotExecutable"
}

Push-Location $repoRoot
try {
    & npm test
    if ($LASTEXITCODE -ne 0) { throw "Node tests failed." }

    & $godotExecutable --headless --path godot --editor --quit
    if ($LASTEXITCODE -ne 0) { throw "Godot scene validation failed." }

    & $godotExecutable --headless --path godot --export-release Web ..\godot-web\index.html
    if ($LASTEXITCODE -ne 0) { throw "Godot Web export failed." }

    $packPath = Join-Path $repoRoot "godot-web\index.pck"
    $htmlPath = Join-Path $repoRoot "godot-web\index.html"
    $packSize = (Get-Item -LiteralPath $packPath).Length
    $html = Get-Content -Raw -LiteralPath $htmlPath
    if ($html -notmatch ('"index\.pck":' + $packSize)) {
        throw "Web index does not declare the exported pack size $packSize."
    }

    & git -c "safe.directory=$($repoRoot -replace '\\','/')" diff --check
    if ($LASTEXITCODE -ne 0) { throw "git diff --check failed." }

    Write-Host "MANDALINGO_READY pack_size=$packSize"
}
finally {
    Pop-Location
}
