import Airtable, { FieldSet, Records } from "airtable";
import { env } from "../config/env";

/**
 * Thin wrapper around the Airtable REST client. Every table in this
 * project keys its rows on a "Date" field (or "Week Start Date" for
 * the scorecard), which lets us implement reliable upserts and avoid
 * duplicate daily records.
 */

Airtable.configure({ apiKey: env.AIRTABLE_API_KEY });
const base = Airtable.base(env.AIRTABLE_BASE_ID);

export type AirtableFields = Record<string, unknown>;

/** Escape a value for use inside an Airtable filterByFormula string. */
function quote(value: string): string {
  return `'${value.replace(/'/g, "\\'")}'`;
}

/** Create a single record in a table. */
export async function createRecord(
  table: string,
  fields: AirtableFields
): Promise<string> {
  const created = await base(table).create([{ fields: fields as FieldSet }]);
  const id = created[0].getId();
  console.log(`📝 Airtable: created record ${id} in "${table}"`);
  return id;
}

/** Update an existing record by id. */
export async function updateRecord(
  table: string,
  id: string,
  fields: AirtableFields
): Promise<void> {
  await base(table).update([{ id, fields: fields as FieldSet }]);
  console.log(`♻️  Airtable: updated record ${id} in "${table}"`);
}

/** Find the first record in `table` where `dateField` equals `dateValue`. */
export async function findByDate(
  table: string,
  dateValue: string,
  dateField = "Date"
): Promise<{ id: string; fields: AirtableFields } | null> {
  const records = await base(table)
    .select({
      maxRecords: 1,
      filterByFormula: `IS_SAME({${dateField}}, ${quote(dateValue)}, 'day')`,
    })
    .firstPage();

  if (records.length === 0) return null;
  return { id: records[0].getId(), fields: records[0].fields as AirtableFields };
}

/**
 * Upsert a record keyed on a date field. If a record already exists
 * for that date it is updated; otherwise a new one is created.
 * Returns whether it created or updated, plus the record id.
 */
export async function upsertByDate(
  table: string,
  dateValue: string,
  fields: AirtableFields,
  dateField = "Date"
): Promise<{ action: "created" | "updated"; id: string }> {
  const existing = await findByDate(table, dateValue, dateField);
  if (existing) {
    await updateRecord(table, existing.id, fields);
    return { action: "updated", id: existing.id };
  }
  const id = await createRecord(table, fields);
  return { action: "created", id };
}

/**
 * Return all records from a table as plain field objects.
 * Optionally sorted by a field. Handles pagination automatically.
 */
export async function listRecords(
  table: string,
  opts: { sortField?: string; sortDirection?: "asc" | "desc"; maxRecords?: number } = {}
): Promise<AirtableFields[]> {
  const selectOpts: Record<string, unknown> = {};
  if (opts.sortField) {
    selectOpts.sort = [
      { field: opts.sortField, direction: opts.sortDirection ?? "asc" },
    ];
  }
  if (opts.maxRecords) selectOpts.maxRecords = opts.maxRecords;

  const all: AirtableFields[] = [];
  await base(table)
    .select(selectOpts)
    .eachPage((records: Records<FieldSet>, fetchNextPage: () => void) => {
      records.forEach((r) => all.push(r.fields as AirtableFields));
      fetchNextPage();
    });
  return all;
}
