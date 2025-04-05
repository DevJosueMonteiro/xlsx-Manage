'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se estiver na página de login e tiver sessão, vai para o dashboard
        if (session && pathname === '/login') {
          router.replace('/dashboard');
          return;
        }

        // Se estiver no dashboard e não tiver sessão, vai para o login
        if (!session && pathname.startsWith('/dashboard')) {
          router.replace('/login');
          return;
        }

        // Se estiver na raiz e não tiver sessão, vai para o login
        if (!session && pathname === '/') {
          router.replace('/login');
          return;
        }

        // Se estiver na raiz e tiver sessão, vai para o dashboard
        if (session && pathname === '/') {
          router.replace('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && pathname === '/login') {
        router.replace('/dashboard');
      } else if (!session && pathname.startsWith('/dashboard')) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return <>{children}</>;
} 