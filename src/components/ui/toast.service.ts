import { Injectable, signal } from "@angular/core";

export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<Toast, "id">): void {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    this._toasts.update((current) => [...current, newToast]);

    if (newToast.duration) {
      setTimeout(() => this.remove(id), newToast.duration);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    this.show({ type: "success", title, message, duration });
  }

  error(title: string, message?: string, duration?: number): void {
    this.show({ type: "error", title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.show({ type: "warning", title, message, duration });
  }

  info(title: string, message?: string, duration?: number): void {
    this.show({ type: "info", title, message, duration });
  }

  remove(id: string): void {
    this._toasts.update((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }

  clear(): void {
    this._toasts.set([]);
  }
}
