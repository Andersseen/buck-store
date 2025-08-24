import { Component } from "@angular/core";
import Shell from "./shell";

@Component({
  selector: "app-root",
  template: `<shell />`,
  imports: [Shell],
})
export default class App {}
