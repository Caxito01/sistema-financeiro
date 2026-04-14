// Configuração do Supabase
const SUPABASE_URL = 'https://yjaalhjqbiyguktsfqtq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYWFsaGpxYml5Z3VrdHNmcXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MDcyOTUsImV4cCI6MjA3OTA4MzI5NX0.7QFF_yAHrDZga140y3IbKwqS_hJeImahZsvuKBes5vg';

// Cliente Supabase
let supabaseClient = null;

function createSupabaseClient() {
  if (!supabaseClient) {
    // Verificar se a biblioteca Supabase foi carregada
    if (typeof supabase === 'undefined') {
      console.error('Biblioteca Supabase não carregada! Verifique se o script CDN está incluído.');
      throw new Error('Supabase library not loaded');
    }
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

// Verificar se usuário está logado
async function checkAuth() {
  const client = createSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  return session;
}

// Fazer login
async function login(email, password) {
  const client = createSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Fazer logout
async function logout() {
  const client = createSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

// Enviar email de recuperação de senha
async function resetPassword(email) {
  const client = createSupabaseClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname.replace(/\/[^/]+$/, '/') + 'nova-senha.html',
  });
  if (error) throw error;
}

// Atualizar senha (após clicar no link do email)
async function updatePassword(newPassword) {
  const client = createSupabaseClient();
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Registrar novo usuário
async function register(email, password) {
  const client = createSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Buscar dados de uma tabela
async function fetchData(table, options = {}) {
  const client = createSupabaseClient();
  let query = client.from(table).select(options.select || '*');
  
  if (options.eq) {
    Object.entries(options.eq).forEach(([column, value]) => {
      query = query.eq(column, value);
    });
  }
  
  if (options.order) {
    query = query.order(options.order.column, { ascending: options.order.ascending !== false });
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Inserir dados
async function insertData(table, data) {
  const client = createSupabaseClient();
  const { data: result, error } = await client.from(table).insert(data).select();
  if (error) throw error;
  return result;
}

// Atualizar dados
async function updateData(table, id, data) {
  const client = createSupabaseClient();
  const { data: result, error } = await client.from(table).update(data).eq('id', id).select();
  if (error) throw error;
  return result;
}

// Deletar dados
async function deleteData(table, id) {
  const client = createSupabaseClient();
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) throw error;
}

// Proteger página (redirecionar se não logado)
async function protectPage() {
  const session = await checkAuth();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
