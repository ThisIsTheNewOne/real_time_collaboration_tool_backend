import { useEffect, useState } from "react";
import { getDocumentPermissions } from "@/lib/api";
import { DocumentPermission } from "@/types";

export function useDocumentPermissions(documentId: string, token: string, accessLevel: string | null) {
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    if (accessLevel === "owner") {
      const fetchPermissions = async () => {
        setLoadingPermissions(true);
        try {
          const permissionsData = await getDocumentPermissions(documentId, token);
          setPermissions(permissionsData);
        } catch (error) {
          console.error("Failed to fetch permissions:", error);
        } finally {
          setLoadingPermissions(false);
        }
      };

      fetchPermissions();
    }
  }, [accessLevel, documentId, token]);

  return { permissions, loadingPermissions };
}
