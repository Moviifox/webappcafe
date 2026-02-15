import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  showOrderStatusNotification,
} from './pushNotification';
import emailjs from '@emailjs/browser';
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
  Gift,
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
  Bell,
  Smartphone,
  ClipboardClock,
  Package,
  CreditCard,
  PackageCheck,
  CirclePlus,
  CircleMinus
} from 'lucide-react';
import { Html5Qrcode } from "html5-qrcode";

// ฟังก์ชันช่วยจัดการสีโปร่งแสง
const alpha = (hex, opacity) => {
  const alphaMap = {
    '0': '00', '0.05': '0D', '0.1': '1A', '0.2': '33', '0.3': '4D',
    '0.4': '66', '0.5': '80', '0.6': '99', '0.7': 'B3',
    '0.8': 'CC', '0.85': 'D9', '0.9': 'E6', '0.95': 'F2', '1': 'FF'
  };
  return `${hex}${alphaMap[opacity] || 'FF'}`;
};

// --- EmailJS Configuration ---
const EMAILJS_CONFIG = {
  serviceId: 'service_bcqo6ek',
  templateId: 'template_ia3rxs2',
  publicKey: 'fNck5HxD02Ze3frXF'
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

// คำนวณ points ที่จะได้รับจากยอดที่จ่ายจริง (฿50 = 1 point, ปัดเป็นทศนิยม .25)
const calculatePointsFromOrder = (paidAmount) => {
  const rawPoints = paidAmount / 50;
  return Math.floor(rawPoints * 4) / 4; // ปัดเป็น 0.25
};

// คำนวณส่วนลดจาก points (2 points = ฿1, สูงสุด ฿50)
const calculatePointsDiscount = (pointsToUse, availablePoints) => {
  const maxUsablePoints = Math.min(pointsToUse, availablePoints, 100); // max 100 points = ฿50
  return Math.floor(maxUsablePoints / 2); // 2 points = ฿1
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

    /* --- Slide-up animation for modals/sheets --- */
    @keyframes slideInFromBottom {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes zoomIn95 {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-in {
      animation-fill-mode: both;
    }
    .animate-in.slide-in-from-bottom {
      animation: slideInFromBottom 0.3s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .animate-in.fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    .animate-in.zoom-in-95 {
      animation: zoomIn95 0.5s ease-out;
    }
    .duration-200 { animation-duration: 0.2s; }
    .duration-300 { animation-duration: 0.3s; }
    .duration-500 { animation-duration: 0.5s; }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out both;
    }
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
const PersistentHeader = React.memo(({ title, scrollProgress, onProfileClick, showOrderHistoryButton, onOrderHistoryClick, onNotificationClick, notificationCount, userPhoto, showBackButton, onBack }) => (
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
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        {showBackButton && (
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-600 active:scale-95 transition-transform flex-shrink-0"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}
        <h1 className="text-[26px] font-black tracking-tight text-gray-900 line-clamp-1 pr-4">{title}</h1>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
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

  // 2. Compute display src synchronously — no useEffect delay
  const displaySrc = useMemo(() => {
    if (!src) return src;
    return imageCache.get(src) || src;
  }, [src]);

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
              <span className="text-[20px] font-extra-thick text-red-500">฿{displayPrice - menu.discount}</span>
              <span className="text-[12px] text-gray-400 line-through">฿{displayPrice}</span>
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
const MenuDetailModal = ({ menu: propMenu, isEditMode, onClose, onConfirm, onDelete }) => {
  const [cachedMenu, setCachedMenu] = useState(propMenu);
  const isOpen = !!propMenu;

  useEffect(() => {
    if (propMenu) {
      setCachedMenu(propMenu);
    }
  }, [propMenu]);

  const menu = propMenu || cachedMenu;
  const safeMenu = menu || { typeOptions: [{ label: '', price: 0 }], addOns: [], categories: [] };

  const initialType = useMemo(() => {
    if (isEditMode && safeMenu.selectedType) {
      return safeMenu.typeOptions.find(t => t.label === safeMenu.selectedType) || safeMenu.typeOptions[0];
    }
    return safeMenu.typeOptions[0];
  }, [safeMenu, isEditMode]);

  const initialAddOns = useMemo(() => {
    if (isEditMode && safeMenu.selectedAddOns) {
      const labels = safeMenu.selectedAddOns.split(', ');
      return safeMenu.addOns.filter(a => labels.includes(a.label));
    }
    return [];
  }, [safeMenu, isEditMode]);

  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedAddOns, setSelectedAddOns] = useState(initialAddOns);
  const [note, setNote] = useState(safeMenu.note || '');

  useEffect(() => {
    if (propMenu) {
      const type = isEditMode && propMenu.selectedType
        ? propMenu.typeOptions.find(t => t.label === propMenu.selectedType) || propMenu.typeOptions[0]
        : propMenu.typeOptions[0];
      const addOns = isEditMode && propMenu.selectedAddOns
        ? propMenu.addOns.filter(a => propMenu.selectedAddOns.split(', ').includes(a.label))
        : [];
      setSelectedType(type);
      setSelectedAddOns(addOns);
      setNote(propMenu.note || '');
    }
  }, [propMenu]);

  const finalPrice = useMemo(() => {
    const addOnTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    const basePrice = (selectedType?.price || 0) + addOnTotal;
    return safeMenu.discount > 0 ? basePrice - safeMenu.discount : basePrice;
  }, [selectedType, selectedAddOns, safeMenu.discount]);

  const originalPrice = useMemo(() => {
    const addOnTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    return (selectedType?.price || 0) + addOnTotal;
  }, [selectedType, selectedAddOns]);

  const toggleAddOn = (addon) => {
    if (selectedAddOns.some(item => item.label === addon.label)) {
      setSelectedAddOns(selectedAddOns.filter(item => item.label !== addon.label));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const shouldShowTypeSelection = safeMenu.typeOptions && safeMenu.typeOptions[0]?.label !== "ไม่มีตัวเลือก";

  if (!menu && !isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[200] backdrop-blur-sm flex items-end justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-[201] pointer-events-none flex items-end justify-center`}>
        <div className={`bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] max-h-[90vh] flex flex-col transition-transform duration-200 ease-out transform ${isOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}>
          <div className="relative h-64 flex-shrink-0">
            <CachedImage key={safeMenu.image} src={safeMenu.image} className="w-full h-full object-cover" alt={safeMenu.name} />
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 to-transparent"></div>
            {safeMenu.isRecommended && (
              <div className="absolute top-6 left-6 backdrop-blur-md text-white text-[14px] pl-[14px] pr-[10px] pt-[6px] pb-[5px] rounded-2xl font-bold shadow-sm z-10 uppercase tracking-wider" style={{ backgroundColor: alpha('#00704A', '0.85') }}>
                เมนูแนะนำ ✨
              </div>
            )}
            <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 active:scale-90 transition-transform" style={{ backgroundColor: alpha('#ffffff', '0.2') }}><X size={20} /></button>
          </div>
          <div className="p-8 overflow-y-auto no-scrollbar flex-1 pb-32">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">{safeMenu.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(safeMenu.categories || [])
                    .filter(cat => cat !== 'แนะนำ')
                    .map((cat, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-bold uppercase tracking-wider border border-gray-200/50">
                        {cat}
                      </span>
                    ))}
                </div>
              </div>
              {safeMenu.discount > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">฿{originalPrice}</span>
                  <span className="text-sm font-bold text-red-500">ลด ฿{safeMenu.discount}</span>
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
                    {safeMenu.typeOptions.map((type, idx) => (
                      <button key={idx} onClick={() => setSelectedType(type)}
                        className="flex-1 min-w-[80px] py-3 px-2 rounded-2xl text-sm font-bold border-2 transition-all"
                        style={{
                          backgroundColor: selectedType?.label === type.label ? alpha('#00704A', '0.1') : '#ffffff',
                          borderColor: selectedType?.label === type.label ? '#00704A' : '#f3f4f6',
                          color: selectedType?.label === type.label ? '#00704A' : '#9ca3af'
                        }}
                      >
                        {type.label}<span className="block text-[10px] opacity-60 font-normal">฿{type.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {safeMenu.addOns && safeMenu.addOns.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">เพิ่มเติม (Add-on)</label>
                  <div className="space-y-2">
                    {safeMenu.addOns.map((addon, idx) => {
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
    </>
  );
};

// --- QR SCANNER MODAL ---
const QRScannerModal = ({ visible, onClose, onScan }) => {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode;

    const startScanning = async () => {
      if (visible && !scanning) {
        try {
          html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
              // Success callback
              onScan(decodedText);
              // Stop scanning immediately after success
              if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  html5QrCode.clear();
                  setScanning(false);
                }).catch(err => console.error("Failed to stop scanner", err));
              }
            },
            (errorMessage) => {
              // Error callback - ignore frame parse errors
              // console.log(errorMessage);
            }
          );
          setScanning(true);
          setError('');
        } catch (err) {
          console.error("Error starting scanner:", err);
          setError('ไม่สามารถเปิดเมนูได้ กรุณาอนุญาตการใช้งานกล้อง');
          setScanning(false);
        }
      }
    };

    if (visible) {
      setTimeout(startScanning, 300); // Small delay to ensuring DOM is ready
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current.clear();
        }).catch(err => console.error("Cleanup error", err));
      }
    };
  }, [visible]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[400] bg-[#fcfcfc]/20 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-[401] pointer-events-none flex items-center justify-center p-4`}>
        <div
          className={`w-full max-w-sm bg-white rounded-[32px] border border-gray-200 overflow-hidden shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${visible ? 'scale-100 pointer-events-auto' : 'scale-90 pointer-events-none'}`}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-100">
            <h3 className="font-black text-gray-900 ml-2">สแกน QR Code</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
              <X size={20} />
            </button>
          </div>

          <div className="relative bg-black w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
            <div id="reader" className="w-full h-full"></div>
            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                <Loader2 className="animate-spin" size={32} />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertTriangle size={48} className="mb-4 text-red-500" />
                <p className="font-bold">{error}</p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold text-sm"
                >
                  ปิด
                </button>
              </div>
            )}
            <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
              <div className="absolute inset-0 rounded-lg"></div>
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00704A] -mt-1 -ml-1 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00704A] -mt-1 -mr-1 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00704A] -mb-1 -ml-1 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00704A] -mb-1 -mr-1 rounded-br-lg"></div>
            </div>
          </div>

          <div className="p-6 text-center">
            <p className="text-gray-500 font-bold text-sm">สแกน QR Code โปรโมชั่น</p>
            <p className="text-xs text-gray-400 mt-1">วางโค้ดให้อยู่ในกรอบสี่เหลี่ยม</p>
          </div>
        </div>
      </div>
    </>
  );
};

// --- DELETE CONFIRMATION MODAL ---
const DeleteConfirmModal = ({ visible, onConfirm, onCancel }) => (
  <div className={`fixed inset-0 z-[300] backdrop-blur-sm flex items-end justify-center p-6 transition-all duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
    <div className={`bg-white rounded-[32px] p-8 pb-6 w-full max-w-sm shadow-2xl text-center border transition-transform duration-300 ease-out transform ${visible ? 'translate-y-0 scale-100' : 'translate-y-10 scale-95'}`} style={{ borderColor: '#f3f4f6' }}>
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
const LogoutConfirmModal = ({ visible, onConfirm, onCancel }) => (
  <div className={`fixed inset-0 z-[350] backdrop-blur-sm flex items-center justify-center p-6 transition-all duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
    <div className={`bg-white rounded-[32px] p-8 pb-6 w-full max-w-sm shadow-2xl text-center border transition-transform duration-300 ease-out transform ${visible ? 'scale-100' : 'scale-90'}`} style={{ borderColor: '#f3f4f6' }}>
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
        <LogOut size={36} strokeWidth={2} className="ml-1" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการออกจากระบบ?</h3>
      <p className="text-gray-500 text-sm leading-relaxed font-medium">คุณต้องการออกจากระบบใช่หรือไม่</p>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">การออกจากระบบส่งผลให้เมนูในออเดอร์ของคุณถูกลบ</p>
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
  // Points props
  userPoints,
  pointsToRedeem,
  onPointsChange,
  pointsDiscount,
  pointsToEarn,
  orderNumber,
}) => {
  const fileInputRef = useRef(null);
  const [showImageViewer, setShowImageViewer] = useState(false);

  // if (!visible) return null; // Removed for animation

  const titleMap = {
    selection: 'สรุปออเดอร์และชำระเงิน',
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
    const displayOrderNumber = orderNumber || Math.floor(Math.random() * 9000) + 1000;
    const fileName = `qr-${displayOrderNumber}.png`;

    const downloadOrShare = async (blob) => {
      const file = new File([blob], fileName, { type: 'image/png' });

      // Mobile: use Web Share to save to Photos (if supported)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          if (err.name !== 'AbortError') console.error('Share failed', err);
        }
      } else {
        // Desktop: download file
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }
    };

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Updated resolution to 800x1160 (2x of previous 400x580)
      canvas.width = 800;
      canvas.height = 1160;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header bar
      ctx.fillStyle = '#00704A';
      ctx.fillRect(0, 0, canvas.width, 140); // 70 * 2
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 36px Foxgraphie, sans-serif'; // 18px * 2
      ctx.textAlign = 'center';
      ctx.fillText(`ชำระเงินผ่าน PromptPay #${displayOrderNumber}`, 400, 84); // (200, 42) * 2

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
      // Increased size to 500x500 for better resolution on larger canvas
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(promptPayData)}`;

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
        // Scaled position and size: 100->200, 90->180, 200->400
        ctx.drawImage(qrImg, 200, 180, 400, 400);
      }

      // Payment details section
      ctx.fillStyle = '#f3f4f6';
      // Scaled: 30->60, 320->640, 340->680, 140->280
      // Draw rounded rectangle
      const x = 60, y = 640, w = 680, h = 280, r = 32; // radius 16 * 2 = 32
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#6b7280';
      ctx.font = '400 28px Foxgraphie, sans-serif'; // 14px * 2
      ctx.textAlign = 'center';
      ctx.fillText('ยอดชำระทั้งสิ้น', 400, 720); // (200, 360) * 2

      ctx.fillStyle = '#00704A';
      ctx.font = '700 80px Foxgraphie, sans-serif'; // 40px * 2
      ctx.fillText(`฿${finalTotal.toLocaleString()}`, 400, 820); // (200, 410) * 2

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 26px Foxgraphie, sans-serif'; // 13px * 2
      ctx.fillText(`${cart.length} รายการ`, 400, 880); // (200, 440) * 2

      ctx.font = '400 24px Foxgraphie, sans-serif'; // 12px * 2
      ctx.fillText('สแกนด้วยแอปธนาคารเพื่อชำระเงิน', 400, 1000); // (200, 500) * 2

      // Load and draw icon
      const iconImg = new Image();
      let iconLoaded = false;
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('timeout')), 3000);
          iconImg.crossOrigin = 'anonymous'; // Fix CORS for external image
          iconImg.onload = () => { clearTimeout(timeout); iconLoaded = true; resolve(); };
          iconImg.onerror = () => { clearTimeout(timeout); reject(new Error('error')); };
          iconImg.src = 'https://raw.githubusercontent.com/Moviifox/webappcafe/refs/heads/main/public/qr_slip.svg';
        });
      } catch {
        iconLoaded = false;
      }

      // App name with icon
      const appName = 'My Cafe';
      ctx.fillStyle = '#00704A';
      ctx.font = '700 40px Foxgraphie, sans-serif'; // 20px * 2
      const textWidth = ctx.measureText(appName).width;

      if (iconLoaded) {
        const iconSize = 56; // 28 * 2
        const totalWidth = iconSize + 16 + textWidth; // spacing 8 * 2 = 16
        const startX = (800 - totalWidth) / 2;
        // y: 517 * 2 = 1034
        ctx.drawImage(iconImg, startX, 1034, iconSize, iconSize);
        ctx.textAlign = 'left';
        // y: 540 * 2 = 1080
        ctx.fillText(appName, startX + iconSize + 16, 1080);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText('☕ ' + appName, 400, 1080);
      }

      // Get blob
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('Canvas toBlob failed');

      await downloadOrShare(blob);

    } catch (e) {
      console.error('Canvas generation failed, trying fallback download...', e);
      try {
        // Fallback: fetch promptpay.io image directly
        const fallbackUrl = qrUrl + '.png'; // e.g. https://promptpay.io/.../100.png
        const response = await fetch(fallbackUrl);
        if (!response.ok) throw new Error('Fetch failed');
        const blob = await response.blob();
        await downloadOrShare(blob);
      } catch (err2) {
        console.error('Fallback download failed', err2);
        window.open(qrUrl + '.png', '_blank');
      }
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[320] flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
      />
      <div className={`fixed inset-0 z-[321] pointer-events-none flex items-end justify-center`}>
        <div
          className={`w-full max-w-md bg-white rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] flex flex-col h-[90vh] transition-transform duration-200 ease-out transform ${visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
        >
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
                  <PaymentSummaryRow label="ยอดรวม" value={formatBaht(subtotal)} highlight />
                  <PaymentSummaryRow label="ส่วนลด" value={`- ${formatBaht(discount)}`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">ชำระทั้งสิ้น</p>
                      <p className="text-4xl font-bold text-[#00704A]">{formatBaht(finalTotal)}</p>
                    </div>
                    <CircleDollarSign size={32} className="text-[#00704A]" />
                  </div>
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

                {/* Points Redemption Section */}
                {userPoints > 0 && (
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">ใช้ Point แลกส่วนลด</label>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-600">Point ของคุณ</span>
                        <span className="text-lg font-black text-[#00704A]">{userPoints.toFixed(2)} pts</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-500">ใช้ points</span>
                          <span className="font-bold text-gray-800">{pointsToRedeem} pts</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.min(userPoints, 100)}
                          step="2"
                          value={pointsToRedeem}
                          onChange={(e) => onPointsChange(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00704A]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>0</span>
                          <span>{Math.min(userPoints, 100)} pts (สูงสุด ฿50)</span>
                        </div>
                      </div>
                      {pointsToRedeem > 0 && (
                        <div className="flex items-center justify-between bg-[#00704A]/10 border border-[#00704A]/20 px-4 py-3 rounded-2xl">
                          <span className="text-sm font-bold text-[#00704A]">ส่วนลดจาก Points</span>
                          <span className="text-lg font-black text-[#00704A]">- ฿{pointsDiscount}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center">2 points = ฿1 | สูงสุด 100 points (฿50) ต่อออเดอร์</p>
                  </div>
                )}

                {/* Points to Earn Preview */}
                {pointsToEarn > 0 && (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">⭐</span>
                      <span className="text-sm font-bold text-amber-700">จะได้รับ</span>
                    </div>
                    <span className="text-lg font-black text-amber-600">+{pointsToEarn.toFixed(2)} pts</span>
                  </div>
                )}

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
    </>
  );
};

const PaymentResultModal = ({ visible, status, orderNumber, methodLabel, message, onConfirm }) => {
  const [cachedData, setCachedData] = useState({ status, orderNumber, methodLabel, message });

  useEffect(() => {
    if (visible) {
      setCachedData({ status, orderNumber, methodLabel, message });
    }
  }, [visible, status, orderNumber, methodLabel, message]);

  const { status: currentStatus, orderNumber: currentOrderNumber, methodLabel: currentMethodLabel, message: currentMessage } = visible ? { status, orderNumber, methodLabel, message } : cachedData;
  const isSuccess = currentStatus === 'paid';

  return (
    <div className={`fixed inset-0 z-[330] flex items-center justify-center p-6 transition-all duration-300 ${visible ? 'bg-black/40 backdrop-blur-sm opacity-100 pointer-events-auto' : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'}`}>
      <div
        className={`w-full max-w-sm bg-white rounded-[36px] p-8 text-center shadow-2xl space-y-5 border transition-transform duration-300 ease-out transform ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}
        style={{ borderColor: '#f3f4f6' }}
      >
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
          {isSuccess ? <Check size={36} strokeWidth={3} /> : <Receipt size={36} strokeWidth={2.5} />}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-gray-900">ออเดอร์ของคุณเลขที่ {currentOrderNumber}</h3>
          <p className="text-sm font-bold text-gray-500 leading-relaxed">{currentMessage}</p>
          <p className="text-xs uppercase tracking-widest text-gray-400 font-black">วิธีการชำระเงิน: {currentMethodLabel}</p>
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
  return (
    <div
      className={`fixed inset-0 z-[600] flex items-center justify-center backdrop-blur-md p-6 transition-all duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
      style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
    >
      <div
        className={`relative w-full max-w-md h-full flex flex-col items-center justify-center gap-6 transition-transform duration-300 ease-out transform ${visible ? 'scale-100' : 'scale-90'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full flex justify-end">
          <button onClick={onClose} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
            <X size={28} />
          </button>
        </div>
        <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-[#f3f4f6] flex items-center justify-center bg-black/10">
          <img src={imageUrl} alt="Slip Full View" className="w-full h-full object-contain" />
        </div>

      </div>
    </div>
  );
};

// --- SLIP PREVIEW MODAL ---
const SlipPreviewModal = ({ visible, imageUrl, fileName, onConfirm, onReselect, onClose }) => {
  const [cachedData, setCachedData] = useState({ imageUrl, fileName });

  useEffect(() => {
    if (visible) {
      setCachedData({ imageUrl, fileName });
    }
  }, [visible, imageUrl, fileName]);

  const { imageUrl: currentImageUrl, fileName: currentFileName } = visible ? { imageUrl, fileName } : cachedData;

  console.log('SlipPreviewModal - visible:', visible, 'imageUrl:', currentImageUrl, 'fileName:', currentFileName);
  return (
    <div
      className={`fixed inset-0 z-[350] flex items-center justify-center backdrop-blur-sm p-6 transition-all duration-300 ${visible ? 'bg-black/20 opacity-100 pointer-events-auto' : 'bg-transparent opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: visible ? 'rgba(252,252,252,0.2)' : 'transparent' }}
    >
      <div
        className={`w-full max-w-md bg-white rounded-[36px] shadow-2xl overflow-hidden border transition-transform duration-300 ease-out transform ${visible ? 'translate-y-0 scale-100' : 'translate-y-10 scale-95'}`}
        style={{ borderColor: '#f3f4f6' }}
      >
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

          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-8 h-8 rounded-full bg-[#00704A] flex items-center justify-center text-white">
              <Check size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-bold">ไฟล์ที่แนบ</p>
              <p className="text-sm font-black text-gray-700 truncate">{fileName}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onReselect}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-black text-sm active:scale-95 transition-transform"
          >
            เลือกใหม่
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] py-4 rounded-2xl bg-[#00704A] text-white font-black text-sm shadow-xl shadow-[#00704A]/20 active:scale-95 transition-transform"
          >
            ยืนยันการโอนเงิน
          </button>
        </div>
      </div>
    </div>
  );
};

const SlipDeleteConfirmModal = ({ visible, onConfirm, onCancel }) => {
  return (
    <div className={`fixed inset-0 z-[360] backdrop-blur-sm flex items-center justify-center p-6 transition-all duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}>
      <div className={`bg-white rounded-[32px] p-8 pb-6 w-full max-w-sm shadow-2xl text-center border transition-transform duration-300 ease-out transform ${visible ? 'scale-100' : 'scale-90'}`} style={{ borderColor: '#f3f4f6' }}>
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

// --- RECEIPT MODAL ---
const ReceiptModal = ({ visible, order, onClose }) => {
  if (!order) return null;

  return (
    <div
      className={`fixed inset-0 z-[400] flex items-center justify-center backdrop-blur-sm p-6 transition-all duration-300 ${visible ? 'bg-[#fcfcfc]/50 opacity-100 pointer-events-auto' : 'bg-transparent opacity-0 pointer-events-none'}`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-[350px] bg-white border border-gray-200 rounded-none shadow-2xl overflow-hidden transition-transform duration-300 ease-out transform ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Receipt Header */}
        <div className="p-6 text-center border-b border-dashed border-gray-300 bg-gray-50">
          <div className="w-12 h-12 bg-[#00704A] text-white rounded-full flex items-center justify-center mx-auto mb-3">
            <img src="https://raw.githubusercontent.com/Moviifox/webappcafe/refs/heads/main/public/qr_slip.svg" alt="Icon" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 uppercase tracking-widest">ใบเสร็จรับเงิน</h2>
          <p className="text-xs text-gray-500 font-bold mt-1">CAFE APP</p>
          <p className="text-[10px] text-gray-400 mt-2">{formatDateTime(order.createdAt)}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4 bg-white">
          <div className="flex justify-between items-end border-b border-dashed border-gray-200 pb-3">
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase">Order No.</p>
              <p className="text-sm font-bold text-gray-900">#{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase">Customer</p>
              <p className="text-sm font-bold text-gray-900 line-clamp-1">{MOCK_DATA.user.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs font-bold text-gray-700">
                <div className="flex-1">
                  <p>{item.name}</p>
                  <p className="text-[10px] text-gray-500 font-normal">
                    {item.selectedType}
                    {item.selectedAddOns && ` + ${item.selectedAddOns}`}
                  </p>
                  {item.note && <p className="text-[10px] text-gray-400 font-normal">หมายเหตุ: {item.note}</p>}
                </div>
                <div className="flex-shrink-0 ml-4">{formatBaht(item.price)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>ยอดรวม</span>
              <span>{formatBaht(order.subtotal)}</span>
            </div>
            {(() => {
              const totalDiscount = order.discount || 0;
              const pointsDiscount = order.promotion?.points_discount || 0;
              const codeDiscount = Math.max(0, totalDiscount - pointsDiscount);

              return (
                <>
                  {codeDiscount > 0 && (
                    <div className="flex justify-between text-xs text-[#00704A]">
                      <span>#ส่วนลดโปรโมชั่น {order.promotion?.code ? `(${order.promotion.code})` : ''}</span>
                      <span>-{formatBaht(codeDiscount)}</span>
                    </div>
                  )}
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-xs text-[#00704A]">
                      <span>#ส่วนลดจาก Point</span>
                      <span>-{formatBaht(pointsDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-[#00704A]">
                    <span>ส่วนลดทั้งหมด</span>
                    <span>{totalDiscount > 0 ? `-${formatBaht(totalDiscount)}` : formatBaht(0)}</span>
                  </div>
                </>
              );
            })()}
            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-dashed border-gray-200 mt-2">
              <span>ยอดสุทธิ</span>
              <span>{formatBaht(order.total)}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">ชำระโดย</p>
            <p className="text-xs font-bold text-gray-900 mt-0.5">
              {order.paymentMethod === 'cash' ? 'เงินสด (Cash)' : 'สแกนจ่าย (PromptPay)'}
            </p>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="p-4 bg-gray-900 text-white text-center">
          <p className="text-[10px] text-white/60 mb-3">ขอบคุณที่ใช้บริการ</p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-white text-gray-900 text-xs font-bold active:scale-95 transition-transform"
          >
            ปิด
          </button>
        </div>

        {/* Decorative jagged edge at bottom */}
        <div
          className="h-4 w-full bg-gray-900 relative"
          style={{
            marginTop: '-1px',
            background: 'linear-gradient(135deg, transparent 75%, #111827 75%) 0 50%, linear-gradient(-135deg, transparent 75%, #111827 75%) 0 50%',
            backgroundSize: '10px 10px, 10px 10px',
            backgroundRepeat: 'repeat-x',
            transform: 'rotate(180deg)'
          }}
        />
      </div>
    </div>
  );
};

const OrderDetailSheet = ({ order, visible, onClose, onUpdateOrder, showToastMsg, pointTransactions = [] }) => {
  const [cachedOrder, setCachedOrder] = useState(order);
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
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (visible && order) {
      setCachedOrder(order);
      setPaymentMethod(order.paymentMethod || 'cash');
      setSlipFileName(order.slipFileName || '');
      setIsEditing(false);
      // Reset other ephemeral states when opening/switching order
      setShowSlipPreview(false);
      setPendingSlipFile(null);
      setSlipPreviewUrl('');
      setShowDeleteConfirm(false);
      setShowImageViewer(false);
      setShowReceipt(false);
    }
  }, [visible, order]);

  const activeOrder = visible ? order : cachedOrder;

  if (!activeOrder) return null;

  // Use activeOrder for logic below
  const canEditPayment = activeOrder?.status === 'waiting_payment' || activeOrder?.status === 'waiting_confirmation';

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
        await onUpdateOrder(activeOrder.id, {
          paymentMethod: activeOrder.paymentMethod,
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
      await onUpdateOrder(activeOrder.id, {
        paymentMethod: activeOrder.paymentMethod,
        status: activeOrder.status,
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
      link.href = `https://promptpay.io/0619961130/${activeOrder.total}`;
      link.download = `promptpay_${activeOrder.id}.png`;
      link.click();
    } catch (err) {
      console.error('Error saving QR:', err);
    }
  };

  const handleConfirmPayment = async () => {
    if (onUpdateOrder) {
      // เปลี่ยนสถานะตามวิธีชำระเงิน
      const newStatus = paymentMethod === 'cash' ? 'waiting_payment' : 'waiting_confirmation';
      await onUpdateOrder(activeOrder.id, {
        paymentMethod: paymentMethod,
        status: newStatus,
        slipFileName: slipFileName || null,
      });
    }
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[340] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(252,252,252,0.0)' }}
      />
      <div className={`fixed inset-0 z-[341] pointer-events-none flex items-end justify-center`}>
        <div className={`w-full max-w-md h-[90vh] bg-white rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl transition-transform duration-200 ease-out transform ${visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}>
          <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
            <StatusPill status={activeOrder.status} />
            <h3 className="text-lg font-black text-gray-900 mt-[-2px]">รายละเอียดออเดอร์</h3>
            <button onClick={onClose} className="w-10 h-10 mt-[-4px] rounded-full border border-gray-200 flex items-center justify-center text-gray-500 active:scale-95 transition-transform">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-5 flex-1 overflow-y-auto no-scrollbar pb-10">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400 font-black">เลขที่ออเดอร์</p>
              <p className="text-xl font-black text-gray-900">{activeOrder.id}</p>
              <p className="text-xs text-gray-400">สร้างเมื่อ {formatDateTime(activeOrder.createdAt)}</p>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 space-y-3">
              {(activeOrder.items || []).map((item, idx) => (
                <div key={item.cartId || idx} className="flex flex-col gap-1 border-b border-gray-100/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between gap-4 text-sm font-bold text-gray-700">
                    <span className="line-clamp-1 flex-1">{item.name}</span>
                    <span className="flex-shrink-0">{formatBaht(item.price)}</span>
                  </div>
                  <div className="text-xs text-gray-500 font-normal pl-2 border-l-2 border-gray-200">
                    <p>{item.selectedType} {item.selectedAddOns ? `+ ${item.selectedAddOns}` : ''}</p>
                    {item.note && <p className="text-gray-400">หมายเหตุ: {item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <PaymentSummaryRow label="ยอดรวม" value={formatBaht(activeOrder.subtotal)} />
              <PaymentSummaryRow label="ส่วนลด" value={`- ${formatBaht(activeOrder.discount)}`} />
              <PaymentSummaryRow label="ชำระทั้งสิ้น" value={formatBaht(activeOrder.total)} highlight />
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
                    {activeOrder.paymentMethod === 'cash' ? 'เงินสด' : 'QR PromptPay'}
                  </p>

                  {/* แสดง QR code โดยอัตโนมัติสำหรับ PromptPay ที่ยังรอชำระ */}
                  {activeOrder.paymentMethod === 'promptpay' && canEditPayment && (
                    <div className="rounded-3xl border border-gray-100 bg-gray-50/80 p-5 flex flex-col items-center gap-4 mt-3">
                      <div className="w-44 h-44 rounded-3xl bg-white border-4 border-gray-100 flex items-center justify-center overflow-hidden">
                        <img
                          src={`https://promptpay.io/0619961130/${activeOrder.total}`}
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

              {/* Promotion & Points Details */}
              {/* Promotion & Points Details */}
              {/* Promotion & Points Details */}
              {(() => {
                const earnedTx = pointTransactions?.find(tx => tx.order_id === activeOrder.id && tx.type === 'earn');
                const showPromo = activeOrder.promotion?.code || activeOrder.promotion?.points_used > 0;
                const showEarned = (activeOrder.status === 'paid' || activeOrder.status === 'completed') && earnedTx;

                if (!showPromo && !showEarned) return null;

                return (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {activeOrder.promotion?.code && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">โปรโมชั่นที่ใช้</span>
                        <span className="text-sm font-black text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                          {activeOrder.promotion.code}
                        </span>
                      </div>
                    )}

                    {activeOrder.promotion?.points_used > 0 && (
                      <div className="flex justify-between items-center text-[#00704A]">
                        <span className="text-sm font-bold">ใช้ {activeOrder.promotion.points_used} Point</span>
                        <span className="text-sm font-black">-฿{activeOrder.promotion.points_discount?.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Points Earned */}
                    {showEarned && (
                      <div className="flex justify-between items-center text-[#f59e0b]">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold">ได้รับ Point</span>
                        </div>
                        <span className="text-[10px] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded text-[#f59e0b] font-bold">
                          +{earnedTx.points.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* แสดงสลิปสำหรับออเดอร์ที่สำเร็จแล้ว */}
              {(activeOrder.slip_file_name || activeOrder.slipFileName) && !canEditPayment && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-600 mb-3">หลักฐานการชำระเงิน</p>
                  <div
                    className="rounded-2xl overflow-hidden border border-gray-200 cursor-pointer active:scale-[0.99] transition-transform"
                    onClick={() => setShowImageViewer(true)}
                  >
                    <img
                      src={activeOrder.slip_file_name || activeOrder.slipFileName}
                      alt="Slip"
                      className="w-full h-auto max-h-[300px] object-contain bg-gray-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* View Receipt Button */}
            {(activeOrder.status === 'paid' || activeOrder.status === 'completed') && (
              <button
                onClick={() => setShowReceipt(true)}
                className="w-full py-4 rounded-2xl border-2 border-[#00704A] text-[#00704A] font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Receipt size={18} />
                ดูใบเสร็จ
              </button>
            )}
          </div>

        </div>

        <ImageViewerModal
          visible={showImageViewer}
          imageUrl={slipFileName || activeOrder.slip_file_name || activeOrder.slipFileName}
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

        <ReceiptModal
          visible={showReceipt}
          order={activeOrder}
          onClose={() => setShowReceipt(false)}
        />
      </div>

    </>
  );
};

// --- ORDER HISTORY MODAL ---
const OrderHistoryModal = ({ orders, visible, onClose, onViewDetail }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) setSearchQuery('');
  }, [visible]);

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.trim().toLowerCase();
    return orders.filter(order => {
      // Search by order ID
      if (String(order.id).toLowerCase().includes(q)) return true;
      // Search by item names
      if ((order.items || []).some(item => item.name?.toLowerCase().includes(q))) return true;
      // Search by payment method
      const payLabel = order.paymentMethod === 'cash' ? 'เงินสด' : 'promptpay';
      if (payLabel.includes(q)) return true;
      // Search by status label
      const statusMeta = ORDER_STATUS_META[order.status];
      if (statusMeta?.label?.toLowerCase().includes(q)) return true;
      // Search by total amount
      if (String(order.total).includes(q)) return true;
      return false;
    });
  }, [orders, searchQuery]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(252,252,252,0.0)' }}
        onClick={onClose}
      />
      <div className={`fixed inset-0 z-[201] pointer-events-none flex items-end justify-center`}>
        <div
          className={`bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] h-[90vh] flex flex-col transition-transform duration-200 ease-out transform ${visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
        >
          <div className="relative h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-100">
            <div className="w-10" />
            <h2 className="text-lg font-black text-gray-900">ประวัติออเดอร์</h2>
            <button onClick={onClose} className="w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 border border-gray-200 active:scale-90 transition-transform">
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          {orders.length > 0 && (
            <div className="px-6 pt-4 pb-1 flex-shrink-0">
              <div className="relative flex items-center bg-[#fcfcfc] rounded-2xl px-4 h-[46px] border border-[#f3f4f6]">
                <Search size={18} className="text-gray-400 flex-shrink-0 mr-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาออเดอร์..."
                  className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-800 placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                    className="ml-2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 active:scale-90 transition-transform"
                  >
                    <X size={14} className="text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="p-6 overflow-y-auto no-scrollbar flex-1 pb-8">
            {orders.length === 0 ? (
              <EmptyState icon={History} title="ยังไม่มีประวัติออเดอร์" description="เมื่อคุณสั่งซื้อเสร็จสิ้น ประวัติออเดอร์จะแสดงที่นี่" />
            ) : filteredOrders.length === 0 ? (
              <EmptyState icon={Search} title="ไม่พบออเดอร์" description={`ไม่พบผลลัพธ์สำหรับ "${searchQuery}"`} />
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => (
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
    </>
  );
};

// --- POINTS HISTORY MODAL ---
const PointsHistoryModal = ({ visible, userPoints, transactions, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 z-[301] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
      />
      <div className={`fixed inset-0 z-[302] pointer-events-none flex items-end justify-center`}>
        <div
          className={`bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] h-[90vh] flex flex-col transition-transform duration-200 ease-out transform ${visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
        >
          <div className="relative h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-gray-100">
            <div className="w-10" />
            <h2 className="text-lg font-black text-gray-900">Point ของคุณ</h2>
            <button onClick={onClose} className="w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center text-gray-500 border border-gray-200 active:scale-90 transition-transform">
              <X size={20} />
            </button>
          </div>

          {/* Points Balance Card */}
          <div className="p-6 border-b border-gray-100">
            <div className="bg-gradient-to-br from-[#00704A] to-[#004d35] rounded-[28px] p-6 text-white shadow-lg">
              <p className="text-sm font-bold text-white/70">ยอด Point ปัจจุบัน</p>
              <p className="text-4xl font-black mt-1">{userPoints.toFixed(2)} <span className="text-lg font-bold text-white/70">pts</span></p>
              <p className="text-xs text-white/50 mt-3">฿50 = 1 point | 2 points = ฿1 ส่วนลด</p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="p-6 overflow-y-auto no-scrollbar flex-1 pb-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">ประวัติ Points</h3>
            {transactions.length === 0 ? (
              <EmptyState icon={History} title="ยังไม่มีประวัติ Points" description="เมื่อคุณสะสมหรือใช้ Points ประวัติจะแสดงที่นี่" />
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div key={tx.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {tx.type === 'earn' ? <CirclePlus size={22} color="#16a34a" /> : <CircleMinus size={22} color="#ea580c" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{tx.type === 'earn' ? 'ได้รับ Point' : 'ใช้ Point'}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{tx.description || tx.order_id}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${tx.type === 'earn' ? 'text-green-600' : 'text-orange-600'}`}>
                        {tx.type === 'earn' ? '+' : ''}{tx.points?.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">{formatDateTime(tx.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// --- NOTIFICATION MODAL ---
const NOTIFICATION_STATUS_META = {
  waiting_payment: { icon: <CreditCard size={22} color="#f97316" />, label: 'รอการชำระเงิน', color: '#f97316' },
  waiting_confirmation: { icon: <ClipboardClock size={22} color="#3b82f6" />, label: 'กำลังตรวจสอบ', color: '#3b82f6' },
  paid: { icon: <Receipt size={22} color="#16a34a" />, label: 'ชำระเงินสำเร็จ', color: '#16a34a' },
  completed: { icon: <PackageCheck size={22} color="#8b5cf6" />, label: 'ออเดอร์สำเร็จ', color: '#8b5cf6' },
  points: { icon: <CircleDollarSign size={22} color="#f59e0b" />, label: 'แต้มสะสม', color: '#f59e0b' },
};

const NotificationModal = ({ notifications, visible, onClose, onViewOrder, onOpen }) => {
  useEffect(() => {
    if (visible && onOpen) {
      onOpen();
    }
  }, [visible, onOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
      />
      <div className={`fixed inset-0 z-[201] pointer-events-none flex items-end justify-center`}>
        <div
          className={`bg-white w-full max-w-md rounded-t-[40px] overflow-hidden shadow-[0px_0px_33px_-3px_rgba(0,_0,_0,_0.2)] h-[90vh] flex flex-col transition-transform duration-200 ease-out transform ${visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
        >
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
                  const meta = NOTIFICATION_STATUS_META[notif.status] || { icon: <Package size={22} color="#6b7280" />, label: 'อัปเดต', color: '#6b7280' };
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
                          {notif.message ? (
                            <p className="text-xs font-bold mt-0.5 line-clamp-1" style={{ color: meta.color }}>{notif.message}</p>
                          ) : (
                            <p className="text-xs font-bold mt-0.5" style={{ color: meta.color }}>{meta.label}</p>
                          )}
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
    </>
  );
};

// --- NEWS DETAIL MODAL ---
const NewsDetailModal = ({ news: propNews, visible, onClose }) => {
  const [cachedNews, setCachedNews] = useState(propNews);

  useEffect(() => {
    if (propNews) {
      setCachedNews(propNews);
    }
  }, [propNews]);

  const news = propNews || cachedNews;

  return (
    <>
      <div
        className={`fixed inset-0 z-[350] backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
      />
      <div className={`fixed inset-0 z-[351] pointer-events-none flex items-end justify-center`}>
        <div
          className={`w-full max-w-md h-[90vh] bg-white rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl transition-transform duration-200 ease-out transform ${visible ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'}`}
        >
          {news && (
            <>
              <div className="relative h-64 flex-shrink-0">
                <img key={news.image} src={news.image} alt={news.title} className="w-full h-full object-cover" />
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
            </>
          )}
        </div>
      </div>
    </>
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
  // Mode: 'login' | 'register' | 'otp'
  const [mode, setMode] = useState('login');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register fields - Initial Step
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Register fields - Details Step 1 (Name & Phone)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Register fields - Details Step 2 (Birthday)
  const [regBirthday, setRegBirthday] = useState('');

  // OTP fields
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const otpTimerRef = useRef(null);

  // Common
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Helper: Generate 6-digit OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Helper: Send OTP Email via EmailJS
  const sendOTPEmail = async (email, otp) => {
    try {
      // Send email using EmailJS
      const templateParams = {
        to_email: email,
        to_name: regUsername || 'ลูกค้า',
        otp_code: otp,
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log('OTP email sent successfully to:', email);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // Fallback: show alert if email sending fails
      alert(`เกิดข้อผิดพลาดในการส่งอีเมล\n\nรหัส OTP ของคุณคือ: ${otp}\n\n(กรุณาตรวจสอบการตั้งค่า EmailJS)`);
      throw error;
    }
  };

  // Timer for resend OTP
  useEffect(() => {
    if (mode === 'otp' && resendTimer > 0) {
      otpTimerRef.current = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(otpTimerRef.current);
  }, [mode, resendTimer]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: queryError } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq."${username}",email.eq."${username}"`)
        .eq('password', password)
        .maybeSingle();

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

  const checkUsernameAvailability = async (username) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      return !!data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setUsernameError('');

    // Validation
    if (!regUsername || !regEmail || !regPassword) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      setIsLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      setIsLoading(false);
      return;
    }

    // Check availability (Username & Email)
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('username, email')
        .or(`username.eq.${regUsername},email.eq.${regEmail}`)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.username === regUsername) {
          setUsernameError('ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว');
          setIsLoading(false);
          return;
        }
        if (existingUser.email === regEmail) {
          setError('อีเมลนี้ถูกใช้งานแล้ว');
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking existing user:', err);
    }

    // Generate and send OTP
    const otp = generateOTP();
    setOtpCode(otp);
    sendOTPEmail(regEmail, otp);

    // Switch to OTP mode
    setMode('otp');
    setIsLoading(false);
    setResendTimer(60);
    setCanResend(false);
  };

  const handleOTPInput = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otpInput];
    newOtp[index] = value;
    setOtpInput(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto-verify when all filled
    if (newOtp.every(digit => digit) && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOTP = (inputOtp) => {
    const otpString = inputOtp || otpInput.join('');

    if (otpString !== otpCode) {
      setOtpError('รหัส OTP ไม่ถูกต้อง');
      setOtpInput(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
      return;
    }

    // OTP Correct -> Go to Details Step 1
    setIsLoading(false);
    setMode('details_1');
  };

  const handleDetails1Submit = (e) => {
    e.preventDefault();
    setError('');

    if (!regName) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    // Basic phone validation (if provided)
    if (regPhone && !/^\d{9,10}$/.test(regPhone.replace(/-/g, ''))) {
      setError('เบอร์โทรศัพท์ไม่ถูกต้อง (กรุณากรอกเฉพาะตัวเลข 9-10 หลัก)');
      return;
    }

    setMode('details_2');
  };

  const handleDetails2Submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regBirthday) {
      setError('กรุณาระบุวันเกิด');
      return;
    }

    setIsLoading(true);

    try {
      const randomID = Math.floor(10000 + Math.random() * 90000);
      const userID = `CU-${randomID}`;

      const newUser = {
        id: userID,
        username: regUsername,
        email: regEmail,
        name: regName,
        password: regPassword,
        phone: regPhone || null,
        photo: 'https://raw.githubusercontent.com/Moviifox/webappcafe/refs/heads/main/public/user.jpg',
        points: 0,
        // birthday: regBirthday, // TODO: Ensure DB has this column or store in metadata if needed. For now assuming it might be needed or just ignored if not in schema. 
        // NOTE: If specific column needed, add it. If not, maybe store in metadata? 
        // User asked for birthday input, let's try to save it. If schema fails, I'll catch it.
        // Let's assume standard field or add it later if fails.
        // Actually, let's check schema/previous code. It doesn't show birthday. 
        // I will add it to the object. If it fails, I'll catch it.
        birthday: regBirthday,
        created_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Success! Login automatically
      onLoginSuccess(data);
    } catch (err) {
      console.error('Registration error:', err);
      setError('เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่อีกครั้ง');
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (!canResend) return;

    const newOtp = generateOTP();
    setOtpCode(newOtp);
    sendOTPEmail(regEmail, newOtp);
    setOtpInput(['', '', '', '', '', '']);
    setOtpError('');
    setResendTimer(60);
    setCanResend(false);
    document.getElementById('otp-0')?.focus();
  };

  const handleBackToRegister = () => {
    setMode('register');
    setOtpInput(['', '', '', '', '', '']);
    setOtpError('');
    setOtpCode('');
  };

  const handleCloseSheet = () => {
    setMode('login');
    setError('');
    setOtpError('');
  };

  return (
    <>
      {/* Login Screen (Background) */}
      <div className={`fixed inset-0 bg-[#FDFDFD] z-[400] flex flex-col p-8 justify-center transition-all duration-300 ${mode !== 'login' ? 'scale-95 opacity-50 blur-[2px]' : ''}`}>
        <div className="mb-12">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: alpha('#00704A', '0.1'), color: '#00704A' }}>
            <Coffee size={32} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">ยินดีต้อนรับ</h1>
          <p className="text-gray-400 font-bold">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-1">ชื่อผู้ใช้งาน หรือ อีเมล</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2"
                style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                placeholder="ชื่อผู้ใช้งาน หรือ อีเมล"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase ml-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2"
                style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                placeholder="รหัสผ่าน"
              />
            </div>
          </div>
          {error && mode === 'login' && <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold"><SearchX size={18} /> {error}</div>}
          <button
            type="submit"
            disabled={isLoading && mode === 'login'}
            className="w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex justify-center gap-2"
            style={{ backgroundColor: '#00704A', boxShadow: `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
          >
            {isLoading && mode === 'login' ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'เข้าสู่ระบบ'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className="text-sm font-bold text-gray-400 hover:text-[#00704A] transition-colors"
          >
            ยังไม่มีบัญชี? <span className="text-[#00704A]">สมัครสมาชิก</span>
          </button>
        </div>
        <div className="h-20"></div>
      </div>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[410] transition-opacity duration-300 ${mode !== 'login' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(252,252,252,0.2)' }}
      />

      {/* Bottom Sheet Modal */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white z-[420] rounded-t-[40px] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-out transform ${mode !== 'login' ? 'translate-y-0' : 'translate-y-full'} min-h-[75vh] overflow-y-auto`}
      >
        {/* Close Button - Hide in details steps */}
        {mode !== 'details_1' && mode !== 'details_2' && (
          <button
            onClick={handleCloseSheet}
            className="absolute top-6 right-6 w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center border border-gray-200 active:scale-90 transition-transform z-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        )}

        {/* Register Content */}
        {mode === 'register' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: alpha('#00704A', '0.1'), color: '#00704A' }}>
                <User size={32} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">สมัครสมาชิก</h1>
              <p className="text-gray-400 font-bold">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">ชื่อผู้ใช้งาน *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[a-z0-9_]*$/.test(value)) {
                        setRegUsername(value);
                        setUsernameError('');
                      }
                    }}
                    onBlur={() => checkUsernameAvailability(regUsername)}
                    className={`w-full bg-white border ${usernameError ? 'border-red-500' : 'border-gray-200'} rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2`}
                    style={{ '--tw-ring-color': alpha(usernameError ? '#EF4444' : '#00704A', '0.2') }}
                    placeholder="ชื่อผู้ใช้งาน (ตัวเล็ก, ตัวเลข, _, 6 ตัวขึ้นไป)"
                    required
                    minLength={6}
                  />
                </div>
                {usernameError && <p className="text-xs text-red-500 font-bold ml-1">{usernameError}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">อีเมล *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">@</span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>
              <div className="pb-6">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">รหัสผ่าน *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                    placeholder="รหัสผ่าน"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              {error && mode === 'register' && <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold"><SearchX size={18} /> {error}</div>}
              <button
                type="submit"
                disabled={isLoading || !regUsername || regUsername.length < 6 || !regEmail || !regPassword}
                className={`w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex justify-center gap-2 ${(!regUsername || regUsername.length < 6 || !regEmail || !regPassword) ? 'opacity-50 pointer-events-none bg-gray-400' : ''}`}
                style={{ backgroundColor: (!regUsername || regUsername.length < 6 || !regEmail || !regPassword) ? '#9CA3AF' : '#00704A', boxShadow: (!regUsername || regUsername.length < 6 || !regEmail || !regPassword) ? 'none' : `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'ขอรหัส OTP'}
              </button>
            </form>
          </div>
        )}

        {/* Details Step 1: Name & Phone */}
        {mode === 'details_1' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: alpha('#00704A', '0.1'), color: '#00704A' }}>
                <User size={32} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">ข้อมูลส่วนตัว</h1>
              <p className="text-gray-400 font-bold">กรุณากรอกชื่อและเบอร์โทรศัพท์</p>
            </div>

            <form onSubmit={handleDetails1Submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">ชื่อ-นามสกุล *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                    placeholder="ชื่อ-นามสกุล"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 pb-6">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">เบอร์โทรศัพท์ (ไม่บังคับ)</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-800 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                    placeholder="08X-XXX-XXXX"
                  />
                </div>
              </div>
              {error && <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold"><SearchX size={18} /> {error}</div>}
              <button
                type="submit"
                disabled={!regName}
                className={`w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex justify-center gap-2 ${!regName ? 'opacity-50 pointer-events-none bg-gray-400' : ''}`}
                style={{ backgroundColor: !regName ? '#9CA3AF' : '#00704A', boxShadow: !regName ? 'none' : `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
              >
                ถัดไป
              </button>
            </form>
          </div>
        )}

        {/* Details Step 2: Birthday */}
        {mode === 'details_2' && (
          <div className="animate-fade-in">
            <div className="mb-6 text-center pt-4">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg" style={{ backgroundColor: '#fff', border: `4px solid ${alpha('#00704A', '0.1')}` }}>
                <Gift size={48} color="#00704A" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">วันเกิดของคุณ</h1>
              <p className="text-gray-400 font-bold">รับสิทธิพิเศษมากมายในเดือนเกิด</p>
            </div>

            <form onSubmit={handleDetails2Submit} className="space-y-6">
              <div className="space-y-2 pb-8 pt-10">
                <label className="text-xs font-black text-gray-400 uppercase ml-1">วัน/เดือน/ปีเกิด *</label>
                <div className="relative min-w-0">
                  <input
                    type="date"
                    value={regBirthday}
                    onChange={(e) => setRegBirthday(e.target.value)}
                    className="w-full max-w-full box-border bg-white border border-gray-200 rounded-2xl py-4 px-4 font-bold text-gray-800 outline-none focus:ring-2 text-center text-lg shadow-sm"
                    style={{ '--tw-ring-color': alpha('#00704A', '0.2') }}
                    required
                  />
                </div>
              </div>

              {error && <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold"><SearchX size={18} /> {error}</div>}

              <button
                type="submit"
                disabled={isLoading || !regBirthday}
                className={`w-full text-white py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex justify-center gap-2 ${(!regBirthday || isLoading) ? 'opacity-50 pointer-events-none bg-gray-400' : ''}`}
                style={{ backgroundColor: (!regBirthday || isLoading) ? '#9CA3AF' : '#00704A', boxShadow: (!regBirthday || isLoading) ? 'none' : `0 10px 15px -3px ${alpha('#00704A', '0.3')}` }}
              >
                {isLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'ยืนยันการสมัคร'}
              </button>
            </form>
          </div>
        )}

        {/* OTP Content */}
        {mode === 'otp' && (
          <div className="animate-fade-in mb-36">
            <div className="mb-8">
              <button
                onClick={handleBackToRegister}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-6 font-bold"
              >
                <ChevronLeft size={20} /> แก้ไขข้อมูล
              </button>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mt-14" style={{ backgroundColor: alpha('#00704A', '0.1'), color: '#00704A' }}>
                <Lock size={32} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2">ยืนยันอีเมล</h1>
              <p className="text-gray-400 font-bold">กรอกรหัส OTP ที่ส่งไปที่</p>
              <p className="text-gray-600 font-bold">{regEmail}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otpInput.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPInput(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-black bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#00704A] focus:ring-2 focus:ring-[#00704A]/20 transition-all"
                    style={{ caretColor: '#00704A' }}
                  />
                ))}
              </div>

              {otpError && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold justify-center">
                  <SearchX size={18} /> {otpError}
                </div>
              )}

              {error && mode === 'otp' && (
                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl text-sm font-bold">
                  <SearchX size={18} /> {error}
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={!canResend}
                  className={`text-sm font-bold transition-colors ${canResend ? 'text-[#00704A] hover:underline' : 'text-gray-300 cursor-not-allowed'
                    }`}
                >
                  {canResend ? 'ส่งรหัสอีกครั้ง' : `ส่งรหัสใหม่ได้ใน ${resendTimer} วินาที`}
                </button>
              </div>

              {isLoading && (
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00704A] rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="h-10"></div>
          </div>
        )}
      </div>
    </>
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
  const [scrollPositions, setScrollPositions] = useState({ home: 0, menu: 0, search: 0, order: 0, news: 0 });

  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('ทั้งหมด');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeGlobalCategory, setActiveGlobalCategory] = useState('ทั้งหมด');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [activeNewsCategory, setActiveNewsCategory] = useState('ทั้งหมด');
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
  const [pendingOrderNumber, setPendingOrderNumber] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Supabase data states
  const [dbMenus, setDbMenus] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbAddons, setDbAddons] = useState([]);
  const [dbNews, setDbNews] = useState([]);
  const [dbPromotions, setDbPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Points system states
  const [userPoints, setUserPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointTransactions, setPointTransactions] = useState([]);
  const [showPointsHistory, setShowPointsHistory] = useState(false);

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

      // Fetch user's points from users table
      const { data: userData } = await supabase
        .from('users')
        .select('points')
        .eq('id', currentUser?.id)
        .single();

      // Fetch user's point transactions
      const { data: pointTxData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

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
      setUserPoints(userData?.points || 0);
      setPointTransactions(pointTxData || []);
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

    console.log('[REALTIME] Setting up subscriptions for user:', currentUser.id);

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
          console.log('[REALTIME] Order update received:', payload);

          if (payload.eventType === 'INSERT') {
            const newOrder = {
              ...payload.new,
              paymentMethod: payload.new.payment_method,
              slipFileName: payload.new.slip_file_name,
              createdAt: payload.new.created_at,
            };
            console.log('[REALTIME] Adding new order:', newOrder);
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('[REALTIME] Updating order:', payload.new.id, 'Status:', payload.new.status);

            const isNowPaid = payload.new.status === 'paid';
            let shouldProcessPoints = false;
            let orderTotal = 0;

            // อัปเดต orders และเช็คว่าควรเพิ่ม points หรือไม่
            setOrders((prev) => {
              const oldOrder = prev.find(o => o.id === payload.new.id);
              const wasNotPaid = oldOrder && oldOrder.status !== 'paid';

              // ถ้าสถานะเปลี่ยนจากไม่ใช่ paid เป็น paid ให้เพิ่ม points
              if (wasNotPaid && isNowPaid) {
                shouldProcessPoints = true;
                orderTotal = payload.new.total || 0;
                console.log('[REALTIME] Status changed to paid. Old status:', oldOrder?.status, 'Total:', orderTotal);
              }

              return prev.map((order) =>
                order.id === payload.new.id
                  ? {
                    ...payload.new,
                    paymentMethod: payload.new.payment_method,
                    slipFileName: payload.new.slip_file_name,
                    createdAt: payload.new.created_at,
                  }
                  : order
              );
            });

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
            console.log('[REALTIME] Showing notification for order:', payload.new.id);
            showOrderStatusNotification(payload.new.id, payload.new.status);

            // จัดการ points เมื่อสถานะเปลี่ยนเป็น paid (ต้องทำหลัง setOrders เพราะ shouldProcessPoints ถูก set ใน callback)
            setTimeout(async () => {
              if (shouldProcessPoints && orderTotal > 0) {
                console.log('[REALTIME] Processing points for paid order:', payload.new.id);

                // อ่านข้อมูล points ที่ใช้จาก promotion field
                const promotion = payload.new.promotion;
                const pointsUsed = promotion?.points_used || 0;
                const pointsDiscountAmount = promotion?.points_discount || 0;

                // ดึงยอด points ปัจจุบันจาก DB
                const { data: userData, error: selectError } = await supabase
                  .from('users')
                  .select('points')
                  .eq('id', currentUser?.id)
                  .single();

                if (selectError) {
                  console.error('[REALTIME] Error fetching user points:', selectError);
                  return;
                }

                let currentBalance = Number(userData?.points) || 0;
                console.log('[REALTIME] Current points balance:', currentBalance);

                // หัก points ที่ใช้แลกส่วนลด
                if (pointsUsed > 0) {
                  console.log('[REALTIME] Deducting redeemed points:', pointsUsed);

                  // บันทึก transaction การใช้ points
                  const { error: redeemError } = await supabase.from('point_transactions').insert([{
                    user_id: currentUser?.id,
                    order_id: payload.new.id,
                    points: -pointsUsed,
                    type: 'redeem',
                    description: `ใช้แลกส่วนลด ฿${pointsDiscountAmount} ออเดอร์ ${payload.new.id}`,
                  }]);

                  if (redeemError) {
                    console.error('[REALTIME] Error inserting redeem transaction:', redeemError);
                  } else {
                    currentBalance -= pointsUsed;
                  }
                }

                // เพิ่ม points ที่ได้รับ
                const earnedPoints = calculatePointsFromOrder(orderTotal);
                console.log('[REALTIME] Points to earn:', earnedPoints);

                if (earnedPoints > 0) {
                  // บันทึก transaction การได้รับ points
                  const { error: earnError } = await supabase.from('point_transactions').insert([{
                    user_id: currentUser?.id,
                    order_id: payload.new.id,
                    points: earnedPoints,
                    type: 'earn',
                    description: `สะสมจากออเดอร์ ${payload.new.id} (฿${orderTotal})`,
                  }]);

                  if (earnError) {
                    console.error('[REALTIME] Error inserting earn transaction:', earnError);
                  } else {
                    currentBalance += earnedPoints;
                  }
                }

                // อัปเดตยอด points ใน users table
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ points: currentBalance })
                  .eq('id', currentUser?.id);

                if (updateError) {
                  console.error('[REALTIME] Error updating user points:', updateError);
                  return;
                }

                // อัปเดต local state
                setUserPoints(currentBalance);

                // Refetch point transactions เพื่ออัปเดตประวัติ
                const { data: newTxData } = await supabase
                  .from('point_transactions')
                  .select('*')
                  .eq('user_id', currentUser?.id)
                  .order('created_at', { ascending: false });
                if (newTxData) setPointTransactions(newTxData);

                // แสดง toast
                let toastMsg = '';
                if (pointsUsed > 0 && earnedPoints > 0) {
                  toastMsg = `ใช้ ${pointsUsed} pts, ได้รับ ${earnedPoints.toFixed(2)} pts`;
                } else if (pointsUsed > 0) {
                  toastMsg = `ใช้ ${pointsUsed} points แล้ว`;
                } else if (earnedPoints > 0) {
                  toastMsg = `ได้รับ ${earnedPoints.toFixed(2)} points!`;
                }
                if (toastMsg) showToastMsg(toastMsg, 'success');

                // สร้าง Notification ในรายการแจ้งเตือน (แต่ไม่ Push)
                if (toastMsg) {
                  try {
                    const { error: notifError } = await supabase.from('notifications').insert([{
                      user_id: currentUser?.id,
                      order_id: payload.new.id,
                      status: 'points', // ใช้ icon เหรียญ
                      message: toastMsg,
                      read: false
                    }]);

                    if (notifError) {
                      console.error('[REALTIME] Error inserting notification:', notifError);
                    } else {
                      console.log('[REALTIME] Notification inserted successfully');
                    }
                  } catch (err) {
                    console.error('[REALTIME] Unexpected error inserting notification:', err);
                  }
                }

                console.log('[REALTIME] Points updated. New balance:', currentBalance);
              }
            }, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Orders channel status:', status);
      });

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
          console.log('[REALTIME] Notification received:', payload);
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME] Notifications channel status:', status);
      });

    return () => {
      console.log('[REALTIME] Cleaning up subscriptions');
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [currentUser]);

  // Ref for previous query to track changes
  const prevMenuSearchQuery = useRef(menuSearchQuery);
  const prevGlobalSearchQuery = useRef(globalSearchQuery);
  const prevNewsSearchQuery = useRef(newsSearchQuery);

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

  const filteredNewsResults = useMemo(() => {
    let result = [...dbNews];
    if (newsSearchQuery) {
      const q = newsSearchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
    }
    if (activeNewsCategory === 'ข่าวสาร') result = result.filter(n => n.type === 'News');
    else if (activeNewsCategory === 'โปรโมชั่น') result = result.filter(n => n.type === 'Promotion');
    return result;
  }, [newsSearchQuery, activeNewsCategory, dbNews]);

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
    const isNewsPage = currentPage === 'news';

    // Check for changes (News)
    const newsQueryChanged = newsSearchQuery !== prevNewsSearchQuery.current;
    prevNewsSearchQuery.current = newsSearchQuery;

    const shouldScroll = (isMenuPage && menuQueryChanged) || (isSearchPage && globalQueryChanged) || (isNewsPage && newsQueryChanged);

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
  }, [menuSearchQuery, globalSearchQuery, newsSearchQuery, currentPage]); // Added globalSearchQuery

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
  const pointsDiscount = useMemo(() => calculatePointsDiscount(pointsToRedeem, userPoints), [pointsToRedeem, userPoints]);
  const totalDiscount = useMemo(() => promotionDiscount + pointsDiscount, [promotionDiscount, pointsDiscount]);
  const finalTotal = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount]);
  const pointsToEarn = useMemo(() => calculatePointsFromOrder(finalTotal), [finalTotal]);
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
    // Generate order number immediately when entering/re-entering payment flow
    const newOrderId = generateOrderNumber();
    setPendingOrderNumber(newOrderId);
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
    setPendingOrderNumber('');
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
    setShowScanner(true);
  };

  const handleScanSuccess = (decodedText) => {
    setShowScanner(false);
    if (decodedText) {
      setPromoInput(decodedText.toUpperCase());
      showToastMsg(`สแกนสำเร็จ: ${decodedText}`, 'success');
      // Optional: Auto-apply logic here if desired
      // handleApplyPromotion(); 
    }
  };

  const createOrderRecord = async (status, method) => {
    const orderId = pendingOrderNumber || generateOrderNumber();
    const itemsSnapshot = cart.map(item => ({ ...item }));

    // สร้าง order record สำหรับ Supabase
    const actualPointsUsed = pointsToRedeem > 0 ? Math.min(pointsToRedeem, userPoints, 100) : 0;
    const supabaseOrder = {
      id: orderId,
      user_id: currentUser?.id,
      items: itemsSnapshot,
      subtotal,
      discount: totalDiscount, // รวมส่วนลดทั้งหมด (promo + points)
      total: finalTotal,
      payment_method: method,
      status,
      promotion: appliedPromotion ? {
        ...appliedPromotion,
        points_used: actualPointsUsed,
        points_discount: pointsDiscount,
      } : (actualPointsUsed > 0 ? {
        points_used: actualPointsUsed,
        points_discount: pointsDiscount,
      } : null),
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

      // หมายเหตุ: points จะถูกหักเมื่อ order เปลี่ยนสถานะเป็น paid
      // (ดูใน realtime handler)

      // สร้าง order record สำหรับ local state (รูปแบบเดิม)
      const orderRecord = {
        id: orderId,
        items: itemsSnapshot,
        subtotal,
        discount: totalDiscount,
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
      setPointsToRedeem(0); // Reset points redemption
      setPendingOrderNumber('');
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

      // จัดการ points เมื่อสถานะเปลี่ยนเป็น paid
      if (updates.status === 'paid') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const earnedPoints = calculatePointsFromOrder(order.total || 0);

          if (earnedPoints > 0) {
            // บันทึก transaction การได้รับ points
            await supabase.from('point_transactions').insert([{
              user_id: currentUser?.id,
              order_id: orderId,
              points: earnedPoints,
              type: 'earn',
              description: `สะสมจากออเดอร์ ${orderId} (฿${order.total})`,
            }]);

            // อัปเดตยอด points ใน users table
            const newBalance = userPoints + earnedPoints;
            await supabase
              .from('users')
              .update({ points: newBalance })
              .eq('id', currentUser?.id);

            // อัปเดต local state
            setUserPoints(newBalance);

            showToastMsg(`อัพเดทสำเร็จ! ได้รับ ${earnedPoints.toFixed(2)} points`, 'success');
            return;
          }
        }
      }

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
                  : currentPage === 'news'
                    ? 'ข่าวสารและโปรโมชั่น'
                    : 'ประวัติออเดอร์'
        }
        showBackButton={false}
        onBack={() => { changePage('home'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
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
            <h2 className="text-xl font-black text-[#111827] mb-5 px-1">ข่าวสารและโปรโมชั่น</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-[18px] px-[18px]">
              {dbNews.slice(0, 3).map(n => (
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
              <button
                onClick={() => { changePage('news'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className="w-[120px] min-w-[120px] h-48 rounded-[32px] overflow-hidden shadow-sm border border-gray-200 bg-gray-50 flex-shrink-0 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform group"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-400 group-hover:text-[#00704A] group-hover:border-[#00704A] transition-colors">
                  <ChevronRight size={24} />
                </div>
                <span className="text-xs font-bold text-gray-500">ดูทั้งหมด</span>
              </button>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-black text-[#111827] mb-5 px-1">เมนูแนะนำสำหรับคุณ</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8">
              {dbMenus.filter(m => m.isRecommended).slice(0, 4).map(menu => <MenuCard key={menu.id} menu={menu} onSelect={setSelectedMenu} />)}
            </div>
          </section>
        </div>

        {/* NEWS PAGE */}
        <div style={{ display: currentPage === 'news' ? 'block' : 'none' }} className="flex flex-col gap-1 h-full min-h-[80vh]">
          <StickySearchBar
            value={newsSearchQuery}
            onChange={setNewsSearchQuery}
            placeholder="ค้นหาข่าวสาร..."
            inputRef={searchInputRef}
            onFocus={() => {
              isJustFocused.current = true;
              setTimeout(() => { isJustFocused.current = false; }, 800);
            }}
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-[18px] px-[18px] py-1 mt-1">
            {['ทั้งหมด', 'ข่าวสาร', 'โปรโมชั่น'].map(cat => (
              <button key={cat} onClick={() => setActiveNewsCategory(cat)} className={`px-6 py-3 rounded-full text-xs font-black whitespace-nowrap transition-all border`}
                style={{
                  backgroundColor: activeNewsCategory === cat ? '#00704A' : '#ffffff',
                  borderColor: activeNewsCategory === cat ? '#00704A' : '#f3f4f6',
                  color: activeNewsCategory === cat ? '#ffffff' : '#9ca3af',
                  transform: activeNewsCategory === cat ? 'scale(1.05)' : 'scale(1)'
                }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 mt-4 pb-10">
            {filteredNewsResults.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedNews(item)}
                className="flex flex-col gap-3 group text-left active:scale-[0.98] transition-transform"
              >
                <div className="w-full aspect-[3/4] rounded-[24px] overflow-hidden shadow-md bg-gray-100 relative">
                  <CachedImage src={item.image} className="w-full h-full object-cover" alt={item.title} />
                  <div className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm z-10 ${item.type === 'Promotion' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {item.type === 'Promotion' ? 'Promotion' : 'News'}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{item.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(item.date).split(' ')[0]}</p>
                </div>
              </button>
            ))}
            {filteredNewsResults.length === 0 && (
              <div className="col-span-2 py-10">
                <EmptyState icon={SearchX} title="ไม่พบข่าวสาร" description="ลองเปลี่ยนคำค้นหา หรือหมวดหมู่ดูนะ" />
              </div>
            )}
          </div>
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
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest mb-1">จำนวนเมนู</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">{cart.length}</span>
                    <span className="text-sm font-bold text-gray-400">เมนู</span>
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

      {/* Bottom Gradient Overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent z-[140] pointer-events-none" />

      {/* Navigation Bar - Fixed at bottom */}
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
        discount={totalDiscount}
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
        userPoints={userPoints}
        pointsToRedeem={pointsToRedeem}
        onPointsChange={setPointsToRedeem}
        pointsDiscount={pointsDiscount}
        pointsToEarn={pointsToEarn}
        orderNumber={pendingOrderNumber}
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
        pointTransactions={pointTransactions}
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

      <MenuDetailModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} onConfirm={(item) => handleAddToCart(item)} />
      <MenuDetailModal menu={editingItem} isEditMode={true} onClose={() => setEditingItem(null)} onConfirm={(item) => { handleUpdateCart(item); setEditingItem(null); }} onDelete={() => setDeleteConfirmItem(editingItem)} />

      <DeleteConfirmModal visible={!!deleteConfirmItem} onConfirm={confirmDelete} onCancel={() => setDeleteConfirmItem(null)} />

      <LogoutConfirmModal visible={showLogoutConfirm} onConfirm={handleLogout} onCancel={() => setShowLogoutConfirm(false)} />

      <NewsDetailModal news={selectedNews} visible={!!selectedNews} onClose={() => setSelectedNews(null)} />

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

      {
        showProfile && (
          <div className="fixed inset-0 z-[300] bg-[#fcfcfc] p-[18px]">
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
                <button onClick={() => setShowPointsHistory(true)} className="text-left">
                  <p className="text-[10px] font-bold uppercase mb-1 text-gray-400">Point Balance</p>
                  <p className="text-3xl font-black">{userPoints.toFixed(2)} <span className="text-xs font-normal" style={{ color: '#00704A' }}>Pts</span></p>
                  <p className="text-[10px] text-white/50 mt-1">แตะเพื่อดูประวัติ Points</p>
                </button>
                <QrCode size={50} className="opacity-30" />
              </div>
            </div>
            <button onClick={() => setShowLogoutConfirm(true)} className="w-full py-5 text-red-500 rounded-[28px] shadow-sm bg-white border border-[#f3f4f6] font-bold flex items-center justify-center gap-2"><LogOut size={20} /> ออกจากระบบ</button>
          </div>
        )
      }

      {/* Points History Modal */}
      <PointsHistoryModal
        visible={showPointsHistory}
        userPoints={userPoints}
        transactions={pointTransactions}
        onClose={() => setShowPointsHistory(false)}
      />


      {showScanner && (
        <QRScannerModal
          visible={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScanSuccess}
        />
      )}

      {/* Global Styles */}
      <GlobalStyles />
    </div >
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
