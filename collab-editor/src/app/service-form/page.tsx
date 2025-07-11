'use client';

import { useState } from 'react';
import ServiceForm from '@/components/ServiceForm';

interface FormField {
  id: string;
  name: string;
  type: string;
  jiraSchema: {
    system: string;
    type?: string;
    required?: boolean;
  };
  required?: boolean;
  options?: string[];
}

export default function ServiceFormDemo() {
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Sample form configuration with attachment field
  const formFields: FormField[] = [
    {
      id: 'title',
      name: 'Issue Title',
      type: 'text',
      jiraSchema: { system: 'text' },
      required: true
    },
    {
      id: 'description',
      name: 'Description',
      type: 'textarea',
      jiraSchema: { system: 'textarea' },
      required: true
    },
    {
      id: 'priority',
      name: 'Priority',
      type: 'select',
      jiraSchema: { system: 'select' },
      options: ['Low', 'Medium', 'High', 'Critical'],
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

  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form submitted:', data);
    alert('Form submitted successfully! Check the console for details.');
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Service Form with Copy-Paste Attachments
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Features Demonstrated:</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>✅ Dynamic form field rendering</li>
              <li>✅ Conditional copy-paste activation (only when attachment fields exist)</li>
              <li>✅ Drag and drop file upload</li>
              <li>✅ Keyboard shortcuts (Ctrl+C and Ctrl+V)</li>
              <li>✅ File validation (JPEG, PNG, GIF, PDF, TXT, CSV)</li>
              <li>✅ Visual feedback for paste operations</li>
              <li>✅ Toast notifications for success/error states</li>
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">How to Test:</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Notice the blue copy-paste notification banner above the form</li>
              <li>Try copying files (Ctrl+C) and pasting them (Ctrl+V)</li>
              <li>Drag and drop files into the attachment area</li>
              <li>Click "Choose Files" to select files manually</li>
              <li>Try invalid file types to see validation errors</li>
            </ol>
          </div>

          <ServiceForm
            fields={formFields}
            onSubmit={handleSubmit}
            onFieldChange={handleFieldChange}
          />

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Current Form Data:</h3>
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}