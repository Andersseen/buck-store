# Storage Admin UI

A modern, feature-rich Angular 18+ admin interface for managing object storage buckets. Built with standalone components, signals, and the latest Angular features.

## Features

### 🗂️ File Management
- **Browse & Navigate**: Hierarchical folder structure with breadcrumb navigation
- **Grid & List Views**: Toggle between visual grid and detailed list layouts
- **Upload**: Drag & drop or file picker with progress tracking
- **CRUD Operations**: Create, rename, move, and delete files and folders
- **Multi-select**: Bulk operations with keyboard shortcuts
- **Search & Filter**: Find files by name and filter by type

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: System preference detection with manual toggle
- **Accessibility**: ARIA labels, keyboard navigation, focus management
- **Toast Notifications**: Real-time feedback for all operations
- **Empty States**: Helpful guidance when folders are empty

### 🔧 Technical Features
- **Angular 18+**: Latest features including signals and standalone components
- **TypeScript**: Strict typing throughout the application
- **Tailwind CSS**: Utility-first styling with configless setup
- **Mock Storage API**: Fully functional in-browser demo with sample data
- **REST API Ready**: Structured adapter pattern for easy backend integration

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:4200`

### Quick Tour
1. **Setup Page** (`/setup`): Configure your storage settings
2. **Storage Browser** (`/bucket`): Main admin interface

## Architecture

### Core Technologies
- **Angular 18+**: Standalone components, signals, new control flow (`@if`, `@for`, `@switch`)
- **TypeScript**: Strict mode with full type safety
- **Tailwind CSS v4**: Utility-first styling without configuration files
- **RxJS**: Reactive programming for async operations

### State Management
The app uses Angular signals for reactive state management:

- `ConfigStore`: Application settings and preferences
- `ObjectsStore`: File/folder data and UI state
- `UploadStore`: Upload queue and progress tracking

### API Layer
Clean separation between UI and data access:

```typescript
interface StorageApi {
  list(params: ListParams): Promise<{ items: ObjectItem[]; cursor?: string }>;
  createFolder(prefix: string): Promise<void>;
  rename(oldKey: string, newKey: string): Promise<void>;
  move(params: MoveParams): Promise<void>;
  delete(keys: string[]): Promise<void>;
  upload(key: string, file: File): Promise<ObjectItem>;
  getPublicUrl(key: string): string;
}
```

### Components Structure
```
src/
├── components/
│   ├── shell/           # App layout and routing
│   ├── setup/           # Configuration page
│   ├── bucket/          # Main storage interface
│   │   ├── sidebar.component.ts      # Folder tree navigation
│   │   ├── topbar.component.ts       # Search, upload, view controls
│   │   ├── content-area.component.ts # Main content container
│   │   ├── object-grid.component.ts  # Grid view
│   │   ├── object-list.component.ts  # List view
│   │   └── status-bar.component.ts   # Status and progress
│   └── ui/              # Reusable UI components
├── services/            # Business logic and API
├── types/               # TypeScript interfaces
└── utils/               # Helper functions
```

## API Integration

### Using Mock Storage (Default)
The app ships with a fully functional mock storage API that:
- Stores data in memory with optional localStorage persistence
- Simulates realistic latency and occasional errors
- Includes sample folder structure and images
- Perfect for development and demos

### Connecting Your Backend
To connect a real storage backend:

1. **Configure the REST adapter** in `/setup`:
   - Set your API base URL
   - Add authentication token
   - Switch from "Mock" to "REST" adapter

2. **Implement the endpoints** in your backend:
   ```
   GET    /objects?prefix=&cursor=&limit=     # List objects
   POST   /folders { prefix }                 # Create folder
   PUT    /objects/rename { oldKey, newKey }  # Rename item
   POST   /objects/move { fromKey, toKey }    # Move item
   DELETE /objects { keys: string[] }         # Delete items
   POST   /upload                             # Upload file
   GET    /objects/head?key=                  # Get metadata
   ```

3. **Update the REST adapter** in `src/services/rest-storage.api.ts`:
   - Remove the "Not implemented" throws
   - Add your HTTP calls using the provided structure
   - Handle authentication and error mapping

### Response Format
Your API should return objects matching this interface:
```typescript
interface ObjectItem {
  key: string;           // Object path/key
  isFolder: boolean;     // Is this a folder?
  size?: number;         // File size in bytes
  contentType?: string;  // MIME type
  lastModified?: string; // ISO date string
}
```

## Keyboard Shortcuts
- `Ctrl/Cmd + A`: Select all items
- `Ctrl/Cmd + U`: Open upload dialog
- `Delete`: Delete selected items
- `F2` or `R`: Rename selected item
- `M`: Move selected items
- `Escape`: Clear selection

## Customization

### Theming
The app supports light/dark themes with CSS custom properties:
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #0f172a;
  /* ... */
}

.dark {
  --bg-primary: #0f172a;
  --text-primary: #f8fafc;
  /* ... */
}
```

### Configuration
Adjust settings in the setup page or directly modify `ConfigStore`:
- Public base URL for file links
- API endpoints and authentication
- UI preferences (theme, view mode, page size)
- Persistence options

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Project Structure
- `src/components/`: All UI components organized by feature
- `src/services/`: Business logic and state management
- `src/types/`: TypeScript type definitions
- `src/utils/`: Helper functions and utilities

### Building for Production
```bash
npm run build
```

### Code Standards
- **Angular Style Guide**: Following official Angular conventions
- **TypeScript Strict**: No `any` types, strict null checks
- **Accessibility**: WCAG 2.1 AA compliance
- **Testing**: Unit tests with Jasmine/Karma (tests not included in this demo)

## License
MIT License - see LICENSE file for details

## Support
This is a demo application showcasing modern Angular development patterns. For production use, you'll need to implement the backend API and add proper error handling, validation, and security measures.

---

**Built with ❤️ using Angular 18+, TypeScript, and Tailwind CSS**