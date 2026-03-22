const COLORS = [
  "파란",
  "붉은",
  "초록",
  "노란",
  "보라",
  "은빛",
  "분홍",
  "주황",
  "하얀",
  "검은",
  "민트",
  "청록",
];

const ANIMALS = [
  "고래",
  "여우",
  "수달",
  "참새",
  "고양이",
  "토끼",
  "사슴",
  "다람쥐",
  "독수리",
  "두루미",
  "펭귄",
  "바다표범",
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function getPublicAliasFromId(id: string | null | undefined) {
  if (!id) {
    return "익명 고래";
  }

  const hash = hashString(id);
  const color = COLORS[hash % COLORS.length];
  const animal = ANIMALS[Math.floor(hash / COLORS.length) % ANIMALS.length];

  return `${color} ${animal}`;
}
