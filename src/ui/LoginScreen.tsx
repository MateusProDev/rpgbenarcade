// ============================================
// Login Screen — Firebase auth UI
// ============================================
import { useState } from 'react';
import { signIn, signUp } from '@/services/firebase/auth';

export function LoginScreen({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-[var(--color-bg-dark)]">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-accent-purple)] rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-accent-blue)] rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="glass-panel p-8 w-96 animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-gold-accent)] font-[var(--font-display)]">
            ⚔️ RPG Benarcade
          </h1>
          <p className="text-[var(--color-text-dim)] text-sm mt-2">
            MMORPG 2D Online
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[var(--color-text-dim)] text-xs mb-1 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-[var(--color-border-gold)] rounded-md text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-gold-accent)] transition-colors"
              placeholder="email@exemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-dim)] text-xs mb-1 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-[var(--color-border-gold)] rounded-md text-[var(--color-text-light)] focus:outline-none focus:border-[var(--color-gold-accent)] transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-[var(--color-accent-red)] text-sm bg-red-900/20 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[var(--color-gold-accent)] to-yellow-600 text-black font-bold rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Aguarde...' : isSignUp ? '📝 Criar Conta' : '🔑 Entrar'}
          </button>
        </form>

        <div className="text-center mt-4 space-y-2">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-[var(--color-text-dim)] text-sm hover:text-[var(--color-gold-accent)] transition-colors block mx-auto"
          >
            {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="text-[var(--color-text-dim)] text-xs hover:text-[var(--color-gold-accent)] transition-colors flex items-center gap-1 mx-auto"
            >
              ← Voltar para a página inicial
            </button>
          )}
        </div>

        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--color-gold-accent)] rounded-tl-lg opacity-50" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--color-gold-accent)] rounded-tr-lg opacity-50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--color-gold-accent)] rounded-bl-lg opacity-50" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--color-gold-accent)] rounded-br-lg opacity-50" />
      </div>
    </div>
  );
}
