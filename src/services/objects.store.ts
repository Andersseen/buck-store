// src/app/data/objects.store.ts
import {
  computed,
  inject,
  Injectable,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ConfigStore } from "./config.store";
import { R2StorageApi } from "./r2-storage.api";
import { catchError, finalize, of } from "rxjs";
import {
  FilterType,
  ListParams,
  ObjectItem,
  SortBy,
  SortOrder,
  StorageApi,
} from "./storage.types";

@Injectable({ providedIn: "root" })
export class ObjectsStore {
  private api: StorageApi = inject(R2StorageApi);
  private configStore = inject(ConfigStore);
  private destroyRef = inject(DestroyRef);

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
  readonly currentPrefix = this._currentPrefix.asReadonly();
  readonly items = this._items.asReadonly();
  readonly selectedKeys = this._selectedKeys.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly cursor = this._cursor.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly filterType = this._filterType.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();

  // Computed
  readonly selectedCount = computed(() => this._selectedKeys().size);
  readonly viewMode = computed(() => this.configStore.config().viewMode);
  readonly breadcrumbs = computed(() => {
    const prefix = this._currentPrefix();
    if (!prefix) return [];
    const parts = prefix.split("/").filter((p) => p);
    return parts.map((part, index) => ({
      name: part,
      prefix: parts.slice(0, index + 1).join("/") + "/",
    }));
  });

  readonly filteredItems = computed(() => {
    let items = this._items();
    const query = this._searchQuery().toLowerCase();
    const filter = this._filterType();

    if (query) {
      items = items.filter((item) => item.key.toLowerCase().includes(query));
    }

    if (filter === "images") {
      items = items.filter(
        (item) => item.isFolder || item.contentType?.startsWith("image/")
      );
    } else if (filter === "folders") {
      items = items.filter((item) => item.isFolder);
    }

    const sortBy = this._sortBy();
    const sortOrder = this._sortOrder();

    return [...items].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let cmp = 0;
      switch (sortBy) {
        case "name":
          cmp = a.key.localeCompare(b.key);
          break;
        case "size":
          cmp = (a.size ?? 0) - (b.size ?? 0);
          break;
        case "modified":
          cmp =
            new Date(a.lastModified ?? 0).getTime() -
            new Date(b.lastModified ?? 0).getTime();
          break;
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });
  });

  // ===== Actions (sin Promises) =====
  loadItems(prefix: string = "", reset = true): void {
    if (reset) {
      this._items.set([]);
      this._cursor.set(undefined);
      this._selectedKeys.set(new Set());
    }

    this._currentPrefix.set(prefix);
    this._loading.set(true);
    this._error.set(null);

    const params: ListParams = {
      prefix,
      cursor: this._cursor(),
      limit: this.configStore.config().pageSize,
    };

    this.api
      .list(params)
      .pipe(
        catchError((e) => {
          this._error.set(e?.message ?? "Failed to load items");
          return of<{ items: ObjectItem[]; cursor?: string }>({
            items: [],
            cursor: undefined,
          });
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        if (reset) {
          this._items.set(result.items);
        } else {
          this._items.update((curr) => [...curr, ...result.items]);
        }
        this._cursor.set(result.cursor);
        this._hasMore.set(!!result.cursor);
      });
  }

  loadMore(): void {
    if (!this._hasMore() || this._loading()) return;
    this.loadItems(this._currentPrefix(), false);
  }

  createFolder(name: string): void {
    const prefix = this._currentPrefix();
    const folderKey = prefix + name + "/";

    this._loading.set(true);
    this._error.set(null);

    this.api
      .createFolder(folderKey)
      .pipe(
        catchError((e) => {
          this._error.set(e?.message ?? "Failed to create folder");
          return of(void 0);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadItems(prefix));
  }

  renameItem(oldKey: string, newName: string): void {
    const prefix = this._currentPrefix();
    const newKey = prefix + newName + (oldKey.endsWith("/") ? "/" : "");

    this._loading.set(true);
    this._error.set(null);

    this.api
      .rename(oldKey, newKey)
      .pipe(
        catchError((e) => {
          this._error.set(e?.message ?? "Failed to rename");
          return of(void 0);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadItems(prefix));
  }

  moveItems(keys: string[], targetPrefix: string): void {
    if (!keys.length) return;

    this._loading.set(true);
    this._error.set(null);

    // mueve de uno en uno manteniendo nombre
    const ops = keys.map((key) => {
      const fileName = key.split("/").pop() || "";
      const toKey = targetPrefix.endsWith("/")
        ? `${targetPrefix}${fileName}`
        : `${targetPrefix}/${fileName}`;
      return this.api.move({ fromKey: key, toKey });
    });

    import("rxjs").then(({ forkJoin, of }) => {
      forkJoin(ops)
        .pipe(
          catchError((e) => {
            this._error.set(e?.message ?? "Failed to move items");
            return of(void 0);
          }),
          finalize(() => this._loading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => this.loadItems(this._currentPrefix()));
    });
  }

  deleteItems(keys: string[]): void {
    if (!keys.length) return;

    this._loading.set(true);
    this._error.set(null);

    this.api
      .delete(keys)
      .pipe(
        catchError((e) => {
          this._error.set(e?.message ?? "Failed to delete");
          return of(void 0);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this._selectedKeys.set(new Set());
        this.loadItems(this._currentPrefix());
      });
  }

  uploadFile(file: File, fileName?: string): void {
    const prefix = this._currentPrefix();
    const key = prefix + (fileName || file.name);

    this._loading.set(true);
    this._error.set(null);

    this.api
      .upload(key, file)
      .pipe(
        catchError((e) => {
          this._error.set(e?.message ?? "Failed to upload");
          return of(null);
        }),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (!res) return;
        this.loadItems(prefix);
      });
  }

  // Selection
  toggleSelection(key: string): void {
    this._selectedKeys.update((current) => {
      const ns = new Set(current);
      ns.has(key) ? ns.delete(key) : ns.add(key);
      return ns;
    });
  }
  selectAll(): void {
    const allKeys = this.filteredItems().map((i) => i.key);
    this._selectedKeys.set(new Set(allKeys));
  }
  clearSelection(): void {
    this._selectedKeys.set(new Set());
  }
  selectRange(fromKey: string, toKey: string): void {
    const items = this.filteredItems();
    const a = items.findIndex((i) => i.key === fromKey);
    const b = items.findIndex((i) => i.key === toKey);
    if (a < 0 || b < 0) return;
    const [start, end] = [Math.min(a, b), Math.max(a, b)];
    const range = items.slice(start, end + 1).map((i) => i.key);
    this._selectedKeys.update((curr) => {
      const ns = new Set(curr);
      range.forEach((k) => ns.add(k));
      return ns;
    });
  }

  // Filters & sort
  setSearchQuery(q: string): void {
    this._searchQuery.set(q);
  }
  setFilterType(t: FilterType): void {
    this._filterType.set(t);
  }
  setSorting(by: SortBy, order: SortOrder): void {
    this._sortBy.set(by);
    this._sortOrder.set(order);
  }
}
