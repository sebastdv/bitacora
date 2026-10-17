// Contrato entre el servidor local y la interfaz.

export interface Commit {
  repo: string;
  hash: string;
  email: string;
  author: string;
  /** Fecha de autor en ISO 8601, con su desfase horario. */
  date: string;
  branch: string | null;
  subject: string;
  added: number;
  deleted: number;
  files: number;
}

export interface RepoInfo {
  name: string;
  error?: string;
}

/** Archivos con cambios sin commitear por repositorio. No depende del rango. */
export interface PendingResponse {
  repos: { name: string; dirty: number }[];
}

export interface ActivityResponse {
  roots: string[];
  /** Correos configurados en git (global y por repositorio): se asumen tuyos. */
  me: string[];
  repos: RepoInfo[];
  commits: Commit[];
}
