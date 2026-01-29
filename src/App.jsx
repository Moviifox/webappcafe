import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Search, 
  User, 
  ChevronRight, 
  X, 
  Plus, 
  History, 
  QrCode, 
  ArrowLeft,
  LayoutGrid,
  Coffee,
  SearchIcon,
  Tag,
  ArrowRight,
  Sparkles,
  SearchX,
  Lock,
  ChevronLeft,
  Minus,
  Utensils,
  Check,
  Trash2,
  AlertTriangle,
  LogOut,
  ArrowDown
} from 'lucide-react';

// ฟังก์ชันช่วยจัดการสีโปร่งแสง
const alpha = (hex, opacity) => {
  const alphaMap = {
    '0': '00', '0.05': '0D', '0.1': '1A', '0.2': '33', '0.3': '4D', 
    '0.4': '66', '0.5': '80', '0.6': '99', '0.7': 'B3', 
    '0.8': 'CC', '0.85': 'D9', '0.9': 'E6', '0.95': 'F2', '1': 'FF'
  };
  return `${hex}${alphaMap[opacity] || 'FF'}`;
};

// --- MOCK DATABASE ---
const MENU_IMAGE = "https://s359.kapook.com/pagebuilder/95bcea87-d77c-4236-9cb2-39229c61b15c.jpg";

const MOCK_DATA = {
  user: {
    id: "CU-88294",
    name: "คุณสมชาย ใจดี",
    photo: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    points: 1250
  },
  menuCategories: ["แนะนำ", "กาแฟ", "ชา", "นม", "ผลไม้", "สมูทตี้", "อาหารว่าง", "จานหลัก"],
  menus: Array.from({ length: 40 }).map((_, i) => {
      const idx = i + 1;
      const category = ["กาแฟ", "ชา", "นม", "ผลไม้", "สมูทตี้", "อาหารว่าง", "จานหลัก"][i % 7];
      let typeOptions = [];
      
      if (["กาแฟ", "ชา", "นม"].includes(category)) {
          typeOptions = [{ label: "ร้อน", price: 50 }, { label: "เย็น", price: 60 }, { label: "ปั่น", price: 70 }];
      } else if (["ผลไม้", "สมูทตี้"].includes(category)) {
          typeOptions = [{ label: "เย็น", price: 60 }, { label: "ปั่น", price: 70 }];
      } else {
          typeOptions = [{ label: "ไม่มีตัวเลือก", price: 89 }];
      }

      // Simulate Discount Logic (Every 3rd item has a 10 baht discount)
      const discount = (i % 3 === 0) ? 10 : 0;
      
      const discountedOptions = typeOptions.map(t => ({
          ...t,
          price: Math.max(0, t.price - discount)
      }));

      return {
        id: idx,
        name: i % 2 === 0 ? `เมนูพิเศษ ${idx}` : `รายการอร่อย ${idx}`,
        category: category,
        price: discountedOptions[0].price, 
        originalPrice: typeOptions[0].price, 
        discount: discount,
        isRecommended: i % 5 === 0,
        image: MENU_IMAGE,
        typeOptions: discountedOptions,
        addOns: [
            { label: "วิปครีม", price: 15 },
            { label: "ไข่มุก", price: 10 },
            { label: "หวานน้อย", price: 0 }
        ]
      };
  }),
  news: [
    { id: 10, type: "Promotion", title: "สมาชิกใหม่รับส่วนลด 50%", content: "สิทธิพิเศษเฉพาะแก้วแรกสำหรับสมาชิกใหม่เท่านั้น สมัครเลยวันนี้!", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=60&w=800", date: "2024-01-25" },
    { id: 9, type: "News", title: "เทศกาลสตอเบอร์รี่หวานฉ่ำ", content: "พบกับเมนูพิเศษจากสตอเบอร์รี่คัดเกรดส่งตรงจากฟาร์มทุกวัน", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=60&w=800", date: "2024-01-20" },
    { id: 8, type: "Promotion", title: "ซื้อ 1 แถม 1 ทุกวันพุธ", content: "เอาใจสายหวานกับโปรโมชั่นซื้อเมนูปั่นหมวดใดก็ได้ 1 แถม 1", image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=60&w=800", date: "2024-01-15" }
  ]
};

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @font-face {
      font-family: 'Foxgraphie';
      src: url('https://raw.githubusercontent.com/Moviifox/trailer/main/foxgraphie_light.otf') format('opentype');
      font-weight: 300;
      font-style: normal;
    }
    @font-face {
      font-family: 'Foxgraphie';
      src: url('https://raw.githubusercontent.com/Moviifox/trailer/main/foxgraphie_regular.otf') format('opentype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'Foxgraphie';
      src: url('https://raw.githubusercontent.com/Moviifox/trailer/main/foxgraphie_semibold.otf') format('opentype');
      font-weight: 600;
      font-style: normal;
    }
    @font-face {
      font-family: 'Foxgraphie';
      src: url('https://raw.githubusercontent.com/Moviifox/trailer/main/foxgraphie_semibold.otf') format('opentype');
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
       font-family: 'Foxgraphie';
       src: url('https://raw.githubusercontent.com/Moviifox/trailer/main/foxgraphie_semibold.otf') format('opentype');
       font-weight: 800;
       font-style: normal;
    }
    @font-face {
       font-family: 'Foxgraphie';
       src: url('https://raw.githubusercontent.com/Moviifox/trailer/main/foxgraphie_semibold.otf') format('opentype');
       font-weight: 900;
       font-style: normal;
    }
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Anuphan:wght@400;700&display=swap');
    
    body { 
        font-family: 'Foxgraphie', 'Plus Jakarta Sans', 'Anuphan', sans-serif; 
        -webkit-tap-highlight-color: transparent; 
        overscroll-behavior-y: none;
    }
    
    .font-extra-thick {
        font-weight: 900;
        text-shadow: 0.5px 0 0 currentColor;
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    ::-webkit-scrollbar { width: 0; background: transparent; }
    input, textarea { font-size: 16px !important; }
  `}} />
);

// --- REUSABLE COMPONENTS ---

// Global Toast Component
const ToastNotification = ({ show, message, type, extraClass = "" }) => (
    <div className={`fixed left-6 right-6 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border flex items-center gap-3 z-[1000] transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'} ${extraClass}`} 
         style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`} style={{ backgroundColor: type === 'delete' || type === 'error' ? '#ef4444' : '#22c55e' }}>
        {type === 'delete' || type === 'error' ? <Trash2 size={20} strokeWidth={2.5} /> : <Check size={20} strokeWidth={3} />}
      </div>
      <div>
          <p className="text-sm font-black text-gray-900">{type === 'delete' ? 'ลบรายการ' : type === 'error' ? 'ผิดพลาด' : 'สำเร็จ'}</p>
          <p className="text-xs line-clamp-1 text-gray-400">{message}</p>
      </div>
    </div>
);

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="w-full h-[calc(100vh-320px)] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
      <Icon size={48} className="text-gray-300" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-black text-gray-400 tracking-tight text-center px-6">{title}</h3>
    {description && (
      <p className="text-xs text-gray-300 font-bold mt-2 text-center px-8 leading-relaxed max-w-[250px]">
        {description}
      </p>
    )}
  </div>
);

// New Bouncing Dots Loader
const BouncingDotsLoader = ({ style }) => (
    <div className="absolute top-0 left-0 right-0 flex justify-center items-start pt-6 pointer-events-none" style={style}>
        <div className="flex gap-1.5 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-[#00704A] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-[#00704A] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-[#00704A] rounded-full animate-bounce"></div>
        </div>
    </div>
);

const PersistentHeader = ({ title, scrollProgress, onProfileClick }) => (
  <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
    <div className="absolute top-0 left-0 right-0 h-[60px]" 
      style={{ 
        background: `linear-gradient(to bottom, 
          #ffffff 0%, 
          ${alpha('#ffffff', '0.98')} 25%, 
          ${alpha('#ffffff', '0.85')} 50%, 
          ${alpha('#ffffff', '0.4')} 80%, 
          ${alpha('#ffffff', '0')} 100%)` 
      }}
    />
    <div className="relative pt-4 pb-2 px-[18px] flex justify-between items-center"
      style={{ opacity: 1 - scrollProgress, transform: `translateY(${-(scrollProgress * 15)}px)`, transition: 'opacity 0.2s ease-out, transform 0.2s ease-out' }}>
      <h1 className="text-[26px] font-black tracking-tight text-gray-900">{title}</h1>
      <button onClick={onProfileClick} className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden shadow-sm bg-white pointer-events-auto active:scale-90 transition-transform">
        <img src={MOCK_DATA.user.photo} alt="user" className="w-full h-full object-cover" />
      </button>
    </div>
  </div>
);

const StickySearchBar = ({ value, onChange, onFocus, onBlur, placeholder, inputRef }) => (
  <div className="sticky top-[18px] z-[150] -mx-[18px] px-[18px] pb-2 bg-transparent pointer-events-none">
     <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-3 border border-gray-100 shadow-lg shadow-gray-900/5 pointer-events-auto">
        <Search size={18} className="text-gray-400 flex-shrink-0" />
        <input 
          ref={inputRef}
          id="main-search-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder} 
          className="w-full bg-transparent outline-none text-base font-bold text-gray-900 placeholder-gray-400" 
        />
        {value && (
            <button 
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                    onChange('');
                }} 
                className="p-1"
            >
                <X size={18} className="text-gray-400" />
            </button>
        )}
     </div>
  </div>
);

const MenuCard = ({ menu, onSelect }) => {
  const displayPrice = menu.typeOptions && menu.typeOptions.length > 0 ? menu.typeOptions[0].price : 0;
  const hasDiscount = menu.discount > 0;
  
  return (
    <div className="flex flex-col group cursor-pointer">
      <div className="relative aspect-square mb-3">
        <div className="w-full h-full rounded-[24px] overflow-hidden shadow-sm bg-gray-100">
          <img 
            src={menu.image} 
            alt={menu.name} 
            className="w-full h-full object-cover group-active:scale-110 transition-transform duration-700" 
            onClick={() => onSelect(menu)}
          />
        </div>
        {menu.isRecommended && (
          <div 
            className="absolute top-2.5 left-2.5 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm"
            style={{ backgroundColor: alpha('#00704A', '0.9') }}
          >
            ยอดสั่งเยอะที่สุด
          </div>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(menu); 
          }}
          className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all z-10 text-white"
          style={{ backgroundColor: '#00704A' }}
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
      <div className="px-1" onClick={() => onSelect(menu)}>
        <h3 className="text-[14px] font-bold text-gray-800 leading-tight line-clamp-2 min-h-[38px]">
          {menu.name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap -mt-1">
          {hasDiscount ? (
            <>
                <span className="text-[20px] font-extra-thick text-red-500">฿{displayPrice}</span>
                <span className="text-[12px] text-gray-400 line-through">฿{displayPrice + menu.discount}</span>
                <Tag size={12} className="text-red-500" />
            </>
          ) : (
            <span className="text-[20px] font-extra-thick" style={{ color: '#00704A' }}>฿{displayPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const NewsCard = ({ item }) => (
  <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm mb-6">
    <div className="relative h-44">
      <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
      <div 
        className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
        style={{ backgroundColor: item.type === 'Promotion' ? '#f97316' : '#00704A' }}
      >
        {item.type === 'Promotion' ? 'โปรโมชั่น' : 'ข่าวสาร'}
      </div>
    </div>
    <div className="p-6">
      <h4 className="font-bold text-gray-900 text-lg line-clamp-1">{item.title}</h4>
      <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">{item.content}</p>
      <div className="mt-4 flex items-center text-[10px] text-gray-300 font-bold tracking-widest uppercase">
         <History size={12} className="mr-1" /> {item.date}
      </div>
    </div>
  </div>
);

// --- MENU DETAIL MODAL ---
const MenuDetailModal = ({ menu, onClose, onConfirm, onDelete, isEditMode = false }) => {
  const initialType = useMemo(() => {
    if (isEditMode && menu.selectedType) {
        return menu.typeOptions.find(t => t.label === menu.selectedType) || menu.typeOptions[0];
    }
    return menu.typeOptions[0];
  }, [menu, isEditMode]);

  const initialAddOns = useMemo(() => {
    if (isEditMode && menu.selectedAddOns) {
        const labels = menu.selectedAddOns.split(', ');
        return menu.addOns.filter(a => labels.includes(a.label));
    }
    return [];
  }, [menu, isEditMode]);

  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedAddOns, setSelectedAddOns] = useState(initialAddOns);
  const [note, setNote] = useState(menu.note || '');

  const finalPrice = useMemo(() => {
    const addOnTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    return selectedType.price + addOnTotal;
  }, [selectedType, selectedAddOns]);

  const toggleAddOn = (addon) => {
    if (selectedAddOns.some(item => item.label === addon.label)) {
      setSelectedAddOns(selectedAddOns.filter(item => item.label !== addon.label));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const shouldShowTypeSelection = menu.typeOptions[0].label !== "ไม่มีตัวเลือก";

  return (
    <div className="fixed inset-0 z-[200] backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        <div className="relative h-64 flex-shrink-0">
          <img src={menu.image} className="w-full h-full object-cover" alt={menu.name} />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent"></div>
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 active:scale-90 transition-transform" style={{ backgroundColor: alpha('#ffffff', '0.2') }}><X size={20} /></button>
        </div>
        <div className="p-8 overflow-y-auto no-scrollbar flex-1 pb-32">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{menu.name}</h2>
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">{menu.category}</span>
            </div>
            <span className="text-3xl font-extra-thick" style={{ color: '#00704A' }}>฿{finalPrice}</span>
          </div>
          <div className="space-y-8 mt-6">
            {shouldShowTypeSelection && (
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เลือกรูปแบบ</label>
                <div className="flex flex-wrap gap-3">
                  {menu.typeOptions.map((type, idx) => (
                    <button key={idx} onClick={() => setSelectedType(type)} 
                        className="flex-1 min-w-[80px] py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all"
                        style={{ 
                            backgroundColor: selectedType.label === type.label ? alpha('#00704A', '0.1') : '#ffffff',
                            borderColor: selectedType.label === type.label ? '#00704A' : '#f3f4f6',
                            color: selectedType.label === type.label ? '#00704A' : '#9ca3af'
                        }}
                    >
                      {type.label}<span className="block text-[10px] opacity-60 font-normal">฿{type.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {menu.addOns && menu.addOns.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เพิ่มเติม (Add-on)</label>
                <div className="space-y-2">
                  {menu.addOns.map((addon, idx) => {
                    const isSelected = selectedAddOns.some(item => item.label === addon.label);
                    return (
                      <button key={idx} onClick={() => toggleAddOn(addon)} 
                          className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all"
                          style={{
                              borderColor: isSelected ? '#00704A' : '#f9fafb',
                              backgroundColor: isSelected ? alpha('#00704A', '0.05') : '#ffffff'
                          }}
                      >
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                                style={{ backgroundColor: isSelected ? '#00704A' : '#e5e7eb' }}>
                                {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                            </div>
                            <span className="text-sm font-bold" style={{ color: isSelected ? '#00704A' : '#111827' }}>{addon.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-400">+฿{addon.price}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">หมายเหตุถึงร้าน</label>
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="เช่น หวานน้อย, ไม่ใส่ผัก..." 
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-base font-medium text-gray-700 focus:ring-2 outline-none h-24 resize-none"
                  style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                />
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-white/90 backdrop-blur-xl z-[210] pb-8 rounded-t-[32px]">
          {isEditMode ? (
              <div className="flex gap-3">
                  <button onClick={onDelete} className="p-4 bg-red-50 text-red-500 rounded-2xl active:scale-95 transition-all shadow-sm"><Trash2 size={24} /></button>
                  <button 
                    onClick={() => { onConfirm({ ...menu, price: finalPrice, selectedType: selectedType.label, selectedAddOns: selectedAddOns.map(a => a.label).join(', '), note }); onClose(); }} 
                    className="flex-1 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
                  >
                    อัพเดทรายการ - ฿{finalPrice}
                  </button>
              </div>
          ) : (
            <button 
                onClick={() => { onConfirm({ ...menu, price: finalPrice, selectedType: selectedType.label, selectedAddOns: selectedAddOns.map(a => a.label).join(', '), note }); onClose(); }} 
                className="w-full text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
            >
                <Plus size={24} /> เพิ่มลงตะกร้า - ฿{finalPrice}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[300] backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-[32px] p-8 pb-6 w-full max-w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500"><Trash2 size={36} strokeWidth={2} /></div>
            <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการลบ?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">คุณต้องการลบรายการนี้ออกจากออเดอร์ใช่หรือไม่</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 active:scale-95 transition-transform">ยกเลิก</button>
                <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30 active:scale-95 transition-transform">ลบเลย</button>
            </div>
        </div>
    </div>
);

// --- LOGOUT CONFIRMATION MODAL ---
const LogoutConfirmModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[350] backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-[32px] p-8 pb-6 w-full max-w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <LogOut size={36} strokeWidth={2} className="ml-1" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการออกจากระบบ?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">คุณต้องการออกจากระบบใช่หรือไม่</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 active:scale-95 transition-transform">ยกเลิก</button>
                <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30 active:scale-95 transition-transform">ออกเลย</button>
            </div>
        </div>
    </div>
);

// --- SPLASH & LOGIN ---
const SplashView = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const slides = [
      {title: "ดื่มด่ำกับรสชาติแท้จริง555", desc: "สัมผัสความหอมกรุ่นของเมล็ดกาแฟสายพันธุ์ดีที่เราคัดสรรมาเพื่อคุณโดยเฉพาะ", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800"}, 
      {title: "สั่งง่าย จ่ายสะดวก", desc: "ไม่ต้องรอนาน สั่งเครื่องดื่มแก้วโปรดล่วงหน้าและชำระเงินได้ทันทีผ่านแอป", image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800"}, 
      {title: "สิทธิพิเศษสำหรับคุณ", desc: "สะสมแต้มแลกรับส่วนลดและของรางวัลมากมายในทุกๆ การสั่งซื้อ", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"}
  ];

  useEffect(() => { 
    if (containerRef.current) { 
        containerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'; 
        containerRef.current.style.transform = `translateX(-${step * 100}vw)`; 
    } 
  }, [step]);

  const handleTouchStart = (e) => { 
    isDragging.current = true; 
    startX.current = e.touches[0].clientX; 
    if (containerRef.current) containerRef.current.style.transition = 'none'; 
  };

  const handleTouchMove = (e) => { 
    if (!isDragging.current || !containerRef.current) return; 
    const diff = e.touches[0].clientX - startX.current; 
    let effectiveDrag = diff; 
    if ((step === 0 && diff > 0) || (step === slides.length - 1 && diff < 0)) effectiveDrag = diff * 0.3; 
    containerRef.current.style.transform = `translateX(${-(step * window.innerWidth) + effectiveDrag}px)`; 
  };

  const handleTouchEnd = (e) => {
    isDragging.current = false;
    const diff = e.changedTouches[0].clientX - startX.current;
    if (containerRef.current) containerRef.current.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    if (diff < -80 && step < slides.length - 1) setStep(s => s + 1);
    else if (diff > 80 && step > 0) setStep(s => s - 1);
    else if (containerRef.current) containerRef.current.style.transform = `translateX(-${step * 100}vw)`;
  };

  return (
    <div className="fixed inset-0 bg-white z-[500] flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ touchAction: 'none' }}>
      <div className={`absolute top-8 right-8 z-10 transition-opacity duration-300 ${step === slides.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={onFinish} className="text-gray-400 font-bold text-sm">ข้าม</button>
      </div>
      <div ref={containerRef} className="flex-1 flex will-change-transform" style={{ width: `${slides.length * 100}vw` }}>
        {slides.map((slide, index) => (
            <div key={index} className="w-[100vw] h-full flex flex-col items-center justify-center p-8 pt-20">
                <div className="w-full max-w-sm aspect-square rounded-[40px] overflow-hidden shadow-2xl relative mb-12">
                    <img src={slide.image} className="w-full h-full object-cover" draggable={false} alt={slide.title} />
                </div>
                <div className="text-center space-y-4 max-w-xs px-4">
                    <h2 className="text-3xl font-black text-gray-900">{slide.title}</h2>
                    <p className="text-gray-500 font-medium">{slide.desc}</p>
                </div>
            </div>
        ))}
      </div>
      <div className="w-full max-w-sm mx-auto flex flex-col gap-8 items-center pb-12 px-8">
        <div className="flex gap-2">
            {slides.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8' : 'w-2 bg-gray-200'}`} style={{ backgroundColor: i === step ? '#00704A' : '' }} />)}
        </div>
        <button onClick={() => step < 2 ? setStep(step + 1) : onFinish()} className="w-full text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all" style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}>
            {step < 2 ? 'ถัดไป' : 'เริ่มต้นใช้งาน'}
        </button>
      </div>
    </div>
  );
};

const LoginView = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleLogin = (e) => { 
      e.preventDefault(); 
      setIsLoading(true); 
      setError(''); 
      setTimeout(() => { 
          if (username === 'user' && password === 'user') onLoginSuccess(); 
          else { setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'); setIsLoading(false); } 
      }, 1000); 
  };
  return (
    <div className="fixed inset-0 bg-[#FDFDFD] z-[400] flex flex-col p-8 justify-center">
      <div className="mb-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: alpha('#00704A', '0.1'), color: '#00704A' }}><Coffee size={32} /></div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">ยินดีต้อนรับ</h1>
          <p className="text-gray-400 font-bold">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-1">Username</label>
            <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2" style={{ '--tw-ring-color': alpha('#00704A', '0.2') }} placeholder="user" />
            </div>
        </div>
        <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-1">Password</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2" style={{ '--tw-ring-color': alpha('#00704A', '0.2') }} placeholder="user" />
            </div>
        </div>
        {error && <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold"><SearchX size={18} /> {error}</div>}
        <button type="submit" disabled={isLoading} className="w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex justify-center gap-2" style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}>
            {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
};

// --- MAIN APP WRAPPER ---
const MainApp = ({ onLogout }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const toastTimeoutRef = useRef(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [scrollPositions, setScrollPositions] = useState({ home: 0, menu: 0, search: 0, order: 0 });

  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('ทั้งหมด');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeGlobalCategory, setActiveGlobalCategory] = useState('ทั้งหมด');
  const [isSearching, setIsSearching] = useState(false);
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  
  const categoryContainerRef = useRef(null);
  const scrollContainerRef = useRef(null); 
  const searchInputRef = useRef(null);
  const isAutoScrolling = useRef(false);
  const isJustFocused = useRef(false); 
  const [isPulling, setIsPulling] = useState(false);
  
  // Ref for previous query to track changes
  const prevMenuSearchQuery = useRef(menuSearchQuery);
  const prevGlobalSearchQuery = useRef(globalSearchQuery); // Added ref for global search

  useEffect(() => {
    const isModalOpen = showProfile || selectedMenu || editingItem || deleteConfirmItem || showLogoutConfirm;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showProfile, selectedMenu, editingItem, deleteConfirmItem, showLogoutConfirm]);

  const filteredMenuResults = useMemo(() => {
    let result = [...MOCK_DATA.menus];
    const q = menuSearchQuery.toLowerCase();
    if (q) result = result.filter(item => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q));
    if (activeMenuCategory === 'แนะนำ') result = result.filter(item => item.isRecommended);
    else if (activeMenuCategory !== 'ทั้งหมด') result = result.filter(item => item.category === activeMenuCategory);
    return result.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
  }, [menuSearchQuery, activeMenuCategory]);

  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.toLowerCase();
    if (!q) return { promos: [], news: [], menus: [] };
    const filteredNews = MOCK_DATA.news.filter(n => {
      const typeThai = n.type === 'Promotion' ? 'โปรโมชั่น' : 'ข่าวสาร';
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || typeThai.includes(q);
    });
    const filteredMenus = MOCK_DATA.menus.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
    return { promos: filteredNews.filter(n => n.type === 'Promotion'), news: filteredNews.filter(n => n.type === 'News'), menus: filteredMenus };
  }, [globalSearchQuery]);

  // Main Scroll Handler - attached to div
  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollProgress(Math.min(1, Math.max(0, scrollTop / 55)));
    
    // Check if we need to hide keyboard (and user is not scrolling automatically)
    if (!isAutoScrolling.current && !isJustFocused.current && document.activeElement === searchInputRef.current) {
        searchInputRef.current.blur();
    }
  };

  // Change page handler
  const changePage = (newPage) => {
    if (currentPage === newPage) return;
    
    if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setScrollPositions(prev => ({ ...prev, [currentPage]: scrollTop }));
    }
    
    setCurrentPage(newPage);
  };

  // Restore scroll position
  useLayoutEffect(() => {
      if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositions[currentPage] || 0;
      }
      
      // Reset isJustFocused on page change to avoid stale state issues
      isJustFocused.current = false;
  }, [currentPage]);

  // Use touchmove to distinguish user scroll from system scroll
  const handleTouchMoveOnBody = (e) => {
    // FIX: Remove check to ensure keyboard hides on user drag in Search page
    if (!isAutoScrolling.current && document.activeElement === searchInputRef.current) {
        searchInputRef.current.blur();
    }
    
    // Pull to Refresh
    const containerScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartRef.current;
    
    // Use containerScrollY, NOT window.scrollY
    if (containerScrollY <= 10 && diff > 0 && !isRefreshing) {
       setPullDistance(Math.min(diff * 0.4, 120)); 
    }
  };

  // --- Logic: Auto Scroll to Categories on Search ---
  useEffect(() => {
    let scrollTimeout;
    
    // Check for changes
    const menuQueryChanged = menuSearchQuery !== prevMenuSearchQuery.current;
    const globalQueryChanged = globalSearchQuery !== prevGlobalSearchQuery.current;
    
    // Update refs
    prevMenuSearchQuery.current = menuSearchQuery;
    prevGlobalSearchQuery.current = globalSearchQuery;

    // Determine conditions
    const isMenuPage = currentPage === 'menu';
    const isSearchPage = currentPage === 'search';
    
    const shouldScroll = (isMenuPage && menuQueryChanged) || (isSearchPage && globalQueryChanged);

    if (shouldScroll && categoryContainerRef.current && scrollContainerRef.current) {
        isAutoScrolling.current = true;

        scrollTimeout = setTimeout(() => {
            const container = scrollContainerRef.current;
            const element = categoryContainerRef.current;
            
            const headerOffset = 85; 
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            const currentScrollTop = container.scrollTop;
            const relativeTop = elementRect.top - containerRect.top;
            const targetScrollTop = currentScrollTop + relativeTop - headerOffset;

            if (currentScrollTop > targetScrollTop) {
                 isAutoScrolling.current = true; 
                 container.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
                
                setTimeout(() => {
                    isAutoScrolling.current = false;
                }, 1000);
            } else {
                isAutoScrolling.current = false;
            }
        }, 500); 
    } else {
        // Safe reset if no scroll triggered
        scrollTimeout = setTimeout(() => {
            isAutoScrolling.current = false;
        }, 500);
    }
    
    return () => {
        clearTimeout(scrollTimeout);
    };
  }, [menuSearchQuery, globalSearchQuery, currentPage]); // Added globalSearchQuery

  const handleMenuSearchChange = (text) => {
      isAutoScrolling.current = true; 
      isJustFocused.current = true; 
      setMenuSearchQuery(text);
      setTimeout(() => { isJustFocused.current = false; }, 800);
  };

  const handleGlobalSearchChange = (text) => {
      isAutoScrolling.current = true; // Lock scroll hide
      isJustFocused.current = true; 
      setGlobalSearchQuery(text);
      setTimeout(() => { isJustFocused.current = false; }, 1000); 
  };

  // --- Pull to Refresh Logic ---
  const handleTouchStart = (e) => {
    const containerScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
    if (containerScrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPulling(false);
    if (pullDistance > 60) {
       setIsRefreshing(true);
       setPullDistance(60); 
       
       setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
       }, 1500);
    } else {
       setPullDistance(0);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price, 0); 
  const isGlobalSearchEmpty = globalSearchResults.promos.length === 0 && globalSearchResults.news.length === 0 && globalSearchResults.menus.length === 0;
  
  // REMOVED: Nav bar hiding logic based on search state. Nav bar is now always visible.
  const isScrollLocked = (currentPage === 'order' && cart.length === 0);

  const showToastMsg = (msg, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000);
  };

  const handleAddToCart = (item) => {
    setCart([...cart, { ...item, cartId: Date.now(), quantity: 1 }]);
    showToastMsg(`เพิ่ม ${item.name} ในออเดอร์แล้ว`, 'success');
  };

  const handleUpdateCart = (updatedItem) => {
    setCart(cart.map(item => item.cartId === updatedItem.cartId ? updatedItem : item));
    showToastMsg(`อัพเดทรายการเรียบร้อย`, 'success');
  };

  const confirmDelete = () => {
    if (deleteConfirmItem) {
        setCart(cart.filter(c => c.cartId !== deleteConfirmItem.cartId));
        const deletedName = deleteConfirmItem.name;
        setDeleteConfirmItem(null);
        setEditingItem(null);
        showToastMsg(`ลบ ${deletedName} แล้ว`, 'delete');
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const correctedMainPaddingTop = 80 + pullDistance;

  return (
    <div 
        ref={scrollContainerRef}
        className={`h-[100dvh] bg-[#FDFDFD] text-[#111827] select-none ${isScrollLocked ? 'overflow-hidden' : 'pb-32 overflow-y-auto'}`} 
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMoveOnBody}
        onTouchEnd={handleTouchEnd}
    >
      <PersistentHeader title={currentPage === 'home' ? `สวัสดี, คุณสมชาย` : currentPage === 'menu' ? 'เมนูของร้าน' : currentPage === 'search' ? 'ค้นหา' : 'รายการสั่ง'} scrollProgress={scrollProgress} onProfileClick={() => setShowProfile(true)} />

      {/* Pull to Refresh Indicator */}
      <div 
          className={`fixed top-4 left-0 right-0 z-[130] flex justify-center pointer-events-none transition-transform duration-200 ease-out ${isPulling ? '!transition-none' : ''}`}
          style={{ 
              transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)`, 
              opacity: pullDistance > 0 ? Math.min(pullDistance / 40, 1) : 0
          }}
      >
          {isRefreshing ? (
             <BouncingDotsLoader style={{ position: 'relative', paddingTop: 0 }} />
          ) : (
             <div className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center transform transition-transform" style={{ transform: `rotate(${pullDistance * 3}deg)` }}>
                <ArrowDown size={16} className="text-[#00704A] -rotate-180" />
             </div>
          )}
      </div>

      <main 
        className={`px-[18px] transition-all duration-200 ease-out ${isPulling ? '!transition-none' : ''}`}
        style={{ paddingTop: `${correctedMainPaddingTop}px` }}
      >
        
        {currentPage === 'home' && (
          <div className="space-y-12">
            <section>
                <h2 className="text-xl font-black text-[#111827] mb-5 px-1 flex justify-between items-center">ข่าวสารและโปรโมชั่น <ArrowRight size={20} className="text-gray-300" /></h2>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-[18px] px-[18px]">
                    {MOCK_DATA.news.map(n => (
                        <div key={n.id} className="w-[280px] min-w-[280px] h-48 relative rounded-[32px] overflow-hidden shadow-lg border border-gray-100 bg-white flex-shrink-0">
                            <img src={n.image} className="w-full h-full object-cover" alt={n.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                                <h3 className="font-bold text-lg leading-tight">{n.title}</h3>
                                <p className="text-white/70 text-xs mt-1 line-clamp-1">{n.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section>
                <h2 className="text-xl font-black text-[#111827] mb-5 px-1">เมนูแนะนำสำหรับคุณ</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                    {MOCK_DATA.menus.filter(m => m.isRecommended).slice(0, 4).map(menu => <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />)}
                </div>
            </section>
          </div>
        )}

        {currentPage === 'menu' && (
          <div className="flex flex-col gap-1">
            <StickySearchBar 
                value={menuSearchQuery} 
                onChange={handleMenuSearchChange}
                onFocus={() => {
                  setIsSearching(true);
                  isJustFocused.current = true;
                  setTimeout(() => { isJustFocused.current = false; }, 800);
                }} 
                onBlur={() => setTimeout(() => setIsSearching(false), 100)} 
                placeholder="ค้นหาเมนู หรือหมวดหมู่..." 
                inputRef={searchInputRef}
            />
            <div ref={categoryContainerRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] py-1 mt-1">
                {['ทั้งหมด', ...MOCK_DATA.menuCategories].map(cat => (
                    <button key={cat} onClick={() => setActiveMenuCategory(cat)} className={`px-6 py-3 rounded-full text-xs font-black whitespace-nowrap transition-all border`} 
                        style={{ 
                            backgroundColor: activeMenuCategory === cat ? '#00704A' : '#ffffff', 
                            borderColor: activeMenuCategory === cat ? '#00704A' : '#f3f4f6', 
                            color: activeMenuCategory === cat ? '#ffffff' : '#9ca3af', 
                            transform: activeMenuCategory === cat ? 'scale(1.05)' : 'scale(1)' 
                        }}>
                        {cat}
                    </button>
                ))}
            </div>
            {filteredMenuResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 mt-4">
                    {filteredMenuResults.map(menu => <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />)}
                </div>
            ) : (
                <EmptyState icon={SearchX} title="ไม่พบเมนูที่ค้นหา" description="ลองตรวจสอบคำค้นหา หรือเลือกดูในหมวดหมู่อื่นดูนะ" />
            )}
          </div>
        )}

        {currentPage === 'search' && (
          <div className="flex flex-col gap-1 h-full">
            <StickySearchBar 
                value={globalSearchQuery} 
                onChange={handleGlobalSearchChange}
                onFocus={() => {
                  setIsSearching(true);
                  isJustFocused.current = true;
                  setTimeout(() => { isJustFocused.current = false; }, 800);
                }}
                onBlur={() => setTimeout(() => setIsSearching(false), 100)} 
                placeholder="ค้นหาโปรโมชั่น ข่าวสาร หรือเมนู..." 
                inputRef={searchInputRef}
            />
            {!globalSearchQuery ? <EmptyState icon={SearchIcon} title="ค้นหาสิ่งที่คุณต้องการเลย" description="พิมพ์คำค้นหาเพื่อเริ่มค้นหาโปรโมชั่น ข่าวสาร และเมนูอร่อยๆ" /> : (
              <div>
                <div ref={categoryContainerRef} className="flex gap-2 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] py-1 mt-1">
                    {['ทั้งหมด', 'โปรโมชั่น', 'ข่าวสาร', 'เมนู'].map(cat => (
                        <button key={cat} onClick={() => setActiveGlobalCategory(cat)} className={`px-6 py-3 rounded-full text-xs font-black whitespace-nowrap transition-all border`} 
                            style={{ 
                                backgroundColor: activeGlobalCategory === cat ? '#00704A' : '#ffffff', 
                                borderColor: activeGlobalCategory === cat ? '#00704A' : '#f3f4f6', 
                                color: activeGlobalCategory === cat ? '#ffffff' : '#9ca3af', 
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>
                {isGlobalSearchEmpty ? (
                    <EmptyState icon={SearchX} title="ไม่พบข้อมูลที่ค้นหา" description="ลองตรวจสอบตัวสะกด หรือเปลี่ยนหมวดหมู่การค้นหาดูนะ" />
                  ) : (
                    <div className="mt-8">
                      {(activeGlobalCategory === 'ทั้งหมด' || activeGlobalCategory === 'โปรโมชั่น') && globalSearchResults.promos.length > 0 && (
                          <div className="mb-6">
                              {activeGlobalCategory === 'ทั้งหมด' && <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-2 text-gray-400"><Sparkles size={12}/> โปรโมชั่นที่พบ</h3>}
                              {globalSearchResults.promos.map(item => <NewsCard key={`p-${item.id}`} item={item} />)}
                          </div>
                      )}
                      {(activeGlobalCategory === 'ทั้งหมด' || activeGlobalCategory === 'ข่าวสาร') && globalSearchResults.news.length > 0 && (
                          <div className="mb-6">
                              {activeGlobalCategory === 'ทั้งหมด' && <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-2 text-gray-400"><Sparkles size={12}/> ข่าวสารที่พบ</h3>}
                              {globalSearchResults.news.map(item => <NewsCard key={`n-${item.id}`} item={item} />)}
                          </div>
                      )}
                      {(activeGlobalCategory === 'ทั้งหมด' || activeGlobalCategory === 'เมนู') && globalSearchResults.menus.length > 0 && (
                          <div className="mb-12">
                              {activeGlobalCategory === 'ทั้งหมด' && <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-2 text-gray-400"><Sparkles size={12}/> เมนูที่พบ</h3>}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-8">{globalSearchResults.menus.map(item => <MenuCard key={`m-${item.id}`} menu={item} onSelect={setSelectedMenu} />)}</div>
                          </div>
                      )}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {currentPage === 'order' && (
           <div className="space-y-6">
              <div className="sticky top-[18px] z-[150] -mx-[18px] px-[18px] pb-2 bg-transparent pointer-events-none">
                 <div className="p-6 rounded-[32px] shadow-xl border flex justify-between items-center pointer-events-auto mt-2 bg-white/90 backdrop-blur-xl" style={{ borderColor: '#f3f4f6' }}>
                     <div><p className="text-[10px] font-bold uppercase text-gray-400">ราคารวม</p><p className="text-3xl font-black" style={{ color: '#00704A' }}>฿{total}</p></div>
                     <button className="text-white px-10 py-4 rounded-2xl font-black active:scale-95 transition-transform" style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}>สั่งรายการ</button>
                 </div>
              </div>
              
              {cart.map((item, idx) => (
                <div key={idx} onClick={() => setEditingItem(item)} className="p-2 pr-4 rounded-[32px] flex items-center gap-4 border shadow-sm active:scale-[0.98] transition-all bg-white border-gray-100">
                    <img src={item.image} className="w-20 h-20 rounded-[24px] object-cover flex-shrink-0" alt={item.name} />
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base line-clamp-1 text-gray-900 leading-tight">{item.name}</h4>
                        <p className="text-xs mt-1 line-clamp-1 text-gray-400">{item.selectedType} {item.selectedAddOns ? `+ ${item.selectedAddOns}` : ''}</p>
                    </div>
                    {/* ส่วนแสดงราคาที่ปรับปรุงใหม่ */}
                    <div className="flex-shrink-0 pl-2 flex flex-col items-end">
                        {item.discount > 0 ? (
                            <>
                                <p className="text-xl font-black text-red-500">฿{item.price}</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400 line-through">฿{item.price + item.discount}</span>
                                    <Tag size={10} className="text-red-500" />
                                </div>
                            </>
                        ) : (
                            <p className="text-xl font-black" style={{ color: '#00704A' }}>฿{item.price}</p>
                        )}
                    </div>
                </div>
              ))}
              {cart.length === 0 && <EmptyState icon={ShoppingBag} title="ตะกร้าว่างเปล่า" description="ลองเลือกเมนูที่คุณถูกใจเพิ่มลงในตะกร้าสิ" />}
           </div>
        )}
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-24 left-6 right-6 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border flex items-center gap-3 z-[200] transition-all duration-300 transform ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`} style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`} style={{ backgroundColor: toastType === 'delete' ? '#ef4444' : '#22c55e' }}>{toastType === 'delete' ? <Trash2 size={20} strokeWidth={2.5} /> : <Check size={20} strokeWidth={3} />}</div>
        <div><p className="text-sm font-black text-gray-900">{toastType === 'delete' ? 'ลบรายการ' : 'สำเร็จ'}</p><p className="text-xs line-clamp-1 text-gray-400">{toastMessage}</p></div>
      </div>

      {/* Navigation Bar - Fixed at bottom, NO hiding logic */}
      <div className="fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-between gap-3 px-[18px] pb-[18px] pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100">
        <div className="flex-1 backdrop-blur-xl rounded-full flex items-center justify-around p-[2px] border shadow-2xl pointer-events-auto h-[64px]" 
             style={{ backgroundColor: alpha('#ffffff', '0.9'), borderColor: alpha('#f3f4f6', '0.5') }}>
          {[{ id: 'home', icon: Coffee, label: 'หน้าร้าน' }, { id: 'menu', icon: LayoutGrid, label: 'เมนู' }, { id: 'order', icon: ShoppingBag, label: 'ออเดอร์' }].map((item) => (
            <button key={item.id} onClick={() => { changePage(item.id); window.scrollTo({ top: 0, behavior: 'instant' }); }} className={`relative flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-300`} style={{ color: currentPage === item.id ? '#00704A' : '#9ca3af' }}>
              {currentPage === item.id && <div className="absolute inset-[2px] rounded-full" style={{ backgroundColor: '#f1f5f9' }} />}
              <item.icon size={22} strokeWidth={currentPage === item.id ? 2.5 : 2} className="relative z-10" />
              <span className="text-[10px] mt-1 font-bold relative z-10">{item.label}</span>
              {item.id === 'order' && cart.length > 0 && <span className="absolute top-1 right-5 text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full border-2 z-20 shadow-sm" style={{ backgroundColor: '#ef4444', borderColor: '#ffffff' }}>{cart.length}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => { changePage('search'); window.scrollTo({ top: 0, behavior: 'instant' }); }} 
                className={`w-[64px] h-[64px] flex-shrink-0 rounded-full flex items-center justify-center backdrop-blur-xl border shadow-2xl pointer-events-auto transition-all duration-300`} 
                style={{ backgroundColor: currentPage === 'search' ? '#00704A' : alpha('#ffffff', '0.9'), borderColor: alpha('#ffffff', '0.5'), color: currentPage === 'search' ? '#ffffff' : '#9ca3af' }}>
          <Search size={26} strokeWidth={3} />
        </button>
      </div>

      {/* Modals */}
      {selectedMenu && <MenuDetailModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} onConfirm={(item) => handleAddToCart(item)} />}
      
      {editingItem && <MenuDetailModal menu={editingItem} isEditMode={true} onClose={() => setEditingItem(null)} onConfirm={(item) => { handleUpdateCart(item); setEditingItem(null); }} onDelete={() => setDeleteConfirmItem(editingItem)} />}

      {deleteConfirmItem && <DeleteConfirmModal onConfirm={confirmDelete} onCancel={() => setDeleteConfirmItem(null)} />}

      {showLogoutConfirm && <LogoutConfirmModal onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />}

      {showProfile && (
        <div className="fixed inset-0 z-[300] bg-gradient-to-b from-[#fcfcfc] to-[#f4f4f7] p-[18px]">
          <div className="flex justify-between items-center mb-8 mt-0 px-0"><h2 className="text-2xl font-black">โปรไฟล์</h2><button onClick={() => setShowProfile(false)} className="p-2 bg-white border border-[#f3f4f6] rounded-full shadow-sm"><X size={24}/></button></div>
          <div className="rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden mb-10" style={{ backgroundColor: '#1c1c1e' }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px]" style={{ backgroundColor: alpha('#00704A', '0.4') }}></div>
              <div className="flex gap-4 items-center mb-10 relative z-10">
                  <img src={MOCK_DATA.user.photo} className="w-16 h-16 rounded-2xl border border-white/20" alt="profile" />
                  <div>
                      <h3 className="text-xl font-bold">{MOCK_DATA.user.name}</h3>
                      <p className="text-[10px] font-black uppercase mt-1 tracking-widest" style={{ color: '#00704A' }}>{MOCK_DATA.user.id}</p>
                  </div>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-8 relative z-10">
                  <div>
                      <p className="text-[10px] font-bold uppercase mb-1 text-gray-400">Point Balance</p>
                      <p className="text-3xl font-black">{MOCK_DATA.user.points} <span className="text-xs font-normal" style={{ color: '#00704A' }}>Pts</span></p>
                  </div>
                  <QrCode size={50} className="opacity-30" />
              </div>
          </div>
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full py-5 text-red-500 rounded-[28px] shadow-sm bg-white border border-[#f3f4f6] font-bold flex items-center justify-center gap-2"><LogOut size={20} /> ออกจากระบบ</button>
        </div>
      )}

      {/* Global Styles */}
      <GlobalStyles />
    </div>
  );
};

const App = () => {
  const [appState, setAppState] = useState('splash');
  const [globalToast, setGlobalToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
      if (globalToast.show) {
          const timer = setTimeout(() => setGlobalToast(prev => ({...prev, show: false})), 3000);
          return () => clearTimeout(timer);
      }
  }, [globalToast.show]);

  const handleLogout = () => {
      setAppState('login');
      setTimeout(() => {
          setGlobalToast({ show: true, message: 'ออกจากระบบเรียบร้อย', type: 'success' });
      }, 300);
  };

  if (appState === 'splash') return (
    <>
      <GlobalStyles />
      <SplashView onFinish={() => setAppState('login')} />
    </>
  );
  
  return (
    <>
      <GlobalStyles />
      {appState === 'login' && <LoginView onLoginSuccess={() => setAppState('main')} />}
      {appState === 'main' && <MainApp onLogout={handleLogout} />}
      
      <ToastNotification 
        show={globalToast.show} 
        message={globalToast.message} 
        type={globalToast.type} 
        extraClass="bottom-6" 
      />
    </>
  );
};


export default App;
