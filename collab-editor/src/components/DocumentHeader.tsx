"use client";

import { useEditableTitle } from "@/hooks/useEditableTitle";
import { useDocumentVisibility } from "@/hooks/useDocumentVisibility";
import Button from "./atomic/Button";

interface DocumentHeaderProps {
  title: string;
  status: string;
  canEdit: boolean;
  connected: boolean;
  accessLevel: "owner" | "edit" | "view" | null;
  documentId: string;
  token: string;
  visibility: "public" | "private" | null;
  onTitleChange: (newTitle: string) => void;
  onVisibilityChange?: (visibility: "public" | "private") => void;
}

export default function DocumentHeader({ 
  title, 
  status, 
  canEdit, 
  connected, 
  accessLevel,
  documentId,
  token,
  visibility,
  onTitleChange,
  onVisibilityChange
}: DocumentHeaderProps) {

  const {
    isEditingTitle,
    titleInput,
    titleInputRef,
    startEditingTitle,
    saveTitle,
    handleTitleChange,
    handleTitleKeyDown,
  } = useEditableTitle(title, onTitleChange, canEdit);

  const { visibility: currentVisibility, visibilityUpdating, toggleVisibility } = 
    useDocumentVisibility(visibility, accessLevel, documentId, token, onVisibilityChange);

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        {isEditingTitle && accessLevel === "owner" ? (
          <input
            ref={titleInputRef}
            type="text"
            className="text-xl font-semibold border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full max-w-md"
            value={titleInput}
            onChange={handleTitleChange}
            onBlur={saveTitle}
            onKeyDown={handleTitleKeyDown}
          />
        ) : (
          <h1 
            className={`text-xl font-semibold ${canEdit && accessLevel === "owner" ? 'cursor-pointer hover:text-blue-600' : ''}`}
            onClick={startEditingTitle}
          >
            {title || 'Untitled Document'}
            {canEdit && accessLevel === "owner" && <span className="text-xs text-gray-400 ml-2">(Click to edit)</span>}
          </h1>
        )}
        <p className="text-sm text-gray-500">{status}</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Visibility Toggle */}
        <div className="flex items-center">
          <span className="text-sm mr-2">Visibility:</span>
          <Button
            variant={currentVisibility === "public" ? "secondary" : "tertiary"}
            size="sm"
            onClick={toggleVisibility}
            disabled={accessLevel !== "owner" || visibilityUpdating}
            className={currentVisibility === "public" 
              ? "!bg-green-100 !text-green-800 hover:!bg-green-200" 
              : "!bg-yellow-100 !text-yellow-800 hover:!bg-yellow-200"
            }
            isLoading={visibilityUpdating}
          >
            {currentVisibility === "public" ? "Public" : "Private"}
            {accessLevel === "owner" && !visibilityUpdating && <span className="text-xs ml-1">(Click to toggle)</span>}
          </Button>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${connected ? "bg-green-500" : "bg-red-500"}`}></span>
          <span>{connected ? "Connected" : "Disconnected"}</span>
        </div>
        
        {/* User Role Badge */}
        {accessLevel && (
          <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">
            {accessLevel === "owner" ? "Owner" : accessLevel === "edit" ? "Editor" : "Viewer"}
          </div>
        )}
      </div>
    </div>
  );
}