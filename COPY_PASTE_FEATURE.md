# Copy-Paste Attachment Feature Implementation

This implementation adds a copy-paste feature for attachments in a dynamic form system that only activates when attachment fields are present.

## Features Implemented

### ✅ Core Requirements
- **Dynamic Form Field Rendering**: ServiceForm component renders fields based on `jiraSchema.system`
- **Conditional Activation**: Copy-paste only enabled when `field.jiraSchema.system === "attachment"` fields exist
- **Keyboard Shortcuts**: Ctrl+C and Ctrl+V functionality for file operations
- **File Validation**: Supports JPEG, PNG, GIF, PDF, TXT, CSV with size limits
- **Visual Feedback**: Blue notification banner when copy-paste is active
- **Error Handling**: Toast notifications for upload status and validation errors

### ✅ Technical Implementation
- **ServiceForm Component**: Main form component with dynamic field rendering
- **AttachmentField Component**: Specialized component for file uploads with drag-and-drop
- **Backend API**: `/api/support/upload-attachment` endpoint for file uploads
- **State Management**: Proper tracking of file upload status and form data
- **Event Listeners**: Global paste event handling with cleanup on unmount

## Components

### ServiceForm (`/src/components/ServiceForm.tsx`)
- Renders dynamic form fields based on configuration
- Detects attachment fields and conditionally enables copy-paste
- Handles global paste events for files
- Provides visual feedback with notification banner

### AttachmentField (`/src/components/AttachmentField.tsx`)
- Drag-and-drop file upload interface
- File validation and size checking
- Upload progress tracking with visual indicators
- Paste event handling for direct file operations
- Toast notifications for user feedback

### Backend Support (`/src/routes/support.ts`)
- File upload endpoint with multer middleware
- File type and size validation
- Secure file storage with unique naming
- File serving and management endpoints

## Usage

### Basic Usage
```tsx
import ServiceForm from '@/components/ServiceForm';

const fields = [
  {
    id: 'title',
    name: 'Title',
    type: 'text',
    jiraSchema: { system: 'text' },
    required: true
  },
  {
    id: 'attachments',
    name: 'Attachments',
    type: 'attachment',
    jiraSchema: { system: 'attachment' },
    required: false
  }
];

<ServiceForm
  fields={fields}
  onSubmit={handleSubmit}
  onFieldChange={handleFieldChange}
/>
```

### Field Configuration
- `jiraSchema.system`: Determines field type rendering
  - `"text"` - Text input
  - `"textarea"` - Textarea
  - `"select"` - Select dropdown
  - `"attachment"` - File upload component

### File Upload Configuration
- **Supported formats**: JPEG, PNG, GIF, PDF, TXT, CSV
- **Maximum files**: 5 files per field
- **File size limit**: 10MB per file
- **Upload endpoint**: `/api/support/upload-attachment`

## Testing

### Demo Pages
- `/service-form` - Form with attachment fields (copy-paste enabled)
- `/service-form-no-attachments` - Form without attachment fields (copy-paste disabled)

### Test Cases
1. **Conditional Activation**: Copy-paste banner only appears with attachment fields
2. **File Validation**: Invalid file types and sizes are rejected
3. **Upload Handling**: Files are processed through upload pipeline
4. **Error Handling**: Validation errors and upload failures are handled gracefully
5. **State Management**: Form data is tracked and updated correctly

## File Structure
```
src/
├── components/
│   ├── ServiceForm.tsx           # Main form component
│   ├── AttachmentField.tsx       # File upload component
│   └── __tests__/
│       └── ServiceForm.test.js   # Basic unit tests
├── app/
│   ├── service-form/
│   │   └── page.tsx              # Demo with attachments
│   └── service-form-no-attachments/
│       └── page.tsx              # Demo without attachments
└── routes/
    └── support.ts                # Backend file upload API
```

## Installation

1. Install dependencies:
```bash
npm install multer uuid @types/multer @types/uuid
```

2. Start the development servers:
```bash
# Frontend
npm run dev

# Backend
npm run dev
```

3. Visit the demo pages:
- http://localhost:3000/service-form
- http://localhost:3000/service-form-no-attachments

## Key Features Demonstrated

1. **Conditional Copy-Paste**: Only activates when attachment fields exist
2. **Dynamic Field Rendering**: Supports multiple field types
3. **File Upload Integration**: Drag-and-drop and manual selection
4. **Validation**: File type and size restrictions
5. **Error Handling**: User-friendly error messages
6. **Visual Feedback**: Status indicators and notifications
7. **State Management**: Real-time form data tracking

## Screenshots

### With Attachment Fields
- Shows blue notification banner
- Displays drag-and-drop area
- File upload functionality active

### Without Attachment Fields
- No copy-paste notification
- Standard form fields only
- Copy-paste functionality disabled

The implementation successfully meets all requirements while maintaining backward compatibility and providing a seamless user experience.