export function Button({ children, className = "", ...props }) {
    return (
      <button
        className={`w-full py-2 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                    text-white font-semibold rounded-xl shadow-md 
                    transition-transform transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400
                    ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
  