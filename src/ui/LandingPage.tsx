// ========================
// Landing Page — RPG Ben Arcade
// Professional responsive showcase
// ========================
import { useState, useEffect, useMemo } from "react";
import "./landing.css";

interface LandingPageProps {
  onPlay: () => void;
}

const HERO_CLASSES = [
  {
    icon: "🗡️",
    name: "Espadachim",
    desc: "Mestre do combate corpo a corpo. Alta defesa e dano constante em batalhas prolongadas.",
    color: "#e8a030",
    stats: { atk: 4, def: 5, spd: 3, mag: 1 },
  },
  {
    icon: "🧙",
    name: "Mago",
    desc: "Dominador dos elementos arcanos. Dano em área devastador com feitiçarias ancestrais.",
    color: "#6688ff",
    stats: { atk: 5, def: 2, spd: 3, mag: 5 },
  },
  {
    icon: "🏹",
    name: "Arqueiro",
    desc: "Precisão mortal à distância. Ataques rápidos e críticos contra inimigos desprevenidos.",
    color: "#44cc66",
    stats: { atk: 4, def: 2, spd: 5, mag: 2 },
  },
  {
    icon: "🔱",
    name: "Lanceiro",
    desc: "Alcance superior com golpes perfurantes. Equilibra ataque e defesa com maestria.",
    color: "#cc5544",
    stats: { atk: 4, def: 4, spd: 4, mag: 2 },
  },
];

const GAME_FEATURES = [
  {
    icon: "🌍",
    title: "Mundo Vasto",
    desc: "5 áreas únicas para explorar: Vila, Campos, Floresta, Masmorra e Arena.",
  },
  {
    icon: "⚔️",
    title: "Combate em Tempo Real",
    desc: "Sistema de combate dinâmico com ataques, habilidades especiais e combos devastadores.",
  },
  {
    icon: "👥",
    title: "Multiplayer Online",
    desc: "Jogue com amigos em tempo real. Veja outros jogadores e coopere em batalhas épicas.",
  },
  {
    icon: "🎒",
    title: "Loot & Equipamentos",
    desc: "Centenas de itens, armas e armaduras. De comum a lendário — equipe-se para a glória.",
  },
  {
    icon: "📜",
    title: "Quests & Missões",
    desc: "Histórias envolventes com NPCs, diálogos e recompensas que moldam sua jornada.",
  },
  {
    icon: "🌟",
    title: "Talentos & Evolução",
    desc: "Árvore de habilidades, atributos e talentos únicos para cada classe de herói.",
  },
];

const AREAS = [
  { name: "Vila Medieval", icon: "🏰", desc: "Centro seguro com NPCs, lojas e missões. Sua jornada começa aqui.", color: "#a67c4a" },
  { name: "Campos Abertos", icon: "🌾", desc: "Vastas planícies com fazendas, inimigos fracos e segredos escondidos.", color: "#6b8e23" },
  { name: "Floresta Sombria", icon: "🌲", desc: "Floresta densa e perigosa. Lobos, goblins e cogumelos mágicos.", color: "#2d5a27" },
  { name: "Masmorra Profunda", icon: "💀", desc: "Calabouços repletos de esqueletos, cavaleiros negros e tesouros.", color: "#4a3a5c" },
  { name: "Arena de Combate", icon: "🏟️", desc: "Prove seu valor contra o Dragão Ancestral e outros campeões.", color: "#8b2500" },
];

const ENEMIES = [
  { name: "Slime", icon: "🟢", level: "1-3", danger: 1 },
  { name: "Lobo Selvagem", icon: "🐺", level: "3-5", danger: 2 },
  { name: "Goblin", icon: "👺", level: "4-7", danger: 2 },
  { name: "Esqueleto", icon: "💀", level: "5-8", danger: 3 },
  { name: "Bandido", icon: "🗡️", level: "6-10", danger: 3 },
  { name: "Orc Guerreiro", icon: "👹", level: "8-12", danger: 4 },
  { name: "Cavaleiro Negro", icon: "🖤", level: "12-18", danger: 5 },
  { name: "Dragão Ancestral", icon: "🐉", level: "20+", danger: 5 },
];

const TESTIMONIALS = [
  { text: "O melhor RPG medieval 2D que já joguei! A atmosfera é incrível.", name: "Arthur S.", stars: 5 },
  { text: "As classes são bem balanceadas e o multiplayer funciona perfeitamente.", name: "Maria L.", stars: 5 },
  { text: "Loot garantido em cada inimigo motivou demais a exploração.", name: "Pedro K.", stars: 4 },
];

export function LandingPage({ onPlay }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeClass, setActiveClass] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  // Particles
  const particles = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 15,
        size: Math.random() * 3 + 1,
        duration: 12 + Math.random() * 10,
        opacity: 0.2 + Math.random() * 0.5,
      })),
    []
  );

  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector(".landing-page");
      if (container) setScrolled(container.scrollTop > 50);
    };
    const container = document.querySelector(".landing-page");
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll(".lp-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Auto-cycle classes
  useEffect(() => {
    const timer = setInterval(() => setActiveClass((p) => (p + 1) % HERO_CLASSES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <div className="landing-page">
      {/* Particles */}
      <div className="lp-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="lp-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className={`lp-navbar ${scrolled ? "lp-navbar-scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-nav-brand">
            <span className="lp-nav-icon">⚔️</span>
            <span className="lp-nav-title">RPG Ben Arcade</span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Recursos</a>
            <a href="#classes">Classes</a>
            <a href="#world">Mundo</a>
            <a href="#enemies">Inimigos</a>
          </div>
          <button className="lp-nav-cta" onClick={onPlay}>
            Jogar Agora
          </button>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="lp-hero">
        <div className="lp-hero-overlay" />
        <div className="lp-hero-content">
          <div className="lp-hero-badge">🏰 RPG Medieval 2D Online</div>
          <h1 className="lp-hero-title">
            <span className="lp-title-main">RPG Ben</span>
            <span className="lp-title-accent">Arcade</span>
          </h1>
          <p className="lp-hero-subtitle">Era das Sombras</p>
          <p className="lp-hero-desc">
            Embarque em uma aventura épica medieval. Escolha sua classe, explore 5 mundos únicos,
            derrote monstros lendários e colete equipamentos raros — tudo em tempo real com outros jogadores.
          </p>
          <div className="lp-hero-buttons">
            <button className="lp-btn-primary" onClick={onPlay}>
              <span className="lp-btn-icon">⚔️</span> Começar Aventura
            </button>
            <a href="#features" className="lp-btn-secondary">
              <span className="lp-btn-icon">📖</span> Saiba Mais
            </a>
          </div>
          <div className="lp-hero-stats">
            <div className="lp-stat-item">
              <span className="lp-stat-number">5</span>
              <span className="lp-stat-label">Classes</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat-item">
              <span className="lp-stat-number">5</span>
              <span className="lp-stat-label">Áreas</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat-item">
              <span className="lp-stat-number">8</span>
              <span className="lp-stat-label">Criaturas</span>
            </div>
            <div className="lp-stat-divider" />
            <div className="lp-stat-item">
              <span className="lp-stat-number">100+</span>
              <span className="lp-stat-label">Itens</span>
            </div>
          </div>
        </div>
        <div className="lp-hero-scroll-hint">
          <span>Rolar para baixo</span>
          <div className="lp-scroll-arrow" />
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className={`lp-section lp-features ${isVisible("features") ? "lp-visible" : ""}`}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-badge">✨ Recursos</span>
            <h2>Por Que Jogar RPG Ben Arcade?</h2>
            <p>Um RPG medieval completo, direto no navegador, com recursos dignos de jogos profissionais.</p>
          </div>
          <div className="lp-features-grid">
            {GAME_FEATURES.map((f, i) => (
              <div className="lp-feature-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CLASSES SECTION ===== */}
      <section id="classes" className={`lp-section lp-classes ${isVisible("classes") ? "lp-visible" : ""}`}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-badge">🗡️ Classes</span>
            <h2>Escolha Seu Destino</h2>
            <p>Cada classe possui habilidades únicas, árvore de talentos e estilo de jogo exclusivo.</p>
          </div>
          <div className="lp-classes-showcase">
            <div className="lp-class-tabs">
              {HERO_CLASSES.map((c, i) => (
                <button
                  key={i}
                  className={`lp-class-tab ${activeClass === i ? "active" : ""}`}
                  onClick={() => setActiveClass(i)}
                  style={{ "--accent": c.color } as React.CSSProperties}
                >
                  <span className="lp-class-tab-icon">{c.icon}</span>
                  <span className="lp-class-tab-name">{c.name}</span>
                </button>
              ))}
            </div>
            <div className="lp-class-detail" style={{ "--accent": HERO_CLASSES[activeClass].color } as React.CSSProperties}>
              <div className="lp-class-hero-icon">{HERO_CLASSES[activeClass].icon}</div>
              <h3>{HERO_CLASSES[activeClass].name}</h3>
              <p>{HERO_CLASSES[activeClass].desc}</p>
              <div className="lp-class-stats">
                {Object.entries(HERO_CLASSES[activeClass].stats).map(([key, val]) => (
                  <div className="lp-class-stat" key={key}>
                    <span className="lp-stat-name">
                      {key === "atk" ? "Ataque" : key === "def" ? "Defesa" : key === "spd" ? "Velocidade" : "Magia"}
                    </span>
                    <div className="lp-stat-bar-bg">
                      <div
                        className="lp-stat-bar-fill"
                        style={{ width: `${val * 20}%`, background: HERO_CLASSES[activeClass].color }}
                      />
                    </div>
                    <span className="lp-stat-val">{val}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WORLD SECTION ===== */}
      <section id="world" className={`lp-section lp-world ${isVisible("world") ? "lp-visible" : ""}`}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-badge">🗺️ Mundo</span>
            <h2>Explore Terras Lendárias</h2>
            <p>5 áreas interconectadas, cada uma com seus segredos, inimigos e desafios únicos.</p>
          </div>
          <div className="lp-areas-grid">
            {AREAS.map((a, i) => (
              <div className="lp-area-card" key={i} style={{ "--area-color": a.color, animationDelay: `${i * 0.1}s` } as React.CSSProperties}>
                <div className="lp-area-icon">{a.icon}</div>
                <h3>{a.name}</h3>
                <p>{a.desc}</p>
                <div className="lp-area-bar" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ENEMIES SECTION ===== */}
      <section id="enemies" className={`lp-section lp-enemies ${isVisible("enemies") ? "lp-visible" : ""}`}>
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-badge">👹 Bestiário</span>
            <h2>Criaturas do Mundo</h2>
            <p>De slimes inofensivos a dragões ancestrais — enfrente 8 tipos de inimigos únicos.</p>
          </div>
          <div className="lp-enemies-grid">
            {ENEMIES.map((e, i) => (
              <div className="lp-enemy-card" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="lp-enemy-icon">{e.icon}</div>
                <div className="lp-enemy-info">
                  <h4>{e.name}</h4>
                  <span className="lp-enemy-level">Nível {e.level}</span>
                </div>
                <div className="lp-enemy-danger">
                  {Array.from({ length: 5 }, (_, j) => (
                    <span key={j} className={`lp-danger-dot ${j < e.danger ? "active" : ""}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className={`lp-section lp-testimonials ${isVisible("testimonials") ? "lp-visible" : ""}`} id="testimonials">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <span className="lp-section-badge">⭐ Avaliações</span>
            <h2>O Que Dizem os Aventureiros</h2>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="lp-testimonial-card" key={i}>
                <div className="lp-stars">
                  {"⭐".repeat(t.stars)}
                </div>
                <p>"{t.text}"</p>
                <span className="lp-testimonial-author">— {t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="lp-section lp-final-cta">
        <div className="lp-section-inner">
          <div className="lp-cta-glow" />
          <h2>Pronto Para a Aventura?</h2>
          <p>Crie sua conta gratuitamente e comece a jogar agora mesmo. Seu destino espera!</p>
          <button className="lp-btn-primary lp-btn-large" onClick={onPlay}>
            <span className="lp-btn-icon">⚔️</span> Jogar Gratuitamente
          </button>
          <div className="lp-cta-features">
            <span>✅ 100% Grátis</span>
            <span>✅ Sem Download</span>
            <span>✅ Jogue no Navegador</span>
            <span>✅ Multiplayer Online</span>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-icon">⚔️</span>
            <span>RPG Ben Arcade</span>
            <span className="lp-footer-sub">Era das Sombras</span>
          </div>
          <div className="lp-footer-links">
            <a href="#features">Recursos</a>
            <a href="#classes">Classes</a>
            <a href="#world">Mundo</a>
            <a href="#enemies">Bestiário</a>
          </div>
          <p className="lp-footer-copy">
            © 2026 RPG Ben Arcade. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
