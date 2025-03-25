import React, { useState } from "react";
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female',
    bodyType: 'hourglass'
  });
  const [uploadStatus, setUploadStatus] = useState('idle');

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadStatus('loading');
    
    const formPayload = new FormData();
    formPayload.append('image', e.target.image.files[0]);
    Object.entries(formData).forEach(([key, value]) => {
      formPayload.append(key, value);
    });

    try {
      const response = await fetch("http://localhost:5000/generate-pdf", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) throw new Error('Report generation failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'style-analysis.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setUploadStatus('success');
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="max-w-2xl w-full mx-auto bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700/50 backdrop-blur-lg bg-opacity-90">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-rose-300 to-violet-400 mb-2">
            Personal Style Analyzer
          </h1>
          <p className="text-slate-400 font-light">Complete Style Assessment Suite</p>
        </div>

        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 block mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500"
                required
              />
            </div>
            
            <div>
              <label className="text-slate-300 block mb-2">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500"
                min="13"
                max="100"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-Binary</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-2">Body Type</label>
              <select
                name="bodyType"
                value={formData.bodyType}
                onChange={handleInputChange}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="hourglass">Hourglass</option>
                <option value="pear">Pear</option>
                <option value="apple">Apple</option>
                <option value="rectangle">Rectangle</option>
                <option value="inverted-triangle">Inverted Triangle</option>
              </select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 transition-all hover:border-rose-500/50 hover:bg-slate-700/20">
            <label className="cursor-pointer block">
              <div className="text-center space-y-3">
                <div className="text-3xl opacity-80">📸</div>
                <p className="text-lg font-medium text-slate-200">
                  Upload Your Photo
                </p>
                <p className="text-sm text-slate-400 font-light">
                  Full-body photo in natural lighting recommended
                </p>
              </div>
              <input
                type="file"
                name="image"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
                required
              />
            </label>
          </div>

          {image && (
            <div className="relative group overflow-hidden rounded-xl border border-slate-700 shadow-xl">
              <img 
                src={image} 
                alt="Upload preview" 
                className="w-full h-64 object-cover transform transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={uploadStatus === 'loading'}
            className="w-full bg-gradient-to-r from-rose-500/80 to-violet-600/80 text-slate-100 py-4 rounded-xl font-light transition-all hover:shadow-lg hover:from-rose-500 hover:to-violet-600 flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            {uploadStatus === 'loading' ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <span className="text-xl">📊</span>
                <span>Generate Full Analysis Report</span>
              </>
            )}
          </button>

          {uploadStatus === 'error' && (
            <div className="text-red-400 text-center">
              Error generating report. Please try again.
            </div>
          )}
        </div>
      </form>
     
    </div>
  );
}

export default App;