import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { mobile }) as any;
      if (res?.dev_otp) setDevOtp(res.dev_otp);
      setStep('otp');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        mobile,
        otp,
        platform: 'web',
        device_name: 'Maharaj Web',
      }) as any;
      setAuth({
        user: { id: res.user.id, mobile: res.user.mobile, name: res.user.name, maharaj_ids: res.maharaj_ids ?? [] },
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        maharaj_ids: res.maharaj_ids ?? [],
      });
      navigate('/');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent-500 flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
            🕉️
          </div>
          <h1 className="text-2xl font-bold text-white">JainERP</h1>
          <p className="text-white/60 text-sm mt-1">Maharaj / Mataji Representative Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {step === 'mobile' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="label">Mobile Number</label>
                <div className="flex gap-0">
                  <span className="flex items-center px-3 bg-gray-50 border border-gray-300 border-r-0 rounded-l-md text-sm text-gray-500">
                    +91
                  </span>
                  <input
                    className="input rounded-l-none flex-1"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter the mobile number registered as a Maharaj/Mataji representative
                </p>
              </div>
              {error && <p className="text-sm text-danger-500">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div>
                <label className="label">Enter OTP</label>
                <input
                  className="input text-center text-xl tracking-widest"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="——————"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">OTP sent to +91 {mobile}</p>
                {devOtp && (
                  <p className="text-xs text-accent-600 mt-1 font-mono">Dev OTP: {devOtp}</p>
                )}
              </div>
              {error && <p className="text-sm text-danger-500">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}
                className="btn-outline w-full"
              >
                Change number
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
