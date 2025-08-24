import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, of } from "rxjs";
import { ObjectsStore } from "@shared/services/objects.store";
import { R2StorageApi } from "@shared/services/r2-storage.api";
import { ObjectItem } from "@shared/types/storage.types";
import { FolderNode } from "./types";
import { FolderTreeComponent } from "./folder-tree";

@Component({
  selector: "app-sidebar",
  imports: [FolderTreeComponent],
  template: `
    <aside
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
             transition-all duration-300 flex flex-col"
      [class.w-64]="!isCollapsed()"
      [class.w-16]="isCollapsed()"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        @if (!isCollapsed()) {
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Folders
        </h2>
        } @else {
        <button
          (click)="toggleCollapsed.emit(false)"
          class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700
                   dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100
                   dark:hover:bg-gray-700"
          title="Expand sidebar"
        >
          📁
        </button>
        }
      </div>

      <!-- Tree -->
      <div class="flex-1 overflow-y-auto">
        @if (!isCollapsed()) {
        <div class="p-2">
          <!-- Root button -->
          <button
            (click)="selectPrefix('')"
            class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 
                     dark:hover:bg-gray-700 flex items-center space-x-2"
            [class.bg-blue-50]="currentPrefix() === ''"
            [class.text-blue-600]="currentPrefix() === ''"
            [class.dark:text-blue-400]="currentPrefix() === ''"
          >
            <span>🏠</span>
            <span>Root</span>
          </button>

          <!-- Folder tree -->
          <app-folder-tree
            [nodes]="rootNodes()"
            [currentPrefix]="currentPrefix()"
            (toggle)="onToggle($event)"
            (select)="selectPrefix($event)"
          />
        </div>
        }
      </div>
    </aside>
  `,
})
export default class Sidebar implements OnInit {
  // Inputs/Outputs
  isCollapsed = input(false);
  toggleCollapsed = output<boolean>();
  prefixSelected = output<string>();

  // Injected services
  private readonly objectsStore = inject(ObjectsStore);
  private readonly storageApi = inject(R2StorageApi);
  private readonly destroyRef = inject(DestroyRef);

  // Global state (from store)
  protected currentPrefix = this.objectsStore.currentPrefix;

  // Local state (tree)
  protected rootNodes = signal<FolderNode[]>([]);

  // -- Lifecycle -------------------------------------------------------------

  ngOnInit(): void {
    this.loadRoot(); // lazy load: only root level
  }

  // -- Public API (called from child) ---------------------------------------

  /** Select a prefix and refresh the main content via store. */
  selectPrefix(prefix: string): void {
    this.prefixSelected.emit(prefix);
    this.objectsStore.loadItems(prefix, true);
  }

  /** Toggle a node (expand/collapse); lazy-load children on first expand. */
  onToggle(node: FolderNode): void {
    node.isExpanded = !node.isExpanded;
    if (node.isExpanded && node.children.length === 0) {
      this.loadChildren(node);
    } else {
      // Re-emit tree to trigger view update
      this.rootNodes.update((list) => [...list]);
    }
  }

  // -- Data loading ----------------------------------------------------------

  /** Load level-0 folders (prefix = '') */
  private loadRoot(): void {
    this.storageApi
      .list({ prefix: "", limit: 1000 })
      .pipe(
        catchError(() => of({ items: [], cursor: undefined })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ items }) => {
        const folders = items.filter((i) => i.isFolder);
        const roots = this.toNodes(folders, 0);
        // Assume they can have children (will be confirmed on expand)
        roots.forEach((n) => (n.hasChildren = true));
        this.rootNodes.set(roots);
      });
  }

  /** Load child folders for a given node (prefix = node.prefix) */
  private loadChildren(node: FolderNode): void {
    this.storageApi
      .list({ prefix: node.prefix, limit: 1000 })
      .pipe(
        catchError(() => of({ items: [], cursor: undefined })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ items }) => {
        const folders = items.filter((i) => i.isFolder);
        node.children = this.toNodes(folders, node.level + 1);
        node.hasChildren = node.children.length > 0;
        this.rootNodes.update((list) => [...list]);
      });
  }

  /** Map ObjectItem folders to FolderNode view model. */
  private toNodes(folders: ObjectItem[], level: number): FolderNode[] {
    return folders
      .map((f) => {
        const parts = f.key.split("/").filter(Boolean);
        const name = parts[parts.length - 1] ?? "";
        return <FolderNode>{
          prefix: f.key, // should end with '/'
          name,
          level,
          isExpanded: false,
          hasChildren: true, // optimistic; adjusted after children load
          children: [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
