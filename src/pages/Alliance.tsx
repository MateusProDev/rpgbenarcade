import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useAuthStore } from '../stores/useAuthStore';
import { createAlliance } from '../modules/castle/castleLogic';
import {
  collection, query, where, getDocs, doc, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import type { Alliance as AllianceType } from '../types';

export const Alliance: React.FC = () => {
  const player  = useAuthStore((s) => s.player);
  const [alliance, setAlliance] = useState<AllianceType | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);
  const [alliances,  setAlliances]  = useState<AllianceType[]>([]);
  const [name, setName]   = useState('');
  const [tag,  setTag]    = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]     = useState('');

  useEffect(() => {
    if (!player?.allianceId || !player.worldId) return;
    getDocs(query(collection(db, 'alliances'), where('id', '==', player.allianceId)))
      .then((snap) => { if (!snap.empty) setAlliance(snap.docs[0].data() as AllianceType); });
  }, [player?.allianceId]);

  const loadAlliances = async () => {
    if (!player?.worldId) return;
    const snap = await getDocs(
      query(collection(db, 'alliances'), where('worldId', '==', player.worldId)),
    );
    setAlliances(snap.docs.map((d) => d.data() as AllianceType));
  };

  const handleCreate = async () => {
    if (!player || !name || !tag) return;
    setLoading(true);
    try {
      await createAlliance(player.worldId, player.uid, name, tag);
      setMsg('Aliança criada!');
      setShowCreate(false);
    } catch (e: unknown) {
      setMsg((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (allianceId: string) => {
    if (!player) return;
    await updateDoc(doc(db, 'alliances', allianceId), { members: arrayUnion(player.uid) });
    await updateDoc(doc(db, 'players', player.uid), { allianceId });
    setMsg('Você entrou na aliança!');
    setShowJoin(false);
  };

  return (
    <div className="min-h-screen bg-castle-dark text-parchment-100">
      <nav className="sticky top-0 z-40 bg-castle-dark/95 border-b border-castle-wall px-4 py-2 flex items-center justify-between">
        <Link to="/" className="font-medieval text-castle-gold text-lg">🏰 Bentropy</Link>
        <div className="flex gap-2">
          <Link to="/castle" className="text-parchment-400 hover:text-parchment-100 text-sm">🏰</Link>
          <Link to="/world"  className="text-parchment-400 hover:text-parchment-100 text-sm">🗺</Link>
        </div>
      </nav>

      <main className="p-4 max-w-2xl mx-auto">
        <h1 className="font-medieval text-2xl text-castle-gold mb-6">Alianças</h1>

        {msg && <p className="text-center text-parchment-300 mb-4">{msg}</p>}

        {alliance ? (
          <div className="bg-castle-stone border border-castle-gold rounded-xl p-5">
            <h2 className="font-medieval text-xl text-parchment-100 mb-1">
              [{alliance.tag}] {alliance.name}
            </h2>
            <p className="text-parchment-400 text-sm mb-3">
              {alliance.members.length} membros · {alliance.bases.length} bases
            </p>
            <div className="flex gap-2 flex-wrap">
              {alliance.controlsCastle && (
                <span className="bg-castle-gold/20 border border-castle-gold text-parchment-200 rounded px-2 py-1 text-xs">
                  👑 Controla o Castelo Central
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-parchment-300 font-medieval mb-2">Membros</h3>
              <div className="grid grid-cols-2 gap-2">
                {alliance.members.map((uid) => (
                  <div key={uid} className="bg-castle-dark rounded px-3 py-2 text-parchment-400 text-sm truncate">
                    {uid === alliance.leaderId ? '👑 ' : '⚔️ '}{uid.slice(0, 12)}...
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <p className="text-parchment-400">Você não faz parte de nenhuma aliança.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowCreate(true)}>➕ Criar Aliança</Button>
              <Button variant="secondary" onClick={() => { setShowJoin(true); loadAlliances(); }}>
                🔍 Entrar em Aliança
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Modal criar */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Aliança">
        <div className="flex flex-col gap-3">
          <input
            className="bg-castle-dark border border-castle-wall rounded px-3 py-2 text-parchment-100 placeholder-parchment-600"
            placeholder="Nome da aliança"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="bg-castle-dark border border-castle-wall rounded px-3 py-2 text-parchment-100 placeholder-parchment-600 uppercase"
            placeholder="TAG (3 letras)"
            maxLength={3}
            value={tag}
            onChange={(e) => setTag(e.target.value.toUpperCase())}
          />
          <Button loading={loading} onClick={handleCreate}>Criar</Button>
        </div>
      </Modal>

      {/* Modal busca */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Entrar em Aliança">
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {alliances.length === 0 && (
            <p className="text-parchment-400 text-sm text-center">Nenhuma aliança encontrada.</p>
          )}
          {alliances.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-castle-dark rounded px-3 py-2">
              <div>
                <span className="text-parchment-200 font-bold">[{a.tag}]</span>
                <span className="text-parchment-400 text-sm ml-2">{a.name} · {a.members.length} membros</span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleJoin(a.id)}>Entrar</Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
