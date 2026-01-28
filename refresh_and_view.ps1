#!/usr/bin/env pwsh
# Refresh encounters data and open dashboard

Write-Host "Exporting encounter data from database..." -ForegroundColor Cyan

# Run the Python script
python export_encounters.py | Out-File -FilePath encounters_data.json -Encoding UTF8

# Check if successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Data exported successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Opening DPS Analytics Dashboard..." -ForegroundColor Cyan
    
    # Open the HTML file in default browser
    Start-Process dps-analytics.html
    
    Write-Host "Dashboard opened in your default browser." -ForegroundColor Green
} else {
    Write-Host "✗ Error exporting data!" -ForegroundColor Red
    exit 1
}
