import { Injectable } from '@angular/core';
import { StorageApi, ObjectItem, ListParams, MoveParams } from '../types/storage.types';

@Injectable({ providedIn: 'root' })
export class MockStorageApi implements StorageApi {
  private items: Map<string, ObjectItem> = new Map();
  private readonly STORAGE_KEY = 'mock-storage-items';

  constructor() {
    this.loadFromStorage();
    this.seedSampleData();
  }

  async list(params: ListParams): Promise<{ items: ObjectItem[]; cursor?: string }> {
    await this.simulateLatency();
    
    const { prefix = '', cursor, limit = 50 } = params;
    let items = Array.from(this.items.values());

    // Filter by prefix
    if (prefix) {
      items = items.filter(item => item.key.startsWith(prefix));
    }

    // Get immediate children only (no deep nesting in list view)
    const prefixDepth = prefix.split('/').filter(p => p).length;
    const filteredItems: ObjectItem[] = [];
    const folderSet = new Set<string>();

    for (const item of items) {
      if (item.key === prefix) continue; // Skip the prefix itself
      
      const keyParts = item.key.split('/').filter(p => p);
      
      if (keyParts.length === prefixDepth + 1) {
        // Direct child file
        filteredItems.push({
          ...item,
          previewUrl: this.getPublicUrl(item.key)
        });
      } else if (keyParts.length > prefixDepth + 1) {
        // Child folder
        const folderPath = keyParts.slice(0, prefixDepth + 1).join('/') + '/';
        if (!folderSet.has(folderPath)) {
          folderSet.add(folderPath);
          filteredItems.push({
            key: folderPath,
            isFolder: true,
            lastModified: new Date().toISOString()
          });
        }
      }
    }

    // Sort items (folders first, then by name)
    filteredItems.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.key.localeCompare(b.key);
    });

    // Handle pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = filteredItems.findIndex(item => item.key === cursor);
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedItems.length === limit && startIndex + limit < filteredItems.length
      ? paginatedItems[paginatedItems.length - 1].key
      : undefined;

    return { items: paginatedItems, cursor: nextCursor };
  }

  async createFolder(prefix: string): Promise<void> {
    await this.simulateLatency();
    
    // Ensure prefix ends with /
    const folderKey = prefix.endsWith('/') ? prefix : prefix + '/';
    
    if (this.items.has(folderKey)) {
      throw new Error('Folder already exists');
    }

    // Create folder marker
    this.items.set(folderKey, {
      key: folderKey,
      isFolder: true,
      lastModified: new Date().toISOString()
    });

    this.saveToStorage();
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    await this.simulateLatency();
    
    if (!this.items.has(oldKey)) {
      throw new Error('Item not found');
    }
    
    if (this.items.has(newKey)) {
      throw new Error('Target already exists');
    }

    const item = this.items.get(oldKey)!;
    this.items.delete(oldKey);
    this.items.set(newKey, { ...item, key: newKey });

    // If renaming a folder, update all children
    if (item.isFolder) {
      const oldPrefix = oldKey.endsWith('/') ? oldKey : oldKey + '/';
      const newPrefix = newKey.endsWith('/') ? newKey : newKey + '/';
      
      for (const [key, childItem] of this.items.entries()) {
        if (key.startsWith(oldPrefix) && key !== oldKey) {
          const newChildKey = key.replace(oldPrefix, newPrefix);
          this.items.delete(key);
          this.items.set(newChildKey, { ...childItem, key: newChildKey });
        }
      }
    }

    this.saveToStorage();
  }

  async move(params: MoveParams): Promise<void> {
    await this.simulateLatency();
    
    const { fromKey, toKey, overwrite = false } = params;
    
    if (!this.items.has(fromKey)) {
      throw new Error('Source item not found');
    }
    
    if (this.items.has(toKey) && !overwrite) {
      throw new Error('Target already exists');
    }

    const item = this.items.get(fromKey)!;
    
    // Copy to new location
    this.items.set(toKey, { ...item, key: toKey });
    
    // Remove from old location
    this.items.delete(fromKey);

    // If moving a folder, update all children
    if (item.isFolder) {
      const oldPrefix = fromKey.endsWith('/') ? fromKey : fromKey + '/';
      const newPrefix = toKey.endsWith('/') ? toKey : toKey + '/';
      
      for (const [key, childItem] of this.items.entries()) {
        if (key.startsWith(oldPrefix) && key !== fromKey) {
          const newChildKey = key.replace(oldPrefix, newPrefix);
          this.items.set(newChildKey, { ...childItem, key: newChildKey });
          this.items.delete(key);
        }
      }
    }

    this.saveToStorage();
  }

  async delete(keys: string[]): Promise<void> {
    await this.simulateLatency();
    
    for (const key of keys) {
      this.items.delete(key);
      
      // If deleting a folder, delete all children
      const prefix = key.endsWith('/') ? key : key + '/';
      for (const childKey of this.items.keys()) {
        if (childKey.startsWith(prefix)) {
          this.items.delete(childKey);
        }
      }
    }

    this.saveToStorage();
  }

  async upload(key: string, file: File, contentType?: string): Promise<ObjectItem> {
    await this.simulateLatency();
    
    const item: ObjectItem = {
      key,
      isFolder: false,
      size: file.size,
      contentType: contentType || file.type,
      lastModified: new Date().toISOString(),
      previewUrl: this.getPublicUrl(key)
    };

    this.items.set(key, item);
    this.saveToStorage();
    
    return item;
  }

  async head(key: string): Promise<ObjectItem | null> {
    await this.simulateLatency();
    return this.items.get(key) || null;
  }

  getPublicUrl(key: string): string {
    // This would normally use the configured public base URL
    // For mock, we'll just return a placeholder URL
    return `https://example-bucket.s3.amazonaws.com/${key}`;
  }

  private async simulateLatency(): Promise<void> {
    // Simulate network latency (50-200ms)
    const delay = Math.random() * 150 + 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Occasionally simulate errors (5% chance)
    if (Math.random() < 0.05) {
      throw new Error('Simulated network error');
    }
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.items.entries());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as [string, ObjectItem][];
        this.items = new Map(data);
        return;
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  private seedSampleData(): void {
    if (this.items.size > 0) return; // Already has data

    const sampleItems: ObjectItem[] = [
      // Root files
      {
        key: 'logo.png',
        isFolder: false,
        size: 15432,
        contentType: 'image/png',
        lastModified: new Date('2024-01-15').toISOString()
      },
      {
        key: 'favicon.ico',
        isFolder: false,
        size: 2048,
        contentType: 'image/x-icon',
        lastModified: new Date('2024-01-10').toISOString()
      },
      
      // Landing folder
      {
        key: 'landing/',
        isFolder: true,
        lastModified: new Date('2024-02-01').toISOString()
      },
      {
        key: 'landing/hero.jpg',
        isFolder: false,
        size: 245678,
        contentType: 'image/jpeg',
        lastModified: new Date('2024-02-01').toISOString()
      },
      {
        key: 'landing/features-1.png',
        isFolder: false,
        size: 89123,
        contentType: 'image/png',
        lastModified: new Date('2024-02-02').toISOString()
      },
      {
        key: 'landing/features-2.png',
        isFolder: false,
        size: 76543,
        contentType: 'image/png',
        lastModified: new Date('2024-02-02').toISOString()
      },
      
      // Blog folder structure
      {
        key: 'blog/',
        isFolder: true,
        lastModified: new Date('2024-01-20').toISOString()
      },
      {
        key: 'blog/2024/',
        isFolder: true,
        lastModified: new Date('2024-01-20').toISOString()
      },
      {
        key: 'blog/2024/january/',
        isFolder: true,
        lastModified: new Date('2024-01-20').toISOString()
      },
      {
        key: 'blog/2024/january/cover.jpg',
        isFolder: false,
        size: 187654,
        contentType: 'image/jpeg',
        lastModified: new Date('2024-01-20').toISOString()
      },
      {
        key: 'blog/2024/january/screenshot-1.png',
        isFolder: false,
        size: 123456,
        contentType: 'image/png',
        lastModified: new Date('2024-01-22').toISOString()
      },
      
      // Assets folder
      {
        key: 'assets/',
        isFolder: true,
        lastModified: new Date('2024-01-05').toISOString()
      },
      {
        key: 'assets/icons/',
        isFolder: true,
        lastModified: new Date('2024-01-05').toISOString()
      },
      {
        key: 'assets/icons/arrow-right.svg',
        isFolder: false,
        size: 1234,
        contentType: 'image/svg+xml',
        lastModified: new Date('2024-01-05').toISOString()
      },
      {
        key: 'assets/icons/check.svg',
        isFolder: false,
        size: 987,
        contentType: 'image/svg+xml',
        lastModified: new Date('2024-01-05').toISOString()
      }
    ];

    for (const item of sampleItems) {
      this.items.set(item.key, {
        ...item,
        previewUrl: this.getPublicUrl(item.key)
      });
    }

    this.saveToStorage();
  }
}