"use client";

import { getDocumentPermissions, updateDocument } from "@/lib/api";
import { DocumentPermission } from "@/types";
import { useEffect, useState, useRef, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";
import DocumentHeader from "./DocumentHeader";
import PermissionsTable from "./PermissionsTable";

interface DocumentEditorProps {
  documentId: string;
  token: string;
}

type AccessLevel = "owner" | "edit" | "view" | null;

export default function DocumentEditor({
  documentId,
  token,
}: DocumentEditorProps) {
  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [title, setTitle] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(null);
  const [canEdit, setCanEdit] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState("Connecting...");
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  useEffect(() => {
    // Create socket connection
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        transports: ["websocket"],
      }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setStatus("Connected");
      console.log("Socket connected");

      // Join the document
      socket.emit("join-document", documentId, token);
    });

    socket.on("error", (error: any) => {
      setStatus(`Error: ${error}`);
      console.error("Socket error:", error);
    });

    socket.on(
      "document-content",
      (data: {
        content: any;
        title: any;
        access_level: AccessLevel;
        can_edit: boolean;
      }) => {
        console.log("Document loaded:", data);
        setContent(data.content || "");
        setTitle(data.title || "");
        setAccessLevel(data.access_level);
        setCanEdit(data.can_edit || false);
        setStatus("Document loaded");
      }
    );

    socket.on("text-change", (delta: { content: SetStateAction<string>; title?: string }) => {
      console.log("Received text change:", delta);
      if (delta.content) {
        setContent(delta.content);
      }
      if (delta.title) {
        setTitle(delta.title);
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId, token]);

  // Fetch permissions when the document is loaded and we know we're the owner
  useEffect(() => {
    const fetchPermissions = async () => {
      if (accessLevel === 'owner') {
        try {
          setLoadingPermissions(true);
          const permissionsData = await getDocumentPermissions(documentId, token);
          setPermissions(permissionsData);
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
        } finally {
          setLoadingPermissions(false);
        }
      }
    };

    fetchPermissions();
  }, [accessLevel, documentId, token]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Don't allow changes if user doesn't have edit permission
    if (!canEdit) return;

    const newContent = e.target.value;
    setContent(newContent);

    // Send changes to server
    if (socketRef.current) {
      socketRef.current.emit("text-change", {
        title,
        content: newContent,
      });
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (newTitle !== title) {
      setTitle(newTitle);
      
      try {
        // Update title via API
        await updateDocument(documentId, { title: newTitle }, token);
        
        // Send title update to other connected clients
        if (socketRef.current) {
          socketRef.current.emit("text-change", {
            title: newTitle,
            content,
          });
        }
      } catch (error) {
        console.error("Failed to update title:", error);
        // We don't need to revert the title here as the DocumentHeader component manages its own state
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <DocumentHeader
        title={title}
        status={status}
        canEdit={canEdit}
        connected={connected}
        accessLevel={accessLevel}
        onTitleChange={handleTitleChange}
      />
      
      <textarea
        className="flex-1 p-4 w-full resize-none focus:outline-none border-0"
        value={content}
        onChange={handleContentChange}
        placeholder={canEdit ? "Start writing..." : "You don't have permission to edit this document."}
        readOnly={!canEdit}
      />
      
      {!canEdit && (
        <div className="bg-yellow-50 p-2 text-center text-yellow-800 border-t border-yellow-100">
          You have view-only access to this document
        </div>
      )}

      {/* Display permissions section if the user is the owner */}
      {accessLevel === 'owner' && (
        <PermissionsTable 
          permissions={permissions}
          isLoading={loadingPermissions}
        />
      )}
    </div>
  );
}