// pages/pet-form/pet-form.ts
import { DatabaseService } from '../../services/database';
import { Pet } from '../../models/database';
import { DateUtils } from '../../utils/date';
import { Validator } from '../../utils/validator';
import { ScheduleService } from '../../services/schedule-service';

interface FormData {
  name: string;
  species: string;
  breed: string;
  gender: string;
  birthday: string;
  weightKg: string;
  sterilized: boolean;
  microchipId: string;
  avatar: string;
  note: string;
}

interface FormErrors {
  [key: string]: string;
}

Page({
  data: {
    // 表单数据
    formData: {
      name: '',
      species: '',
      breed: '',
      gender: 'unknown',
      birthday: '',
      weightKg: '',
      sterilized: false,
      microchipId: '',
      avatar: '',
      note: '',
    } as FormData,

    // 表单验证错误
    errors: {} as FormErrors,

    // 字符计数
    noteCount: 0,

    // 物种标签
    speciesLabel: '请选择宠物类型',

    // 物种选项
    speciesOptions: [
      { value: 'dog', label: '🐕 狗狗' },
      { value: 'cat', label: '🐱 猫咪' },
      { value: 'bird', label: '🐦 鸟类' },
      { value: 'rabbit', label: '🐰 兔子' },
      { value: 'hamster', label: '🐹 仓鼠' },
      { value: 'other', label: '🐾 其他' },
    ],

    // 状态变量
    speciesIndex: -1,
    today: '',
    isEditing: false,
    submitting: false,
    isFormValid: false,
    showChipModal: false,
    currentAge: '',

    // 编辑模式下的宠物ID
    petId: '',
  },

  onLoad(options: any) {
    const today = DateUtils.format(new Date());
    this.setData({ today });

    // 检查是否为编辑模式
    if (options.id) {
      this.setData({
        isEditing: true,
        petId: options.id,
      });
      this.loadPetData(options.id);
    } else {
      // 新建模式，设置初始表单为有效（用户输入后会重新验证）
      this.setData({ isFormValid: true });
    }

    this.validateForm();
  },

  /**
   * 加载宠物数据（编辑模式）
   */
  async loadPetData(petId: string) {
    try {
      const result = await DatabaseService.getPetById(petId);
      if (result.success && result.data) {
        const pet = result.data;
        const speciesIndex = this.data.speciesOptions.findIndex(
          option => option.value === pet.species
        );

        const noteValue = (pet as any).note || '';
        const selectedSpecies = this.data.speciesOptions[speciesIndex];
        const age = pet.birthday ? DateUtils.calculateAge(pet.birthday) : '';
        this.setData({
          formData: {
            name: pet.name,
            species: pet.species,
            breed: pet.breed || '',
            gender: pet.gender || 'unknown',
            birthday: pet.birthday || '',
            weightKg: pet.weightKg ? pet.weightKg.toString() : '',
            sterilized: pet.sterilized || false,
            microchipId: pet.microchipId || '',
            avatar: pet.avatar || '',
            note: noteValue,
          },
          noteCount: noteValue.length,
          speciesIndex,
          speciesLabel: selectedSpecies ? selectedSpecies.label : '请选择宠物类型',
          currentAge: age,
        });

        this.validateForm();
      } else {
        wx.showToast({
          title: '加载宠物信息失败',
          icon: 'error',
        });
        wx.navigateBack();
      }
    } catch (error) {
      console.error('加载宠物数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      });
    }
  },

  /**
   * 输入框变化处理
   */
  onInputChange(e: any) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value,
    });

    // 更新字符计数
    if (field === 'note') {
      this.setData({
        noteCount: value.length,
      });
    }

    // 清除对应字段的错误
    if (this.data.errors[field]) {
      this.setData({
        [`errors.${field}`]: '',
      });
    }

    this.validateForm();
  },

  /**
   * 物种选择变化
   */
  onSpeciesChange(e: any) {
    const index = parseInt(e.detail.value);
    const species = this.data.speciesOptions[index];
    
    this.setData({
      speciesIndex: index,
      'formData.species': species.value,
      'formData.breed': '', // 清空品种
      speciesLabel: species.label,
    });

    this.clearError('species');
    this.validateForm();
  },

  /**
   * 性别选择变化
   */
  onGenderChange(e: any) {
    const gender = e.currentTarget.dataset.value;
    this.setData({
      'formData.gender': gender,
    });
    this.validateForm();
  },

  /**
   * 生日选择变化
   */
  onBirthdayChange(e: any) {
    const birthday = e.detail.value;
    const age = birthday ? DateUtils.calculateAge(birthday) : '';
    this.setData({
      'formData.birthday': birthday,
      currentAge: age,
    });
    this.validateForm();
  },

  /**
   * 绝育状态变化
   */
  onSterilizedChange(e: any) {
    const sterilized = e.detail.value;
    this.setData({
      'formData.sterilized': sterilized,
    });
    this.validateForm();
  },

  /**
   * 选择头像
   */
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFilePath = res.tempFiles[0].tempFilePath;
          this.setData({
            'formData.avatar': tempFilePath,
          });
        }
      },
      fail: (error) => {
        console.error('选择头像失败:', error);
        wx.showToast({
          title: '选择头像失败',
          icon: 'error',
        });
      },
    });
  },

  /**
   * 表单验证
   */
  validateForm() {
    const { formData } = this.data;
    const errors: FormErrors = {};

    // 验证宠物名称
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = '请输入宠物名称';
    } else if (formData.name.trim().length > 20) {
      errors.name = '宠物名称不能超过20个字符';
    }

    // 验证宠物类型
    if (!formData.species) {
      errors.species = '请选择宠物类型';
    }

    // 验证体重
    if (formData.weightKg) {
      const weightResult = Validator.validateWeight(parseFloat(formData.weightKg));
      if (!weightResult.isValid) {
        errors.weightKg = weightResult.message || '请输入有效的体重';
      }
    }

    // 验证芯片号
    if (formData.microchipId && formData.microchipId.length > 0) {
      if (formData.microchipId.length !== 15 || !/^\d{15}$/.test(formData.microchipId)) {
        errors.microchipId = '芯片号应为15位数字';
      }
    }

    const isFormValid = Object.keys(errors).length === 0 && !!formData.name && !!formData.species;

    this.setData({
      errors,
      isFormValid,
    });
  },

  /**
   * 清除指定字段错误
   */
  clearError(field: string) {
    if (this.data.errors[field]) {
      this.setData({
        [`errors.${field}`]: '',
      });
    }
  },

  /**
   * 提交表单
   */
  async onSubmit() {
    if (!this.data.isFormValid) {
      const { formData, errors } = this.data;
      let message = '请检查表单信息';
      
      if (!formData.name) {
        message = '请输入宠物名称';
      } else if (!formData.species) {
        message = '请选择宠物类型';
      } else if (Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0];
        message = firstError;
      }
      
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      const { formData, isEditing, petId } = this.data;
      const userId = 'current_user'; // 实际应用中从登录状态获取

      const petData: Omit<Pet, '_id' | 'createdAt'> & { _id?: string } = {
        _id: isEditing ? petId : undefined,
        userId,
        name: formData.name.trim(),
        species: formData.species as Pet['species'],
        breed: formData.breed.trim() || undefined,
        gender: formData.gender as Pet['gender'],
        birthday: formData.birthday || undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        sterilized: formData.sterilized,
        microchipId: formData.microchipId.trim() || undefined,
        avatar: formData.avatar || undefined,
      };

      const result = await DatabaseService.savePet(petData);

      if (result.success) {
        wx.showToast({
          title: isEditing ? '更新成功' : '保存成功',
          icon: 'success',
        });

        // 如果是新增宠物，生成健康计划
        if (!isEditing && result.data?._id) {
          this.generateInitialHealthPlan(result.data._id);
        }

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(result.error || '保存失败');
      }
    } catch (error) {
      console.error('保存宠物信息失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  /**
   * 重置表单
   */
  onReset() {
    this.setData({
      formData: {
        name: '',
        species: '',
        breed: '',
        gender: 'unknown',
        birthday: '',
        weightKg: '',
        sterilized: false,
        microchipId: '',
        avatar: '',
        note: '',
      },
      errors: {},
      speciesIndex: -1,
      isFormValid: false,
    });
  },

  /**
   * 删除宠物
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这只宠物吗？',
      confirmText: '删除',
      confirmColor: '#ef4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await DatabaseService.deletePet(this.data.petId);
            if (result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
              });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              throw new Error(result.error || '删除失败');
            }
          } catch (error) {
            console.error('删除宠物失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error',
            });
          }
        }
      },
    });
  },

  /**
   * 显示芯片说明
   */
  showChipTip() {
    this.setData({ showChipModal: true });
  },

  /**
   * 隐藏芯片说明
   */
  hideChipTip() {
    this.setData({ showChipModal: false });
  },

  /**
   * 阻止事件冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 获取物种标签
   */
  getSpeciesLabel(species: string): string {
    const option = this.data.speciesOptions.find(item => item.value === species);
    return option ? option.label : '';
  },

  /**
   * 获取品种占位符
   */
  getBreedPlaceholder(species: string): string {
    const placeholders: Record<string, string> = {
      dog: '如：拉布拉多、金毛、泰迪等',
      cat: '如：英短、美短、布偶等',
      bird: '如：虎皮鹦鹉、玄凤鹦鹉等',
      rabbit: '如：垂耳兔、荷兰兔等',
      hamster: '如：金丝熊、仓鼠等',
      other: '请输入具体品种',
    };
    return placeholders[species] || '请输入品种（可选）';
  },

  /**
   * 格式化生日显示
   */
  formatBirthday(birthday: string): string {
    if (!birthday) return '';
    try {
      const date = new Date(birthday);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } catch {
      return birthday;
    }
  },

  /**
   * 计算年龄
   */
  calculateAge(birthday: string): string {
    if (!birthday) return '';
    return DateUtils.calculateAge(birthday);
  },

  /**
   * 生成初始健康计划
   */
  async generateInitialHealthPlan(petId: string) {
    try {
      console.log('为新宠物生成初始健康计划:', petId);
      
      // 异步生成计划，不阻塞用户操作
      const result = await ScheduleService.generatePetSchedule(petId);
      
      if (result.success) {
        console.log('健康计划生成成功:', {
          petId,
          totalItems: result.totalItems,
          vaccineItems: result.vaccineItems,
          dewormItems: result.dewormItems,
        });

        // 显示计划生成提示
        setTimeout(() => {
          wx.showModal({
            title: '健康计划已生成',
            content: `已为您的宠物生成${result.totalItems}项健康计划，包括${result.vaccineItems}项疫苗和${result.dewormItems}项驱虫计划。`,
            showCancel: false,
            confirmText: '查看计划',
            success: (res) => {
              if (res.confirm) {
                wx.navigateTo({
                  url: '/pages/schedule/schedule'
                });
              }
            }
          });
        }, 2000);
        
      } else {
        console.warn('健康计划生成失败:', result.error);
      }
      
    } catch (error) {
      console.error('生成初始健康计划失败:', error);
    }
  },

  /**
   * 页面分享
   */
  onShareAppMessage() {
    return {
      title: '宠物健康助手 - 宠物档案管理',
      path: '/pages/pet-form/pet-form',
    };
  },
});