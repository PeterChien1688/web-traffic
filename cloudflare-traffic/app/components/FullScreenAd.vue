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

      <video
        ref="videoRef"
        muted
        autoplay
        playsinline
        class="bg-video"
        @ended="closeAd"
        @click="unmuteVideo"
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

// --- 狀態 ---
const isOpen = ref(false);
const isMuted = ref(true);
const currentVideoSrc = ref("");
const videoRef = ref(null);

// --- 動作：開啟廣告 ---
const openAd = async () => {
  // 1. Session 檢查
  if (sessionStorage.getItem("ad_watched")) {
    console.log("廣告本次 Session 已播放過，不再彈出");
    return;
  }

  // 2. 決定影片來源
  // 先取得正確的影片路徑
  const width = window.innerWidth;
  const height = window.innerHeight;
  currentVideoSrc.value = width >= height ? landscapeVideo : portraitVideo;

  // 3. 開啟視窗 (觸發 CSS 動畫)
  isOpen.value = true;

  // 4. 寫入 Session 紀錄
  sessionStorage.setItem("ad_watched", "true");

  // 5. 【關鍵修正 2】等待 DOM 更新後，強制載入並播放
  await nextTick(); // 等待 Vue 把 src 屬性綁定上去

  if (videoRef.value) {
    const video = videoRef.value;

    // 確保屬性正確
    video.muted = true;
    video.playsInline = true;
    isMuted.value = true;

    // 強制重整影片來源 (重要！否則換了 src 也不會播)
    video.load();

    // 稍微延遲一點點，等待 load 完成且視窗動畫開始後再 play
    setTimeout(() => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("自動播放成功"))
          .catch((e) => {
            console.warn("自動播放被阻擋或失敗，嘗試再次播放:", e);
            // 如果失敗，靜音再試一次 (有些瀏覽器很頑固)
            video.muted = true;
            video.play().catch((e2) => console.error("最終播放失敗:", e2));
          });
      }
    }, 150); // 150ms 的緩衝對使用者無感，但對瀏覽器很重要
  }
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

    // 只有當「廣告開啟中」才執行重載
    // 防止關閉後拉動視窗導致背景偷播
    if (isOpen.value && videoRef.value) {
      videoRef.value.load();
      videoRef.value.muted = isMuted.value;
      videoRef.value.play().catch(() => {});
    }
  }
};

onMounted(() => {
  // 延遲執行，確保頁面完全載入
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
/* 樣式區完全不用動 */
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
