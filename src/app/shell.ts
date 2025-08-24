import { Component, inject, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ConfigStore } from "@shared/services/config.store";
import { ToastComponent } from "../components/ui/toast.component";

@Component({
  selector: "shell",
  template: `
    <div class="min-h-screen bg-background text-foreground transition-colors">
      <router-outlet />
      <app-toast-container />
    </div>
  `,
  imports: [RouterOutlet, ToastComponent],
})
export default class Shell implements OnInit {
  private configStore = inject(ConfigStore);

  ngOnInit(): void {
    // Initialize theme
    this.configStore.config();
  }
}
