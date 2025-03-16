import { DocumentPermission } from "@/types";
import { useState } from "react";
import { removeDocumentPermission } from "@/lib/api";

interface PermissionsTableProps {
  permissions: DocumentPermission[];
  isLoading: boolean;
  documentId: string;
  token: string;
  onPermissionRemoved?: (userId: string) => void;
}

export default function PermissionsTable({ 
  permissions, 
  isLoading, 
  documentId, 
  token,
  onPermissionRemoved 
}: PermissionsTableProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemovePermission = async (userId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to remove access for ${userEmail}?`)) {
      try {
        setRemovingId(userId);
        setError(null);

        const result = await removeDocumentPermission(documentId, userId, token);
        
        if (result.success) {
          // Notify parent component to update the permissions list
          if (onPermissionRemoved) {
            onPermissionRemoved(userId);
          }
        } else {
          setError("Failed to remove permission: " + result.message);
        }
      } catch (err) {
        console.error("Error removing permission:", err);
        setError("An error occurred while removing permission");
      } finally {
        setRemovingId(null);
      }
    }
  };

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-medium mb-2">Document Permissions</h3>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-3 mb-4 rounded-md text-sm">
          {error}
          <button 
            className="ml-2 text-red-900 hover:underline" 
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading permissions...</p>
      ) : permissions.length > 0 ? (
        <div className="overflow-y-auto max-h-64">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.id} className={removingId === permission.id ? "opacity-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {permission.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      permission.permission_level === 'edit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {permission.permission_level === 'edit' ? 'Editor' : 'Viewer'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleRemovePermission(permission.id, permission.email)}
                      disabled={removingId === permission.id}
                    >
                      {removingId === permission.id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Removing
                        </span>
                      ) : (
                        "Remove"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">This document is not shared with anyone.</p>
      )}
    </div>
  );
}