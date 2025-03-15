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