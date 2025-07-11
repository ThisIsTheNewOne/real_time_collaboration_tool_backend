import React, { useState, useRef, useCallback } from 'react';

interface JiraSchema {
  system: string;
  type?: string;
  required?: boolean;
}

interface FormField {
  id: string;
  name: string;
  type: string;
  jiraSchema: JiraSchema;
  required?: boolean;
}

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

interface AttachmentFieldProps {
  field: FormField;
  value: AttachmentFile[];
  onChange: (files: AttachmentFile[]) => void;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'text/csv'];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AttachmentField: React.FC<AttachmentFieldProps> = ({ field, value, onChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToastMessage = (message: string, type: 'success' | 'error') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not allowed. Allowed types: JPEG, PNG, GIF, PDF, TXT, CSV`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/support/upload-attachment', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, url: result.url };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (value.length + fileArray.length > MAX_FILES) {
      showToastMessage(`Cannot add more than ${MAX_FILES} files`, 'error');
      return;
    }

    const newFiles: AttachmentFile[] = [];
    const invalidFiles: string[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        invalidFiles.push(`${file.name}: ${validationError}`);
        continue;
      }

      const attachmentFile: AttachmentFile = {
        id: `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending'
      };

      newFiles.push(attachmentFile);
    }

    if (invalidFiles.length > 0) {
      showToastMessage(`Invalid files: ${invalidFiles.join(', ')}`, 'error');
    }

    if (newFiles.length === 0) return;

    // Add files to state immediately
    const updatedFiles = [...value, ...newFiles];
    onChange(updatedFiles);

    // Upload files
    for (const attachmentFile of newFiles) {
      const fileToUpload = fileArray.find(f => f.name === attachmentFile.name);
      if (!fileToUpload) continue;

      // Update status to uploading
      attachmentFile.status = 'uploading';
      onChange([...value, ...newFiles]);

      // Upload file
      const result = await uploadFile(fileToUpload);
      
      if (result.success) {
        attachmentFile.status = 'success';
        attachmentFile.url = result.url;
        showToastMessage(`${attachmentFile.name} uploaded successfully`, 'success');
      } else {
        attachmentFile.status = 'error';
        attachmentFile.error = result.error;
        showToastMessage(`Failed to upload ${attachmentFile.name}: ${result.error}`, 'error');
      }

      // Update state
      onChange([...value, ...newFiles]);
    }
  }, [value, onChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = value.filter(file => file.id !== fileId);
    onChange(updatedFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('text/')) return '📝';
    return '📎';
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📎';
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
        {field.name}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <div className="space-y-2">
          <div className="text-gray-600">
            <p className="text-lg">📎 Drop files here or click to browse</p>
            <p className="text-sm">You can also paste files using Ctrl+V</p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Supported formats: JPEG, PNG, GIF, PDF, TXT, CSV</p>
            <p>Maximum {MAX_FILES} files, {MAX_FILE_SIZE / (1024 * 1024)}MB per file</p>
          </div>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Choose Files
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>

      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Attached Files:</h4>
          {value.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  {file.error && (
                    <p className="text-xs text-red-500">{file.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-lg" title={file.status}>
                  {getStatusIcon(file.status)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showToast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          showToast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {showToast.message}
        </div>
      )}
    </div>
  );
};

export default AttachmentField;