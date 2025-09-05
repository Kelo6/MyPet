// 宠物相关数据模型

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed: string;
  gender: PetGender;
  birthDate: string;
  weight: number;
  avatar?: string;
  microchipId?: string;
  ownerInfo: {
    name: string;
    phone: string;
  };
  medicalInfo: {
    allergies?: string[];
    chronicDiseases?: string[];
    veterinarian?: {
      name: string;
      clinic: string;
      phone: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  RABBIT = 'rabbit',
  HAMSTER = 'hamster',
  OTHER = 'other',
}

export enum PetGender {
  MALE = 'male',
  FEMALE = 'female',
  NEUTERED_MALE = 'neutered_male',
  SPAYED_FEMALE = 'spayed_female',
}

export interface PetFormData {
  name: string;
  type: PetType;
  breed: string;
  gender: PetGender;
  birthDate: string;
  weight: number;
  avatar?: string;
  microchipId?: string;
  ownerName: string;
  ownerPhone: string;
  allergies: string;
  chronicDiseases: string;
  veterinarianName?: string;
  veterinarianClinic?: string;
  veterinarianPhone?: string;
}

// 宠物品种数据
export const PetBreeds: Record<PetType, string[]> = {
  [PetType.DOG]: [
    '拉布拉多',
    '金毛寻回犬',
    '德国牧羊犬',
    '哈士奇',
    '柯基',
    '比熊',
    '泰迪',
    '博美',
    '萨摩耶',
    '边境牧羊犬',
    '其他',
  ],
  [PetType.CAT]: [
    '英国短毛猫',
    '美国短毛猫',
    '波斯猫',
    '暹罗猫',
    '布偶猫',
    '苏格兰折耳猫',
    '俄罗斯蓝猫',
    '缅因猫',
    '中华田园猫',
    '其他',
  ],
  [PetType.BIRD]: ['鹦鹉', '金丝雀', '文鸟', '其他'],
  [PetType.RABBIT]: ['荷兰兔', '垂耳兔', '安哥拉兔', '其他'],
  [PetType.HAMSTER]: ['金丝熊', '三线仓鼠', '一线仓鼠', '其他'],
  [PetType.OTHER]: ['其他'],
};




