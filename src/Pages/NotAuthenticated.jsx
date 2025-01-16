// src/components/NotAuthenticated.js
import React from "react";

const NotAuthenticated = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#131842] text-white">
      <h1 className="text-5xl font-bold mb-4">Access Denied</h1>
      <p className="text-lg mb-6">You Are Not Authenticated</p>
      <a
        href="/login"
        className="px-6 py-3 bg-white text-[#131842] rounded-lg shadow-md font-semibold hover:bg-gray-100 transition duration-300"
      >
        Go to Login
      </a>
    </div>
  );
};

export default NotAuthenticated;
