import {  User } from "@/hooks/useDocuments";
import DocumentItem from "./DocumentItem";
import { Document } from "@/types";


interface DocumentListProps {
  title: string;
  icon: React.ReactNode;
  documents: Document[];
  currentUser: User | null;
  creators: Record<string, string>;
  onDeleteDocument: (id: string) => Promise<boolean>;
  emptyMessage: string;
}

export default function DocumentList({
  title,
  icon,
  documents,
  currentUser,
  creators,
  onDeleteDocument,
  emptyMessage
}: DocumentListProps) {
  const getCreatorDisplay = (ownerId: string) => {
    if (!currentUser) return "Unknown";
    return ownerId === currentUser.id ? "You" : creators[ownerId] || "Other User";
  };
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        {icon}
        {title} ({documents.length})
      </h2>
      
      <div className="space-y-4 mb-8">
        {documents.length === 0 ? (
          <p className="text-gray-500 italic">{emptyMessage}</p>
        ) : (
          documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              currentUser={currentUser}
              creatorName={getCreatorDisplay(doc.owner_id)}
              onDelete={onDeleteDocument}
            />
          ))
        )}
      </div>
    </div>
  );
}