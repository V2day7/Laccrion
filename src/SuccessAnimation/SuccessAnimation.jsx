import React from "react";
import "./SuccessAnimation.css";

export default function SuccessAnimation({ message, onComplete }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="success-overlay">
      <div className="success-container">
        <div className="success-checkmark">
          <svg
            className="checkmark"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              className="checkmark-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className="checkmark-check"
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>
        <h2 className="success-title">Purchase Successful!</h2>
        <p className="success-message">{message}</p>
      </div>
    </div>
  );
}
