import sqlite3
import json
from datetime import datetime

def read_encounters_db(db_path):
    """Read encounters.db and extract DPS data"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    
    print("Tables found:")
    for table in tables:
        print(f"  - {table[0]}")
    
    result = {
        "tables": [table[0] for table in tables],
        "data": {}
    }
    
    # For each table, get structure and sample data
    for table in tables:
        table_name = table[0]
        
        # Get column info
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        # Get sample data
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 10")
        rows = cursor.fetchall()
        
        result["data"][table_name] = {
            "columns": [col[1] for col in columns],
            "sample_data": [dict(zip([col[1] for col in columns], row)) for row in rows]
        }
    
    conn.close()
    return result

if __name__ == "__main__":
    db_path = "encounters.db"
    try:
        data = read_encounters_db(db_path)
        print(json.dumps(data, indent=2, default=str))
    except Exception as e:
        print(f"Error: {e}")
