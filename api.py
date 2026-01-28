from flask import Flask, jsonify
import sqlite3
from datetime import datetime
from collections import defaultdict
import json

app = Flask(__name__)

def get_db_connection():
    conn = sqlite3.connect('encounters.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/encounters')
def get_encounters():
    """Get all encounters from the database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM encounter_search ORDER BY rowid DESC LIMIT 200')
        encounters = cursor.fetchall()
        
        # Process encounters
        data = []
        for encounter in encounters:
            boss = encounter['current_boss']
            players_str = encounter['players']
            
            # Parse players and get DPS (player level)
            players = []
            if players_str:
                for player in players_str.split(','):
                    if ':' in player:
                        level, name = player.split(':', 1)
                        players.append({
                            'name': name,
                            'level': int(level)
                        })
            
            # Assign raid based on boss name
            raid = map_boss_to_raid(boss)
            
            data.append({
                'boss': boss,
                'raid': raid,
                'players': players,
                'player_count': len(players)
            })
        
        return jsonify({
            'success': True,
            'encounters': data,
            'count': len(data)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        conn.close()

@app.route('/api/encounters/by-raid')
def get_encounters_by_raid():
    """Get encounters grouped by raid"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM encounter_search LIMIT 200')
        encounters = cursor.fetchall()
        
        raids = defaultdict(lambda: defaultdict(list))
        
        for encounter in encounters:
            boss = encounter['current_boss']
            players_str = encounter['players']
            
            raid = map_boss_to_raid(boss)
            
            # Parse players
            players = []
            avg_level = 0
            if players_str:
                for player in players_str.split(','):
                    if ':' in player:
                        level, name = player.split(':', 1)
                        players.append({
                            'name': name,
                            'level': int(level)
                        })
                
                if players:
                    avg_level = sum(p['level'] for p in players) / len(players)
            
            # Group by date (use today for now since db doesn't have dates)
            date = datetime.now().strftime('%Y-%m-%d')
            
            raids[raid][date].append({
                'boss': boss,
                'players': players,
                'avg_level': avg_level
            })
        
        # Convert to list format
        result = {}
        for raid, dates in raids.items():
            result[raid] = {
                date: encounters for date, encounters in dates.items()
            }
        
        return jsonify({
            'success': True,
            'raids': result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
