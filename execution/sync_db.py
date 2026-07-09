import json
import subprocess
import os
import sys

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error running command: {cmd}\n{result.stderr}", file=sys.stderr)
        return None
    return result.stdout

def query_remote_table(table_name):
    print(f"Fetching remote data from table '{table_name}'...")
    cmd = f"npx wrangler d1 execute cineast-db --remote --json --command \"SELECT * FROM {table_name};\""
    output = run_cmd(cmd)
    if not output:
        return []
    try:
        data = json.loads(output)
        if isinstance(data, list) and len(data) > 0:
            return data[0].get("results", [])
        return []
    except Exception as e:
        print(f"Failed to parse JSON for {table_name}: {e}", file=sys.stderr)
        return []

def escape_sql_value(val):
    if val is None:
        return "NULL"
    # Escape single quotes for SQLite
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def main():
    tables = ["users", "settings", "pages", "page_reactions"]
    sql_statements = []

    sql_statements.append("BEGIN TRANSACTION;")
    sql_statements.append("PRAGMA foreign_keys = OFF;")

    for table in tables:
        rows = query_remote_table(table)
        if not rows:
            print(f"No rows found or failed to fetch for table '{table}'.")
            continue
            
        sql_statements.append(f"DELETE FROM {table};")
        
        columns = list(rows[0].keys())
        cols_str = ", ".join(columns)
        
        for row in rows:
            vals = [escape_sql_value(row[col]) for col in columns]
            vals_str = ", ".join(vals)
            sql_statements.append(f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str});")

    # Rebuild FTS
    sql_statements.append("DELETE FROM pages_fts;")
    sql_statements.append("""
INSERT INTO pages_fts(rowid, id, slug, title, meta, summary, content, kind)
SELECT rowid, id, slug, title, COALESCE(meta, ''), COALESCE(summary, ''), COALESCE(content, ''), kind
FROM pages
WHERE status = 'published';
""")

    sql_statements.append("PRAGMA foreign_keys = ON;")
    sql_statements.append("COMMIT;")

    os.makedirs(".tmp", exist_ok=True)
    temp_file = ".tmp/sync_temp.sql"
    with open(temp_file, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_statements))
    
    print(f"SQL file written to {temp_file}. Executing locally...")
    
    cmd = f"npx wrangler d1 execute cineast-db --file {temp_file}"
    res = run_cmd(cmd)
    if res:
        print("Database sync completed successfully!")
        print(res)
    else:
        print("Database sync failed.", file=sys.stderr)

if __name__ == "__main__":
    main()
