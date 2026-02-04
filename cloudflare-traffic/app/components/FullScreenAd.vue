<template>
  <ClientOnly>
    <div
      ref="containerRef"
      class="video-container"
      :class="{ 'is-open': isOpen }"
    >
      <button class="close-btn" @click="closeAd">✕</button>

      <div v-if="isMuted && isOpen" class="unmute-overlay">
        <button class="unmute-btn" @click="unmuteVideo">🔊 點擊開啟聲音</button>
      </div>

      <video ref="videoRef" muted playsinline class="bg-video" @ended="closeAd">
        <source :src="currentVideoSrc" type="video/mp4" />
      </video>

      <div class="overlay"></div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// --- 設定區 ---
const landscapeVideo = "/videos/landscape.mp4";
const portraitVideo = "/videos/portrait.mp4";

// --- 狀態 ---
const isOpen = ref(false);
const isMuted = ref(true);
const currentVideoSrc = ref("");
const videoRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = () => {
  // 1. Session 檢查：如果已經看過，就完全不執行後續動作
  if (sessionStorage.getItem("ad_watched")) {
    console.log("廣告本次 Session 已播放過，不再彈出");
    return;
  }

  // 2. 決定影片來源 (初始化)
  updateVideoSrc();

  // 3. 開啟視窗
  isOpen.value = true;

  // 4. 標記已讀
  sessionStorage.setItem("ad_watched", "true");

  // 5. 強制靜音並播放
  setTimeout(() => {
    if (videoRef.value) {
      const video = videoRef.value;

      // 設定屬性確保自動播放
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.currentTime = 0;
      isMuted.value = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => console.warn("自動播放受阻:", e));
      }
    }
  }, 100);
};

// --- 動作：解除靜音 ---
const unmuteVideo = () => {
  if (videoRef.value) {
    videoRef.value.muted = false;
    isMuted.value = false;
  }
};

// --- 動作：關閉廣告 ---
const closeAd = () => {
  isOpen.value = false;

  // 關閉後稍等動畫結束，暫停影片
  setTimeout(() => {
    if (videoRef.value) {
      videoRef.value.pause();
    }
  }, 600);
};

// --- 核心邏輯：更新影片來源 ---
const updateVideoSrc = () => {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const targetSrc = width >= height ? landscapeVideo : portraitVideo;

  // 只有當「來源真的改變」時才動作
  if (currentVideoSrc.value !== targetSrc) {
    currentVideoSrc.value = targetSrc;

    // 【關鍵修正】
    // 只有當「廣告是開啟的 (isOpen為真)」才執行 reload 和 play
    // 這樣可以防止：使用者關閉廣告後，調整視窗大小，影片卻在背景偷跑的問題
    if (isOpen.value && videoRef.value) {
      videoRef.value.load();

      // 確保切換影片後維持靜音狀態，避免突然大聲
      videoRef.value.muted = isMuted.value;

      videoRef.value.play().catch(() => {});
    }
  }
};

// --- 事件監聽 ---
onMounted(() => {
  // 延遲執行，給瀏覽器一點緩衝時間
  setTimeout(() => {
    openAd();
  }, 500);

  // 監聽視窗變化，觸發 updateVideoSrc
  window.addEventListener("resize", updateVideoSrc);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateVideoSrc);
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
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  font-size: 20px;
  cursor: pointer;
}
.unmute-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.unmute-btn {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
  border: 2px solid white;
  color: white;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
