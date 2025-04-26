import { useState } from "react";
import Button from "@/components/atomic/Button";

interface DocumentCreationFormProps {
  onCreateDocument: (title: string) => Promise<boolean>;
}

export default function DocumentCreationForm({ onCreateDocument }: DocumentCreationFormProps) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    const success = await onCreateDocument(title);
    if (success) {
      setTitle("");
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Document title"
        className="flex-1 px-3 py-2 border border-gray-300 rounded"
        required
        disabled={isSubmitting}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting}
        isLoading={isSubmitting}
      >
        Create Document
      </Button>
    </form>
  );
}