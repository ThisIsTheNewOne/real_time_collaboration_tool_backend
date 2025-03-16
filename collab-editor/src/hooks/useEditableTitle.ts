import { useState, useRef, useEffect } from "react";

export function useEditableTitle(initialTitle: string, onTitleChange: (newTitle: string) => void, canEdit: boolean) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(initialTitle);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleInput(initialTitle);
  }, [initialTitle]);

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
    
    if (titleInput !== initialTitle) {
      onTitleChange(titleInput);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditingTitle(false);
      setTitleInput(initialTitle);
    }
  };

  return {
    isEditingTitle,
    titleInput,
    titleInputRef,
    startEditingTitle,
    saveTitle,
    handleTitleChange,
    handleTitleKeyDown,
  };
}
