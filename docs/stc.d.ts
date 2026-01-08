/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * STCAPI — Collection Spec (Tier 1)
 * Spec-first: interfaces describe the contract, not the implementation.
 *
 * Tier 1:
 * - in-memory
 * - shapes: flat, tree
 * - size limits with warnings
 *
 * Proposal:
 * - query language (reference impl may use mingo)
 * - graphs, indexing, binary/wasm collections
 */

export declare namespace STC {
  /**
   * Main Collection contract.
   *
   * NOTE: This interface is intentionally merged with `namespace STC.Collection`
   * to allow clean API:
   * - STC.Collection<T> (the collection)
   * - STC.Collection.Key / STC.Collection.Schema / STC.Collection.Entry (types)
   */
  export interface Collection<TRecord extends STC.Collection.AnyRecord = STC.Collection.AnyRecord> {
    /** Collection configuration. */
    readonly options: Readonly<STC.Collection.Options>;

    /** Returns collection schema (Tier 1: required). */
    getSchema(): STC.Collection.Schema<TRecord>;

    /** Returns current stats and near-limit flag. */
    getStats(): STC.Collection.Stats;

    /** True if record exists for key. */
    has(key: STC.Collection.Key): boolean;

    /** Get by key. Returns undefined if not found. */
    get(key: STC.Collection.Key): STC.Collection.Entry<TRecord> | undefined;

    /**
     * Upsert (create or update).
     * If input.key is omitted, collection generates a key.
     * If input.key is provided, implementation must keep it (dump restore use-case).
     */
    upsert(input: STC.Collection.UpsertInput<TRecord>): STC.Collection.UpsertResult;

    /** Upsert many. Atomicity is implementation-defined (Tier 1: best-effort). */
    upsertMany(inputs: Array<STC.Collection.UpsertInput<TRecord>>): Array<STC.Collection.UpsertResult>;

    /** Delete by key. */
    delete(key: STC.Collection.Key): STC.Collection.DeleteResult;

    /** Clear all records. */
    clear(): void;

    /**
     * List items (Tier 1 minimal).
     * Pagination is optional for in-memory implementation.
     */
    list(params?: { cursor?: string; limit?: number }): STC.Collection.ListResult<TRecord>;

    /**
     * PROPOSAL: query by serialized expression.
     * Reference Tier 1 implementation may use mingo.
     * Implementations may omit this method or throw if unsupported.
     */
    query?(
      expr: STC.Collection.Proposal.QueryExpr,
      options?: STC.Collection.Proposal.QueryOptions
    ): STC.Collection.Proposal.QueryResult<TRecord>;
  }

  export namespace Collection {
    /** Tier 1 baseline record type. */
    export type AnyRecord = Record<string, unknown>;

    /** Supported key types. */
    export type Key = string | number;

    /** Collection shape (Tier 1 supports flat + tree). */
    export type Shape = "flat" | "tree";

    /** Tier 1: tree records must have parentId. */
    export type TreeRecord<T extends AnyRecord = AnyRecord> = T & {
      parentId: Key | null;
    };

    /** Minimal schema representation (vendor-agnostic). */
    export interface Schema<TRecord extends AnyRecord = AnyRecord> {
      /** Stable identifier for the schema (optional). */
      id?: string;

      /** Human-readable information (optional). */
      title?: string;
      description?: string;

      /** Expected shape of the collection. */
      shape: Shape;

      /**
       * Minimal field descriptions (not tied to JSON Schema / Zod / OpenAPI).
       * Richer formats should live in `docs` component later.
       */
      fields?: Record<
        string,
        {
          description?: string;
          type?: string; // "unknown" allowed, implementation-defined
          optional?: boolean;
        }
      >;

      /** Optional extension bag (discouraged in Tier 1). */
      ext?: Record<string, unknown>;
    }

    /** Collection limits configuration. */
    export interface Limits {
      /**
       * Max number of records allowed.
       * Tier 1 recommended default: 10_000.
       */
      maxRecords?: number;

      /**
       * Warning threshold ratio in (0..1).
       * Tier 1 recommended default: 0.9 (warn at 90%).
       */
      warnAtRatio?: number;
    }

    /** Collection metadata/config. */
    export interface Options {
      /** Stable identifier of the collection instance (optional but recommended). */
      id?: string;

      /** Human-readable name/title. */
      title?: string;

      /** Shape of collection. */
      shape: Shape;

      /** Limits to reduce accidental memory leaks in Tier 1. */
      limits?: Limits;
    }

    /** Lightweight stats (Tier 1). */
    export interface Stats {
      /** Number of stored records. */
      count: number;

      /** Resolved limits (defaults may be applied by implementation). */
      limits: Required<Pick<Limits, "maxRecords" | "warnAtRatio">>;

      /** True if count >= maxRecords * warnAtRatio. */
      nearLimit: boolean;
    }

    /** Key + record pair. */
    export interface Entry<TRecord extends AnyRecord = AnyRecord> {
      key: Key;
      record: TRecord;
    }

    /** Upsert input. If key omitted — generated. */
    export interface UpsertInput<TRecord extends AnyRecord = AnyRecord> {
      key?: Key;
      record: TRecord;
    }

    export interface UpsertResult {
      key: Key;
      created: boolean;
      updated: boolean;
    }

    export interface DeleteResult {
      key: Key;
      existed: boolean;
    }

    export interface ListResult<TRecord extends AnyRecord = AnyRecord> {
      items: Array<Entry<TRecord>>;
      /** Optional pagination cursor/token (Tier 1 optional). */
      nextCursor?: string;
    }

    /** Basic errors (Tier 1 minimal). */
    export type ErrorCode =
      | "LIMIT_EXCEEDED"
      | "INVALID_RECORD"
      | "NOT_FOUND"
      | "CONFLICT"
      | "INTERNAL";

    export interface Error {
      code: ErrorCode;
      message: string;
      details?: Record<string, unknown>;
    }

    /** Proposal-only query API. */
    export namespace Proposal {
      /**
       * Serialized query expression (opaque).
       * Reference Tier 1 implementation may accept mingo-compatible objects.
       */
      export type QueryExpr = unknown;

      export interface QueryOptions {
        limit?: number;
        skip?: number;
        sort?: unknown;
      }

      export interface QueryResult<TRecord extends AnyRecord = AnyRecord> {
        items: Array<Entry<TRecord>>;
      }
    }

    /** Tier 1 recommended defaults. */
    export const DEFAULT_MAX_RECORDS: 10000;
    export const DEFAULT_WARN_AT_RATIO: 0.9;
  }
}
