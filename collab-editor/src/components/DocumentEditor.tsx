"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getDocumentPermissions, updateDocument } from "@/lib/api";
import DocumentHeader from "./DocumentHeader";
import PermissionsTable from "./PermissionsTable";

import { DocumentPermission } from "@/types";
import PagedEditor from "./PageEditor";

interface DocumentEditorProps {
  documentId: string;
  token: string;
}

type AccessLevel = "owner" | "edit" | "view" | null;
type Visibility = "public" | "private" | null;

export default function DocumentEditor({
  documentId,
  token,
}: DocumentEditorProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const [visibility, setVisibility] = useState<Visibility>(null);
  const [permissions, setPermissions] = useState<DocumentPermission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Establish WebSocket connection
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      { transports: ["websocket"] }
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setStatus("Connected");
      socket.emit("join-document", documentId, token);
    });

    socket.on("error", (error: any) => {
      setStatus(`Error: ${error}`);
      console.error("Socket error:", error);
    });

    socket.on(
      "document-content",
      (data: {
        content: string;
        title: string;
        access_level: AccessLevel;
        can_edit: boolean;
        visibility?: Visibility;
      }) => {
        setContent(data.content || "");
        setTitle(data.title || "");
        setAccessLevel(data.access_level);
        setCanEdit(data.can_edit || false);

        if (data.visibility) {
          setVisibility(data.visibility);
        }

        setStatus("Document loaded");
      }
    );

    socket.on("text-change", (delta: { content?: string; title?: string }) => {
      if (delta.content) setContent(delta.content);
      if (delta.title) setTitle(delta.title);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId, token]);

  // Fetch document permissions and visibility
  useEffect(() => {
    const fetchPermissionsAndVisibility = async () => {
      if (!accessLevel) return;

      try {
        setLoadingPermissions(true);

        if (accessLevel === "owner") {
          const fetchedPermissions = await getDocumentPermissions(
            documentId,
            token
          );
          setPermissions(fetchedPermissions);
        }

        if (visibility === null) {
          setVisibility("public");
        }
      } catch (error) {
        console.error("Failed to fetch document data:", error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchPermissionsAndVisibility();
  }, [accessLevel, documentId, token, visibility]);

  const handleContentChange = (newContent: string) => {
    if (socketRef.current) {
      socketRef.current.emit("text-change", { title, content: newContent });
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (newTitle !== title) {
      setTitle(newTitle);

      try {
        await updateDocument(documentId, { title: newTitle }, token);

        if (socketRef.current) {
          socketRef.current.emit("text-change", { title: newTitle, content });
        }
      } catch (error) {
        console.error("Failed to update title:", error);
      }
    }
  };

  const handleVisibilityChange = (newVisibility: Visibility) => {
    setVisibility(newVisibility);

    if (socketRef.current) {
      socketRef.current.emit("text-change", {
        title,
        content,
        visibility: newVisibility,
      });
    }
  };

  const handlePermissionRemoved = (userId: string) => {
    setPermissions((currentPermissions) =>
      currentPermissions.filter((permission) => permission.id !== userId)
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col h-full">
        <DocumentHeader
          title={title}
          status={status}
          canEdit={canEdit}
          connected={connected}
          accessLevel={accessLevel}
          documentId={documentId}
          token={token}
          visibility={visibility}
          onTitleChange={handleTitleChange}
          onVisibilityChange={handleVisibilityChange}
        />
        
        <PagedEditor
          content={content}
          title={title}
          onContentChange={handleContentChange}
          canEdit={canEdit}
          placeholder={canEdit 
            ? "Start writing..." 
            : "You don't have permission to edit this document."}
        />

        {accessLevel === "owner" && (
          <PermissionsTable
            permissions={permissions}
            isLoading={loadingPermissions}
            documentId={documentId}
            token={token}
            onPermissionRemoved={handlePermissionRemoved}
          />
        )}
      </div>
    </div>
  );
}