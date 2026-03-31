# Database Migration System

This backend uses a version-controlled migration system for managing database schema changes.

## Architecture

```
db.ts (initializes migrations)
  ↓
migration.ts (migration runner and tracking)
  ↓
migrations/ (migration definitions)
  ├── 001_initial_schema.ts
  ├── 002_add_created_via_column.ts
  ├── 003_add_check_constraints.ts
  └── index.ts (exports all migrations)
```

## How It Works

1. **On startup**, `db.ts`:
   - Creates `_migrations` tracking table
   - Compares applied vs pending migrations
   - Runs pending migrations in order

2. **Each migration**:
   - Has unique `version` and `name`
   - Provides `up()` and `down()` functions
   - Is recorded in `_migrations` table

3. **Idempotency**:
   - Migrations check existing state before making changes
   - Safe to rerun without causing errors

## Structure

### Migration File

```typescript
import type Database from 'better-sqlite3'
import type { Migration } from '../lib/migration'

export const migration001Example: Migration = {
  version: 1,
  name: 'example_migration',
  
  up: (db) => {
    // Apply schema change
    db.exec(`ALTER TABLE ...`)
    
    // Perform data migration if needed
    db.prepare(`UPDATE ...`).run()
  },
  
  down: (db) => {
    // Reverse the change
    db.exec(`ALTER TABLE ...`)
  },
}
```

## Creating New Migrations

1. Create new file: `src/migrations/NNN_description.ts`
2. Implement `Migration` interface with increment `version`
3. Add idempotency checks
4. Export from `src/migrations/index.ts`
5. Build and run

Example:

```bash
# Create file: src/migrations/004_add_new_feature.ts

export const migration004AddNewFeature: Migration = {
  version: 4,
  name: 'add_new_feature',
  up: (db) => {
    // Check if table exists
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .all('NewTable') as Array<{ name: string }>
    
    if (tables.length === 0) {
      db.exec(`CREATE TABLE NewTable (...)`)
    }
  },
  down: (db) => {
    db.exec(`DROP TABLE IF EXISTS NewTable;`)
  },
}

# Then in src/migrations/index.ts:
import { migration004AddNewFeature } from './004_add_new_feature'

export const allMigrations = [
  // ... previous migrations
  migration004AddNewFeature,
]
```

## Viewing Migration History

```sql
SELECT * FROM _migrations ORDER BY version;
```

## Schema Documentation

Migration 003 documents desired CHECK constraints in `_schema_notes` table:

```sql
SELECT content FROM _schema_notes WHERE note_type = 'pending_constraints';
```

## Best Practices

1. **Always provide rollback**: Implement `down()` for all migrations
2. **Make migrations idempotent**: Check existence before creating
3. **Name clearly**: Use descriptive names (`add_column_x`, `migrate_data_y`)
4. **Keep migrations focused**: One logical change per migration
5. **Document complex changes**: Add comments in migration code
6. **Test locally**: Run migrations locally before deployment
7. **Version increment**: Each new migration increments the version number

## Common Issues

### Migration fails at startup

1. Check database logs in console
2. Verify migration function syntax
3. Ensure all required tables exist in `down()` checks

### Need to rollback

Currently not automated. To manually rollback:

1. Delete row from `_migrations` table: `DELETE FROM _migrations WHERE version = X`
2. Run migration `down()` function manually
3. Fix the issue and reapply

## Future Improvements

- [ ] CLI tool for creating migrations: `npm run migrate:create <name>`
- [ ] Rollback automation
- [ ] Migration dry-run mode
- [ ] Schema validation against expected state
