import { Message } from "ai/react";

interface ChatRecord {
  data: {
    messages: Message[];
    title?: string;
  };
  time: number;
  uuid: string;
}

type DBEventListener = () => void;

export class DBManager {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'WeDevDB';
  private readonly STORE_NAME = 'chatRecords';
  private listeners: Set<DBEventListener> = new Set();

  constructor() {
    // 检查环境
    if (this.isElectron()) {
      console.log('Running in Electron environment');
      // 在 Electron 中使用 localStorage 作为备选
      this.initLocalStorage();
    } else {
      this.init().then(() => {
        console.log('DBManager 初始化完成');
      }).catch((error) => {
        console.error('DBManager 初始化失败', error);
      });
    }
  }

  private isElectron() {
    // 检查是否在 Electron 环境中
  return window.electron
  }

  private initLocalStorage() {
    // 初始化 localStorage
    if (!localStorage.getItem('chatRecords')) {
      localStorage.setItem('chatRecords', JSON.stringify([]));
    }
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.DB_NAME, 1);

        request.onerror = (event) => {
          console.error('数据库打开失败:', event);
          reject(request.error);
        };

        request.onupgradeneeded = (event) => {
          console.log('数据库升级中...');
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: ['uuid', 'time'] });
            store.createIndex('uuid', 'uuid', { unique: false });
            store.createIndex('time', 'time', { unique: false });
          }
        };

        request.onsuccess = () => {
          console.log('数据库打开成功');
          this.db = request.result;
          resolve();
        };

      } catch (error) {
        console.error('数据库初始化错误:', error);
        reject(error);
      }
    });
  }

  // 获取所有不重复的 UUID
  async getAllUuids(): Promise<string[]> {
    if (this.isElectron()) {
      const records = JSON.parse(localStorage.getItem('chatRecords') || '[]') as ChatRecord[];
      const uuids = Array.from(new Set(
        records.sort((a, b) => b.time - a.time)
          .map(record => record.uuid)
      )).slice(0, 20);

      if (uuids.length === 20) {
        this.cleanOldRecords(uuids);
      }

      return uuids;
    }

    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.index('time').getAll();

      request.onsuccess = () => {
        const records = request.result as ChatRecord[];
        const uuids = Array.from(new Set(
          records.sort((a, b) => b.time - a.time)
            .map(record => record.uuid)
        )).slice(0, 20);

        if (uuids.length === 20) {
          this.cleanOldRecords(uuids);
        }

        resolve(uuids);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 插入信息
  async insert(uuid: string, data: ChatRecord['data']): Promise<void> {
    const record: ChatRecord = {
      data,
      time: Date.now(),
      uuid
    };

    if (this.isElectron()) {
      const records = JSON.parse(localStorage.getItem('chatRecords') || '[]') as ChatRecord[];
      records.push(record);
      localStorage.setItem('chatRecords', JSON.stringify(records));
      this.notify();
      return;
    }

    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(record);

      request.onsuccess = () => {
        this.notify();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 删除指定 UUID 的所有内容
  async deleteByUuid(uuid: string): Promise<void> {
    if (this.isElectron()) {
      const records = JSON.parse(localStorage.getItem('chatRecords') || '[]') as ChatRecord[];
      const filteredRecords = records.filter(record => record.uuid !== uuid);
      localStorage.setItem('chatRecords', JSON.stringify(filteredRecords));
      this.notify();
      return;
    }

    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('uuid');
      const request = index.getAll(uuid);

      request.onsuccess = () => {
        const records = request.result as ChatRecord[];
        const deletePromises = records.map(record =>
          new Promise<void>((res, rej) => {
            const deleteReq = store.delete([record.uuid, record.time]);
            deleteReq.onsuccess = () => res();
            deleteReq.onerror = () => rej(deleteReq.error);
          })
        );

        Promise.all(deletePromises)
          .then(() => {
            this.notify();
            resolve();
          })
          .catch(reject);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 读取指定 UUID 的所有内容
  async getByUuid(uuid: string): Promise<ChatRecord[]> {
    if (this.isElectron()) {
      const records = JSON.parse(localStorage.getItem('chatRecords') || '[]') as ChatRecord[];
      return records
        .filter(record => record.uuid === uuid)
        .sort((a, b) => b.time - a.time);
    }

    await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('uuid');
      const request = index.getAll(uuid);

      request.onsuccess = () => {
        resolve(request.result.sort((a, b) => b.time - a.time));
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async ensureDB(): Promise<void> {
    if (this.isElectron()) {
      return Promise.resolve();
    }

    if (!this.db) {
      console.log('数据库未初始化，正在初始化...');
      try {
        await this.init();
        console.log('数据库初始化完成');
      } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
      }
    }
  }

  private cleanOldRecords(activeUuids: string[]): void {
    if (this.isElectron()) {
      const records = JSON.parse(localStorage.getItem('chatRecords') || '[]') as ChatRecord[];
      const filteredRecords = records.filter(record => activeUuids.includes(record.uuid));
      localStorage.setItem('chatRecords', JSON.stringify(filteredRecords));
      return;
    }

    if (!this.db) return;

    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    const request = store.index('time').getAll();

    request.onsuccess = () => {
      const records = request.result as ChatRecord[];
      records
        .filter(record => !activeUuids.includes(record.uuid))
        .forEach(record => {
          store.delete([record.uuid, record.time]);
        });
    };
  }

  subscribe(listener: DBEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

export const db = new DBManager();
