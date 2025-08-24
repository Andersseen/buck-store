export interface ObjectItem {
  key: string;
  isFolder: boolean;
  size?: number;
  contentType?: string;
  lastModified?: string; // ISO string
  previewUrl?: string;   // computed from getPublicUrl(key)
}

export interface ListParams {
  prefix?: string;
  cursor?: string;
  limit?: number;
}

export interface MoveParams {
  fromKey: string;
  toKey: string;
  overwrite?: boolean;
}

export interface StorageApi {
  list(params: ListParams): Promise<{ items: ObjectItem[]; cursor?: string }>;
  createFolder(prefix: string): Promise<void>;
  rename(oldKey: string, newKey: string): Promise<void>;
  move(params: MoveParams): Promise<void>;
  delete(keys: string[]): Promise<void>;
  upload(key: string, file: File, contentType?: string): Promise<ObjectItem>;
  head?(key: string): Promise<ObjectItem | null>;
  getPublicUrl(key: string): string;
}

export interface UploadProgress {
  key: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FolderTreeNode {
  prefix: string;
  name: string;
  isExpanded: boolean;
  children: FolderTreeNode[];
  hasChildren: boolean;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'size' | 'modified';
export type SortOrder = 'asc' | 'desc';
export type FilterType = 'all' | 'images' | 'folders';