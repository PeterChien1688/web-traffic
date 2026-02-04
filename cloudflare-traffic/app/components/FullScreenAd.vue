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

// --- 狀態 ---
const isOpen = ref(false);
// 【已移除】isMuted 狀態
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
  const width = window.innerWidth;
  const height = window.innerHeight;
  currentVideoSrc.value = width >= height ? landscapeVideo : portraitVideo;

  // 3. 開啟視窗 (觸發 CSS 動畫)
  isOpen.value = true;

  // 4. 寫入紀錄
  sessionStorage.setItem("ad_watched", "true");

  // 5. 等待 DOM 更新後，強制載入並播放
  await nextTick();

  if (videoRef.value) {
    const video = videoRef.value;

    // 確保屬性正確 (即使影片無聲，瀏覽器政策仍要求 muted 才能自動播放)
    video.muted = true;
    video.playsInline = true;

    // 強制重整影片來源
    video.load();

    setTimeout(() => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log("自動播放成功"))
          .catch((e) => {
            console.warn("自動播放受阻，嘗試再次播放:", e);
            // 如果失敗再試一次
            video.play().catch(() => {});
          });
      }
    }, 150);
  }
};

// 【已移除】unmuteVideo 函式

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
    if (isOpen.value && videoRef.value) {
      videoRef.value.load();
      videoRef.value.play().catch(() => {});
    }
  }
};

onMounted(() => {
  // 延遲執行
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
/* 容器與影片樣式保持不變 */
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

/* 【修改點 2】全新的美化關閉按鈕樣式 */
.close-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 20;

  /* 外觀基礎設定 */
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;

  /* 顏色與材質 */
  background: rgba(0, 0, 0, 0.5); /* 半透明黑底 */
  color: rgba(255, 255, 255, 0.9); /* 圖示顏色 */
  backdrop-filter: blur(8px); /* 毛玻璃效果 (現代感) */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); /* 增加立體感陰影 */

  /* 讓圖示置中 */
  display: flex;
  align-items: center;
  justify-content: center;

  /* 動畫設定 */
  transition: all 0.3s ease; /* 滑鼠經過的平滑過渡 */
  animation: pulse-red 2.5s infinite; /* 套用呼吸燈動畫 */
}

/* 滑鼠經過時的變化 */
.close-btn:hover {
  background-color: rgba(220, 20, 60, 0.8); /* 變成稍微鮮豔的紅色 */
  color: white;
  box-shadow: 0 6px 20px rgba(220, 20, 60, 0.5); /* 紅色光暈 */
}

/* 【修改點 3】新的呼吸燈動畫關鍵影格 */
@keyframes pulse-red {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.08); /* 稍微放大 */
    /* 加上一層淡淡的紅色光暈，營造呼吸感 */
    box-shadow: 0 8px 25px rgba(220, 20, 60, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
}

/* 【已移除】unmute-overlay, unmute-btn 相關樣式 */
</style>
