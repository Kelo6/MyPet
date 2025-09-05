// components/PetCard/PetCard.ts
import { Pet } from '../../models/database';
import { DateUtils } from '../../utils/date';

Component({
  properties: {
    pet: {
      type: Object,
      value: {} as Pet,
    },
    showActions: {
      type: Boolean,
      value: true,
    },
    compact: {
      type: Boolean,
      value: false,
    },
    vaccineStatus: {
      type: String,
      value: 'unknown', // normal, warning, danger, unknown
    },
    dewormStatus: {
      type: String,
      value: 'unknown', // normal, warning, danger, unknown
    },
  },

  data: {
    age: '',
  },

  lifetimes: {
    attached() {
      this.calculateAge();
    },
  },

  observers: {
    'pet.birthday'() {
      this.calculateAge();
    },
  },

  methods: {
    /**
     * 计算宠物年龄
     */
    calculateAge() {
      const pet = this.data.pet as Pet;
      if (pet && pet.birthday) {
        const age = DateUtils.calculateAge(pet.birthday);
        this.setData({ age });
      }
    },

    /**
     * 点击卡片
     */
    onCardTap() {
      const pet = this.data.pet as Pet;
      this.triggerEvent('cardtap', { 
        petId: pet._id,
        pet 
      });
    },

    /**
     * 编辑宠物
     */
    onEditTap() {
      const pet = this.data.pet as Pet;
      this.triggerEvent('edit', { 
        petId: pet._id,
        pet 
      });
    },

    /**
     * 删除宠物
     */
    onDeleteTap() {
      const pet = this.data.pet as Pet;
      this.triggerEvent('delete', { 
        petId: pet._id,
        pet 
      });
    },

    /**
     * 查看详情
     */
    onDetailTap() {
      const pet = this.data.pet as Pet;
      this.triggerEvent('detail', { 
        petId: pet._id,
        pet 
      });
    },

    /**
     * 获取宠物类型显示文本
     */
    getPetTypeText(species: string): string {
      const typeMap: Record<string, string> = {
        dog: '狗',
        cat: '猫',
        bird: '鸟',
        rabbit: '兔',
        hamster: '鼠',
        other: '宠',
      };
      return typeMap[species] || '宠';
    },

    /**
     * 获取性别显示文本
     */
    getGenderText(gender?: string): string {
      const genderMap: Record<string, string> = {
        male: '♂',
        female: '♀',
        unknown: '',
      };
      return genderMap[gender || 'unknown'] || '';
    },
  },
});
