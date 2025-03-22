import React, { useState } from "react";
// In your App.js file, add this import at the top:
import './App.css';
function App() {
  const [image, setImage] = useState(null);
  const [color, setColor] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const handleImageUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setImage(URL.createObjectURL(uploadedFile));
      setFile(uploadedFile);
      setUploadSuccess(true);

      const formData = new FormData();
      formData.append("image", uploadedFile);

      try {
        const response = await fetch("http://127.0.0.1:5000/analyze-color", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to fetch color data");
        
        const data = await response.json();
        setColor(`rgb(${data.dominant_color.join(",")})`);
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  const downloadPDF = async () => {
    if (!file) {
      alert("Upload an image first!");
      return;
    }
  
    const formData = new FormData();
    formData.append("image", file);
  
    try {
      const response = await fetch("http://127.0.0.1:5000/generate-pdf", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "color_analysis.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(`Failed to generate report: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700/50 backdrop-blur-lg bg-opacity-90">
        <div className="mb-8 text-center">
          <div className="animate-pulse-slow bg-gradient-to-r from-rose-400 to-violet-600 w-24 h-24 rounded-full mx-auto mb-4 shadow-glow" />
          <h1 className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-violet-400 mb-2">
          Color Analysis
          </h1>
          <p className="text-slate-400 font-light">Color Analysis Suite</p>
        </div>

        <div className="space-y-6">
          <label className="block group cursor-pointer transform transition-all hover:scale-[1.01]">
            <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 transition-all hover:border-rose-500/50 hover:bg-slate-700/20">
              <div className="text-center space-y-3">
                <div className="text-3xl opacity-80">🖼️</div>
                <p className="text-lg font-medium text-slate-200">
                  Capture or Upload
                </p>
                <p className="text-sm text-slate-400 font-light">
                  Recommended: High-resolution image with natural lighting
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </label>

          {uploadSuccess && (
            <div className="bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-lg flex items-center space-x-3 animate-fade-in">
              <span className="text-xl">🌟</span>
              <span className="font-light">Image Perfectly Captured</span>
            </div>
          )}

          {image && (
            <div className="relative group overflow-hidden rounded-xl border border-slate-700 shadow-xl">
              <img 
                src={image} 
                alt="Analysis preview" 
                className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            </div>
          )}

          {color && (
            <div className="bg-slate-700/20 p-6 rounded-xl border border-slate-700/50 space-y-4 backdrop-blur-sm">
              <h3 className="text-xl font-light text-rose-100">Dominant Hue</h3>
              <div className="relative h-24 rounded-xl overflow-hidden transform transition-transform hover:scale-[1.02]">
                <div 
                  className="absolute inset-0 opacity-90"
                  style={{ backgroundColor: color }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/40" />
                <span className="absolute bottom-3 right-3 font-mono text-sm text-slate-100 bg-slate-900/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  {color}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={downloadPDF}
            className="w-full bg-gradient-to-r from-rose-500/80 to-violet-600/80 text-slate-100 py-4 rounded-xl font-light transition-all hover:shadow-lg hover:from-rose-500 hover:to-violet-600 flex items-center justify-center space-x-3"
          >
            <span className="text-xl">📜</span>
            <span>Generate  Report</span>
          </button>

          <div className="text-center text-slate-400 text-sm pt-6 border-t border-slate-700/50">
            <p className="flex items-center justify-center space-x-2">
              <span>💎</span>
              <span className="font-light italic">Professional Tip: Use diffused lighting for optimal color accuracy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


export default App;
