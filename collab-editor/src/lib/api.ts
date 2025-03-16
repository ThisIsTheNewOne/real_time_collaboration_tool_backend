import { DocumentPermission } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchDocuments(token: string): Promise<Document[]> {
    const response = await fetch(`${API_URL}/documents`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch documents')
    }

    return response.json()
}


export async function fetchDocument(id: string, token: string): Promise<Document> {
   
   console.log("This are the documents", `${API_URL}/documents/${id}`)

    const response = await fetch(`${API_URL}/documents/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch document')
    }

    return response.json()
}



export async function createDocument(title: string, token: string): Promise<Document> {
    const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
    })

    if (!response.ok) {
        throw new Error('Failed to create document')
    }

    return response.json()
}

export async function updateDocument(id: string, data: { title?: string, content?: string }, token: string): Promise<Document> {
    const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
    })

    if (!response.ok) {
        throw new Error('Failed to update document')
    }

    return response.json()
}

export async function deleteDocument(id: string, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to delete document')
    }

    return response.json()
}

export async function setDocumentVisibility(id: string, visibility: 'public' | 'private', token: string): Promise<{ success: boolean, visibility: string }> {
    const response = await fetch(`${API_URL}/documents/${id}/visibility`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visibility })
    })

    if (!response.ok) {
        throw new Error('Failed to update document visibility')
    }

    return response.json()
}

export async function grantDocumentPermission(
    documentId: string, 
    userEmail: string, 
    permissionLevel: 'view' | 'edit', 
    token: string
): Promise<{ success: boolean, message: string }> {
    const response = await fetch(`${API_URL}/documents/${documentId}/permissions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userEmail, permissionLevel })
    })

    if (!response.ok) {
        throw new Error('Failed to grant permission')
    }

    return response.json()
}

export async function getDocumentPermissions(documentId: string, token: string): Promise<DocumentPermission[]> {
    const response = await fetch(`${API_URL}/documents/${documentId}/permissions`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch document permissions')
    }

    return response.json()
}

export async function removeDocumentPermission(documentId: string, targetUserId: string, token: string): Promise<{ success: boolean, message: string }> {
    const response = await fetch(`${API_URL}/documents/${documentId}/permissions/${targetUserId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to remove permission')
    }

    return response.json()
}

export async function login(email: string, password: string): Promise<{token: string}> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    return response.json();
  }