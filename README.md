🚀 Neura3D – Text & Image to 3D Model Generator

Neura3D is an AI-powered web tool that transforms natural language prompts or input images/sketches into 3D models (.glb).
This project integrates with ModelsLab 3D Generation APIs, offering high-quality mesh generation with simple user inputs.

The app is designed for:

3D designers

Game developers

AR/VR creators

Product prototypers

Students / hobbyists

🌟 Features
🧠 Text → 3D

Enter a description like:

“A futuristic sports car with chrome details and studio lighting.”

Neura3D sends your prompt to ModelsLab and returns a ready-to-view GLB 3D model.

🖼️ Image → 3D

Upload:

A real image

A sketch

A product reference

Neura3D converts it into a 3D mesh using the ModelsLab 3D image pipeline.

🔁 Live Preview

The generated model is displayed in-browser using <model-viewer>:

Rotate

Zoom

Auto orbit

⬇️ Download

Export your generated model as:

neura3d_model.glb


Ready for:

Blender

Unity

Unreal

3D printing

AR/VR projects

🧱 Tech Stack
Frontend

React (SPA)

Tailwind CSS

Framer Motion (UI micro-animations)

<model-viewer> Web Component

Backend

Node.js

Express

Fetch (Native API)

ModelsLab API

Auth & Misc

Firebase Authentication (Logout + session handling)

📂 Project Structure
Neura3D/
 ├── server/               # Node backend
 │   ├── index.js
 │   ├── package.json
 │   └── ...
 ├── src/                  # React frontend
 │   ├── Workspace.js
 │   ├── App.js
 │   ├── firebase.js
 │   └── ...
 ├── public/
 │   └── index.html
 ├── package.json
 └── README.md

🚀 Quick Start
1️⃣ Install dependencies

Backend:

cd server
npm install


Frontend:

cd ..
npm install

2️⃣ Start the backend
cd server
node index.js


Runs at:

http://localhost:4000

3️⃣ Start the frontend
npm start
