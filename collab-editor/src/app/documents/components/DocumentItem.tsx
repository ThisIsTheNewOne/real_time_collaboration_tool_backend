import Link from "next/link";
import {  User } from "@/hooks/useDocuments";
import { useState } from "react";
import { Document } from "@/types";


interface DocumentItemProps {
  document: Document;
  currentUser: User | null;
  creatorName: string;
  onDelete: (id: string) => Promise<boolean>;
}

export default function DocumentItem({ document, currentUser, creatorName, onDelete }: DocumentItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = document.owner_id === currentUser?.id;
  const isPrivate = document.visibility === 'private';
  
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this document?")) {
      setIsDeleting(true);
      await onDelete(document.id);
      setIsDeleting(false);
    }
  };
  
  return (
    <div
      className={`flex justify-between items-center p-4 border rounded hover:bg-gray-50 ${
        isPrivate ? "border-yellow-200" : "border-green-200"
      }`}
    >
      <Link href={`/documents/${document.id}`} className="flex-1">
        <div>
          <h3 className="text-xl font-semibold">
            {document.data.title || "Untitled Document"}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <p>{new Date(document.created_at).toLocaleDateString()}</p>
            <span>·</span>
            <p>{isPrivate ? "Private" : "Public"}</p>
            
            {!isPrivate && (
              <>
                <span>·</span>
                <p className="font-medium">
                  Created by: {creatorName}
                  {isOwner && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">You</span>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </Link>
      
      {(isOwner || isPrivate) && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      )}
    </div>
  );
}