"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Document {
  created_at: string;
  data: { title: string; content: string };
  id: string;
  owner_id: string;
  visibility: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const fetchDocuments = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/documents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
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

      <div className="space-y-4">
        {documents.length === 0 ? (
          <p>No documents yet. Create your first document above!</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex justify-between items-center p-4 border rounded hover:bg-gray-50"
            >
              <Link href={`/documents/${doc.id}`} className="flex-1">
                <h2 className="text-xl font-semibold">
                  {doc.data.title || "Untitled Document"}
                </h2>
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
  );
}
