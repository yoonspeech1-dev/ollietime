import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../lib/auth'
import './LoginPage.css'

function SignUpPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (!displayName.trim()) {
      setError('이름을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      await signUp(email, password, displayName.trim())
      setSuccess(true)
    } catch (err) {
      if (err.message.includes('already registered')) {
        setError('이미 등록된 이메일입니다.')
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <img src="/ollie-avatar.png" alt="올리" className="login-logo" />
            <h1 className="login-title">회원가입 완료</h1>
            <p className="login-subtitle">이메일 인증을 완료해주세요</p>
          </div>
          <div className="signup-success">
            <p>
              <strong>{email}</strong>로 인증 이메일을 발송했습니다.
            </p>
            <p>이메일의 링크를 클릭하여 인증을 완료해주세요.</p>
          </div>
          <button
            className="login-button"
            onClick={() => navigate('/login')}
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src="/ollie-avatar.png" alt="올리" className="login-logo" />
          <h1 className="login-title">회원가입</h1>
          <p className="login-subtitle">올리타임 계정 만들기</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="displayName">이름</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요 (최소 6자)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="signup-link">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage
