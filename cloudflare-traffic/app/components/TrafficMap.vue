<template>
  <div class="debug-container">
    <div class="nav-header">
      <div class="header-left">
        <h2>地理視覺化整合模式</h2>
        <p class="sub-text">
          資料表: <strong>{{ tableName }}</strong>
        </p>
      </div>

      <NuxtLink to="/" class="home-btn"> ⬅️ 回首頁 (Back to Home) </NuxtLink>
    </div>

    <div v-if="pending">⏳ 讀取資料庫中...</div>
    <div v-else-if="error" class="error">❌ 錯誤: {{ error.message }}</div>

    <div v-else>
      <div class="control-box">
        <label>選擇日期查看: </label>

        <select v-model="selectedYear" class="debug-select date-part">
          <option v-for="y in availableYears" :key="y" :value="y">
            {{ y }}年
          </option>
        </select>

        <select v-model="selectedMonth" class="debug-select date-part">
          <option v-for="m in availableMonths" :key="m" :value="m">
            {{ m }}月
          </option>
        </select>

        <select v-model="selectedDay" class="debug-select date-part">
          <option v-for="d in availableDays" :key="d" :value="d">
            {{ d }}日
          </option>
        </select>

        <span style="margin-left: 15px">
          當前顯示: <strong>{{ filteredList.length }}</strong> 筆資料
        </span>
      </div>

      <div class="chart-wrapper">
        <ClientOnly>
          <div ref="chartRef" class="map-chart"></div>
          <template #fallback>
            <div class="loading-placeholder">地圖載入中...</div>
          </template>
        </ClientOnly>
      </div>

      <hr class="divider" />

      <h3>🔍 {{ fullSelectedDate }} 詳細資料</h3>

      <table class="debug-table">
        <thead>
          <tr>
            <th>原始資料 (Raw)</th>
            <th>轉換後 (Formatted)</th>
            <th>國家 (Country)</th>
            <th>請求數 (Requests)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in filteredList" :key="item.country + index">
            <td class="raw-data">{{ item.rawDate }}</td>
            <td class="formatted-data">{{ item.formattedDate }}</td>
            <td>{{ item.country }}</td>
            <td>{{ item.requests }}</td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td colspan="4" style="text-align: center; color: yellow">
              ⚠️ 該日期沒有資料
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  shallowRef,
} from "vue";
import * as echarts from "echarts";

// --- 介面定義 (保留) ---
interface TrafficRecord {
  id?: number;
  record_date: string;
  country: string;
  requests: number;
}

interface ProcessedItem {
  rawDate: string;
  formattedDate: string;
  country: string;
  requests: number;
}

const props = defineProps<{
  tableName: string;
}>();

// --- 靜態資料對應 (保留) ---
const countryNameMap: Record<string, string> = {
  TW: "Taiwan",
  CN: "China",
  US: "United States of America",
  JP: "Japan",
  KR: "South Korea",
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  AU: "Australia",
  CA: "Canada",
  BR: "Brazil",
  RU: "Russia",
  IN: "India",
  SG: "Singapore",
  HK: "Hong Kong",
  VN: "Vietnam",
  PH: "Philippines",
  TH: "Thailand",
  MY: "Malaysia",
  ID: "Indonesia",
};

const geoCoordMap: Record<string, number[]> = {
  Singapore: [103.8198, 1.3521],
};

// --- 資料獲取 (保留原本邏輯，抓取全部資料後再前端過濾) ---
// @ts-ignore
const { data, pending, error } = await useFetch<TrafficRecord[]>(
  "/api/traffic",
  {
    query: { table: props.tableName },
    lazy: false,
  },
);

// --- 狀態變數 (修改：拆分為年月日) ---
const selectedYear = ref<string>("");
const selectedMonth = ref<string>("");
const selectedDay = ref<string>("");

const chartRef = ref<HTMLElement | null>(null);
const myChart = shallowRef<echarts.ECharts | null>(null);

// --- 資料處理 ---
const formatDate = (raw: string): string => {
  if (!raw) return "無資料";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "無效格式";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const processedData = computed<ProcessedItem[]>(() => {
  if (!data.value || !Array.isArray(data.value)) return [];
  return data.value.map((item: TrafficRecord) => ({
    rawDate: item.record_date,
    formattedDate: formatDate(item.record_date),
    country: item.country,
    requests: item.requests,
  }));
});

// --- 下拉選單邏輯 (新增) ---

// 1. 取得所有不重複的日期字串
const uniqueDates = computed(() => {
  const dates = new Set(processedData.value.map((item) => item.formattedDate));
  return Array.from(dates).sort().reverse();
});

// 2. 計算可用的「年」
const availableYears = computed(() => {
  const years = new Set(uniqueDates.value.map((d) => d.split("-")[0]));
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
});

// 3. 計算可用的「月」 (相依於 selectedYear)
const availableMonths = computed(() => {
  if (!selectedYear.value) return [];
  const months = new Set(
    uniqueDates.value
      .filter((d) => d.startsWith(`${selectedYear.value}-`))
      .map((d) => d.split("-")[1]),
  );
  return Array.from(months).sort();
});

// 4. 計算可用的「日」 (相依於 selectedYear + selectedMonth)
const availableDays = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return [];
  const prefix = `${selectedYear.value}-${selectedMonth.value}-`;
  const days = new Set(
    uniqueDates.value
      .filter((d) => d.startsWith(prefix))
      .map((d) => d.split("-")[2]),
  );
  return Array.from(days).sort();
});

// 5. 組合出完整的日期字串
const fullSelectedDate = computed(() => {
  if (!selectedYear.value || !selectedMonth.value || !selectedDay.value)
    return "";
  return `${selectedYear.value}-${selectedMonth.value}-${selectedDay.value}`;
});

// 6. 過濾清單 (使用組合出的日期)
const filteredList = computed(() => {
  if (!fullSelectedDate.value) return [];
  return processedData.value.filter(
    (item) => item.formattedDate === fullSelectedDate.value,
  );
});

// --- 圖表邏輯 (保留並微調) ---
const initChart = async () => {
  if (!chartRef.value) return;

  myChart.value = echarts.init(chartRef.value, "dark");
  myChart.value.showLoading();

  try {
    // 優先嘗試使用 CDN，確保地圖能顯示 (原本的 /world.json 容易遺失)
    let worldJson;
    try {
      // 嘗試本地
      const response = await fetch("/world.json");
      if (!response.ok) throw new Error("Local map not found");
      worldJson = await response.json();
    } catch (e) {
      // 失敗則使用 CDN
      console.warn("Switching to CDN for map data");
      worldJson = await (
        await fetch(
          "https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json",
        )
      ).json();
    }

    echarts.registerMap("world", worldJson);
    myChart.value.hideLoading();

    const option = {
      backgroundColor: "#252526",
      title: {
        text: "全球流量分佈",
        left: "center",
        top: 20,
        textStyle: { color: "#fff" },
      },
      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const val = Array.isArray(params.value)
            ? params.value[2]
            : params.value;
          return `${params.name}<br/>Requests: ${val || 0}`;
        },
      },
      visualMap: {
        min: 0,
        max: 1000,
        text: ["High", "Low"],
        realtime: false,
        calculable: true,
        inRange: {
          color: [
            "#313695",
            "#4575b4",
            "#74add1",
            "#abd9e9",
            "#e0f3f8",
            "#ffffbf",
            "#fee090",
            "#fdae61",
            "#f46d43",
            "#d73027",
            "#a50026",
          ],
        },
        textStyle: { color: "#fff" },
        left: 20,
        bottom: 20,
      },
      geo: {
        map: "world",
        roam: true,
        itemStyle: { areaColor: "#323c48", borderColor: "#111" },
        emphasis: {
          itemStyle: { areaColor: "#2a333d" },
          label: { show: false },
        },
      },
      series: [
        {
          name: "Requests",
          type: "map",
          map: "world",
          geoIndex: 0,
          data: [],
        },
        {
          name: "Small States",
          type: "scatter",
          coordinateSystem: "geo",
          symbolSize: 12,
          itemStyle: { color: "#F4E925", shadowBlur: 10, shadowColor: "#333" },
          data: [],
        },
      ],
    };

    myChart.value.setOption(option as any);
    updateChart();
  } catch (err) {
    console.error("地圖載入失敗:", err);
    myChart.value?.hideLoading();
  }
};

const updateChart = () => {
  if (!myChart.value) return;
  // 即使 filteredList 為空也要更新，才能清空地圖上的顏色

  const mapData = filteredList.value.map((item) => ({
    name: countryNameMap[item.country] || item.country,
    value: item.requests,
  }));

  const scatterData = mapData
    .filter((item) => geoCoordMap[item.name])
    .map((item) => ({
      name: item.name,
      value: [...geoCoordMap[item.name]!, item.value],
    }));

  const maxVal =
    mapData.length > 0 ? Math.max(...mapData.map((d) => d.value)) : 100;

  myChart.value.setOption({
    title: { text: `${fullSelectedDate.value || "未選擇日期"} 全球流量` },
    visualMap: { max: maxVal },
    series: [{ data: mapData }, { data: scatterData }],
  } as any);
};

// --- 監聽器 (處理預設值與連動) ---

// 1. 初始化預設日期 (找資料中最新的一天)
watch(
  uniqueDates,
  (newDates) => {
    if (newDates.length > 0 && !selectedYear.value) {
      // 取最新日期的年、月、日
      const [y, m, d] = newDates[0]!.split("-");
      selectedYear.value = y!;
      selectedMonth.value = m!;
      selectedDay.value = d!;
    }
  },
  { immediate: true },
);

// 2. 當年分改變，重設月、日 (預設選該年第一個月/第一天，或維持選擇)
watch(selectedYear, (newY) => {
  if (!newY) return;
  nextTick(() => {
    if (!availableMonths.value.includes(selectedMonth.value)) {
      selectedMonth.value = availableMonths.value[0] || "";
    }
  });
});

// 3. 當月份改變，重設日
watch(selectedMonth, (newM) => {
  if (!newM) return;
  nextTick(() => {
    if (!availableDays.value.includes(selectedDay.value)) {
      selectedDay.value = availableDays.value[0] || "";
    }
  });
});

// 4. 當過濾後的資料改變，更新地圖
watch(filteredList, () => {
  updateChart();
});

onMounted(() => {
  nextTick(() => {
    initChart();
  });
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (myChart.value) myChart.value.dispose();
  window.removeEventListener("resize", handleResize);
});

const handleResize = () => {
  myChart.value && myChart.value.resize();
};
</script>

<style scoped>
/* 樣式保留原本的 debug 風格 */
.debug-container {
  padding: 20px;
  background-color: #1e1e1e;
  color: #fff;
  min-height: 100vh;
  font-family: monospace;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.header-left h2 {
  margin: 0 0 5px 0;
  font-size: 1.5rem;
}

.header-left .sub-text {
  margin: 0;
  color: #aaa;
  font-size: 0.9rem;
}

.home-btn {
  display: inline-flex;
  align-items: center;
  background-color: #0e639c;
  color: #fff;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid #1177bb;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.home-btn:hover {
  background-color: #1177bb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error {
  color: #ff5252;
  font-weight: bold;
  font-size: 1.2em;
}

.control-box {
  background: #333;
  padding: 15px;
  border-radius: 5px;
  border-left: 5px solid #007acc;
  margin-bottom: 20px;
  display: flex; /* 讓下拉選單橫向排列 */
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 修改：為日期選單加上特定樣式 */
.debug-select {
  padding: 5px;
  font-size: 1.1em;
  background-color: #fff;
  color: #333;
  border-radius: 4px;
  min-width: 80px; /* 確保選單不要太窄 */
}

.chart-wrapper {
  background: #252526;
  border: 1px solid #444;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 5px;
}

.map-chart {
  width: 100%;
  height: 500px;
}

.loading-placeholder {
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888;
}

.divider {
  border-color: #444;
  margin: 20px 0;
}

.debug-table {
  width: 100%;
  border-collapse: collapse;
  background: #252526;
}

.debug-table th,
.debug-table td {
  border: 1px solid #444;
  padding: 8px;
  text-align: left;
}

.debug-table th {
  background: #007acc;
  color: white;
}

.raw-data {
  color: #ce9178;
}

.formatted-data {
  color: #4ec9b0;
  font-weight: bold;
}
</style>
