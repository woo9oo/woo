/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  // 필요한 다른 환경변수들을 여기에 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
