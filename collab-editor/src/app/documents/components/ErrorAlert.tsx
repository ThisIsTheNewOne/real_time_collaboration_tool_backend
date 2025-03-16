interface ErrorAlertProps {
    message: string;
    onDismiss: () => void;
  }
  
  export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
    if (!message) return null;
    
    return (
      <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between">
        <div>{message}</div>
        <button onClick={onDismiss} className="text-red-700 font-bold">×</button>
      </div>
    );
  }