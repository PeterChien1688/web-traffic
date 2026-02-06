<template>
  <ClientOnly>
    <div
      ref="containerRef"
      class="video-container"
      :class="{ 'is-open': isOpen }"
    >
      <button class="close-btn" @click="closeAd" aria-label="關閉廣告">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
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
          class="cta-btn"
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
const isVideoEnded = ref(false); // 【新增】控制按鈕顯示的狀態
const currentVideoSrc = ref("");
const videoRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = async () => {
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();

  // 檢查冷卻時間
  if (lastWatchedTime && now - parseInt(lastWatchedTime) < AD_COOLDOWN) {
    return;
  }

  // 重置狀態 (重要！因為元件可能沒被銷毀)
  isVideoEnded.value = false;

  // 1. 決定影片來源
  const width = window.innerWidth;
  const height = window.innerHeight;
  currentVideoSrc.value = width >= height ? landscapeVideo : portraitVideo;

  // 2. 開啟視窗
  isOpen.value = true;
  localStorage.setItem("ad_watched_time", now.toString());

  // 3. 播放邏輯
  await nextTick();
  if (videoRef.value) {
    const video = videoRef.value;
    video.muted = true;
    video.playsInline = true;
    video.load();

    setTimeout(() => {
      video.play().catch(() => video.play().catch(() => {}));
    }, 150);
  }
};

// --- 【新增】動作：影片播放結束 ---
const onVideoEnded = () => {
  console.log("影片播放完畢，顯示按鈕");
  isVideoEnded.value = true;
  // 注意：這裡不再呼叫 closeAd()，視窗會保持開啟
};

// --- 動作：關閉廣告 ---
const closeAd = () => {
  isOpen.value = false;
  // 關閉時也要重置按鈕狀態，避免下次開啟時按鈕還在
  setTimeout(() => {
    isVideoEnded.value = false;
    if (videoRef.value) videoRef.value.pause();
  }, 600);
};

// --- 響應式處理 ---
const handleResize = () => {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const targetSrc = width >= height ? landscapeVideo : portraitVideo;

  if (currentVideoSrc.value !== targetSrc) {
    currentVideoSrc.value = targetSrc;
    // 只有當廣告開啟且影片還沒播完時，才自動重載播放
    // 如果影片已經播完並顯示按鈕了，就不要再重整影片，以免按鈕消失
    if (isOpen.value && videoRef.value && !isVideoEnded.value) {
      videoRef.value.load();
      videoRef.value.play().catch(() => {});
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
/* 原有樣式保持不變 */
.video-container {
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
}
.video-container.is-open {
  transform: scale(1);
  opacity: 1;
  pointer-events: auto;
}
.bg-video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 100%;
  min-height: 100%;
  width: auto;
  height: auto;
  object-fit: cover;
  z-index: 1;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3); /* 稍微加深遮罩，讓按鈕更凸顯 */
  pointer-events: none;
  z-index: 2;
}
.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 20;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  animation: pulse-red 2.5s infinite;
}
.close-btn:hover {
  background-color: rgba(220, 20, 60, 0.8);
  color: white;
  box-shadow: 0 6px 20px rgba(220, 20, 60, 0.5);
}

/* --- 【新增樣式】導購按鈕 --- */
.cta-wrapper {
  position: absolute;
  /* bottom: 33% 代表位於下方三分之一處 
     left: 50% + translate(-50%) 確保水平置中
  */
  bottom: 33%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30; /* 確保在影片和遮罩之上 */
  width: 100%;
  display: flex;
  justify-content: center;
}

.cta-btn {
  display: inline-block;
  padding: 15px 40px;
  background-color: #fff; /* 白底 */
  color: #000; /* 黑字 */
  font-size: 1.2rem;
  font-weight: bold;
  text-decoration: none;
  border-radius: 50px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);

  /* 進場動畫 */
  opacity: 0;
  animation: slideUpFade 0.8s ease-out forwards;
  transition:
    transform 0.2s,
    background-color 0.2s;
}

.cta-btn:hover {
  background-color: #f0f0f0;
  transform: scale(1.05); /* 滑鼠經過稍微放大 */
}

/* 按鈕進場動態效果：從下方滑入並浮現 */
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

@keyframes pulse-red {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 8px 25px rgba(220, 20, 60, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
}
</style>
