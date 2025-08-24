import { Injectable, signal, computed } from '@angular/core';
import { UploadProgress } from '../types/storage.types';

@Injectable({ providedIn: 'root' })
export class UploadStore {
  private _uploads = signal<Map<string, UploadProgress>>(new Map());

  public readonly uploads = computed(() => Array.from(this._uploads().values()));
  public readonly activeUploads = computed(() => 
    this.uploads().filter(upload => upload.status === 'uploading')
  );
  public readonly completedUploads = computed(() => 
    this.uploads().filter(upload => upload.status === 'completed')
  );
  public readonly failedUploads = computed(() => 
    this.uploads().filter(upload => upload.status === 'error')
  );
  public readonly totalProgress = computed(() => {
    const uploads = this.uploads();
    if (uploads.length === 0) return 0;
    
    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0);
    return Math.round(totalProgress / uploads.length);
  });

  addUpload(key: string, file: File): void {
    this._uploads.update(current => {
      const newMap = new Map(current);
      newMap.set(key, {
        key,
        file,
        progress: 0,
        status: 'pending'
      });
      return newMap;
    });
  }

  updateProgress(key: string, progress: number, status?: UploadProgress['status']): void {
    this._uploads.update(current => {
      const newMap = new Map(current);
      const upload = newMap.get(key);
      if (upload) {
        newMap.set(key, {
          ...upload,
          progress,
          status: status || upload.status
        });
      }
      return newMap;
    });
  }

  setError(key: string, error: string): void {
    this._uploads.update(current => {
      const newMap = new Map(current);
      const upload = newMap.get(key);
      if (upload) {
        newMap.set(key, {
          ...upload,
          status: 'error',
          error
        });
      }
      return newMap;
    });
  }

  removeUpload(key: string): void {
    this._uploads.update(current => {
      const newMap = new Map(current);
      newMap.delete(key);
      return newMap;
    });
  }

  clearCompleted(): void {
    this._uploads.update(current => {
      const newMap = new Map(current);
      for (const [key, upload] of newMap.entries()) {
        if (upload.status === 'completed') {
          newMap.delete(key);
        }
      }
      return newMap;
    });
  }

  clearAll(): void {
    this._uploads.set(new Map());
  }
}