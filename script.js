/* =========================================================================
   ربط Firebase — نفس المفاتيح اللي طلعت من Firebase Console (عامة، مو سرية)
   ========================================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2tFMqBciAqo3h2ZTQ5je2NOJIkVnr8UM",
  authDomain: "khaleyat-ahd.firebaseapp.com",
  projectId: "khaleyat-ahd",
  storageBucket: "khaleyat-ahd.firebasestorage.app",
  messagingSenderId: "357598654671",
  appId: "1:357598654671:web:d32d004006c6293fb847ba",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/* =========================================================================
   خلية عهد — إعدادات المحل
   القيم الافتراضية بالأسفل تُستخدم فقط لو تعذّر الاتصال بـ Firestore.
   القيم الفعلية تُجلب من مستند config/main عند تحميل الصفحة.
   ========================================================================= */
let CONFIG = {
  // رقم الواتساب الذي تُرسل إليه الطلبات (بصيغة دولية بدون + أو صفر بالبداية)
  RESTAURANT_PHONE: "966500000000",
  RESTAURANT_NAME: "خلية عهد",
  // رقم الاتصال المباشر المعروض بزر "اتصال" — عدّله إذا كان مختلفًا عن واتساب
  CALL_PHONE: "+966500000000",
  // رابط الموقع على خرائط جوجل (Google Maps) — استبدله برابط موقع المحل الفعلي
  MAPS_URL: "https://maps.app.goo.gl/1QXbZ3JMzDDruv5M8",
  INSTAGRAM_URL: "https://instagram.com/",
  SNAPCHAT_URL: "https://snapchat.com/",
  // ساعات العمل: day بحسب JS (0=الأحد ... 6=السبت)، بصيغة 24 ساعة "HH:MM"
  WORKING_HOURS: [
    { day: 0, label: "الأحد", open: "16:00", close: "00:00" },
    { day: 1, label: "الاثنين", open: "16:00", close: "00:00" },
    { day: 2, label: "الثلاثاء", open: "16:00", close: "00:00" },
    { day: 3, label: "الأربعاء", open: "16:00", close: "00:00" },
    { day: 4, label: "الخميس", open: "16:00", close: "01:00" },
    { day: 5, label: "الجمعة", open: "16:30", close: "01:00" },
    { day: 6, label: "السبت", open: "16:00", close: "01:00" },
  ],
  CURRENCY: "ر.س",
};

/* أقسام المنيو — تُجلب من collection "sections" في Firestore عند التحميل.
   القيم هنا تبقى fallback احتياطي فقط لو انقطع الاتصال. */
let SECTIONS = [
  { key: "luqaimat", title: "لقيمات", desc: "اللقيمات الكلاسيكية بحجمها الفردي المعروف، دافئة ومقرمشة من الخارج." },
  { key: "balah", title: "بلح الشام", desc: "نفس الطعم المحبوب، لكن مشوي على الفحم بدلًا من القلي." },
  { key: "khaliya", title: "خلية", desc: "الصنف الذي يحمل اسمنا — وصفتنا الأصلية التي بدأ بها كل شيء." },
  { key: "maamoul", title: "معمول", desc: "معمول منزلي بحشوات متعددة، يُخبز طازجًا كل يوم." },
  { key: "cinnabon", title: "سينابون", desc: "لفافات قرفة طرية، تُخبز دافئة حسب الطلب." },
  { key: "plates", title: "صحون القيمات و بلح الشام", desc: "أطباق مشاركة سخية من اللقيمات الذهبية، مثالية للعائلة أو الضيوف." },
];

const FAV_STORAGE_KEY = "khaliyatAhd.favorites";
const CART_STORAGE_KEY = "khaliyatAhd.cart";
const VIEW_STORAGE_KEY = "khaliyatAhd.view";

/* ============ أيقونات SVG صغيرة يُعاد استخدامها ============ */
const ICONS = {
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.4-1-2-1.5-3 1 .2 2 1 2.5 2 .5-1.5.2-3-1-4.5 2 .5 4 2.5 4 5.5a6.5 6.5 0 0 1-13 0c0-2 1-3.5 2-5 .5 1 .5 2 1.5 2.5Z"/></svg>`,
  close: `✕`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.13.82.84-3.05-.2-.31a8.22 8.22 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.21-8.25 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.65.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.38-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.9 2.42 1.02 2.58.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.29Z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  basket: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16l-1.4 10.1A2 2 0 0 1 16.6 21H7.4a2 2 0 0 1-2-1.9L4 9Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>`,
  ghost: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20V11a7 7 0 0 1 14 0v9l-2.3-1.6L14.5 20l-2.5-1.6L9.5 20l-2.2-1.6L5 20Z"/><circle cx="9.5" cy="11" r="1"/><circle cx="14.5" cy="11" r="1"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"/><circle cx="12" cy="13.5" r="3.5"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
};

/* ============ الحالة العامة ============ */
const state = {
  items: [],
  favorites: new Set(loadJSON(FAV_STORAGE_KEY, [])),
  cart: loadJSON(CART_STORAGE_KEY, []),
  searchQuery: "",
  favoritesOnly: false,
  sheetItem: null,
  sheetSizeIndex: 0,
  sheetOptions: new Set(),
  sheetQty: 1,
  openSheetName: null, // "item" | "cart" | null
  lastFocusedEl: null,
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/* ============ عناصر DOM ============ */
const el = {
  statusDot: document.getElementById("statusDot"),
  statusState: document.getElementById("statusState"),
  statusHours: document.getElementById("statusHours"),
  searchInput: document.getElementById("searchInput"),
  favToggle: document.getElementById("favToggle"),
  favCount: document.getElementById("favCount"),
  tabsScroll: document.getElementById("tabsScroll"),
  tabsArrowRight: document.getElementById("tabsArrowRight"),
  tabsArrowLeft: document.getElementById("tabsArrowLeft"),
  gridViewBtn: document.getElementById("gridViewBtn"),
  listViewBtn: document.getElementById("listViewBtn"),
  menuMain: document.getElementById("menuMain"),
  hoursTable: document.getElementById("hoursTable"),
  callBtn: document.getElementById("callBtn"),
  mapBtn: document.getElementById("mapBtn"),
  instaBtn: document.getElementById("instaBtn"),
  snapBtn: document.getElementById("snapBtn"),
  sheetOverlay: document.getElementById("sheetOverlay"),
  itemSheet: document.getElementById("itemSheet"),
  cartSheet: document.getElementById("cartSheet"),
  cartFab: document.getElementById("cartFab"),
  cartFabCount: document.getElementById("cartFabCount"),
  cartFabTotal: document.getElementById("cartFabTotal"),
};

/* =========================================================================
   جلب الإعدادات (config/main) والأقسام (sections) من Firestore
   ========================================================================= */
async function loadConfigAndSections() {
  try {
    const configSnap = await getDoc(doc(db, "config", "main"));
    if (configSnap.exists()) CONFIG = configSnap.data();
  } catch (err) {
    console.error("تعذّر جلب الإعدادات من Firestore، تُستخدم القيم الافتراضية", err);
  }

  try {
    const sectionsQuery = query(collection(db, "sections"), orderBy("order"));
    const sectionsSnap = await getDocs(sectionsQuery);
    if (!sectionsSnap.empty) {
      SECTIONS = sectionsSnap.docs.map((d) => d.data());
    }
  } catch (err) {
    console.error("تعذّر جلب الأقسام من Firestore، تُستخدم القيم الافتراضية", err);
  }
}

/* =========================================================================
   تحميل بيانات المنيو من Firestore (collection "items") مع Skeleton أثناء التحميل
   ========================================================================= */
async function loadMenu() {
  renderSkeleton();
  const minDelay = new Promise((r) => setTimeout(r, 550));
  try {
    const [itemsSnap] = await Promise.all([getDocs(collection(db, "items")), minDelay]);
    state.items = itemsSnap.docs.map((d) => d.data());
  } catch (err) {
    state.items = [];
    console.error("تعذّر تحميل المنيو من Firestore", err);
  }
  buildTabs();
  buildSections();
  applyFilters();
  observeSections();
  requestAnimationFrame(updateTabsArrows);
}

function renderSkeleton() {
  el.menuMain.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "menu-section is-visible";
  wrap.innerHTML = `
    <div class="section-head">
      <div class="skeleton-block line" style="width:40%;height:22px;margin-bottom:10px;"></div>
      <div class="skeleton-block line short"></div>
    </div>
    <div class="item-grid"></div>`;
  const grid = wrap.querySelector(".item-grid");
  for (let i = 0; i < 6; i++) {
    const card = document.createElement("div");
    card.className = "skeleton-card";
    card.innerHTML = `
      <div class="skeleton-block circle"></div>
      <div class="skeleton-block line"></div>
      <div class="skeleton-block line short"></div>`;
    grid.appendChild(card);
  }
  el.menuMain.appendChild(wrap);
}

/* ============ بناء التبويبات ============ */
function buildTabs() {
  el.tabsScroll.innerHTML = "";
  SECTIONS.forEach((sec, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn" + (i === 0 ? " is-active" : "");
    btn.textContent = sec.title;
    btn.dataset.section = sec.key;
    btn.addEventListener("click", () => {
      clearFilters(false);
      setActiveTab(sec.key);
      const target = document.getElementById("section-" + sec.key);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    el.tabsScroll.appendChild(btn);
  });
}

function setActiveTab(key) {
  el.tabsScroll.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.section === key);
  });
}

/* ============ أزرار تمرير التبويبات (يمين/يسار) ============
   بما أن الصفحة RTL، أول قسم يظهر أقصى اليمين والأقسام الإضافية
   تمتد يسارًا. نظهر السهم المناسب فقط عندما يوجد محتوى إضافي
   في تلك الجهة، ونخفيه تلقائيًا عند الوصول لنهاية القائمة. */
function getTabsMaxScroll() {
  return el.tabsScroll.scrollWidth - el.tabsScroll.clientWidth;
}

function updateTabsArrows() {
  const maxScroll = getTabsMaxScroll();
  if (!el.tabsArrowRight || !el.tabsArrowLeft) return;

  if (maxScroll <= 4) {
    el.tabsArrowRight.classList.remove("is-visible");
    el.tabsArrowLeft.classList.remove("is-visible");
    return;
  }

  // المتصفحات الحديثة تجعل scrollLeft يساوي 0 عند نقطة البداية (أقصى اليمين
  // في RTL) ويصبح سالبًا كلما تحركنا نحو الأقسام الإضافية (يسارًا).
  const scrolledAway = Math.abs(el.tabsScroll.scrollLeft);
  const atStart = scrolledAway < 4;
  const atEnd = scrolledAway > maxScroll - 4;

  el.tabsArrowRight.classList.toggle("is-visible", !atStart); // رجوع لبداية القائمة
  el.tabsArrowLeft.classList.toggle("is-visible", !atEnd); // عرض بقية الأقسام
}

function scrollTabsToStart() {
  el.tabsScroll.scrollBy({ left: el.tabsScroll.clientWidth * 0.7, behavior: "smooth" });
}
function scrollTabsForMore() {
  el.tabsScroll.scrollBy({ left: -el.tabsScroll.clientWidth * 0.7, behavior: "smooth" });
}

if (el.tabsArrowRight && el.tabsArrowLeft) {
  el.tabsArrowRight.addEventListener("click", scrollTabsToStart);
  el.tabsArrowLeft.addEventListener("click", scrollTabsForMore);
  el.tabsScroll.addEventListener("scroll", () => requestAnimationFrame(updateTabsArrows));
  window.addEventListener("resize", () => requestAnimationFrame(updateTabsArrows));
}

/* ============ بناء الأقسام والكروت ============ */
function buildSections() {
  el.menuMain.innerHTML = "";
  SECTIONS.forEach((sec) => {
    const items = state.items.filter((it) => it.section === sec.key);
    const section = document.createElement("section");
    section.className = "menu-section" + (sec.key === "khaliya" ? " section-khaliya" : "");
    section.id = "section-" + sec.key;
    section.dataset.section = sec.key;

    section.innerHTML = `
      <div class="section-head">
        <h2 class="section-title">${sec.title}</h2>
        <p class="section-desc">${sec.desc}</p>
      </div>
      <div class="item-grid"></div>`;

    const grid = section.querySelector(".item-grid");
    if (items.length === 0) {
      grid.innerHTML = `<p style="color:var(--ink-muted);font-size:.85rem;">سيُضاف هذا القسم قريبًا.</p>`;
    } else {
      items.forEach((item) => grid.appendChild(buildItemCard(item)));
    }
    el.menuMain.appendChild(section);
  });
}

function priceRangeLabel(item) {
  if (item.sizes && item.sizes.length) {
    const min = Math.min(...item.sizes.map((s) => s.price));
    return `<span class="from">السعر</span> ${min} ${CONFIG.CURRENCY}`;
  }
  return `${item.price} ${CONFIG.CURRENCY}`;
}

function buildItemCard(item) {
  const card = document.createElement("article");
  card.className = "item-card";
  card.dataset.id = item.id;
  card.dataset.name = item.name;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${item.name}، اضغط لعرض التفاصيل`);

  const isFav = state.favorites.has(item.id);

  card.innerHTML = `
    <div class="item-card-media"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>
    ${item.isPopular ? `<span class="popular-badge">الأكثر طلبًا ⭐</span>` : ""}
    <button type="button" class="fav-heart" aria-pressed="${isFav}" aria-label="أضف ${item.name} إلى المفضلة">${ICONS.heart}</button>
    <div class="item-card-body">
      <h3 class="item-name">${item.name}</h3>
      ${item.description ? `<p class="item-desc">${item.description}</p>` : ""}
      <div class="item-meta">
        <span class="item-price">${priceRangeLabel(item)}</span>
        <span class="item-calories">${ICONS.flame}${item.calories}</span>
      </div>
    </div>`;

  card.querySelector(".fav-heart").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(item.id, e.currentTarget);
  });

  card.addEventListener("click", () => openItemSheet(item));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openItemSheet(item);
    }
  });

  return card;
}

/* ============ التبديل بين العرض الشبكي وعرض القائمة ============ */
function applyViewMode(view) {
  const isList = view === "list";
  el.menuMain.classList.toggle("view-list", isList);
  el.gridViewBtn.classList.toggle("is-active", !isList);
  el.gridViewBtn.setAttribute("aria-pressed", String(!isList));
  el.listViewBtn.classList.toggle("is-active", isList);
  el.listViewBtn.setAttribute("aria-pressed", String(isList));
  localStorage.setItem(VIEW_STORAGE_KEY, view);
}

el.gridViewBtn.addEventListener("click", () => applyViewMode("grid"));
el.listViewBtn.addEventListener("click", () => applyViewMode("list"));

/* ============ المفضلة ============ */
function toggleFavorite(id, btnEl) {
  const active = state.favorites.has(id);
  if (active) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...state.favorites]));
  if (btnEl) btnEl.setAttribute("aria-pressed", String(!active));
  updateFavCount();
  if (state.favoritesOnly) applyFilters();
}

function updateFavCount() {
  el.favCount.textContent = state.favorites.size;
}

el.favToggle.addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  el.favToggle.setAttribute("aria-pressed", String(state.favoritesOnly));
  applyFilters();
});

/* ============ البحث الفوري ============ */
el.searchInput.addEventListener("input", (e) => {
  state.searchQuery = e.target.value.trim().toLocaleLowerCase();
  applyFilters();
});

function clearFilters(clearFavToo = true) {
  state.searchQuery = "";
  el.searchInput.value = "";
  if (clearFavToo) {
    state.favoritesOnly = false;
    el.favToggle.setAttribute("aria-pressed", "false");
  }
}

/* ============ تطبيق الفلاتر (بحث + مفضلة) ============ */
function applyFilters() {
  const filtering = !!state.searchQuery || state.favoritesOnly;
  let totalVisible = 0;

  document.querySelectorAll(".menu-section[data-section]").forEach((section) => {
    let visibleInSection = 0;
    section.querySelectorAll(".item-card").forEach((card) => {
      const matchesSearch =
        !state.searchQuery || card.dataset.name.toLocaleLowerCase().includes(state.searchQuery);
      const matchesFav = !state.favoritesOnly || state.favorites.has(card.dataset.id);
      const visible = matchesSearch && matchesFav;
      card.style.display = visible ? "" : "none";
      if (visible) visibleInSection++;
    });
    section.style.display = visibleInSection === 0 ? "none" : "";
    totalVisible += visibleInSection;
    if (filtering && visibleInSection > 0) section.classList.add("is-visible");
  });

  toggleEmptyState(filtering && totalVisible === 0);
}

function toggleEmptyState(show) {
  let box = document.getElementById("emptyState");
  if (show) {
    if (!box) {
      box = document.createElement("div");
      box.id = "emptyState";
      box.className = "empty-state";
      box.innerHTML = `${ICONS.empty}<p>لا توجد أصناف مطابقة</p>`;
      el.menuMain.appendChild(box);
    }
  } else if (box) {
    box.remove();
  }
}

/* =========================================================================
   تأثير الظهور التدريجي + تمييز التبويب النشط أثناء التمرير
   ========================================================================= */
function observeSections() {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  const spyObserver = new IntersectionObserver(
    (entries) => {
      if (state.searchQuery || state.favoritesOnly) return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveTab(entry.target.dataset.section);
      });
    },
    { rootMargin: "-120px 0px -65% 0px", threshold: 0 }
  );

  document.querySelectorAll(".menu-section[data-section]").forEach((s) => {
    revealObserver.observe(s);
    spyObserver.observe(s);
  });
}

/* =========================================================================
   نافذة تفاصيل الصنف (Bottom Sheet)
   ========================================================================= */
function openItemSheet(item) {
  state.sheetItem = item;
  state.sheetSizeIndex = 0;
  state.sheetOptions = new Set();
  state.sheetQty = 1;
  renderItemSheet();
  openSheet("item");
}

function currentUnitPrice() {
  const item = state.sheetItem;
  let base = item.sizes && item.sizes.length ? item.sizes[state.sheetSizeIndex].price : item.price;
  (item.options || []).forEach((opt, i) => {
    if (state.sheetOptions.has(i)) base += opt.priceDelta;
  });
  return base;
}

function renderItemSheet() {
  const item = state.sheetItem;
  const hasSizes = item.sizes && item.sizes.length;
  const hasOptions = item.options && item.options.length;

  el.itemSheet.innerHTML = `
    <div class="sheet-media">
      <img src="${item.image}" alt="${item.name}">
      <button type="button" class="sheet-close" aria-label="إغلاق">${ICONS.close}</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-title-row">
        <h3 class="sheet-name">${item.name}</h3>
        <span class="sheet-price" id="sheetUnitPrice"></span>
      </div>
      <div class="sheet-calories">${ICONS.flame}<span>${item.calories} سعرة حرارية</span></div>
      <p class="sheet-desc">${item.description}</p>

      ${
        hasSizes
          ? `<div class="option-group">
              <p class="option-group-title">الحجم</p>
              <div class="toggle-row" id="sizeToggleRow">
                ${item.sizes
                  .map(
                    (s, i) =>
                      `<button type="button" class="toggle-btn${i === 0 ? " is-active" : ""}" data-size-index="${i}">${s.label}</button>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      ${
        hasOptions
          ? `<div class="option-group">
              <p class="option-group-title">إضافات (اختياري)</p>
              <div class="toggle-row" id="optionToggleRow">
                ${item.options
                  .map(
                    (o, i) =>
                      `<button type="button" class="toggle-btn" data-option-index="${i}">${o.label}<span class="delta">+${o.priceDelta} ${CONFIG.CURRENCY}</span></button>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }

      <div class="option-group">
        <p class="option-group-title">ملاحظات</p>
        <textarea class="notes-field" id="notesField" placeholder="مثال: بدون سكر، حساسية من المكسرات"></textarea>
      </div>

      <div class="qty-row">
        <p class="option-group-title" style="margin:0;">الكمية</p>
        <div class="qty-control">
          <button type="button" id="qtyMinus" aria-label="إنقاص الكمية">−</button>
          <span class="qty-value" id="qtyValue">1</span>
          <button type="button" id="qtyPlus" aria-label="زيادة الكمية">+</button>
        </div>
      </div>

      <button type="button" class="add-to-order-btn" id="addToOrderBtn">
        ${ICONS.basket}<span id="addToOrderLabel"></span>
      </button>
      <p class="sheet-note">الطلب يُرسل مباشرة عبر واتساب للتأكيد عند الاستلام</p>
    </div>`;

  el.itemSheet.querySelector(".sheet-close").addEventListener("click", closeSheet);

  if (hasSizes) {
    el.itemSheet.querySelectorAll("[data-size-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.sheetSizeIndex = Number(btn.dataset.sizeIndex);
        el.itemSheet
          .querySelectorAll("[data-size-index]")
          .forEach((b) => b.classList.toggle("is-active", b === btn));
        updateSheetPrices();
      });
    });
  }

  if (hasOptions) {
    el.itemSheet.querySelectorAll("[data-option-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.optionIndex);
        if (state.sheetOptions.has(i)) state.sheetOptions.delete(i);
        else state.sheetOptions.add(i);
        btn.classList.toggle("is-active");
        updateSheetPrices();
      });
    });
  }

  el.itemSheet.querySelector("#qtyMinus").addEventListener("click", () => {
    if (state.sheetQty > 1) {
      state.sheetQty--;
      updateSheetPrices();
    }
  });
  el.itemSheet.querySelector("#qtyPlus").addEventListener("click", () => {
    if (state.sheetQty < 30) {
      state.sheetQty++;
      updateSheetPrices();
    }
  });

  el.itemSheet.querySelector("#addToOrderBtn").addEventListener("click", addCurrentItemToCart);

  updateSheetPrices();
}

function updateSheetPrices() {
  const unit = currentUnitPrice();
  const total = unit * state.sheetQty;
  el.itemSheet.querySelector("#sheetUnitPrice").textContent = `${unit} ${CONFIG.CURRENCY}`;
  el.itemSheet.querySelector("#qtyValue").textContent = state.sheetQty;
  el.itemSheet.querySelector("#qtyMinus").disabled = state.sheetQty <= 1;
  el.itemSheet.querySelector("#addToOrderLabel").textContent = `إضافة للطلب — ${total} ${CONFIG.CURRENCY}`;
}

function addCurrentItemToCart() {
  const item = state.sheetItem;
  const unit = currentUnitPrice();
  const sizeLabel = item.sizes && item.sizes.length ? item.sizes[state.sheetSizeIndex].label : null;
  const optionLabels = (item.options || []).filter((_, i) => state.sheetOptions.has(i)).map((o) => o.label);
  const notes = el.itemSheet.querySelector("#notesField").value.trim();

  state.cart.push({
    lineId: "c" + Date.now() + Math.random().toString(16).slice(2, 6),
    itemId: item.id,
    name: item.name,
    sizeLabel,
    options: optionLabels,
    notes,
    qty: state.sheetQty,
    unitPrice: unit,
    lineTotal: unit * state.sheetQty,
  });

  persistCart();
  updateCartFab();
  closeSheet();
}

/* =========================================================================
   السلة (واتساب) — سِشن ستوريج فقط
   ========================================================================= */
function persistCart() {
  sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}

function updateCartFab() {
  const count = state.cart.reduce((sum, l) => sum + l.qty, 0);
  const total = state.cart.reduce((sum, l) => sum + l.lineTotal, 0);
  el.cartFabCount.textContent = `${count} ${count === 1 ? "صنف" : "أصناف"}`;
  el.cartFabTotal.textContent = `${total} ${CONFIG.CURRENCY}`;
  el.cartFab.classList.toggle("is-visible", state.cart.length > 0);
  document.body.classList.toggle("has-cart-fab", state.cart.length > 0);
}

el.cartFab.addEventListener("click", () => {
  renderCartSheet();
  openSheet("cart");
});

function renderCartSheet() {
  const total = state.cart.reduce((sum, l) => sum + l.lineTotal, 0);
  el.cartSheet.innerHTML = `
    <div class="sheet-body" style="padding-top:22px;">
      <div class="sheet-title-row">
        <h3 class="sheet-name">مراجعة الطلب</h3>
        <button type="button" class="sheet-close" id="cartCloseBtn" aria-label="إغلاق" style="position:static;background:none;color:var(--teal);width:auto;height:auto;">${ICONS.close}</button>
      </div>
      <div class="cart-lines" id="cartLines"></div>
      <div class="cart-total-row"><span>الإجمالي الكلي</span><span>${total} ${CONFIG.CURRENCY}</span></div>
      <button type="button" class="add-to-order-btn" id="confirmWhatsappBtn">${ICONS.whatsapp}<span>تأكيد الإرسال عبر واتساب</span></button>
      <p class="sheet-note">سيتم فتح واتساب برسالة تحتوي كل تفاصيل طلبك</p>
    </div>`;

  const linesBox = el.cartSheet.querySelector("#cartLines");
  state.cart.forEach((line) => {
    const row = document.createElement("div");
    row.className = "cart-line";
    const detailParts = [];
    if (line.sizeLabel) detailParts.push(line.sizeLabel);
    if (line.options.length) detailParts.push(line.options.join("، "));
    detailParts.push(`الكمية: ${line.qty}`);
    if (line.notes) detailParts.push(`ملاحظة: ${line.notes}`);
    row.innerHTML = `
      <div class="cart-line-info">
        <p class="cart-line-name">${line.name}</p>
        <p class="cart-line-detail">${detailParts.join(" · ")}</p>
      </div>
      <div class="cart-line-right">
        <span class="cart-line-price">${line.lineTotal} ${CONFIG.CURRENCY}</span>
        <button type="button" class="cart-line-remove" data-line-id="${line.lineId}">إزالة</button>
      </div>`;
    linesBox.appendChild(row);
  });

  el.cartSheet.querySelector("#cartCloseBtn").addEventListener("click", closeSheet);
  el.cartSheet.querySelectorAll(".cart-line-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.cart = state.cart.filter((l) => l.lineId !== btn.dataset.lineId);
      persistCart();
      updateCartFab();
      if (state.cart.length === 0) closeSheet();
      else renderCartSheet();
    });
  });
  el.cartSheet.querySelector("#confirmWhatsappBtn").addEventListener("click", sendOrderViaWhatsapp);
}

function sendOrderViaWhatsapp() {
  if (state.cart.length === 0) return;
  const total = state.cart.reduce((sum, l) => sum + l.lineTotal, 0);
  const lines = state.cart
    .map((l, i) => {
      let head = `${i + 1}. ${l.name}`;
      if (l.sizeLabel) head += ` (${l.sizeLabel})`;
      head += ` × ${l.qty}`;
      const extra = [];
      if (l.options.length) extra.push(`إضافات: ${l.options.join("، ")}`);
      if (l.notes) extra.push(`ملاحظات: ${l.notes}`);
      const extraText = extra.length ? "\n   " + extra.join("\n   ") : "";
      return `${head}${extraText}\n   السعر: ${l.lineTotal} ${CONFIG.CURRENCY}`;
    })
    .join("\n\n");

  const message = `مرحبًا، أرغب بطلب التالي من ${CONFIG.RESTAURANT_NAME}:\n\n${lines}\n\nالإجمالي الكلي: ${total} ${CONFIG.CURRENCY}`;
  const url = `https://wa.me/${CONFIG.RESTAURANT_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");

  state.cart = [];
  persistCart();
  updateCartFab();
  closeSheet();
}

/* =========================================================================
   آلية فتح/إغلاق الـ Bottom Sheet (مشتركة بين سلة المنتج وسلة الطلب)
   ========================================================================= */
function openSheet(name) {
  state.lastFocusedEl = document.activeElement;
  el.sheetOverlay.classList.add("is-open");
  const targetEl = name === "item" ? el.itemSheet : el.cartSheet;
  const otherEl = name === "item" ? el.cartSheet : el.itemSheet;
  targetEl.classList.add("is-open");
  targetEl.removeAttribute("aria-hidden");
  otherEl.setAttribute("aria-hidden", "true");
  state.openSheetName = name;
  document.body.style.overflow = "hidden";
  const closeBtn = targetEl.querySelector(".sheet-close");
  if (closeBtn) setTimeout(() => closeBtn.focus(), 300);
}

function closeSheet() {
  el.sheetOverlay.classList.remove("is-open");
  el.itemSheet.classList.remove("is-open");
  el.cartSheet.classList.remove("is-open");
  el.itemSheet.setAttribute("aria-hidden", "true");
  el.cartSheet.setAttribute("aria-hidden", "true");
  state.openSheetName = null;
  document.body.style.overflow = "";
  if (state.lastFocusedEl) state.lastFocusedEl.focus({ preventScroll: true });
}

el.sheetOverlay.addEventListener("click", closeSheet);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.openSheetName) closeSheet();
});

/* =========================================================================
   حالة "مفتوح الآن / مغلق" وجدول ساعات العمل
   ========================================================================= */
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function crossesMidnight(sched) {
  return timeToMinutes(sched.close) <= timeToMinutes(sched.open);
}

function inRange(minutesNow, sched) {
  const open = timeToMinutes(sched.open);
  const close = timeToMinutes(sched.close);
  if (crossesMidnight(sched)) return minutesNow >= open || minutesNow < close;
  return minutesNow >= open && minutesNow < close;
}

function formatTime12(t) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "مساءً" : "صباحًا";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function updateOpenStatus() {
  const now = new Date();
  const day = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  const today = CONFIG.WORKING_HOURS[day];
  const prevDay = (day + 6) % 7;
  const prev = CONFIG.WORKING_HOURS[prevDay];

  let isOpen = inRange(minutesNow, today);
  let relevantSchedule = today;
  if (!isOpen && crossesMidnight(prev) && minutesNow < timeToMinutes(prev.close)) {
    isOpen = true;
    relevantSchedule = prev;
  }

  el.statusDot.classList.toggle("is-open", isOpen);
  el.statusState.textContent = isOpen ? "مفتوح الآن" : "مغلق الآن";
  el.statusHours.textContent = isOpen
    ? `يغلق ${formatTime12(relevantSchedule.close)}`
    : `يفتح ${formatTime12(today.open)}`;
}

function buildHoursTable() {
  const today = new Date().getDay();
  el.hoursTable.innerHTML = CONFIG.WORKING_HOURS.map((d) => {
    const isToday = d.day === today;
    return `<tr class="${isToday ? "is-today" : ""}">
      <td>${d.label}</td>
      <td>${formatTime12(d.open)} – ${formatTime12(d.close)}</td>
    </tr>`;
  }).join("");
}

/* ============ روابط التواصل ============ */
function setupContactLinks() {
  el.callBtn.href = `tel:${CONFIG.CALL_PHONE}`;
  el.mapBtn.href = CONFIG.MAPS_URL;
  el.instaBtn.href = CONFIG.INSTAGRAM_URL;
  el.snapBtn.href = CONFIG.SNAPCHAT_URL;
}

/* ============ التشغيل ============ */
document.addEventListener("DOMContentLoaded", async () => {
  applyViewMode(localStorage.getItem(VIEW_STORAGE_KEY) === "list" ? "list" : "grid");
  await loadConfigAndSections();
  updateFavCount();
  updateOpenStatus();
  buildHoursTable();
  setupContactLinks();
  updateCartFab();
  loadMenu();
});