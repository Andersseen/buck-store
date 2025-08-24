import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                 rounded-lg shadow-lg p-4 min-w-80 animate-slide-up"
          [class.border-green-200]="toast.type === 'success'"
          [class.border-red-200]="toast.type === 'error'"
          [class.border-yellow-200]="toast.type === 'warning'"
          [class.border-blue-200]="toast.type === 'info'"
        >
          <div class="flex items-start">
            <div 
              class="flex-shrink-0 w-5 h-5 mr-3 mt-0.5 rounded-full flex items-center justify-center text-white text-sm"
              [class.bg-green-500]="toast.type === 'success'"
              [class.bg-red-500]="toast.type === 'error'"
              [class.bg-yellow-500]="toast.type === 'warning'"
              [class.bg-blue-500]="toast.type === 'info'"
            >
              @switch (toast.type) {
                @case ('success') { ✓ }
                @case ('error') { ✕ }
                @case ('warning') { ⚠ }
                @case ('info') { ℹ }
              }
            </div>
            
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ toast.title }}
              </h4>
              @if (toast.message) {
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {{ toast.message }}
                </p>
              }
            </div>
            
            <button
              (click)="toastService.remove(toast.id)"
              class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      }
    </div>
  `,
  imports: [CommonModule]
})
export class ToastComponent {
  protected toastService = inject(ToastService);
}