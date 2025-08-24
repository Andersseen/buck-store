// src/app/data/r2-storage.api.ts
import { Injectable, inject } from "@angular/core";
import { forkJoin, map, of } from "rxjs";

import { R2Service } from "./r2.service";
import {
  ListParams,
  MoveParams,
  ObjectItem,
  StorageApi,
} from "./storage.types";

@Injectable({ providedIn: "root" })
export class R2StorageApi implements StorageApi {
  private readonly r2 = inject(R2Service);

  list(params: ListParams) {
    const { prefix = "", cursor, limit } = params;
    return this.r2.list(prefix, { cursor, limit }).pipe(
      map((res: any) => {
        const folders: ObjectItem[] = (res.prefixes ?? []).map((p: any) => ({
          key: p,
          isFolder: true,
          lastModified: new Date().toISOString(),
        }));

        const files: ObjectItem[] = (res.objects ?? []).map((o: any) => ({
          key: o.key,
          isFolder: false,
          size: o.size,
          etag: o.etag,
          lastModified: o.uploaded,
          contentType: o.httpMetadata?.contentType,
          previewUrl: this.getPublicUrl(o.key),
        }));

        // Carpeta primero, luego nombre
        const items = [...folders, ...files].sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.key.localeCompare(b.key);
        });

        return { items, cursor: res.cursor ?? undefined };
      })
    );
  }

  createFolder(prefix: string) {
    const key = prefix.endsWith("/") ? prefix : `${prefix}/`;
    return this.r2.createFolder(key).pipe(map(() => void 0));
  }

  rename(oldKey: string, newKey: string) {
    return this.r2.moveObject(oldKey, newKey).pipe(map(() => void 0));
  }

  move(params: MoveParams) {
    const { fromKey, toKey } = params;
    return this.r2.moveObject(fromKey, toKey).pipe(map(() => void 0));
  }

  delete(keys: string[]) {
    if (!keys.length) return of(void 0);
    return forkJoin(keys.map((k) => this.r2.deleteObject(k))).pipe(
      map(() => void 0)
    );
  }

  upload(key: string, file: File, contentType?: string) {
    return this.r2.uploadObject(key, file, contentType ?? file.type).pipe(
      map(
        (): ObjectItem => ({
          key,
          isFolder: false,
          size: file.size,
          contentType: contentType ?? file.type,
          lastModified: new Date().toISOString(),
          previewUrl: this.getPublicUrl(key),
        })
      )
    );
  }

  // No tenemos endpoint HEAD real; lo resolvemos listando el propio key.
  head(key: string) {
    const prefix = key.endsWith("/") ? key : key; // si es carpeta, devolveremos su “marker” si existe
    const parent = key.includes("/")
      ? key.split("/").slice(0, -1).join("/") + "/"
      : "";
    return this.r2.list(parent, { limit: 1000 }).pipe(
      map((res) => {
        const obj = (res.objects ?? []).find((o) => o.key === key);
        if (obj) {
          return <ObjectItem>{
            key: obj.key,
            isFolder: false,
            size: obj.size,
            etag: obj.etag,
            lastModified: obj.uploaded,
            contentType: obj.httpMetadata?.contentType,
            previewUrl: this.getPublicUrl(obj.key),
          };
        }
        const folder = (res.prefixes ?? []).find(
          (p) => p === (key.endsWith("/") ? key : key + "/")
        );
        if (folder) {
          return <ObjectItem>{
            key: folder,
            isFolder: true,
            lastModified: new Date().toISOString(),
          };
        }
        return null;
      })
    );
  }

  getPublicUrl(key: string) {
    return this.r2.buildObjectUrl(key);
  }
}
