-- 1. employees 테이블에 profile_image_url 컬럼 추가
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 2. Storage 버킷 생성 (profile-images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS 정책 설정
-- 누구나 프로필 이미지 조회 가능
DROP POLICY IF EXISTS "Public profile images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public profile images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- 인증된 사용자는 자신의 프로필 이미지 업로드 가능
DROP POLICY IF EXISTS "Users can upload their own profile image" ON storage.objects;
CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 인증된 사용자는 자신의 프로필 이미지 수정 가능
DROP POLICY IF EXISTS "Users can update their own profile image" ON storage.objects;
CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 인증된 사용자는 자신의 프로필 이미지 삭제 가능
DROP POLICY IF EXISTS "Users can delete their own profile image" ON storage.objects;
CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
