import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { ADMIN_EMAIL } from '@/data/defaultContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLogin() {
  const { isAuthenticated, loginAdmin } = useAuth();
  const [form, setForm] = useState({ email: ADMIN_EMAIL, password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/AdminDashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await loginAdmin(form);
      window.location.href = '/AdminDashboard';
    } catch (loginError) {
      setError(loginError?.message || 'ההתחברות נכשלה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-[#FFF8E7] via-white to-[#F3E8FF] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B68AD8]/10 text-[#B68AD8] flex items-center justify-center mb-4">
            <LockKeyhole className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">כניסה לניהול האתר</h1>
          <p className="text-gray-500 mt-2">הכניסה מוגנת במייל מורשה ובסיסמה</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label>מייל מורשה</Label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm(current => ({ ...current, email: e.target.value }))}
                className="rounded-xl pr-10"
              />
            </div>
          </div>

          <div>
            <Label>סיסמה</Label>
            <Input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm(current => ({ ...current, password: e.target.value }))}
              className="rounded-xl mt-1"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#B68AD8] hover:bg-[#9b6fc0] rounded-2xl h-12"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'כניסה'}
          </Button>
        </form>
      </div>
    </div>
  );
}
