import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 설정 (환경 변수 필수)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
