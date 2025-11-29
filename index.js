// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));


const API_KEY = process.env.MODELSLAB_API_KEY;
if (!API_KEY) {
  console.error("❌ MODELSLAB_API_KEY missing in .env");
}

// Helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const extractModelUrl = (r) =>
  r?.proxy_links?.[0] || r?.output?.[0] || null;

/* ============================================================
 * TEXT → 3D
 * POST /api/text-to-3d  { prompt }
 * Uses ModelsLab async API + polling
 * ==========================================================*/
app.post("/api/text-to-3d", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("🟡 TEXT→3D request:", prompt);

    // 1️⃣ Create task
    const initReq = await fetch("https://modelslab.com/api/v6/3d/text_to_3d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: API_KEY,
        prompt,
        output_format: "glb",
        resolution: 512,
        num_inference_steps: 30,
        ss_sampling_steps: 50,
        slat_sampling_steps: 50,
        seed: 0,
        temp: "no",
      }),
    });

    const initData = await initReq.json();
    console.log("🟢 TEXT init:", initData);

    // Sometimes result is ready immediately
    if (initData.status === "success") {
      const url = extractModelUrl(initData);
      if (!url) {
        return res.status(500).json({
          error: "No model URL returned",
          raw: initData,
        });
      }
      return res.json({ modelUrl: url });
    }

    // Otherwise we must have a fetch_result to poll
    if (!initData.fetch_result) {
      return res.status(500).json({
        error: "No fetch_result returned from ModelsLab",
        raw: initData,
      });
    }

    const pollUrl = initData.fetch_result;
    console.log("📡 TEXT poll URL:", pollUrl);

    // 2️⃣ Poll every 6s up to ~6 minutes
    let result = null;
    for (let i = 0; i < 60; i++) {
      await sleep(6000);

      const pollReq = await fetch(pollUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: API_KEY }), // required
      });

      result = await pollReq.json();
      console.log(`🔄 TEXT Poll #${i}:`, result.status);

      if (result.status === "success") break;
      if (result.status === "failed") break;
    }

    if (!result || result.status !== "success") {
      return res.status(500).json({
        error: "Text-to-3D task did not complete",
        raw: result,
      });
    }

    const url = extractModelUrl(result);
    if (!url) {
      return res.status(500).json({
        error: "No model URL returned after polling",
        raw: result,
      });
    }

    res.json({ modelUrl: url });
  } catch (err) {
    console.error("❌ /api/text-to-3d error:", err);
    res.status(500).json({ error: "Text-to-3D failed" });
  }
});

/* ============================================================
 * IMAGE → 3D
 * POST /api/image-to-3d  { imageDataUrl }
 * Flow: base64 -> URL -> 3D job -> poll
 * ==========================================================*/
app.post("/api/image-to-3d", async (req, res) => {
  try {
    const { imageDataUrl } = req.body;

    if (!imageDataUrl) {
      return res.status(400).json({ error: "Image is required" });
    }

    console.log("🟡 IMAGE→3D base64 length:", imageDataUrl.length);

    // 1️⃣ Upload base64 → URL
    const uploadReq = await fetch(
      "https://modelslab.com/api/v6/base64_to_url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: API_KEY,
          base64_string: imageDataUrl,
        }),
      }
    );

    const uploadData = await uploadReq.json();
    console.log("🟢 base64_to_url:", uploadData);

    if (uploadData.status !== "success") {
      return res.status(500).json({
        error: "Failed to upload image to ModelsLab",
        raw: uploadData,
      });
    }

    const imageUrl = uploadData.output?.[0];
    if (!imageUrl) {
      return res.status(500).json({
        error: "No URL returned from base64_to_url",
        raw: uploadData,
      });
    }

    console.log("📸 Image URL:", imageUrl);

    // 2️⃣ Create 3D job
    const initReq = await fetch(
      "https://modelslab.com/api/v6/3d/image_to_3d",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: API_KEY,
          init_image: imageUrl,
          output_format: "glb",
          resolution: 512,
          seed: 0,
        }),
      }
    );

    const initData = await initReq.json();
    console.log("🟢 IMAGE init:", initData);

    // Sometimes instant
    if (initData.status === "success") {
      const url = extractModelUrl(initData);
      if (!url) {
        return res.status(500).json({
          error: "No model URL returned",
          raw: initData,
        });
      }
      return res.json({ modelUrl: url });
    }

    if (!initData.fetch_result) {
      return res.status(500).json({
        error: "No fetch_result returned from image_to_3d",
        raw: initData,
      });
    }

    const pollUrl = initData.fetch_result;
    console.log("📡 IMAGE poll URL:", pollUrl);

    // 3️⃣ Poll every 8s up to ~8 minutes
    let result = null;
    for (let i = 0; i < 60; i++) {
      await sleep(8000);

      const pollReq = await fetch(pollUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: API_KEY }), // required
      });

      result = await pollReq.json();
      console.log(`🔄 IMAGE Poll #${i}:`, result.status);

      if (result.status === "success") break;
      if (result.status === "failed") break;
    }

    if (!result || result.status !== "success") {
      return res.status(500).json({
        error: "Image-to-3D task did not complete",
        raw: result,
      });
    }

    const url = extractModelUrl(result);
    if (!url) {
      return res.status(500).json({
        error: "No model URL returned after polling",
        raw: result,
      });
    }

    res.json({ modelUrl: url });
  } catch (err) {
    console.error("❌ /api/image-to-3d error:", err);
    res.status(500).json({ error: "Image-to-3D failed" });
  }
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
