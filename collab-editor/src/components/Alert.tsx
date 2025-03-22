import { ReactNode } from "react";

interface AlertProps {
  type: "error" | "success";
  children: ReactNode;
}

export default function Alert({ type, children }: AlertProps) {
  const styles = {
    error: "bg-red-100 border-red-400 text-red-700",
    success: "bg-green-100 border-green-400 text-green-700",
  };

  return (
    <div className={`mb-4 p-3 border rounded ${styles[type]}`}>
      {children}
    </div>
  );
}