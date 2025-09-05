// 宠物服务
/// <reference path="../typings/index.d.ts" />

import { Pet } from '../models/pet';
import { StorageUtils, StorageKeys } from '../utils/storage';

export class PetsService {
  /**
   * 获取所有宠物
   */
  static async getAllPets(): Promise<ApiResult<Pet[]>> {
    try {
      const pets = StorageUtils.get<Pet[]>(StorageKeys.PETS) || [];
      return {
        code: 0,
        msg: '获取成功',
        data: pets,
      };
    } catch (error) {
      console.error('获取宠物列表失败:', error);
      return {
        code: -1,
        msg: '获取宠物列表失败',
        data: [],
      };
    }
  }

  /**
   * 根据ID获取宠物
   */
  static async getPetById(id: string): Promise<ApiResult<Pet | null>> {
    try {
      const pets = StorageUtils.get<Pet[]>(StorageKeys.PETS) || [];
      const pet = pets.find(p => p.id === id);

      if (pet) {
        return {
          code: 0,
          msg: '获取成功',
          data: pet,
        };
      }

      return {
        code: -1,
        msg: '宠物不存在',
        data: null,
      };
    } catch (error) {
      console.error('获取宠物详情失败:', error);
      return {
        code: -1,
        msg: '获取宠物详情失败',
        data: null,
      };
    }
  }

  /**
   * 添加宠物
   */
  static async addPet(pet: Pet): Promise<ApiResult<Pet>> {
    try {
      const pets = StorageUtils.get<Pet[]>(StorageKeys.PETS) || [];
      pets.push(pet);
      StorageUtils.set(StorageKeys.PETS, pets);

      return {
        code: 0,
        msg: '添加成功',
        data: pet,
      };
    } catch (error) {
      console.error('添加宠物失败:', error);
      return {
        code: -1,
        msg: '添加宠物失败',
        data: null,
      };
    }
  }

  /**
   * 更新宠物信息
   */
  static async updatePet(pet: Pet): Promise<ApiResult<Pet>> {
    try {
      const pets = StorageUtils.get<Pet[]>(StorageKeys.PETS) || [];
      const index = pets.findIndex(p => p.id === pet.id);

      if (index === -1) {
        return {
          code: -1,
          msg: '宠物不存在',
          data: null,
        };
      }

      pets[index] = pet;
      StorageUtils.set(StorageKeys.PETS, pets);

      return {
        code: 0,
        msg: '更新成功',
        data: pet,
      };
    } catch (error) {
      console.error('更新宠物信息失败:', error);
      return {
        code: -1,
        msg: '更新宠物信息失败',
        data: null,
      };
    }
  }

  /**
   * 删除宠物
   */
  static async deletePet(id: string): Promise<ApiResult<boolean>> {
    try {
      const pets = StorageUtils.get<Pet[]>(StorageKeys.PETS) || [];
      const filteredPets = pets.filter(p => p.id !== id);

      if (filteredPets.length === pets.length) {
        return {
          code: -1,
          msg: '宠物不存在',
          data: false,
        };
      }

      StorageUtils.set(StorageKeys.PETS, filteredPets);

      return {
        code: 0,
        msg: '删除成功',
        data: true,
      };
    } catch (error) {
      console.error('删除宠物失败:', error);
      return {
        code: -1,
        msg: '删除宠物失败',
        data: false,
      };
    }
  }
}
