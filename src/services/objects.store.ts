import { computed, inject, Injectable, signal } from "@angular/core";
import {
  FilterType,
  ListParams,
  ObjectItem,
  SortBy,
  SortOrder,
} from "../types/storage.types";
import { ConfigStore } from "./config.store";
import { MockStorageApi } from "./mock-storage.api";

@Injectable({ providedIn: "root" })
export class ObjectsStore {
  private mockApi = inject(MockStorageApi);
  private configStore = inject(ConfigStore);

  private _currentPrefix = signal<string>("");
  private _items = signal<ObjectItem[]>([]);
  private _selectedKeys = signal<Set<string>>(new Set());
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _cursor = signal<string | undefined>(undefined);
  private _hasMore = signal<boolean>(false);
  private _searchQuery = signal<string>("");
  private _filterType = signal<FilterType>("all");
  private _sortBy = signal<SortBy>("name");
  private _sortOrder = signal<SortOrder>("asc");

  // Read-only signals
  public readonly currentPrefix = this._currentPrefix.asReadonly();
  public readonly items = this._items.asReadonly();
  public readonly selectedKeys = this._selectedKeys.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly cursor = this._cursor.asReadonly();
  public readonly hasMore = this._hasMore.asReadonly();
  public readonly searchQuery = this._searchQuery.asReadonly();
  public readonly filterType = this._filterType.asReadonly();
  public readonly sortBy = this._sortBy.asReadonly();
  public readonly sortOrder = this._sortOrder.asReadonly();

  // Computed values
  public readonly selectedCount = computed(() => this._selectedKeys().size);
  public readonly viewMode = computed(() => this.configStore.config().viewMode);
  public readonly breadcrumbs = computed(() => {
    const prefix = this._currentPrefix();
    if (!prefix) return [];

    const parts = prefix.split("/").filter((p) => p);
    return parts.map((part, index) => ({
      name: part,
      prefix: parts.slice(0, index + 1).join("/") + "/",
    }));
  });

  public readonly filteredItems = computed(() => {
    let items = this._items();
    const query = this._searchQuery().toLowerCase();
    const filter = this._filterType();

    // Apply search filter
    if (query) {
      items = items.filter((item) => item.key.toLowerCase().includes(query));
    }

    // Apply type filter
    if (filter === "images") {
      items = items.filter(
        (item) =>
          item.isFolder ||
          (item.contentType && item.contentType.startsWith("image/"))
      );
    } else if (filter === "folders") {
      items = items.filter((item) => item.isFolder);
    }

    // Apply sorting
    const sortBy = this._sortBy();
    const sortOrder = this._sortOrder();

    return items.sort((a, b) => {
      // Always put folders first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.key.localeCompare(b.key);
          break;
        case "size":
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case "modified":
          const aTime = new Date(a.lastModified || 0).getTime();
          const bTime = new Date(b.lastModified || 0).getTime();
          comparison = aTime - bTime;
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });
  });

  async loadItems(prefix: string = "", reset: boolean = true): Promise<void> {
    if (reset) {
      this._items.set([]);
      this._cursor.set(undefined);
      this._selectedKeys.set(new Set());
    }

    this._currentPrefix.set(prefix);
    this._loading.set(true);
    this._error.set(null);

    try {
      const params: ListParams = {
        prefix,
        cursor: this._cursor(),
        limit: this.configStore.config().pageSize,
      };

      const result = await this.mockApi.list(params);

      if (reset) {
        this._items.set(result.items);
      } else {
        this._items.update((current) => [...current, ...result.items]);
      }

      this._cursor.set(result.cursor);
      this._hasMore.set(!!result.cursor);
    } catch (error) {
      this._error.set(
        error instanceof Error ? error.message : "Failed to load items"
      );
    } finally {
      this._loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (!this._hasMore() || this._loading()) return;
    await this.loadItems(this._currentPrefix(), false);
  }

  async createFolder(name: string): Promise<void> {
    const prefix = this._currentPrefix();
    const folderKey = prefix + name + "/";

    try {
      await this.mockApi.createFolder(folderKey);
      await this.loadItems(prefix); // Refresh
    } catch (error) {
      throw error;
    }
  }

  async renameItem(oldKey: string, newName: string): Promise<void> {
    const prefix = this._currentPrefix();
    const newKey = prefix + newName + (oldKey.endsWith("/") ? "/" : "");

    try {
      await this.mockApi.rename(oldKey, newKey);
      await this.loadItems(prefix); // Refresh
    } catch (error) {
      throw error;
    }
  }

  async moveItems(keys: string[], targetPrefix: string): Promise<void> {
    try {
      for (const key of keys) {
        const fileName = key.split("/").pop() || "";
        const newKey = targetPrefix + fileName;
        await this.mockApi.move({ fromKey: key, toKey: newKey });
      }
      await this.loadItems(this._currentPrefix()); // Refresh
    } catch (error) {
      throw error;
    }
  }

  async deleteItems(keys: string[]): Promise<void> {
    try {
      await this.mockApi.delete(keys);
      this._selectedKeys.set(new Set());
      await this.loadItems(this._currentPrefix()); // Refresh
    } catch (error) {
      throw error;
    }
  }

  async uploadFile(file: File, fileName?: string): Promise<ObjectItem> {
    const prefix = this._currentPrefix();
    const key = prefix + (fileName || file.name);

    try {
      const result = await this.mockApi.upload(key, file);
      await this.loadItems(prefix); // Refresh
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Selection methods
  toggleSelection(key: string): void {
    this._selectedKeys.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  selectAll(): void {
    const allKeys = this.filteredItems().map((item) => item.key);
    this._selectedKeys.set(new Set(allKeys));
  }

  clearSelection(): void {
    this._selectedKeys.set(new Set());
  }

  selectRange(fromKey: string, toKey: string): void {
    const items = this.filteredItems();
    const fromIndex = items.findIndex((item) => item.key === fromKey);
    const toIndex = items.findIndex((item) => item.key === toKey);

    if (fromIndex >= 0 && toIndex >= 0) {
      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      const rangeKeys = items.slice(start, end + 1).map((item) => item.key);

      this._selectedKeys.update((current) => {
        const newSet = new Set(current);
        rangeKeys.forEach((key) => newSet.add(key));
        return newSet;
      });
    }
  }

  // Filter and sort methods
  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setFilterType(type: FilterType): void {
    this._filterType.set(type);
  }

  setSorting(sortBy: SortBy, sortOrder: SortOrder): void {
    this._sortBy.set(sortBy);
    this._sortOrder.set(sortOrder);
  }
}
