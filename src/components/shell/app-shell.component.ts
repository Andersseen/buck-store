import { Component, inject, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ConfigStore } from "@shared/services/config.store";
import { ToastComponent } from "../ui/toast.component";

@Component({
  selector: "app-shell",
  template: `
    <div
      class="min-h-screen bg-neutral-100 dark:bg-neutral-900 transition-colors"
    >
      <router-outlet />
      <app-toast-container />
    </div>
  `,
  imports: [RouterOutlet, ToastComponent],
})
export class AppShellComponent implements OnInit {
  private configStore = inject(ConfigStore);

  ngOnInit(): void {
    // Initialize theme
    this.configStore.config();
  }
}
