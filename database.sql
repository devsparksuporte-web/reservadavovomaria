-- Tabela de Quartos
CREATE TABLE IF NOT EXISTS quartos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  tipo TEXT NOT NULL,
  capacidade INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Disponível',
  preco_base DECIMAL(10, 2) NOT NULL
);

-- Garantir que a coluna numero seja única para o ON CONFLICT funcionar
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quartos_numero_key') THEN
        ALTER TABLE quartos ADD CONSTRAINT quartos_numero_key UNIQUE (numero);
    END IF;
END $$;

-- Tabela de Hóspedes
CREATE TABLE IF NOT EXISTS hospedes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir constraint de CPF
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hospedes_cpf_key') THEN
        ALTER TABLE hospedes ADD CONSTRAINT hospedes_cpf_key UNIQUE (cpf);
    END IF;
END $$;

-- Tabela de Reservas
CREATE TABLE IF NOT EXISTS reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT, -- Código alfanumérico curto para fácil visualização
  hospede_id UUID REFERENCES hospedes(id) ON DELETE CASCADE,
  quarto_id UUID REFERENCES quartos(id) ON DELETE SET NULL, -- Adicionado para facilitar consultas
  data_checkin DATE NOT NULL,
  data_checkout DATE NOT NULL,
  numero_pessoas INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Reservado',
  valor_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir constraint de Código de Reserva
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_codigo_key') THEN
        ALTER TABLE reservas ADD CONSTRAINT reservas_codigo_key UNIQUE (codigo);
    END IF;
END $$;

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
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

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: quartos
DROP POLICY IF EXISTS "View: Authenticated" ON quartos;
DROP POLICY IF EXISTS "Manage: Admin" ON quartos;
CREATE POLICY "View: Authenticated" ON quartos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage: Admin" ON quartos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies: hospedes
DROP POLICY IF EXISTS "View: Authenticated" ON hospedes;
DROP POLICY IF EXISTS "Write: Authenticated" ON hospedes;
DROP POLICY IF EXISTS "Update: Authenticated" ON hospedes;
DROP POLICY IF EXISTS "Delete: Admin" ON hospedes;
CREATE POLICY "View: Authenticated" ON hospedes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write: Authenticated" ON hospedes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update: Authenticated" ON hospedes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Delete: Admin" ON hospedes FOR DELETE TO authenticated USING (public.is_admin());

-- Policies: reservas
DROP POLICY IF EXISTS "View: Authenticated" ON reservas;
DROP POLICY IF EXISTS "Write: Authenticated" ON reservas;
DROP POLICY IF EXISTS "Update: Authenticated" ON reservas;
DROP POLICY IF EXISTS "Delete: Admin" ON reservas;
CREATE POLICY "View: Authenticated" ON reservas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write: Authenticated" ON reservas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update: Authenticated" ON reservas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Delete: Admin" ON reservas FOR DELETE TO authenticated USING (public.is_admin());

-- Policies: pagamentos
DROP POLICY IF EXISTS "View: Authenticated" ON pagamentos;
DROP POLICY IF EXISTS "Write: Authenticated" ON pagamentos;
DROP POLICY IF EXISTS "Update: Authenticated" ON pagamentos;
DROP POLICY IF EXISTS "Delete: Admin" ON pagamentos;
CREATE POLICY "View: Authenticated" ON pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Write: Authenticated" ON pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update: Authenticated" ON pagamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Delete: Admin" ON pagamentos FOR DELETE TO authenticated USING (public.is_admin());

-- Inserir alguns quartos de exemplo
INSERT INTO quartos (numero, tipo, capacidade, preco_base) VALUES
('101', 'Suite', 2, 150.00),
('102', 'Solteiro', 1, 80.00),
('103', 'Duplo', 2, 120.00),
('104', 'Suite', 3, 200.00),
('105', 'Solteiro', 1, 80.00)
ON CONFLICT (numero) DO NOTHING;

-- Tabela de Perfis (integrada com Supabase Auth)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'staff',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para Perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies para Perfis
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
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
