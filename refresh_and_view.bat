@echo off
REM Refresh encounters data and open dashboard
echo Exporting encounter data from database...
python export_encounters.py > encounters_data.json

if errorlevel 1 (
    echo Error exporting data!
    pause
    exit /b 1
)

echo Data exported successfully!
echo.
echo Opening DPS Analytics Dashboard...
start dps-analytics.html

echo.
echo Dashboard opened in your default browser.
echo.
pause
