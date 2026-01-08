// Modelos genéricos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  mensaje: string;
  status?: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}