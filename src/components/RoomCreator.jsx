// src/components/RoomCreator.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Users, Clock, Trophy, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db } from '../firebase'; // นำเข้า db จาก firebase.js
import { doc, setDoc, onSnapshot, collection, updateDoc, deleteDoc } from 'firebase/firestore';

export default function RoomCreator() {
  const [roomState, setRoomState] = useState('setup'); 
  const [settings, setSettings] = useState({ timeLimit: 3, itemLimit: 5 });
  const [roomCode, setRoomCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [players, setPlayers] = useState([]);

  const adventureMusic = useRef(new Audio('[https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=epic-adventure-112101.mp3](https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=epic-adventure-112101.mp3)'));
  const celebrationMusic = useRef(new Audio('[https://cdn.pixabay.com/download/audio/2021/08/09/audio_c8c8a73467.mp3?filename=success-fanfare-trumpets-6185.mp3](https://cdn.pixabay.com/download/audio/2021/08/09/audio_c8c8a73467.mp3?filename=success-fanfare-trumpets-6185.mp3)'));

  // --- Real-time Firebase Listener ---
  useEffect(() => {
    if (!roomCode) return;
    
    // ฟังการเปลี่ยนแปลงของนักเรียนในห้องนี้
    const playersRef = collection(db, "rooms", roomCode, "players");
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // เรียงลำดับคะแนนจากมากไปน้อย
      setPlayers(playersData.sort((a, b) => b.score - a.score));
    });

    return () => unsubscribe();
  }, [roomCode]);

  // --- Audio Control ---
  useEffect(() => {
    adventureMusic.current.loop = true;
    celebrationMusic.current.loop = true;

    if (roomState === 'waiting' || roomState === 'playing') {
      celebrationMusic.current.pause();
      celebrationMusic.current.currentTime = 0;
      adventureMusic.current.play().catch(e => console.log("Audio block"));
    } else if (roomState === 'finished') {
      adventureMusic.current.pause();
      celebrationMusic.current.play().catch(e => console.log("Audio block"));
      triggerConfetti();
    } else {
      adventureMusic.current.pause();
      celebrationMusic.current.pause();
    }
  }, [roomState]);

  // --- Timer & State Sync ---
  useEffect(() => {
    let timer;
    if (roomState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && roomState === 'playing') {
      handleFinishGame();
    }
    return () => clearInterval(timer);
  }, [roomState, timeLeft]);

  // --- Firebase Actions ---
  const handleCreateRoom = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    setTimeLeft(settings.timeLimit * 60);
    setRoomState('waiting');

    // สร้างห้องใน Firestore
    await setDoc(doc(db, "rooms", code), {
      status: 'waiting',
      timeLimit: settings.timeLimit,
      itemLimit: settings.itemLimit,
      createdAt: new Date()
    });
  };

  const handleStartGame = async () => {
    if (players.length === 0 && !window.confirm("ยังไม่มีผู้เล่นในห้อง ต้องการเริ่มเกมหรือไม่?")) return;
    setRoomState('playing');
    // อัปเดตสถานะห้องเป็น playing เพื่อให้นักเรียนเริ่มเกมได้
    await updateDoc(doc(db, "rooms", roomCode), { status: 'playing' });
  };

  const handlePauseGame = async () => {
    setRoomState('paused');
    adventureMusic.current.pause();
    await updateDoc(doc(db, "rooms", roomCode), { status: 'paused' });
  };

  const handleResumeGame = async () => {
    setRoomState('playing');
    adventureMusic.current.play();
    await updateDoc(doc(db, "rooms", roomCode), { status: 'playing' });
  };

  const handleFinishGame = async () => {
    setRoomState('finished');
    await updateDoc(doc(db, "rooms", roomCode), { status: 'finished' });
  };

  const handleReset = async () => {
    // ลบห้องทิ้งเมื่อกดเริ่มใหม่
    if(roomCode) await deleteDoc(doc(db, "rooms", roomCode));
    setRoomState('setup');
    setRoomCode('');
    setPlayers([]);
  };

  const triggerConfetti = () => {
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const frame = () => {
      if (animationEnd - Date.now() <= 0) return;
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3b82f6', '#06b6d4', '#10b981'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6', '#06b6d4', '#10b981'] });
      requestAnimationFrame(frame);
    };
    frame();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-slate-200 font-sans relative overflow-hidden flex flex-col">
      <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 pointer-events-none"></div>

      <header className="bg-[#112240]/80 backdrop-blur-md border-b border-blue-500/30 p-6 flex justify-between items-center z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-cyan-400 w-8 h-8" />
          <h1 className="text-2xl font-black text-white tracking-widest uppercase">SFS Command Center</h1>
        </div>
        {roomState !== 'setup' && (
          <div className="bg-blue-950/50 border border-blue-500/50 px-6 py-2 rounded-full flex items-center gap-4 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm">Room Code</span>
            <span className="text-3xl font-black text-white tracking-[0.2em]">{roomCode}</span>
          </div>
        )}
      </header>

      <main className="flex-1 p-8 relative z-10 flex flex-col items-center justify-center">
        
        {roomState === 'setup' && (
          <div className="bg-[#112240]/80 backdrop-blur-xl border border-blue-500/30 p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(37,99,235,0.2)] max-w-xl w-full animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-white mb-8 text-center flex items-center justify-center gap-3"><Settings className="text-blue-500"/> ตั้งค่าภารกิจ</h2>
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3"><Clock className="inline w-4 h-4 mr-1"/> เวลาในการเล่น (นาที)</label>
                <div className="grid grid-cols-2 gap-4">
                  {[3, 5].map(time => (
                    <button key={time} onClick={() => setSettings({...settings, timeLimit: time})}
                      className={`py-4 rounded-2xl font-black text-xl transition-all ${settings.timeLimit === time ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)] border-2 border-blue-400' : 'bg-[#0a192f] text-slate-400 border-2 border-blue-900/50 hover:border-blue-500/50'}`}>
                      {time} นาที
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3"><Trophy className="inline w-4 h-4 mr-1"/> จำนวนไอเทมเป้าหมาย</label>
                <input type="range" min="5" max="10" step="1" value={settings.itemLimit} onChange={(e) => setSettings({...settings, itemLimit: Number(e.target.value)})}
                  className="w-full accent-blue-500 h-2 bg-blue-950 rounded-lg appearance-none cursor-pointer" />
                <div className="text-center mt-4 font-black text-4xl text-white">{settings.itemLimit} <span className="text-lg text-slate-400">ชิ้น</span></div>
              </div>
              <button onClick={handleCreateRoom} className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-2xl py-5 rounded-2xl transition-transform active:scale-95 uppercase tracking-widest">
                สร้างห้องเกม
              </button>
            </div>
          </div>
        )}

        {roomState === 'waiting' && (
          <div className="w-full max-w-5xl flex flex-col items-center animate-in fade-in duration-500">
             <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-900/30 rounded-full mb-4 border-4 border-blue-500/50 animate-pulse">
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-cyan-400 tracking-widest uppercase">รอสายลับเข้าสู่ระบบ...</h2>
             </div>
             <div className="bg-[#112240]/80 backdrop-blur-xl border border-blue-500/30 rounded-[2rem] p-8 w-full min-h-[300px]">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-blue-500/30 pb-4">พร้อมปฏิบัติงาน ({players.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {players.map((p) => (
                    <div key={p.id} className="bg-blue-900/40 border border-blue-500/40 rounded-xl p-4 flex items-center gap-3">
                      <span className="text-2xl">{p.avatar}</span>
                      <span className="font-bold text-blue-100">{p.name}</span>
                    </div>
                  ))}
                </div>
             </div>
             <button onClick={handleStartGame} className="mt-10 bg-green-500 text-slate-900 font-black text-2xl py-5 px-16 rounded-2xl active:scale-95 uppercase tracking-widest flex items-center gap-3">
                <Play className="fill-slate-900" /> เริ่มเกม
             </button>
          </div>
        )}

        {(roomState === 'playing' || roomState === 'paused') && (
          <div className="w-full max-w-6xl animate-in fade-in duration-500">
            {roomState === 'paused' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a192f]/80 backdrop-blur-sm">
                <div className="text-center">
                  <h2 className="text-6xl font-black text-amber-500 tracking-widest uppercase mb-8">เกมหยุดชั่วคราว</h2>
                  <button onClick={handleResumeGame} className="bg-amber-500 text-slate-900 font-black text-2xl py-4 px-12 rounded-2xl flex items-center justify-center gap-3 mx-auto">
                    <Play className="fill-slate-900" /> เล่นต่อ
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-end mb-8">
               <div className="bg-[#112240] border-2 border-blue-500/50 rounded-3xl p-6">
                  <span className="block text-cyan-400 font-bold uppercase tracking-widest text-sm mb-1">เวลาที่เหลือ</span>
                  <span className={`text-6xl font-black tracking-wider ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</span>
               </div>
               <button onClick={handlePauseGame} disabled={roomState === 'paused'} className={`bg-amber-500 text-slate-900 font-black py-4 px-8 rounded-2xl flex items-center gap-2 uppercase tracking-widest ${roomState === 'paused' ? 'opacity-50' : 'active:scale-95'}`}>
                 <Pause className="fill-slate-900" /> หยุดชั่วคราว
               </button>
            </div>

            <div className="bg-[#112240]/80 backdrop-blur-xl border border-blue-500/30 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="bg-blue-900/40 p-4 border-b border-blue-500/30 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2"><Trophy className="text-amber-400"/> กระดานคะแนนเรียลไทม์</h3>
                 <span className="flex items-center gap-2 text-green-400 text-sm font-bold"><span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span> Live Update</span>
               </div>
               <div className="p-6">
                 <table className="w-full text-left border-separate border-spacing-y-3">
                   <thead>
                     <tr className="text-cyan-600 uppercase tracking-widest text-sm">
                       <th className="pb-2 px-4 font-black">อันดับ</th>
                       <th className="pb-2 px-4 font-black">สายลับ</th>
                       <th className="pb-2 px-4 font-black text-right">คะแนนรวม</th>
                     </tr>
                   </thead>
                   <tbody>
                     {players.map((p, index) => (
                       <tr key={p.id} className="bg-blue-950/30">
                         <td className="p-4 rounded-l-xl">
                            <span className={`inline-flex w-8 h-8 rounded-full items-center justify-center font-black ${index === 0 ? 'bg-amber-500 text-slate-900' : index === 1 ? 'bg-slate-300 text-slate-900' : index === 2 ? 'bg-orange-400 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>{index + 1}</span>
                         </td>
                         <td className="p-4 font-bold text-lg text-white flex items-center gap-2"><span className="text-2xl">{p.avatar}</span> {p.name}</td>
                         <td className="p-4 rounded-r-xl font-black text-2xl text-cyan-400 text-right drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                           {p.score > 0 ? p.score.toFixed(3) : "0.000"}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {roomState === 'finished' && (
          <div className="w-full max-w-5xl text-center animate-in zoom-in duration-700 z-20 relative">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 uppercase tracking-widest mb-4">สรุปผลภารกิจ</h1>
            <p className="text-blue-300 font-bold text-xl mb-12">สุดยอดสายลับ 5 อันดับแรก</p>
            <div className="flex flex-col gap-4 max-w-3xl mx-auto mb-12">
              {players.slice(0, 5).map((p, index) => (
                <div key={p.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 shadow-2xl ${index === 0 ? 'bg-gradient-to-r from-amber-600/20 to-amber-900/40 border-amber-500' : 'bg-[#112240] border-blue-900/50'}`}>
                  <div className="flex items-center gap-6">
                    <span className={`text-4xl font-black ${index === 0 ? 'text-amber-400' : 'text-blue-500'}`}>#{index + 1}</span>
                    <span className="text-3xl font-black text-white tracking-wider flex items-center gap-3"><span className="text-4xl">{p.avatar}</span> {p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs uppercase tracking-widest text-slate-400 mb-1">Total Score</span>
                    <span className={`text-4xl font-black ${index === 0 ? 'text-amber-400' : 'text-cyan-400'}`}>{p.score.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleReset} className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xl py-5 px-12 rounded-2xl flex items-center justify-center gap-3 mx-auto">
              <RotateCcw /> ปิดห้องเกม
            </button>
          </div>
        )}
      </main>
    </div>
  );
}