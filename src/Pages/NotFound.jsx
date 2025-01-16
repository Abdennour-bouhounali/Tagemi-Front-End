// src/components/NotFound.js
import React from "react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#131842] text-white">
      <h1 className="text-8xl font-extrabold mb-4">404</h1>
      <p className="text-lg mb-6">This Page Does Not Exist</p>
      <a
        href="/"
        className="px-6 py-3 bg-white text-[#131842] rounded-lg shadow-md font-semibold hover:bg-gray-100 transition duration-300"
      >
        Go Back Home
      </a>
    </div>
  );
};

export default NotFound;
