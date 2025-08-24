import {
  Component,
  HostListener,
  effect,
  inject,
  output,
  signal,
} from "@angular/core";
import { ConfigStore } from "@shared//services/config.store";
import { ObjectsStore } from "@shared//services/objects.store";

import { ToastService } from "@components/ui/toast.service";
import { ObjectGridComponent } from "./object-grid.component";
import { ObjectListComponent } from "./object-list.component";
import { UploadDropzoneComponent } from "./upload-dropzone.component";

@Component({
  selector: "app-content-area",

  imports: [ObjectGridComponent, ObjectListComponent, UploadDropzoneComponent],
  template: `
    <div class="flex-1 flex flex-col relative">
      <!-- Drag and drop overlay -->
      <app-upload-dropzone
        class="absolute inset-0 z-10"
        [class.opacity-0]="!isDragOver()"
        [class.pointer-events-none]="!isDragOver()"
        (filesDropped)="onFilesDropped($event)"
      />

      <!-- Content -->
      <div
        class="flex-1 p-4 transition-opacity"
        [class.opacity-50]="isDragOver()"
        (dragover)="onDragOver($event)"
        (dragenter)="onDragEnter($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <!-- Loading state -->
        @if (loading() && filteredItems().length === 0) {
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"
            ></div>
            <p class="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
        }
        <!-- Error state -->
        @else if (error()) {
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              Failed to load
            </h3>
            <p class="mt-2 text-gray-600 dark:text-gray-400">{{ error() }}</p>
            <button
              (click)="retry()"
              class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        }
        <!-- Empty state -->
        @else if (filteredItems().length === 0) {
        <div class="flex items-center justify-center h-64">
          <div class="text-center">
            <div class="text-gray-400 text-6xl mb-4">📁</div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              No items found
            </h3>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              @if (searchQuery()) { No items match your search "{{
                searchQuery()
              }}" } @else { This folder is empty. Upload some files to get
              started. }
            </p>
            @if (!searchQuery()) {
            <button
              (click)="triggerUpload()"
              class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Upload Files
            </button>
            }
          </div>
        </div>
        }
        <!-- Content views -->
        @else { @if (viewMode() === 'grid') {
        <app-object-grid
          [items]="filteredItems()"
          [selectedKeys]="selectedKeys()"
          (selectionChange)="onSelectionChange($event)"
          (itemAction)="onItemAction($event)"
        />
        } @else {
        <app-object-list
          [items]="filteredItems()"
          [selectedKeys]="selectedKeys()"
          (selectionChange)="onSelectionChange($event)"
          (itemAction)="onItemAction($event)"
        />
        }

        <!-- Load more -->
        @if (hasMore() && !loading()) {
        <div class="mt-8 text-center">
          <button
            (click)="loadMore()"
            class="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                       text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            Load More
          </button>
        </div>
        } @if (loading() && filteredItems().length > 0) {
        <div class="mt-4 text-center">
          <div
            class="inline-flex items-center text-gray-600 dark:text-gray-400"
          >
            <div
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"
            ></div>
            Loading more...
          </div>
        </div>
        } }
      </div>
    </div>
  `,
})
export default class ContentArea {
  private readonly objectsStore = inject(ObjectsStore);
  private readonly configStore = inject(ConfigStore);
  private readonly toast = inject(ToastService);

  itemsSelected = output<string[]>();

  // signals desde el store
  protected loading = this.objectsStore.loading;
  protected error = this.objectsStore.error;
  protected filteredItems = this.objectsStore.filteredItems;
  protected selectedKeys = this.objectsStore.selectedKeys;
  protected hasMore = this.objectsStore.hasMore;
  protected searchQuery = this.objectsStore.searchQuery;
  protected viewMode = this.objectsStore.viewMode;

  protected isDragOver = signal(false);

  constructor() {
    // Efecto reactivo: si aparece error, toast
    effect(() => {
      const err = this.error();
      if (err) this.toast.error("Operation failed", err);
    });
  }

  // ---------- UI actions ----------

  protected onSelectionChange(selection: {
    key: string;
    selected: boolean;
    isRange?: boolean;
  }): void {
    if (selection.isRange && this.objectsStore.selectedKeys().size > 0) {
      const selectedArray = Array.from(this.objectsStore.selectedKeys());
      const lastSelected = selectedArray[selectedArray.length - 1];
      this.objectsStore.selectRange(lastSelected, selection.key);
    } else {
      this.objectsStore.toggleSelection(selection.key);
    }
    this.itemsSelected.emit(Array.from(this.objectsStore.selectedKeys()));
  }

  protected onItemAction(action: {
    type: "navigate" | "rename" | "delete" | "copy-url";
    item: any;
  }): void {
    switch (action.type) {
      case "navigate":
        if (action.item.isFolder) {
          this.objectsStore.loadItems(action.item.key, true); // navegar cargando ese prefijo
        }
        break;
      case "rename":
        this.showRenameDialog(action.item);
        break;
      case "delete":
        this.showDeleteDialog([action.item.key]);
        break;
      case "copy-url":
        this.copyPublicUrl(action.item.key);
        break;
    }
  }

  protected retry(): void {
    this.objectsStore.loadItems(this.objectsStore.currentPrefix(), true);
  }

  protected loadMore(): void {
    this.objectsStore.loadMore();
  }

  protected triggerUpload(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "*/*";
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) this.handleFileUploads(Array.from(files));
    };
    input.click();
  }

  // ---------- Drag & Drop ----------

  @HostListener("dragover", ["$event"])
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener("dragenter", ["$event"])
  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  @HostListener("dragleave", ["$event"])
  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (
      !event.relatedTarget ||
      !(event.currentTarget as Element).contains(event.relatedTarget as Node)
    ) {
      this.isDragOver.set(false);
    }
  }

  @HostListener("drop", ["$event"])
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) this.handleFileUploads(files);
  }

  protected onFilesDropped(files: File[]): void {
    this.handleFileUploads(files);
  }

  // ---------- Helpers ----------

  private handleFileUploads(files: File[]): void {
    // Subida optimista (el store maneja loading/error/refresh internamente)
    files.forEach((file) => {
      this.objectsStore.uploadFile(file);
      this.toast.success("Uploading…", `${file.name}`);
    });
  }

  private showRenameDialog(item: any): void {
    const oldName = item.key.split("/").pop();
    const newName = prompt("Enter new name:", oldName);
    if (newName && newName !== oldName) {
      this.objectsStore.renameItem(item.key, newName);
      this.toast.success("Renaming…", `Renaming to ${newName}`);
    }
  }

  private showDeleteDialog(keys: string[]): void {
    const count = keys.length;
    const message =
      count === 1
        ? "Are you sure you want to delete this item?"
        : `Are you sure you want to delete ${count} items?`;
    if (confirm(message)) {
      this.objectsStore.deleteItems(keys);
      this.toast.success("Deleting…", `${count} item(s)`);
    }
  }

  private copyPublicUrl(key: string): void {
    const base = this.configStore.config().publicBaseUrl;
    const publicUrl = base ? `${base}/${key}` : "No public URL configured";

    navigator.clipboard.writeText(publicUrl).then(
      () => this.toast.success("Copied!", "Public URL copied to clipboard"),
      () => this.toast.error("Copy failed", "Could not copy to clipboard")
    );
  }
}
