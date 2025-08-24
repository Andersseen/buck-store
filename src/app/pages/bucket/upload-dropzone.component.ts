import { Component, output, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-upload-dropzone",
  template: `
    <div class="flex items-center justify-center w-full h-full">
      <div
        class="bg-blue-500/90 backdrop-blur-sm rounded-2xl border-4 border-dashed 
                  border-white/50 p-12 text-center text-white"
      >
        <div class="text-6xl mb-4">📁</div>
        <h3 class="text-2xl font-bold mb-2">Drop files here</h3>
        <p class="text-blue-100">Release to upload to current folder</p>
      </div>
    </div>
  `,
  imports: [CommonModule],
})
export class UploadDropzoneComponent {
  filesDropped = output<File[]>();

  @HostListener("dragover", ["$event"])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  @HostListener("drop", ["$event"])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) {
      this.filesDropped.emit(files);
    }
  }
}
