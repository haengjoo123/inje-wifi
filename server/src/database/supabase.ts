import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase 프로젝트 설정 (환경 변수 필수)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 환경 변수 검증
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.');
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 데이터베이스 연결 테스트 함수
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase 연결 오류:', error);
      return false;
    }
    
    console.log('✅ Supabase 데이터베이스 연결 성공');
    return true;
  } catch (error) {
    console.error('Supabase 연결 테스트 실패:', error);
    return false;
  }
};

export default supabase;
