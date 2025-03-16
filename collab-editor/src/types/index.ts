export interface Document {
  created_at: string;
  data: { title: string; content: string };
  id: string;
  owner_id: string;
  visibility: string;
}

  
  export interface User {
    id: string;
    email: string;
    created_at: string;
  }

  export interface DocumentPermission {
    email: string;
    id: string;
    permission_level: 'view' | 'edit';
    created_at: string;
  }