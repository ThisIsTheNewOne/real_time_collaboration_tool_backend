import React from "react";

interface PageCounterProps {
  pageCount: number;
}

export const PageCounter: React.FC<PageCounterProps> = ({ pageCount }) => {
  return (
    <div className="text-sm text-gray-500 my-4 text-center">
      {pageCount} {pageCount === 1 ? 'page' : 'pages'}
    </div>
  );
};