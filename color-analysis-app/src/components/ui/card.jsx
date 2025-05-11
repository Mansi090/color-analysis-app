export function Card({ children, className = "" }) {
    return (
      <div
        className={`bg-white p-6 rounded-2xl shadow-xl border border-gray-200 transition-all transform hover:scale-105 hover:shadow-2xl 
                    bg-opacity-90 backdrop-blur-lg ${className}`}
      >
        {children}
      </div>
    );
  }
  