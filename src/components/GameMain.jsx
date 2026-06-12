// src/components/GameMain.jsx
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Camera, Send, XCircle, AlertCircle, Trophy, Clock, PauseCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase'; // นำเข้า Firebase
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// ⚠️ นำเข้าไลบรารีสแกนบาร์โค้ด
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

const HERO_AVATARS = [
  { id: 'h1', icon: '🦸‍♂️', name: 'กัปตันสกาย' }, { id: 'h2', icon: '🦸‍♀️', name: 'วอนเดอร์เกิร์ล' },
  { id: 'h3', icon: '🥷', name: 'นินจาชาโดว์' }, { id: 'h4', icon: '🧙‍♂️', name: 'เมจิกมาสเตอร์' },
  { id: 'h5', icon: '🧙‍♀️', name: 'สการ์เล็ตวิทช์' }, { id: 'h6', icon: '🧚', name: 'แฟรี่พิกซี่' },
  { id: 'h7', icon: '🧛‍♂️', name: 'แวมไพร์ลอร์ด' }, { id: 'h8', icon: '🧛‍♀️', name: 'เลดี้แวมพ์' },
  { id: 'h9', icon: '🦹‍♂️', name: 'ดาร์กไนท์' }, { id: 'h10', icon: '🦹‍♀️', name: 'ควีนพอยซัน' },
];

// ข้อมูลจำลองตามตัวอย่างในเอกสาร เพื่อทดสอบ
const MOCK_DB = [
  { barcode: '8850001', name: 'เลย์ รสออริจินัล', sugar: 1, fat: 12, salt: 15, video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { barcode: '8850002', name: 'น้ำอัดลม', sugar: 35, fat: 0, salt: 25, video: 'https://www.w3schools.com/html/mov_bbb.mp4' }, // เคสในเอกสาร -> ควรได้ 3.67 ดาว
  { barcode: '8850003', name: 'ขนมอันตราย', sugar: 30, fat: 15, salt: 600, video: 'https://www.w3schools.com/html/mov_bbb.mp4' }, // เคสสีแดง อันตราย
];

// ✅ จำกัดรูปแบบบาร์โค้ดให้ตรงกับสินค้าอาหารทั่วไป เพื่อลดงานประมวลผลและอ่านได้เร็วขึ้น
const FAST_SCANNER_HINTS = new Map();
FAST_SCANNER_HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,  // สินค้าไทยส่วนใหญ่ใช้ EAN-13 เช่น 885...
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]);
FAST_SCANNER_HINTS.set(DecodeHintType.TRY_HARDER, true);

// ✅ ทำความสะอาดรหัส ลดปัญหาอ่านได้แต่มีช่องว่าง/อักขระแปลก
const normalizeBarcode = (code = '') => String(code).replace(/\D/g, '').trim();

// ✅ constraints สำหรับกล้องหลัง ความละเอียดพอดี ภาพชัด แต่ไม่หนักเกินไป
const FAST_CAMERA_CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 },
    advanced: [
      { focusMode: 'continuous' },
      { exposureMode: 'continuous' },
    ],
  },
};

// ฟังก์ชันหาดาวรายไอเทม
const getStars = (val, thresholds) => {
  if (val <= thresholds[0]) return 5;
  if (val <= thresholds[1]) return 4;
  if (val <= thresholds[2]) return 3;
  if (val <= thresholds[3]) return 2;
  return 1;
};

// ฟังก์ชันคำนวณคะแนนทั้งหมดและสถานะของอาหาร 1 ชิ้น
const calcItemDetails = (food) => {
  const sugarStars = getStars(food.sugar, [6, 12, 18, 24]);
  const saltStars = getStars(food.salt, [120, 240, 360, 480]); 
  const fatStars = getStars(food.fat, [3, 6, 9, 12]);
  
  const avgStars = (sugarStars + fatStars + saltStars) / 3;

  let status = {};
  if (avgStars >= 4.5) {
    status = { icon: '🟢', label: 'ปลอดภัย', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500', msg: 'ยอดเยี่ยม! ไอเทมนี้ปลอดภัยสำหรับร่างกาย' };
  } else if (avgStars >= 3.5) {
    status = { icon: '🟡', label: 'ควรระวัง', color: 'text-yellow-400', bg: 'bg-yellow-400/20 border-yellow-400', msg: 'ทานได้พอประมาณ ควรระวังอย่าทานมากเกินไปนะ' };
  } else if (avgStars >= 2.5) {
    status = { icon: '🟠', label: 'เสี่ยง', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500', msg: 'มีความเสี่ยง! ควรทานแต่น้อยและออกกำลังกายควบคู่' };
  } else {
    status = { icon: '🔴', label: 'อันตราย', color: 'text-rose-500', bg: 'bg-rose-500/20 border-rose-500', msg: 'เกินเกณฑ์อย่างมาก รีบวางขนมเหล่านี้ลง แล้วไปตามหาขนมสีเขียวด่วนเพื่อช่วยชีวิตร่างกายของเธอ! สีแดง อันตรายขั้นวิกฤต' };
  }

  return { sugarStars, fatStars, saltStars, avgStars, status };
};

export default function GameMain() {
  const [step, setStep] = useState('enter_room');
  const [roomCode, setRoomCode] = useState('');
  const [playerInfo, setPlayerInfo] = useState({ name: '', avatar: null });
  const [roomData, setRoomData] = useState(null); 
  
  const [isPaused, setIsPaused] = useState(false);
  const [timeUsed, setTimeUsed] = useState(0); 
  
  const [scoreSum, setScoreSum] = useState(0); 
  const [score, setScore] = useState(0);       
  const [speedBonus, setSpeedBonus] = useState(0); 
  const [scannedItems, setScannedItems] = useState(0);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanStatus, setScanStatus] = useState({ type: '', msg: '' });
  const [showVideoModal, setShowVideoModal] = useState(null);
  const [scanHint, setScanHint] = useState('จัดบาร์โค้ดให้อยู่ในกรอบ และถือกล้องให้นิ่ง...');

  const championMusic = useRef(new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_c8c8a73467.mp3?filename=success-fanfare-trumpets-6185.mp3'));

  // --- Camera & Scanner States ---
  const videoRef = useRef(null);
  // timeBetweenScansMillis = 120ms ช่วยให้สแกนตอบสนองเร็ว แต่ยังไม่กินเครื่องมากเกินไป
  const codeReader = useRef(new BrowserMultiFormatReader(FAST_SCANNER_HINTS, 120));
  const [cameraError, setCameraError] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const lastScanRef = useRef({ code: '', time: 0 });

  // ใช้ useRef เพื่อหลีกเลี่ยงการสแกนซ้ำซ้อนขณะกำลังประมวลผล
  const isProcessingScan = useRef(false);
  
  // เก็บ State ล่าสุดไว้ใน ref เพื่อให้ฟังก์ชัน Scanner เข้าถึงได้โดยไม่ต้อง Render ใหม่
  const latestState = useRef({ scoreSum, scannedItems, timeUsed, roomData, roomCode, playerName: playerInfo.name });
  useEffect(() => {
    latestState.current = { scoreSum, scannedItems, timeUsed, roomData, roomCode, playerName: playerInfo.name };
  }, [scoreSum, scannedItems, timeUsed, roomData, roomCode, playerInfo.name]);

  // --- Real-time Room Sync ---
  useEffect(() => {
    if (!roomCode || step === 'enter_room' || step === 'select_avatar') return;

    const unsubscribe = onSnapshot(doc(db, "rooms", roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        if (data.status === 'playing') {
          if (step === 'waiting') setStep('playing');
          setIsPaused(false);
        } else if (data.status === 'paused') {
          setIsPaused(true);
        } else if (data.status === 'finished') {
          setStep('summary');
        }
      } else {
        alert("ห้องเกมนี้ถูกปิดไปแล้ว");
        window.location.reload();
      }
    });

    return () => unsubscribe();
  }, [roomCode, step]);

  // --- Timer & Scan Hints ---
  useEffect(() => {
    let timer;
    if (step === 'playing' && !isPaused) {
      timer = setInterval(() => setTimeUsed((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, isPaused]);

  useEffect(() => {
    let hintTimer;
    if (step === 'playing' && !isPaused && !showVideoModal && !cameraError) {
      const hints = [
        'วางบาร์โค้ดให้เต็มกรอบแนวนอน',
        'ขยับเข้าใกล้บาร์โค้ดอีกนิด...',
        'หากภาพเบลอ ลองแตะปุ่มโฟกัส',
        'ระวังแสงสะท้อนบนซองขนม',
        'ถือกล้องให้นิ่ง 1-2 วินาที',
        'ถ้าบาร์โค้ดเล็กเกินไป ให้ขยับกล้องเข้าใกล้',
      ];
      let hintIndex = 0;
      hintTimer = setInterval(() => {
        hintIndex = (hintIndex + 1) % hints.length;
        setScanHint(hints[hintIndex]);
      }, 3000);
    }
    return () => clearInterval(hintTimer);
  }, [step, isPaused, showVideoModal, cameraError]);

  // --- Audio ---
  useEffect(() => {
    if (step === 'summary') {
      championMusic.current.loop = true;
      championMusic.current.play().catch(() => console.log('Audio block'));
    } else {
      championMusic.current.pause();
    }

    return () => championMusic.current.pause();
  }, [step]);

  // --- Camera Control & Auto Scanner แบบเร็วขึ้น ---
  const playScanFeedback = () => {
    // เสียงสั้น ๆ และสั่นเบา ๆ ช่วยให้ผู้เล่นรู้ว่าสแกนติดแล้ว
    if (navigator.vibrate) navigator.vibrate(80);

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      gain.gain.value = 0.04;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch {
      // บางเบราว์เซอร์อาจบล็อกเสียง ไม่กระทบการเล่นเกม
    }
  };

  const stopScanner = () => {
    codeReader.current.reset();

    const stream = videoRef.current?.srcObject;
    if (stream?.getTracks) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setTorchSupported(false);
    setTorchOn(false);
  };

  const updateCameraCapabilities = () => {
    const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
    const capabilities = track?.getCapabilities?.();

    setTorchSupported(Boolean(capabilities?.torch));
  };

  const toggleTorch = async () => {
    const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];
    const capabilities = track?.getCapabilities?.();

    if (!capabilities?.torch) {
      setScanHint('อุปกรณ์นี้ไม่รองรับไฟฉายจากเว็บเบราว์เซอร์');
      return;
    }

    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((prev) => !prev);
    } catch {
      setScanHint('เปิดไฟฉายไม่ได้ ลองเพิ่มแสงรอบ ๆ บาร์โค้ดแทน');
    }
  };

  const focusCamera = async () => {
    const track = videoRef.current?.srcObject?.getVideoTracks?.()[0];

    try {
      await track?.applyConstraints?.({
        advanced: [{ focusMode: 'continuous' }],
      });
      setScanHint('กำลังปรับโฟกัส ถือกล้องให้นิ่งสักครู่...');
    } catch {
      setScanHint('แตะแล้วขยับกล้องเข้า-ออกเล็กน้อยเพื่อช่วยโฟกัส');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        setCameraError(false);
        stopScanner();

        await codeReader.current.decodeFromConstraints(
          FAST_CAMERA_CONSTRAINTS,
          videoRef.current,
          (result) => {
            if (!result || isProcessingScan.current) return;

            const code = normalizeBarcode(result.getText());
            if (!code) return;

            // กันอ่านบาร์โค้ดเดิมซ้ำในช่วงสั้น ๆ
            const now = Date.now();
            const isSameCodeTooSoon =
              lastScanRef.current.code === code && now - lastScanRef.current.time < 1800;

            if (isSameCodeTooSoon) return;

            lastScanRef.current = { code, time: now };
            setBarcodeInput(code);
            playScanFeedback();
            processBarcode(code);
          },
        );

        setTimeout(() => {
          if (isMounted) updateCameraCapabilities();
        }, 700);
      } catch (err) {
        console.error('Camera access error:', err);
        if (isMounted) {
          setCameraError(true);
          setScanHint('เปิดกล้องไม่ได้ กรุณาอนุญาตสิทธิ์กล้อง หรือใช้ช่องกรอกรหัสแทน');
        }
      }
    };

    // เปิดกล้องและสแกนเฉพาะตอนที่กำลังเล่นเกม ไม่ได้หยุดพัก และไม่ได้เปิดหน้าต่างวิดีโออยู่
    if (step === 'playing' && !isPaused && !showVideoModal) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [step, isPaused, showVideoModal]);

  // --- Core Processing Logic ---
  const processBarcode = async (rawCode) => {
    const code = normalizeBarcode(rawCode);

    if (!code || isProcessingScan.current) return;
    isProcessingScan.current = true; // ล็อกสถานะป้องกันการสแกนรัวๆ

    const { scoreSum: curScoreSum, scannedItems: curScannedItems, timeUsed: curTimeUsed, roomData: curRoomData, roomCode: curRoomCode, playerName } = latestState.current;

    const foundItem = MOCK_DB.find(item => normalizeBarcode(item.barcode) === code);
    if (foundItem) {
      // 1. คำนวณดาวและสถานะ
      const details = calcItemDetails(foundItem);
      
      const newTotalScore = curScoreSum + details.avgStars; 
      const newItemsCount = curScannedItems + 1;
      const currentAvg = newTotalScore / newItemsCount;  
      
      let finalScoreToSave = currentAvg;
      let earnedBonus = 0;
      
      // 2. ถ้าสแกนครบกำหนด คำนวณโบนัสความเร็วตามเกณฑ์
      if (curRoomData?.itemLimit && newItemsCount >= curRoomData.itemLimit) {
        const avgTime = curTimeUsed / newItemsCount; 
        
        if (avgTime <= 15) earnedBonus = 0.050;       
        else if (avgTime <= 30) earnedBonus = 0.030;  
        else if (avgTime <= 45) earnedBonus = 0.010;  
        else earnedBonus = 0.000;                     

        finalScoreToSave = currentAvg + earnedBonus; 
      }

      setScoreSum(newTotalScore);
      setScore(finalScoreToSave);
      setScannedItems(newItemsCount);
      setSpeedBonus(earnedBonus);
      
      setScanStatus({ type: 'success', msg: `บันทึก ${foundItem.name} สำเร็จ!` });
      setShowVideoModal({ ...foundItem, details });

      // อัปเดตคะแนนขึ้น Firebase
      await updateDoc(doc(db, "rooms", curRoomCode, "players", playerName), {
        score: finalScoreToSave,
        itemsScanned: newItemsCount
      });

    } else {
      setScanStatus({ type: 'error', msg: `ไม่พบข้อมูลบาร์โค้ด [${code}]` });
      // ปลดล็อกการสแกนหลังจากแจ้งเตือน 3 วินาที
      setTimeout(() => {
        setScanStatus({ type: '', msg: '' });
        isProcessingScan.current = false;
      }, 3000);
    }
  };


  // --- Handlers ---
  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const docRef = doc(db, "rooms", roomCode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().status === 'waiting') {
      setRoomData(docSnap.data());
      setStep('select_avatar');
    } else {
      alert('ไม่พบห้อง หรือเกมเริ่มไปแล้ว!');
    }
  };

  const handleStartWait = async (e) => {
    e.preventDefault();
    if (!playerInfo.avatar || !playerInfo.name) return alert('กรุณาเลือกฮีโร่และตั้งชื่อ!');
    
    const playerNameId = playerInfo.name; 
    await setDoc(doc(db, "rooms", roomCode, "players", playerNameId), {
      name: playerInfo.name,
      avatar: playerInfo.avatar.icon,
      score: 0,
      itemsScanned: 0
    });
    setStep('waiting');
  };

  const handleManualScanSubmit = async (e) => {
    e.preventDefault();
    const code = normalizeBarcode(barcodeInput);
    if (!code) return;
    await processBarcode(code);
  };

  const closeVideo = () => {
    setShowVideoModal(null);
    setBarcodeInput('');
    // หน่วงเวลาเล็กน้อยก่อนเปิดสแกนเนอร์อีกครั้ง ป้องกันการสแกนโค้ดเดิมซ้ำทันที
    setTimeout(() => {
      isProcessingScan.current = false;
      lastScanRef.current = { code: '', time: 0 };
    }, 900);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0a192f] text-white font-sans relative overflow-hidden flex flex-col">
      <style>{`
        @keyframes barcodeScan {
          0%, 100% { transform: translateY(-42px); opacity: .55; }
          50% { transform: translateY(42px); opacity: 1; }
        }
      `}</style>
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply blur-[100px] animate-pulse"></div>
      </div>

      {/* หน้าจอพักเกมโดยครู */}
      {isPaused && step === 'playing' && (
        <div className="absolute inset-0 z-50 bg-[#061020]/90 backdrop-blur-md flex items-center justify-center">
          <div className="text-center p-10 bg-slate-900/80 rounded-3xl border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
            <PauseCircle className="w-24 h-24 text-amber-500 mx-auto mb-6 animate-pulse" />
            <h1 className="text-4xl font-black text-amber-400 uppercase tracking-widest mb-4">ระบบถูกระงับชั่วคราว</h1>
            <p className="text-xl text-slate-300 font-bold">" ผู้สร้างขอพักซักครู่... "</p>
          </div>
        </div>
      )}

      {/* Modal สรุปผลหลังสแกน 1 ชิ้น */}
      {showVideoModal && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#112240] rounded-3xl overflow-hidden max-w-md w-full border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.4)] my-auto">
            <div className="p-4 bg-cyan-900/30 flex justify-between items-center border-b border-cyan-500/30">
              <h3 className="text-xl font-black text-cyan-400">ข้อมูล: {showVideoModal.name}</h3>
              <button onClick={closeVideo} className="text-slate-400 hover:text-white"><XCircle size={28}/></button>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <div className="flex justify-center gap-2">
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 w-1/3">
                  <div className="text-[10px] text-slate-400 uppercase">น้ำตาล</div>
                  <div className="font-black text-xl text-white">{showVideoModal.sugar}g</div>
                  <div className="text-amber-400 text-xs mt-1">{"⭐".repeat(showVideoModal.details.sugarStars)}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 w-1/3">
                  <div className="text-[10px] text-slate-400 uppercase">ไขมัน</div>
                  <div className="font-black text-xl text-white">{showVideoModal.fat}g</div>
                  <div className="text-amber-400 text-xs mt-1">{"⭐".repeat(showVideoModal.details.fatStars)}</div>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 w-1/3">
                  <div className="text-[10px] text-slate-400 uppercase">โซเดียม</div>
                  <div className="font-black text-xl text-white">{showVideoModal.salt}mg</div>
                  <div className="text-amber-400 text-xs mt-1">{"⭐".repeat(showVideoModal.details.saltStars)}</div>
                </div>
              </div>

              <div className={`p-4 rounded-xl border-2 ${showVideoModal.details.status.bg} ${showVideoModal.details.status.color}`}>
                 <div className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
                   {showVideoModal.details.status.icon} {showVideoModal.details.status.label}
                   <span className="ml-auto text-sm bg-black/30 px-3 py-1 rounded-full text-white border border-white/20">เฉลี่ย {showVideoModal.details.avgStars.toFixed(2)} ดาว</span>
                 </div>
                 <div className="font-bold text-sm leading-relaxed text-white drop-shadow-md">{showVideoModal.details.status.msg}</div>
              </div>
            </div>

            <div className="aspect-video bg-black relative border-y border-cyan-900/50">
              <video src={showVideoModal.video} controls autoPlay className="w-full h-full object-contain"></video>
            </div>
            <div className="p-6 shrink-0">
              <button onClick={closeVideo} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl text-lg uppercase transition-transform active:scale-95">
                ดำเนินการสแกนต่อ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        
        {step === 'enter_room' && (
          <div className="bg-[#112240]/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-blue-500/30 max-w-sm w-full animate-in zoom-in-95">
            <div className="text-center mb-8">
              <ShieldCheck className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
              <h1 className="text-3xl font-black text-white uppercase tracking-widest">SFS Game</h1>
              <p className="text-cyan-500 font-bold mt-2">เข้าร่วมภารกิจลับ</p>
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <input type="text" placeholder="รหัสห้อง (Room Code)" required value={roomCode} onChange={e => setRoomCode(e.target.value)}
                className="w-full text-center text-3xl tracking-widest font-black uppercase px-4 py-5 rounded-2xl bg-[#0a192f] border-2 border-cyan-900 focus:border-cyan-400 text-white outline-none placeholder:text-slate-600 placeholder:text-lg" />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-xl text-xl uppercase tracking-widest transition-transform active:scale-95">
                ตกลง (Next)
              </button>
            </form>
            <Link to="/" className="block mt-6 text-center text-slate-500 font-bold hover:text-white">กลับหน้าหลัก</Link>
          </div>
        )}

        {step === 'select_avatar' && (
          <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">สร้างตัวตนสายลับ</h1>
            </div>
            <form onSubmit={handleStartWait} className="bg-[#112240]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-blue-500/30 shadow-2xl">
              <div className="mb-8">
                <input type="text" placeholder="พิมพ์ชื่อสายลับของคุณ..." required value={playerInfo.name} onChange={e => setPlayerInfo({...playerInfo, name: e.target.value})}
                  className="w-full max-w-md mx-auto block text-center text-2xl font-black px-6 py-4 rounded-2xl bg-[#0a192f] border-2 border-cyan-800 focus:border-cyan-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
                {HERO_AVATARS.map(hero => (
                  <button type="button" key={hero.id} onClick={() => setPlayerInfo({...playerInfo, avatar: hero})}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-4 transition-all ${playerInfo.avatar?.id === hero.id ? 'bg-cyan-900/50 border-cyan-400 scale-105' : 'bg-[#0a192f] border-transparent'}`}>
                    <span className="text-6xl mb-2">{hero.icon}</span>
                    <span className="text-xs font-black text-slate-300">{hero.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <button type="submit" className="px-12 py-4 rounded-2xl font-black text-[#0a192f] bg-gradient-to-r from-cyan-400 to-blue-500 text-xl uppercase tracking-widest active:scale-95 transition-transform">ยืนยันตัวตนเข้าร่วม</button>
              </div>
            </form>
          </div>
        )}

        {step === 'waiting' && (
          <div className="bg-[#112240]/80 p-10 rounded-[2.5rem] border-2 border-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.2)] max-w-lg w-full text-center animate-in zoom-in-95">
            <div className="w-24 h-24 mx-auto bg-blue-900/50 rounded-full flex items-center justify-center mb-6 border-4 border-blue-500/50">
              <span className="text-6xl">{playerInfo.avatar?.icon}</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">ยินดีต้อนรับ, <span className="text-cyan-400">{playerInfo.name}</span></h2>
            <div className="bg-[#0a192f] rounded-2xl p-6 text-left border border-blue-800/50 my-8 space-y-4">
              <h3 className="text-lg font-black text-cyan-400 flex items-center gap-2"><AlertCircle size={20}/> กติกาและเป้าหมายภารกิจ</h3>
              <ul className="space-y-3 text-slate-300 font-medium">
                <li className="flex justify-between"><span>⏱ เวลาในภารกิจ:</span> <span className="text-white">{roomData?.timeLimit} นาที</span></li>
                <li className="flex justify-between"><span>📦 เป้าหมายไอเทม:</span> <span className="text-white">{roomData?.itemLimit} ชิ้น</span></li>
              </ul>
            </div>
            <div className="text-amber-400 font-black animate-pulse text-xl flex items-center justify-center gap-3"><Clock /> รอผู้สร้างกดเริ่มเกม...</div>
          </div>
        )}

        {step === 'playing' && (
          <div className="w-full max-w-md flex flex-col h-full">
            <div className="bg-[#112240]/90 rounded-2xl p-4 mb-4 flex justify-between items-center border border-blue-500/30">
              <div className="flex items-center gap-3">
                <span className="text-4xl bg-blue-900/50 rounded-full p-1">{playerInfo.avatar?.icon}</span>
                <div><div className="text-xs text-cyan-500 font-black">AGENT</div><div className="font-bold text-white">{playerInfo.name}</div></div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400">เป้าหมาย: {scannedItems}/{roomData?.itemLimit}</div>
                <div className="text-xl font-black text-amber-400 flex gap-1"><Clock size={18}/> {formatTime(timeUsed)}</div>
              </div>
            </div>

            <div className="flex-1 bg-[#0a192f] border-2 border-cyan-500/50 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-4 mb-4 relative shadow-[0_0_30px_rgba(6,182,212,0.2)]">
               
               {/* ---------------- VDO CAMERA FEED ---------------- */}
               <div className="w-full aspect-[3/4] sm:aspect-video border-4 border-cyan-500/70 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden bg-black">
                 {cameraError ? (
                    <div className="text-center p-4 relative z-10">
                       <Camera className="w-16 h-16 text-rose-500/50 mx-auto mb-2" />
                       <p className="text-rose-400 text-sm font-bold">ไม่สามารถเปิดกล้องได้<br/>กรุณาอนุญาตให้สิทธิ์การเข้าถึงกล้อง</p>
                    </div>
                 ) : (
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                      onClick={focusCamera}
                    ></video>
                 )}
                 {/* UI Overlays: Target Box & Laser */}
                 {!cameraError && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                        {/* กรอบสแกน */}
                        <div className="w-[88%] h-[32%] min-h-[120px] border-4 border-dashed border-white/80 rounded-2xl relative bg-black/10">
                            {/* กรอบสแกนแนวนอนเหมาะกับบาร์โค้ดสินค้า */}
                            <div className="absolute -inset-2 border-2 border-[#3b82f6] rounded-2xl opacity-40"></div>
                            <div className="absolute inset-x-3 top-1/2 h-1 bg-cyan-400 shadow-[0_0_18px_#22d3ee] animate-[barcodeScan_1.4s_ease-in-out_infinite]"></div>
                            <div className="absolute inset-x-0 -bottom-9 text-center text-[11px] font-black text-white/90">
                              วางบาร์โค้ดให้เต็มกรอบแนวนอน
                            </div>
                        </div>
                    </div>
                 )}
               </div>
               {/* ------------------------------------------------ */}

               {!cameraError && (
                  <div className="w-full flex items-center justify-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={focusCamera}
                      className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-xs font-black text-white hover:bg-white/20"
                    >
                      แตะโฟกัส
                    </button>
                    <button
                      type="button"
                      onClick={toggleTorch}
                      disabled={!torchSupported}
                      className={`px-4 py-2 rounded-full border text-xs font-black ${torchOn ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-white/10 text-white border-white/20'} disabled:opacity-40`}
                    >
                      {torchOn ? 'ปิดไฟฉาย' : 'เปิดไฟฉาย'}
                    </button>
                  </div>
               )}

               {/* คำแนะนำในการสแกน */}
               {!cameraError && (
                  <div className="text-center mb-4 min-h-[40px] flex items-center justify-center px-4">
                     <p className="text-sm font-bold text-cyan-400 bg-cyan-900/30 px-4 py-2 rounded-full border border-cyan-500/30 transition-opacity duration-300">
                        {scanHint}
                     </p>
                  </div>
               )}

               {scanStatus.msg && <div className={`mb-4 px-4 py-2 rounded-lg font-bold text-sm w-full text-center ${scanStatus.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'}`}>{scanStatus.msg}</div>}

               <form onSubmit={handleManualScanSubmit} className="w-full bg-[#112240] p-4 rounded-2xl border border-cyan-900/50 relative z-10">
                 <label className="block text-xs font-black text-cyan-400 mb-2 text-center">สแกนไม่ติด? กรอกรหัสบาร์โค้ดเองได้เลย</label>
                 <div className="flex gap-2">
                   <input type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} placeholder="8850002" className="flex-1 px-4 py-3 rounded-xl bg-[#0a192f] border border-cyan-700 focus:border-cyan-400 text-white font-bold outline-none text-center" />
                   <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 p-3 rounded-xl"><Send size={24} /></button>
                 </div>
               </form>
            </div>
            
            {scannedItems >= roomData?.itemLimit && (
               <div className="bg-green-600 text-white font-black text-center py-3 rounded-xl animate-pulse">ภารกิจเสร็จสิ้น! รอครูปิดห้อง</div>
            )}
          </div>
        )}

        {step === 'summary' && (
          <div className="w-full max-w-lg text-center animate-in zoom-in duration-500">
            <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" />
            <h1 className="text-5xl font-black text-amber-400 uppercase tracking-widest mb-2">จบภารกิจ</h1>
            
            <div className="bg-[#112240]/90 border-2 border-cyan-500/50 rounded-3xl p-8 my-8 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <div className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-2">คะแนนรวมจัดลำดับ</div>
              <div className="text-6xl font-black text-white mb-2">{score.toFixed(3)}</div>
              <div className="text-sm font-bold text-amber-400 mb-6 bg-amber-500/10 inline-block px-4 py-1 rounded-full border border-amber-500/30">
                 + โบนัสความเร็ว: {speedBonus > 0 ? speedBonus.toFixed(3) : "0.000"}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-left border-t border-cyan-900/50 pt-6">
                <div className="bg-[#0a192f] p-4 rounded-2xl">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">สแกนสำเร็จ</div>
                  <div className="text-2xl font-black mt-1">{scannedItems} <span className="text-sm font-normal text-slate-500">ชิ้น</span></div>
                </div>
                <div className="bg-[#0a192f] p-4 rounded-2xl">
                  <div className="text-xs text-slate-400 uppercase tracking-widest">เวลาที่ใช้</div>
                  <div className="text-2xl font-black mt-1">{formatTime(timeUsed)} <span className="text-sm font-normal text-slate-500">นาที</span></div>
                </div>
              </div>
            </div>

            <button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xl py-4 rounded-2xl uppercase shadow-[0_0_30px_rgba(245,158,11,0.4)]">
              เล่นใหม่อีกครั้ง
            </button>
          </div>
        )}

      </div>
    </div>
  );
}