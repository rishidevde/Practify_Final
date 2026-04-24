Write-Host "Starting Video Call Signaling Server..." -ForegroundColor Cyan
& "$PSScriptRoot\.venv\Scripts\python.exe" "$PSScriptRoot\app\video_server.py"