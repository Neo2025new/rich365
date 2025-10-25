-- 自动创建用户 profile（注册时）
-- 为新注册用户自动生成随机用户名和头像

-- 1. 创建函数：生成随机用户名
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS VARCHAR AS $$
DECLARE
  adjectives TEXT[] := ARRAY['快乐的', '勇敢的', '聪明的', '酷炫的', '神秘的', '幸运的', '勤奋的', '创新的'];
  nouns TEXT[] := ARRAY['搞钱人', '赚钱家', '财富侠', '金钱王', '理财师', '投资客', '创业者', '行动派'];
  random_adj TEXT;
  random_noun TEXT;
  random_num TEXT;
BEGIN
  random_adj := adjectives[1 + floor(random() * array_length(adjectives, 1))::int];
  random_noun := nouns[1 + floor(random() * array_length(nouns, 1))::int];
  random_num := floor(random() * 9999 + 1000)::text;

  RETURN random_adj || random_noun || random_num;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建函数：生成随机头像
CREATE OR REPLACE FUNCTION generate_random_avatar()
RETURNS VARCHAR AS $$
DECLARE
  avatars TEXT[] := ARRAY[
    '😀', '😃', '😄', '😁', '😊', '😎', '🤓', '🧐',
    '🤩', '🥳', '😺', '😸', '😹', '🐶', '🐱', '🐭',
    '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁',
    '🐮', '🐷', '🐸', '🐵', '🦄', '🦋', '🐝', '🐞'
  ];
BEGIN
  RETURN avatars[1 + floor(random() * array_length(avatars, 1))::int];
END;
$$ LANGUAGE plpgsql;

-- 3. 修改 handle_new_user 触发器函数
-- 在用户注册时自动创建基础 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 为新用户创建基础 profile（只包含 username 和 avatar）
  INSERT INTO public.profiles (id, username, avatar, mbti, role)
  VALUES (
    NEW.id,
    generate_random_username(),
    generate_random_avatar(),
    'INTJ', -- 默认值，用户会在 onboarding 中修改
    '创业者/自雇者' -- 默认值，用户会在 onboarding 中修改
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 注释
COMMENT ON FUNCTION generate_random_username() IS '生成随机用户名（形容词+名词+数字）';
COMMENT ON FUNCTION generate_random_avatar() IS '生成随机 emoji 头像';
COMMENT ON FUNCTION public.handle_new_user() IS '新用户注册时自动创建 profile（包含随机用户名和头像）';
