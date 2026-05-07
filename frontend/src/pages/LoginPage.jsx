import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
    if (!form.senha) e.senha = 'Senha é obrigatória';
    else if (form.senha.length < 6) e.senha = 'Mínimo 6 caracteres';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const result = await login(form.email, form.senha);
    if (!result.ok) {
      addToast(result.error, 'error');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-overlay" />
      <div className="login-card animate-fade">
        <div className="login-header">
          <div className="login-logo">⬡</div>
          <h1>Grand Hotel</h1>
          <p className="login-subtitle">Sistema de Gestão</p>
        </div>
        <div className="gold-line" />
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="field-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="admin@hotel.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className={errors.email ? 'error' : ''}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.senha}
              onChange={e => setForm(p => ({ ...p, senha: e.target.value }))}
              className={errors.senha ? 'error' : ''}
              autoComplete="current-password"
            />
            {errors.senha && <span className="field-error">{errors.senha}</span>}
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Entrar'}
          </button>
        </form>
        <p className="login-hint">admin@hotel.com / admin123</p>
      </div>
    </div>
  );
}
