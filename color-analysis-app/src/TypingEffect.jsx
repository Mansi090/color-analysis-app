import React, { useState, useEffect } from 'react';

const TypingEffect = ({ texts, typingSpeed = 9000, pauseTime = 2000 }) => {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    let timeout;

    if (!isDeleting && charIndex <= currentText.length) {
      setDisplayText(currentText.substring(0, charIndex));
      timeout = setTimeout(() => setCharIndex(charIndex + 1), typingSpeed);
    } else if (isDeleting && charIndex >= 0) {
      setDisplayText(currentText.substring(0, charIndex));
      timeout = setTimeout(() => setCharIndex(charIndex - 1), typingSpeed / 2);
    }

    if (!isDeleting && charIndex === currentText.length + 1) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex((textIndex + 1) % texts.length);
      timeout = setTimeout(() => setCharIndex(1), typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts, typingSpeed, pauseTime]);

  return (
    <div className="text-center">
      <div className="text-xl font-bold text-gray-700 inline-block">
        {displayText}
        <span className="blinking-cursor inline-block">|</span>
      </div>
      <style jsx>{`
        .blinking-cursor {
          font-weight: 100;
          font-size: 1em;
          color: #2d3748;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TypingEffect;
