// src/types/sharedb-postgres.d.ts
declare module 'sharedb-postgres' {
    import { ShareDB } from 'sharedb';
  
    interface ShareDBPostgresOptions {
      connection?: string | object;
      pool?: object;
    }
  
    class ShareDBPostgres implements ShareDB.DB {
      constructor(options?: ShareDBPostgresOptions);
      close(callback?: (err: Error | null) => void): void;
    }
  
    export = ShareDBPostgres;
  }