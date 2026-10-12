import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import https from "node:https";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const targetUrl =
    env.VITE_BHXH_TARGET_URL ||
    (env.VITE_BHXH_ENV === "production"
      ? "https://egw.baohiemxahoi.gov.vn"
      : "https://gdbhyt.baohiemxahoi.gov.vn");

  // Agent xử lý riêng cho bắt tay TLS của Cổng BHXH để tránh ECONNRESET / 502
  const bhxhAgent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: false,
    timeout: 30000,
  });

  return {
    plugins: [tailwindcss(), react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("xlsx")) return "vendor-xlsx";
              if (id.includes("antd") || id.includes("@ant-design")) return "vendor-antd";
              if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) return "vendor-react";
              if (id.includes("lucide-react")) return "vendor-lucide";
              return "vendor-libs";
            }
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
    server: {
      proxy: {
        "/api-bhxh": {
          target: targetUrl,
          changeOrigin: true,
          secure: false,
          agent: bhxhAgent,
          rewrite: (path) => path.replace(/^\/api-bhxh/, ""),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
          configure: (proxy) => {
            proxy.on("error", (err, _req, res) => {
              console.warn("[Vite Proxy BHXH] Lỗi kết nối Cổng BHXH:", err.message);
              if (res && "writeHead" in res && !res.headersSent) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    maKetQua: "502",
                    thongDiep: `Không thể kết nối đến Cổng BHXH (${err.message}). Cổng BHXH có thể đang quá tải hoặc gián đoạn mạng.`,
                  }),
                );
              }
            });
          },
        },
        "/api-smartca-sp769": {
          target:
            (env.VITE_SMARTCA_ENV || "production") === "production"
              ? "https://gwsca.vnpt.vn/sca/sp769"
              : "https://rmgateway.vnptit.vn/sca/sp769",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-smartca-sp769/, ""),
        },
        "/api-smartca-prod": {
          target: "https://gwsca.vnpt.vn",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-smartca-prod/, ""),
        },
        "/api-smartca-demo": {
          target: "https://rmgateway.vnptit.vn",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-smartca-demo/, ""),
        },
      },
    },
  };
});
