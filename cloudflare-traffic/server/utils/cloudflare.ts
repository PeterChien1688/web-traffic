// server/utils/cloudflare.ts

// @ts-ignore
import { useRuntimeConfig } from "#imports";

export const fetchCloudflareTraffic = async (
  zoneId: string,
  dateStr: string,
) => {
  // @ts-ignore
  const config = useRuntimeConfig();
  const endpoint = "https://api.cloudflare.com/client/v4/graphql";

  // 計算隔天日期，用於 date_lt (小於)
  // Python 邏輯: date_start = target_date, date_end = target_date + 1 day
  const start = new Date(dateStr);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const dateEndStr = end.toISOString().split("T")[0]; // YYYY-MM-DD

  // ✅ 改用與 Python 相同的 httpRequestsAdaptiveGroups 查詢
  const query = `
    query GetTraffic($zoneTag: string, $dateStart: String, $dateEnd: String) {
      viewer {
        zones(filter: {zoneTag: $zoneTag}) {
          httpRequestsAdaptiveGroups(
            limit: 10000
            filter: {
              date_geq: $dateStart
              date_lt: $dateEnd
            }
            orderBy: [count_DESC]
          ) {
            count
            dimensions {
              clientCountryName
            }
          }
        }
      }
    }
  `;

  try {
    // @ts-ignore
    const response: any = await $fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.cfApiToken}`,
        "Content-Type": "application/json",
      },
      body: {
        query,
        variables: {
          zoneTag: zoneId,
          dateStart: dateStr, // 例如 2026-01-26
          dateEnd: dateEndStr, // 例如 2026-01-27
        },
      },
    });

    // 解析回傳資料 (注意路徑與原本不同)
    const groups =
      response.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || [];

    // 轉換格式以符合資料庫欄位
    return groups.map((item: any) => ({
      record_date: dateStr,
      country: item.dimensions.clientCountryName,
      requests: item.count, // Python 的 count 對應這裡的 requests
    }));
  } catch (error) {
    console.error(`❌ Cloudflare API Error (${dateStr}):`, error);
    return [];
  }
};
