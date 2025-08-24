import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import {
  provideClientHydration,
  withEventReplay,
} from "@angular/platform-browser";
import routes from "./routes";
import { provideAppConfig } from "@shared/services/config-api";

const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    provideAppConfig(),
  ],
};
export default appConfig;
