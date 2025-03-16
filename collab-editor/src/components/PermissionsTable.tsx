import { DocumentPermission } from "@/types";

interface PermissionsTableProps {
  permissions: DocumentPermission[];
  isLoading: boolean;
}

export default function PermissionsTable({ permissions, isLoading }: PermissionsTableProps) {
  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-medium mb-2">Document Permissions</h3>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading permissions...</p>
      ) : permissions.length > 0 ? (
        <div className="overflow-y-auto max-h-64">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permission.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      permission.permission_level === 'edit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {permission.permission_level === 'edit' ? 'Editor' : 'Viewer'}
                    </span>
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