// src/components/AdminDashboard.jsx
import React, { useState } from 'react';
import { LogIn, LogOut, Plus, Trash2, Edit, Save, X, Users, SearchCheck, Gamepad2, Settings, ShieldCheck, Zap } from 'lucide-react';

export default function AdminDashboard() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('foods');

  const [foods, setFoods] = useState([
    { id: '1', name: 'ชานมไข่มุก', type: 'เครื่องดื่ม', sugar: 12, fat: 5, salt: 2 },
    { id: '2', name: 'มันฝรั่งทอด', type: 'ขนม', sugar: 1, fat: 15, salt: 8 },
  ]);
  
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', type: 'ขนม', sugar: 0, fat: 0, salt: 0 });

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@sfs.com' && password === '123456') {
      setIsAdminLoggedIn(true);
    } else {
      alert("รหัสผ่านไม่ถูกต้อง (ทดสอบใช้: admin@sfs.com / 123456)");
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setEmail('');
    setPassword('');
  };

  const handleAddFood = (e) => {
    e.preventDefault();
    const newId = Date.now().toString();
    setFoods([...foods, { ...newFood, id: newId }]);
    setIsAddingFood(false);
    setNewFood({ name: '', type: 'ขนม', sugar: 0, fat: 0, salt: 0 });
  };

  const handleDeleteFood = (id) => {
    if(window.confirm("ยืนยันการลบข้อมูลใช่หรือไม่?")) {
      setFoods(foods.filter(f => f.id !== id));
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f] p-4 font-sans relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="bg-[#112240]/80 backdrop-blur-xl border border-blue-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(37,99,235,0.2)] w-full max-w-md overflow-hidden relative z-10">
          <div className="p-10 text-center border-b border-blue-500/20">
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-blue-600 to-sky-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/50 rotate-3">
              <ShieldCheck className="w-12 h-12 text-white -rotate-3" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-wider uppercase drop-shadow-md">Admin Portal</h1>
            <p className="text-blue-300 mt-2 font-bold tracking-widest text-sm uppercase">SFS Game Control</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-black text-blue-400 uppercase tracking-wider">Access ID (Email)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-5 py-4 rounded-xl border-2 border-blue-900/50 focus:border-blue-500 bg-[#0a192f] text-white font-medium outline-none transition-all placeholder:text-blue-800"
                placeholder="admin@sfs.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black text-blue-400 uppercase tracking-wider">Passcode</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full px-5 py-4 rounded-xl border-2 border-blue-900/50 focus:border-blue-500 bg-[#0a192f] text-white font-medium outline-none transition-all placeholder:text-blue-800"
                placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-lg py-4 px-4 rounded-xl flex justify-center items-center gap-3 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] uppercase tracking-wider mt-4">
              <LogIn size={24} /> Initialize
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col md:flex-row font-sans selection:bg-blue-300">
      {/* Sidebar - Game Style */}
      <aside className="w-full md:w-72 bg-[#0a192f] text-slate-300 flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-blue-900/50 flex flex-col items-center">
          <div className="bg-blue-600 p-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] mb-4">
            <Gamepad2 size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">SFS Dashboard</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">System Online</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-4">
          <button onClick={() => setActiveTab('foods')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group ${activeTab === 'foods' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'hover:bg-[#112240] hover:text-white'}`}>
            {activeTab === 'foods' && <span className="absolute left-0 top-0 w-1 h-full bg-sky-400"></span>}
            <Settings size={20} className={activeTab === 'foods' ? 'text-sky-300' : 'text-blue-500 group-hover:text-sky-400'} /> 
            <span className="tracking-wide">จัดการคลังอาหาร</span>
          </button>
          
          <button onClick={() => setActiveTab('students')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl font-bold transition-all duration-300 relative overflow-hidden group ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'hover:bg-[#112240] hover:text-white'}`}>
             {activeTab === 'students' && <span className="absolute left-0 top-0 w-1 h-full bg-sky-400"></span>}
            <Users size={20} className={activeTab === 'students' ? 'text-sky-300' : 'text-blue-500 group-hover:text-sky-400'} /> 
            <span className="tracking-wide">ตรวจสอบผู้เล่น</span>
          </button>
        </nav>
        
        <div className="p-6 border-t border-blue-900/50 bg-[#061020]">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-transparent border-2 border-rose-900/50 text-rose-500 hover:bg-rose-900/30 hover:border-rose-500 font-bold transition-all uppercase tracking-widest text-sm">
            <LogOut size={18} /> System Exit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        {/* Subtle grid background for tech feel */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNjYmQ1ZTEiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')] opacity-50 z-0"></div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {activeTab === 'foods' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header Panel */}
              <div className="bg-white rounded-3xl p-8 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="bg-blue-100 p-4 rounded-2xl">
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">ฐานข้อมูลโภชนาการ</h1>
                    <p className="text-slate-500 font-medium mt-1">อัปเดตข้อมูลอาหารเพื่อคำนวณสเตตัสในเกม</p>
                  </div>
                </div>
                <button onClick={() => setIsAddingFood(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-transform active:scale-95">
                  <Plus size={22} strokeWidth={3} /> เพิ่มรายการใหม่
                </button>
              </div>

              {/* Add Food Form Module */}
              {isAddingFood && (
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.1)] mb-8 border border-slate-200 overflow-hidden relative">
                  <div className="bg-blue-600 px-8 py-5 flex justify-between items-center">
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Plus className="text-blue-300"/> บันทึกข้อมูลใหม่</h3>
                    <button onClick={() => setIsAddingFood(false)} className="text-blue-200 hover:text-white hover:bg-blue-500 p-2 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  <form onSubmit={handleAddFood} className="p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-8">
                      <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">ชื่ออาหาร (Item Name)</label>
                      <input type="text" required value={newFood.name} onChange={(e)=>setNewFood({...newFood, name: e.target.value})} 
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg text-slate-800 bg-slate-50" 
                        placeholder="ระบุชื่อไอเทม..." />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">ประเภท (Category)</label>
                      <select value={newFood.type} onChange={(e)=>setNewFood({...newFood, type: e.target.value})} 
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none font-black text-slate-700 bg-slate-50 cursor-pointer text-lg">
                        <option value="ขนม">🍪 ขนม (Snack)</option>
                        <option value="เครื่องดื่ม">🥤 เครื่องดื่ม (Drink)</option>
                        <option value="ไอศกรีม">🍦 ไอศกรีม (Ice Cream)</option>
                      </select>
                    </div>

                    {/* Stats Inputs */}
                    <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 relative group hover:border-pink-300 transition-colors">
                        <div className="absolute -top-4 left-6 bg-pink-100 text-pink-600 px-4 py-1 rounded-full font-black text-sm uppercase tracking-wider border-2 border-white shadow-sm">น้ำตาล (Sugar)</div>
                        <div className="flex items-end gap-3 mt-4">
                          <input type="number" required min="0" step="0.1" value={newFood.sugar} onChange={(e)=>setNewFood({...newFood, sugar: Number(e.target.value)})} 
                            className="w-full px-2 py-2 border-b-4 border-slate-200 focus:border-pink-500 outline-none font-black text-4xl text-slate-800 text-center bg-transparent transition-colors" />
                          <span className="font-bold text-slate-400 mb-2">กรัม</span>
                        </div>
                      </div>
                      
                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 relative group hover:border-amber-300 transition-colors">
                        <div className="absolute -top-4 left-6 bg-amber-100 text-amber-600 px-4 py-1 rounded-full font-black text-sm uppercase tracking-wider border-2 border-white shadow-sm">ไขมัน (Fat)</div>
                        <div className="flex items-end gap-3 mt-4">
                          <input type="number" required min="0" step="0.1" value={newFood.fat} onChange={(e)=>setNewFood({...newFood, fat: Number(e.target.value)})} 
                            className="w-full px-2 py-2 border-b-4 border-slate-200 focus:border-amber-500 outline-none font-black text-4xl text-slate-800 text-center bg-transparent transition-colors" />
                          <span className="font-bold text-slate-400 mb-2">กรัม</span>
                        </div>
                      </div>

                      <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 relative group hover:border-sky-300 transition-colors">
                        <div className="absolute -top-4 left-6 bg-sky-100 text-sky-600 px-4 py-1 rounded-full font-black text-sm uppercase tracking-wider border-2 border-white shadow-sm">โซเดียม (Salt)</div>
                        <div className="flex items-end gap-3 mt-4">
                          <input type="number" required min="0" step="1" value={newFood.salt} onChange={(e)=>setNewFood({...newFood, salt: Number(e.target.value)})} 
                            className="w-full px-2 py-2 border-b-4 border-slate-200 focus:border-sky-500 outline-none font-black text-4xl text-slate-800 text-center bg-transparent transition-colors" />
                          <span className="font-bold text-slate-400 mb-2">มก.</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-12 flex justify-end gap-4 mt-4">
                      <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 shadow-[0_8px_0_rgb(15,23,42)] active:shadow-[0_0px_0_rgb(15,23,42)] active:translate-y-[8px] transition-all text-lg uppercase tracking-wider">
                        <Save size={24}/> บันทึกข้อมูล (Save)
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xl font-black text-slate-700 flex items-center gap-3"><SearchCheck className="text-blue-500 w-6 h-6"/> รายการอาหารในระบบ</h3>
                  <span className="bg-blue-100 text-blue-700 font-black px-4 py-1 rounded-full text-sm">Total: {foods.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white text-slate-400 text-sm uppercase tracking-widest border-b-2 border-slate-100">
                        <th className="px-8 py-5 font-black">Item Name</th>
                        <th className="px-8 py-5 font-black">Type</th>
                        <th className="px-8 py-5 font-black text-center text-pink-500">Sugar</th>
                        <th className="px-8 py-5 font-black text-center text-amber-500">Fat</th>
                        <th className="px-8 py-5 font-black text-center text-sky-500">Salt</th>
                        <th className="px-8 py-5 font-black text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {foods.length === 0 ? (
                        <tr><td colSpan="6" className="p-20 text-center text-slate-400 font-bold bg-slate-50">No Data Available.</td></tr>
                      ) : foods.map((food) => (
                        <tr key={food.id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="px-8 py-6 font-black text-slate-800 text-lg">{food.name}</td>
                          <td className="px-8 py-6">
                            <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 shadow-sm">{food.type}</span>
                          </td>
                          <td className="px-8 py-6 text-center font-black text-slate-600">{food.sugar} <span className="text-xs text-slate-400 font-bold">g</span></td>
                          <td className="px-8 py-6 text-center font-black text-slate-600">{food.fat} <span className="text-xs text-slate-400 font-bold">g</span></td>
                          <td className="px-8 py-6 text-center font-black text-slate-600">{food.salt} <span className="text-xs text-slate-400 font-bold">mg</span></td>
                          <td className="px-8 py-6 flex justify-center gap-3">
                            <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"><Edit size={20} /></button>
                            <button onClick={() => handleDeleteFood(food.id)} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors"><Trash2 size={20} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab Placeholder */}
          {activeTab === 'students' && (
             <div className="max-w-3xl mx-auto text-center py-32 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-3xl shadow-sm border border-slate-200 mt-10">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Users className="w-12 h-12 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">ระบบตรวจสอบผู้เล่น (Players)</h2>
                <p className="text-slate-500 font-medium px-10">
                  หน้านี้อยู่ระหว่างการพัฒนา จะใช้สำหรับดึงข้อมูลห้องเรียน รายชื่อนักเรียน และคะแนนจาก Firebase ในเฟสถัดไป
                </p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}