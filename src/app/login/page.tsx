"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { getSupabase } from "@/services/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const { ready, user, configOk } = useAuthStore();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace("/");
  }, [ready, user, router]);

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setMessage("Configure as variáveis de ambiente do Supabase para continuar.");
        return;
      }

      if (!email || !password) {
        setMessage("Informe e-mail e senha.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Conta criada. Se necessário, confirme o e-mail e faça login.");
        setMode("signin");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/");
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="w-full"
      >
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-muted">Acesso</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-text">
                {mode === "signin" ? "Entrar" : "Criar conta"}
              </div>
              <div className="mt-2 text-sm text-muted">
                Seus dados ficam privados por usuário (Supabase Auth + RLS).
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              className="px-3"
            >
              {mode === "signin" ? "Criar conta" : "Já tenho conta"}
            </Button>
          </div>

          <div className="mt-6 space-y-3">
            {!configOk && (
              <div className="rounded-2xl border border-border bg-card/30 px-3 py-2 text-sm text-muted">
                Defina <span className="text-text">NEXT_PUBLIC_SUPABASE_URL</span> e{" "}
                <span className="text-text">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> no
                ambiente (local e na Vercel).
              </div>
            )}
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted">E-mail</div>
              <Input
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={!configOk}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted">Senha</div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                disabled={!configOk}
              />
            </div>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-border bg-card/30 px-3 py-2 text-sm text-muted">
              {message}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="primary"
              disabled={loading || !configOk}
              onClick={() => void submit()}
            >
              {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

