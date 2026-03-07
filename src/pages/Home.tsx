import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/useAuthStore';

export const Home: React.FC = () => {
  const { user, player } = useAuthStore();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-castle-dark text-parchment-100 px-4"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, #2d1f0e 0%, #1a1208 60%, #0a0804 100%)',
      }}
    >
      {/* Logo / título */}
      <div className="text-center mb-10">
        <div className="text-8xl mb-4">🏰</div>
        <h1 className="font-medieval text-5xl md:text-7xl text-castle-gold mb-2 drop-shadow-lg">
          Bentropy
        </h1>
        <h2 className="font-medieval text-3xl md:text-4xl text-parchment-300 mb-4">
          Kingdom
        </h2>
        <p className="text-parchment-400 max-w-md mx-auto text-sm md:text-base">
          Construa seu império medieval. Conquiste aliados. Domine o mapa.
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {user && player?.worldId ? (
          <>
            <Link to="/castle">
              <Button size="lg">⚔️ Continuar Jogando</Button>
            </Link>
            <Link to="/world">
              <Button size="lg" variant="secondary">🗺 Ver Mapa</Button>
            </Link>
          </>
        ) : (
          <Link to="/login">
            <Button size="lg">🚪 Entrar no Reino</Button>
          </Link>
        )}
      </div>

      {/* Features */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full text-center">
        {[
          { icon: '⚔️', title: 'Batalhas táticas',   desc: 'Ataque e defenda com infantaria, arqueiros e cavalaria.' },
          { icon: '🤝', title: 'Alianças poderosas', desc: 'Una forças para conquistar bases e o castelo central.' },
          { icon: '📈', title: 'Evolução contínua',  desc: 'Evolua edifícios, tropas e seu castelo indefinidamente.' },
        ].map((f) => (
          <div key={f.title} className="bg-castle-stone/50 border border-castle-wall rounded-xl p-5">
            <div className="text-4xl mb-2">{f.icon}</div>
            <h3 className="font-medieval text-parchment-200 mb-1">{f.title}</h3>
            <p className="text-parchment-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-parchment-600 text-xs">© 2026 Bentropy Kingdom · Máx. 200 jogadores por mundo</p>
    </div>
  );
};
