import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FolderNodeComponent } from "./folder-node";
import { FolderNode } from "./types";

@Component({
  selector: "app-folder-tree",
  imports: [FolderNodeComponent],
  template: `
    <!-- Render a flat list of root nodes; children are delegated to node component -->
    @for (node of nodes; track node.prefix) {
    <app-folder-node
      [node]="node"
      [currentPrefix]="currentPrefix"
      (toggle)="toggle.emit($event)"
      (select)="select.emit($event)"
    />
    }
  `,
})
export class FolderTreeComponent {
  @Input() nodes: FolderNode[] = [];
  @Input() currentPrefix: string = "";

  @Output() toggle = new EventEmitter<FolderNode>();
  @Output() select = new EventEmitter<string>();
}
