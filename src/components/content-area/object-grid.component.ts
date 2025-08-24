import { Component, input, output, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ObjectItem } from "@shared/types/storage.types";
import {
  formatFileSize,
  formatDate,
  isImageFile,
} from "@shared/utils/file.utils";

@Component({
  selector: "app-object-grid",
  template: `
    <div
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
    >
      @for (item of items(); track item.key) {
      <div
        class="group relative bg-white dark:bg-gray-800 rounded-lg border-2 
                 border-gray-200 dark:border-gray-700 p-3 cursor-pointer transition-all
                 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md"
        [class.border-blue-500]="selectedKeys().has(item.key)"
        [class.bg-blue-50]="selectedKeys().has(item.key)"
        (click)="onItemClick(item, $event)"
        (dblclick)="onItemDoubleClick(item)"
        (contextmenu)="onContextMenu(item, $event)"
      >
        <!-- Selection checkbox -->
        <div
          class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 
                      transition-opacity z-10"
          [class.opacity-100]="selectedKeys().has(item.key)"
        >
          <div
            class="w-5 h-5 rounded bg-white dark:bg-gray-700 border-2 
                        border-gray-300 dark:border-gray-600 flex items-center justify-center"
            [class.bg-blue-500]="selectedKeys().has(item.key)"
            [class.border-blue-500]="selectedKeys().has(item.key)"
          >
            @if (selectedKeys().has(item.key)) {
            <span class="text-white text-xs">✓</span>
            }
          </div>
        </div>

        <!-- Thumbnail/Icon -->
        <div
          class="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 
                      flex items-center justify-center"
        >
          @if (item.isFolder) {
          <div class="text-4xl">📁</div>
          } @else if (item.contentType && isImageFile(item.contentType)) {
          <img
            [src]="
              item.previewUrl || 'https://via.placeholder.com/150?text=Image'
            "
            [alt]="getItemName(item.key)"
            class="w-full h-full object-cover"
            loading="lazy"
            (error)="onImageError($event)"
          />
          } @else {
          <div class="text-3xl">📄</div>
          }
        </div>

        <!-- Item info -->
        <div class="space-y-1">
          <div
            class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
            [title]="getItemName(item.key)"
          >
            {{ getItemName(item.key) }}
          </div>

          @if (!item.isFolder && item.size) {
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatFileSize(item.size) }}
          </div>
          } @if (item.lastModified) {
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(item.lastModified) }}
          </div>
          }
        </div>

        <!-- Action buttons (on hover) -->
        <div
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                      transition-opacity flex space-x-1"
        >
          @if (!item.isFolder) {
          <button
            (click)="onCopyUrl(item, $event)"
            class="w-6 h-6 bg-white dark:bg-gray-700 rounded border 
                       border-gray-300 dark:border-gray-600 flex items-center justify-center
                       hover:bg-gray-50 dark:hover:bg-gray-600 text-xs"
            title="Copy public URL"
          >
            🔗
          </button>
          }

          <button
            (click)="onDelete(item, $event)"
            class="w-6 h-6 bg-white dark:bg-gray-700 rounded border 
                     border-gray-300 dark:border-gray-600 flex items-center justify-center
                     hover:bg-red-50 dark:hover:bg-red-900/20 text-xs text-red-600"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
      }
    </div>
  `,
  imports: [CommonModule],
})
export class ObjectGridComponent {
  items = input.required<ObjectItem[]>();
  selectedKeys = input.required<Set<string>>();

  selectionChange = output<{
    key: string;
    selected: boolean;
    isRange?: boolean;
  }>();
  itemAction = output<{
    type: "navigate" | "rename" | "delete" | "copy-url";
    item: ObjectItem;
  }>();

  protected formatFileSize = formatFileSize;
  protected formatDate = formatDate;
  protected isImageFile = isImageFile;

  protected getItemName(key: string): string {
    const parts = key.split("/").filter((p) => p);
    return parts[parts.length - 1] || key;
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

  protected onContextMenu(item: ObjectItem, event: MouseEvent): void {
    event.preventDefault();
    // TODO: Show context menu
  }

  protected onCopyUrl(item: ObjectItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemAction.emit({ type: "copy-url", item });
  }

  protected onDelete(item: ObjectItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemAction.emit({ type: "delete", item });
  }

  protected onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==";
  }
}
