import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ObjectItem } from "../../types/storage.types";
import {
  formatFileSize,
  formatDate,
  isImageFile,
} from "../../utils/file.utils";

@Component({
  selector: "app-object-list",
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <!-- Header -->
      <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 
                  dark:border-gray-600 rounded-t-lg">
        <div class="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
          <div class="col-span-1"></div> <!-- Checkbox -->
          <div class="col-span-1"></div> <!-- Icon -->
          <div class="col-span-4">Name</div>
          <div class="col-span-2">Type</div>
          <div class="col-span-2">Size</div>
          <div class="col-span-2">Modified</div>
        </div>
      </div>

      <!-- Items -->
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        @for (item of items(); track item.key) {
          <div
            class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer
                   transition-colors group"
            [class.bg-blue-50]="selectedKeys().has(item.key)"
            [class.dark:bg-blue-900/20]="selectedKeys().has(item.key)"
            (click)="onItemClick(item, $event)"
            (dblclick)="onItemDoubleClick(item)"
          >
            <div class="grid grid-cols-12 gap-4 items-center">
              <!-- Checkbox -->
              <div class="col-span-1">
                <div class="w-5 h-5 rounded bg-white dark:bg-gray-700 border-2 
                            border-gray-300 dark:border-gray-600 flex items-center justify-center
                            group-hover:border-blue-300"
                     [class.bg-blue-500]="selectedKeys().has(item.key)"
                     [class.border-blue-500]="selectedKeys().has(item.key)">
                  @if (selectedKeys().has(item.key)) {
                    <span class="text-white text-xs">✓</span>
                  }
                </div>
              </div>

              <!-- Icon -->
              <div class="col-span-1">
                @if (item.isFolder) {
                  <div class="text-xl">📁</div>
                } @else if (item.contentType && isImageFile(item.contentType)) {
                  <img 
                    [src]="item.previewUrl || 'https://via.placeholder.com/32?text=Img'"
                    [alt]="getItemName(item.key)"
                    class="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-600"
                    loading="lazy"
                    (error)="onImageError($event)"
                  />
                } @else {
                  <div class="text-xl">📄</div>
                }
              </div>

              <!-- Name -->
              <div class="col-span-4">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
                     [title]="getItemName(item.key)">
                  {{ getItemName(item.key) }}
                </div>
                @if (item.isFolder) {
                  <div class="text-xs text-gray-500 dark:text-gray-400">Folder</div>
                }
              </div>

              <!-- Type -->
              <div class="col-span-2">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  @if (item.isFolder) {
                    Folder
                  } @else if (item.contentType) {
                    {{ getFileType(item.contentType) }}
                  } @else {
                    Unknown
                  }
                </div>
              </div>

              <!-- Size -->
              <div class="col-span-2">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  @if (item.size) {
                    {{ formatFileSize(item.size) }}
                  } @else {
                    —
                  }
                </div>
              </div>

              <!-- Modified -->
              <div class="col-span-2 flex items-center justify-between">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  @if (item.lastModified) {
                    {{ formatDate(item.lastModified) }}
                  } @else {
                    —
                  }
                </div>

                <!-- Actions -->
                <div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  @if (!item.isFolder) {
                    <button
                      (click)="onCopyUrl(item, $event)"
                      class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs"
                      title="Copy public URL"
                    >
                      🔗
                    </button>
                  }
                  
                  <button
                    (click)="onRename(item, $event)"
                    class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs"
                    title="Rename"
                  >
                    ✏️
                  </button>
                  
                  <button
                    (click)="onDelete(item, $event)"
                    class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-xs text-red-600"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  imports: [CommonModule],
})
export class ObjectListComponent {
  items = input.required<ObjectItem[]>();
  selectedKeys = input.required<Set<string>>();

  selectionChange = output<{
    key: string;
    selected: boolean;
    isRange?: boolean;
  }>();
  itemAction = output<{ type: string; item: ObjectItem }>();

  protected formatFileSize = formatFileSize;
  protected formatDate = formatDate;
  protected isImageFile = isImageFile;

  protected getItemName(key: string): string {
    const parts = key.split("/").filter((p) => p);
    return parts[parts.length - 1] || key;
  }

  protected getFileType(contentType: string): string {
    if (contentType.startsWith("image/")) return "Image";
    if (contentType.startsWith("video/")) return "Video";
    if (contentType.startsWith("audio/")) return "Audio";
    if (contentType === "application/pdf") return "PDF";
    if (contentType.includes("text/")) return "Text";
    return "File";
  }

  protected onItemClick(item: ObjectItem, event: MouseEvent): void {
    event.stopPropagation();

    const isRange = event.shiftKey;
    const selected = !this.selectedKeys().has(item.key);

    this.selectionChange.emit({ key: item.key, selected, isRange });
  }

  protected onItemDoubleClick(item: ObjectItem): void {
    if (item.isFolder) {
      this.itemAction.emit({ type: "navigate", item });
    }
  }

  protected onCopyUrl(item: ObjectItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemAction.emit({ type: "copy-url", item });
  }

  protected onRename(item: ObjectItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemAction.emit({ type: "rename", item });
  }

  protected onDelete(item: ObjectItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemAction.emit({ type: "delete", item });
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWc8L3RleHQ+PC9zdmc+";
  }
}
