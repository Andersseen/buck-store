// Shared types for the sidebar tree

export interface FolderNode {
  prefix: string; // e.g. "projects/demo/"
  name: string; // e.g. "demo"
  isExpanded: boolean; // UI state
  hasChildren: boolean; // true if folder may contain subfolders
  level: number; // indentation level
  children: FolderNode[]; // populated lazily
}
