import sqlite3
import json
from datetime import datetime
from collections import defaultdict

def get_encounters_data(db_path):
    """Extract encounter data with DPS calculations from the database"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get encounters data
    cursor.execute('''
        SELECT * FROM encounter_search
        LIMIT 100
    ''')
    
    encounters = []
    for row in cursor.fetchall():
        encounters.append({
            'boss': row['current_boss'],
            'players': row['players']
        })
    
    conn.close()
    return encounters

def process_encounters(encounters):
    """Process encounters to extract raid and DPS data"""
    # Group by raid and date
    data_by_raid_date = defaultdict(list)
    
    # Extract raid name from boss name (this is a heuristic)
    raid_map = {
        'Kaltaya': 'Thaemine',
        'Rakathus': 'Thaemine',
        'Firehorn': 'Thaemine',
        'Tienis': 'Kazeros',
        'Prunya': 'Kazeros',
        'Lauriel': 'Kazeros',
        'Sonavel': 'Armoche',
        'Kyzra': 'Mordum',
        'Kaishur': 'Mordum',
        'Dark Mountain Predator': 'Brelshaza',
    }
    
    for encounter in encounters:
        boss = encounter['boss']
        raid = None
        
        # Find raid name
        for key, val in raid_map.items():
            if key in boss:
                raid = val
                break
        
        if not raid:
            raid = 'Unknown'
        
        # Parse players
        players = encounter['players'].split(',')
        
        encounter['raid'] = raid
        encounter['player_count'] = len(players)
        
        data_by_raid_date[raid].append(encounter)
    
    return data_by_raid_date

if __name__ == "__main__":
    db_path = "encounters.db"
    try:
        encounters = get_encounters_data(db_path)
        print(f"Found {len(encounters)} encounters")
        
        # Process data
        data = process_encounters(encounters)
        
        # Output summary
        summary = {}
        for raid, encounter_list in data.items():
            summary[raid] = {
                'count': len(encounter_list),
                'sample_encounters': encounter_list[:2]
            }
        
        print(json.dumps(summary, indent=2, default=str))
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
