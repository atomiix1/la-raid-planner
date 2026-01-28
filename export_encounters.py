import sqlite3
import json
from datetime import datetime
from collections import defaultdict

def get_encounters_data():
    """Extract encounter data from the database"""
    conn = sqlite3.connect('encounters.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM encounter_search LIMIT 200')
        encounters = cursor.fetchall()
        
        raids = defaultdict(lambda: defaultdict(list))
        
        for encounter in encounters:
            boss = encounter['current_boss']
            players_str = encounter['players']
            
            raid = map_boss_to_raid(boss)
            
            # Parse players and calculate average level
            players = []
            levels = []
            if players_str:
                for player in players_str.split(','):
                    if ':' in player:
                        level_str, name = player.split(':', 1)
                        try:
                            level = int(level_str)
                            players.append({'name': name, 'level': level})
                            levels.append(level)
                        except ValueError:
                            pass
            
            avg_level = sum(levels) / len(levels) if levels else 0
            
            # Use current date
            date = datetime.now().strftime('%Y-%m-%d')
            
            raids[raid][date].append({
                'boss': boss,
                'players': players,
                'avg_level': round(avg_level, 1)
            })
        
        # Convert to JSON-serializable format
        result = {}
        for raid, dates in raids.items():
            result[raid] = {
                date: encounters for date, encounters in dates.items()
            }
        
        return result
    
    finally:
        conn.close()

def map_boss_to_raid(boss_name):
    """Map boss names to raid names"""
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
        'Dark Mountain': 'Brelshaza',
        'Ravaged Tyrant': 'Brelshaza',
        'Lazaram': 'Brelshaza',
        'Phantom': 'Aegir',
        'Calventus': 'Behemoth',
    }
    
    for key, raid in raid_map.items():
        if key in boss_name:
            return raid
    
    return 'Unknown'

if __name__ == "__main__":
    try:
        data = get_encounters_data()
        # Output to stdout without BOM
        import sys
        output = json.dumps(data, indent=2, ensure_ascii=False)
        # Write with explicit encoding
        sys.stdout.write(output)
    except Exception as e:
        import sys
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
