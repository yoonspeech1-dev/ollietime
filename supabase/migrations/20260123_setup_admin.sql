-- 1. 기존 유저에게 user_roles 추가 (관리자로)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'yoonspeech1@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 2. 기존 '올리' employee를 해당 유저에 연결
UPDATE employees
SET user_id = (SELECT id FROM auth.users WHERE email = 'yoonspeech1@gmail.com')
WHERE name = '올리';

-- 3. 관리자용 RLS 정책 추가
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can update employees" ON employees;
CREATE POLICY "Admins can update employees" ON employees
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete employees" ON employees;
CREATE POLICY "Admins can delete employees" ON employees
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
CREATE POLICY "Admins can delete roles" ON user_roles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
