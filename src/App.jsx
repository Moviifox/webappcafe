import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  showOrderStatusNotification,
} from './pushNotification';
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
  ArrowDown,
  Scan,
  UploadCloud,
  Loader2,
  CircleDollarSign,
  Receipt,
  FileWarning,
  BadgeCheck,
  Download,
  FileText,
  Bell
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

const PROMOTIONS = [
  {
    code: 'CAFE50',
    name: 'ส่วนลดเงินสด 50 บาท',
    description: 'รับส่วนลด 50 บาท เมื่อสั่งครบ 1 แก้ว',
    type: 'flat',
    value: 50,
    usageLimit: 1,
    expiresAt: '2025-12-31',
  },
  {
    code: 'WELCOME10',
    name: 'ส่วนลดสมาชิกใหม่ 10%',
    description: 'ลด 10% สูงสุด 40 บาท สำหรับลูกค้าใหม่',
    type: 'percent',
    value: 10,
    maxDiscount: 40,
    usageLimit: 2,
    expiresAt: '2025-06-30',
  },
];

const ORDER_STATUS_META = {
  waiting_payment: {
    label: 'รอการชำระเงิน',
    color: '#f97316',
    background: 'rgba(249, 115, 22, 0.12)',
  },
  waiting_confirmation: {
    label: 'รอการตรวจสอบ',
    color: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.12)',
  },
  paid: {
    label: 'ชำระเงินสำเร็จ',
    color: '#16a34a',
    background: 'rgba(22, 163, 74, 0.12)',
  },
  completed: {
    label: 'ออเดอร์สำเร็จ',
    color: '#8b5cf6',
    background: 'rgba(139, 92, 246, 0.12)',
  },
};

const formatBaht = (value = 0) => `฿${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;

const generateOrderNumber = () => `ORD-${Date.now().toString().slice(-6)}`;

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const verifySlipAmountFromFileName = (fileName, expectedAmount) => {
  if (!fileName) return null;
  const sanitized = fileName.replace(/,/g, '');
  const match = sanitized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const fileAmount = parseFloat(match[1]);
  const roundedExpected = Math.round(expectedAmount * 100) / 100;
  return Math.abs(fileAmount - roundedExpected) < 0.01;
};

const calculatePromotionDiscount = (subtotal, promotion) => {
  if (!promotion || !subtotal) return 0;
  if (promotion.type === 'flat') {
    return Math.min(subtotal, promotion.value || 0);
  }
  if (promotion.type === 'percent') {
    const rawDiscount = subtotal * ((promotion.value || 0) / 100);
    const capped = promotion.maxDiscount ? Math.min(rawDiscount, promotion.maxDiscount) : rawDiscount;
    return Math.round(capped * 100) / 100;
  }
  return 0;
};

// --- GLOBAL STYLES ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
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
// Global Toast Component
const ToastNotification = React.memo(({ show, message, type, extraClass = "" }) => {
  const isDelete = type === 'delete' || type === 'error' || type === 'logout';
  const Icon = type === 'logout' ? LogOut : (isDelete ? Trash2 : Check);

  return (
    <div className={`fixed ${extraClass || 'bottom-24'} left-6 right-6 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border flex items-center gap-3 z-[1000] transition-all duration-300 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0`}
        style={{ backgroundColor: isDelete ? '#ef4444' : '#22c55e' }}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-sm font-black text-gray-900">
          {type === 'delete' ? 'ลบรายการ' : type === 'error' ? 'ผิดพลาด' : type === 'logout' ? 'ออกจากระบบ' : 'สำเร็จ'}
        </p>
        <p className="text-xs line-clamp-1 text-gray-400">{message}</p>
      </div>
    </div>
  );
});

const EmptyState = React.memo(({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6 text-gray-200">
      <Icon size={48} strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto font-medium">{description}</p>
  </div>
));

// New Bouncing Dots Loader
const BouncingDotsLoader = React.memo(({ style }) => (
  <div className="flex justify-center items-center gap-1.5 py-4" style={style}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-[#00704A] animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
      ></div>
    ))}
  </div>
));

// Header ด้านบนสุดของแต่ละหน้า
const PersistentHeader = React.memo(({ title, scrollProgress, onProfileClick, showOrderHistoryButton, onOrderHistoryClick, onNotificationClick, notificationCount, userPhoto }) => (
  <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
    <div
      className="absolute top-0 left-0 right-0 h-[60px]"
      style={{
        background: `linear-gradient(to bottom,
          #fcfcfc 0%,
          ${alpha('#fcfcfc', '0.98')} 1%,
          ${alpha('#fcfcfc', '0')} 100%)`,
      }}
    />
    <div
      className="relative pt-4 pb-2 px-[18px] flex justify-between items-center"
      style={{
        opacity: Math.max(0, 1 - scrollProgress),
        transform: `translateY(${-(scrollProgress * 15)}px)`,
        transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
      }}
    >
      <h1 className="text-[26px] font-black tracking-tight text-gray-900 line-clamp-1 flex-1 pr-4">{title}</h1>
      <div className="flex items-center gap-3">
        {showOrderHistoryButton && (
          <button
            onClick={onOrderHistoryClick}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm pointer-events-auto active:scale-95 transition-transform flex items-center justify-center text-gray-600"
          >
            <History size={18} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={onNotificationClick}
          className="relative w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm pointer-events-auto active:scale-95 transition-transform flex items-center justify-center text-gray-600"
        >
          <Bell size={18} strokeWidth={2.5} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
        <button
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full border border-gray-100 overflow-hidden shadow-sm bg-white pointer-events-auto active:scale-90 transition-transform"
        >
          <img src={userPhoto || 'https://via.placeholder.com/40'} alt="user" className="w-full h-full object-cover" />
        </button>
      </div>
    </div>
  </div>
));

// Search bar ติดด้านบน
const StickySearchBar = React.memo(({ value, onChange, onFocus, onBlur, placeholder, inputRef }) => (
  <div className="sticky top-0 z-[200] -mx-[18px] px-[14px] pb-2 pt-2 bg-[#f3f4f600]">
    <div className="relative group bg-white bg-opacity-80 backdrop-blur-xl rounded-[24px]">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00704A] transition-colors"><Search size={20} /></div>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full bg-white bg-opacity-0 border-2 border-[#f3f4f6] py-4 pl-14 pr-6 rounded-[24px] text-[15px] font-bold shadow-sm outline-none transition-all placeholder:text-gray-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {value && (
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange('');
          }}
          className="p-1 absolute right-5 top-1/2 -translate-y-1/2"
        >
          <X size={18} className="text-gray-400" />
        </button>
      )}
    </div>
  </div>
));

// --- IMAGE CACHING UTILS ---
const imageCache = new Map();
const failedCache = new Set();

const CachedImage = ({ src, alt, className, style, onClick, ...props }) => {
  // 1. Check if we have a cached blob in memory
  const cachedBlobUrl = imageCache.get(src);

  // 2. Initialize: Use cached blob if available, otherwise original src
  // We commit to this source for the lifetime of this component mount to avoid "swap flicker"
  const [displaySrc] = useState(cachedBlobUrl || src);

  useEffect(() => {
    if (!src) return;

    // If already cached or failed or is data/blob, do nothing
    if (imageCache.has(src) || failedCache.has(src) || src.startsWith('data:') || src.startsWith('blob:')) {
      return;
    }

    // Background fetch to populate cache for NEXT mount
    const fetchImage = async () => {
      try {
        const response = await fetch(src, { mode: 'cors' });
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        imageCache.set(src, objectUrl);
        // Note: We deliberately do NOT `setDisplaySrc` here.
        // Changing the src of a visible image causes a repaint/flash.
        // We let the browser show the original `src` for now (from its own HTTP cache).
        // The NEXT time this component mounts (e.g. switching pages), it will grab the blob from imageCache.
      } catch (e) {
        failedCache.add(src);
      }
    };

    fetchImage();
  }, [src]);

  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className} // Removed transition-opacity duration-300 opacity-0 logic
      style={style}
      onClick={onClick}
      {...props}
    />
  );
};

const MenuCard = React.memo(({ menu, onSelect }) => {
  const displayPrice = menu.typeOptions && menu.typeOptions.length > 0 ? menu.typeOptions[0].price : 0;
  const hasDiscount = menu.discount > 0;

  return (
    <div className="flex flex-col group cursor-pointer">
      <div className="relative aspect-square mb-3">
        <div className="w-full h-full rounded-[24px] overflow-hidden shadow-sm bg-gray-100">
          <CachedImage
            src={menu.image}
            alt={menu.name}
            className="w-full h-full object-cover object-center group-active:scale-110 transition-transform duration-700"
            style={{ aspectRatio: '1 / 1' }}
            onClick={() => onSelect(menu)}
          />
        </div>
        {menu.isRecommended && (
          <div
            className="absolute top-2.5 left-2.5 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm uppercase tracking-wider"
            style={{ backgroundColor: alpha('#00704A', '0.9') }}
          >
            เมนูแนะนำ ✨
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
});

const NewsCard = React.memo(({ item }) => (
  <div className="w-full rounded-[32px] overflow-hidden shadow-lg border border-gray-100 bg-white mb-6 relative group">
    <div className="aspect-[16/8] overflow-hidden">
      <CachedImage src={item.image} className="w-full h-full object-cover group-active:scale-105 transition-transform duration-700" alt={item.title} />
    </div>
    <div className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.type === 'Promotion' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
          {item.type === 'Promotion' ? 'Promotion' : 'News'}
        </span>
        <span className="text-[10px] font-bold text-gray-400">{formatDateTime(item.date).split(' ')[0]}</span>
      </div>
      <h3 className="text-lg font-black text-gray-900 leading-tight mb-2">{item.title}</h3>
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 font-medium">{item.content}</p>
    </div>
  </div>
));

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
    const basePrice = selectedType.price + addOnTotal;
    // ลดราคาจาก discount
    return menu.discount > 0 ? basePrice - menu.discount : basePrice;
  }, [selectedType, selectedAddOns, menu.discount]);

  // ราคาปกติ (ก่อนลด)
  const originalPrice = useMemo(() => {
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
    <div className="fixed inset-0 z-[200] backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="relative h-64 flex-shrink-0">
          <CachedImage src={menu.image} className="w-full h-full object-cover" alt={menu.name} />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent"></div>
          {menu.isRecommended && (
            <div className="absolute top-6 left-6 backdrop-blur-md text-white text-[14px] pl-[14px] pr-[10px] pt-[6px] pb-[5px] rounded-2xl font-bold shadow-sm z-10 uppercase tracking-wider" style={{ backgroundColor: alpha('#00704A', '0.85') }}>
              เมนูแนะนำ ✨
            </div>
          )}
          <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 active:scale-90 transition-transform" style={{ backgroundColor: alpha('#ffffff', '0.2') }}><X size={20} /></button>
        </div>
        <div className="p-8 overflow-y-auto no-scrollbar flex-1 pb-32">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{menu.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {(menu.categories || [])
                  .filter(cat => cat !== 'แนะนำ')
                  .map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-bold uppercase tracking-wider border border-gray-200/50">
                      {cat}
                    </span>
                  ))}
              </div>
            </div>
            {menu.discount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through">฿{originalPrice}</span>
                <span className="text-sm font-bold text-red-500">ลด ฿{menu.discount}</span>
                <span className="text-3xl font-extra-thick text-red-500">฿{finalPrice}</span>
              </div>
            ) : (
              <span className="text-3xl font-extra-thick" style={{ color: '#00704A' }}>฿{finalPrice}</span>
            )}
          </div>
          <div className="space-y-8 mt-6">
            {shouldShowTypeSelection && (
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เลือกรูปแบบ</label>
                <div className="flex flex-wrap gap-3">
                  {menu.typeOptions.map((type, idx) => (
                    <button key={idx} onClick={() => setSelectedType(type)}
                      className="flex-1 min-w-[80px] py-3 px-2 rounded-2xl text-sm font-bold border-2 transition-all"
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
    </div >
  );
};

// --- DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[300] backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
    <div className="bg-white rounded-[32px] p-8 pb-6 w-full max-w-sm shadow-2xl text-center animate-in slide-in-from-bottom duration-300 border" style={{ borderColor: '#f3f4f6' }}>
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
  <div className="fixed inset-0 z-[350] backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
    <div className="bg-white rounded-[32px] p-8 pb-6 w-full max-w-sm shadow-2xl text-center animate-in slide-in-from-bottom duration-300 border" style={{ borderColor: '#f3f4f6' }}>
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
        <LogOut size={36} strokeWidth={2} className="ml-1" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการออกจากระบบ?</h3>
      <p className="text-gray-500 text-sm leading-relaxed font-medium">คุณต้องการออกจากระบบใช่หรือไม่</p>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">การออกจาระบบส่งผลให้รายการในออเดอร์ของคุณถูกลบ</p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 active:scale-95 transition-transform">ยกเลิก</button>
        <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30 active:scale-95 transition-transform">ออกเลย</button>
      </div>
    </div>
  </div>
);

const StatusPill = React.memo(({ status }) => {
  const meta = ORDER_STATUS_META[status];
  if (!meta) return null;
  return (
    <div className="px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/5 shadow-sm" style={{ backgroundColor: meta.background }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }}></div>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</span>
    </div>
  );
});

const PaymentSummaryRow = React.memo(({ label, value, highlight }) => (
  <div className="flex justify-between items-center h-5">
    <span className="text-xs font-bold text-gray-500">{label}</span>
    <span className={`text-sm ${highlight ? 'font-black text-[#16a34a]' : 'font-bold text-gray-800'}`}>{value}</span>
  </div>
));

const PaymentFlowModal = ({
  visible,
  cart,
  subtotal,
  discount,
  finalTotal,
  step,
  paymentMethod,
  onClose,
  onNext,
  onBack,
  onSelectPayment,
  promoInput,
  onPromoInputChange,
  onApplyPromotion,
  appliedPromotion,
  onRemovePromotion,
  onScanPromotion,
  promotionError,
  onSubmitCash,
  onSubmitPromptPay,
  onAttachSlip,
  slipFileName,
  isCheckingSlip,
  slipError,
  onRetrySlip,
  onRemoveSlip,
}) => {
  const fileInputRef = useRef(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  if (!visible) return null;

  const titleMap = {
    selection: 'สรุปรายการและชำระเงิน',
    cash_review: 'ยืนยันการชำระเงินสด',
    promptpay_review: 'ชำระผ่าน PromptPay',
  };

  const handleSlipButton = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onAttachSlip(file);
    }
    event.target.value = '';
  };

  const handleSaveQR = async () => {
    const qrUrl = `https://promptpay.io/0619961130/${finalTotal}`;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const orderNumber = Math.floor(Math.random() * 9000) + 1000;

      canvas.width = 400;
      canvas.height = 580;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header bar
      ctx.fillStyle = '#00704A';
      ctx.fillRect(0, 0, canvas.width, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 18px Foxgraphie, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`ชำระเงินผ่าน PromptPay #${orderNumber}`, 200, 42);

      // Generate PromptPay EMVCo payload (matches promptpay.io format exactly)
      const generatePromptPayPayload = (phone, amount) => {
        // Format phone: 0619961130 -> 0066619961130
        const sanitizedPhone = phone.replace(/\D/g, '');
        const formattedPhone = '0066' + sanitizedPhone.substring(1);

        const f = (id, val) => id + val.length.toString().padStart(2, '0') + val;

        // Build payload exactly like promptpay.io
        const aid = f('00', 'A000000677010111');
        const mobile = f('01', formattedPhone);
        const merchantAccount = f('29', aid + mobile);

        let payloadWithoutCrc = f('00', '01'); // Payload format indicator
        payloadWithoutCrc += f('01', '11'); // Static QR (11) not dynamic (12)
        payloadWithoutCrc += merchantAccount;
        payloadWithoutCrc += f('53', '764'); // Currency THB

        if (amount && amount > 0) {
          payloadWithoutCrc += f('54', amount.toFixed(2));
        }

        payloadWithoutCrc += f('58', 'TH'); // Country
        payloadWithoutCrc += '6304'; // CRC placeholder

        // CRC16-CCITT (same as promptpay.io)
        let crc = 0xFFFF;
        for (let i = 0; i < payloadWithoutCrc.length; i++) {
          crc ^= payloadWithoutCrc.charCodeAt(i) << 8;
          for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
            crc &= 0xFFFF;
          }
        }
        return payloadWithoutCrc + crc.toString(16).toUpperCase().padStart(4, '0');
      };

      const promptPayData = generatePromptPayPayload('0619961130', finalTotal);
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(promptPayData)}`;

      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';

      let qrLoaded = false;
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('timeout')), 8000);
          qrImg.onload = () => { clearTimeout(timeout); qrLoaded = true; resolve(); };
          qrImg.onerror = () => { clearTimeout(timeout); reject(new Error('error')); };
          qrImg.src = qrApiUrl;
        });
      } catch {
        qrLoaded = false;
      }

      // Draw QR code
      if (qrLoaded) {
        ctx.drawImage(qrImg, 100, 90, 200, 200);
      }

      // Payment details section
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(30, 320, 340, 140);

      ctx.fillStyle = '#6b7280';
      ctx.font = '400 14px Foxgraphie, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ยอดชำระทั้งสิ้น', 200, 360);

      ctx.fillStyle = '#00704A';
      ctx.font = '700 40px Foxgraphie, sans-serif';
      ctx.fillText(`฿${finalTotal.toLocaleString()}`, 200, 410);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 13px Foxgraphie, sans-serif';
      ctx.fillText(`${cart.length} รายการ`, 200, 440);

      ctx.font = '400 12px Foxgraphie, sans-serif';
      ctx.fillText('สแกนด้วยแอปธนาคารเพื่อชำระเงิน', 200, 500);

      // Load and draw icon
      const iconImg = new Image();
      let iconLoaded = false;
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('timeout')), 3000);
          iconImg.onload = () => { clearTimeout(timeout); iconLoaded = true; resolve(); };
          iconImg.onerror = () => { clearTimeout(timeout); reject(new Error('error')); };
          iconImg.src = '/icon/qr_slip.svg';
        });
      } catch {
        iconLoaded = false;
      }

      // App name with icon
      const appName = 'My Cafe';
      ctx.fillStyle = '#00704A';
      ctx.font = '700 20px Foxgraphie, sans-serif';
      const textWidth = ctx.measureText(appName).width;

      if (iconLoaded) {
        const iconSize = 28;
        const totalWidth = iconSize + 8 + textWidth;
        const startX = (400 - totalWidth) / 2;
        ctx.drawImage(iconImg, startX, 517, iconSize, iconSize);
        ctx.textAlign = 'left';
        ctx.fillText(appName, startX + iconSize + 8, 540);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText('☕ ' + appName, 200, 540);
      }

      // Get blob
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) { window.open(qrUrl + '.png', '_blank'); return; }

      const file = new File([blob], `qr-${orderNumber}.png`, { type: 'image/png' });

      // Mobile: use Web Share to save to Photos
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        // Desktop: download file
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error(e);
      window.open(qrUrl + '.png', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-end justify-center bg-[252,252,252,0.2] backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] animate-in slide-in-from-bottom duration-200 flex flex-col h-[90vh]">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <button onClick={step === 'selection' ? onClose : onBack} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
            {step === 'selection' ? <X size={20} /> : <ChevronLeft size={20} />}
          </button>
          <h3 className="text-base font-black text-gray-900">{titleMap[step]}</h3>
          {step === 'selection' && (
            <button
              onClick={onNext}
              disabled={!paymentMethod}
              className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${paymentMethod ? 'bg-[#00704A] text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
            >
              ถัดไป
            </button>
          )}
          {step === 'cash_review' && (
            <button
              onClick={onSubmitCash}
              className="px-5 py-2.5 rounded-full text-sm font-black bg-[#00704A] text-white shadow-lg active:scale-95 transition-transform"
            >
              ส่งออเดอร์
            </button>
          )}
          {step === 'promptpay_review' && (
            slipFileName ? (
              <button
                onClick={onSubmitPromptPay}
                className="px-5 py-2.5 rounded-full text-sm font-black bg-[#00704A] text-white shadow-lg active:scale-95 transition-transform"
              >
                ส่งออเดอร์
              </button>
            ) : <div className="w-10" />
          )}
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar pb-10">
          {step === 'selection' && (
            <>
              <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">ยอดรวม</p>
                    <p className="text-2xl font-black text-gray-900">{formatBaht(subtotal)}</p>
                  </div>
                  <CircleDollarSign size={32} className="text-[#00704A]" />
                </div>
                <PaymentSummaryRow label="ส่วนลด" value={`- ${formatBaht(discount)}`} />
                <PaymentSummaryRow label="ชำระทั้งสิ้น" value={formatBaht(finalTotal)} highlight />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">รหัสโปรโมชั่น</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center rounded-2xl border border-gray-200 bg-white px-3 py-2">
                    <input
                      value={promoInput}
                      onChange={(e) => onPromoInputChange(e.target.value.toUpperCase())}
                      placeholder="กรอกรหัสโปรโมชั่น"
                      className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-800"
                    />
                    <button
                      onClick={onScanPromotion}
                      className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Scan size={18} />
                    </button>
                  </div>
                  <button
                    onClick={onApplyPromotion}
                    disabled={!promoInput}
                    className={`px-4 py-3 rounded-2xl text-sm font-black transition-all ${promoInput ? 'bg-[#00704A] text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-400'}`}
                  >
                    ใช้โค้ด
                  </button>
                </div>
                {appliedPromotion && (
                  <div className="flex items-center justify-between bg-[#00704A]/10 border border-[#00704A]/20 px-4 py-3 rounded-2xl text-sm text-[#00704A] font-bold">
                    <div>
                      <p className="font-black">ใช้ {appliedPromotion.code}</p>
                      <p className="text-xs text-[#00704A]/70">{appliedPromotion.name}</p>
                    </div>
                    <button onClick={onRemovePromotion} className="text-xs font-black text-[#00704A] underline">ยกเลิก</button>
                  </div>
                )}
                {promotionError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
                    <FileWarning size={18} />
                    <span>{promotionError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">วิธีการชำระเงิน</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ id: 'cash', label: 'เงินสด', description: 'ชำระที่เคาท์เตอร์', icon: CircleDollarSign }, { id: 'promptpay', label: 'QR PromptPay', description: 'สแกนผ่านธนาคาร', icon: QrCode }].map(option => {
                    const active = paymentMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => onSelectPayment(option.id)}
                        className={`rounded-3xl border-2 p-5 text-left transition-all ${active ? 'border-[#00704A] bg-[#00704A]/10 shadow-lg' : 'border-gray-100 bg-white'}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${active ? 'bg-[#00704A] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <option.icon size={22} />
                        </div>
                        <p className="text-sm font-black text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <PaymentSummaryRow label="สินค้าทั้งหมด" value={`${cart.length} รายการ`} />
                <div className="space-y-3 bg-gray-50 border border-gray-100 rounded-3xl p-5">
                  {cart.map(item => (
                    <div key={item.cartId || Math.random()} className="flex flex-col gap-1 border-b border-gray-200/50 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start gap-4 text-sm font-bold text-gray-800">
                        <div className="flex-1">
                          <p className="line-clamp-1 leading-tight">{item.name}</p>
                          <p className="text-[10px] font-medium text-gray-400 mt-1 line-clamp-1 capitalize">
                            {item.selectedType} {item.selectedAddOns ? `+ ${item.selectedAddOns}` : ''}
                            {item.note && <span className="text-gray-400"> + {item.note}</span>}
                          </p>
                        </div>
                        <span className="flex-shrink-0 font-black text-gray-900">{formatBaht(item.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 'cash_review' && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
                <PaymentSummaryRow label="จำนวนสินค้า" value={`${cart.length} รายการ`} />
                <PaymentSummaryRow label="ยอดรวม" value={formatBaht(subtotal)} />
                <PaymentSummaryRow label="ส่วนลด" value={`- ${formatBaht(discount)}`} />
                <PaymentSummaryRow label="ยอดชำระ" value={formatBaht(finalTotal)} highlight />
              </div>
              <div className="rounded-3xl border border-[#00704A]/20 bg-[#00704A]/10 p-5 text-sm text-[#00704A] font-bold leading-relaxed">
                <p>กรุณาชำระเงินสดที่เคาท์เตอร์แคชเชียร์ภายใน 15 นาที เพื่อรักษาสิทธิ์โปรโมชั่นและคิวของคุณ</p>
              </div>
            </div>
          )}

          {step === 'promptpay_review' && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
                <PaymentSummaryRow label="ยอดรวม" value={formatBaht(subtotal)} />
                <PaymentSummaryRow label="ส่วนลด" value={`- ${formatBaht(discount)}`} />
                <PaymentSummaryRow label="ยอดชำระ" value={formatBaht(finalTotal)} highlight />
              </div>
              <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 flex flex-col items-center gap-4">
                <div className="w-44 h-44 rounded-3xl bg-white border-4 border-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://promptpay.io/0619961130/${finalTotal}`}
                    alt="PromptPay QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm font-bold text-gray-500">สแกนจ่ายด้วยแอปธนาคารของคุณ</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveQR}
                    className="flex items-center gap-2 px-5 py-3 bg-gray-200 text-gray-700 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                  >
                    <Download size={18} /> บันทึกรูป
                  </button>
                  <button
                    onClick={handleSlipButton}
                    className="flex items-center gap-2 px-5 py-3 bg-[#00704A] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"
                  >
                    <UploadCloud size={18} /> แนบสลิป
                  </button>
                </div>
                {slipFileName && (
                  <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-2xl w-full border border-gray-200">
                    <div
                      className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                      onClick={() => setShowImageViewer(true)}
                    >
                      <img src={slipFileName} alt="Slip Thumbnail" className="w-full h-full object-cover" />
                    </div>
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setShowImageViewer(true)}
                    >
                      <p className="text-xs font-bold text-gray-600">สลิปที่แนบ:</p>
                      <p className="text-sm font-black text-[#00704A]">แนบไฟล์สำเร็จ</p>
                    </div>
                    <button
                      onClick={onRemoveSlip}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {slipError && (
                  <div className="flex flex-col items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 px-4 py-3 rounded-2xl">
                    <FileWarning size={18} />
                    <span className="text-center">{slipError}</span>
                    <button onClick={onRetrySlip} className="text-xs underline font-black text-red-500">ลองใหม่อีกครั้ง</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <ImageViewerModal
          visible={showImageViewer}
          imageUrl={slipFileName}
          onClose={() => setShowImageViewer(false)}
        />

        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
      </div>

      {isCheckingSlip && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="px-6 py-5 bg-white rounded-3xl shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#00704A]" size={32} strokeWidth={3} />
            <p className="text-sm font-bold text-gray-700">กำลังตรวจสอบสลิป</p>
            <p className="text-xs text-gray-400">โปรดรอซักครู่...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentResultModal = ({ visible, status, orderNumber, methodLabel, message, onConfirm }) => {
  if (!visible) return null;
  const isSuccess = status === 'paid';
  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
      <div className="w-full max-w-sm bg-white rounded-[36px] p-8 text-center shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300 border" style={{ borderColor: '#f3f4f6' }}>
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
          {isSuccess ? <Check size={36} strokeWidth={3} /> : <Receipt size={36} strokeWidth={2.5} />}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900">ออเดอร์ของคุณเลขที่ {orderNumber}</h3>
          <p className="text-sm font-bold text-gray-500 leading-relaxed">{message}</p>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">วิธีการชำระเงิน: {methodLabel}</p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-2xl bg-[#00704A] text-white font-black text-sm shadow-lg active:scale-95 transition-transform"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
};

// --- IMAGE VIEWER MODAL ---
const ImageViewerModal = ({ visible, imageUrl, onClose }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center backdrop-blur-md p-6 animate-in fade-in duration-300" onClick={onClose} style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="relative w-full max-w-md h-full flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
        <div className="w-full flex justify-end">
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
            <X size={28} />
          </button>
        </div>
        <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-[#f3f4f6] flex items-center justify-center bg-black/10">
          <img src={imageUrl} alt="Slip Full View" className="w-full h-full object-contain animate-in zoom-in-95 duration-300" />
        </div>

      </div>
    </div>
  );
};

// --- SLIP PREVIEW MODAL ---
const SlipPreviewModal = ({ visible, imageUrl, fileName, onConfirm, onReselect, onClose }) => {
  console.log('SlipPreviewModal - visible:', visible, 'imageUrl:', imageUrl, 'fileName:', fileName);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center backdrop-blur-sm p-6" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="w-full max-w-md bg-white rounded-[36px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border" style={{ borderColor: '#f3f4f6' }}>
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-900 text-center">ตรวจสอบสลิป</h3>
          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Preview */}
        <div className="p-6 space-y-4">
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200">
            <img
              src={imageUrl}
              alt="Slip Preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* File Info */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl">
            <FileText size={20} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500">สถานะไฟล์</p>
              <p className="text-sm font-black text-gray-900">พร้อมแนบหลักฐานการโอน</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-[#00704A] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"
          >
            แนบรูป
          </button>
          <button
            onClick={onReselect}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm active:scale-95 transition-transform"
          >
            เลือกใหม่
          </button>
        </div>
      </div>
    </div>
  );
};

const SlipDeleteConfirmModal = ({ visible, onConfirm, onCancel }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[360] backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="bg-white rounded-[32px] p-8 pb-6 w-full max-w-sm shadow-2xl text-center animate-in slide-in-from-bottom duration-300 border" style={{ borderColor: '#f3f4f6' }}>
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <Trash2 size={36} strokeWidth={2} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการลบสลิป?</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">คุณต้องการลบสลิปการชำระเงินนี้ใช่หรือไม่</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 active:scale-95 transition-transform">ยกเลิก</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-500 shadow-lg shadow-red-500/30 active:scale-95 transition-transform">ลบเลย</button>
        </div>
      </div>
    </div>
  );
};

const OrderDetailSheet = ({ order, visible, onClose, onUpdateOrder, showToastMsg }) => {
  const [paymentMethod, setPaymentMethod] = useState(order?.paymentMethod || 'cash');
  const [slipFileName, setSlipFileName] = useState(order?.slipFileName || '');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  // State สำหรับ slip preview
  const [showSlipPreview, setShowSlipPreview] = useState(false);
  const [pendingSlipFile, setPendingSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    if (order) {
      setPaymentMethod(order.paymentMethod || 'cash');
      setSlipFileName(order.slipFileName || '');
      setIsEditing(false);
    }
  }, [order]);

  if (!visible || !order) return null;

  const canEditPayment = order.status === 'waiting_payment' || order.status === 'waiting_confirmation';

  const handleSlipButton = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // สร้าง preview URL และแสดง modal
      const previewUrl = URL.createObjectURL(file);
      setPendingSlipFile(file);
      setSlipPreviewUrl(previewUrl);
      setShowSlipPreview(true);
    }
    event.target.value = '';
  };

  const handleConfirmSlip = async () => {
    if (pendingSlipFile && onUpdateOrder) {
      try {
        const fileExt = pendingSlipFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('slips')
          .upload(filePath, pendingSlipFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('slips')
          .getPublicUrl(filePath);

        setSlipFileName(publicUrl);
        // บันทึก Public URL ลง Supabase
        await onUpdateOrder(order.id, {
          paymentMethod: order.paymentMethod,
          status: 'waiting_confirmation',
          slipFileName: publicUrl,
        });

        setShowSlipPreview(false);
        if (slipPreviewUrl) {
          URL.revokeObjectURL(slipPreviewUrl);
        }
        setPendingSlipFile(null);
        setSlipPreviewUrl('');
        if (showToastMsg) {
          showToastMsg('อัพโหลดสลิปสำเร็จ', 'success');
        }
      } catch (error) {
        console.error('Error uploading slip:', error);
        if (showToastMsg) {
          showToastMsg('เกิดข้อผิดพลาดในการอัพโหลดสลิป', 'error');
        }
      }
    }
  };

  const handleReselectSlip = () => {
    // เปิด file input ใหม่
    fileInputRef.current?.click();
  };

  const handleCloseSlipPreview = () => {
    setShowSlipPreview(false);
    if (slipPreviewUrl) {
      URL.revokeObjectURL(slipPreviewUrl);
    }
    setPendingSlipFile(null);
    setSlipPreviewUrl('');
  };

  const handleRemoveSlip = () => {
    // แสดง confirmation modal แทนการลบทันที
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setSlipFileName('');
    // ลบสลิปจาก Supabase
    if (onUpdateOrder) {
      await onUpdateOrder(order.id, {
        paymentMethod: order.paymentMethod,
        status: order.status,
        slipFileName: null,
      });
    }
    setShowDeleteConfirm(false);
    if (showToastMsg) {
      showToastMsg('ลบสลิปสำเร็จ', 'delete');
    }
  };

  const handleSaveQR = async () => {
    try {
      const link = document.createElement('a');
      link.href = `https://promptpay.io/0619961130/${order.total}`;
      link.download = `promptpay_${order.id}.png`;
      link.click();
    } catch (err) {
      console.error('Error saving QR:', err);
    }
  };

  const handleConfirmPayment = async () => {
    if (onUpdateOrder) {
      // เปลี่ยนสถานะตามวิธีชำระเงิน
      const newStatus = paymentMethod === 'cash' ? 'waiting_payment' : 'waiting_confirmation';
      await onUpdateOrder(order.id, {
        paymentMethod: paymentMethod,
        status: newStatus,
        slipFileName: slipFileName || null,
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-[340] flex items-end justify-center" style={{ backgroundColor: 'rgba(252,252,252,0.0)' }}>
      <div className="w-full max-w-md h-[90vh] bg-white rounded-t-[40px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <StatusPill status={order.status} />
          <h3 className="text-lg font-black text-gray-900 mt-[-2px]">รายละเอียดออเดอร์</h3>
          <button onClick={onClose} className="w-10 h-10 mt-[-4px] rounded-full border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-5 flex-1 overflow-y-auto no-scrollbar pb-10">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-black">เลขที่ออเดอร์</p>
            <p className="text-xl font-black text-gray-900">{order.id}</p>
            <p className="text-xs text-gray-400">สร้างเมื่อ {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 space-y-3">
            {(order.items || []).map((item, idx) => (
              <div key={item.cartId || idx} className="flex flex-col gap-1 border-b border-gray-100/50 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between gap-4 text-sm font-bold text-gray-700">
                  <span className="line-clamp-1 flex-1">{item.name} {item.note && <span className="text-gray-400 font-normal"> + {item.note}</span>}</span>
                  <span className="flex-shrink-0">{formatBaht(item.price)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <PaymentSummaryRow label="ยอดรวม" value={formatBaht(order.subtotal)} />
            <PaymentSummaryRow label="ส่วนลด" value={`- ${formatBaht(order.discount)}`} />
            <PaymentSummaryRow label="ชำระทั้งสิ้น" value={formatBaht(order.total)} highlight />
          </div>

          {/* วิธีการชำระเงิน */}
          <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600">วิธีการชำระเงิน</span>
              {canEditPayment && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-[#00704A] underline"
                >
                  แก้ไข
                </button>
              )}
            </div>

            {isEditing && canEditPayment ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${paymentMethod === 'cash' ? 'border-[#00704A] bg-[#00704A]/10 text-[#00704A]' : 'border-gray-200 text-gray-500'}`}
                  >
                    เงินสด
                  </button>
                  <button
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold border-2 transition-all ${paymentMethod === 'promptpay' ? 'border-[#00704A] bg-[#00704A]/10 text-[#00704A]' : 'border-gray-200 text-gray-500'}`}
                  >
                    QR PromptPay
                  </button>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  className="w-full py-4 bg-[#00704A] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"
                >
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-black text-gray-900">
                  {order.paymentMethod === 'cash' ? 'เงินสด' : 'QR PromptPay'}
                </p>

                {/* แสดง QR code โดยอัตโนมัติสำหรับ PromptPay ที่ยังรอชำระ */}
                {order.paymentMethod === 'promptpay' && canEditPayment && (
                  <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 flex flex-col items-center gap-4 mt-3">
                    <div className="w-44 h-44 rounded-3xl bg-white border-4 border-gray-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={`https://promptpay.io/0619961130/${order.total}`}
                        alt="PromptPay QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm font-bold text-gray-500">สแกนจ่ายด้วยแอปธนาคารของคุณ</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveQR}
                        className="flex items-center gap-2 px-5 py-3 bg-gray-200 text-gray-700 rounded-2xl font-black text-sm active:scale-95 transition-transform"
                      >
                        <Download size={18} /> บันทึกรูป
                      </button>
                      <button
                        onClick={handleSlipButton}
                        className="flex items-center gap-2 px-5 py-3 bg-[#00704A] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-transform"
                      >
                        <UploadCloud size={18} /> แนบสลิป
                      </button>
                    </div>
                    {slipFileName && (
                      <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-2xl w-full border border-gray-200 mt-2">
                        <div
                          className="w-10 h-10 rounded-lg bg-white border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
                          onClick={() => setShowImageViewer(true)}
                        >
                          <img src={slipFileName} alt="Slip Thumbnail" className="w-full h-full object-cover" />
                        </div>
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setShowImageViewer(true)}
                        >
                          <p className="text-xs font-bold text-gray-600">สลิปที่แนบ:</p>
                          <p className="text-sm font-black text-[#00704A]">แนบไฟล์สำเร็จ</p>
                        </div>
                        <button
                          onClick={handleRemoveSlip}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {order.promotion && (
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-600">โปรโมชั่น</span>
                <span className="text-sm font-black text-gray-900">{order.promotion.code}</span>
              </div>
            )}

            {/* แสดงสลิปสำหรับออเดอร์ที่สำเร็จแล้ว */}
            {(order.slip_file_name || order.slipFileName) && !canEditPayment && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-600 mb-3">หลักฐานการชำระเงิน</p>
                <div
                  className="rounded-2xl overflow-hidden border border-gray-200 cursor-pointer active:scale-[0.99] transition-transform"
                  onClick={() => setShowImageViewer(true)}
                >
                  <img
                    src={order.slip_file_name || order.slipFileName}
                    alt="Slip"
                    className="w-full h-auto max-h-[300px] object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <ImageViewerModal
        visible={showImageViewer}
        imageUrl={slipFileName || order.slip_file_name || order.slipFileName}
        onClose={() => setShowImageViewer(false)}
      />

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />

      <SlipPreviewModal
        visible={showSlipPreview}
        imageUrl={slipPreviewUrl}
        fileName={pendingSlipFile?.name || ''}
        onConfirm={handleConfirmSlip}
        onReselect={handleReselectSlip}
        onClose={handleCloseSlipPreview}
      />

      <SlipDeleteConfirmModal
        visible={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

// --- ORDER HISTORY MODAL ---
const OrderHistoryModal = ({ orders, visible, onClose, onViewDetail }) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="relative h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="w-10" />
          <h2 className="text-lg font-black text-gray-900">ประวัติออเดอร์</h2>
          <button onClick={onClose} className="w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 border border-gray-200 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 pb-8">
          {orders.length === 0 ? (
            <EmptyState icon={History} title="ยังไม่มีประวัติออเดอร์" description="เมื่อคุณสั่งซื้อเสร็จสิ้น ประวัติออเดอร์จะแสดงที่นี่" />
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => onViewDetail(order)}
                  className="w-full rounded-[28px] border border-gray-100 bg-white shadow-sm p-5 text-left active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-400 font-black">เลขที่ออเดอร์</p>
                      <p className="text-lg font-black text-gray-900">{order.id}</p>
                    </div>
                    <StatusPill status={order.status} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm font-bold text-gray-500">
                    <span>{(order.items || []).length} รายการ</span>
                    <span>{formatBaht(order.total)}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">{order.paymentMethod === 'cash' ? 'เงินสด' : 'QR PromptPay'} • {formatDateTime(order.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- NOTIFICATION MODAL ---
const NOTIFICATION_STATUS_META = {
  waiting_payment: { icon: '💳', label: 'รอการชำระเงิน', color: '#f97316' },
  waiting_confirmation: { icon: '🔍', label: 'กำลังตรวจสอบ', color: '#3b82f6' },
  paid: { icon: '✅', label: 'ชำระเงินสำเร็จ', color: '#16a34a' },
  completed: { icon: '🎉', label: 'ออเดอร์สำเร็จ', color: '#8b5cf6' },
};

const NotificationModal = ({ notifications, visible, onClose, onViewOrder, onOpen }) => {
  useEffect(() => {
    if (visible && onOpen) {
      onOpen();
    }
  }, [visible, onOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="relative h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="w-10" />
          <h2 className="text-lg font-black text-gray-900">การแจ้งเตือน</h2>
          <button onClick={onClose} className="w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 border border-gray-200 active:scale-90 transition-transform">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto no-scrollbar flex-1 pb-8">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="ไม่มีการแจ้งเตือน" description="เมื่อมีการอัปเดตออเดอร์ คุณจะได้รับการแจ้งเตือนที่นี่" />
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => {
                const meta = NOTIFICATION_STATUS_META[notif.status] || { icon: '📦', label: 'อัปเดต', color: '#6b7280' };
                return (
                  <button
                    key={notif.id || index}
                    onClick={() => onViewOrder && onViewOrder(notif.order_id || notif.orderId)}
                    className={`w-full rounded-[20px] p-4 text-left active:scale-[0.99] transition-all border ${notif.read ? 'bg-white border-gray-100' : 'bg-[#00704A]/5 border-[#00704A]/20'}`}
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${meta.color}15` }}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-gray-900 truncate">ออเดอร์ #{notif.order_id || notif.orderId}</p>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#00704A] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs font-bold mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(notif.created_at || notif.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- NEWS DETAIL MODAL ---
const NewsDetailModal = ({ news, onClose }) => {
  if (!news) return null;

  return (
    <div className="fixed inset-0 z-[350] backdrop-blur-sm flex items-end justify-center" style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className="w-full max-w-md h-[90vh] bg-white rounded-t-[40px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <div className="relative h-64 flex-shrink-0">
          <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform z-10"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="px-3 py-1 rounded-full bg-[#00704A] text-[10px] font-bold mb-3 inline-block shadow-sm">
              ข่าวสาร & โปรโมชั่น
            </span>
            <h2 className="text-2xl font-black leading-tight shadow-sm">{news.title}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center gap-3 text-gray-400 text-xs font-bold border-b border-gray-100 pb-6">
            <div className="flex items-center gap-1">
              <History size={14} />
              <span>{formatDateTime(news.date || news.createdAt || new Date())}</span>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed font-medium">
            <p>{news.content}</p>
            {news.description && <p className="mt-4">{news.description}</p>}
          </div>

          {news.image && (
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <img src={news.image} alt="content" className="w-full h-auto" />
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

// --- SPLASH & LOGIN ---
const SplashView = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const slides = [
    { title: "ดื่มด่ำกับรสชาติแท้จริง", desc: "สัมผัสความหอมกรุ่นของเมล็ดกาแฟสายพันธุ์ดีที่เราคัดสรรมาเพื่อคุณโดยเฉพาะ", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800" },
    { title: "สั่งง่าย จ่ายสะดวก", desc: "ไม่ต้องรอนาน สั่งเครื่องดื่มแก้วโปรดล่วงหน้าและชำระเงินได้ทันทีผ่านแอป", image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=800" },
    { title: "สิทธิพิเศษสำหรับคุณ", desc: "สะสมแต้มแลกรับส่วนลดและของรางวัลมากมายในทุกๆ การสั่งซื้อ", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800" }
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
    <div className="fixed inset-0 bg-[#fcfcfc] z-[500] flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ touchAction: 'none' }}>
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (queryError || !data) {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setIsLoading(false);
    }
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
          <label className="text-xs font-black text-gray-400 uppercase ml-1">ชื่อผู้ใช้งาน</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2" style={{ '--tw-ring-color': alpha('#00704A', '0.2') }} placeholder="ชื่อผู้ใช้งาน" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase ml-1">รหัสผ่าน</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2" style={{ '--tw-ring-color': alpha('#00704A', '0.2') }} placeholder="รหัสผ่าน" />
          </div>
        </div>
        {error && <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold"><SearchX size={18} /> {error}</div>}
        <button type="submit" disabled={isLoading} className="w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex justify-center gap-2" style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}>
          {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <div className="h-20"></div>
    </div>
  );
};

// --- MAIN APP WRAPPER ---
const MainApp = ({ onLogout, currentUser }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [showProfile, setShowProfile] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollTicking = useRef(false);
  const pullTicking = useRef(false);

  // Throttled Scroll Progress
  const updateScrollProgress = useCallback((scrollTop) => {
    if (!scrollTicking.current) {
      window.requestAnimationFrame(() => {
        setScrollProgress(Math.min(1, Math.max(0, scrollTop / 55)));
        scrollTicking.current = false;
      });
      scrollTicking.current = true;
    }
  }, []);

  // Throttled Pull Distance
  const updatePullDistance = useCallback((distance) => {
    if (!pullTicking.current) {
      window.requestAnimationFrame(() => {
        setPullDistance(distance);
        pullTicking.current = false;
      });
      pullTicking.current = true;
    }
  }, []);

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

  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [paymentStep, setPaymentStep] = useState('selection');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [promotionError, setPromotionError] = useState('');
  const [promotionUsage, setPromotionUsage] = useState({});
  const [isCheckingSlip, setIsCheckingSlip] = useState(false);
  const [slipFileName, setSlipFileName] = useState('');
  const [slipError, setSlipError] = useState('');
  const [showSlipPreview, setShowSlipPreview] = useState(false);
  const [pendingSlipFile, setPendingSlipFile] = useState(null);
  const [slipPreviewUrl, setSlipPreviewUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [paymentResultMeta, setPaymentResultMeta] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [focusedOrder, setFocusedOrder] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  // Supabase data states
  const [dbMenus, setDbMenus] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbAddons, setDbAddons] = useState([]);
  const [dbNews, setDbNews] = useState([]);
  const [dbPromotions, setDbPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // โหลด cart จาก localStorage เมื่อเปิดแอป
  const isCartInitialized = useRef(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cafeAppCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      } catch (e) {
        localStorage.removeItem('cafeAppCart');
      }
    }
    isCartInitialized.current = true;
  }, []);

  // บันทึก cart ลง localStorage เมื่อมีการเปลี่ยนแปลง (หลังจาก init แล้ว)
  useEffect(() => {
    if (isCartInitialized.current) {
      localStorage.setItem('cafeAppCart', JSON.stringify(cart));
    }
  }, [cart]);

  // โหลด notifications จาก localStorage เมื่อเปิดแอป
  const isNotificationsInitialized = useRef(false);

  useEffect(() => {
    const savedNotifications = localStorage.getItem('cafeAppNotifications');
    if (savedNotifications) {
      try {
        const parsedNotifications = JSON.parse(savedNotifications);
        if (parsedNotifications && parsedNotifications.length > 0) {
          setNotifications(parsedNotifications);
        }
      } catch (e) {
        localStorage.removeItem('cafeAppNotifications');
      }
    }
    isNotificationsInitialized.current = true;
  }, []);

  // บันทึก notifications ลง localStorage เมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (isNotificationsInitialized.current) {
      localStorage.setItem('cafeAppNotifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      // Fetch menus with addons prices
      const { data: menusData } = await supabase.from('menus').select('*');
      const { data: categoriesData } = await supabase.from('menu_categories').select('*').order('sort_order');
      const { data: addonsData } = await supabase.from('menu_addons').select('*');
      const { data: newsData } = await supabase.from('news').select('*').order('date', { ascending: false });
      const { data: promotionsData } = await supabase.from('promotions').select('*');

      // Fetch user's orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      // Transform menus with addons prices
      const transformedMenus = (menusData || []).map(menu => {
        const menuAddons = (menu.addons || []).map(addonLabel => {
          const addonData = (addonsData || []).find(a => a.label === addonLabel);
          return addonData ? { label: addonData.label, price: addonData.price } : { label: addonLabel, price: 0 };
        });
        const typeOptions = menu.type_options || [];
        return {
          ...menu,
          category: (menu.categories || [])[0] || '',
          categories: menu.categories || [],
          price: typeOptions[0]?.price || 0,
          originalPrice: typeOptions[0]?.price || 0,
          isRecommended: menu.is_recommended,
          typeOptions: typeOptions,
          addOns: menuAddons,
        };
      });

      // Transform orders data
      const transformedOrders = (ordersData || []).map(order => ({
        ...order,
        paymentMethod: order.payment_method,
        slipFileName: order.slip_file_name,
        createdAt: order.created_at,
      }));

      // Calculate promotion usage count from order history
      const usageMap = {};
      (ordersData || []).forEach(order => {
        if (order.promotion && order.promotion.code) {
          const code = order.promotion.code;
          usageMap[code] = (usageMap[code] || 0) + 1;
        }
      });

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      setDbMenus(transformedMenus);
      setDbCategories(categoriesData || []);
      setDbAddons(addonsData || []);
      // กรองเฉพาะข่าวที่ถึงวันเวลา publish_date แล้ว
      const now = new Date();
      const filteredNews = (newsData || []).filter(news => {
        if (!news.publish_date) return true; // ถ้าไม่มี publish_date ให้แสดงเลย
        const publishDate = new Date(news.publish_date);
        return publishDate <= now;
      });
      setDbNews(filteredNews);
      setDbPromotions(promotionsData || []);
      setOrders(transformedOrders);
      setPromotionUsage(usageMap);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Request notification permission when user logs in
  useEffect(() => {
    if (!currentUser) return;

    const setupPushNotification = async () => {
      if (isPushSupported()) {
        const permission = await requestNotificationPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          // สามารถเรียก subscribeToPush() และ saveSubscriptionToSupabase() ได้ที่นี่
          // ถ้าสร้างตาราง push_subscriptions ใน Supabase แล้ว
        }
      }
    };

    setupPushNotification();
  }, [currentUser]);

  // Realtime subscription for orders
  // Realtime subscription for orders and notifications
  useEffect(() => {
    if (!currentUser) return;

    const ordersChannel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Realtime order update:', payload);

          if (payload.eventType === 'INSERT') {
            const newOrder = {
              ...payload.new,
              paymentMethod: payload.new.payment_method,
              slipFileName: payload.new.slip_file_name,
              createdAt: payload.new.created_at,
            };
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? {
                    ...payload.new,
                    paymentMethod: payload.new.payment_method,
                    slipFileName: payload.new.slip_file_name,
                    createdAt: payload.new.created_at,
                  }
                  : order
              )
            );
            // Update focusedOrder if currently viewing the updated order
            setFocusedOrder((prev) =>
              prev && prev.id === payload.new.id
                ? {
                  ...payload.new,
                  paymentMethod: payload.new.payment_method,
                  slipFileName: payload.new.slip_file_name,
                  createdAt: payload.new.created_at,
                }
                : prev
            );
            // Show push notification when order status changes
            showOrderStatusNotification(payload.new.id, payload.new.status);
          }
        }
      )
      .subscribe();

    // Listen to notifications changes
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('Realtime notification:', payload);
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentUser]);

  // Ref for previous query to track changes
  const prevMenuSearchQuery = useRef(menuSearchQuery);
  const prevGlobalSearchQuery = useRef(globalSearchQuery);

  const isModalOpen = useMemo(() => {
    return showProfile || selectedMenu || editingItem || deleteConfirmItem || showLogoutConfirm || showPaymentFlow || showPaymentResult || showOrderDetail || showOrderHistory || showSlipPreview || showDeleteConfirm || selectedNews || showNotifications;
  }, [showProfile, selectedMenu, editingItem, deleteConfirmItem, showLogoutConfirm, showPaymentFlow, showPaymentResult, showOrderDetail, showOrderHistory, showSlipPreview, showDeleteConfirm, selectedNews, showNotifications]);

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const filteredMenuResults = useMemo(() => {
    let result = [...dbMenus];
    const q = menuSearchQuery.toLowerCase();
    if (q) result = result.filter(item => item.name.toLowerCase().includes(q) || (item.categories || []).some(c => c.toLowerCase().includes(q)));
    if (activeMenuCategory === 'แนะนำ') result = result.filter(item => item.isRecommended);
    else if (activeMenuCategory !== 'ทั้งหมด') result = result.filter(item => (item.categories || []).includes(activeMenuCategory));
    return result.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0));
  }, [menuSearchQuery, activeMenuCategory, dbMenus]);

  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.toLowerCase();
    if (!q) return { promos: [], news: [], menus: [] };
    const filteredNews = dbNews.filter(n => {
      const typeThai = n.type === 'Promotion' ? 'โปรโมชั่น' : 'ข่าวสาร';
      return n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) || n.type.toLowerCase().includes(q) || typeThai.includes(q);
    });
    const filteredMenus = dbMenus.filter(m => m.name.toLowerCase().includes(q) || (m.categories || []).some(c => c.toLowerCase().includes(q)));
    return { promos: filteredNews.filter(n => n.type === 'Promotion'), news: filteredNews.filter(n => n.type === 'News'), menus: filteredMenus };
  }, [globalSearchQuery, dbMenus, dbNews]);

  // Main Scroll Handler - attached to div
  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    updateScrollProgress(scrollTop);

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
    if (isModalOpen) return;

    const containerScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartRef.current;

    // Use containerScrollY, NOT window.scrollY
    if (containerScrollY <= 10 && diff > 0 && !isRefreshing) {
      updatePullDistance(Math.min(diff * 0.4, 120));
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
    if (isModalOpen) return;
    const containerScrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
    if (containerScrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    setIsPulling(false);
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setPullDistance(60);

      // Clear image cache on refresh
      imageCache.clear();

      // Fetch fresh data from Supabase
      await fetchData();

      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 500);
    } else {
      setPullDistance(0);
    }
  };

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price || 0), 0), [cart]);
  const promotionDiscount = useMemo(() => calculatePromotionDiscount(subtotal, appliedPromotion), [subtotal, appliedPromotion]);
  const finalTotal = useMemo(() => Math.max(0, subtotal - promotionDiscount), [subtotal, promotionDiscount]);
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

  const handlePromoInputChange = (value) => {
    setPromoInput(value);
    if (promotionError) setPromotionError('');
  };

  const handleOpenPaymentFlow = () => {
    if (cart.length === 0) {
      showToastMsg('ยังไม่มีรายการในตะกร้า', 'error');
      return;
    }
    setPaymentStep('selection');
    setSelectedPaymentMethod(null);
    setPromotionError('');
    setPromoInput(appliedPromotion ? appliedPromotion.code : '');
    setSlipFileName('');
    setSlipError('');
    setShowPaymentFlow(true);
  };

  const handleClosePaymentFlow = () => {
    setShowPaymentFlow(false);
    setPaymentStep('selection');
    setSelectedPaymentMethod(null);
    setPromotionError('');
    setIsCheckingSlip(false);
    setSlipFileName('');
    setSlipError('');
  };

  const handlePaymentNext = () => {
    if (!selectedPaymentMethod) return;
    setPaymentStep(selectedPaymentMethod === 'cash' ? 'cash_review' : 'promptpay_review');
  };

  const handlePaymentBack = () => {
    if (paymentStep === 'selection') {
      handleClosePaymentFlow();
    } else {
      setPaymentStep('selection');
      setIsCheckingSlip(false);
      setSlipError('');
      setSlipFileName('');
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    if (promotionError) setPromotionError('');
  };

  const handleApplyPromotion = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromotionError('กรุณากรอกรหัสโปรโมชั่น');
      setAppliedPromotion(null);
      return;
    }

    if (subtotal <= 0) {
      setPromotionError('ยังไม่มีรายการที่จะใช้โปรโมชั่นได้');
      setAppliedPromotion(null);
      return;
    }

    const dbPromo = dbPromotions.find(p => p.code === code);
    if (!dbPromo) {
      setPromotionError('ไม่พบโปรโมชั่นนี้');
      setAppliedPromotion(null);
      return;
    }

    // Transform to expected format
    const promotion = {
      code: dbPromo.code,
      name: dbPromo.name,
      description: dbPromo.description,
      type: dbPromo.type,
      value: dbPromo.value,
      maxDiscount: dbPromo.max_discount,
      usageLimit: dbPromo.usage_limit,
      expiresAt: dbPromo.expires_at,
    };

    if (promotion.expiresAt && new Date(promotion.expiresAt) < new Date()) {
      setPromotionError('โปรโมชั่นหมดอายุแล้ว');
      setAppliedPromotion(null);
      return;
    }

    const usageCount = promotionUsage[code] || 0;
    if (promotion.usageLimit && usageCount >= promotion.usageLimit) {
      setPromotionError('คุณใช้สิทธิ์โปรโมชั่นนี้ครบแล้ว');
      setAppliedPromotion(null);
      return;
    }

    const discountValue = calculatePromotionDiscount(subtotal, promotion);
    if (discountValue <= 0) {
      setPromotionError('ยอดสั่งซื้อยังไม่เข้าเงื่อนไขโปรโมชั่น');
      setAppliedPromotion(null);
      return;
    }

    setAppliedPromotion(promotion);
    setPromotionError('');
    showToastMsg(`ใช้โค้ด ${promotion.code} แล้ว`, 'success');
  };

  const handleRemovePromotion = () => {
    setAppliedPromotion(null);
    setPromoInput('');
    setPromotionError('');
    showToastMsg('ลบโปรโมชั่นสำเร็จ', 'delete');
  };

  const handleScanPromotion = () => {
    showToastMsg('ฟีเจอร์สแกน QR โปรโมชั่นกำลังพัฒนา', 'error');
  };

  const createOrderRecord = async (status, method) => {
    const orderId = generateOrderNumber();
    const itemsSnapshot = cart.map(item => ({ ...item }));

    // สร้าง order record สำหรับ Supabase
    const supabaseOrder = {
      id: orderId,
      user_id: currentUser?.id,
      items: itemsSnapshot,
      subtotal,
      discount: promotionDiscount,
      total: finalTotal,
      payment_method: method,
      status,
      promotion: appliedPromotion ? { ...appliedPromotion } : null,
      slip_file_name: slipFileName || null,
    };

    try {
      // บันทึกลง Supabase
      const { error } = await supabase.from('orders').insert([supabaseOrder]);

      if (error) {
        console.error('Error saving order:', error);
        showToastMsg('เกิดข้อผิดพลาดในการบันทึกออเดอร์', 'error');
        return;
      }

      // สร้าง order record สำหรับ local state (รูปแบบเดิม)
      const orderRecord = {
        id: orderId,
        items: itemsSnapshot,
        subtotal,
        discount: promotionDiscount,
        total: finalTotal,
        paymentMethod: method,
        status,
        createdAt: new Date().toISOString(),
        promotion: appliedPromotion ? { ...appliedPromotion } : null,
        slipFileName: slipFileName || null,
      };

      setOrders(prev => [orderRecord, ...prev]);

      if (appliedPromotion) {
        setPromotionUsage(prev => {
          const current = prev[appliedPromotion.code] || 0;
          return { ...prev, [appliedPromotion.code]: current + 1 };
        });
      }

      const getResultMessage = () => {
        if (status === 'paid') return 'ชำระเงินสำเร็จแล้วผ่าน QR Code PromptPay';
        if (status === 'waiting_confirmation') return 'รอการตรวจสอบการชำระเงิน พนักงานจะตรวจสอบสลิปของคุณ';
        return 'รอการชำระเงิน กรุณาติดต่อเคาท์เตอร์แคชเชียร์';
      };

      setPaymentResultMeta({
        order: orderRecord,
        status,
        methodLabel: method === 'cash' ? 'เงินสด' : 'QR PromptPay',
        message: getResultMessage(),
      });

      setShowPaymentFlow(false);
      setShowPaymentResult(true);
      setCart([]);
      setAppliedPromotion(null);
      setPromoInput('');
      setSelectedPaymentMethod(null);
      setSlipFileName('');
      setSlipError('');
      setIsCheckingSlip(false);
    } catch (err) {
      console.error('Error:', err);
      showToastMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleSubmitCashPayment = () => {
    createOrderRecord('waiting_payment', 'cash');
  };

  const handleAttachSlip = (file) => {
    if (!file) return;
    console.log('handleAttachSlip - file:', file);
    // สร้าง preview URL และ แสดง modal
    const previewUrl = URL.createObjectURL(file);
    console.log('handleAttachSlip - previewUrl:', previewUrl);
    setPendingSlipFile(file);
    setSlipPreviewUrl(previewUrl);
    setShowSlipPreview(true);
  };

  const handleConfirmSlip = async () => {
    if (!pendingSlipFile) {
      showToastMsg('ไม่พบไฟล์สลิป กรุณาเลือกใหม่', 'error');
      setShowSlipPreview(false);
      return;
    }

    try {
      const fileExt = pendingSlipFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('slips')
        .upload(filePath, pendingSlipFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showToastMsg('อัพโหลดสลิปไม่สำเร็จ กรุณาลองใหม่', 'error');
        // Don't close the modal so user can retry
        return;
      }

      // Get Public URL
      const { data } = supabase.storage
        .from('slips')
        .getPublicUrl(filePath);

      if (!data || !data.publicUrl) {
        console.error('Failed to get public URL');
        showToastMsg('ไม่สามารถรับ URL สลิปได้ กรุณาลองใหม่', 'error');
        return;
      }

      // Update state with Public URL
      setSlipFileName(data.publicUrl);

      // Close preview modal
      setShowSlipPreview(false);

      // Clean up local preview
      if (slipPreviewUrl) {
        URL.revokeObjectURL(slipPreviewUrl);
      }
      setPendingSlipFile(null);
      setSlipPreviewUrl('');

      showToastMsg('อัพโหลดสลิปสำเร็จ', 'success');
    } catch (error) {
      console.error('Error uploading slip:', error);
      showToastMsg('เกิดข้อผิดพลาดในการอัพโหลดสลิป', 'error');
      // Clean up state to prevent further issues
      setShowSlipPreview(false);
      setPendingSlipFile(null);
      if (slipPreviewUrl) {
        URL.revokeObjectURL(slipPreviewUrl);
      }
      setSlipPreviewUrl('');
    }
  };

  const handleReselectSlip = () => {
    // เปิด file input ใหม่
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleCloseSlipPreview = () => {
    setShowSlipPreview(false);
    if (slipPreviewUrl) {
      URL.revokeObjectURL(slipPreviewUrl);
    }
    setPendingSlipFile(null);
    setSlipPreviewUrl('');
  };

  const handleSubmitPromptPay = () => {
    // ส่งออเดอร์พร้อมสถานะรอตรวจสอบการชำระเงิน
    createOrderRecord('waiting_confirmation', 'promptpay');
  };

  const handleRemoveSlip = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setSlipFileName('');
    setShowDeleteConfirm(false);
    showToastMsg('ลบสลิปสำเร็จ', 'delete');
  };

  const handleRetrySlip = () => {
    setSlipFileName('');
    setSlipError('');
  };

  const handlePaymentResultConfirm = () => {
    if (paymentResultMeta?.order) {
      setFocusedOrder(paymentResultMeta.order);
      setShowOrderDetail(true);
    }
    setShowPaymentResult(false);
    setPaymentResultMeta(null);
  };

  const handleViewOrderDetail = (order) => {
    setFocusedOrder(order);
    setShowOrderDetail(true);
  };

  const handleCloseOrderDetail = () => {
    setShowOrderDetail(false);
    setFocusedOrder(null);
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      // อัพเดท Supabase
      const { error } = await supabase
        .from('orders')
        .update({
          payment_method: updates.paymentMethod,
          status: updates.status,
          slip_file_name: updates.slipFileName !== undefined ? updates.slipFileName : order?.slipFileName,
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        showToastMsg('เกิดข้อผิดพลาดในการอัพเดทออเดอร์', 'error');
        return;
      }

      // อัพเดท local state
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, paymentMethod: updates.paymentMethod, status: updates.status, slipFileName: updates.slipFileName }
          : o
      ));

      // อัพเดท focusedOrder
      setFocusedOrder(prev =>
        prev && prev.id === orderId
          ? { ...prev, paymentMethod: updates.paymentMethod, status: updates.status, slipFileName: updates.slipFileName }
          : prev
      );

      showToastMsg('อัพเดทออเดอร์สำเร็จ', 'success');
    } catch (err) {
      console.error('Error:', err);
      showToastMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  useEffect(() => {
    if (cart.length === 0) {
      setPromoInput('');
      setAppliedPromotion(null);
      setSelectedPaymentMethod(null);
    }
  }, [cart.length]);

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

  const handleOpenNotification = () => {
    // Just open modal, do not mark as read yet
    setShowNotifications(true);
  };

  const handleViewOrderFromNotification = async (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      setFocusedOrder(order);
      setShowOrderDetail(true);

      // 1. Update local state immediately for UI feedback
      setNotifications((prev) => prev.map((n) => (n.order_id === orderId || n.orderId === orderId) ? { ...n, read: true } : n));

      // 2. Update Supabase in background
      // Find notification ID(s) associated with this order
      const targetNotifs = notifications.filter(n => (n.order_id === orderId || n.orderId === orderId) && !n.read);
      const targetIds = targetNotifs.map(n => n.id);

      if (targetIds.length > 0) {
        try {
          await supabase
            .from('notifications')
            .update({ read: true })
            .in('id', targetIds);
        } catch (error) {
          console.error('Error marking notification as read:', error);
        }
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    // เคลียร์การแจ้งเตือนเมื่อออกจากระบบ
    setNotifications([]);
    localStorage.removeItem('cafeAppNotifications');
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
      <PersistentHeader
        title={
          currentPage === 'home'
            ? `สวัสดี, ${currentUser?.name || 'คุณลูกค้า'}`
            : currentPage === 'menu'
              ? 'เมนูของร้าน'
              : currentPage === 'search'
                ? 'ค้นหา'
                : currentPage === 'order'
                  ? 'ออเดอร์ของฉัน'
                  : 'ประวัติออเดอร์'
        }
        scrollProgress={scrollProgress}
        onProfileClick={() => setShowProfile(true)}
        showOrderHistoryButton={currentPage === 'order'}
        onOrderHistoryClick={() => setShowOrderHistory(true)}
        onNotificationClick={() => setShowNotifications(true)}
        notificationCount={notifications.filter((n) => !n.read).length}
        userPhoto={currentUser?.photo}
      />

      {/* Pull to Refresh Indicator */}
      <div
        className={`fixed top-4 left-0 right-0 z-[130] flex justify-center pointer-events-none transition-transform duration-200 ease-out ${isPulling ? '!transition-none' : ''}`}
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)`,
          opacity: pullDistance > 0 ? Math.min(pullDistance / 40, 1) : 0
        }}
      >
        {isRefreshing ? (
          <div className="w-16 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center">
            <BouncingDotsLoader style={{ position: 'relative', paddingTop: 2, paddingBottom: 0 }} />
          </div>
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

        {/* HOME PAGE */}
        <div style={{ display: currentPage === 'home' ? 'block' : 'none' }} className="space-y-12">
          <section>
            <h2 className="text-xl font-black text-[#111827] mb-5 px-1 flex justify-between items-center">ข่าวสารและโปรโมชั่น <ArrowRight size={20} className="text-gray-300" /></h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-[18px] px-[18px]">
              {dbNews.map(n => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNews(n)}
                  className="w-[280px] min-w-[280px] h-48 relative rounded-[32px] overflow-hidden shadow-lg border border-gray-100 bg-white flex-shrink-0 text-left active:scale-[0.98] transition-transform"
                >
                  <CachedImage src={n.image} className="w-full h-full object-cover" alt={n.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                    <h3 className="font-bold text-lg leading-tight">{n.title}</h3>
                    <p className="text-white/70 text-xs mt-1 line-clamp-1">{n.content}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#111827] mb-5 px-1">เมนูแนะนำสำหรับคุณ</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              {dbMenus.filter(m => m.isRecommended).slice(0, 4).map(menu => <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />)}
            </div>
          </section>
        </div>

        {/* MENU PAGE */}
        <div style={{ display: currentPage === 'menu' ? 'block' : 'none' }} className="flex flex-col gap-1">
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
            {['ทั้งหมด', ...dbCategories.map(c => c.name)].map(cat => (
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

        {/* SEARCH PAGE */}
        <div style={{ display: currentPage === 'search' ? 'block' : 'none' }} className="flex flex-col gap-1 h-full">
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
                      {activeGlobalCategory === 'ทั้งหมด' && <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-2 text-gray-400"><Sparkles size={12} /> โปรโมชั่นที่พบ</h3>}
                      {globalSearchResults.promos.map(item => <NewsCard key={`p-${item.id}`} item={item} />)}
                    </div>
                  )}
                  {(activeGlobalCategory === 'ทั้งหมด' || activeGlobalCategory === 'ข่าวสาร') && globalSearchResults.news.length > 0 && (
                    <div className="mb-6">
                      {activeGlobalCategory === 'ทั้งหมด' && <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-2 text-gray-400"><Sparkles size={12} /> ข่าวสารที่พบ</h3>}
                      {globalSearchResults.news.map(item => <NewsCard key={`n-${item.id}`} item={item} />)}
                    </div>
                  )}
                  {(activeGlobalCategory === 'ทั้งหมด' || activeGlobalCategory === 'เมนู') && globalSearchResults.menus.length > 0 && (
                    <div className="mb-12">
                      {activeGlobalCategory === 'ทั้งหมด' && <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-1 flex items-center gap-2 text-gray-400"><Sparkles size={12} /> เมนูที่พบ</h3>}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-8">{globalSearchResults.menus.map(item => <MenuCard key={`m-${item.id}`} menu={item} onSelect={setSelectedMenu} />)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ORDER PAGE */}
        <div style={{ display: currentPage === 'order' ? 'block' : 'none' }} className="space-y-6">
          <div className="sticky top-[18px] z-[150] -mx-[18px] px-[18px] pb-2 bg-transparent pointer-events-none">
            <div className="p-6 rounded-[32px] shadow-xl border pointer-events-auto mt-2 bg-white/80 backdrop-blur-xl space-y-5" style={{ borderColor: '#f3f4f6' }}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">จำนวนสินค้า</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">{cart.length}</span>
                    <span className="text-sm font-bold text-gray-400">รายการ</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">ยอดรวมทั้งสิ้น</p>
                  <div className="flex flex-col items-end">
                    <p className="text-3xl font-black" style={{ color: '#00704A' }}>{formatBaht(finalTotal)}</p>
                    {promotionDiscount > 0 && (
                      <p className="text-[10px] font-bold text-red-500 mt-[-2px]">
                        ประหยัดไป {formatBaht(promotionDiscount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {appliedPromotion && (
                <div className="flex items-center justify-between bg-[#00704A]/10 border border-[#00704A]/20 px-4 py-3 rounded-2xl text-sm text-[#00704A] font-bold">
                  <div>
                    <p className="font-black">ใช้ {appliedPromotion.code}</p>
                    <p className="text-xs text-[#00704A]/70">{appliedPromotion.name}</p>
                  </div>
                  <button onClick={handleRemovePromotion} className="text-xs font-black text-[#00704A] underline">ยกเลิก</button>
                </div>
              )}
              <button
                onClick={handleOpenPaymentFlow}
                disabled={cart.length === 0}
                className={`w-full px-10 py-4 rounded-2xl font-black active:scale-95 transition-transform ${cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'text-white shadow-lg'}`}
                style={cart.length === 0
                  ? { backgroundColor: '#e5e7eb', boxShadow: 'none' }
                  : { backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
              >
                ถัดไป
              </button>
            </div>
          </div>

          {cart.map((item, idx) => (
            <div key={idx} onClick={() => setEditingItem(item)} className="p-2 pr-4 rounded-[32px] flex items-center gap-4 border shadow-sm active:scale-[0.98] transition-all bg-white border-gray-100">
              <img src={item.image} className="w-20 h-20 rounded-[24px] object-cover flex-shrink-0" alt={item.name} />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-base line-clamp-1 text-gray-900 leading-tight">{item.name}</h4>
                <p className="text-xs mt-1 line-clamp-1 text-gray-400">
                  {item.selectedType} {item.selectedAddOns ? `+ ${item.selectedAddOns}` : ''}
                  {item.note && <span className="text-gray-400 font-regular"> + {item.note}</span>}
                </p>
              </div>
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
          {cart.length === 0 && <EmptyState icon={ShoppingBag} title="ไม่มีรายการในออเดอร์ของคุณ" description="เลือกเมนูที่ถูกใจเพิ่มลงในออเดอร์เลย" />}
        </div>
      </main>

      {/* Toast Notification */}
      <ToastNotification
        show={showToast}
        message={toastMessage}
        type={toastType}
        extraClass={toastMessage.includes('สลิป') || showPaymentFlow ? 'bottom-6' : 'bottom-24'}
      />

      {/* Navigation Bar - Fixed at bottom, NO hiding logic */}
      <div className="fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-between gap-3 px-[18px] pb-[18px] pointer-events-none transition-all duration-300 transform translate-y-0 opacity-100">
        <div className="flex-1 backdrop-blur-xl rounded-full flex items-center justify-around p-[2px] border shadow-2xl pointer-events-auto h-[64px]"
          style={{ backgroundColor: alpha('#ffffff', '0.9'), borderColor: alpha('#f3f4f6', '0.5') }}>
          {[{ id: 'home', icon: Coffee, label: 'หน้าร้าน' }, { id: 'menu', icon: LayoutGrid, label: 'เมนู' }, { id: 'order', icon: ShoppingBag, label: 'ออเดอร์' }].map((item) => (
            <button key={item.id} onClick={() => { changePage(item.id); window.scrollTo({ top: 0, behavior: 'instant' }); }} className={`relative flex-1 flex flex-col items-center justify-center h-full rounded-full transition-all duration-300`} style={{ color: currentPage === item.id ? '#00704A' : '#9ca3af' }}>
              {currentPage === item.id && <div className="absolute inset-[2px] rounded-full" style={{ backgroundColor: '#f1f5f9' }} />}
              <item.icon size={22} strokeWidth={currentPage === item.id ? 2.5 : 2} className="relative z-10" />
              <span className="text-[10px] mt-1 font-bold relative z-10">{item.label}</span>
              {item.id === 'order' && cart.length > 0 && <span className="absolute top-0 right-6 text-white text-[10px] font-bold h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full border-2 z-20 shadow-sm" style={{ backgroundColor: '#ef4444', borderColor: '#ffffff' }}>{cart.length}</span>}
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
      <PaymentFlowModal
        visible={showPaymentFlow}
        cart={cart}
        subtotal={subtotal}
        discount={promotionDiscount}
        finalTotal={finalTotal}
        step={paymentStep}
        paymentMethod={selectedPaymentMethod}
        onClose={handleClosePaymentFlow}
        onNext={handlePaymentNext}
        onBack={handlePaymentBack}
        onSelectPayment={handleSelectPaymentMethod}
        promoInput={promoInput}
        onPromoInputChange={handlePromoInputChange}
        onApplyPromotion={handleApplyPromotion}
        appliedPromotion={appliedPromotion}
        onRemovePromotion={handleRemovePromotion}
        onScanPromotion={handleScanPromotion}
        promotionError={promotionError}
        onSubmitCash={handleSubmitCashPayment}
        onSubmitPromptPay={handleSubmitPromptPay}
        onAttachSlip={handleAttachSlip}
        slipFileName={slipFileName}
        isCheckingSlip={isCheckingSlip}
        slipError={slipError}
        onRetrySlip={handleRetrySlip}
        onRemoveSlip={handleRemoveSlip}
      />

      <PaymentResultModal
        visible={showPaymentResult}
        status={paymentResultMeta?.status || 'waiting_payment'}
        orderNumber={paymentResultMeta?.order?.id || ''}
        methodLabel={paymentResultMeta?.methodLabel || ''}
        message={paymentResultMeta?.message || ''}
        onConfirm={handlePaymentResultConfirm}
      />

      <OrderDetailSheet
        visible={showOrderDetail}
        order={focusedOrder}
        onClose={handleCloseOrderDetail}
        onUpdateOrder={handleUpdateOrder}
        showToastMsg={showToastMsg}
      />

      <OrderHistoryModal
        visible={showOrderHistory}
        orders={orders}
        onClose={() => setShowOrderHistory(false)}
        onViewDetail={(order) => {
          setFocusedOrder(order);
          setShowOrderDetail(true);
        }}
      />

      <NotificationModal
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        onOpen={handleOpenNotification}
        onViewOrder={handleViewOrderFromNotification}
      />

      {selectedMenu && <MenuDetailModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} onConfirm={(item) => handleAddToCart(item)} />}

      {editingItem && <MenuDetailModal menu={editingItem} isEditMode={true} onClose={() => setEditingItem(null)} onConfirm={(item) => { handleUpdateCart(item); setEditingItem(null); }} onDelete={() => setDeleteConfirmItem(editingItem)} />}

      {deleteConfirmItem && <DeleteConfirmModal onConfirm={confirmDelete} onCancel={() => setDeleteConfirmItem(null)} />}

      {showLogoutConfirm && <LogoutConfirmModal onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />}

      {selectedNews && <NewsDetailModal news={selectedNews} onClose={() => setSelectedNews(null)} />}

      <SlipPreviewModal
        visible={showSlipPreview}
        imageUrl={slipPreviewUrl}
        fileName={pendingSlipFile?.name || ''}
        onConfirm={handleConfirmSlip}
        onReselect={handleReselectSlip}
        onClose={handleCloseSlipPreview}
      />
      <SlipDeleteConfirmModal
        visible={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showProfile && (
        <div className="fixed inset-0 z-[300] bg-[#fcfcfc] p-[18px] animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-8 mt-0 px-0"><h2 className="text-2xl font-black">โปรไฟล์</h2><button onClick={() => setShowProfile(false)} className="p-2 bg-white border border-[#f3f4f6] rounded-full shadow-sm"><X size={24} /></button></div>
          <div className="rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden mb-10" style={{ backgroundColor: '#1c1c1e' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px]" style={{ backgroundColor: alpha('#00704A', '0.4') }}></div>
            <div className="flex gap-4 items-center mb-10 relative z-10">
              <img src={currentUser?.photo || 'https://via.placeholder.com/64'} className="w-16 h-16 rounded-2xl border border-white/20" alt="profile" />
              <div>
                <h3 className="text-xl font-bold">{currentUser?.name || 'ไม่ระบุชื่อ'}</h3>
                <p className="text-[10px] font-black uppercase mt-1 tracking-widest" style={{ color: '#00704A' }}>{currentUser?.id || '-'}</p>
              </div>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-8 relative z-10">
              <div>
                <p className="text-[10px] font-bold uppercase mb-1 text-gray-400">Point Balance</p>
                <p className="text-3xl font-black">{currentUser?.points || 0} <span className="text-xs font-normal" style={{ color: '#00704A' }}>Pts</span></p>
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
  const [currentUser, setCurrentUser] = useState(null);
  const [globalToast, setGlobalToast] = useState({ show: false, message: '', type: 'success' });

  // ตรวจสอบ localStorage เมื่อเปิดแอป
  useEffect(() => {
    const savedUser = localStorage.getItem('cafeAppUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setAppState('main');
      } catch (e) {
        localStorage.removeItem('cafeAppUser');
      }
    }
  }, []);

  useEffect(() => {
    if (globalToast.show) {
      const timer = setTimeout(() => setGlobalToast(prev => ({ ...prev, show: false })), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalToast.show]);

  const handleLoginSuccess = (userData) => {
    // บันทึกลง localStorage
    localStorage.setItem('cafeAppUser', JSON.stringify(userData));
    setCurrentUser(userData);
    setAppState('main');
  };

  const handleLogout = () => {
    // ลบจาก localStorage
    localStorage.removeItem('cafeAppUser');
    localStorage.removeItem('cafeAppCart');
    setCurrentUser(null);
    setAppState('login');
    setTimeout(() => {
      setGlobalToast({ show: true, message: 'ขอบคุณที่แวะมานะคะ แล้วพบกันใหม่ค่ะ', type: 'logout' });
    }, 300);
  };

  if (appState === 'splash') return (
    <>
      <GlobalStyles />
      <SplashView onFinish={() => {
        const savedUser = localStorage.getItem('cafeAppUser');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setCurrentUser(userData);
            setAppState('main');
          } catch (e) {
            localStorage.removeItem('cafeAppUser');
            setAppState('login');
          }
        } else {
          setAppState('login');
        }
      }} />
    </>
  );

  return (
    <>
      <GlobalStyles />
      {appState === 'login' && <LoginView onLoginSuccess={handleLoginSuccess} />}
      {appState === 'main' && <MainApp onLogout={handleLogout} currentUser={currentUser} />}

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
