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

      <div v-if="isVideoEnded" class="cta-wrapper">
        <a
          href="https://wisdomhall.com.tw/tw/magazine_inpage.php?id=104"
          target="_blank"
          class="cta-button"
        >
          至50期雜誌 ➔
        </a>
      </div>

      <video
        ref="videoRef"
        muted
        autoplay
        playsinline
        class="bg-video"
        @ended="onVideoEnded"
      >
        <source :src="currentVideoSrc" type="video/mp4" />
      </video>

      <div class="overlay"></div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";

// --- 設定區 ---
const landscapeVideo = "/videos/landscape.mp4";
const portraitVideo = "/videos/portrait.mp4";
const AD_COOLDOWN = 1000 * 60 * 30; // 30 分鐘冷卻時間

// --- 狀態 ---
const isOpen = ref(false);
const isVideoEnded = ref(false); // 控制按鈕顯示
const currentVideoSrc = ref("");
const videoRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = async () => {
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();

  // 檢查冷卻時間 (若不需要限制可註解掉)
  if (lastWatchedTime && now - parseInt(lastWatchedTime) < AD_COOLDOWN) {
    return;
  }

  // 重置狀態
  isVideoEnded.value = false;

  // 1. 決定影片來源 (橫式/直式)
  const width = window.innerWidth;
  const height = window.innerHeight;
  currentVideoSrc.value = width >= height ? landscapeVideo : portraitVideo;

  // 2. 開啟視窗
  isOpen.value = true;
  localStorage.setItem("ad_watched_time", now.toString());

  // 3. 等待 DOM 更新後播放
  await nextTick();
  if (videoRef.value) {
    const video = videoRef.value;
    video.muted = true;
    video.playsInline = true;
    video.load(); // 重要：重新載入來源

    setTimeout(() => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("自動播放受阻，嘗試再次播放:", e);
          // 再次嘗試
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    }, 150);
  }
};

// --- 動作：影片播放結束 ---
const onVideoEnded = () => {
  console.log("影片播放完畢，顯示按鈕");
  isVideoEnded.value = true;
};

// --- 動作：關閉廣告 ---
const closeAd = () => {
  isOpen.value = false;
  // 關閉後稍等動畫結束再暫停影片
  setTimeout(() => {
    isVideoEnded.value = false;
    if (videoRef.value) videoRef.value.pause();
  }, 600);
};

// --- 響應式處理：視窗大小改變時切換影片 ---
const handleResize = () => {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const targetSrc = width >= height ? landscapeVideo : portraitVideo;

  if (currentVideoSrc.value !== targetSrc) {
    currentVideoSrc.value = targetSrc;

    // 如果廣告開啟中且影片還沒播完，才重新載入播放
    if (isOpen.value && videoRef.value && !isVideoEnded.value) {
      videoRef.value.load();
      videoRef.value.play().catch(() => {});
    }
  }
};

onMounted(() => {
  // 延遲 0.5 秒開啟，避免一進站就太突兀
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
}

.ad-container.is-open {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}

/* 影片本體 */
.bg-video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  object-fit: cover; /* 確保滿版 */
  z-index: 1;
}

/* 遮罩層 (加強按鈕對比度) */
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

/* --- 關閉按鈕樣式 (電腦版預設) --- */
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

  /* 強制 GPU 加速，防止閃爍 */
  transform: translateZ(0);
  will-change: transform;
}

/* SVG 大小控制 */
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

/* --- CTA 按鈕樣式 --- */
.cta-wrapper {
  position: absolute;
  bottom: 33%; /* 畫面下方 1/3 處 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 30; /* 比 overlay 高 */
  width: 100%;
  display: flex;
  justify-content: center;
}

.cta-button {
  display: inline-block;
  padding: 1.5vh 4vh;
  font-size: 2.5vh; /* 相對單位，手機上也會自動調整 */
  font-weight: bold;
  color: #ffbf00; /* 配合之前的金色主題 */
  border: 2px solid #ffbf00;
  text-decoration: none;
  letter-spacing: 2px;
  background: rgba(0, 0, 0, 0.6); /* 半透明黑底，讓字更清楚 */
  border-radius: 50px;
  cursor: pointer;

  /* 進場動畫 */
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

/* --- 手機版優化 (寬度 < 768px) --- */
@media screen and (max-width: 768px) {
  /* 1. 縮小關閉按鈕並移除複雜效果 */
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

  /* 2. 縮小圖示 */
  .close-btn svg {
    width: 20px;
    height: 20px;
  }

  /* 3. 簡化呼吸動畫 */
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

  /* 4. 調整 CTA 按鈕在手機上的位置與大小 */
  .cta-wrapper {
    bottom: 25%; /* 手機版稍微往下移一點 */
  }
  .cta-button {
    padding: 12px 30px;
    font-size: 18px;
  }
}
</style>
