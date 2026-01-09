export interface GeneratedImage {
  id: number;
  prompt: string;
  base64: string | null;
  isLoading: boolean;
  error?: string;
}

export type AppStatus = 'idle' | 'analyzing' | 'generating' | 'complete';

export interface SceneAnalysisResponse {
  scenes: string[];
}