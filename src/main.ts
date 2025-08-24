import { Component, inject, OnInit } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { AppShellComponent } from "./components/shell/app-shell.component";
import { routes } from "./app.routes";
import { provideHttpClient } from "@angular/common/http";
import { provideR2Api } from "./services/r2.service";

@Component({
  selector: "app-root",
  template: `<app-shell />`,
  imports: [AppShellComponent],
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideR2Api("http://localhost:8787"),
    provideHttpClient(),
  ],
}).catch((err) => console.error(err));
