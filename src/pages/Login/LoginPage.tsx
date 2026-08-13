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
        user: { id: res.user.id, mobile: res.user.mobile, name: res.user.name, sant_ids: res.sant_ids ?? [] },
        access_token: res.access_token,
        refresh_token: res.refresh_token,
        sant_ids: res.sant_ids ?? [],
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
          {/* The switcher sits in its own row rather than floating over the
              header. It used to be absolutely positioned on top of the logo and
              hero, so opening it covered the branding — the menu was always
              clickable, it just landed on top of the artwork. Giving it a row of
              its own makes all three portal logins read the same way. */}
          <div className="flex justify-end -mt-2 mb-1 relative z-50"><LanguageSwitcher /></div>
          {/* Header — identical treatment to the Mandir Admin login. */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-red flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-navy-900">Jain</span><span className="text-brand-red">ERP</span>
            </h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">{t('brand.portal')}</p>
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
                <label className="label">{t('login.enterOtp')}</label>
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
              >{t('ui.changeNumber')}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
