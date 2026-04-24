$ScriptDir = Split-Path $MyInvocation.MyCommand.Path

Write-Host "Starting API Server on port 3000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir'; `$env:PORT='3000'; npx pnpm --filter @workspace/api-server run dev"

Write-Host "Starting Frontend on port 5173..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir'; `$env:PORT='5173'; `$env:BASE_PATH='/'; npx pnpm --filter @workspace/anime-chess run dev"

Write-Host "Both services are starting up in new windows. You can access the game at http://localhost:5173 once Vite is ready."
