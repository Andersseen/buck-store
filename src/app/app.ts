import { Component } from "@angular/core";
import { AppShellComponent } from "../components/shell/app-shell.component";

@Component({
  selector: "app-root",
  template: `<app-shell />`,
  imports: [AppShellComponent],
})
export default class App {}
