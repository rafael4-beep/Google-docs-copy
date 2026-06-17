// Shared domain types used across the persistence layer, API routes and UI.
// (Named `DocumentRecord` rather than `Document` to avoid clashing with the DOM
// `Document` global.)

export type Role = "viewer" | "editor";

/** Effective access a user has on a document. `null` means no access. */
export type AccessLevel = "owner" | Role | null;

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  content: string; // HTML produced by the editor
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  documentId: string;
  userId: string;
  role: Role;
  createdAt: string;
}

export interface Database {
  users: User[];
  documents: DocumentRecord[];
  shares: Share[];
}

/** A document as shown on the dashboard cards. */
export interface DocumentSummary {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  access: AccessLevel;
  excerpt: string;
  sharedCount: number;
  createdAt: string;
  updatedAt: string;
}

/** A collaborator entry on a document. */
export interface ShareView {
  userId: string;
  name?: string;
  email?: string;
  role: Role;
}

/** Full document returned to a user who has access. */
export interface DocumentView {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  ownerName: string;
  access: "owner" | Role;
  shares: ShareView[];
  createdAt: string;
  updatedAt: string;
}

/** Returned when the document exists but the user has no access. */
export interface NoAccessView {
  id: string;
  access: null;
}

export type DocumentResult = DocumentView | NoAccessView | null;

// Error codes surfaced by the repository layer.
export type UpdateError =
  | "not_found"
  | "forbidden"
  | "invalid_title"
  | "title_too_long"
  | "content_too_large";

export type ShareError =
  | "not_found"
  | "forbidden"
  | "user_not_found"
  | "cannot_share_with_owner";

export type DeleteError = "not_found" | "forbidden";
