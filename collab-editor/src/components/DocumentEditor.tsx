"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { updateDocument } from "@/lib/api";
import { useDocumentPermissions } from "@/hooks/useDocumentPermissions";
import DocumentHeader from "./DocumentHeader";
import PermissionsTable from "./PermissionsTable";

interface DocumentEditorProps {
  documentId: string;
  token: string;
}

type AccessLevel = "owner" | "edit" | "view" | null;

export default function DocumentEditor({ documentId, token }: DocumentEditorProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Connecting...");
  const socketRef = useRef<Socket | null>(null);

  const { permissions, loadingPermissions } = useDocumentPermissions(documentId, token, accessLevel);

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

    socket.on("document-content", (data: { content: string; title: string; access_level: AccessLevel; can_edit: boolean }) => {
      setContent(data.content || "");
      setTitle(data.title || "");
      setAccessLevel(data.access_level);
      setCanEdit(data.can_edit || false);
      setStatus("Document loaded");
    });

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!canEdit) return;
    const newContent = e.target.value;
    setContent(newContent);

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

      {accessLevel === "owner" && <PermissionsTable permissions={permissions} isLoading={loadingPermissions} />}
    </div>
  );
}
