import { Component, inject, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ObjectsStore } from "@shared//services/objects.store";
import { ConfigStore } from "@shared//services/config.store";

@Component({
  selector: "app-topbar",
  template: `
    <header
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <!-- Left side -->
        <div class="flex items-center space-x-4">
          <!-- Sidebar toggle -->
          <button
            (click)="toggleSidebar.emit()"
            class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                   dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ☰
          </button>

          <!-- Breadcrumbs -->
          <nav class="flex items-center space-x-2 text-sm">
            <button
              (click)="navigateToPrefix('')"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              🏠 Root
            </button>
            @for (crumb of breadcrumbs(); track crumb.prefix) {
            <span class="text-gray-400 dark:text-gray-600">/</span>
            <button
              (click)="navigateToPrefix(crumb.prefix)"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              {{ crumb.name }}
            </button>
            }
          </nav>
        </div>

        <!-- Center - Search -->
        <div class="flex-1 max-w-md mx-8">
          <div class="relative">
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search files and folders..."
              class="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 
                     rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <div class="absolute inset-y-0 left-0 flex items-center pl-3">
              <span class="text-gray-400 dark:text-gray-500">🔍</span>
            </div>
            @if (searchQuery()) {
            <button
              (click)="clearSearch()"
              class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 
                       hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
            }
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-2">
          <!-- Filters -->
          <select
            [ngModel]="filterType()"
            (ngModelChange)="onFilterChange($event)"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 
                   rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Items</option>
            <option value="images">Images Only</option>
            <option value="folders">Folders Only</option>
          </select>

          <!-- View toggle -->
          <div
            class="flex rounded-lg border border-gray-300 dark:border-gray-600"
          >
            <button
              (click)="setViewMode('grid')"
              class="px-3 py-2 text-sm rounded-l-lg"
              [class.bg-blue-500]="viewMode() === 'grid'"
              [class.text-white]="viewMode() === 'grid'"
              [class.bg-white]="viewMode() !== 'grid'"
              [class.dark:bg-gray-700]="viewMode() !== 'grid'"
              [class.text-gray-700]="viewMode() !== 'grid'"
              [class.dark:text-gray-300]="viewMode() !== 'grid'"
            >
              ⊞
            </button>
            <button
              (click)="setViewMode('list')"
              class="px-3 py-2 text-sm rounded-r-lg border-l border-gray-300 dark:border-gray-600"
              [class.bg-blue-500]="viewMode() === 'list'"
              [class.text-white]="viewMode() === 'list'"
              [class.bg-white]="viewMode() !== 'list'"
              [class.dark:bg-gray-700]="viewMode() !== 'list'"
              [class.text-gray-700]="viewMode() !== 'list'"
              [class.dark:text-gray-300]="viewMode() !== 'list'"
            >
              ☰
            </button>
          </div>

          <!-- Upload button -->
          <button
            (click)="triggerUpload()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm 
                   rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            📁 Upload
          </button>

          <!-- Theme toggle -->
          <button
            (click)="toggleTheme()"
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 
                   dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            [title]="
              currentTheme() === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            "
          >
            {{ currentTheme() === "dark" ? "☀️" : "🌙" }}
          </button>
        </div>
      </div>

      <!-- Selection info -->
      @if (selectedCount() > 0) {
      <div
        class="mt-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between"
      >
        <span class="text-sm text-blue-700 dark:text-blue-300">
          {{ selectedCount() }} item{{ selectedCount() > 1 ? "s" : "" }}
          selected
        </span>
        <div class="flex space-x-2">
          <button
            (click)="deleteSelected()"
            class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Delete
          </button>
          <button
            (click)="moveSelected()"
            class="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
          >
            Move
          </button>
          <button
            (click)="clearSelection()"
            class="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      }

      <!-- Hidden file input -->
      <input
        #fileInput
        type="file"
        multiple
        accept="image/*"
        (change)="onFileSelected($event)"
        class="hidden"
      />
    </header>
  `,
  imports: [CommonModule, FormsModule],
})
export class TopbarComponent {
  private objectsStore = inject(ObjectsStore);
  private configStore = inject(ConfigStore);

  toggleSidebar = output<void>();
  uploadFiles = output<FileList>();

  protected breadcrumbs = this.objectsStore.breadcrumbs;
  protected searchQuery = this.objectsStore.searchQuery;
  protected filterType = this.objectsStore.filterType;
  protected viewMode = this.objectsStore.viewMode;
  protected selectedCount = this.objectsStore.selectedCount;
  protected currentTheme = this.configStore.currentTheme;

  private fileInput = signal<HTMLInputElement | null>(null);

  protected navigateToPrefix(prefix: string): void {
    // This would typically emit an event to navigate
    console.log("Navigate to prefix:", prefix);
  }

  protected onSearchChange(query: string): void {
    this.objectsStore.setSearchQuery(query);
  }

  protected clearSearch(): void {
    this.objectsStore.setSearchQuery("");
  }

  protected onFilterChange(type: any): void {
    this.objectsStore.setFilterType(type);
  }

  protected setViewMode(mode: "grid" | "list"): void {
    this.configStore.updateConfig({ viewMode: mode });
  }

  protected triggerUpload(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        this.uploadFiles.emit(files);
      }
    };
    input.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(input.files);
      input.value = ""; // Reset input
    }
  }

  protected toggleTheme(): void {
    const current = this.configStore.config().theme;
    const newTheme = current === "dark" ? "light" : "dark";
    this.configStore.updateConfig({ theme: newTheme });
  }

  protected deleteSelected(): void {
    const selected = Array.from(this.objectsStore.selectedKeys());
    if (selected.length > 0) {
      // TODO: Show confirmation dialog
      console.log("Delete selected:", selected);
    }
  }

  protected moveSelected(): void {
    const selected = Array.from(this.objectsStore.selectedKeys());
    if (selected.length > 0) {
      // TODO: Show move dialog
      console.log("Move selected:", selected);
    }
  }

  protected clearSelection(): void {
    this.objectsStore.clearSelection();
  }
}
