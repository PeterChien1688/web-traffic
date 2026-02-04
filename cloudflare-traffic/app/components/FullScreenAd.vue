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

      <video
        ref="videoRef"
        muted
        autoplay
        playsinline
        class="bg-video"
        @ended="closeAd"
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

// 【設定】廣告冷卻時間 (毫秒)
// 1000 * 60 * 30 = 30 分鐘
// 1000 * 60 * 60 = 1 小時
// 如果您希望測試方便，可以先設為 1000 * 10 (10秒)
const AD_COOLDOWN = 1000 * 60 * 30; // 30 分鐘內不重複顯示

// --- 狀態 ---
const isOpen = ref(false);
const currentVideoSrc = ref("");
const videoRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = async () => {
  // 【修改重點】改用 localStorage 加上時間判斷
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();

  // 如果有紀錄，且現在時間 - 上次時間 小於 冷卻時間，就不顯示
  if (lastWatchedTime && now - parseInt(lastWatchedTime) < AD_COOLDOWN) {
    console.log(
      `廣告還在冷卻時間內，剩餘 ${(AD_COOLDOWN - (now - parseInt(lastWatchedTime))) / 1000} 秒`,
    );
    return;
  }

  // --- 以下流程不變 ---

  // 1. 決定影片來源
  const width = window.innerWidth;
  const height = window.innerHeight;
  currentVideoSrc.value = width >= height ? landscapeVideo : portraitVideo;

  // 2. 開啟視窗
  isOpen.value = true;

  // 3. 【修改重點】紀錄「現在的時間」到 localStorage (永久儲存直到手動清除)
  localStorage.setItem("ad_watched_time", now.toString());

  // 4. 等待 DOM 更新後播放
  await nextTick();

  if (videoRef.value) {
    const video = videoRef.value;
    video.muted = true;
    video.playsInline = true;
    video.load();

    setTimeout(() => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 失敗重試
          video.play().catch(() => {});
        });
      }
    }, 150);
  }
};

// --- 動作：關閉廣告 ---
const closeAd = () => {
  isOpen.value = false;
  setTimeout(() => {
    if (videoRef.value) videoRef.value.pause();
  }, 600);
};

// --- 響應式：視窗大小改變時 ---
const handleResize = () => {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const targetSrc = width >= height ? landscapeVideo : portraitVideo;

  if (currentVideoSrc.value !== targetSrc) {
    currentVideoSrc.value = targetSrc;
    if (isOpen.value && videoRef.value) {
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
/* 樣式保持不變 */
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
  background: rgba(0, 0, 0, 0.1);
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
