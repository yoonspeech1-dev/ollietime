import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import './ProfilePage.css'

// 크롭된 이미지 생성 함수
const createCroppedImage = async (imageSrc, pixelCrop) => {
  const image = new Image()
  image.src = imageSrc
  await new Promise((resolve) => {
    image.onload = resolve
  })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.9)
  })
}

function ProfilePage() {
  const { user, employee } = useAuth()
  const [name, setName] = useState(employee?.name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // 이미지 크롭 관련 상태
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [showCropper, setShowCropper] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profileImage, setProfileImage] = useState(employee?.profile_image_url || null)

  const fileInputRef = useRef(null)

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '이미지 파일만 업로드 가능합니다.' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result)
      setShowCropper(true)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setImageSrc(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      // 크롭된 이미지 생성
      const croppedBlob = await createCroppedImage(imageSrc, croppedAreaPixels)

      // 파일명 생성 (user_id/profile_timestamp.jpg)
      const fileName = `${user.id}/profile_${Date.now()}.jpg`

      // 기존 이미지 삭제 (있다면)
      if (profileImage) {
        const oldPath = profileImage.split('/profile-images/')[1]
        if (oldPath) {
          await supabase.storage.from('profile-images').remove([oldPath])
        }
      }

      // 새 이미지 업로드
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      // employees 테이블 업데이트
      const { error: updateError } = await supabase
        .from('employees')
        .update({ profile_image_url: publicUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      setProfileImage(publicUrl)
      setShowCropper(false)
      setImageSrc(null)
      setMessage({ type: 'success', text: '프로필 사진이 업데이트되었습니다.' })

      // 페이지 새로고침으로 AuthContext 업데이트
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: '이미지 업로드에 실패했습니다.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleNameSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: '이름을 입력해주세요.' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('employees')
        .update({ name: name.trim() })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: '이름이 변경되었습니다.' })

      // 페이지 새로고침으로 AuthContext 업데이트
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Name update error:', error)
      setMessage({ type: 'error', text: '이름 변경에 실패했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  const displayName = employee?.name || user?.email?.split('@')[0] || '사용자'

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">프로필 설정</h1>
        <p className="page-description">회원 정보를 관리하세요</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-card">
        <h2 className="card-title">프로필 사진</h2>
        <div className="profile-image-section">
          <div className="current-avatar">
            {profileImage ? (
              <img src={profileImage} alt="프로필" className="avatar-image" />
            ) : (
              <span className="avatar-letter">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="image-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
              id="profile-image-input"
            />
            <label htmlFor="profile-image-input" className="upload-btn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              사진 변경
            </label>
            <p className="image-hint">JPG, PNG 형식, 최대 5MB</p>
          </div>
        </div>
      </div>

      <div className="profile-card">
        <h2 className="card-title">기본 정보</h2>
        <div className="form-group">
          <label className="form-label">이메일</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="form-input disabled"
          />
          <p className="input-hint">이메일은 변경할 수 없습니다.</p>
        </div>
        <div className="form-group">
          <label className="form-label">이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="form-input"
          />
        </div>
        <button
          className="save-btn"
          onClick={handleNameSave}
          disabled={saving || name.trim() === employee?.name}
        >
          {saving ? '저장 중...' : '이름 저장'}
        </button>
      </div>

      {/* 이미지 크롭 모달 */}
      {showCropper && (
        <div className="crop-modal">
          <div className="crop-modal-content">
            <h3 className="crop-title">프로필 사진 편집</h3>
            <p className="crop-description">드래그하여 영역을 조정하세요</p>
            <div className="crop-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="zoom-control">
              <label className="zoom-label">확대/축소</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="zoom-slider"
              />
            </div>
            <div className="crop-actions">
              <button className="crop-cancel-btn" onClick={handleCropCancel} disabled={uploading}>
                취소
              </button>
              <button className="crop-save-btn" onClick={handleCropSave} disabled={uploading}>
                {uploading ? '업로드 중...' : '적용'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfilePage
