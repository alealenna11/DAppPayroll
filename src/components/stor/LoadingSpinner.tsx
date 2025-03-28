// components/LoadingSpinner.tsx
export default function LoadingSpinner() {
    return (
        <div className="spinner">
            <style jsx>{`
        .spinner {
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 2px solid #1890ff;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}