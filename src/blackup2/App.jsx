import { useMemo, useState } from 'react'
import {
  Apple,
  BadgeCheck,
  BarChart3,
  Camera,
  Clock3,
  Crown,
  Database,
  Gauge,
  Home,
  Pause,
  Play,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import './App.css'

const foodSamples = [
  {
    id: 'F001',
    barcode: '8850001000011',
    name: 'น้ำอัดลมสายลับซ่า',
    category: 'เครื่องดื่ม',
    sugar: 35,
    sodium: 25,
    fat: 0,
    videoUrl: 'https://example.com/soda.mp4',
  },
  {
    id: 'F002',
    barcode: '8850001000028',
    name: 'โยเกิร์ตผลไม้',
    category: 'ขนม',
    sugar: 11,
    sodium: 90,
    fat: 2,
    videoUrl: 'https://example.com/yogurt.mp4',
  },
  {
    id: 'F003',
    barcode: '8850001000035',
    name: 'มันฝรั่งกรอบรสเค็ม',
    category: 'ขนม',
    sugar: 4,
    sodium: 520,
    fat: 14,
    videoUrl: 'https://example.com/chips.mp4',
  },
  {
    id: 'F004',
    barcode: '8850001000042',
    name: 'ไอศกรีมนมสด',
    category: 'ไอศกรีม',
    sugar: 18,
    sodium: 110,
    fat: 8,
    videoUrl: 'https://example.com/icecream.mp4',
  },
]

const avatars = ['🕵️‍♀️', '🕵️‍♂️', '🦸‍♀️', '🦸‍♂️', '🥷', '🤖', '🧑‍🚀', '👩‍🔬', '🧙‍♀️', '🧙‍♂️']

const mockPlayers = [
  { id: 'P01', name: 'น้องฟ้า', avatar: '🦸‍♀️', score: 4.72, scans: 8 },
  { id: 'P02', name: 'น้องต้น', avatar: '🕵️‍♂️', score: 4.23, scans: 7 },
  { id: 'P03', name: 'น้องมุก', avatar: '🧑‍🚀', score: 3.88, scans: 6 },
  { id: 'P04', name: 'น้องบอส', avatar: '🥷', score: 3.21, scans: 5 },
  { id: 'P05', name: 'น้องพลอย', avatar: '👩‍🔬', score: 2.46, scans: 4 },
]

function getNutritionStar(value, type) {
  const rules = {
    sugar: [
      { max: 6, star: 5 },
      { max: 12, star: 4 },
      { max: 18, star: 3 },
      { max: 24, star: 2 },
      { max: Infinity, star: 1 },
    ],
    sodium: [
      { max: 120, star: 5 },
      { max: 240, star: 4 },
      { max: 360, star: 3 },
      { max: 480, star: 2 },
      { max: Infinity, star: 1 },
    ],
    fat: [
      { max: 3, star: 5 },
      { max: 6, star: 4 },
      { max: 9, star: 3 },
      { max: 12, star: 2 },
      { max: Infinity, star: 1 },
    ],
  }

  return rules[type].find((rule) => value <= rule.max).star
}

function calculateFoodScore(food) {
  const sugarStar = getNutritionStar(Number(food.sugar), 'sugar')
  const sodiumStar = getNutritionStar(Number(food.sodium), 'sodium')
  const fatStar = getNutritionStar(Number(food.fat), 'fat')
  const average = (sugarStar + sodiumStar + fatStar) / 3

  return {
    sugarStar,
    sodiumStar,
    fatStar,
    average: Number(average.toFixed(2)),
  }
}

function getAgentLevel(score) {
  if (score >= 4.5) {
    return {
      emoji: '🟢',
      title: 'สุดยอดสายลับระดับตำนาน',
      subtitle: 'Legendary Agent',
      tone: 'safe',
      message: 'ยอดเยี่ยม! เลือกอาหารได้ดีต่อสุขภาพมาก พร้อมลุยภารกิจต่อไป',
    }
  }

  if (score >= 3.5) {
    return {
      emoji: '🟡',
      title: 'สายลับมือโปร',
      subtitle: 'Professional Agent',
      tone: 'watch',
      message: 'ฝีมือดีมาก แต่ยังมีบางรายการที่ควรระวังเรื่องหวาน มัน เค็ม',
    }
  }

  if (score >= 2.5) {
    return {
      emoji: '🟠',
      title: 'สายลับฝึกหัด',
      subtitle: 'Trainee Agent',
      tone: 'risk',
      message: 'เริ่มพบอาหารเสี่ยงสะสม ควรเลือกอาหารดาวสูงมากขึ้น',
    }
  }

  return {
    emoji: '🔴',
    title: 'สายลับติดกับดัก',
    subtitle: 'Agent in Danger!',
    tone: 'danger',
    message: 'อันตราย! อาหารมีหวาน มัน เค็ม สูง ควรรีบเปลี่ยนตัวเลือก',
  }
}

function getSpeedBonus(totalSeconds, scannedCount) {
  if (!scannedCount) return { avgSeconds: 0, bonus: 0, label: 'ยังไม่เริ่มสแกน' }

  const avgSeconds = totalSeconds / scannedCount

  if (avgSeconds <= 15) return { avgSeconds, bonus: 0.05, label: '⚡ สายลับสายฟ้า' }
  if (avgSeconds <= 30) return { avgSeconds, bonus: 0.03, label: '🏃 สายลับว่องไว' }
  if (avgSeconds <= 45) return { avgSeconds, bonus: 0.01, label: '🚶 สายลับรอบคอบ' }

  return { avgSeconds, bonus: 0, label: '🐢 สายลับใจเย็น' }
}

function App() {
  const [page, setPage] = useState('home')
  const [roomStatus, setRoomStatus] = useState('waiting')
  const [duration, setDuration] = useState(3)
  const [foodLimit, setFoodLimit] = useState(5)
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0])
  const [barcode, setBarcode] = useState('8850001000011')
  const [scanResults, setScanResults] = useState([])

  const leaderboard = useMemo(
    () => [...mockPlayers].sort((a, b) => b.score - a.score).slice(0, 5),
    [],
  )

  const averageScore = useMemo(() => {
    if (!scanResults.length) return 0
    const total = scanResults.reduce((sum, item) => sum + item.score.average, 0)
    return Number((total / scanResults.length).toFixed(2))
  }, [scanResults])

  const speed = getSpeedBonus(duration * 60, scanResults.length)
  const finalScore = Number((averageScore + speed.bonus).toFixed(3))
  const finalLevel = getAgentLevel(averageScore)

  function handleScanSubmit(event) {
    event.preventDefault()

    const food = foodSamples.find((item) => item.barcode === barcode.trim())

    if (!food) {
      setScanResults((current) => [
        {
          id: crypto.randomUUID(),
          notFound: true,
          barcode,
          message: 'ยังไม่มีฐานข้อมูลอาหารชนิดนี้ในระบบ',
        },
        ...current,
      ])
      return
    }

    const score = calculateFoodScore(food)
    const level = getAgentLevel(score.average)

    setScanResults((current) => [
      {
        id: crypto.randomUUID(),
        food,
        score,
        level,
        scannedAt: new Date().toLocaleTimeString('th-TH'),
      },
      ...current,
    ])
  }

  return (
    <main className="app-shell">
      <section className="hero-section">
        <nav className="topbar">
          <button className="brand" type="button" onClick={() => setPage('home')}>
            <span className="brand-icon">🕵️</span>
            <span>
              <strong>เกมลับ จับ หวาน มัน เค็ม</strong>
              <small>SFSGame Nutrition Detective</small>
            </span>
          </button>

          <div className="nav-actions" aria-label="เปลี่ยนหน้าเกม">
            <button className={page === 'home' ? 'nav-pill active' : 'nav-pill'} onClick={() => setPage('home')}>
              <Home size={18} /> หน้าหลัก
            </button>
            <button className={page === 'admin' ? 'nav-pill active' : 'nav-pill'} onClick={() => setPage('admin')}>
              <Database size={18} /> Admin ครู
            </button>
            <button className={page === 'host' ? 'nav-pill active' : 'nav-pill'} onClick={() => setPage('host')}>
              <Users size={18} /> สร้างห้อง
            </button>
            <button className={page === 'player' ? 'nav-pill active' : 'nav-pill'} onClick={() => setPage('player')}>
              <QrCode size={18} /> ผู้เล่น
            </button>
          </div>
        </nav>

        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'admin' && <AdminPage />}
        {page === 'host' && (
          <HostPage
            roomStatus={roomStatus}
            setRoomStatus={setRoomStatus}
            duration={duration}
            setDuration={setDuration}
            foodLimit={foodLimit}
            setFoodLimit={setFoodLimit}
            leaderboard={leaderboard}
          />
        )}
        {page === 'player' && (
          <PlayerPage
            roomStatus={roomStatus}
            playerName={playerName}
            setPlayerName={setPlayerName}
            selectedAvatar={selectedAvatar}
            setSelectedAvatar={setSelectedAvatar}
            barcode={barcode}
            setBarcode={setBarcode}
            scanResults={scanResults}
            handleScanSubmit={handleScanSubmit}
            averageScore={averageScore}
            speed={speed}
            finalScore={finalScore}
            finalLevel={finalLevel}
          />
        )}
      </section>
    </main>
  )
}

function HomePage({ setPage }) {
  return (
    <div className="home-grid">
      <div className="mission-card">
        <span className="eyebrow">ภารกิจสายลับโภชนาการ</span>
        <h1>
          สแกนขนม วิเคราะห์ <span>หวาน มัน เค็ม</span> แล้วชิงอันดับสายลับสุขภาพ
        </h1>
        <p>
          เกมสำหรับห้องเรียนที่ให้ครูสร้างห้อง นักเรียนเลือกอวตาร สแกนบาร์โค้ดอาหาร
          และดูคะแนนแบบสนุก เข้าใจง่าย พร้อมอันดับ Real-time
        </p>

        <div className="hero-buttons">
          <button className="game-button primary" onClick={() => setPage('host')}>
            <Play size={20} /> สร้างห้องเกม
          </button>
          <button className="game-button secondary" onClick={() => setPage('player')}>
            <Camera size={20} /> เข้าร่วมภารกิจ
          </button>
        </div>
      </div>

      <div className="spy-panel">
        <div className="scanner-ring">
          <span>🕵️‍♀️</span>
        </div>
        <div className="floating-card one">น้ำตาล ≤ 6g = ⭐⭐⭐⭐⭐</div>
        <div className="floating-card two">โซเดียม ≤ 120mg = ปลอดภัย</div>
        <div className="floating-card three">ไขมัน ≤ 3g = สุดยอด</div>
      </div>

      <FeatureCard icon={<ShieldCheck />} title="ตรวจโภชนาการ" text="คำนวณดาวจากน้ำตาล โซเดียม และไขมัน" />
      <FeatureCard icon={<Gauge />} title="โบนัสความเร็ว" text="คิดคะแนนเพิ่มจากเวลาเฉลี่ยต่อการสแกน" />
      <FeatureCard icon={<Trophy />} title="Leaderboard" text="จัดอันดับผู้เล่น 1–5 แบบห้องเรียนแข่งขัน" />
    </div>
  )
}

function AdminPage() {
  return (
    <div className="page-grid">
      <PageHeader
        icon={<Database />}
        title="Admin ครู"
        subtitle="จัดการฐานข้อมูลอาหาร ห้องเกม และสรุปพฤติกรรมการเลือกบริโภค"
      />

      <div className="stats-grid">
        <StatCard label="อาหารในระบบ" value="128" icon={<Apple />} tone="orange" />
        <StatCard label="ห้องเกมวันนี้" value="12" icon={<Users />} tone="blue" />
        <StatCard label="คะแนนเฉลี่ย" value="3.86" icon={<Star />} tone="yellow" />
        <StatCard label="อาหารเสี่ยงสูง" value="24" icon={<BarChart3 />} tone="red" />
      </div>

      <section className="glass-card">
        <div className="section-title">
          <h2>เพิ่มข้อมูลอาหาร</h2>
          <button className="game-button primary small">
            <Plus size={18} /> เพิ่มรายการ
          </button>
        </div>

        <div className="food-table">
          {foodSamples.map((food) => {
            const score = calculateFoodScore(food)
            const level = getAgentLevel(score.average)

            return (
              <article className="food-row" key={food.id}>
                <div>
                  <strong>{food.name}</strong>
                  <small>{food.category} • Barcode: {food.barcode}</small>
                </div>
                <div className="nutrition-tags">
                  <span>น้ำตาล {food.sugar}g</span>
                  <span>โซเดียม {food.sodium}mg</span>
                  <span>ไขมัน {food.fat}g</span>
                </div>
                <div className={`level-badge ${level.tone}`}>{level.emoji} {score.average} ดาว</div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function HostPage({
  roomStatus,
  setRoomStatus,
  duration,
  setDuration,
  foodLimit,
  setFoodLimit,
  leaderboard,
}) {
  const statusText = {
    waiting: 'รอผู้เล่นเข้าห้อง',
    playing: 'กำลังเล่น',
    paused: 'ผู้สร้างขอพักซักครู่',
    finished: 'จบเกมแล้ว',
  }

  return (
    <div className="page-grid">
      <PageHeader
        icon={<Users />}
        title="ผู้สร้างห้องเกม"
        subtitle="กำหนดเวลา จำนวนอาหาร และควบคุมสถานะเกมในห้องเรียน"
      />

      <div className="host-layout">
        <section className="glass-card">
          <div className="room-code-card">
            <span>รหัสห้อง</span>
            <strong>SFS-482</strong>
            <small>ให้นักเรียนใช้รหัสนี้เพื่อเข้าร่วมเกม</small>
          </div>

          <div className="form-grid">
            <label>
              เวลาเล่น
              <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                <option value={3}>3 นาที</option>
                <option value={5}>5 นาที</option>
              </select>
            </label>

            <label>
              จำนวนอาหาร
              <select value={foodLimit} onChange={(event) => setFoodLimit(Number(event.target.value))}>
                {[5, 6, 7, 8, 9, 10].map((amount) => (
                  <option value={amount} key={amount}>{amount} ชิ้น</option>
                ))}
              </select>
            </label>
          </div>

          <div className={`status-banner ${roomStatus}`}>
            <Clock3 size={20} />
            สถานะ: {statusText[roomStatus]}
          </div>

          <div className="control-buttons">
            <button className="game-button primary" onClick={() => setRoomStatus('playing')}>
              <Play size={19} /> เริ่มเกม
            </button>
            <button className="game-button warning" onClick={() => setRoomStatus('paused')}>
              <Pause size={19} /> หยุดชั่วคราว
            </button>
            <button className="game-button success" onClick={() => setRoomStatus('finished')}>
              <Trophy size={19} /> จบเกม
            </button>
          </div>
        </section>

        <section className="glass-card">
          <div className="section-title">
            <h2>อันดับสายลับ Top 5</h2>
            <span className="live-dot">● Realtime</span>
          </div>
          <Leaderboard players={leaderboard} />
        </section>
      </div>
    </div>
  )
}

function PlayerPage({
  roomStatus,
  playerName,
  setPlayerName,
  selectedAvatar,
  setSelectedAvatar,
  barcode,
  setBarcode,
  scanResults,
  handleScanSubmit,
  averageScore,
  speed,
  finalScore,
  finalLevel,
}) {
  const canPlay = roomStatus === 'playing'

  return (
    <div className="page-grid">
      <PageHeader
        icon={<QrCode />}
        title="ผู้เล่นนักเรียน"
        subtitle="เลือกอวตาร ตั้งชื่อ แล้วสแกนบาร์โค้ดอาหารเพื่อวิเคราะห์คะแนน"
      />

      <div className="player-layout">
        <section className="glass-card">
          <div className="avatar-preview">{selectedAvatar}</div>

          <label>
            ชื่อสายลับ
            <input
              value={playerName}
              placeholder="เช่น น้องฟ้า"
              onChange={(event) => setPlayerName(event.target.value)}
            />
          </label>

          <div className="avatar-grid">
            {avatars.map((avatar) => (
              <button
                type="button"
                key={avatar}
                className={selectedAvatar === avatar ? 'avatar active' : 'avatar'}
                onClick={() => setSelectedAvatar(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>

          <div className={`status-banner ${roomStatus}`}>
            {roomStatus === 'paused' ? '⏸️ ผู้สร้างขอพักซักครู่' : `สถานะห้อง: ${roomStatus}`}
          </div>

          <form className="scan-form" onSubmit={handleScanSubmit}>
            <label>
              Barcode
              <input
                value={barcode}
                disabled={!canPlay}
                onChange={(event) => setBarcode(event.target.value)}
              />
            </label>
            <button className="game-button primary" type="submit" disabled={!canPlay}>
              <Camera size={19} /> สแกนและบันทึก
            </button>
          </form>
        </section>

        <section className="glass-card result-card">
          <div className={`big-level ${finalLevel.tone}`}>
            <span>{finalLevel.emoji}</span>
            <div>
              <h2>{finalLevel.title}</h2>
              <p>{finalLevel.subtitle}</p>
            </div>
          </div>

          <div className="score-summary">
            <StatCard label="คะแนนเฉลี่ย" value={averageScore || '-'} icon={<Star />} tone="yellow" />
            <StatCard label="โบนัสความเร็ว" value={`+${speed.bonus.toFixed(3)}`} icon={<Sparkles />} tone="blue" />
            <StatCard label="คะแนนจัดอันดับ" value={finalScore || '-'} icon={<Crown />} tone="orange" />
          </div>

          <p className="level-message">{finalLevel.message}</p>

          <div className="scan-list">
            {scanResults.length === 0 && (
              <div className="empty-state">ยังไม่มีรายการสแกน เริ่มภารกิจได้เลย!</div>
            )}

            {scanResults.map((result) => (
              <article className="scan-item" key={result.id}>
                {result.notFound ? (
                  <>
                    <strong>ไม่พบข้อมูล</strong>
                    <small>Barcode: {result.barcode}</small>
                    <span className="level-badge danger">🔴 {result.message}</span>
                  </>
                ) : (
                  <>
                    <div>
                      <strong>{result.food.name}</strong>
                      <small>{result.scannedAt} • {result.food.category}</small>
                    </div>
                    <div className="mini-stars">
                      <span>น้ำตาล {result.score.sugarStar}★</span>
                      <span>โซเดียม {result.score.sodiumStar}★</span>
                      <span>ไขมัน {result.score.fatStar}★</span>
                    </div>
                    <span className={`level-badge ${result.level.tone}`}>
                      {result.level.emoji} {result.score.average} ดาว
                    </span>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function PageHeader({ icon, title, subtitle }) {
  return (
    <header className="page-header">
      <div className="header-icon">{icon}</div>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{text}</p>
    </article>
  )
}

function StatCard({ label, value, icon, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function Leaderboard({ players }) {
  return (
    <div className="leaderboard">
      {players.map((player, index) => (
        <article className="leader-row" key={player.id}>
          <span className="rank">{index + 1}</span>
          <span className="player-avatar">{player.avatar}</span>
          <div>
            <strong>{player.name}</strong>
            <small>สแกนแล้ว {player.scans} รายการ</small>
          </div>
          <strong className="score">{player.score.toFixed(3)}</strong>
        </article>
      ))}
    </div>
  )
}

export default App
