const SUPABASE_URL = 'https://zmoxzlxkmymrtirdqcax.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptb3h6bHhrbXltcnRpcmRxY2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDE4MDIsImV4cCI6MjEwODE3NzgwMn0.C53ImfrSDL1DbbHqYvZ3uljp5Q0SlzswSKztB6G9OHg';

window.getPizzaSupabase = function () {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('กรุณาตั้งค่า SUPABASE_URL และ SUPABASE_ANON_KEY ใน supabase-client.js');
  }
  if (!window.supabase?.createClient) {
    throw new Error('โหลด Supabase client ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
  }
  if (!window.pizzaSupabaseClient) {
    window.pizzaSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return window.pizzaSupabaseClient;
};

window.PIZZA_SUPABASE_URL = SUPABASE_URL;
window.PIZZA_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
