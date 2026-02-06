<template>
  <ClientOnly>
    <div class="ad-container" :class="{ 'is-open': isOpen }">
      <button class="close-btn" @click="closeAd" aria-label="關閉廣告">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 6L6 18"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M6 6L18 18"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div id="stage">
        <div ref="gridContainerRef" id="grid-container">
          <div ref="bgGuideLayerRef" id="bg-guide-layer"></div>
          <div ref="finalLayerRef" id="final-perfect-layer"></div>
        </div>
      </div>

      <div
        id="ad-overlay"
        :style="{ pointerEvents: isBtnVisible ? 'auto' : 'none' }"
      >
        <div ref="darkMaskRef" id="dark-mask"></div>

        <div class="text-container">
          <div class="ad-line line-main" id="text1">閱讀理解雜誌</div>

          <div class="list-group">
            <div class="ad-line line-list" id="text2">50 期專業內容</div>
            <div class="ad-line line-list" id="text3">50+ 位跨領域專家</div>
            <div class="ad-line line-list" id="text4">1,000 篇嚴選文本</div>
            <div class="ad-line line-list" id="text5">5,000+ 天的深耕</div>
            <div class="ad-line line-list" id="text6">1,500 萬字 的淬鍊</div>
          </div>

          <div class="ad-line line-footer" id="text7">
            陪伴 45 萬名師生累積知識的厚度<br />
            這一切在數位學習系統都看得到
          </div>

          <a
            href="https://wisdomhall.com.tw/tw/magazine_inpage.php?id=104"
            target="_blank"
            class="cta-button"
            :class="{ visible: isBtnVisible }"
          >
            至50期雜誌 ➔
          </a>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted } from "vue";

// --- 設定區 ---
const AD_COOLDOWN = 1000 * 60 * 30; // 30分鐘冷卻
const CONFIG = {
  mainImg: "/main.jpg",
  totalCards: 49,
  startSizeRatio: 0.5,
  flyInterval: 80,
  opacityDuration: 0.3,
  waitBeforeBg: 300,
  waitBeforeFlip: 1000,
  flipInterval: 40,
  waitBeforeText: 800,
  textStep: 400,
  ellipseRatio: 0.35,
};

// --- Vue Refs ---
const isOpen = ref(false);
const isBtnVisible = ref(false);
const gridContainerRef = ref(null);
const bgGuideLayerRef = ref(null);
const finalLayerRef = ref(null);
const darkMaskRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = async () => {
  // Session / LocalStorage 檢查
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();
  if (lastWatchedTime && now - parseInt(lastWatchedTime) < AD_COOLDOWN) {
    return;
  }

  isOpen.value = true;
  localStorage.setItem("ad_watched_time", now.toString());

  try {
    const mainImgObj = await loadImage(CONFIG.mainImg);

    // 設定背景
    if (bgGuideLayerRef.value)
      bgGuideLayerRef.value.style.backgroundImage = `url(${CONFIG.mainImg})`;
    if (finalLayerRef.value)
      finalLayerRef.value.style.backgroundImage = `url(${CONFIG.mainImg})`;

    // 開始初始化場景
    initScene(mainImgObj);
  } catch (e) {
    console.error("圖片載入失敗，請確認 public 資料夾", e);
  }
};

// --- 動作：關閉廣告 ---
const closeAd = () => {
  isOpen.value = false;
};

// --- 動畫核心邏輯 ---
const initScene = (mainImgObj) => {
  if (!gridContainerRef.value) return;

  // 清空舊的卡片
  const oldCards = gridContainerRef.value.querySelectorAll(".card");
  oldCards.forEach((el) => el.remove());

  // 計算尺寸
  const imgRatio = mainImgObj.width / mainImgObj.height;
  const maxW = window.innerWidth * 0.9;
  const maxH = window.innerHeight * 0.9;
  let w = maxW,
    h = w / imgRatio;
  if (h > maxH) {
    h = maxH;
    w = h * imgRatio;
  }

  // 設定容器尺寸
  gridContainerRef.value.style.width = `${w}px`;
  gridContainerRef.value.style.height = `${h}px`;

  const cols = 7,
    rows = 7;
  const cardW = w / cols,
    cardH = h / rows;
  const startScale = (w * CONFIG.startSizeRatio) / cardW;

  // 判斷是否為手機，決定要讀取哪一個資料夾的圖片
  const isMobile = window.innerWidth < 768;
  const folderName = isMobile ? "mobile" : "desktop";

  // 建立 49 張卡片
  for (let i = 0; i < CONFIG.totalCards; i++) {
    const r = Math.floor(i / cols),
      c = i % cols;
    const card = document.createElement("div");
    card.className = "card";
    card.style.width = `${cardW}px`;
    card.style.height = `${cardH}px`;

    const targetX = c * cardW,
      targetY = r * cardH;
    card.style.left = `${targetX}px`;
    card.style.top = `${targetY}px`;

    const angle = Math.random() * Math.PI * 2;
    const startX = w / 2 + w * 0.4 * Math.cos(angle);
    const startY = h / 2 + h * 0.4 * Math.sin(angle);

    // 加上 translateZ(0) 啟用硬體加速
    card.style.transform = `translate3d(${startX - targetX - cardW / 2}px, ${startY - targetY - cardH / 2}px, 800px) scale(${startScale})`;

    const flipper = document.createElement("div");
    flipper.className = "flipper";

    const front = document.createElement("div");
    front.className = "front";

    // 動態路徑
    const imgIndex = (i + 1).toString().padStart(3, "0");
    const tileUrl = `/tiles/${folderName}/${imgIndex}.jpg`;

    front.style.backgroundImage = `url(${tileUrl})`;

    const back = document.createElement("div");
    back.className = "back";
    back.style.backgroundImage = `url(${CONFIG.mainImg})`;
    back.style.backgroundSize = `${w}px ${h}px`;
    back.style.backgroundPosition = `-${targetX}px -${targetY}px`;

    flipper.appendChild(front);
    flipper.appendChild(back);
    card.appendChild(flipper);
    gridContainerRef.value.appendChild(card);
  }

  runAnimationSequence();
};

const runAnimationSequence = () => {
  const cards = gridContainerRef.value.querySelectorAll(".card");

  // 1. 飛行歸位
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.add("visible");
      card.style.transform = `translate3d(0, 0, 0) scale(1)`;
    }, i * CONFIG.flyInterval);
  });

  const flyCompleteTime = (cards.length - 1) * CONFIG.flyInterval + 1200;

  setTimeout(() => {
    // 2. 顯示背景
    if (bgGuideLayerRef.value) bgGuideLayerRef.value.classList.add("visible");

    setTimeout(() => {
      // 3. 翻牌
      let indices = Array.from({ length: cards.length }, (_, k) => k);
      shuffleArray(indices);

      indices.forEach((cardIndex, i) => {
        setTimeout(() => {
          if (cards[cardIndex]) cards[cardIndex].classList.add("flipped");
        }, i * CONFIG.flipInterval);
      });

      // 4. 文字進場
      setTimeout(
        () => {
          if (finalLayerRef.value) finalLayerRef.value.classList.add("visible");
          setTimeout(showTextSequence, CONFIG.waitBeforeText);
        },
        cards.length * CONFIG.flipInterval * 0.8,
      );
    }, CONFIG.waitBeforeFlip);
  }, flyCompleteTime + CONFIG.waitBeforeBg);
};

const showTextSequence = () => {
  if (darkMaskRef.value) darkMaskRef.value.style.opacity = "1";

  for (let i = 1; i <= 7; i++) {
    setTimeout(
      () => {
        const el = document.getElementById(`text${i}`);
        if (el) el.classList.add("visible");
      },
      (i - 1) * CONFIG.textStep,
    );
  }

  setTimeout(
    () => {
      isBtnVisible.value = true;
    },
    6 * CONFIG.textStep + 600,
  );
};

const shuffleArray = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
};

const loadImage = (src) => {
  return new Promise((r, j) => {
    const i = new Image();
    i.crossOrigin = "Anonymous";
    i.onload = () => r(i);
    i.onerror = () => j(src);
    i.src = src;
  });
};

onMounted(() => {
  setTimeout(() => {
    openAd();
  }, 500);
});
</script>

<style scoped>
/* 全版容器 */
.ad-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100dvh;
  background-color: #000;
  z-index: 9999;

  transform: scale(0);
  opacity: 0;
  transform-origin: center center;
  transition:
    transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease-out;
  pointer-events: none;

  overflow: hidden;
  font-family: "PingFang TC", "Microsoft JhengHei", sans-serif;
  perspective: 2000px;
}

.ad-container.is-open {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}

/* 舞台 */
#stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

#grid-container {
  position: relative;
  transform-style: preserve-3d;
}

#bg-guide-layer,
#final-perfect-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 100% 100%;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease;
}
#bg-guide-layer.visible,
#final-perfect-layer.visible {
  opacity: 1;
}
#final-perfect-layer {
  z-index: 50;
  pointer-events: none;
}

/* --- 卡片樣式 --- */
:deep(.card) {
  position: absolute;
  transform-style: preserve-3d;
  will-change: transform, opacity;
  transition:
    transform 1.2s cubic-bezier(0.165, 0.84, 0.44, 1),
    opacity 0.3s ease;
  opacity: 0;
  z-index: 10;
}
:deep(.card.visible) {
  opacity: 1;
}

:deep(.flipper) {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
}
:deep(.card.flipped .flipper) {
  transform: rotateY(180deg);
}

:deep(.front),
:deep(.back) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

:deep(.front) {
  background-size: cover;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

:deep(.back) {
  transform: rotateY(180deg);
  width: 100.5%;
  height: 100.5%;
  left: -0.25%;
  top: -0.25%;
}

/* --- 文字層 --- */
#ad-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

#dark-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  opacity: 0;
  transition: opacity 1.5s ease;
}

.text-container {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 800px;
  text-align: center;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ad-line {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}
.ad-line.visible {
  opacity: 1;
  transform: translateY(0);
}

.line-main {
  font-size: 7vh;
  font-weight: 900;
  color: #ffbf00;
  margin-bottom: 4vh;
  letter-spacing: 5px;
}
.list-group {
  display: inline-block;
  text-align: left;
  margin: 0 auto;
}
.line-list {
  font-size: 3.2vh;
  font-weight: 500;
  margin: 1.2vh 0;
  letter-spacing: 2px;
  border-left: 3px solid #ffbf00;
  padding-left: 15px;
}
.line-footer {
  font-size: 2.4vh;
  font-weight: 400;
  color: #ccc;
  margin-top: 5vh;
  line-height: 1.6;
  letter-spacing: 1px;
}

/* --- 關閉按鈕 (電腦版預設) --- */
.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 200;
  width: 56px;
  height: 56px; /* 電腦版大小 */
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  animation: pulse-white 2s infinite;
  transform: translateZ(0);
  will-change: transform;
}

/* 【修改 2】SVG 圖示大小由 CSS 控制 */
.close-btn svg {
  width: 28px;
  height: 28px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background-color: #ffffff;
  color: #000000;
  box-shadow: 0 6px 30px rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
}

@keyframes pulse-white {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.12);
    box-shadow: 0 10px 35px rgba(255, 255, 255, 0.75);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
}

/* --- CTA 按鈕 --- */
.cta-button {
  display: inline-block;
  margin-top: 5vh;
  padding: 1.5vh 4vh;
  font-size: 2.5vh;
  font-weight: bold;
  color: #ffbf00;
  border: 2px solid #ffbf00;
  text-decoration: none;
  letter-spacing: 2px;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;

  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.cta-button.visible {
  opacity: 1;
  transform: translateY(0);
}

.cta-button:hover {
  background: #ffbf00;
  color: #000;
  box-shadow: 0 0 15px rgba(255, 191, 0, 0.6);
}

/* --- 【修改 3】手機版 (寬度 < 768px) 強制優化與調整 --- */
@media screen and (max-width: 768px) {
  /* 1. 移除卡片陰影 (效能優化) */
  :deep(.front) {
    box-shadow: none !important;
    border: 0.5px solid rgba(255, 255, 255, 0.1);
  }

  /* 2. 縮小關閉按鈕並移除毛玻璃 (效能與尺寸優化) */
  .close-btn {
    width: 40px; /* 縮小按鈕容器 */
    height: 40px;
    top: 20px; /* 調整位置 */
    right: 20px;
    backdrop-filter: none !important; /* 移除毛玻璃 */
    -webkit-backdrop-filter: none !important;
    background: rgba(255, 255, 255, 0.95); /* 提高不透明度 */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); /* 簡化陰影 */
  }

  /* 3. 縮小 SVG 圖示 */
  .close-btn svg {
    width: 20px;
    height: 20px;
  }

  /* 4. 簡化手機版呼吸燈 (減少重繪區域) */
  @keyframes pulse-white {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.9;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* 5. 微調文字大小 (避免手機上過大) */
  .line-main {
    font-size: 5vh;
    margin-bottom: 3vh;
  }
  .line-list {
    font-size: 2.5vh;
    margin: 1vh 0;
  }
}
</style>
