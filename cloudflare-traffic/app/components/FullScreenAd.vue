<template>
  <ClientOnly>
    <div
      class="ad-container"
      :class="{
        'is-open': isOpen,
        'is-landscape': isLandscape,
        'is-portrait': !isLandscape,
      }"
    >
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

      <div v-if="isVideoEnded" class="cta-wrapper">
        <a :href="adConfig.ctaUrl" target="_blank" class="cta-button">
          至50期雜誌 ➔
        </a>
      </div>

      <div v-if="!isVideoReady" class="loading-spinner"></div>

      <video
        ref="videoRef"
        muted
        playsinline
        preload="auto"
        class="bg-video"
        :class="{ 'is-ready': isVideoReady }"
        @ended="onVideoEnded"
        @canplay="onCanPlay"
      >
        <source :src="currentVideoSrc" type="video/mp4" />
      </video>

      <div class="overlay"></div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

// --- 預設值 (4 支影片版本) ---
const defaultConfig = {
  landscapeVideoDesktop: "/videos/landscape_desktop.mp4",
  portraitVideoDesktop: "/videos/portrait_desktop.mp4",
  landscapeVideoMobile: "/videos/landscape_mobile.mp4",
  portraitVideoMobile: "/videos/portrait_mobile.mp4",
  cooldownMinutes: 30,
  ctaUrl: "https://wisdomhall.com.tw/tw/magazine_inpage.php?id=104",
};

// --- 狀態控制 ---
const isOpen = ref(false);
const isVideoEnded = ref(false);
const isVideoReady = ref(false); // 影片是否已經緩衝完畢可播放
const currentVideoSrc = ref("");
const videoRef = ref(null);
const adConfig = ref({ ...defaultConfig });
const isLandscape = ref(true);

// --- 讀取外部 JSON 設定 ---
const loadConfig = async () => {
  try {
    const response = await fetch("/ad-config.json");
    if (response.ok) {
      const data = await response.json();
      adConfig.value = {
        landscapeVideoDesktop:
          data.landscapeVideoDesktop || defaultConfig.landscapeVideoDesktop,
        portraitVideoDesktop:
          data.portraitVideoDesktop || defaultConfig.portraitVideoDesktop,
        landscapeVideoMobile:
          data.landscapeVideoMobile || defaultConfig.landscapeVideoMobile,
        portraitVideoMobile:
          data.portraitVideoMobile || defaultConfig.portraitVideoMobile,
        cooldownMinutes: data.cooldownMinutes || defaultConfig.cooldownMinutes,
        ctaUrl: data.ctaUrl || defaultConfig.ctaUrl,
      };
    }
  } catch (e) {
    console.warn("讀取廣告設定失敗，使用預設值", e);
  }
};

// --- 判斷應該載入哪一支影片 ---
const getTargetVideoSrc = (width, height) => {
  const isCurrentlyLandscape = width >= height;
  const isDesktop = width >= 1024; // 1024px 為電腦/平板分水嶺

  if (isDesktop) {
    return isCurrentlyLandscape
      ? adConfig.value.landscapeVideoDesktop
      : adConfig.value.portraitVideoDesktop;
  } else {
    return isCurrentlyLandscape
      ? adConfig.value.landscapeVideoMobile
      : adConfig.value.portraitVideoMobile;
  }
};

// --- 開啟廣告邏輯 ---
const openAd = async () => {
  await loadConfig();

  // 檢查冷卻時間
  const cooldownMs = adConfig.value.cooldownMinutes * 60 * 1000;
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();

  if (lastWatchedTime && now - parseInt(lastWatchedTime) < cooldownMs) {
    return;
  }

  // 重置所有狀態
  isVideoEnded.value = false;
  isVideoReady.value = false;

  const width = window.innerWidth;
  const height = window.innerHeight;
  isLandscape.value = width >= height;

  // 取得對應解析度的影片
  currentVideoSrc.value = getTargetVideoSrc(width, height);

  isOpen.value = true;
  localStorage.setItem("ad_watched_time", now.toString());

  // 觸發影片預載入
  await nextTick();
  if (videoRef.value) {
    const video = videoRef.value;
    video.muted = true;
    video.playsInline = true;
    video.load(); // 這裡不直接 play()，交給 onCanPlay 處理
  }
};

// --- 當影片緩衝足夠，準備好播放時觸發 ---
const onCanPlay = () => {
  if (videoRef.value && isOpen.value) {
    isVideoReady.value = true; // 狀態改為 ready，觸發畫面漸顯並隱藏 spinner
    videoRef.value.play().catch((e) => {
      console.warn("自動播放受阻:", e);
    });
  }
};

// --- 影片結束時觸發 ---
const onVideoEnded = () => {
  isVideoEnded.value = true;
};

// --- 關閉廣告邏輯 ---
const closeAd = () => {
  isOpen.value = false;
  setTimeout(() => {
    isVideoEnded.value = false;
    isVideoReady.value = false;
    if (videoRef.value) videoRef.value.pause();
  }, 600);
};

// --- 視窗縮放處理 ---
const handleResize = () => {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  isLandscape.value = width >= height;

  const targetSrc = getTargetVideoSrc(width, height);

  // 如果跨越了斷點或轉向導致需要換影片，才重新載入
  if (currentVideoSrc.value !== targetSrc) {
    currentVideoSrc.value = targetSrc;
    if (isOpen.value && videoRef.value && !isVideoEnded.value) {
      isVideoReady.value = false; // 換片時先退回 Loading 狀態
      videoRef.value.load();
      // play() 會在 onCanPlay 再次被觸發
    }
  }
};

onMounted(() => {
  setTimeout(() => {
    openAd();
  }, 500);
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.ad-container.is-open {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}

/* 影片本體 (預設透明度為 0) */
.bg-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

/* 當影片 Ready 時平滑浮現 */
.bg-video.is-ready {
  opacity: 1;
}

/* 載入中動畫 Spinner */
.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 191, 0, 0.2);
  border-top-color: #ffbf00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  z-index: 10;
}

@keyframes spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 遮罩層 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 2;
}

/* 關閉按鈕 */
.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 200;
  width: 56px;
  height: 56px;
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

/* --- 按鈕位置設定 --- */
.cta-wrapper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  width: 100%;
  display: flex;
  justify-content: center;
  transition: bottom 0.3s ease;
}

/* 橫式 (Landscape)：按鈕靠下 */
.ad-container.is-landscape .cta-wrapper {
  bottom: 12%;
}

/* 直式 (Portrait)：按鈕偏高 */
.ad-container.is-portrait .cta-wrapper {
  bottom: 25%;
}

.cta-button {
  display: inline-block;
  padding: 1.5vh 4vh;
  font-size: 2.5vh;
  font-weight: bold;
  color: #ffbf00;
  border: 2px solid #ffbf00;
  text-decoration: none;
  letter-spacing: 2px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50px;
  cursor: pointer;
  opacity: 0;
  animation: slideUpFade 0.8s ease-out forwards;
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.cta-button:hover {
  background: #ffbf00;
  color: #000;
  box-shadow: 0 0 20px rgba(255, 191, 0, 0.6);
  transform: scale(1.05);
}

@keyframes slideUpFade {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 手機版優化 (< 768px) */
@media screen and (max-width: 768px) {
  .bg-video {
    object-fit: cover;
  }

  .close-btn {
    width: 40px;
    height: 40px;
    top: 20px;
    right: 20px;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .close-btn svg {
    width: 20px;
    height: 20px;
  }

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

  /* 手機直式微調：如果覺得太高可調低 */
  .ad-container.is-portrait .cta-wrapper {
    bottom: 22%;
  }

  .cta-button {
    padding: 12px 30px;
    font-size: 18px;
  }
}
</style>
