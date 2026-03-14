/**
 * Home — landing page.
 */

import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-castle-dark flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-5xl md:text-7xl font-medieval text-castle-gold mb-4 drop-shadow-lg">
        Bentropy Arena
      </h1>
      <p className="text-parchment-200 font-body text-lg md:text-xl mb-8 max-w-2xl">
        Construa seu castelo, treine exércitos, forje alianças e conquiste o mapa medieval.
      </p>

      {user ? (
        <Link
          to="/world-select"
          className="px-8 py-3 bg-castle-gold text-castle-dark font-medieval text-xl rounded-lg
                     hover:bg-parchment-300 transition-colors shadow-lg"
        >
          Jogar
        </Link>
      ) : (
        <Link
          to="/login"
          className="px-8 py-3 bg-castle-gold text-castle-dark font-medieval text-xl rounded-lg
                     hover:bg-parchment-300 transition-colors shadow-lg"
        >
          Entrar
        </Link>
      )}
    </div>
  );
}
