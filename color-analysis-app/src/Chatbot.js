import React, { useState } from "react";
import { Rnd } from "react-rnd";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState([
    { sender: "bot", text: "Hi there! I'm your fashion assistant. How can I help you today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  // Maintain dimensions and position in state for smoother resizing/dragging
  const [dimensions, setDimensions] = useState({
    width: 320,
    height: 480,
    x: window.innerWidth - 340,
    y: window.innerHeight - 520,
  });

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newConversation = [
      ...conversation,
      { sender: "user", text: inputText }
    ];
    setConversation(newConversation);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputText }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const botReply = data.reply;
      setConversation((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setConversation((prev) => [
        ...prev,
        { sender: "bot", text: "Oops, something went wrong. Please try again later." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <Rnd
          size={{ width: dimensions.width, height: dimensions.height }}
          position={{ x: dimensions.x, y: dimensions.y }}
          onDragStop={(e, d) => setDimensions({ ...dimensions, x: d.x, y: d.y })}
          onResizeStop={(e, direction, ref, delta, position) => {
            setDimensions({
              width: ref.offsetWidth,
              height: ref.offsetHeight,
              ...position,
            });
          }}
          minWidth={200}
          minHeight={200}
          bounds="window"
          enableResizing={{
            top: true,
            right: true,
            bottom: true,
            left: true,
            topRight: true,
            bottomRight: true,
            bottomLeft: true,
            topLeft: true,
          }}
          // Inline transition styles for smoother resizing
          style={{ transition: "width 0.2s ease, height 0.2s ease" }}
          className="bg-gray-900 border border-gray-700 shadow-lg flex flex-col rounded-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white rounded-t-lg">
            <h4 className="font-semibold">Fashion Assistant</h4>
            <button onClick={toggleChat} className="text-xl">
              &times;
            </button>
          </div>
          {/* Messages Area */}
          <div className="flex-1 p-3 bg-gray-800 overflow-y-auto space-y-2 text-white">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded ${msg.sender === "user" ? "bg-purple-600 self-end" : "bg-blue-600 self-start"}`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="p-2 rounded bg-blue-600 self-start">...</div>
            )}
          </div>
          {/* Input Section */}
          <form onSubmit={sendMessage} className="flex border-t border-gray-700">
            <input
              type="text"
              placeholder="Ask me about fashion..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 p-2 bg-gray-700 text-white placeholder-gray-400 outline-none"
            />
            <button type="submit" className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              Send
            </button>
          </form>
        </Rnd>
      )}
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full text-3xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg flex items-center justify-center z-50"
          onClick={toggleChat}
        >
          💬
        </button>
      )}
    </>
  );
};

export default Chatbot;
