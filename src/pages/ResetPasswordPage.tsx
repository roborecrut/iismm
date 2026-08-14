import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types';

interface ResetPasswordPageProps {
  onSuccessLogin: (user: UserAccount) => void;
  onNavigate: (path: string) => void;
}

export default function ResetPasswordPage({ onSuccessLogin, onNavigate }: ResetPasswordPageProps) {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || '';
    setToken(urlToken);

    if (!urlToken) {
      setError('Токен сброса пароля не указан в ссылке');
      setVerifying(false);
      return;
    }

    // Verify token
    fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(urlToken)}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setEmail(data.email || '');
        } else {
          setError(data.error || 'Ссылка сброса пароля недействительна или её срок действия истек');
        }
      })
      .catch(err => {
        console.error('Verify token error:', err);
        setError('Ошибка при проверке ссылки сброса пароля');
      })
      .finally(() => setVerifying(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Введите новый пароль');
      return;
    }
    if (newPassword.length < 4) {
      setError('Пароль должен быть не менее 4 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Не удалось сменить пароль');
      }

      setSuccess('Пароль успешно сменен! Перенаправляем в личный кабинет...');

      if (data.user) {
        const loggedUser: UserAccount = {
          id: data.user.id || 'usr-reset',
          name: [data.user.firstName, data.user.lastName].filter(Boolean).join(' ') || data.user.username || 'Пользователь',
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          telegramUsername: data.user.username ? (data.user.username.startsWith('@') ? data.user.username : `@${data.user.username}`) : '@user',
          tariff: data.user.role === 'admin' ? 'pro' : 'start',
          tokens: data.user.balance || 300,
          iirky: data.user.balance || 300,
          telegramStars: 250,
          avatarUrl: data.user.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          balanceRub: 350,
          earningsRub: 0,
          email: data.user.email
        };

        setTimeout(() => {
          onSuccessLogin(loggedUser);
          onNavigate('/profile');
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-sky-400 to-pink-500 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-md">
            🔑
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Сброс пароля ИИSMM</h1>
          <p className="text-xs text-slate-500 font-medium">
            {email ? `Установите новый пароль для ${email}` : 'Укажите новый безопасный пароль'}
          </p>
        </div>

        {verifying ? (
          <div className="text-center py-8 text-xs font-semibold text-slate-500 space-y-2">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Проверка ссылки сброса пароля...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl">
                🎉 {success}
              </div>
            )}

            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={4}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:bg-white focus:outline-none font-medium transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">
                    Подтвердите новый пароль
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={4}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:ring-2 focus:ring-sky-400 focus:bg-white focus:outline-none font-medium transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-3 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all text-center uppercase tracking-wider disabled:opacity-50 hover:brightness-105 active:scale-98"
                  style={{ background: 'linear-gradient(120deg, #38bdf8 0%, #ec4899 25%, #f97316 50%, #ec4899 75%, #38bdf8 100%)' }}
                >
                  {loading ? 'Сохранение...' : 'Сохранить новый пароль и войти ➔'}
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer transition-colors"
              >
                ← Вернуться на главную
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
