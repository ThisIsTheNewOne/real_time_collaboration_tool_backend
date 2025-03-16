import { useState, useEffect } from "react";
import { 
  getCurrentUser, 
  fetchDocuments as apiFetchDocuments,
  createDocument as apiCreateDocument,
  deleteDocument as apiDeleteDocument 
} from "@/lib/api";
import { Document } from "@/types";

export interface User {
  id: string;
  email: string;
  created_at: string;
}


export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

      // Fetch documents using the API function
      const data = await apiFetchDocuments(token);
      
      // Create creator map
      const ownerIds = new Set(data.map((doc: any) => doc.owner_id));
      const creatorMap: Record<string, string> = {};
      ownerIds.forEach((id: string) => {
        creatorMap[id] = id === userInfo.id ? "You" : "Other User";
      });
      
      setCreators(creatorMap);
      setDocuments(data as any);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (title: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    try {
      setError("");
      
      const visibility = "private";

      // Use the API function instead of direct fetch
      const newDoc = await apiCreateDocument(title, visibility, token);
      
      setDocuments(prev => [...prev, newDoc as any]);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const deleteDocument = async (docId: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
  
    try {
      setError("");
      await apiDeleteDocument(docId, token);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    createDocument,
    deleteDocument,
    currentUser,
    creators,
    refreshDocuments: fetchDocuments
  };
}