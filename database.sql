-- Tabela de Quartos
CREATE TABLE quartos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  tipo TEXT NOT NULL,
  capacidade INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Disponível',
  preco_base DECIMAL(10, 2) NOT NULL
);

-- Tabela de Hóspedes
CREATE TABLE hospedes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Reservas
CREATE TABLE reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE, -- Código alfanumérico curto para fácil visualização
  hospede_id UUID REFERENCES hospedes(id) ON DELETE CASCADE,
  quarto_id UUID REFERENCES quartos(id) ON DELETE SET NULL, -- Adicionado para facilitar consultas
  data_checkin DATE NOT NULL,
  data_checkout DATE NOT NULL,
  numero_pessoas INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Reservado',
  valor_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Pagamentos
CREATE TABLE pagamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID REFERENCES reservas(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  forma_pagamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Necessário para segurança no Supabase)
ALTER TABLE quartos ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

-- Policies para permitir que usuários AUTENTICADOS façam tudo
-- Nota: Adicionamos WITH CHECK para garantir que o INSERT funcione corretamente
-- Tabela: quartos
DROP POLICY IF EXISTS "Allow all for authenticated users" ON quartos;
CREATE POLICY "Allow all for authenticated users" ON quartos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela: hospedes
DROP POLICY IF EXISTS "Allow all for authenticated users" ON hospedes;
CREATE POLICY "Allow all for authenticated users" ON hospedes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela: reservas
DROP POLICY IF EXISTS "Allow all for authenticated users" ON reservas;
CREATE POLICY "Allow all for authenticated users" ON reservas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tabela: pagamentos
DROP POLICY IF EXISTS "Allow all for authenticated users" ON pagamentos;
CREATE POLICY "Allow all for authenticated users" ON pagamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir alguns quartos de exemplo
INSERT INTO quartos (numero, tipo, capacidade, preco_base) VALUES
('101', 'Suite', 2, 150.00),
('102', 'Solteiro', 1, 80.00),
('103', 'Duplo', 2, 120.00),
('104', 'Suite', 3, 200.00),
('105', 'Solteiro', 1, 80.00);

-- Tabela de Perfis (integrada com Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies para Perfis
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
