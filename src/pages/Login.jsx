import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { gsap } from 'gsap';
import { EMPLOYEES } from '../data/employees';
import '../styles/global.css';
import '../styles/login-premium.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [inputId, setInputId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const user = EMPLOYEES.find(
        (emp) => emp.empId === inputId && emp.password === password
      );

      if (user) {
        setIsLoading(false);
        onLogin(user);
        navigate('/dashboard');
      } else {
        setIsLoading(false);
        setError('Invalid credentials');
      }
    }, 1200);
  };


  // Constellation Animation Background
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let particles = [];
    const particleCount = 80; // Slightly reduced for login page

    class Particle {
      constructor(x, y) {
        this.x = x || Math.random() * width;
        this.y = y || Math.random() * height;
        this.z = Math.random() * 1.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.baseSize = Math.random() * 1.8 + 0.8;
        this.size = this.baseSize;
        const colors = ['#60a5fa', '#a78bfa', '#ec4899', '#3b82f6'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx * this.z;
        this.y += this.vy * this.z;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactRadius = 200;

        if (dist < interactRadius) {
          const force = (interactRadius - dist) / interactRadius;
          this.x += dx * force * 0.015;
          this.y += dy * force * 0.015;
          this.size = this.baseSize + (force * 2.5);
        } else {
          if (this.size > this.baseSize) this.size -= 0.08;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7 * this.z;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    let animationId;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 0.4;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.2 * (1 - dist / 100)})`;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        const mDx = p1.x - mouseRef.current.x;
        const mDy = p1.y - mouseRef.current.y;
        const mDist = Math.sqrt(mDx * mDx + mDy * mDy);

        if (mDist < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.45 * (1 - mDist / 150)})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
          ctx.lineWidth = 0.4;
        }

        p1.draw();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div ref={containerRef} className="premium-login-container">


      {/* Constellation Canvas Animation */}
      <canvas ref={canvasRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}></canvas>




      {/* Main Login Card */}
      <div className="glass-card">
        <div className="card-glow"></div>

        <div className="login-content">
          <div className="logo-section">
            <div className="logo-container">
              <img src="/logo.png" alt="Bug Tracker" className="app-logo" />
              <div className="logo-glow-effect"></div>
            </div>
            <h1 className="welcome-title">Welcome Back</h1>
            <p className="welcome-subtitle">Sign in to continue to your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form-premium">
            <div className="input-group">
              <label className="input-label">User ID</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Enter your ID"
                  value={inputId}
                  onChange={(e) => setInputId(e.target.value)}
                  required
                  className="premium-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="premium-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;