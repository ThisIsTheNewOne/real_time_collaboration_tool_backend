import { useState, useEffect } from "react";
import { setDocumentVisibility } from "@/lib/api";

export function useDocumentVisibility(
  initialVisibility: "public" | "private" | null,
  accessLevel: "owner" | "edit" | "view" | null,
  documentId: string,
  token: string,
  onVisibilityChange?: (visibility: "public" | "private") => void
) {
  const [visibility, setVisibility] = useState<"public" | "private" | null>(initialVisibility);
  const [visibilityUpdating, setVisibilityUpdating] = useState(false);

  // Ensure the visibility state updates correctly when prop changes
  useEffect(() => {
    setVisibility(initialVisibility);
  }, [initialVisibility]);

  const toggleVisibility = async () => {
    if (accessLevel !== "owner" || !visibility) return; // Ensure only owners can change visibility

    const newVisibility = visibility === "public" ? "private" : "public";
    setVisibilityUpdating(true);

    try {
      const result = await setDocumentVisibility(documentId, newVisibility, token);
      
      if (result.success) {
        setVisibility(newVisibility); // Update local state
        if (onVisibilityChange) {
          onVisibilityChange(newVisibility); // Propagate changes up
        }
      } else {
        console.error("Failed to update document visibility:", result);
      }
    } catch (error) {
      console.error("Failed to update document visibility:", error);
    } finally {
      setVisibilityUpdating(false);
    }
  };

  return { visibility, visibilityUpdating, toggleVisibility };
}
