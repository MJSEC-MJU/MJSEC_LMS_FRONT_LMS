import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/auth'
import { api } from "../components/client"

export default function Update() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    phonePart1: '',
    phonePart2: '',
    phonePart3: '',
    email: '',
    profileImage: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // 프로필 정보 로드
  useEffect(() => {
    async function fetchProfile() {
      try {
        if (!token) return
        
        const response = await api('GET', '/user/user-page', null, token)
        if (response?.data) {
          setProfile(response.data)
          
          // 전화번호 분리 (010-1234-5678 -> 010, 1234, 5678)
          const phoneNumber = response.data.phoneNumber || ''
          const phoneParts = phoneNumber.split('-')
          
          setFormData({
            phoneNumber: phoneNumber,
            phonePart1: phoneParts[0] || '',
            phonePart2: phoneParts[1] || '',
            phonePart3: phoneParts[2] || '',
            email: response.data.email || '',
            profileImage: null
          })
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error)
        setError('프로필 정보를 불러오는데 실패했습니다.')
      }
    }
    
    fetchProfile()
  }, [token])

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      // 전화번호 합치기
      const fullPhoneNumber = `${formData.phonePart1}-${formData.phonePart2}-${formData.phonePart3}`
      
      const formDataToSend = new FormData()
      
      // UserUpdateDto를 JSON Blob으로 생성
      const userUpdateDto = {
        phoneNumber: fullPhoneNumber,
        email: formData.email
      }
      const userUpdateDtoBlob = new Blob([JSON.stringify(userUpdateDto)], { type: 'application/json' })
      formDataToSend.append('userUpdateDto', userUpdateDtoBlob)
      
      if (formData.profileImage) {
        formDataToSend.append('profileImage', formData.profileImage)
      }

      const result = await api('PUT', '/user/user-page', formDataToSend, token)

      if (result.code === 'SUCCESS') {
        setMessage('프로필이 성공적으로 업데이트되었습니다.')
        
        // 0.5초 후 프로필 페이지로 이동
        setTimeout(() => {
          navigate('/profile')
        }, 500)
      } else {
        setError(result.message || '프로필 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      setError('프로필 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 입력값 변경 처리
  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'profileImage') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }))
    } else if (name.startsWith('phonePart')) {
      // 전화번호 부분 입력 처리 (숫자만 허용)
      const numericValue = value.replace(/[^0-9]/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  if (!profile) {
    return (
      <section className="form-container">
        <div className="loading">프로필 정보를 불러오는 중...</div>
      </section>
    )
  }

  return (
    <section className="form-container">
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <h3>update profile</h3>
        
        {/* 이름 (읽기 전용) */}
        <p>name</p>
        <input 
          type="text" 
          value={profile.name || ''} 
          className="box" 
          disabled 
          style={{ backgroundColor: '#f5f5f5', color: '#666' }}
        />
        
        {/* 학번  */}
        <p>student number</p>
        <input 
          type="text" 
          value={profile.studentNumber || ''} 
          className="box" 
          disabled 
          style={{ backgroundColor: '#f5f5f5', color: '#666' }}
        />
        
        {/* 이메일 (수정 가능) */}
        <p>update email</p>
        <input 
          type="email" 
          name="email" 
          value={formData.email} 
          onChange={handleChange}
          placeholder="이메일" 
          maxLength={50} 
          className="box" 
          required
        />
        
        {/* 전화번호 (수정 가능) */}
        <p>update phone number</p>
        <div className="phone-input-container">
          <input 
            type="tel" 
            name="phonePart1" 
            value={formData.phonePart1} 
            onChange={handleChange}
            placeholder="010" 
            maxLength={3} 
            className="phone-box" 
            required
          />
          <div className="phone-part">-</div>
          <input 
            type="tel" 
            name="phonePart2" 
            value={formData.phonePart2} 
            onChange={handleChange}
            placeholder="1234" 
            maxLength={4} 
            className="phone-box" 
            required
          />
          <div className="phone-part">-</div>
          <input 
            type="tel" 
            name="phonePart3" 
            value={formData.phonePart3} 
            onChange={handleChange}
            placeholder="5678" 
            maxLength={4} 
            className="phone-box" 
            required
          />
        </div>
        
        {/* 프로필 이미지 */}
        <p>update profile image</p>
        <div className="profile-image-section">
          {profile.profileImage && (
            <div className="current-image">
              <p>현재 이미지: {profile.profileImage}</p>
            </div>
          )}
          <input 
            type="file" 
            name="profileImage" 
            accept="image/*" 
            onChange={handleChange}
            className="box" 
          />
        </div>
        
        {/* 메시지 표시 */}
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <input 
          type="submit" 
          value={isSubmitting ? "업데이트 중..." : "update profile"} 
          className="btn" 
          disabled={isSubmitting}
        />
      </form>
    </section>
  )
}
