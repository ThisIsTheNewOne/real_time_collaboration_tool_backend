import { useState, useMemo } from "react";
import { User } from "@/hooks/useDocuments";
import DocumentItem from "./DocumentItem";
import { Document } from "@/types";
import Button from "@/components/atomic/Button";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isRegexValid, setIsRegexValid] = useState(true);
  
  const getCreatorDisplay = (ownerId: string) => {
    if (!currentUser) return "Unknown";
    return ownerId === currentUser.id ? "You" : creators[ownerId] || "Other User";
  };
  
  // Filter documents based on search query using regex
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    
    try {
      const regex = new RegExp(searchQuery, 'i'); // case insensitive search
      setIsRegexValid(true);
      
      return documents.filter(doc => {
        // Search in title
        if (regex.test(doc.data.title || "")) return true;
        
        // Search in content (if available)
        if (doc.data.content && regex.test(doc.data.content)) return true;
        
        // Search by creator name
        const creatorName = getCreatorDisplay(doc.owner_id);
        if (regex.test(creatorName)) return true;
        
        return false;
      });
    } catch (e) {
      // Invalid regex expression
      setIsRegexValid(false);
      return documents;
    }
  }, [documents, searchQuery, creators, currentUser]);
  
  const clearSearch = () => setSearchQuery("");
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        {icon}
        {title} ({documents.length})
      </h2>
      
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="search" 
            className={`block w-full p-2 pl-10 pr-10 text-sm border ${!isRegexValid ? 'border-red-500' : 'border-gray-300'} rounded-lg bg-white`}
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button 
              onClick={clearSearch}
              variant="ghost"
              size="sm"
              className="absolute inset-y-0 right-0 flex items-center pr-3 h-full !p-0 !bg-transparent"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
        {!isRegexValid && (
          <p className="mt-1 text-sm text-red-600">
            Invalid regex pattern. Please check your syntax.
          </p>
        )}
        {searchQuery && isRegexValid && (
          <p className="mt-1 text-sm text-gray-600">
            Found {filteredDocuments.length} {filteredDocuments.length === 1 ? 'result' : 'results'}
          </p>
        )}
      </div>
      
      <div className="space-y-4 mb-8">
        {filteredDocuments.length === 0 ? (
          <p className="text-gray-500 italic">
            {searchQuery ? "No documents match your search." : emptyMessage}
          </p>
        ) : (
          filteredDocuments.map((doc) => (
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
      
      {searchQuery && filteredDocuments.length > 0 && documents.length > filteredDocuments.length && (
        <div className="flex justify-center">
          <Button 
            onClick={clearSearch}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
          >
            Clear search and show all {documents.length} documents
          </Button>
        </div>
      )}
    </div>
  );
}