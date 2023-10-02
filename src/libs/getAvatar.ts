const getAvatar = (createdAt: string): string => {
  const sprites = ['adventurer', 'avataaars', 'big-ears', 'big-smile', 'croodles', 'micah'];
  const sprite = sprites[Math.floor(Math.random() * sprites.length)];
  return `https://avatars.dicebear.com/api/${sprite}/${createdAt}.svg`;
};

export default getAvatar;
