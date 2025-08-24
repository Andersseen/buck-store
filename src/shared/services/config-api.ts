import {
  InjectionToken,
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideAppInitializer,
} from "@angular/core";
import { environment } from "@environments/environment";

export type AppConfig = {
  authBaseUrl: string;
  storageBaseUrl: string;
  publicBaseUrl?: string;
};

export const APP_CONFIG = new InjectionToken<AppConfig>("APP_CONFIG");

let CONFIG!: AppConfig;

export function provideAppConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(async () => {
      const res = await fetch(environment.configPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`Config load failed (${res.status})`);
      CONFIG = await res.json();
    }),

    { provide: APP_CONFIG, useFactory: () => CONFIG },
  ]);
}
