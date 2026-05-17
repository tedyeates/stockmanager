#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [int]$MaxIterations = 10,

    [Parameter(Position = 1, Mandatory = $true)]
    [string]$SpecsName
)

$ErrorActionPreference = "Stop"

# ── Validation ──
if ($MaxIterations -lt 1) {
    Write-Host "❌ Error: <max_iterations> must be a positive integer, got '$MaxIterations'" -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrWhiteSpace($SpecsName)) {
    Write-Host "❌ Error: <specs_name> must be a non-empty string" -ForegroundColor Red
    exit 1
}

# ── Path setup ──
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SpecsDir = Join-Path $ScriptDir ".kiro\specs\$SpecsName"

if (-not (Test-Path $SpecsDir -PathType Container)) {
    Write-Host "❌ Error: No specs named '$SpecsName' found in this project" -ForegroundColor Red
    exit 1
}

# ── Detect spec type ──
$BugfixFile = Join-Path $SpecsDir "bugfix.md"
$RequirementsFile = Join-Path $SpecsDir "requirements.md"

if (Test-Path $BugfixFile) {
    $SpecType = "bugfix"
} else {
    $SpecType = "feature"
}

# ── Initialize progress log ──
$ProgressFile = Join-Path $SpecsDir "progress.md"
if (-not (Test-Path $ProgressFile)) {
    "# Progress Log for spec: $SpecsName" | Set-Content $ProgressFile -Encoding UTF8
    Write-Host "📝 Created progress.md" -ForegroundColor DarkGray
}

# ── Load prompt template ──
$PromptTemplate = Join-Path $ScriptDir "ralph.md"
if (-not (Test-Path $PromptTemplate)) {
    Write-Host "❌ Error: Prompt template not found at '$PromptTemplate'" -ForegroundColor Red
    exit 1
}
$Prompt = (Get-Content $PromptTemplate -Raw) -replace 'SPECS_NAME', $SpecsName

# ── Banner ──
Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Magenta
Write-Host "  🚀 Starting Ralph" -ForegroundColor White
Write-Host "  spec:       $SpecsName" -ForegroundColor Cyan
Write-Host "  type:       $SpecType" -ForegroundColor Cyan
Write-Host "  iterations: $MaxIterations" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════" -ForegroundColor Magenta
Write-Host ""

# ── Mode selection ──
$AutoMode = Read-Host "🔄 Iterate automatically through tasks? (y/n)"
if ($AutoMode -match '^[yY]') {
    $AutoMode = $true
    Write-Host "   ✔ Auto-pilot enabled" -ForegroundColor Green
} else {
    $AutoMode = $false
    Write-Host "   ✔ Manual mode — you'll confirm each iteration" -ForegroundColor Blue
}

# ── Show prompt ──
Write-Host ""
Write-Host "─── 📋 Prompt ───────────────────────────" -ForegroundColor Cyan
Write-Host $Prompt
Write-Host "──────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""

Read-Host "👀 Review the prompt above. Press Enter to launch the Ralph loop..."
Write-Host ""

# ── Main loop ──
for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host "═══════════════════════════════════════" -ForegroundColor Blue
    Write-Host "  🔁 Iteration $i / $MaxIterations" -ForegroundColor White
    Write-Host "═══════════════════════════════════════" -ForegroundColor Blue

    # Pipe prompt to kiro-cli, capture all output (stdout + stderr merged)
    $Output = $Prompt | kiro-cli chat --trust-all-tools --no-interactive 2>&1 | Tee-Object -Variable CapturedOutput
    # Display output to console (Tee-Object already does this)

    $OutputText = $CapturedOutput -join "`n"

    if ($OutputText -match '<promise>COMPLETE</promise>') {
        Write-Host ""
        Write-Host "══════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅  All tasks complete!" -ForegroundColor Green
        Write-Host "══════════════════════════════════════" -ForegroundColor Green
        exit 0
    }

    if (-not $AutoMode) {
        Write-Host ""
        Read-Host "⏸️  Iteration $i done. Press Enter to continue..."
    }
}

# ── Max iterations reached ──
Write-Host ""
Write-Host "══════════════════════════════════════" -ForegroundColor Red
Write-Host "  ⚠️  Max iterations reached ($MaxIterations)" -ForegroundColor Red
Write-Host "══════════════════════════════════════" -ForegroundColor Red
exit 1
