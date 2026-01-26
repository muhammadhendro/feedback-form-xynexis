'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('admin_token', data.token);
        // Redirect to dashboard
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1e28] via-[#20242F] to-[#1a1e28] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#2b303b] rounded-2xl shadow-2xl p-8 border border-gray-700/50">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-24 w-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Admin Login
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Enter password to access dashboard
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-400">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-lg bg-[#1a1e28] border border-gray-700 text-white placeholder-gray-500 
                     focus:outline-none focus:border-[#67C23A] focus:ring-2 focus:ring-[#67C23A]/20 
                     transition-all duration-300"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#67C23A] hover:bg-[#5aaa32] text-white font-semibold rounded-lg 
                   transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-lg hover:shadow-[#67C23A]/20"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
