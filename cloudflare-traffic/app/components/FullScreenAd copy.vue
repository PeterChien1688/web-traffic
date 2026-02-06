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
const isVideoEnded = ref(false);
const currentVideoSrc = ref("");
const videoRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = async () => {
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();

  if (lastWatchedTime && now - parseInt(lastWatchedTime) < AD_COOLDOWN) {
    return;
  }

  isVideoEnded.value = false;

  const width = window.innerWidth;
  const height = window.innerHeight;
  currentVideoSrc.value = width >= height ? landscapeVideo : portraitVideo;

  isOpen.value = true;
  localStorage.setItem("ad_watched_time", now.toString());

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

// --- 動作：影片播放結束 ---
const onVideoEnded = () => {
  isVideoEnded.value = true;
};

// --- 動作：關閉廣告 ---
const closeAd = () => {
  isOpen.value = false;
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
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 2;
}

/* --- 關閉按鈕樣式 --- */
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

  background: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.8);

  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  /* 【修改點 1】加快動畫速度，從 3s 改為 2s */
  animation: pulse-white 2s infinite;
}

.close-btn:hover {
  background-color: #ffffff;
  color: #000000;
  /* 滑鼠經過時的光暈也同步加強 */
  box-shadow: 0 6px 30px rgba(255, 255, 255, 0.8);
  transform: scale(1.05);
}

/* --- 【修改點 2】加強呼吸燈動畫關鍵影格 --- */
@keyframes pulse-white {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  50% {
    /* 加大縮放比例：從 1.05 改為 1.12 (放大 12%) */
    transform: scale(1.12);
    /* 加強光暈：透明度從 0.4 改為 0.75 (更亮)，擴散範圍從 25px 改為 35px (更廣) */
    box-shadow: 0 10px 35px rgba(255, 255, 255, 0.75);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
}

/* 導購按鈕樣式 (保持不變) */
.cta-wrapper {
  position: absolute;
  bottom: 33%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  width: 100%;
  display: flex;
  justify-content: center;
}
.cta-btn {
  display: inline-block;
  padding: 15px 40px;
  background-color: #fff;
  color: #000;
  font-size: 1.2rem;
  font-weight: bold;
  text-decoration: none;
  border-radius: 50px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  opacity: 0;
  animation: slideUpFade 0.8s ease-out forwards;
  transition:
    transform 0.2s,
    background-color 0.2s;
}
.cta-btn:hover {
  background-color: #f0f0f0;
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
</style>
