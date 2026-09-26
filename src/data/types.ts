/** Wire types, mirroring `Trust/Graph.lean`. Keep the two in sync. */

export type DeclKind =
  | 'axiom'
  | 'def'
  | 'theorem'
  | 'opaque'
  | 'quot'
  | 'inductive'
  | 'ctor'
  | 'recursor'
  // Finer kinds an index made from a LeanTrustBuilders dataset carries.
  | 'instance'
  | 'class'
  | 'structure'

export type EdgeKind = 'statement' | 'body'

export type NodeId = number

export interface Decl {
  id: NodeId
  name: string
  module: string
  kind: DeclKind
  isProp: boolean
  isData: boolean
  axioms?: string[]
  usesSorry?: boolean
  /** Semantic hash, when the index was exported with `--with-hashes`. */
  hash?: string
  /**
   * The Lake package the declaration comes from, when the index records it (an
   * index made from a LeanTrustBuilders dataset does).  It is then what the
   * repository filter shows, rather than a guess from the module's first
   * component.
   */
  package?: string
}

export interface Edge {
  src: NodeId
  tgt: NodeId
  kind: EdgeKind
}

/** A dependency graph rooted at one declaration, as returned by `trust deps`. */
export interface Graph {
  root: NodeId
  nodes: Decl[]
  edges: Edge[]
  /** Set when a node or edge budget cut the traversal short. */
  truncated?: boolean
}

/** A range of rendered code that refers to a constant. */
export interface CodeRef {
  /** Start offset, in UTF-16 code units — directly usable as a JS string index. */
  start: number
  /** End offset, exclusive. */
  stop: number
  /** The constant referred to. */
  name: string
}

export interface CodeBlock {
  text: string
  refs: CodeRef[]
}

/**
 * A rendered declaration.
 *
 * `value` is null for proofs — Lean's `ToJson` writes `Option` as an explicit
 * null rather than omitting the key, so this is null and not undefined.
 */
export interface DeclCode {
  id: NodeId
  signature: CodeBlock
  value: CodeBlock | null
  /** The author's docstring, when the declaration has one. */
  doc?: string | null
}

/** Someone vouched for a declaration, at a particular commit. */
export interface TrustMark {
  name: string
  commit: string
  note: string
}

/** A definition together with the theorems that pin it down. */
export interface Characterization {
  definition: string
  theorems: string[]
  note: string
}

/**
 * The verdict on a protected declaration, decided by the exporter.
 *
 * Comparing a declaration against its snapshot needs the Lean environment, so
 * the browser is handed the answer rather than computing it.
 */
export type ProtectionStatus = 'unchanged' | 'changed' | 'unrecorded' | 'missing' | 'incomparable'

/** A declaration whose content is watched for change. */
export interface ProtectedMark {
  name: string
  note: string
  status: ProtectionStatus
  recordedHash?: string
  currentHash?: string
  recordedAt?: string
}

/**
 * The human judgements attached to an index.
 *
 * Named `protectedDecls` rather than `protected`, which is a reserved word in
 * strict-mode JavaScript and so cannot be destructured; the wire format uses
 * `protected` and `marks.ts` translates.
 */
export interface Marks {
  version: number
  hasher?: string
  trusted: TrustMark[]
  characterizations: Characterization[]
  protectedDecls: ProtectedMark[]
  /**
   * Repositories trusted wholesale: every declaration of one counts as trusted.
   * What an index made from a LeanTrustBuilders dataset carries for the
   * packages its site treats as audited (Lean core, Mathlib, …).
   */
  trustedPackages?: string[]
}

export interface IndexMeta {
  schemaVersion: number
  repo: string
  rev: string
  toolchain: string
  moduleCount: number
  declCount: number
  stmtEdgeCount: number
  bodyEdgeCount: number
  hasBodyEdges: boolean
  /**
   * Size of `decls.jsonl` in bytes, as the exporter wrote it.
   *
   * Optional because indices exported before it was recorded do not have it;
   * `fetchIndexParts` falls back to the `content-length` header, which is only
   * the same number when the file is not served compressed.
   */
  declBytes?: number
  hasCode?: boolean
  hasHashes?: boolean
  /** Which hasher produced the declaration hashes; certificates must match it. */
  hasher?: string
  codeShardSize?: number
  /** The declaration to show when the address names none. */
  start?: string
  /** A page about each of the library's own declarations, `{name}` standing for its name. */
  declUrl?: string
  /** Where an index made from a LeanTrustBuilders dataset came from. */
  source?: {
    dataset?: string
    producer?: string
    library?: string
    /** Which notion the body edges are: `term` (trust's) or `meaning`. */
    body?: string
    upstreamClosure?: { follow: string; display: string } | null
    /** The library's own package: the declarations `declUrl` has a page for. */
    package?: string
  }
}