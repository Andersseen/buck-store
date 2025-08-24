import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from "@angular/core";
import { MockStorageApi } from "@shared//services/mock-storage.api";
import { ObjectsStore } from "@shared//services/objects.store";

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

          <!-- Folder tree -->
          @for (node of folderTree(); track $index) {
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
  imports: [],
})
export class SidebarComponent implements OnInit {
  private objectsStore = inject(ObjectsStore);
  private mockApi = inject(MockStorageApi);

  isCollapsed = input<boolean>(false);
  toggleCollapsed = output<boolean>();
  prefixSelected = output<string>();

  protected currentPrefix = this.objectsStore.currentPrefix;
  protected folderTree = signal<FolderNode[]>([]);

  ngOnInit(): void {
    this.loadFolderTree();
  }

  protected selectPrefix(prefix: string): void {
    this.prefixSelected.emit(prefix);
  }

  protected async toggleFolder(node: FolderNode): Promise<void> {
    // First select the prefix
    this.selectPrefix(node.prefix);

    // Then handle expansion
    if (node.hasChildren) {
      node.isExpanded = !node.isExpanded;

      if (node.isExpanded && node.children.length === 0) {
        await this.loadChildren(node);
      }

      this.folderTree.update((tree) => [...tree]);
    }
  }

  private async loadFolderTree(): Promise<void> {
    try {
      const result = await this.mockApi.list({ prefix: "", limit: 1000 });
      console.log(result);

      const folders = result.items.filter((item) => item.isFolder);
      console.log(folders);

      // Build tree structure
      const tree = this.buildTree(folders);
      console.log(tree);
      console.log(folders);

      this.folderTree.set(tree);
    } catch (error) {
      console.error("Failed to load folder tree:", error);
    }
  }

  private buildTree(
    folders: Array<{ key: string; isFolder: boolean }>
  ): FolderNode[] {
    const rootNodes: FolderNode[] = [];
    const nodeMap = new Map<string, FolderNode>();

    // Sort folders by depth and name
    const sortedFolders = folders.sort((a, b) => {
      const depthA = a.key.split("/").filter((p) => p).length;
      const depthB = b.key.split("/").filter((p) => p).length;
      if (depthA !== depthB) return depthA - depthB;
      return a.key.localeCompare(b.key);
    });

    for (const folder of sortedFolders) {
      const parts = folder.key.split("/").filter((p) => p);
      const level = parts.length - 1;
      const name = parts[parts.length - 1];

      const node: FolderNode = {
        prefix: folder.key,
        name,
        isExpanded: level === 0, // Expand root level by default
        children: [],
        hasChildren: false,
        level,
      };

      nodeMap.set(folder.key, node);

      if (level === 0) {
        rootNodes.push(node);
      } else {
        // Find parent
        const parentPrefix = parts.slice(0, -1).join("/") + "/";
        const parent = nodeMap.get(parentPrefix);
        if (parent) {
          parent.children.push(node);
          parent.hasChildren = true;
        }
      }
    }

    return rootNodes;
  }

  private async loadChildren(node: FolderNode): Promise<void> {
    try {
      const result = await this.mockApi.list({
        prefix: node.prefix,
        limit: 1000,
      });
      const childFolders = result.items.filter((item) => item.isFolder);

      // Convert to nodes
      node.children = childFolders.map((folder) => {
        const parts = folder.key.split("/").filter((p) => p);
        return {
          prefix: folder.key,
          name: parts[parts.length - 1],
          isExpanded: false,
          children: [],
          hasChildren: true, // Assume folders have children until proven otherwise
          level: node.level + 1,
        };
      });
    } catch (error) {
      console.error("Failed to load folder children:", error);
    }
  }
}
