import { Component, inject, OnInit, HostListener, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { ObjectsStore } from "../../services/objects.store";
import { SidebarComponent } from "./sidebar.component";
import { TopbarComponent } from "./topbar.component";
import { ContentAreaComponent } from "./content-area.component";
import { StatusBarComponent } from "./status-bar.component";

@Component({
  selector: "app-bucket-page",
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Sidebar -->
      <app-sidebar
        class="flex-shrink-0"
        [isCollapsed]="sidebarCollapsed()"
        (toggleCollapsed)="sidebarCollapsed.set($event)"
        (prefixSelected)="onPrefixChange($event)"
      />

      <!-- Main content -->
      <div class="flex-1 flex flex-col min-w-0">
        <!-- Top bar -->
        <app-topbar
          (toggleSidebar)="sidebarCollapsed.set(!sidebarCollapsed())"
          (uploadFiles)="onUploadFiles($event)"
        />

        <!-- Content area -->
        <app-content-area
          class="flex-1"
          (itemsSelected)="onItemsSelected($event)"
        />

        <!-- Status bar -->
        <app-status-bar />
      </div>
    </div>
  `,
  imports: [
    CommonModule,
    SidebarComponent,
    TopbarComponent,
    ContentAreaComponent,
    StatusBarComponent,
  ],
})
export class BucketPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private objectsStore = inject(ObjectsStore);

  protected sidebarCollapsed = signal<boolean>(false);

  ngOnInit(): void {
    // Load initial items based on route
    this.route.queryParams.subscribe((params) => {
      const prefix = params["prefix"] || "";
      this.objectsStore.loadItems(prefix);
    });
  }

  protected onPrefixChange(prefix: string): void {
    this.router.navigate(["/bucket"], {
      queryParams: { prefix: prefix || undefined },
      queryParamsHandling: "merge",
    });
  }

  protected onUploadFiles(files: FileList): void {
    Array.from(files).forEach(async (file) => {
      try {
        await this.objectsStore.uploadFile(file);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    });
  }

  protected onItemsSelected(keys: string[]): void {
    // Handle selection from content area
  }

  @HostListener("window:keydown", ["$event"])
  protected onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case "a":
          event.preventDefault();
          this.objectsStore.selectAll();
          break;
        case "u":
          event.preventDefault();
          // Trigger upload dialog
          break;
      }
    } else {
      switch (event.key) {
        case "Delete":
        case "Backspace":
          if (this.objectsStore.selectedCount() > 0) {
            // Trigger delete confirmation
          }
          break;
        case "r":
        case "F2":
          if (this.objectsStore.selectedCount() === 1) {
            // Trigger rename dialog
          }
          break;
        case "m":
          if (this.objectsStore.selectedCount() > 0) {
            // Trigger move dialog
          }
          break;
      }
    }
  }
}
