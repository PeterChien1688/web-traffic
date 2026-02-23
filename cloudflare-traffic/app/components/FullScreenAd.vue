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
        <a :href="adConfig.ctaUrl" class="cta-button"> 至50期雜誌 ➔ </a>
      </div>

      <video
        ref="videoRef"
        muted
        playsinline
        preload="auto"
        class="bg-video"
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

const defaultConfig = {
  landscapeVideo: "/videos/landscape_web.mp4",
  portraitVideo: "/videos/portrait_web.mp4",
  cooldownMinutes: 30,
  ctaUrl: "https://wisdomhall.com.tw/tw/magazine_inpage.php?id=104",
};

const isOpen = ref(false);
const isVideoEnded = ref(false);
const currentVideoSrc = ref("");
const videoRef = ref(null);
const adConfig = ref({ ...defaultConfig });
// 新增：判斷是否為橫式
const isLandscape = ref(true);

const loadConfig = async () => {
  try {
    const response = await fetch("/ad-config.json");
    if (response.ok) {
      const data = await response.json();
      adConfig.value = {
        landscapeVideo: data.landscapeVideo || defaultConfig.landscapeVideo,
        portraitVideo: data.portraitVideo || defaultConfig.portraitVideo,
        cooldownMinutes: data.cooldownMinutes || defaultConfig.cooldownMinutes,
        ctaUrl: data.ctaUrl || defaultConfig.ctaUrl,
      };
    }
  } catch (e) {
    console.warn("讀取廣告設定失敗", e);
  }
};

const openAd = async () => {
  await loadConfig();

  const cooldownMs = adConfig.value.cooldownMinutes * 60 * 1000;
  const lastWatchedTime = localStorage.getItem("ad_watched_time");
  const now = new Date().getTime();

  if (lastWatchedTime && now - parseInt(lastWatchedTime) < cooldownMs) {
    return;
  }

  isVideoEnded.value = false;

  // 判斷螢幕方向並設定狀態
  const width = window.innerWidth;
  const height = window.innerHeight;
  isLandscape.value = width >= height;

  currentVideoSrc.value = isLandscape.value
    ? adConfig.value.landscapeVideo
    : adConfig.value.portraitVideo;

  isOpen.value = true;
  localStorage.setItem("ad_watched_time", now.toString());

  await nextTick();
  if (videoRef.value) {
    const video = videoRef.value;
    video.muted = true;
    video.playsInline = true;
    video.load();

    // setTimeout(() => {
    //   const playPromise = video.play();
    //   if (playPromise !== undefined) {
    //     playPromise.catch(() => {
    //       video.muted = true;
    //       video.play().catch(() => {});
    //     });
    //   }
    // }, 150);
  }
};

// 【新增】當影片下載了足夠的緩衝，可以順暢播放時，瀏覽器會觸發這個事件
const onCanPlay = () => {
  if (videoRef.value && isOpen.value) {
    videoRef.value.play().catch((e) => {
      console.warn("自動播放受阻:", e);
    });
  }
};

const onVideoEnded = () => {
  isVideoEnded.value = true;
};

const closeAd = () => {
  isOpen.value = false;
  setTimeout(() => {
    isVideoEnded.value = false;
    if (videoRef.value) videoRef.value.pause();
  }, 600);
};

const handleResize = () => {
  if (typeof window === "undefined") return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  // 更新狀態
  isLandscape.value = width >= height;

  const targetSrc = isLandscape.value
    ? adConfig.value.landscapeVideo
    : adConfig.value.portraitVideo;

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

.bg-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
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
