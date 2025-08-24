import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ConfigStore } from "@shared//services/config.store";
import { ToastService } from "../ui/toast.service";

@Component({
  selector: "app-setup-page",
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 
                flex items-center justify-center p-4"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Storage Admin Setup
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Configure your storage settings to get started
          </p>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Public Base URL
            </label>
            <input
              type="url"
              [(ngModel)]="formData().publicBaseUrl"
              name="publicBaseUrl"
              placeholder="https://your-bucket.s3.amazonaws.com"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                     rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Base URL for generating public links to files
            </p>
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Storage Adapter
            </label>
            <select
              [(ngModel)]="formData().adapterType"
              name="adapterType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                     rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="mock">Mock Storage (Demo)</option>
              <option value="rest" disabled>REST API (Not implemented)</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Choose your storage backend type
            </p>
          </div>

          @if (formData().adapterType === 'rest') {
          <div class="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Base URL
              </label>
              <input
                type="url"
                name="apiBaseUrl"
                placeholder="https://api.example.com"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Token
              </label>
              <input
                type="password"
                name="apiToken"
                placeholder="Your API token"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          }

          <div class="flex items-center space-x-3">
            <input
              type="checkbox"
              id="persistence"
              name="enablePersistence"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
                     focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
                     dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              for="persistence"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              Enable local persistence (localStorage)
            </label>
          </div>

          <button
            type="submit"
            [disabled]="saving()"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                   text-white font-medium py-2 px-4 rounded-lg transition-colors
                   focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            @if (saving()) {
            <span class="inline-flex items-center">
              <svg
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </span>
            } @else { Open Bucket }
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Theme</span>
            <select
              [(ngModel)]="currentTheme"
              (ngModelChange)="onThemeChange($event)"
              class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 
                     rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule],
})
export class SetupPageComponent {
  private configStore = inject(ConfigStore);
  private toastService = inject(ToastService);
  private router = inject(Router);

  protected saving = signal(false);
  protected currentTheme = signal(this.configStore.config().theme);

  protected formData = signal({
    publicBaseUrl: this.configStore.config().publicBaseUrl,
    apiBaseUrl: this.configStore.config().apiBaseUrl,
    apiToken: this.configStore.config().apiToken,
    adapterType: this.configStore.config().adapterType,
    enablePersistence: this.configStore.config().enablePersistence,
  });

  protected onThemeChange(theme: "light" | "dark" | "system"): void {
    this.currentTheme.set(theme);
    this.configStore.updateConfig({ theme });
  }

  protected async onSubmit(): Promise<void> {
    this.saving.set(true);

    try {
      // Simulate saving delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.configStore.updateConfig(this.formData());

      this.toastService.success(
        "Settings saved!",
        "Your configuration has been updated successfully."
      );

      // Navigate to bucket
      await this.router.navigate(["/bucket"]);
    } catch (error) {
      this.toastService.error(
        "Save failed",
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      this.saving.set(false);
    }
  }
}
