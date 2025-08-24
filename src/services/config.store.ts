import { Injectable, signal, computed, effect } from '@angular/core';

export interface AppConfig {
  publicBaseUrl: string;
  apiBaseUrl: string;
  apiToken: string;
  adapterType: 'mock' | 'rest';
  theme: 'light' | 'dark' | 'system';
  viewMode: 'grid' | 'list';
  pageSize: number;
  enablePersistence: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfigStore {
  private readonly STORAGE_KEY = 'storage-admin-config';

  private _config = signal<AppConfig>({
    publicBaseUrl: '',
    apiBaseUrl: '',
    apiToken: '',
    adapterType: 'mock',
    theme: 'system',
    viewMode: 'grid',
    pageSize: 50,
    enablePersistence: true
  });

  public readonly config = this._config.asReadonly();

  public readonly currentTheme = computed(() => {
    const theme = this._config().theme;
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  });

  constructor() {
    this.loadConfig();
    
    // Save config changes to localStorage
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._config()));
      this.applyTheme();
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => this.applyTheme());
  }

  updateConfig(updates: Partial<AppConfig>): void {
    this._config.update(current => ({ ...current, ...updates }));
  }

  resetConfig(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._config.set({
      publicBaseUrl: '',
      apiBaseUrl: '',
      apiToken: '',
      adapterType: 'mock',
      theme: 'system',
      viewMode: 'grid',
      pageSize: 50,
      enablePersistence: true
    });
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored) as Partial<AppConfig>;
        this._config.update(current => ({ ...current, ...config }));
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
  }

  private applyTheme(): void {
    const theme = this.currentTheme();
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}