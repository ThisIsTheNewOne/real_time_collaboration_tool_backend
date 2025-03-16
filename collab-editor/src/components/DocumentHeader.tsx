import { setDocumentVisibility } from '@/lib/api';
import { useState, useRef, useEffect } from 'react';

type AccessLevel = "owner" | "edit" | "view" | null;
type Visibility = "public" | "private" | null;


interface DocumentHeaderProps {
    title: string;
    status: string;
    canEdit: boolean;
    connected: boolean;
    accessLevel: AccessLevel;
    documentId: string; // Added for API calls
    token: string;      // Added for API calls
    visibility: Visibility; // Added to show current visibility
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
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState(title);
    const [isChangingVisibility, setIsChangingVisibility] = useState(false);
    const [visibilityUpdating, setVisibilityUpdating] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setTitleInput(title);
  }, [title]);

  
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);
  
  const startEditingTitle = () => {
    if (!canEdit) return;
    setIsEditingTitle(true);
  };
  
  const saveTitle = () => {
    if (!canEdit) return;
    setIsEditingTitle(false);
    
    if (titleInput !== title) {
      onTitleChange(titleInput);
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingTitle(false);
      setTitleInput(title);
    }
  };

  // Toggle visibility between public and private
  const toggleVisibility = async () => {
    if (accessLevel !== 'owner' || !visibility) return;
    
    const newVisibility = visibility === 'public' ? 'private' : 'public';
    setIsChangingVisibility(true);
    setVisibilityUpdating(true);
    
    try {
      const result = await setDocumentVisibility(documentId, newVisibility, token);
      
      if (result.success && onVisibilityChange) {
        onVisibilityChange(newVisibility);
      }
    } catch (error) {
      console.error('Failed to update document visibility:', error);
    } finally {
      setVisibilityUpdating(false);
      setIsChangingVisibility(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        {isEditingTitle ? (
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
            className={`text-xl font-semibold ${canEdit ? 'cursor-pointer hover:text-blue-600' : ''}`}
            onClick={startEditingTitle}
          >
            {title || 'Untitled Document'}
            {canEdit && <span className="text-xs text-gray-400 ml-2">(Click to edit)</span>}
          </h1>
        )}
        <p className="text-sm text-gray-500">{status}</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Visibility indicator and toggle */}
        <div className="flex items-center">
          <span className="text-sm mr-2">Visibility:</span>
          {visibility === null ? (
            <div className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600 flex items-center">
              <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
              Loading...
            </div>
          ) : (
            <div 
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                visibility === 'public' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              } ${accessLevel === 'owner' ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
              onClick={accessLevel === 'owner' && !visibilityUpdating ? toggleVisibility : undefined}
            >
              {visibilityUpdating ? (
                <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    {visibility === 'public' ? (
                      <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    ) : (
                      <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span>
                    {visibility === 'public' ? 'Public' : 'Private'}
                    {accessLevel === 'owner' && <span className="text-xs ml-1">(Click to toggle)</span>}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Connection status */}
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {/* User role badge */}
        {accessLevel && (
          <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">
            {accessLevel === 'owner' ? 'Owner' : accessLevel === 'edit' ? 'Editor' : 'Viewer'}
          </div>
        )}
      </div>
    </div>
  );
}