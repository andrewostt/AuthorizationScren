import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const CODE_LENGTH = 6
const SUCCESS_CODE = '131311'
const RESEND_TIMEOUT_MS = 10000

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function App() {
  const [step, setStep] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState(Array(CODE_LENGTH).fill(''))
  const [codeError, setCodeError] = useState(false)
  const [resendAvailable, setResendAvailable] = useState(false)
  const [resendTick, setResendTick] = useState(0)

  const otpRefs = useRef([])

  const isEmailValid = emailPattern.test(email)
  const canSubmitSignIn = isEmailValid && password.length > 0
  const isOtpComplete = useMemo(
    () => otp.every((value) => value !== ''),
    [otp],
  )
  const canSubmitOtp = !resendAvailable && isOtpComplete && !codeError

  useEffect(() => {
    if (step !== 'twofactor' || resendAvailable) {
      return undefined
    }

    const timer = setTimeout(() => {
      setResendAvailable(true)
    }, RESEND_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [step, resendAvailable, resendTick])

  const handleSignInSubmit = (event) => {
    event.preventDefault()
    if (!canSubmitSignIn) {
      return
    }

    setStep('twofactor')
    setOtp(Array(CODE_LENGTH).fill(''))
    setCodeError(false)
    setResendAvailable(false)
    setResendTick((value) => value + 1)

    window.setTimeout(() => {
      otpRefs.current[0]?.focus()
    }, 120)
  }

  const handleBackToSignIn = () => {
    setStep('signin')
    setPassword('')
    setOtp(Array(CODE_LENGTH).fill(''))
    setCodeError(false)
    setResendAvailable(false)
  }

  const handleOtpChange = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, '').slice(-1)
    if (value === '' && otp[index] === '') {
      return
    }

    setOtp((prev) => {
      const draft = [...prev]
      draft[index] = value
      return draft
    })

    setCodeError(false)

    if (value && index < CODE_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      event.preventDefault()
      otpRefs.current[index - 1]?.focus()
      setOtp((prev) => {
        const draft = [...prev]
        draft[index - 1] = ''
        return draft
      })
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      otpRefs.current[index - 1]?.focus()
      return
    }

    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault()
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (event) => {
    const clipboard = event.clipboardData.getData('text').replace(/\D/g, '')
    if (!clipboard) {
      return
    }

    event.preventDefault()
    const digits = clipboard.slice(0, CODE_LENGTH).split('')
    const nextOtp = Array(CODE_LENGTH)
      .fill('')
      .map((_, idx) => digits[idx] ?? '')

    setOtp(nextOtp)
    setCodeError(false)

    const lastFilled = digits.length - 1
    const focusIndex =
      lastFilled >= 0 && lastFilled < CODE_LENGTH ? lastFilled : CODE_LENGTH - 1
    window.setTimeout(() => {
      otpRefs.current[focusIndex]?.focus()
    }, 0)
  }

  const handleOtpSubmit = (event) => {
    event.preventDefault()
    if (!canSubmitOtp) {
      return
    }

    const code = otp.join('')
    if (code === SUCCESS_CODE) {
      alert('Two-factor authentication successful!')
      setStep('signin')
      setPassword('')
      setOtp(Array(CODE_LENGTH).fill(''))
      setCodeError(false)
      setResendAvailable(false)
      return
    }

    setCodeError(true)
  }

  const handleResend = () => {
    setOtp(Array(CODE_LENGTH).fill(''))
    setCodeError(false)
    setResendAvailable(false)
    setResendTick((value) => value + 1)
    window.setTimeout(() => {
      otpRefs.current[0]?.focus()
    }, 100)
  }

  return (
    <div className="app-shell">
      <article className="auth-card" aria-live="polite">
        {step === 'signin' ? (
          <>
            <div className="brand">
              <span className="brand-icon" aria-hidden="true" />
              <span>Company</span>
            </div>

            <h1 className="card-title">
              Sign in to your account to continue
            </h1>

            <form className="form" onSubmit={handleSignInSubmit}>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6H20C20.55 6 21 6.45 21 7V17C21 17.55 20.55 18 20 18H4C3.45 18 3 17.55 3 17V7C3 6.45 3.45 6 4 6Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.5 6.75L12 12.75L3.5 6.75"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  id="email"
                  className="input"
                  type="email"
                  placeholder="Email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-label="Email"
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M7.75 10.5V7.75C7.75 5.13 9.88 3 12.5 3C15.12 3 17.25 5.13 17.25 7.75V10.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <rect
                      x="5"
                      y="10.5"
                      width="15"
                      height="10.5"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M12.5 15.5V17.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <input
                  id="password"
                  className="input"
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-label="Password"
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={!canSubmitSignIn}
              >
                Log in
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="header">
              <button
                type="button"
                className="back-button"
                onClick={handleBackToSignIn}
                aria-label="Back to sign in"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M14 18L8 12L14 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="brand">
                <span className="brand-icon" aria-hidden="true" />
                <span>Company</span>
              </div>

              <span className="header-spacer" aria-hidden="true" />
            </div>

            <div className="step-heading">
              <h2>Two-Factor Authentication</h2>
              <p>Enter the 6-digit code from the Google Authenticator app</p>
            </div>

            <form className="form" onSubmit={handleOtpSubmit}>
              <div className="otp-grid">
                {otp.map((value, index) => (
                  <input
                    key={index}
                    className={`otp-input${codeError ? ' error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    pattern="\d{1}"
                    maxLength={1}
                    value={value}
                    onChange={(event) =>
                      handleOtpChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    ref={(element) => {
                      otpRefs.current[index] = element
                    }}
                    aria-label={`Digit ${index + 1}`}
                    aria-invalid={codeError}
                  />
                ))}
              </div>

              {codeError && <p className="error-message">Invalid code</p>}

              <div className="two-factor-actions">
                {resendAvailable ? (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleResend}
                  >
                    Get new
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={!canSubmitOtp}
                  >
                    Continue
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </article>
    </div>
  )
}

export default App
