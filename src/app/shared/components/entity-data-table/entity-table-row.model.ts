import type { RowData } from '@tanstack/angular-table';

/** Rows must expose a numeric `id` for selection, context menu, and stable row keys. */
export type EntityTableRow = RowData & { id: number };
