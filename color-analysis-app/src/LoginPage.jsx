import React, { useState, useEffect } from "react";
import TypingEffect from "./TypingEffect";

const affirmations = [
  "You are capable of amazing things!",
  "Believe in yourself and your dreams!",
  "Every day is a new opportunity!",
  "You are stronger than you think!",
  "Your style is your superpower!",
  "Create your own path to success!"
];

const LoginPage = ({ onLoginSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);

  // For page load we could set a random affirmation (optional if needed elsewhere)
  useEffect(() => {}, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate a successful login
    onLoginSuccess && onLoginSuccess();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 to-indigo-700 overflow-hidden">
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="max-w-4xl w-full bg-white bg-opacity-95 rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Hero / Description Section */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800">
              Personal Style Analyzer
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-600">
              Discover your unique style through a comprehensive analysis.
              Upload your photo and receive personalized style tips to help you
              express your individuality. Embrace the journey to a confident and
              authentic you.
            </p>
          </div>

          {/* Login Form Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold text-center text-gray-700">
              {isSignup ? "Create an Account" : "Welcome Back"}
            </h2>
            {/* Typing effect for affirmations */}
            <TypingEffect texts={affirmations} typingSpeed={150} pauseTime={2000} />
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
                />
              </div>
              {isSignup && (
                <div>
                  <label className="block text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-indigo-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                {isSignup ? "Sign Up" : "Login"}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={handleSubmit}
                className="text-sm text-indigo-600 hover:underline"
              >
                Skip for now
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <span
                  onClick={() => setIsSignup(!isSignup)}
                  className="cursor-pointer text-indigo-600 hover:underline"
                >
                  {isSignup ? "Login" : "Sign Up"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
