export interface Document {
    id: string;
    data: {
      title: string;
      content: string;
    };
    created_at?: string;
  }
  
  export interface User {
    id: string;
    email: string;
  }

  export interface DocumentPermission {
    email: string;
    id: string;
    permission_level: 'view' | 'edit';
    created_at: string;
  }