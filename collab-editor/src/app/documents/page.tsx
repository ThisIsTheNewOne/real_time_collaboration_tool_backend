"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/api";

interface Document {
  created_at: string;
  data: { title: string; content: string };
  id: string;
  owner_id: string;
  visibility: string;
  creator_email?: string; // Added field for creator email
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [creators, setCreators] = useState<Record<string, string>>({});

  const fetchDocuments = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      // Get current user info
      const userInfo = await getCurrentUser(token);
      setCurrentUser(userInfo);

      // Fetch documents
      const response = await fetch("http://localhost:5000/api/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      
      // Collect unique owner IDs from documents
      const ownerIds = new Set(data.map((doc: Document) => doc.owner_id));
      
      // For now, we'll just mark current user's documents
      const creatorMap: Record<string, string> = {};
      ownerIds.forEach((id: any) => {
        creatorMap[id] = id === userInfo.id ? "You" : "Other User";
      });
      
      setCreators(creatorMap);
      setDocuments(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch("http://localhost:5000/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error("Failed to create document");
      }

      const newDoc = await response.json();
      setDocuments([...documents, newDoc]);
      setNewTitle("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const deleteDocument = async (docId: string) => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/documents/${docId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
    } catch (err) {
      console.error("Error deleting document:", err);
      setError((err as Error).message);
    }
  };

  // Separate documents by visibility
  const privateDocuments = documents.filter(doc => doc.visibility === 'private');
  const publicDocuments = documents.filter(doc => doc.visibility === 'public');

  // Get creator display name
  const getCreatorDisplay = (ownerId: string) => {
    if (!currentUser) return "Unknown";
    return ownerId === currentUser.id ? "You" : creators[ownerId] || "Other User";
  };

  if (loading) return <div className="p-8">Loading documents...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Documents</h1>

      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={createDocument} className="mb-8 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Document title"
          className="flex-1 px-3 py-2 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Document
        </button>
      </form>

      {documents.length === 0 ? (
        <p>No documents yet. Create your first document above!</p>
      ) : (
        <div className="space-y-8">
          {/* PRIVATE DOCUMENTS SECTION */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              Private Documents ({privateDocuments.length})
            </h2>
            
            <div className="space-y-4 mb-8">
              {privateDocuments.length === 0 ? (
                <p className="text-gray-500 italic">No private documents.</p>
              ) : (
                privateDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-4 border rounded hover:bg-gray-50 border-yellow-200"
                  >
                    <Link href={`/documents/${doc.id}`} className="flex-1">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {doc.data.title || "Untitled Document"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()} · Private
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PUBLIC DOCUMENTS SECTION */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Public Documents ({publicDocuments.length})
            </h2>
            
            <div className="space-y-4">
              {publicDocuments.length === 0 ? (
                <p className="text-gray-500 italic">No public documents.</p>
              ) : (
                publicDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-4 border rounded hover:bg-gray-50 border-green-200"
                  >
                    <Link href={`/documents/${doc.id}`} className="flex-1">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {doc.data.title || "Untitled Document"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                          <span>·</span>
                          <p>Public</p>
                          <span>·</span>
                          <p className="font-medium">
                            Created by: {getCreatorDisplay(doc.owner_id)}
                            {doc.owner_id === currentUser?.id && (
                              <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">You</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                    {doc.owner_id === currentUser?.id && (
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}