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