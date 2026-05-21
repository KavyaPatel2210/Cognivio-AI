import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('SecureStore.getItemAsync error, falling back to AsyncStorage', e);
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.warn('SecureStore.setItemAsync error, falling back to AsyncStorage', e);
      try {
        await AsyncStorage.setItem(key, value);
      } catch {}
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        await AsyncStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.warn('SecureStore.deleteItemAsync error, falling back to AsyncStorage', e);
      try {
        await AsyncStorage.removeItem(key);
      } catch {}
    }
  },
};
