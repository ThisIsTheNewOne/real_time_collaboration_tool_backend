import { useState, useRef, useEffect } from 'react';

type AccessLevel = "owner" | "edit" | "view" | null;

interface DocumentHeaderProps {
  title: string;
  status: string;
  canEdit: boolean;
  connected: boolean;
  accessLevel: AccessLevel;
  onTitleChange: (newTitle: string) => void;
}

export default function DocumentHeader({ 
  title, 
  status, 
  canEdit, 
  connected, 
  accessLevel,
  onTitleChange 
}: DocumentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(title);
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
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {accessLevel && (
          <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">
            {accessLevel === 'owner' ? 'Owner' : accessLevel === 'edit' ? 'Editor' : 'Viewer'}
          </div>
        )}
      </div>
    </div>
  );
}