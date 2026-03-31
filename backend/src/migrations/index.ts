import type { Migration } from '../lib/migration'
import { migration001InitialSchema } from './001_initial_schema'
import { migration002AddCreatedViaColumn } from './002_add_created_via_column'
import { migration003AddCheckConstraints } from './003_add_check_constraints'
import { migration004AddMaxLicenses } from './004_add_max_licenses'

/**
 * Ordered list of all migrations.
 * Migrations are applied in version order.
 * Each migration has `up()` and `down()` functions for reversibility.
 */
export const allMigrations: Migration[] = [
  migration001InitialSchema,
  migration002AddCreatedViaColumn,
  migration003AddCheckConstraints,
  migration004AddMaxLicenses,
]
