import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../services/auth';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        // Chama matchmaking serverless para atribuir mundo
        await fetch('/api/matchmaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid }),
        });
        navigate('/castle');
      }
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-castle-dark px-4"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, #2d1f0e 0%, #1a1208 70%, #0a0804 100%)',
      }}
    >
      <div className="bg-castle-stone border border-castle-gold rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">🏰</div>
        <h1 className="font-medieval text-3xl text-castle-gold mb-1">Bentropy Kingdom</h1>
        <p className="text-parchment-400 text-sm mb-8">
          Faça login para começar sua jornada medieval
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <Button
          size="lg"
          className="w-full"
          loading={loading}
          onClick={handleGoogleLogin}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Entrar com Google
        </Button>

        <div className="mt-6 space-y-1 text-xs text-parchment-500">
          <p>✅ Login instantâneo</p>
          <p>✅ Mundo atribuído automaticamente</p>
          <p>✅ Tutorial em 2 minutos</p>
        </div>
      </div>
    </div>
  );
};
