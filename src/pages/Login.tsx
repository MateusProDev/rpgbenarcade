/**
 * Login — Firebase authentication page.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getFirebaseAuth } from '../firebase/config';
import { PlayerService } from '../services/playerService';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const auth = getFirebaseAuth();
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await PlayerService.create({
          uid: cred.user.uid,
          displayName: cred.user.displayName ?? email.split('@')[0],
          email,
          avatarUrl: null,
          allianceId: null,
          activeCityId: null,
          worldId: '',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/world-select');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar.');
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);

      // Create player doc if first time
      const existing = await PlayerService.get(cred.user.uid);
      if (!existing) {
        await PlayerService.create({
          uid: cred.user.uid,
          displayName: cred.user.displayName ?? 'Jogador',
          email: cred.user.email ?? '',
          avatarUrl: cred.user.photoURL,
          allianceId: null,
          activeCityId: null,
          worldId: '',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        });
      } else {
        await PlayerService.updateLastLogin(cred.user.uid);
      }

      navigate('/world-select');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar com Google.');
    }
  }

  return (
    <div className="min-h-screen bg-castle-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-castle-stone/80 rounded-xl p-8 border border-castle-wall/30">
        <h2 className="text-3xl font-medieval text-castle-gold text-center mb-6">
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </h2>

        {error && (
          <div className="mb-4 p-2 bg-red-900/50 text-red-200 rounded text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-2 bg-castle-dark border border-castle-wall/30 rounded
                       text-parchment-100 placeholder-parchment-400 focus:outline-none focus:border-castle-gold"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="w-full px-4 py-2 bg-castle-dark border border-castle-wall/30 rounded
                       text-parchment-100 placeholder-parchment-400 focus:outline-none focus:border-castle-gold"
          />
          <button
            type="submit"
            className="w-full py-2 bg-castle-gold text-castle-dark font-medieval rounded
                       hover:bg-parchment-300 transition-colors"
          >
            {isSignUp ? 'Registrar' : 'Entrar'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <hr className="flex-1 border-castle-wall/30" />
          <span className="text-parchment-400 text-sm">ou</span>
          <hr className="flex-1 border-castle-wall/30" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full py-2 bg-parchment-100 text-castle-dark font-medieval rounded
                     hover:bg-parchment-200 transition-colors"
        >
          Entrar com Google
        </button>

        <p className="mt-4 text-center text-parchment-300 text-sm">
          {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-castle-gold underline">
            {isSignUp ? 'Entrar' : 'Criar conta'}
          </button>
        </p>
      </div>
    </div>
  );
}
