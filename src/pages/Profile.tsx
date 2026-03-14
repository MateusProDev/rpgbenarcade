/**
 * Profile — player profile and settings page.
 */

import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../firebase/config';
import { useAuthStore } from '../stores/useAuthStore';

export function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  async function handleLogout() {
    await signOut(getFirebaseAuth());
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-castle-dark flex flex-col items-center p-8">
      <h1 className="text-4xl font-medieval text-castle-gold mb-8">Perfil</h1>

      <div className="w-full max-w-md bg-castle-stone/80 rounded-xl p-6 border border-castle-wall/30 space-y-4">
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt="Avatar"
            className="w-20 h-20 rounded-full mx-auto border-2 border-castle-gold"
          />
        )}

        <div className="text-center">
          <p className="font-medieval text-castle-gold text-xl">{user?.displayName ?? 'Jogador'}</p>
          <p className="text-parchment-300 text-sm">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-2 bg-red-800 text-parchment-100 font-medieval rounded
                     hover:bg-red-700 transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
