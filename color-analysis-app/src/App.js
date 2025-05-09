import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chatbot from "./Chatbot";
import LoginPage from "./LoginPage";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [image, setImage] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    vibe: "kawaii",
    bodyType: "hourglass",
  });
  const [errors, setErrors] = useState({});
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [glowScore, setGlowScore] = useState(0);
  const [charmMeter, setCharmMeter] = useState(0);
  const [tryOnItems, setTryOnItems] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [theme, setTheme] = useState("pastel");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Glow Score and Charm Meter system
  useEffect(() => {
    document.documentElement.className = theme;
    const charmInterval = setInterval(() => {
      setCharmMeter((prev) => Math.min(prev + (image ? 3 : 1), 100));
      setGlowScore((prev) => {
        const boost = image ? 5 : 2;
        return Math.max(0, Math.min(100, prev + (Math.random() > 0.5 ? boost : -boost)));
      });
    }, 1500);
    return () => clearInterval(charmInterval);
  }, [theme, image]);

  // Webcam setup
  useEffect(() => {
    if (useWebcam && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        })
        .catch((err) => {
          console.error("Webcam error:", err);
          setErrors((prev) => ({ ...prev, webcam: "Oops, can't access webcam!" }));
          setUseWebcam(false);
        });
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam]);

  // Form validation with friendly feedback
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "We need your adorable name!";
    if (!formData.age || formData.age < 13 || formData.age > 100)
      newErrors.age = "Age should be 13-100, cutie!";
    if (!image) newErrors.image = "Please share a photo!";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setCharmMeter((prev) => prev + 10);
    }
    return Object.keys(newErrors).length === 0;
  }, [formData, image]);

  useEffect(() => {
    const timer = setTimeout(validateForm, 500);
    return () => clearTimeout(timer);
  }, [formData, image, validateForm]);

  // Generate virtual try-on items
  const generateTryOnItems = useCallback(() => {
    const items = {
      kawaii: ["Fluffy bunny hoodie", "Pastel skirt", "Sparkly bow", "Star sneakers"],
      boho: ["Floral maxi dress", "Fringe cardigan", "Beaded sandals", "Feather hat"],
      preppy: ["Plaid blazer", "Pleated skirt", "Loafers", "Pearl necklace"],
      grunge: ["Ripped denim jacket", "Band tee", "Combat boots", "Choker"],
    };
    setTryOnItems(items[formData.vibe] || []);
    setCharmMeter((prev) => prev + 15);
  }, [formData.vibe]);

  useEffect(() => {
    if (image) {
      generateTryOnItems();
    }
  }, [image, generateTryOnItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setCharmMeter((prev) => prev + 5);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please pick a photo, sweetie!" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setErrors((prev) => ({ ...prev, image: null }));
      setUseWebcam(false);
    };
    reader.readAsDataURL(file);
  };

  const captureWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setImage(dataUrl);
    setErrors((prev) => ({ ...prev, image: null }));
    setUseWebcam(false);
    setCharmMeter((prev) => prev + 20);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploadStatus("loading");
    const formPayload = new FormData();
    if (image) {
      const response = await fetch(image);
      const blob = await response.blob();
      formPayload.append("image", blob, "image.jpg");
    }
    Object.entries(formData).forEach(([key, value]) => {
      formPayload.append(key, value);
    });

    try {
      const response = await fetch("http://localhost:5000/generate-pdf", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) throw new Error("Something went wrong, oh no!");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "glampaw-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setUploadStatus("success");
      setCharmMeter(100);
    } catch (error) {
      console.error(error);
      setUploadStatus("error");
      setCharmMeter((prev) => Math.max(0, prev - 20));
    }
  };

  const handleDownloadStyleCard = () => {
    const styleCard = {
      ...formData,
      glowScore,
      charmMeter,
      tryOnItems,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(styleCard, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glampaw-card.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleTheme = () => {
    setTheme(theme === "pastel" ? "vibrant" : "pastel");
    setCharmMeter((prev) => prev + 10);
  };

  // Memoized PawButton component
  const PawButton = useMemo(
    () =>
      ({ children, onClick, disabled, tooltip }) =>
        (
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 0 15px rgba(255, 182, 193, 0.7)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              disabled={disabled}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 transition-all duration-300 ${
                disabled ? "bg-gray-300/50 opacity-50 cursor-not-allowed" : "bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500"
              }`}
            >
              {children}
            </motion.button>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                className="absolute z-10 px-3 py-2 text-sm font-medium bg-pink-100 text-pink-600 rounded-lg shadow-lg -top-12 left-1/2 transform -translate-x-1/2"
              >
                {tooltip}
              </motion.div>
            )}
          </div>
        ),
    [],
  );

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div className={`min-h-screen ${theme === "pastel" ? "bg-pink-50" : "bg-yellow-50"} overflow-hidden relative`}>
      {/* Glittery Background */}
      <style>
        {`
          .glitter-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            background: ${theme === "pastel"
              ? "linear-gradient(135deg, #fce2e6, #e9d8fd, #d9f7fa)"
              : "linear-gradient(135deg, #fefcbf, #fed7aa, #f9a8d4)"};
            background-size: 200% 200%;
            animation: glitterFlow 12s ease infinite;
          }
          @keyframes glitterFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .sparkle {
            position: absolute;
            width: 10px;
            height: 10px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            animation: sparkleTwinkle 3s infinite;
            pointer-events: none;
          }
          .sparkle:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
          .sparkle:nth-child(2) { top: 30%; left: 70%; animation-delay: 1s; }
          .sparkle:nth-child(3) { top: 60%; left: 40%; animation-delay: 2s; }
          @keyframes sparkleTwinkle {
            0%, 100% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1); opacity: 1; }
          }
          .confetti {
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${theme === "pastel" ? "#f9a8d4" : "#fefcbf"};
            animation: confettiFall 2s linear infinite;
            pointer-events: none;
          }
          .confetti:nth-child(1) { left: 10%; animation-delay: 0s; }
          .confetti:nth-child(2) { left: 50%; animation-delay: 0.5s; }
          .confetti:nth-child(3) { left: 80%; animation-delay: 1s; }
          @keyframes confettiFall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
        `}
      </style>
      <div className="glitter-bg" />
      <div className="sparkle" />
      <div className="sparkle" />
      <div className="sparkle" />

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex justify-between items-center mb-12"
          >
            <div className="text-center">
              <h1 className={`text-6xl font-bold ${theme === "pastel" ? "text-pink-500" : "text-yellow-500"} font-cursive tracking-wide`}>
                GlamPaw Studio
              </h1>
              <p className={`mt-4 text-xl ${theme === "pastel" ? "text-purple-400" : "text-orange-400"} font-light animate-bounce`}>
                Paws Up for Fabulous Style!
              </p>
            </div>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.2, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-4 rounded-full ${theme === "pastel" ? "bg-pink-200 text-purple-500" : "bg-yellow-200 text-orange-500"} shadow-lg transition-colors duration-300 flex items-center justify-center relative overflow-hidden`}
                aria-label="Toggle theme"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl"
                >
                  ⭐
                </motion.span>
                <motion.span
                  className="absolute inset-0 bg-white/20"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute top-12 left-1/2 transform -translate-x-1/2 text-sm font-medium ${theme === "pastel" ? "text-pink-600" : "text-yellow-600"}`}
              >
                {theme === "pastel" ? "Go Vibrant!" : "Go Pastel!"}
              </motion.span>
              <div className="confetti" />
              <div className="confetti" />
              <div className="confetti" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`w-full mx-auto ${theme === "pastel" ? "bg-white/80 border-pink-300/50" : "bg-white/80 border-yellow-300/50"} rounded-3xl shadow-2xl p-12 border backdrop-blur-lg transition-all duration-500`}
          >
            <div className="space-y-12">
              {/* Glow Score and Charm Meter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center bg-pink-100/50 rounded-2xl p-6"
              >
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${theme === "pastel" ? "text-pink-500" : "text-yellow-500"}`}>Glow Score</h3>
                  <motion.div
                    className="w-20 h-20 rounded-full border-4 border-pink-400 flex items-center justify-center mt-2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className={`text-2xl font-bold ${theme === "pastel" ? "text-purple-500" : "text-orange-500"}`}>{glowScore}%</span>
                  </motion.div>
                </div>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${theme === "pastel" ? "text-pink-500" : "text-yellow-500"}`}>Charm Meter</h3>
                  <div className="w-40 h-3 bg-pink-200 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
                      style={{ width: `${charmMeter}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className={`text-sm ${theme === "pastel" ? "text-gray-500" : "text-gray-600"} mt-2`}>{charmMeter > 75 ? "Radiant!" : charmMeter > 50 ? "Charming!" : "Growing!"}</p>
                </div>
              </motion.div>

              <motion.form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                  >
                    <label htmlFor="name" className={`${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} block mb-3 font-semibold text-lg font-cursive`}>
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full ${theme === "pastel" ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400" : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"} border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300`}
                      required
                    />
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-pink-500 text-sm mt-2 font-medium"
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
                  >
                    <label htmlFor="age" className={`${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} block mb-3 font-semibold text-lg font-cursive`}>
                      Your Age
                    </label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      min="13"
                      max="100"
                      className={`w-full ${theme === "pastel" ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400" : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"} border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300`}
                      required
                    />
                    <AnimatePresence>
                      {errors.age && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-pink-500 text-sm mt-2 font-medium"
                        >
                          {errors.age}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                  >
                    <label htmlFor="vibe" className={`${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} block mb-3 font-semibold text-lg font-cursive`}>
                      Fashion Vibe
                    </label>
                    <select
                      id="vibe"
                      name="vibe"
                      value={formData.vibe}
                      onChange={handleInputChange}
                      className={`w-full ${theme === "pastel" ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400" : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"} border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300 appearance-none`}
                    >
                      <option value="kawaii">Kawaii Cuteness</option>
                      <option value="boho">Boho Dreamer</option>
                      <option value="preppy">Preppy Charm</option>
                      <option value="grunge">Grunge Rebel</option>
                    </select>
                  </motion.div>

                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
                  >
                    <label htmlFor="bodyType" className={`${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} block mb-3 font-semibold text-lg font-cursive`}>
                      Body Type
                    </label>
                    <select
                      id="bodyType"
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleInputChange}
                      className={`w-full ${theme === "pastel" ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400" : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"} border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300 appearance-none`}
                    >
                      <option value="hourglass">Hourglass</option>
                      <option value="pear">Pear</option>
                      <option value="apple">Apple</option>
                      <option value="rectangle">Rectangle</option>
                      <option value="inverted-triangle">Inverted Triangle</option>
                    </select>
                  </motion.div>
                </div>

                {/* Side-by-Side Photo and Webcam */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  <div className={`border-2 border-dashed ${theme === "pastel" ? "border-pink-300 hover:border-purple-400" : "border-yellow-300 hover:border-orange-400"} rounded-2xl p-8 transition-all duration-300`}>
                    <label htmlFor="image-upload" className="cursor-pointer block text-center">
                      <motion.div
                        className="space-y-4"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className={`text-5xl ${theme === "pastel" ? "text-pink-400" : "text-yellow-400"} animate-pulse`}>📸</div>
                        <p className={`text-xl font-semibold ${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} font-cursive`}>Upload a Photo</p>
                        <p className={`text-sm ${theme === "pastel" ? "text-gray-500" : "text-gray-600"}`}>Show us your cutest outfit!</p>
                      </motion.div>
                      <input
                        id="image-upload"
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <AnimatePresence>
                      {errors.image && !useWebcam && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-pink-500 text-sm mt-3 text-center font-medium"
                        >
                          {errors.image}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className={`border-2 border-dashed ${theme === "pastel" ? "border-pink-300 hover:border-purple-400" : "border-yellow-300 hover:border-orange-400"} rounded-2xl p-8 transition-all duration-300`}>
                    {useWebcam ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <video ref={videoRef} className="w-full h-48 rounded-xl shadow-lg" autoPlay />
                        <PawButton onClick={captureWebcam} tooltip="Snap a cute selfie!">
                          <span className="text-xl">📷</span>
                          <span>Snap Photo</span>
                        </PawButton>
                        <canvas ref={canvasRef} className="hidden" />
                      </motion.div>
                    ) : (
                      <motion.div
                        className="text-center space-y-4"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        onClick={() => setUseWebcam(true)}
                      >
                        <div className={`text-5xl ${theme === "pastel" ? "text-pink-400" : "text-yellow-400"} animate-pulse`}>🎥</div>
                        <p className={`text-xl font-semibold ${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} font-cursive`}>Use Webcam</p>
                        <p className={`text-sm ${theme === "pastel" ? "text-gray-500" : "text-gray-600"}`}>Smile for the camera!</p>
                      </motion.div>
                    )}
                    <AnimatePresence>
                      {errors.webcam && useWebcam && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-pink-500 text-sm mt-3 text-center font-medium"
                        >
                          {errors.webcam}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {image && (
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      className="relative group overflow-hidden rounded-2xl border-2 border-pink-300 shadow-lg"
                    >
                      <img
                        src={image}
                        alt="Your photo"
                        className="w-full h-80 object-cover transform transition-transform duration-700 group-hover:scale-110"
                      />
                      <PawButton onClick={() => setShowPreview(true)} tooltip="See your photo bigger!">
                        <span className="text-xl">👀</span>
                        <span>Peek</span>
                      </PawButton>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Try-On Carousel */}
                {tryOnItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-pink-100/50 rounded-2xl shadow-lg"
                  >
                    <h3 className={`text-xl font-semibold ${theme === "pastel" ? "text-pink-600" : "text-yellow-600"} mb-4 font-cursive`}>Virtual Try-On</h3>
                    <div className="flex overflow-x-auto space-x-4 pb-4">
                      {tryOnItems.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className="flex-shrink-0 w-48 p-4 bg-white/50 rounded-xl shadow-md"
                        >
                          <div className={`text-3xl mb-2 ${theme === "pastel" ? "text-purple-400" : "text-orange-400"}`}>👗</div>
                          <p className={`text-sm font-medium ${theme === "pastel" ? "text-gray-700" : "text-gray-800"}`}>{item}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {uploadStatus === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full bg-pink-200/50 rounded-full h-4 overflow-hidden shadow-md"
                  >
                    <motion.div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400"
                      style={{ width: `${charmMeter}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PawButton disabled={uploadStatus === "loading"} tooltip="Get your style report!">
                    <span className="text-xl">🎀</span>
                    <span>Create Report</span>
                  </PawButton>
                  <PawButton onClick={handleDownloadStyleCard} tooltip="Save your style card!">
                    <span className="text-xl">💖</span>
                    <span>Style Card</span>
                  </PawButton>
                </div>

                <AnimatePresence>
                  {uploadStatus === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="text-pink-500 text-center mt-6 font-medium"
                    >
                      Oh no! Something went wrong. Try again, cutie!
                    </motion.div>
                  )}
                  {uploadStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="text-purple-500 text-center mt-6 font-medium"
                    >
                      Yay! Your style report is ready!
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>
            </div>
          </motion.div>

          {/* Preview Modal */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                onClick={() => setShowPreview(false)}
              >
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="relative max-w-4xl w-full m-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img src={image} alt="Full preview" className="w-full rounded-2xl shadow-2xl border-2 border-pink-300" />
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPreview(false)}
                    className="absolute top-4 right-4 p-3 bg-pink-400 text-white rounded-full shadow-lg"
                  >
                    ✕
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bunny Mascot */}
          <motion.div
            className="fixed bottom-4 left-4 z-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <div className={`text-5xl ${theme === "pastel" ? "text-pink-400" : "text-yellow-400"} animate-bounce`}>🐰</div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.1, 0.9, 1] }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-pink-100 text-pink-600 text-sm rounded-full shadow"
              >
                Hiii, cutie!
              </motion.div>
            </div>
          </motion.div>

          {/* Chatbot */}
          <motion.div
            className="fixed bottom-4 right-4 z-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
          >
            <Chatbot />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default App;