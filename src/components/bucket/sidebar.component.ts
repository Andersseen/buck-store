import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ObjectsStore } from "@shared/services/objects.store";
import { R2StorageApi } from "@shared/services/r2-storage.api";
import { ObjectItem } from "@shared/types/storage.types";
import { catchError, of } from "rxjs";

interface FolderNode {
  prefix: string;
  name: string;
  isExpanded: boolean;
  children: FolderNode[];
  hasChildren: boolean;
  level: number;
}

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [],
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

      <!-- Folder tree -->
      <div class="flex-1 overflow-y-auto">
        @if (!isCollapsed()) {
        <div class="p-2">
          <!-- Root -->
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

          <!-- Level 0 -->
          @for (node of folderTree(); track node.prefix) {
          <div>
            <button
              (click)="toggleFolder(node)"
              class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 
                         dark:hover:bg-gray-700 flex items-center space-x-2"
              [style.padding-left]="12 + node.level * 16 + 'px'"
              [class.bg-blue-50]="currentPrefix() === node.prefix"
              [class.text-blue-600]="currentPrefix() === node.prefix"
              [class.dark:text-blue-400]="currentPrefix() === node.prefix"
            >
              @if (node.hasChildren) {
              <span class="text-xs">{{ node.isExpanded ? "▼" : "▶" }}</span>
              } @else {
              <span class="text-xs opacity-0">▶</span>
              }
              <span>📁</span>
              <span>{{ node.name }}</span>
            </button>

            <!-- Children (render perezoso) -->
            @if (node.isExpanded) { @for (child of node.children; track
            child.prefix) {
            <button
              (click)="toggleFolder(child)"
              class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 
                             dark:hover:bg-gray-700 flex items-center space-x-2"
              [style.padding-left]="12 + child.level * 16 + 'px'"
              [class.bg-blue-50]="currentPrefix() === child.prefix"
              [class.text-blue-600]="currentPrefix() === child.prefix"
              [class.dark:text-blue-400]="currentPrefix() === child.prefix"
            >
              @if (child.hasChildren) {
              <span class="text-xs">{{ child.isExpanded ? "▼" : "▶" }}</span>
              } @else {
              <span class="text-xs opacity-0">▶</span>
              }
              <span>📁</span>
              <span>{{ child.name }}</span>
            </button>
            } }
          </div>
          }
        </div>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit {
  private readonly objectsStore = inject(ObjectsStore);
  private readonly storageApi = inject(R2StorageApi);
  private readonly destroyRef = inject(DestroyRef);

  // inputs/outputs (Angular moderno)
  isCollapsed = input<boolean>(false);
  toggleCollapsed = output<boolean>();
  prefixSelected = output<string>();

  // estado de navegación actual (del store)
  protected currentPrefix = this.objectsStore.currentPrefix;

  // árbol raíz (solo primer nivel; hijos se cargan al expandir)
  protected folderTree = signal<FolderNode[]>([]);

  ngOnInit(): void {
    this.loadRootFolders();
  }

  /** Seleccionar un prefijo y notificar al padre */
  protected selectPrefix(prefix: string): void {
    this.prefixSelected.emit(prefix);
    // Opcional: navegar cargando el contenido en el store
    this.objectsStore.loadItems(prefix, true);
  }

  /** Expand/colapsa un nodo. Si se expande por primera vez, carga hijos desde la API */
  protected toggleFolder(node: FolderNode): void {
    // al click, seleccionamos (navegación)
    this.selectPrefix(node.prefix);

    // si puede tener hijos, alternamos estado y cargamos si es necesario
    node.isExpanded = !node.isExpanded;

    if (node.isExpanded && node.children.length === 0) {
      this.loadChildren(node);
    } else {
      // fuerza actualización del signal (copia superficial)
      this.folderTree.update((t) => [...t]);
    }
  }

  // =========================
  // Cargas desde la API (Observables)
  // =========================

  /** Carga el primer nivel de carpetas (prefijo '') */
  private loadRootFolders(): void {
    this.storageApi
      .list({ prefix: "", limit: 1000 })
      .pipe(
        catchError(() => of({ items: [], cursor: undefined })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ items }) => {
        const folders = items.filter((i) => i.isFolder);
        const roots = this.toNodes(folders, 0 /*level*/);
        // Para UX, podemos marcar hasChildren=true y que se confirme al expandir
        roots.forEach((n) => (n.hasChildren = true));
        this.folderTree.set(roots);
      });
  }

  /** Carga hijos directos de un nodo (prefijo = node.prefix) */
  private loadChildren(node: FolderNode): void {
    this.storageApi
      .list({ prefix: node.prefix, limit: 1000 })
      .pipe(
        catchError(() => of({ items: [], cursor: undefined })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ items }) => {
        const folders = items.filter((i) => i.isFolder);
        const children = this.toNodes(folders, node.level + 1);
        // si no hay hijos, marca hasChildren = false
        node.children = children;
        node.hasChildren = children.length > 0;
        this.folderTree.update((t) => [...t]);
      });
  }

  /** Convierte objetos de tipo carpeta a nodos del árbol */
  private toNodes(folders: ObjectItem[], level: number): FolderNode[] {
    return folders
      .map((f) => {
        const parts = f.key.split("/").filter((p) => p);
        const name = parts[parts.length - 1] ?? "";
        return <FolderNode>{
          prefix: f.key, // siempre termina en '/'
          name,
          isExpanded: level === 0 ? false : false, // root cerrado por defecto
          children: [],
          hasChildren: true, // asumimos que puede tener; se corrige al cargar
          level,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
