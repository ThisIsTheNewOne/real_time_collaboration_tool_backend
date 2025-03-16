"use client";

import { getDocumentPermissions, updateDocument } from "@/lib/api";
import { DocumentPermission } from "@/types";
import { useEffect, useState, useRef, SetStateAction } from "react";
import { io, Socket } from "socket.io-client";

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  

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

    socket.on("text-change", (delta: { content: SetStateAction<string> }) => {
      console.log("Received text change:", delta);
      // Only update if the change is from another user
      setContent(delta.content);
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

  const startEditingTitle = () => {
    if (!canEdit) return;
    setIsEditingTitle(true);
  };

  const saveTitle = async () => {
    if (!canEdit) return;
    setIsEditingTitle(false);
    
    if (titleInput !== title) {
      setTitle(titleInput);
      
      try {
        // Update title via API
        await updateDocument(documentId, { title: titleInput }, token);
        
        // Send title update to other connected clients
        if (socketRef.current) {
          socketRef.current.emit("text-change", {
            title: titleInput,
            content,
          });
        }
      } catch (error) {
        console.error("Failed to update title:", error);
        setTitleInput(title); // Revert back if update fails
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingTitle(false);
      setTitleInput(title);
    }
  };


    // Auto focus input when editing title
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, [isEditingTitle]);

      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  className="text-xl font-semibold border-b border-gray-300 focus:outline-none focus:border-blue-500 w-full max-w-md"
                  value={titleInput}
                  onChange={handleTitleChange}
                  onBlur={saveTitle}
                  onKeyDown={handleTitleKeyDown}
                />
              ) : (
                <h1 
                  className={`text-xl font-semibold ${canEdit ? 'cursor-pointer hover:text-blue-600' : ''}`}
                  onClick={startEditingTitle}
                >
                  {title || 'Untitled Document'}
                  {canEdit && <span className="text-xs text-gray-400 ml-2">(Click to edit)</span>}
                </h1>
              )}
              <p className="text-sm text-gray-500">{status}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {accessLevel && (
                <div className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                  {accessLevel === 'owner' ? 'Owner' : accessLevel === 'edit' ? 'Editor' : 'Viewer'}
                </div>
              )}
            </div>
          </div>
          
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
            <div className="p-4 border-t">
              <h3 className="text-lg font-medium mb-2">Document Permissions</h3>
              
              {loadingPermissions ? (
                <p className="text-sm text-gray-500">Loading permissions...</p>
              ) : permissions.length > 0 ? (
                <div className="overflow-y-auto max-h-64">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {permissions.map((permission) => (
                        <tr key={permission.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{permission.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              permission.permission_level === 'edit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {permission.permission_level === 'edit' ? 'Editor' : 'Viewer'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">This document is not shared with anyone.</p>
              )}
            </div>
          )}
        </div>
      );
}
