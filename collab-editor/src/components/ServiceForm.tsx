import React, { useState, useEffect, useCallback } from 'react';
import AttachmentField from './AttachmentField';

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
  options?: string[];
  value?: any;
}

interface ServiceFormProps {
  fields: FormField[];
  onSubmit: (formData: Record<string, any>) => void;
  onFieldChange: (fieldId: string, value: any) => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ fields, onSubmit, onFieldChange }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasAttachmentField, setHasAttachmentField] = useState(false);

  // Check if form has attachment fields
  useEffect(() => {
    const hasAttachment = fields.some(field => field.jiraSchema.system === "attachment");
    setHasAttachmentField(hasAttachment);
  }, [fields]);

  // Global paste event listener for attachment fields
  useEffect(() => {
    if (!hasAttachmentField) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Only handle paste if it contains files
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        e.preventDefault();
        
        // Find the first attachment field and paste files there
        const attachmentField = fields.find(field => field.jiraSchema.system === "attachment");
        if (attachmentField) {
          const files = Array.from(e.clipboardData.files);
          handleFieldChange(attachmentField.id, files);
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [hasAttachmentField, fields]);

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    onFieldChange(fieldId, value);
  }, [onFieldChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field: FormField) => {
    switch (field.jiraSchema.system) {
      case 'attachment':
        return (
          <AttachmentField
            key={field.id}
            field={field}
            value={formData[field.id] || []}
            onChange={(value) => handleFieldChange(field.id, value)}
          />
        );
      case 'text':
      case 'string':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              id={field.id}
              name={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={field.id}
              name={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      case 'select':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={field.id}
              name={field.id}
              value={formData[field.id] || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasAttachmentField && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            📋 Copy-paste is enabled for attachments. You can use Ctrl+C and Ctrl+V to copy and paste files.
          </p>
        </div>
      )}
      
      {fields.map(field => renderField(field))}
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;