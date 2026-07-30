import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiError } from '../../lib/api';
import { isValidPhone, PhoneInput } from '../../components/PhoneInput';
import { useAuthStore } from '../../store/authStore';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
  const { t } = useTranslation();
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
    if (!isValidPhone(mobile)) { setError(t('login.invalidMobile')); return; }
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
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
          <div className="absolute right-4 top-4"><LanguageSwitcher /></div>
          {/* Header — identical treatment to the Mandir Admin login. */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-red flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-navy-900">Jain</span><span className="text-brand-red">ERP</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Sadhu-Sadhvi Portal</p>
          </div>
          {step === 'mobile' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="label">{t('login.mobileLabel')}</label>
                <div>
                  <PhoneInput
                    value={mobile}
                    onChange={setMobile}
                    required
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('login.repHint')}
                </p>
              </div>
              {error && <p className="text-sm text-danger-500">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? t('login.sendingOtp') : t('login.sendOtp')}
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
                <p className="text-xs text-gray-500 mt-1">OTP sent to {mobile}</p>
                {devOtp && (
                  <p className="text-xs text-cta mt-1 font-mono">Dev OTP: {devOtp}</p>
                )}
              </div>
              {error && <p className="text-sm text-danger-500">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? t('login.verifying') : t('login.verify')}
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
