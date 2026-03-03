// ============================================
// Landing Page — Epic game presentation
// ============================================
import { useState, useEffect, useRef } from 'react';

interface LandingPageProps {
  onPlay: () => void;
}

export function LandingPage({ onPlay }: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => setScrollY(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for scroll animations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15, root: container }
    );
    container.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visible.has(id);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* ======== NAVBAR ======== */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 60 ? 'rgba(10,12,16,0.95)' : 'transparent',
          backdropFilter: scrollY > 60 ? 'blur(12px)' : 'none',
          borderBottom: scrollY > 60 ? '1px solid rgba(180,150,90,0.2)' : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚔️</span>
            <span className="text-xl font-bold text-[var(--color-gold-accent)] font-[var(--font-display)] tracking-wide">
              RPG Benarcade
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-[var(--color-text-dim)] hover:text-[var(--color-gold-accent)] transition-colors">
              Features
            </a>
            <a href="#classes" className="text-[var(--color-text-dim)] hover:text-[var(--color-gold-accent)] transition-colors">
              Classes
            </a>
            <a href="#world" className="text-[var(--color-text-dim)] hover:text-[var(--color-gold-accent)] transition-colors">
              Mundo
            </a>
            <a href="#pvp" className="text-[var(--color-text-dim)] hover:text-[var(--color-gold-accent)] transition-colors">
              PvP
            </a>
          </div>
          <button
            onClick={onPlay}
            className="px-6 py-2 bg-gradient-to-r from-[var(--color-gold-accent)] to-yellow-600 text-black font-bold rounded-lg hover:brightness-110 hover:scale-105 transition-all text-sm"
          >
            🎮 Jogar Agora
          </button>
        </div>
      </nav>

      {/* ======== HERO SECTION ======== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[var(--color-bg-dark)]" />
          {/* Floating particles */}
          <div
            className="absolute inset-0"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          >
            <div className="absolute top-[10%] left-[15%] w-2 h-2 bg-[var(--color-gold-accent)] rounded-full opacity-30 animate-float-slow" />
            <div className="absolute top-[20%] right-[20%] w-1.5 h-1.5 bg-[var(--color-accent-purple)] rounded-full opacity-40 animate-float-medium" />
            <div className="absolute top-[60%] left-[10%] w-1 h-1 bg-[var(--color-accent-blue)] rounded-full opacity-30 animate-float-fast" />
            <div className="absolute top-[40%] right-[10%] w-2.5 h-2.5 bg-[var(--color-gold-accent)] rounded-full opacity-20 animate-float-slow" />
            <div className="absolute top-[70%] left-[40%] w-1.5 h-1.5 bg-[var(--color-accent-green)] rounded-full opacity-30 animate-float-medium" />
            <div className="absolute top-[15%] left-[60%] w-1 h-1 bg-[var(--color-accent-red)] rounded-full opacity-25 animate-float-fast" />
            <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-[var(--color-accent-purple)] rounded-full opacity-20 animate-float-slow" />
            <div className="absolute top-[50%] left-[75%] w-1.5 h-1.5 bg-[var(--color-gold-accent)] rounded-full opacity-35 animate-float-medium" />
          </div>
          {/* Large glow orbs */}
          <div
            className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full opacity-[0.04]"
            style={{
              background: 'radial-gradient(circle, var(--color-gold-accent), transparent 70%)',
              transform: `translateY(${scrollY * 0.15}px)`,
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]"
            style={{
              background: 'radial-gradient(circle, var(--color-accent-purple), transparent 70%)',
              transform: `translateY(${scrollY * 0.1}px)`,
            }}
          />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(180,150,90,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(180,150,90,0.3) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--color-border-gold)] bg-black/30 backdrop-blur-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-[var(--color-accent-green)] rounded-full animate-pulse" />
            <span className="text-[var(--color-text-dim)] text-xs uppercase tracking-widest">
              MMORPG 2D Online • Jogue Grátis
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-6xl md:text-8xl font-bold font-[var(--font-display)] mb-6 leading-tight animate-hero-title"
            style={{
              background: 'linear-gradient(135deg, #ddaa33 0%, #fff5d0 25%, #ddaa33 50%, #aa7722 75%, #ddaa33 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s ease-in-out infinite, heroTitle 0.8s ease-out',
            }}
          >
            RPG Benarcade
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-[var(--color-text-dim)] mb-4 max-w-2xl mx-auto animate-hero-sub leading-relaxed">
            Embarque em uma aventura épica no mundo de <span className="text-[var(--color-gold-accent)]">Benarcade</span>.
            Escolha sua classe, conquiste territórios e domine o PvP.
          </p>
          <p className="text-base text-[var(--color-text-dim)] opacity-60 mb-10 animate-hero-sub-delay">
            4 classes únicas • Mundo aberto • PvP em tempo real • Guildas e Alianças
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-hero-cta">
            <button
              onClick={onPlay}
              className="group relative px-10 py-4 bg-gradient-to-r from-[var(--color-gold-accent)] to-yellow-600 text-black font-bold rounded-xl text-lg hover:scale-105 transition-all shadow-[0_0_40px_rgba(220,170,50,0.3)] hover:shadow-[0_0_60px_rgba(220,170,50,0.5)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                ⚔️ Começar Aventura
              </span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 border border-[var(--color-border-gold)] text-[var(--color-gold-accent)] font-semibold rounded-xl hover:bg-[var(--color-glow-gold)] transition-all text-lg"
            >
              Saiba Mais ↓
            </a>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 mt-16 animate-hero-stats">
            <StatCounter icon="👥" value="Online" label="Multiplayer" />
            <StatCounter icon="🗺️" value="6+" label="Zonas" />
            <StatCounter icon="⚔️" value="4" label="Classes" />
            <StatCounter icon="🏆" value="∞" label="Aventuras" />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-slow">
          <span className="text-[var(--color-text-dim)] text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 border-2 border-[var(--color-border-gold)] rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-[var(--color-gold-accent)] rounded-full animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ======== FEATURES SECTION ======== */}
      <section id="features" className="relative py-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(180,150,90,0.02)] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            id="feat-header"
            data-animate
            className={`text-center mb-20 transition-all duration-700 ${isVisible('feat-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <span className="text-[var(--color-gold-accent)] text-sm uppercase tracking-[0.3em] font-semibold">
              Por que jogar
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-display)] mt-3 text-[var(--color-text-light)]">
              Um RPG feito para{' '}
              <span className="text-[var(--color-gold-accent)]">Lendas</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold-accent)] to-transparent mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={f.title}
                id={`feat-${i}`}
                data-animate
                className={`group glass-panel p-8 hover:border-[var(--color-gold-accent)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(180,150,90,0.15)] ${
                  isVisible(`feat-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-xl font-bold text-[var(--color-text-light)] mb-3">{f.title}</h3>
                <p className="text-[var(--color-text-dim)] leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== CLASSES SECTION ======== */}
      <section id="classes" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            id="class-header"
            data-animate
            className={`text-center mb-20 transition-all duration-700 ${isVisible('class-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <span className="text-[var(--color-accent-purple)] text-sm uppercase tracking-[0.3em] font-semibold">
              Escolha seu destino
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-display)] mt-3">
              4 Classes{' '}
              <span className="text-[var(--color-accent-purple)]">Únicas</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-purple)] to-transparent mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {classes.map((c, i) => (
              <div
                key={c.name}
                id={`class-${i}`}
                data-animate
                className={`group relative glass-panel overflow-hidden transition-all duration-500 hover:-translate-y-1 ${
                  isVisible(`class-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                {/* Glow background */}
                <div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"
                  style={{ background: c.color }}
                />
                <div className="relative z-10 p-8 flex gap-6">
                  <div
                    className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border transition-all group-hover:scale-110"
                    style={{
                      borderColor: `${c.color}40`,
                      background: `${c.color}10`,
                    }}
                  >
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold mb-1" style={{ color: c.color }}>
                      {c.name}
                    </h3>
                    <p className="text-[var(--color-text-dim)] text-sm mb-4">{c.desc}</p>
                    {/* Stats bars */}
                    <div className="space-y-2">
                      {c.stats.map((s) => (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="text-[var(--color-text-dim)] text-xs w-16">{s.label}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: isVisible(`class-${i}`) ? `${s.value}%` : '0%',
                                background: `linear-gradient(90deg, ${c.color}, ${c.color}88)`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== WORLD MAP SECTION ======== */}
      <section id="world" className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(68,136,204,0.03)] to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div
            id="world-header"
            data-animate
            className={`text-center mb-20 transition-all duration-700 ${isVisible('world-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <span className="text-[var(--color-accent-blue)] text-sm uppercase tracking-[0.3em] font-semibold">
              Explore
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-display)] mt-3">
              Um Mundo{' '}
              <span className="text-[var(--color-accent-blue)]">Vasto</span> te Espera
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-blue)] to-transparent mx-auto mt-6" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {zones.map((z, i) => (
              <div
                key={z.name}
                id={`zone-${i}`}
                data-animate
                className={`group glass-panel p-6 hover:border-[var(--color-accent-blue)] transition-all duration-500 hover:-translate-y-1 ${
                  isVisible(`zone-${i}`) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="text-3xl mb-3">{z.icon}</div>
                <h3 className="text-lg font-bold text-[var(--color-text-light)] mb-1">{z.name}</h3>
                <span
                  className="inline-block text-xs px-2 py-0.5 rounded-full mb-3"
                  style={{ background: `${z.color}20`, color: z.color }}
                >
                  {z.type}
                </span>
                <p className="text-[var(--color-text-dim)] text-sm leading-relaxed">{z.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======== PVP SECTION ======== */}
      <section id="pvp" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div
            id="pvp-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ${isVisible('pvp-header') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <span className="text-[var(--color-accent-red)] text-sm uppercase tracking-[0.3em] font-semibold">
              Competição
            </span>
            <h2 className="text-4xl md:text-5xl font-bold font-[var(--font-display)] mt-3">
              PvP em{' '}
              <span className="text-[var(--color-accent-red)]">Tempo Real</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--color-accent-red)] to-transparent mx-auto mt-6" />
          </div>

          <div
            id="pvp-content"
            data-animate
            className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ${
              isVisible('pvp-content') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            {/* Left: PvP Arena visual */}
            <div className="relative">
              <div className="glass-panel p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-red)]/5 to-transparent" />
                <div className="relative z-10 space-y-6">
                  {/* Mock battle HUD */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-red)]/20 border border-[var(--color-accent-red)]/30 flex items-center justify-center text-lg">⚔️</div>
                      <div>
                        <div className="text-sm font-bold">DragonSlayer</div>
                        <div className="text-xs text-[var(--color-text-dim)]">Guerreiro Lv.45</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-accent-red)] animate-pulse">VS</div>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-bold text-right">ShadowBlade</div>
                        <div className="text-xs text-[var(--color-text-dim)] text-right">Assassino Lv.43</div>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-purple)]/20 border border-[var(--color-accent-purple)]/30 flex items-center justify-center text-lg">🗡️</div>
                    </div>
                  </div>
                  {/* HP bars mock */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--color-text-dim)]">DragonSlayer</span>
                        <span className="text-[var(--color-hp)]">1,840 / 2,400</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[var(--color-hp)] to-red-400 rounded-full" style={{ width: '76%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--color-text-dim)]">ShadowBlade</span>
                        <span className="text-[var(--color-hp)]">620 / 1,100</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[var(--color-hp)] to-red-400 rounded-full" style={{ width: '56%' }} />
                      </div>
                    </div>
                  </div>
                  {/* Combat log */}
                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-[var(--color-accent-red)]">⚔️ DragonSlayer usou <span className="text-[var(--color-gold-accent)]">Investida Brutal</span> → 284 dmg</p>
                    <p className="text-[var(--color-accent-purple)]">🗡️ ShadowBlade usou <span className="text-[var(--color-gold-accent)]">Golpe das Sombras</span> → 412 CRIT!</p>
                    <p className="text-[var(--color-accent-red)]">⚔️ DragonSlayer usou <span className="text-[var(--color-gold-accent)]">Escudo Divino</span> → DEF +40%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: PvP features */}
            <div className="space-y-6">
              {pvpFeatures.map((f) => (
                <div key={f.title} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 flex items-center justify-center text-xl">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-light)] mb-1">{f.title}</h3>
                    <p className="text-[var(--color-text-dim)] text-sm">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======== FINAL CTA SECTION ======== */}
      <section className="relative py-32 px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(180,150,90,0.05)] to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, var(--color-gold-accent), transparent 70%)' }}
          />
        </div>
        <div
          id="cta-final"
          data-animate
          className={`max-w-3xl mx-auto text-center relative z-10 transition-all duration-700 ${
            isVisible('cta-final') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-6xl mb-6">🏰</div>
          <h2 className="text-4xl md:text-6xl font-bold font-[var(--font-display)] mb-6">
            Sua Lenda{' '}
            <span className="text-[var(--color-gold-accent)]">Começa Agora</span>
          </h2>
          <p className="text-lg text-[var(--color-text-dim)] mb-10 max-w-xl mx-auto">
            Junte-se a centenas de jogadores, escolha sua classe, forme alianças e conquiste o mundo de Benarcade.
            É grátis para jogar.
          </p>
          <button
            onClick={onPlay}
            className="group relative px-12 py-5 bg-gradient-to-r from-[var(--color-gold-accent)] to-yellow-600 text-black font-bold rounded-xl text-xl hover:scale-105 transition-all shadow-[0_0_60px_rgba(220,170,50,0.3)] hover:shadow-[0_0_80px_rgba(220,170,50,0.5)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              ⚔️ Jogar Gratuitamente
            </span>
          </button>
          <p className="text-[var(--color-text-dim)] text-xs mt-6 opacity-50">
            Sem downloads • Jogue direto no navegador • Crie sua conta em segundos
          </p>
        </div>
      </section>

      {/* ======== FOOTER ======== */}
      <footer className="border-t border-[var(--color-border-gold)]/20 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <span className="text-[var(--color-gold-accent)] font-bold font-[var(--font-display)]">
              RPG Benarcade
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-dim)]">
            <a href="#features" className="hover:text-[var(--color-gold-accent)] transition-colors">Features</a>
            <a href="#classes" className="hover:text-[var(--color-gold-accent)] transition-colors">Classes</a>
            <a href="#world" className="hover:text-[var(--color-gold-accent)] transition-colors">Mundo</a>
            <a href="#pvp" className="hover:text-[var(--color-gold-accent)] transition-colors">PvP</a>
          </div>
          <div className="text-[var(--color-text-dim)] text-xs opacity-50">
            © 2026 RPG Benarcade. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- Helper Components ----
function StatCounter({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-[var(--color-gold-accent)]">{value}</div>
      <div className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ---- Data ----
const features = [
  {
    icon: '⚔️',
    title: 'Combate Tático',
    desc: 'Sistema de combate em tempo real com skills únicas, combos e mecânicas de crítico. Cada classe tem seu estilo de luta.',
  },
  {
    icon: '🌍',
    title: 'Mundo Aberto',
    desc: '6+ zonas para explorar: da pacata Vila Inicial até as perigosas Ruínas Abissais. Cada zona com NPCs, monstros e segredos.',
  },
  {
    icon: '👥',
    title: 'Multiplayer Real',
    desc: 'Veja outros jogadores no mapa em tempo real. Chat integrado, guildas e sistema de alianças para dominar territórios.',
  },
  {
    icon: '🏰',
    title: 'Conquista de Territórios',
    desc: 'Capture e defenda territórios com sua guilda. Controle pontos estratégicos e receba bônus de recursos e XP.',
  },
  {
    icon: '🎒',
    title: 'Loot & Crafting',
    desc: 'Itens de 5 raridades: Comum a Lendário. Drops de monstros, recompensas de PvP e equipamentos exclusivos.',
  },
  {
    icon: '📈',
    title: 'Progressão Infinita',
    desc: 'Sistema de níveis até 100, árvore de habilidades, títulos desbloqueáveis e ranking PvP competitivo.',
  },
];

const classes = [
  {
    name: 'Guerreiro',
    icon: '⚔️',
    color: '#e04050',
    desc: 'Tanque devastador. Alta defesa e HP com combate corpo-a-corpo brutal. O pilar de qualquer equipe.',
    stats: [
      { label: 'HP', value: 100 },
      { label: 'Ataque', value: 72 },
      { label: 'Defesa', value: 93 },
      { label: 'Velocidade', value: 55 },
    ],
  },
  {
    name: 'Mago',
    icon: '🔮',
    color: '#9966cc',
    desc: 'Mestre arcano. Dano mágico em área devastador e magias de suporte. Frágil mas letal à distância.',
    stats: [
      { label: 'HP', value: 50 },
      { label: 'Ataque', value: 100 },
      { label: 'Defesa', value: 40 },
      { label: 'Velocidade', value: 48 },
    ],
  },
  {
    name: 'Arqueiro',
    icon: '🏹',
    color: '#44bb66',
    desc: 'Precisão mortal. Longo alcance com alta mobilidade. Domina o campo de batalha com tiros certeiros.',
    stats: [
      { label: 'HP', value: 65 },
      { label: 'Ataque', value: 80 },
      { label: 'Defesa', value: 53 },
      { label: 'Velocidade', value: 85 },
    ],
  },
  {
    name: 'Assassino',
    icon: '🗡️',
    color: '#ddaa33',
    desc: 'Sombra letal. Maior velocidade e dano crítico explosivo. Elimina alvos antes que percebam.',
    stats: [
      { label: 'HP', value: 55 },
      { label: 'Ataque', value: 88 },
      { label: 'Defesa', value: 47 },
      { label: 'Velocidade', value: 100 },
    ],
  },
];

const zones = [
  { name: 'Vila Inicial', icon: '🏘️', type: 'Cidade Segura', color: '#44bb66', desc: 'Área segura para novos aventureiros. NPCs, lojas e o início de toda jornada.' },
  { name: 'Planícies Verdejantes', icon: '🌿', type: 'Campo', color: '#88cc44', desc: 'Campos abertos com monstros de nível baixo. Perfeito para treinar e ganhar XP.' },
  { name: 'Floresta Sombria', icon: '🌲', type: 'Floresta', color: '#338855', desc: 'Floresta densa e perigosa. Monstros mais fortes e drops raros escondidos na escuridão.' },
  { name: 'Montanhas Flamejantes', icon: '🌋', type: 'Montanha', color: '#cc4422', desc: 'Terreno vulcânico com monstros de fogo. Requer equipamento resistente ao calor.' },
  { name: 'Arena PvP', icon: '🏟️', type: 'PvP', color: '#cc3344', desc: 'O campo de batalha definitivo. Duele contra outros jogadores por rating e glória.' },
  { name: 'Ruínas Abissais', icon: '💀', type: 'Dungeon', color: '#9966cc', desc: 'A dungeon mais perigosa. Monstros de elite e drops lendários para os mais bravos.' },
];

const pvpFeatures = [
  { icon: '⚡', title: 'Combate em Tempo Real', desc: 'Sem turnos. Ação contínua com skills, esquivas e posicionamento tático.' },
  { icon: '🏆', title: 'Ranking Competitivo', desc: 'Sistema de rating ELO. Suba no ranking e conquiste títulos exclusivos.' },
  { icon: '🛡️', title: 'Guerras de Aliança', desc: 'Guildas competem por territórios em batalhas épicas com dezenas de jogadores.' },
  { icon: '🎯', title: 'Balanceamento Constante', desc: 'Cada classe é viável. Skills e atributos ajustados para combates justos e estratégicos.' },
];
