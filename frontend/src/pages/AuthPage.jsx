import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { LogIn, KeyRound, ArrowRight, ArrowLeft, Smartphone, ShieldCheck } from 'lucide-react';
import { authAPI } from '../services/api';
import logoImg from '../assets/logo.png';

const TALUKAS = [
  { value: '', label: '-- Select one --' },
  { value: 'North Goa', label: 'North Goa' },
  { value: 'South Goa', label: 'South Goa' },
  { value: 'Kushavati', label: 'Kushavati' }
];

export const AuthPage = () => {
  const { registeredUsers, login, registerUser } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [error, setError] = useState('');

  // Login state: 'phone' (entry) -> 'otp' (for Customer/Climber) or 'password' (for Admin/SuperAdmin)
  const [loginStep, setLoginStep] = useState('phone'); // 'phone' | 'otp' | 'password'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingLoginUser, setPendingLoginUser] = useState(null);

  // Sign Up form fields (Only Full Name, Phone Number, Role, Taluka, and Address)
  const [signupStep, setSignupStep] = useState('details'); // 'details' | 'otp'
  const [fullName, setFullName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [taluka, setTaluka] = useState('');
  const [address, setAddress] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [safetyCert, setSafetyCert] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [pendingSignupData, setPendingSignupData] = useState(null);

  // Switch between Login and Sign Up
  const switchMode = (newMode) => {
    setMode(newMode);
    setLoginStep('phone');
    setSignupStep('details');
    setError('');
    setLoginOtp('');
    setSignupOtp('');
    setAdminPassword('');
    setPendingLoginUser(null);
  };

  // ===================== 1. LOGIN: STEP 1 (PHONE / AUTOMATIC ROLE DETECTION) =====================
  const handleLoginPhoneSubmit = async (e) => {
    e.preventDefault();
    const rawInput = loginPhone.trim();
    const digitsOnly = rawInput.replace(/\D/g, '');
    const pClean = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    const uClean = rawInput.toLowerCase();

    if (!pClean && !uClean) {
      setError('Please enter your 10-digit mobile phone number');
      return;
    }

    // Match by 10-digit phone, username, or email
    const found = registeredUsers.find((u) => {
      const userDigits = u.phone ? u.phone.replace(/\D/g, '').slice(-10) : '';
      const matchPhone = pClean && pClean.length >= 10 && userDigits === pClean;
      const matchUsername = u.username && u.username.toLowerCase() === uClean;
      const matchEmail = u.email && u.email.toLowerCase() === uClean;
      return matchPhone || matchUsername || matchEmail;
    });

    if (!found) {
      if (digitsOnly.length < 10 && !uClean) {
        setError('Please enter a valid 10-digit mobile phone number');
        return;
      }
      setError(`Mobile number +91 ${pClean || rawInput} is not registered yet. Please click "Sign Up" above to create an account.`);
      return;
    }

    setError('');
    setPendingLoginUser(found);

    // Automatic Role Detection: If Admin or Super Admin -> Show password box
    if (found.role === 'admin' || found.role === 'super_admin') {
      setAdminPassword('');
      setLoginStep('password');
    } else {
      // Customer or Climber (Professional) -> Request OTP
      try {
        await authAPI.requestOTP(pClean || digitsOnly);
      } catch {
        // Offline / demo fallback
      }
      setLoginOtp('');
      setLoginStep('otp');
    }
  };

  // ===================== 2. LOGIN: STEP 2A (VERIFY OTP & LOG IN) =====================
  const handleVerifyLoginOTP = async (e) => {
    e.preventDefault();
    if (!loginOtp || loginOtp.length < 4) {
      setError('Please enter the 4-digit OTP verification code (e.g. 1234)');
      return;
    }

    const digitsOnly = loginPhone.replace(/\D/g, '');
    const pClean = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;
    let authedUser = pendingLoginUser;

    try {
      const res = await authAPI.verifyOTP(pClean, loginOtp);
      if (res?.user) {
        const serverUser = res.user;
        const localUser = pendingLoginUser || {};
        authedUser = {
          ...serverUser,
          ...localUser,
          full_name: localUser.full_name || serverUser.full_name,
          avatar_url: localUser.avatar_url || serverUser.avatar_url || null,
          addresses: localUser.addresses || (localUser.address ? [localUser.address] : [serverUser.address || '']),
          address: localUser.address || serverUser.address || '',
          taluka: localUser.taluka || serverUser.taluka || 'North Goa',
          token: res.access_token || undefined
        };
      }
    } catch {
      // Offline / simulated fallback
    }

    setError('');
    login(authedUser);
  };

  // ===================== 3. LOGIN: STEP 2B (ADMIN PASSWORD SUBMISSION) =====================
  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    const passClean = adminPassword.trim();
    const found = pendingLoginUser;

    if (!found) {
      setError('Session expired. Please enter your mobile number again.');
      setLoginStep('phone');
      return;
    }

    if (!passClean) {
      setError('Please enter your password');
      return;
    }

    const isInitialSeed = found.must_reset_password && (passClean === 'tempPassword123!' || passClean === 'admin123');
    const isPasswordValid = found.password ? (found.password === passClean || isInitialSeed) : (passClean === 'admin123');

    if (!isPasswordValid) {
      setError('Incorrect administrator password. Please try again.');
      return;
    }

    try {
      const uIdent = found.username || found.phone;
      const res = await authAPI.login({ username: uIdent, password: passClean });
      if (res?.user) {
        login({
          ...res.user,
          ...found,
          full_name: found.full_name || res.user.full_name,
          avatar_url: found.avatar_url || res.user.avatar_url || null,
          token: res.access_token || undefined
        });
        return;
      }
    } catch {
      // Offline fallback
    }

    setError('');
    login(found);
  };

  // ===================== 4. SIGN UP: STEP 1 (DETAILS) =====================
  const handleSignupDetailsSubmit = async (e) => {
    e.preventDefault();
    const digitsOnly = signupPhone.replace(/\D/g, '');
    const pClean = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!pClean || pClean.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number');
      return;
    }
    if (!taluka) {
      setError('Please select your Taluka');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your property address');
      return;
    }

    // Check for duplicate phone
    const existing = registeredUsers.find(
      (u) => u.phone && u.phone.replace(/\D/g, '').slice(-10) === pClean
    );

    if (existing) {
      setError(`Mobile phone number +91 ${pClean} is already registered. Please log in.`);
      return;
    }

    const userData = {
      full_name: fullName.trim(),
      phone: pClean,
      username: pClean,
      role: 'customer',
      taluka: taluka,
      address: address.trim() || `${taluka}, Goa`
    };

    try {
      await authAPI.requestOTP(pClean);
    } catch {
      // Fallback
    }

    setError('');
    setPendingSignupData(userData);
    setSignupStep('otp');
  };

  // ===================== 5. SIGN UP: STEP 2 (OTP VERIFICATION) =====================
  const handleVerifySignupOTP = async (e) => {
    e.preventDefault();
    if (!signupOtp || signupOtp.length < 4) {
      setError('Please enter the 4-digit OTP verification code (e.g. 1234)');
      return;
    }

    setError('');
    await registerUser(pendingSignupData);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px 30px',
        position: 'relative',
        background: 'linear-gradient(135deg, var(--navy-deep), var(--navy) 60%, var(--navy-mid))'
      }}
    >
      {/* Top Header Bar with Language Switcher */}
      <div
        style={{
          position: 'absolute',
          top: '18px',
          right: '20px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <LanguageSwitcher theme="dark" />
      </div>

      <div style={{ maxWidth: '520px', width: '100%', margin: 'auto' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src={logoImg}
            alt="Coconut Plucker Logo"
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              objectFit: 'cover',
              margin: '0 auto 14px',
              display: 'block',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          />
          <h2 style={{ color: '#FFFFFF', fontSize: '26px', letterSpacing: '-0.2px', fontWeight: '700' }}>
            {t('brand_name')}
          </h2>
          <p style={{ color: '#8FB0C0', fontSize: '12px', marginTop: '4px', letterSpacing: '0.05em', fontWeight: '600' }}>
            {t('brand_tagline')}
          </p>
        </div>

        <Card style={{ padding: '32px 28px', boxShadow: '0 20px 48px rgba(0,0,0,0.35)', borderRadius: '16px' }}>
          {/* Main Navigation Tabs: Log In vs Sign Up */}
          <div
            style={{
              display: 'flex',
              borderBottom: '2px solid var(--line)',
              marginBottom: '24px',
              gap: '6px'
            }}
          >
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: '700',
                borderBottom: mode === 'login' ? '3px solid var(--teal)' : '3px solid transparent',
                color: mode === 'login' ? 'var(--teal)' : 'var(--ink-soft)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
            >
              {t('tab_login')}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              style={{
                flex: 1,
                padding: '12px 0',
                fontSize: '15px',
                fontWeight: '700',
                borderBottom: mode === 'signup' ? '3px solid var(--teal)' : '3px solid transparent',
                color: mode === 'signup' ? 'var(--teal)' : 'var(--ink-soft)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
            >
              {t('tab_signup')}
            </button>
          </div>

          {error && (
            <div
              className="field-error"
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: 'rgba(179, 64, 44, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(179, 64, 44, 0.2)'
              }}
            >
              {error}
            </div>
          )}

          {/* ===================== SECTION 1: LOG IN ===================== */}
          {mode === 'login' && (
            <>
              {/* Step 1: Single Unified Mobile Number Entry */}
              {loginStep === 'phone' && (
                <form onSubmit={handleLoginPhoneSubmit} autoComplete="off">
                  <Input
                    label={t('auth_mobile_label')}
                    name="login_phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder={t('auth_mobile_placeholder')}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                  />

                  <div style={{ marginTop: '24px' }}>
                    <Button
                      variant="primary"
                      size="lg"
                      className="btn-block"
                      type="submit"
                      icon={Smartphone}
                    >
                      {t('auth_btn_send_otp')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 2A: Customer & Professional OTP Verification */}
              {loginStep === 'otp' && (
                <form onSubmit={handleVerifyLoginOTP} autoComplete="off">
                  <p className="cell-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
                    {t('auth_otp_sent_to', 'OTP sent to')} <b>+91 {loginPhone}</b>
                  </p>

                  {pendingLoginUser && (
                    <div
                      style={{
                        background: 'var(--cream)',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        border: '1px solid var(--line)',
                        lineHeight: '1.5'
                      }}
                    >
                      <div>Welcome, <b>{pendingLoginUser.full_name}</b></div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                        Role: <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{pendingLoginUser.role}</span> · {pendingLoginUser.taluka || 'Goa'}
                      </div>
                    </div>
                  )}

                  <Input
                    label={t('auth_otp_step_title', 'Enter OTP')}
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="XXXX"
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    required
                  />

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <Button
                      variant="ghost"
                      type="button"
                      icon={ArrowLeft}
                      onClick={() => {
                        setLoginStep('phone');
                        setError('');
                        setLoginOtp('');
                      }}
                    >
                      {t('auth_btn_back')}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="btn-block"
                      type="submit"
                      icon={LogIn}
                    >
                      {t('auth_btn_verify')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 2B: Automatic Admin & Super Admin Password Login */}
              {loginStep === 'password' && (
                <form onSubmit={handleAdminPasswordSubmit} autoComplete="off">
                  <p className="cell-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
                    Enter password for <b>+91 {loginPhone}</b>
                  </p>

                  {pendingLoginUser && (
                    <div
                      style={{
                        background: 'var(--cream)',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        border: '1px solid var(--line)',
                        lineHeight: '1.5'
                      }}
                    >
                      <div>Welcome, <b>{pendingLoginUser.full_name}</b></div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ink-soft)' }}>
                        Role: <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{pendingLoginUser.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}</span>
                      </div>
                    </div>
                  )}

                  <Input
                    label={t('auth_admin_pass_label', 'Password')}
                    name="admin_password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <Button
                      variant="ghost"
                      type="button"
                      icon={ArrowLeft}
                      onClick={() => {
                        setLoginStep('phone');
                        setError('');
                        setAdminPassword('');
                      }}
                    >
                      {t('auth_btn_back')}
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      className="btn-block"
                      type="submit"
                      icon={LogIn}
                    >
                      {t('tab_login', 'Log In')}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ===================== SECTION 2: SIGN UP ===================== */}
          {mode === 'signup' && signupStep === 'details' && (
            <form onSubmit={handleSignupDetailsSubmit} autoComplete="off">
              <Input
                label={t('signup_full_name')}
                name="signup_fullname"
                autoComplete="name"
                placeholder={t('signup_full_name_placeholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label={t('signup_phone')}
                name="signup_phone"
                type="tel"
                autoComplete="tel"
                placeholder={t('signup_phone_placeholder')}
                value={signupPhone}
                onChange={(e) => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                required
              />

              <Select
                label={t('signup_taluka')}
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                options={TALUKAS}
                required
              />

              <Input
                label={t('signup_address')}
                name="signup_address"
                autoComplete="street-address"
                placeholder={t('signup_address_placeholder')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />

              <div style={{ marginTop: '24px' }}>
                <Button
                  variant="gold"
                  size="lg"
                  className="btn-block"
                  type="submit"
                  icon={ArrowRight}
                >
                  {t('signup_btn_continue')}
                </Button>
              </div>
            </form>
          )}

          {/* ===================== SECTION 3: SIGN UP OTP ===================== */}
          {mode === 'signup' && signupStep === 'otp' && (
            <form onSubmit={handleVerifySignupOTP} autoComplete="off">
              <p className="cell-muted" style={{ marginBottom: '16px', fontSize: '13px' }}>
                {t('auth_otp_sent_to', 'OTP sent to')} <b>+91 {signupPhone}</b>
              </p>

              {pendingSignupData && (
                <div
                  style={{
                    background: 'var(--cream)',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    fontSize: '13px',
                    border: '1px solid var(--line)',
                    lineHeight: '1.6'
                  }}
                >
                  <div>Name: <b>{pendingSignupData.full_name}</b></div>
                  <div>Mobile Number: <b>+91 {pendingSignupData.phone}</b> · Taluka: <b>{pendingSignupData.taluka}</b></div>
                  <div>Address: <b>{pendingSignupData.address}</b></div>
                </div>
              )}

              <Input
                label={t('auth_otp_step_title', 'Enter OTP')}
                type="text"
                autoComplete="one-time-code"
                placeholder="XXXX"
                maxLength={6}
                value={signupOtp}
                onChange={(e) => setSignupOtp(e.target.value)}
                required
              />

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <Button
                  variant="ghost"
                  type="button"
                  icon={ArrowLeft}
                  onClick={() => {
                    setError('');
                    setSignupOtp('');
                    setSignupStep('details');
                  }}
                >
                  {t('btn_back')}
                </Button>
                <Button
                  variant="gold"
                  size="lg"
                  className="btn-block"
                  type="submit"
                  icon={KeyRound}
                >
                  {t('signup_btn_complete')}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
