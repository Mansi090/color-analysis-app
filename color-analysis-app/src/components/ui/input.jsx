export function Input({ className = "", ...props }) {
    return (
      <input
        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 
                    bg-gray-100 placeholder-gray-500 text-gray-800 transition-all duration-300 
                    hover:bg-gray-200 focus:ring-offset-2 focus:ring-opacity-70 ${className}`}
        {...props}
      />
    );
  }
  