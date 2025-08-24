// src/app/types/storage.types.ts
export type FilterType = "all" | "images" | "folders";
export type SortBy = "name" | "size" | "modified";
export type SortOrder = "asc" | "desc";

export type ObjectItem = {
  key: string;
  isFolder: boolean;
  size?: number;
  contentType?: string;
  lastModified?: string;
  etag?: string;
  previewUrl?: string;
};

export type ListParams = {
  prefix?: string;
  cursor?: string;
  limit?: number;
};

export type MoveParams = {
  fromKey: string;
  toKey: string;
  overwrite?: boolean;
};

export interface StorageApi {
  list(
    params: ListParams
  ): import("rxjs").Observable<{ items: ObjectItem[]; cursor?: string }>;
  createFolder(prefix: string): import("rxjs").Observable<void>;
  rename(oldKey: string, newKey: string): import("rxjs").Observable<void>;
  move(params: MoveParams): import("rxjs").Observable<void>;
  delete(keys: string[]): import("rxjs").Observable<void>;
  upload(
    key: string,
    file: File,
    contentType?: string
  ): import("rxjs").Observable<ObjectItem>;
  head(key: string): import("rxjs").Observable<ObjectItem | null>;
  getPublicUrl(key: string): string;
}
