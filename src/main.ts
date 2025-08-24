import { Component, inject, OnInit } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { AppShellComponent } from "./components/shell/app-shell.component";
import { routes } from "./app.routes";

@Component({
  selector: "app-root",
  template: `<app-shell />`,
  imports: [AppShellComponent],
})
export class App {}

bootstrapApplication(App, {
  providers: [provideRouter(routes)],
}).catch((err) => console.error(err));
