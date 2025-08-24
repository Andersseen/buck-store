import { Component, inject, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ObjectsStore } from "@shared//services/objects.store";
import { UploadStore } from "@shared//services/upload.store";

@Component({
  selector: "app-status-bar",
  template: `
    <footer
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2"
    >
      <div
        class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
      >
        <!-- Left side - Item counts -->
        <div class="flex items-center space-x-4">
          <span
            >{{ totalItems() }} item{{ totalItems() !== 1 ? "s" : "" }}</span
          >

          @if (selectedCount() > 0) {
          <span class="text-blue-600 dark:text-blue-400">
            {{ selectedCount() }} selected
          </span>
          } @if (loading()) {
          <div class="flex items-center space-x-2">
            <div
              class="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"
            ></div>
            <span>Loading...</span>
          </div>
          }
        </div>

        <!-- Center - Upload progress -->
        @if (activeUploads().length > 0) {
        <div class="flex items-center space-x-2">
          <div class="flex items-center space-x-2">
            <div
              class="animate-spin rounded-full h-3 w-3 border border-green-600 border-t-transparent"
            ></div>
            <span class="text-green-600 dark:text-green-400">
              Uploading {{ activeUploads().length }} file{{
                activeUploads().length !== 1 ? "s" : ""
              }}
            </span>
          </div>

          @if (totalProgress() > 0) {
          <div
            class="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-green-500 transition-all duration-300"
              [style.width.%]="totalProgress()"
            ></div>
          </div>
          <span class="text-xs">{{ totalProgress() }}%</span>
          }
        </div>
        }

        <!-- Right side - Storage info or errors -->
        <div class="flex items-center space-x-4">
          @if (error()) {
          <span
            class="text-red-600 dark:text-red-400 flex items-center space-x-1"
          >
            <span>⚠️</span>
            <span>{{ error() }}</span>
          </span>
          } @else if (hasMore()) {
          <span>More items available</span>
          } @else if (totalItems() > 0) {
          <span>End of list</span>
          } @if (failedUploads().length > 0) {
          <button
            (click)="showFailedUploads()"
            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 
                     flex items-center space-x-1"
          >
            <span>⚠️</span>
            <span>{{ failedUploads().length }} failed</span>
          </button>
          } @if (completedUploads().length > 0) {
          <button
            (click)="clearCompletedUploads()"
            class="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 
                     flex items-center space-x-1"
          >
            <span>✓</span>
            <span>Clear completed</span>
          </button>
          }
        </div>
      </div>
    </footer>
  `,
  imports: [CommonModule],
})
export class StatusBarComponent {
  private objectsStore = inject(ObjectsStore);
  private uploadStore = inject(UploadStore);

  protected totalItems = computed(
    () => this.objectsStore.filteredItems().length
  );
  protected selectedCount = this.objectsStore.selectedCount;
  protected loading = this.objectsStore.loading;
  protected error = this.objectsStore.error;
  protected hasMore = this.objectsStore.hasMore;

  protected activeUploads = this.uploadStore.activeUploads;
  protected completedUploads = this.uploadStore.completedUploads;
  protected failedUploads = this.uploadStore.failedUploads;
  protected totalProgress = this.uploadStore.totalProgress;

  protected showFailedUploads(): void {
    // TODO: Show failed uploads dialog
    console.log("Failed uploads:", this.failedUploads());
  }

  protected clearCompletedUploads(): void {
    this.uploadStore.clearCompleted();
  }
}
