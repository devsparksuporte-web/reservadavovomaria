-- ==========================================
-- MIGRATION: RBAC & RLS Professionalization
-- Pousada Vovó Maria
-- ==========================================

-- 1. Criar tipo ENUM para as funções
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff');
    END IF;
END$$;

-- 2. Atualizar tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'staff';

-- 3. Função auxiliar para verificar se o usuário é admin
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

-- 4. REFORMULAR POLÍTICAS DE RLS

-- Tabela: QUARTOS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.quartos;
CREATE POLICY "View: Authenticated users" ON public.quartos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage: Admin only" ON public.quartos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Tabela: HOSPEDES
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.hospedes;
CREATE POLICY "View: Authenticated users" ON public.hospedes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert/Update: Authenticated users" ON public.hospedes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update: Authenticated users" ON public.hospedes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Delete: Admin only" ON public.hospedes FOR DELETE TO authenticated USING (public.is_admin());

-- Tabela: RESERVAS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.reservas;
CREATE POLICY "View: Authenticated users" ON public.reservas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert/Update: Authenticated users" ON public.reservas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update: Authenticated users" ON public.reservas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Delete: Admin only" ON public.reservas FOR DELETE TO authenticated USING (public.is_admin());

-- Tabela: PAGAMENTOS
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.pagamentos;
CREATE POLICY "View: Authenticated users" ON public.pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert/Update: Authenticated users" ON public.pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update: Authenticated users" ON public.pagamentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Delete: Admin only" ON public.pagamentos FOR DELETE TO authenticated USING (public.is_admin());

-- Tabela: PROFILES (Proteção adicional)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Profiles: Viewable by user or admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Profiles: Updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5. ATRIBUIR ROLE ADMIN AO USUÁRIO ATUAL (OPCIONAL)
-- Execute este comando separadamente se desejar se tornar admin imediatamente:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'SEU_UUID_AQUI';

COMMENT ON FUNCTION public.is_admin IS 'Verifica se o usuário logado possui a função de administrador.';
