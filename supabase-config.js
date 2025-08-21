// Configuração do Supabase
const SUPABASE_URL = 'https://waixxytscfwwumzowejg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaXh4eXRzY2Z3d3Vtem93ZWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjcxNDksImV4cCI6MjA3MDcwMzE0OX0.hhrzHxLqI7YcJgjZr_dAi7Qku3Q8UiMN0Qmyne71Vko';

// Inicializar cliente Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso global
window.supabaseClient = supabaseClient;
