import React from 'react';

const Button = ({ children, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 bg-blue-500 px-4 py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100 `}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;

