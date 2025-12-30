import { useState } from "react";
import { EMPLOYEES } from "../data/employees";

export default function Login({ onLogin }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const employee = EMPLOYEES.find(
      (emp) => emp.empId === empId && emp.password === password
    );

    if (employee) {
      onLogin(employee); // pass employee details
    } else {
      setError("Invalid Employee ID or Password");
    }
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Bug Tracker Login</h2>

        <input
          data-testid="username-input"
          type="text"
          placeholder="Employee ID (e.g. EMP001)"
          value={empId}
          onChange={(e) => setEmpId(e.target.value.toUpperCase())}
        />

        <input
          data-testid="password-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button data-testid="login-button" type="submit">
          Login
        </button>

        {error && (
          <p data-testid="login-error" className="error">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
