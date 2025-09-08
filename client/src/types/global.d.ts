// Vite 환경 변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_APP_TITLE?: string;
  // 필요한 환경 변수들을 여기에 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'aria-query' {
  const ariaQuery: any;
  export = ariaQuery;
}

declare module 'prop-types' {
  const PropTypes: any;
  export = PropTypes;
}