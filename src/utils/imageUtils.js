/**
 * 이미지 처리 유틸리티 함수들
 */

/**
 * 이미지를 정사각형으로 자르는 함수
 * @param {string} imageSrc - 원본 이미지 URL
 * @param {function} callback - 자른 이미지의 data URL을 받을 콜백 함수
 */
export const cropImageToSquare = (imageSrc, callback) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 정사각형 크기 계산 (작은 쪽을 기준으로)
    const size = Math.min(img.width, img.height);
    canvas.width = size;
    canvas.height = size;
    
    // 중앙에서 정사각형으로 자르기
    const x = (img.width - size) / 2;
    const y = (img.height - size) / 2;
    
    ctx.drawImage(img, x, y, size, size, 0, 0, size, size);
    
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    callback(croppedDataUrl);
  };
  
  img.onerror = () => {
    // 이미지 로드 실패 시 원본 URL 반환
    callback(imageSrc);
  };
  
  img.src = imageSrc;
};

/**
 * 프로필 이미지 URL을 생성하는 함수
 * @param {string} profileImage - 프로필 이미지 경로
 * @param {string} fallbackImage - 폴백 이미지 경로
 * @returns {string} - 최종 이미지 URL
 */
export const getProfileImageSrc = (profileImage, fallbackImage = null) => {
  const base = (import.meta.env.BASE_URL || "/");
  const logoFallback = fallbackImage || `${base}images/logo.png`;

  if (!profileImage) {
    return logoFallback;
  }

  // 이미 완전한 URL인 경우 (http, https, data:)
  if (/^(https?:)?\/\//.test(profileImage) || profileImage.startsWith("data:")) {
    return profileImage;
  }

  // /uploads/ 경로인 경우 API 엔드포인트로 변환
  if (profileImage.startsWith("/uploads/")) {
    return `${window.location.origin}${base}api/v1/image${profileImage.replace("/uploads", "")}`;
  }

  // 상대 경로인 경우 base URL과 결합
  return `${base}${profileImage.replace(/^\//, "")}`;
};

/**
 * 프로필 이미지를 정사각형으로 자른 후 URL을 반환하는 함수
 * @param {string} profileImage - 프로필 이미지 경로
 * @param {function} callback - 자른 이미지의 data URL을 받을 콜백 함수
 * @param {string} fallbackImage - 폴백 이미지 경로
 */
export const getProfileImageSrcCropped = (profileImage, callback, fallbackImage = null) => {
  const imageSrc = getProfileImageSrc(profileImage, fallbackImage);
  cropImageToSquare(imageSrc, callback);
};

/**
 * 멘토 프로필 이미지 URL 생성 및 자르기 함수 (CurriculumSection 전용)
 * @param {object} mentorInfo - 멘토 정보 객체
 * @param {function} callback - 자른 이미지의 data URL을 받을 콜백 함수
 */
export const getMentorProfileImageSrcCropped = (mentorInfo, callback) => {
  const base = (import.meta.env.BASE_URL || "/");
  const logoFallback = `${base}images/logo.png`;

  if (!mentorInfo?.profileImage) {
    callback(logoFallback);
    return;
  }

  const imageSrc = getProfileImageSrc(mentorInfo.profileImage, logoFallback);
  cropImageToSquare(imageSrc, callback);
};

/**
 * 멘티 프로필 이미지 URL 생성 함수 (MenteeManagement 전용)
 * @param {string} profileImage - 멘티 프로필 이미지 경로
 * @returns {string} - 최종 이미지 URL
 */
export const getMenteeProfileImageSrc = (profileImage) => {
  return getProfileImageSrc(profileImage);
};

/**
 * 멘티 프로필 이미지를 정사각형으로 자른 후 URL을 반환하는 함수
 * @param {string} profileImage - 멘티 프로필 이미지 경로
 * @param {function} callback - 자른 이미지의 data URL을 받을 콜백 함수
 * @param {string} fallbackImage - 폴백 이미지 경로
 */
export const getMenteeProfileImageSrcCropped = (profileImage, callback, fallbackImage = null) => {
  const imageSrc = getProfileImageSrc(profileImage, fallbackImage);
  cropImageToSquare(imageSrc, callback);
};
