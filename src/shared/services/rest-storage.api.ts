import { Injectable } from '@angular/core';
import { StorageApi, ObjectItem, ListParams, MoveParams } from '../types/storage.types';

@Injectable({ providedIn: 'root' })
export class RestStorageApi implements StorageApi {
  private baseUrl = '';
  private token = '';

  constructor() {
    // These would be injected from config
    console.log('RestStorageApi initialized (not implemented)');
  }

  async list(params: ListParams): Promise<{ items: ObjectItem[]; cursor?: string }> {
    // TODO: Implement REST endpoint
    // GET /objects?prefix=${params.prefix}&cursor=${params.cursor}&limit=${params.limit}
    throw new Error('Not implemented: connect your backend here - GET /objects');
  }

  async createFolder(prefix: string): Promise<void> {
    // TODO: Implement REST endpoint
    // POST /folders { prefix }
    throw new Error('Not implemented: connect your backend here - POST /folders');
  }

  async rename(oldKey: string, newKey: string): Promise<void> {
    // TODO: Implement REST endpoint
    // PUT /objects/rename { oldKey, newKey }
    throw new Error('Not implemented: connect your backend here - PUT /objects/rename');
  }

  async move(params: MoveParams): Promise<void> {
    // TODO: Implement REST endpoint
    // POST /move { fromKey, toKey, overwrite }
    throw new Error('Not implemented: connect your backend here - POST /move');
  }

  async delete(keys: string[]): Promise<void> {
    // TODO: Implement REST endpoint
    // DELETE /objects { keys: string[] }
    throw new Error('Not implemented: connect your backend here - DELETE /objects');
  }

  async upload(key: string, file: File, contentType?: string): Promise<ObjectItem> {
    // TODO: Implement REST endpoint
    // POST /upload or presigned PUT pattern
    throw new Error('Not implemented: connect your backend here - POST /upload');
  }

  async head(key: string): Promise<ObjectItem | null> {
    // TODO: Implement REST endpoint
    // GET /head?key=${key}
    throw new Error('Not implemented: connect your backend here - GET /head');
  }

  getPublicUrl(key: string): string {
    // TODO: Implement based on your storage provider
    return `${this.baseUrl}/public/${key}`;
  }
}