import re, pathlib
root = pathlib.Path(r"c:\Users\whois\OneDrive\文件\GitHub\english-learning-hub")
ml_dir = root / 'drizzle'
files = sorted([p for p in ml_dir.glob('*.sql') if re.match(r'\d{4}_', p.name)])
print('MIGRATIONS:', [p.name for p in files])
stmts = []
for path in files:
    text = path.read_text(encoding='utf-8')
    text = re.sub(r'--.*', '', text)
    parts = [part.strip() for part in text.split(';') if part.strip()]
    for part in parts:
        stmts.append((path.name, part.strip()))

schema = {}
errors = []
for fname, stmt in stmts:
    s = stmt.strip()
    if not s:
        continue
    m = re.match(r'CREATE TABLE `([^`]+)` \((.*)\)$', s, re.S)
    if m:
        tn = m.group(1)
        body = m.group(2)
        cols = {}
        for line in [ln.strip() for ln in body.split(',\n') if ln.strip()]:
            if line.startswith('`'):
                cm = re.match(r'`([^`]+)`\s+([^\s]+)', line)
                if cm:
                    cols[cm.group(1)] = cm.group(2)
        schema[tn] = cols
        continue
    m = re.match(r'ALTER TABLE `([^`]+)` (.*)$', s, re.S)
    if m:
        tn = m.group(1)
        body = m.group(2).strip()
        if tn not in schema:
            errors.append((fname, s, f"table {tn} does not exist"))
            continue
        for col, typ in re.findall(r'ADD COLUMN IF NOT EXISTS `([^`]+)`\s+([^,]+)', body):
            schema[tn][col] = typ.strip()
        for col, typ in re.findall(r'ADD COLUMN `([^`]+)`\s+([^,]+)', body):
            if col not in schema[tn]:
                schema[tn][col] = typ.strip()
        for col, typ in re.findall(r'MODIFY COLUMN `([^`]+)`\s+([^,]+)', body):
            if col not in schema[tn]:
                errors.append((fname, s, f"MODIFY COLUMN {col} on {tn} before it exists"))
            else:
                schema[tn][col] = typ.strip()
        for col in re.findall(r'DROP COLUMN IF EXISTS `([^`]+)`', body):
            schema[tn].pop(col, None)
        for col in re.findall(r'DROP COLUMN `([^`]+)`', body):
            if col not in schema[tn]:
                errors.append((fname, s, f"DROP COLUMN {col} on {tn} before it exists"))
            else:
                schema[tn].pop(col)
        continue
    if s.upper().startswith('UPDATE'):
        m = re.match(r'UPDATE `([^`]+)`', s, re.I)
        if not m:
            continue
        tn = m.group(1)
        if tn not in schema:
            errors.append((fname, s, f"UPDATE target table {tn} does not exist"))
            continue
        cols = re.findall(r'`([^`]+)`', s)
        for col in cols:
            if col not in schema[tn]:
                errors.append((fname, s, f"UPDATE refers to non-existing column {col} on {tn}"))
        continue
    if s.upper().startswith('CREATE INDEX') or s.upper().startswith('CREATE UNIQUE INDEX'):
        m = re.search(r'ON `([^`]+)`', s)
        if not m:
            continue
        tn = m.group(1)
        if tn not in schema:
            errors.append((fname, s, f"INDEX target table {tn} does not exist"))
            continue
        cols = re.findall(r'`([^`]+)`', s)
        for col in cols:
            if col == tn:
                continue
            if col not in schema[tn]:
                errors.append((fname, s, f"INDEX refers to non-existing column {col} on {tn}"))
        continue

print('\nERRORS:')
for e in errors:
    print(e)
print('\nFINAL SCHEMA TABLES AND COLUMNS:')
for tn in sorted(schema):
    print(tn, sorted(schema[tn].keys()))
