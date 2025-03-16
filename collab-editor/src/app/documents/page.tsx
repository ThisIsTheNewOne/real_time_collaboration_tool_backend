"use client";

import { useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import ErrorAlert from "./components/ErrorAlert";
import DocumentCreationForm from "./components/DocumentCreationForm";
import DocumentList from "./components/DocumentList";


export default function DocumentsPage() {
  const {
    documents,
    loading,
    error,
    createDocument,
    deleteDocument,
    currentUser,
    creators
  } = useDocuments();
  
  // Clear error message
  const clearError = () => setErrorMsg("");
  const [errorMsg, setErrorMsg] = useState(error);
  
  // Separate documents by visibility
  const privateDocuments = documents.filter(doc => doc.visibility === 'private');
  const publicDocuments = documents.filter(doc => doc.visibility === 'public');

  // Icons for document sections
  const privateIcon = (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
    </svg>
  );
  
  const publicIcon = (
    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Documents</h1>

      <ErrorAlert message={errorMsg || error} onDismiss={clearError} />

      <DocumentCreationForm onCreateDocument={createDocument} />

      {documents.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-600 mb-2">No documents yet</h3>
          <p className="text-gray-500">Create your first document using the form above!</p>
        </div>
      ) : (
        <div className="space-y-8">
          <DocumentList
            title="Private Documents"
            icon={privateIcon}
            documents={privateDocuments}
            currentUser={currentUser}
            creators={creators}
            onDeleteDocument={deleteDocument}
            emptyMessage="No private documents."
          />

          <DocumentList
            title="Public Documents"
            icon={publicIcon}
            documents={publicDocuments}
            currentUser={currentUser}
            creators={creators}
            onDeleteDocument={deleteDocument}
            emptyMessage="No public documents."
          />
        </div>
      )}
    </div>
  );
}