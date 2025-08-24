// src/app/data/r2.service.ts
import { Injectable, InjectionToken, inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

export const R2_API_BASE = new InjectionToken<string>("R2_API_BASE", {
  factory: () => "http://127.0.0.1:8787", // cambia a tu workers.dev o proxy
});
export function provideR2Api(baseUrl: string) {
  return { provide: R2_API_BASE, useValue: baseUrl };
}

export type R2Object = {
  key: string;
  size: number;
  etag?: string;
  uploaded?: string;
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
    contentLanguage?: string;
  };
  customMetadata?: Record<string, string>;
};

export type ListResponse = {
  prefix: string;
  objects: R2Object[];
  prefixes: string[];
  truncated: boolean;
  cursor?: string | null;
};

@Injectable({ providedIn: "root" })
export class R2Service {
  private readonly http = inject(HttpClient);
  private readonly base = inject(R2_API_BASE);

  private qs(query: Record<string, string | number | undefined>) {
    const params = new HttpParams({
      fromObject: Object.fromEntries(
        Object.entries(query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ),
    });
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  list(
    prefix = "",
    opts?: { cursor?: string; limit?: number }
  ): Observable<ListResponse> {
    const url = `${this.base}/objects${this.qs({
      prefix,
      cursor: opts?.cursor,
      limit: opts?.limit,
    })}`;
    return this.http.get<ListResponse>(url);
  }

  createFolder(prefix: string): Observable<{ ok: true; key: string }> {
    const url = `${this.base}/folder${this.qs({ prefix })}`;
    return this.http.post<{ ok: true; key: string }>(url, null);
  }

  uploadObject(
    key: string,
    data: Blob | ArrayBuffer | Uint8Array,
    contentType?: string
  ) {
    const url = `${this.base}/object${this.qs({ key })}`;
    const headers = new HttpHeaders({
      "Content-Type":
        contentType ??
        (data instanceof Blob && data.type
          ? data.type
          : "application/octet-stream"),
    });
    const body =
      data instanceof Blob
        ? data
        : data instanceof ArrayBuffer
        ? new Blob([data])
        : data instanceof Uint8Array
        ? new Blob([data.buffer] as any)
        : new Blob([]);

    return this.http.put<{ ok: boolean; key: string }>(url, body, { headers });
  }

  deleteObject(key: string) {
    const url = `${this.base}/object${this.qs({ key })}`;
    return this.http.delete<{ ok: true }>(url);
  }

  moveObject(from: string, to: string) {
    const url = `${this.base}/move`;
    return this.http.post<{ ok: true; from: string; to: string }>(url, {
      from,
      to,
    });
  }

  buildObjectUrl(key: string) {
    return `${this.base}/object${this.qs({ key })}`;
  }
}
