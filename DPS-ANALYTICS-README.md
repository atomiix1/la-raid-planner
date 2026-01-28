# Raid DPS Analytics Dashboard

A web-based dashboard to visualize raid encounter data and DPS metrics from your Lost Ark raid tracker.

## Features

- **📊 Visual Charts**: View raid encounters and average player levels by raid
- **📈 Statistics**: See total encounters, number of raids, and average stats
- **🎯 Filtering**: Filter encounters by specific raids
- **📋 Detailed Table**: Browse all encounters with boss names and player information
- **📅 Date Tracking**: Encounters grouped by date

## Files

- `dps-analytics.html` - Main dashboard page
- `encounters_data.json` - Auto-generated encounter data from the database
- `export_encounters.py` - Script to export encounter data from `encounters.db`

## How to Use

### Viewing the Dashboard

1. **Generate the Data** (run this once or whenever you want to refresh):
   ```bash
   python export_encounters.py > encounters_data.json
   ```

2. **Open the Dashboard**:
   - Simply open `dps-analytics.html` in your web browser
   - Or use: `python -m http.server 8000` then visit `http://localhost:8000/dps-analytics.html`

### Auto-Refresh Data

To keep the encounter data updated, you can:

**Option 1: Manual Refresh**
- Run the export script periodically:
  ```bash
  python export_encounters.py > encounters_data.json
  ```

**Option 2: Scheduled Refresh (Windows Task Scheduler)**
- Create a scheduled task to run the export script daily

**Option 3: Watch Mode**
- Use a Python watch library to auto-export when encounters.db changes

## Data Structure

The dashboard visualizes:

- **Encounters by Raid**: Bar chart showing how many encounters in each raid
- **Average Player Levels**: Line chart showing average team level by raid
- **Encounter Details**: Table with boss names, player names, and their levels

## Raid Mapping

The script automatically maps boss names to raids:
- Thaemine: Kaltaya, Rakathus, Firehorn
- Kazeros: Tienis, Prunya, Lauriel
- Armoche: Sonavel
- Mordum: Kyzra, Kaishur
- Brelshaza: Dark Mountain, Ravaged Tyrant, Lazaram
- Aegir: Phantom
- Behemoth: Calventus

## Customization

Edit `export_encounters.py` to:
- Modify the `raid_map` dictionary to add more boss-to-raid mappings
- Change the number of encounters loaded (modify `LIMIT 200`)
- Add additional data fields from the encounters.db

## Requirements

- Python 3.6+
- SQLite3 (included with Python)
- Web browser (any modern browser)

## Troubleshooting

**Dashboard shows no data:**
1. Ensure `encounters_data.json` exists in the same directory
2. Run: `python export_encounters.py > encounters_data.json`
3. Check browser console for errors (F12 → Console tab)

**Can't find encounters.db:**
1. Make sure `encounters.db` is in the same directory as the scripts
2. Verify file exists: `dir encounters.db`

**JSON file is empty:**
1. Check if encounters.db has valid data
2. Run: `python export_encounters.py` (without redirect) to see errors
