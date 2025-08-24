import { NgClass } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FolderNode } from "./types";

@Component({
  selector: "app-folder-node",
  imports: [NgClass],
  template: `
    <!-- One node row -->
    <button
      (click)="onToggleClick()"
      class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 
             dark:hover:bg-gray-700 flex items-center space-x-2"
      [style.padding-left]="12 + node.level * 16 + 'px'"
      [ngClass]="{
        'bg-blue-50 text-blue-600 dark:text-blue-400':
          currentPrefix === node.prefix
      }"
    >
      <span class="text-xs">{{
        node.hasChildren ? (node.isExpanded ? "▼" : "▶") : " "
      }}</span>
      <span>📁</span>
      <span (click)="onSelectClick($event)">{{ node.name }}</span>
    </button>

    <!-- Children -->
    @if (node.isExpanded && node.children.length > 0) { @for (child of
    node.children; track child.prefix) {
    <app-folder-node
      [node]="child"
      [currentPrefix]="currentPrefix"
      (toggle)="toggle.emit($event)"
      (select)="select.emit($event)"
    />
    } }
  `,
})
export class FolderNodeComponent {
  @Input({ required: true }) node!: FolderNode;
  @Input() currentPrefix: string = "";

  @Output() toggle = new EventEmitter<FolderNode>();
  @Output() select = new EventEmitter<string>();

  /** Toggle expands/collapses the node and emits to container. */
  onToggleClick(): void {
    this.toggle.emit(this.node);
  }

  /** Selecting only emits the prefix; prevents re-triggering toggle if needed. */
  onSelectClick(evt: MouseEvent): void {
    evt.stopPropagation();
    this.select.emit(this.node.prefix);
  }
}
