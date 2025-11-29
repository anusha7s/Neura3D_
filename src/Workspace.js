// src/Workspace.js
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";

const BACKEND_URL = "http://localhost:4000";

export default function Workspace() {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [modelUrl, setModelUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const fileInputRef = useRef(null);

  const templates = [
    {
      name: "Upload an Image",
      icon: <FiPlus className="text-4xl text-red-600" />,
      sketch: null,
    },
    { name: "Chair", sketch: "chair", icon: "🪑" },
    { name: "Table", sketch: "table", icon: "🛏️" },
    { name: "Mug", icon: "☕", sketch: "mug" },
    { name: "Lamp", icon: "💡", sketch: "lamp" },
    { name: "Sofa", icon: "🛋️", sketch: "sofa" },
    { name: "Car", icon: "🚗", sketch: "car" },
    { name: "Phone", icon: "📱", sketch: "phone" },
    { name: "Bottle", icon: "🍾", sketch: "bottle" },
  ];

  /*********************** TEXT → 3D **************************/
  const generateFromText = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      setIsGenerating(true);
      setStatusMsg("Generating 3D model from text...");
      setModelUrl(null);

      const res = await fetch(`${BACKEND_URL}/api/text-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Text→3D error:", data);
        alert(data.error || "Text generation failed");
        return;
      }

      if (!data.modelUrl) {
        alert("No model URL returned from backend");
        return;
      }

      setModelUrl(data.modelUrl);
      setStatusMsg("Done!");
    } catch (err) {
      console.error(err);
      alert("Error contacting backend for text-to-3D");
    } finally {
      setIsGenerating(false);
    }
  };

  /*********************** IMAGE → 3D *************************/
  const onClickTile = (preset) => {
    if (preset === null) {
      // Blank tile -> upload image
      fileInputRef.current?.click();
    } else {
      // Other tiles -> drawing page (if you have it)
      navigate("/draw", { state: { preset } });
    }
  };

  const onImagePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsGenerating(true);
      setStatusMsg("Uploading image and generating 3D model...");
      setModelUrl(null);

      const base64 = await fileToBase64(file);

      const res = await fetch(`${BACKEND_URL}/api/image-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: base64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Image→3D error:", data);
        alert(data.error || "Image generation failed");
        return;
      }

      if (!data.modelUrl) {
        alert("No model URL returned from backend");
        return;
      }

      setModelUrl(data.modelUrl);
      setStatusMsg("Done!");
    } catch (err) {
      console.error(err);
      alert("Error contacting backend for image-to-3D");
    } finally {
      setIsGenerating(false);
      e.target.value = ""; // allow same file again
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // data URL
      reader.readAsDataURL(file);
    });

  /********************** DOWNLOAD ****************************/
  const downloadModel = () => {
    if (!modelUrl) return;
    const a = document.createElement("a");
    a.href = modelUrl;
    a.download = "neura3d_model.glb";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /*********************** RENDER *****************************/
  return (
    <div className="min-h-screen p-6 text-white bg-black">
      <header className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-black text-red-600">Neura3D</h1>

        <button
          onClick={() => auth.signOut()}
          className="px-6 py-2 text-red-600 transition border-2 border-red-600 rounded-full hover:bg-red-600 hover:text-white"
        >
          Logout
        </button>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* TEXT PROMPT */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-center">
            Describe your 3D design...
          </h2>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="flex-1 p-4 text-white bg-gray-900 rounded-xl placeholder-gray-500"
              placeholder="e.g., a futuristic coffee mug with a glowing handle"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <button
              disabled={isGenerating}
              onClick={generateFromText}
              className="px-8 py-4 font-bold text-white transition bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate 3D"}
            </button>
          </div>
        </div>

        {/* IMAGE / DRAWING TILES */}
        <div>
          <h2 className="mb-8 text-2xl font-bold text-center">
            Or start from an image or sketch
          </h2>

          <div className="grid grid-cols-3 gap-6 md:grid-cols-4 lg:grid-cols-5">
            {templates.map((t, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.08 }}
                onClick={() => onClickTile(t.sketch)}
                className="p-6 text-center bg-gray-900 border border-gray-800 cursor-pointer rounded-2xl hover:border-red-600"
              >
                <div className="mb-2">{t.icon}</div>
                <p className="text-sm">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hidden file input for Blank tile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onImagePicked}
        />

        {/* STATUS */}
        {isGenerating && (
          <p className="mt-4 text-center text-yellow-400 text-lg">
            {statusMsg || "Generating... this can take a bit."}
          </p>
        )}

        {/* MODEL VIEWER */}
        {modelUrl && (
          <div className="p-4 mt-10 bg-gray-900 rounded-xl">
            <model-viewer
              src={modelUrl}
              camera-controls
              auto-rotate
              style={{ width: "100%", height: "450px" }}
            />

            <button
              onClick={downloadModel}
              className="w-full py-3 mt-4 font-bold bg-red-600 rounded-lg hover:bg-red-700"
            >
              Download 3D Model
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
