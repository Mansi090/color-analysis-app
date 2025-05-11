import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [serverError, setServerError] = useState(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [theme, setTheme] = useState("pastel");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

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
          setErrors((prev) => ({ ...prev, webcam: "Oops, can't access webcam! 😿" }));
          setUseWebcam(false);
        });
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam]);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "We need your adorable name! 😺";
    if (!formData.age || formData.age < 13 || formData.age > 100)
      newErrors.age = "Age should be 13-100, cutie! 🎀";
    if (!image) newErrors.image = "Please share a photo! 📸";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, image]);

  useEffect(() => {
    const timer = setTimeout(validateForm, 500);
    return () => clearTimeout(timer);
  }, [formData, image, validateForm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setServerError(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please pick a photo, sweetie! 😿" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setErrors((prev) => ({ ...prev, image: null }));
      setServerError(null);
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
    setServerError(null);
    setUseWebcam(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploadStatus("loading");
    setServerError(null);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong, oh no! 😿");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "glampaw-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setUploadStatus("success");
    } catch (error) {
      console.error(error);
      setServerError(error.message);
      setUploadStatus("error");
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      age: "",
      vibe: "kawaii",
      bodyType: "hourglass",
    });
    setImage(null);
    setErrors({});
    setServerError(null);
    setUploadStatus("idle");
    setUseWebcam(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "pastel" ? "vibrant" : "pastel");
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
                disabled
                  ? "bg-gray-300/50 opacity-50 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-400 to-purple-400 text-white hover:from-pink-500 hover:to-purple-500"
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
    []
  );

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div
      className={`min-h-screen ${
        theme === "pastel" ? "bg-pink-50" : "bg-yellow-50"
      } overflow-hidden relative`}
    >
      {/* Glittery Background and Animations */}
      <style>
        {`
          .glitter-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            background: ${
              theme === "pastel"
                ? "linear-gradient(135deg, #fce2e6, #e9d8fd, #d9f7fa)"
                : "linear-gradient(135deg, #fefcbf, #fed7aa, #f9a8d4)"
            };
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
          .spinner {
            border: 4px solid rgba(255, 182, 193, 0.3);
            border-top: 4px solid #f9a8d4;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="glitter-bg" />
      <div className="sparkle" />
      <div className="sparkle" />
      <div className="sparkle" />
      <div className="confetti" />
      <div className="confetti" />
      <div className="confetti" />

      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex justify-between items-center mb-12"
          >
            <div className="text-center flex-1">
              <h1
                className={`text-6xl font-bold ${
                  theme === "pastel" ? "text-pink-500" : "text-yellow-500"
                } font-cursive tracking-wide`}
              >
                GlamPaw Studio
              </h1>
              <p
                className={`mt-4 text-xl ${
                  theme === "pastel" ? "text-purple-400" : "text-orange-400"
                } font-light animate-bounce`}
              >
                Paws Up for Fabulous Style! 🐾
              </p>
            </div>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.2, rotate: 360 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className={`p-4 rounded-full ${
                  theme === "pastel"
                    ? "bg-pink-200 text-purple-500"
                    : "bg-yellow-200 text-orange-500"
                } shadow-lg transition-colors duration-300 flex items-center justify-center relative overflow-hidden`}
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
                className={`absolute top-12 left-1/2 transform -translate-x-1/2 text-sm font-medium ${
                  theme === "pastel" ? "text-pink-600" : "text-yellow-600"
                }`}
              >
                {theme === "pastel" ? "Go Vibrant!" : "Go Pastel!"}
              </motion.span>
            </div>
          </motion.div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`w-full mx-auto ${
              theme === "pastel"
                ? "bg-white/80 border-pink-300/50"
                : "bg-white/80 border-yellow-300/50"
            } rounded-3xl shadow-2xl p-12 border backdrop-blur-lg transition-all duration-500`}
          >
            <div className="space-y-12">
              <motion.form onSubmit={handleSubmit} className="space-y-10">
                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                  >
                    <label
                      htmlFor="name"
                      className={`${
                        theme === "pastel" ? "text-pink-600" : "text-yellow-600"
                      } block mb-3 font-semibold text-lg font-cursive`}
                    >
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full ${
                        theme === "pastel"
                          ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400"
                          : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"
                      } border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300`}
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
                    <label
                      htmlFor="age"
                      className={`${
                        theme === "pastel" ? "text-pink-600" : "text-yellow-600"
                      } block mb-3 font-semibold text-lg font-cursive`}
                    >
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
                      className={`w-full ${
                        theme === "pastel"
                          ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400"
                          : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"
                      } border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300`}
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
                    <label
                      htmlFor="vibe"
                      className={`${
                        theme === "pastel" ? "text-pink-600" : "text-yellow-600"
                      } block mb-3 font-semibold text-lg font-cursive`}
                    >
                      Fashion Vibe
                    </label>
                    <select
                      id="vibe"
                      name="vibe"
                      value={formData.vibe}
                      onChange={handleInputChange}
                      className={`w-full ${
                        theme === "pastel"
                          ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400"
                          : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"
                      } border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300 appearance-none`}
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
                    <label
                      htmlFor="bodyType"
                      className={`${
                        theme === "pastel" ? "text-pink-600" : "text-yellow-600"
                      } block mb-3 font-semibold text-lg font-cursive`}
                    >
                      Body Type
                    </label>
                    <select
                      id="bodyType"
                      name="bodyType"
                      value={formData.bodyType}
                      onChange={handleInputChange}
                      className={`w-full ${
                        theme === "pastel"
                          ? "bg-pink-50 border-pink-300 text-pink-700 focus:border-purple-400"
                          : "bg-yellow-50 border-yellow-300 text-yellow-700 focus:border-orange-400"
                      } border rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 shadow-sm transition-all duration-300 appearance-none`}
                    >
                      <option value="hourglass">Hourglass</option>
                      <option value="pear">Pear</option>
                      <option value="apple">Apple</option>
                      <option value="rectangle">Rectangle</option>
                      <option value="inverted-triangle">Inverted Triangle</option>
                    </select>
                  </motion.div>
                </div>

                {/* Photo and Webcam Section */}
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 150 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  <div
                    className={`border-2 border-dashed ${
                      theme === "pastel"
                        ? "border-pink-300 hover:border-purple-400"
                        : "border-yellow-300 hover:border-orange-400"
                    } rounded-2xl p-8 transition-all duration-300`}
                  >
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer block text-center"
                    >
                      <motion.div
                        className="space-y-4"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div
                          className={`text-5xl ${
                            theme === "pastel"
                              ? "text-pink-400"
                              : "text-yellow-400"
                          } animate-pulse`}
                        >
                          📸
                        </div>
                        <p
                          className={`text-xl font-semibold ${
                            theme === "pastel"
                              ? "text-pink-600"
                              : "text-yellow-600"
                          } font-cursive`}
                        >
                          Upload a Photo
                        </p>
                        <p
                          className={`text-sm ${
                            theme === "pastel"
                              ? "text-gray-500"
                              : "text-gray-600"
                          }`}
                        >
                          Show us your cutest outfit! 😺
                        </p>
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

                  <div
                    className={`border-2 border-dashed ${
                      theme === "pastel"
                        ? "border-pink-300 hover:border-purple-400"
                        : "border-yellow-300 hover:border-orange-400"
                    } rounded-2xl p-8 transition-all duration-300`}
                  >
                    {useWebcam ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <video
                          ref={videoRef}
                          className="w-full h-48 rounded-xl shadow-lg"
                          autoPlay
                        />
                        <PawButton
                          onClick={captureWebcam}
                          tooltip="Snap a cute selfie!"
                        >
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
                        <div
                          className={`text-5xl ${
                            theme === "pastel"
                              ? "text-pink-400"
                              : "text-yellow-400"
                          } animate-pulse`}
                        >
                          🎥
                        </div>
                        <p
                          className={`text-xl font-semibold ${
                            theme === "pastel"
                              ? "text-pink-600"
                              : "text-yellow-600"
                          } font-cursive`}
                        >
                          Use Webcam
                        </p>
                        <p
                          className={`text-sm ${
                            theme === "pastel"
                              ? "text-gray-500"
                              : "text-gray-600"
                          }`}
                        >
                          Smile for the camera! 😸
                        </p>
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

                {/* Image Preview */}
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
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Server Error Message */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center justify-center bg-pink-100/80 border-2 border-pink-300 rounded-xl p-4 shadow-md"
                    >
                      <span className="text-2xl mr-3">😿</span>
                      <p className="text-pink-600 text-lg font-medium">
                        {serverError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading Spinner */}
                {uploadStatus === "loading" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    <div className="spinner" />
                    <p
                      className={`text-lg font-medium ${
                        theme === "pastel"
                          ? "text-pink-600"
                          : "text-yellow-600"
                      }`}
                    >
                      Crafting your style report... ✨
                    </p>
                  </motion.div>
                )}

                {/* Success Message */}
                <AnimatePresence>
                  {uploadStatus === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center justify-center bg-purple-100/80 border-2 border-purple-300 rounded-xl p-4 shadow-md"
                    >
                      <span className="text-2xl mr-3">🎉</span>
                      <p className="text-purple-600 text-lg font-medium">
                        Yay! Your style report is ready! 🐾
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <PawButton
                    disabled={uploadStatus === "loading"}
                    tooltip="Get your style report!"
                  >
                    <span className="text-xl">🎀</span>
                    <span>Create Report</span>
                  </PawButton>
                  <PawButton
                    onClick={handleReset}
                    tooltip="Start over with a fresh look!"
                  >
                    <span className="text-xl">🔄</span>
                    <span>Reset</span>
                  </PawButton>
                </div>
              </motion.form>
            </div>
          </motion.div>

          {/* Bunny Mascot */}
          <motion.div
            className="fixed bottom-4 left-4 z-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 200 }}
          >
            <div className="relative">
              <div
                className={`text-5xl ${
                  theme === "pastel" ? "text-pink-400" : "text-yellow-400"
                } animate-bounce`}
              >
                🐰
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                transition={{ duration: 4, times: [0, 0.1, 0.9, 1] }}
                className="absolute -top-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-pink-100 text-pink-600 text-sm rounded-full shadow"
              >
                Let's slay that style! 😺
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default App;