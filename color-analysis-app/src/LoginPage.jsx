import React, { useState } from "react";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import TypingEffect from "./TypingEffect";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";

export default function LoginPage({ onLoginSuccess }) {
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess?.();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient"></div>

      {/* Soft Particles */}
      <Particles
        className="absolute inset-0"
        options={{
          fpsLimit: 60,
          interactivity: {
            events: { onHover: { enable: false }, onClick: { enable: false } },
          },
          particles: {
            color: { value: "#ffffff33" },
            move: { direction: "top", enable: true, speed: 0.5 },
            number: { density: { enable: true, area: 800 }, value: 50 },
            opacity: { value: 0.2 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
          },
        }}
      />

      {/* Blurred Blobs */}
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 15, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-white/5 rounded-full blur-2xl animate-blob animation-delay-2000"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity }}
      />

      {/* Login Card */}
      <Card className="relative z-10 max-w-md w-full bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-extrabold text-white drop-shadow-lg">
            Style Analyzer
          </h1>
          <p className="mt-2 text-indigo-100 drop-shadow-md">
            Your personalized fashion guide
          </p>
        </motion.div>

        {/* Typing Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-6 text-indigo-100 text-sm"
        >
          <TypingEffect
            texts={[
              "You are capable of amazing things!",
              "Believe in yourself and your dreams!",
              "Every day is a new opportunity!",
            ]}
            typingSpeed={100}
            pauseTime={1500}
          />
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-white">Email</label>
            <Input type="email" placeholder="you@example.com" required />
          </div>

          {isSignup && (
            <div>
              <label className="text-sm text-white">Full Name</label>
              <Input type="text" placeholder="Your Name" required />
            </div>
          )}

          <div>
            <label className="text-sm text-white">Password</label>
            <Input type="password" placeholder="••••••••" required />
          </div>

          <Button type="submit" className="w-full">
            {isSignup ? "Sign Up" : "Login"}
          </Button>
        </form>

        {/* Auth Toggle + Skip */}
        <div className="mt-6 text-sm text-center text-indigo-100 space-y-2">
          <p>
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="cursor-pointer text-white font-semibold hover:underline"
            >
              {isSignup ? "Login" : "Sign Up"}
            </span>
          </p>

          <Button
            onClick={handleSubmit}
            variant="ghost"
            className="mx-auto text-white/80 hover:text-white transition-all duration-200 text-sm hover:scale-105"
          >
            ✨ Skip for now
          </Button>
        </div>

        {/* Google Login */}
        <div className="mt-6">
          <Button className="w-full bg-white/30 text-white hover:bg-white/40 transition-all duration-200">
            Continue with Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
