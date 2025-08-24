// src/app/data/r2.service.ts
import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, InjectionToken, inject } from "@angular/core";

export const R2_API_BASE = new InjectionToken<string>("R2_API_BASE", {
  factory: () => "/api", // default base (adjust or provide with `provideR2Api(...)`)
});

// Helper provider for setup in main.ts or a feature bootstrap
export function provideR2Api(baseUrl: string) {
  return { provide: R2_API_BASE, useValue: baseUrl };
}

/** Types **/
export type R2Object = {
  key: string;
  size: number;
  etag?: string;
  uploaded?: string;
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
};

export type ListResponse = {
  prefix: string;
  objects: R2Object[];
  prefixes: string[]; // “folders” (common prefixes)
  truncated: boolean;
  cursor?: string | null;
};

@Injectable({ providedIn: "root" })
export class R2Service {
  private readonly http = inject(HttpClient);
  private readonly base = inject(R2_API_BASE); // e.g. "http://127.0.0.1:8787" or your workers.dev URL

  /** Build query string */
  private qs(query: Record<string, string | number | undefined>) {
    const p = new HttpParams({
      fromObject: Object.fromEntries(
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ),
    });
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  /** List objects and "folders" under a prefix */
  list(prefix = "", opts?: { cursor?: string; limit?: number }) {
    const url = `${this.base}/objects${this.qs({
      prefix,
      cursor: opts?.cursor,
      limit: opts?.limit,
    })}`;
    return this.http.get<ListResponse>(url).toPromise();
  }

  /** Convenience: list only folder names directly under prefix (no trailing slash) */
  async listFolders(prefix = ""): Promise<string[]> {
    const res = await this.list(prefix);
    return (res?.prefixes ?? []).map((p) =>
      p.replace(prefix, "").replace(/\/$/, "")
    );
  }

  /** Convenience: list only files directly under prefix (exclude "folders") */
  async listFiles(prefix = ""): Promise<R2Object[]> {
    const res = await this.list(prefix);
    return res?.objects ?? [];
  }

  /** Create a "folder" (actually a zero-byte object ending with "/") */
  createFolder(prefix: string) {
    const url = `${this.base}/folder${this.qs({ prefix })}`;
    return this.http.post<{ ok: true; key: string }>(url, null).toPromise();
  }

  /**
   * Upload an object (PUT /object?key=...)
   * - Uses fetch to stream binary without JSON transformations.
   * - contentType is inferred from Blob/File when possible.
   */
  async uploadObject(
    key: string,
    data: Blob | ArrayBuffer | Uint8Array,
    contentType?: string
  ) {
    const url = `${this.base}/object${this.qs({ key })}`;
    const body: any =
      data instanceof Blob
        ? data
        : data instanceof ArrayBuffer
        ? data
        : data instanceof Uint8Array
        ? data
        : new Uint8Array(0);

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type":
          contentType ??
          (data instanceof Blob && data.type
            ? data.type
            : "application/octet-stream"),
      },
      body,
    });

    if (!res.ok)
      throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    return (await res.json()) as { ok: boolean; key: string };
  }

  /** Delete object by key */
  deleteObject(key: string) {
    const url = `${this.base}/object${this.qs({ key })}`;
    return this.http.delete<{ ok: true }>(url).toPromise();
  }

  /**
   * Move/Rename object
   * (Worker implements copy+delete under the hood)
   */
  moveObject(from: string, to: string) {
    const url = `${this.base}/move`;
    return this.http
      .post<{ ok: true; from: string; to: string }>(url, { from, to })
      .toPromise();
  }

  /**
   * Get object as Blob (served by the Worker)
   * You can then createObjectURL(blob) or pass to <img [src]>
   */
  async getObjectBlob(key: string): Promise<Blob> {
    const url = `${this.base}/object${this.qs({ key })}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok)
      throw new Error(`Get object failed: ${res.status} ${res.statusText}`);
    return await res.blob();
  }

  /** Build a direct URL to the Worker for an object key (useful in templates) */
  buildObjectUrl(key: string) {
    return `${this.base}/object${this.qs({ key })}`;
  }
}
