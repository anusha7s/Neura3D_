// src/DrawingBoard.js
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaPen, FaPencilAlt, FaEraser, FaUndo, FaRedo, FaTrash,
  FaSquare, FaCircle, FaFont, FaSearchPlus, FaSearchMinus, FaTh
} from 'react-icons/fa';
import { TbRectangle, TbTriangle } from 'react-icons/tb';
import { MdOutlineRoundedCorner } from 'react-icons/md';

export default function DrawingBoard({ onLogout }) {

  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // ===== CANVAS STATE =====
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [fillEnabled, setFillEnabled] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  const [fontSize, setFontSize] = useState(20);
  const [fontStyle, setFontStyle] = useState({ bold: false, italic: false });

  // Shapes
  const [shapes, setShapes] = useState([]);
  const [currentShape, setCurrentShape] = useState(null);
  const [startPos, setStartPos] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);

  // Undo-redo
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Text box
  const [textInput, setTextInput] = useState('');
  const [showTextBox, setShowTextBox] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // AI Model generation
  const [modelUrl, setModelUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const BACKEND_URL = "http://localhost:4000";

  // ========= SAVE HISTORY =========
  const saveToHistory = () => {
    const snap = { shapes: JSON.parse(JSON.stringify(shapes)) };
    const newHistory = [...history.slice(0, historyStep + 1), snap];
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setShapes(history[historyStep - 1].shapes);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setShapes(history[historyStep + 1].shapes);
    }
  };

  // ========= CANVAS HELPERS =========
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  };

  const drawGrid = (ctx) => {
    ctx.strokeStyle = "#eee";
    for (let i = 0; i < canvasRef.current.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasRef.current.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvasRef.current.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasRef.current.width, i);
      ctx.stroke();
    }
  };

  const drawShape = (ctx, shape) => {
    const { x, y, w, h } = shape;

    if (shape.type === 'line') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
    }
    else if (shape.type === 'rectangle') ctx.rect(x, y, w, h);
    else if (shape.type === 'rounded') {
      const r = 20;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    }
    else if (shape.type === 'circle') {
      ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2);
    }
    else if (shape.type === 'triangle') {
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    }
  };

  // ========= REDRAWING =========
  const redraw = () => {
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    if (showGrid) drawGrid(ctx);

    shapes.forEach(shape => {
      ctx.lineWidth = shape.strokeWidth;
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.fillEnabled ? shape.fillColor : 'transparent';
      ctx.beginPath();

      if (shape.type === 'free') {
        shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      } else drawShape(ctx, shape);

      if (shape.fillEnabled) ctx.fill();
      ctx.stroke();
    });
  };

  // ========= INIT CANVAS EVENTS =========
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1200;
    canvas.height = 680;
    saveToHistory();
  }, []);

  useEffect(() => redraw(), [shapes]);

  // ========= AI INTEGRATION 🚀 =========
  const exportCanvasImage = () => {
    return canvasRef.current.toDataURL("image/png", 1.0);
  };

  const generate3D = async () => {
    try {
      setIsGenerating(true);

      const imageDataUrl = exportCanvasImage();

      // Step 1: Send Image
      const start = await fetch(`${BACKEND_URL}/api/image-to-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl })
      }).then(r => r.json());

      if (!start.task_id) {
        alert("Task create error");
        setIsGenerating(false);
        return;
      }

      let finished = false;
      while (!finished) {
        await new Promise(r => setTimeout(r, 5000));

        const res = await fetch(`${BACKEND_URL}/api/image-to-3d/${start.task_id}`).then(r => r.json());

        if (res.status === "SUCCEEDED") {
          setModelUrl(res.model);
          alert("3D model ready 🎉");
          finished = true;
        } else if (res.status === "FAILED") {
          alert("Generation failed ❌");
          finished = true;
        }
      }

    } catch (e) {
      console.error(e);
      alert("Error contacting API");
    } finally {
      setIsGenerating(false);
    }
  };

  // ========= CANVAS UI EVENTS =========
  const startDraw = (e) => {
    const pos = getCoords(e);
    setIsDrawing(true);

    if (tool === 'pen') {
      setCurrentShape({ type: "free", points: [pos], color, strokeWidth });
    } else {
      setCurrentShape({
        type: tool,
        x: pos.x, y: pos.y,
        w: 0, h: 0,
        color, strokeWidth,
        fillColor, fillEnabled
      });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getCoords(e);

    if (currentShape.type === 'free') {
      currentShape.points.push(pos);
    } else {
      currentShape.w = pos.x - currentShape.x;
      currentShape.h = pos.y - currentShape.y;
    }
    redraw();
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentShape) {
      setShapes(prev => [...prev, currentShape]);
      saveToHistory();
    }
    setCurrentShape(null);
  };

  // ========= CLEAR CANVAS =========
  const clear = () => {
    setShapes([]);
    saveToHistory();
    redraw();
  };

  const downloadImage = () => {
    const data = exportCanvasImage();
    const a = document.createElement("a");
    a.href = data;
    a.download = "neura3d_sketch.png";
    a.click();
  };

  // ========= RENDER =========
  return (
    <div className="flex h-screen text-white bg-black">
      {/* ===== TOOLBAR LEFT ===== */}
      <aside className="flex flex-col items-center w-20 p-3 space-y-3 bg-gray-900 border-r border-gray-800">
        {[
          { id: 'pen', icon: <FaPen /> },
          { id: 'pencil', icon: <FaPencilAlt /> },
          { id: 'eraser', icon: <FaEraser /> },
          { id: 'line', icon: <TbRectangle style={{ transform: 'rotate(45deg)' }} /> },
          { id: 'rectangle', icon: <FaSquare /> },
          { id: 'rounded', icon: <MdOutlineRoundedCorner /> },
          { id: 'circle', icon: <FaCircle /> },
          { id: 'triangle', icon: <TbTriangle /> },
          { id: 'text', icon: <FaFont /> },
        ].map(t => (
          <button
            key={t.id}
            className={`p-3 rounded-lg ${tool === t.id ? "bg-red-600" : "bg-gray-800"}`}
            onClick={() => setTool(t.id)}
          >
            {t.icon}
          </button>
        ))}

        <div className="h-px w-full bg-gray-700 my-2" />
        <button onClick={undo} className="p-3 bg-gray-800 rounded-lg"><FaUndo /></button>
        <button onClick={redo} className="p-3 bg-gray-800 rounded-lg"><FaRedo /></button>
        <button onClick={clear} className="p-3 bg-red-600 rounded-lg"><FaTrash /></button>
        <button onClick={() => setShowGrid(!showGrid)} className="p-3 bg-gray-800 rounded-lg"><FaTh /></button>
      </aside>

      {/* ===== PROPERTIES ===== */}
      <aside className="w-64 p-4 space-y-4 bg-gray-900 border-r border-gray-800">
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />
        <input type="color" value={fillColor} onChange={e => setFillColor(e.target.value)} />
        <div>
          <label>Stroke {strokeWidth}px</label>
          <input type="range" min="1" max="30" value={strokeWidth} onChange={e => setStrokeWidth(+e.target.value)} />
        </div>
        <label>
          <input type="checkbox" checked={fillEnabled} onChange={e => setFillEnabled(e.target.checked)} />
          Fill
        </label>

        <div className="flex gap-2">
          <button onClick={() => setZoom(z => z - 0.1)}> <FaSearchMinus /> </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => z + 0.1)}> <FaSearchPlus /> </button>
        </div>
      </aside>

      {/* ===== CANVAS + BUTTONS ===== */}
      <main className="flex flex-col flex-1 p-4">
        <div className="flex justify-between mb-3">
          <button onClick={() => navigate('/workspace')}>Back</button>

          <motion.button
            onClick={generate3D}
            disabled={isGenerating}
            className="px-6 py-2 bg-red-600 rounded-lg"
          >
            {isGenerating ? "Generating..." : "Generate 3D"}
          </motion.button>
        </div>

        <div className="bg-white flex-1 rounded-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1200}
            height={680}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
          />
        </div>

        {modelUrl && (
          <div className="p-4">
            <model-viewer
              src={modelUrl}
              alt="AI Generated 3D"
              camera-controls
              auto-rotate
              style={{ width: "100%", height: "480px" }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
