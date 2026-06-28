import { DataService, isFirebaseConfigured, auth } from '../firebase';
import { User, UserRole } from '../types';

// Let's seed a dynamic list of default users in LocalStorage to guarantee first-time login
const DEFAULT_USERS: User[] = [
  {
    uid: 'ADMIN-ID',
    username: 'admin',
    fullName: 'Lê Phương Đông',
    rank: 'Thượng tá',
    unit: 'Ban Kỹ thuật - TĐ30',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2026-05-10T00:00:00Z').toISOString(),
    createdBy: 'system',
    password: '123'
  }
];

// Helper to seed localStorage
const ensureLocalSeeding = (): User[] => {
  const stored = localStorage.getItem('local_users');
  if (!stored) {
    localStorage.setItem('local_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.setItem('local_users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
};

export const userService = {
  /**
   * Loads all users from Firestore or LocalStorage fallback
   */
  async loadUsers(): Promise<User[]> {
    ensureLocalSeeding();
    
    try {
      const dbUsers = await DataService.load('users');
      if (Array.isArray(dbUsers) && dbUsers.length > 0) {
        // Build map/merge to handle full persistence
        const localList = ensureLocalSeeding();
        const merged: User[] = [...localList];
        
        dbUsers.forEach((u: any) => {
          const uFormatted: User = {
            uid: u.id || u.uid,
            username: u.username,
            fullName: u.fullName,
            rank: u.rank,
            unit: u.unit,
            role: u.role || 'tro_ly_ky_thuat',
            isActive: typeof u.isActive === 'boolean' ? u.isActive : true,
            createdAt: u.createdAt || new Date().toISOString(),
            createdBy: u.createdBy || 'unknown',
            password: u.password || '123'
          };
          
          const idx = merged.findIndex(exist => exist.username === uFormatted.username);
          if (idx >= 0) {
            merged[idx] = uFormatted;
          } else {
            merged.push(uFormatted);
          }
        });
        
        // Persist back to local storage so offline sync is pristine
        localStorage.setItem('local_users', JSON.stringify(merged));
        
        // Synchronize current_user if they are in the merged list
        const currentStored = localStorage.getItem('current_user');
        if (currentStored) {
          try {
            const cur = JSON.parse(currentStored);
            const updatedCur = merged.find(u => u.username === cur.username || u.uid === cur.uid);
            if (updatedCur) {
              localStorage.setItem('current_user', JSON.stringify(updatedCur));
            }
          } catch (err) {
            console.warn("Failed to synchronize current_user:", err);
          }
        }
        
        return merged;
      }
    } catch (err) {
      console.warn("Firestore getUsers failed, reading from localStorage:", err);
    }
    
    return ensureLocalSeeding();
  },

  /**
   * Saves or updates a user account
   */
  async saveUser(user: User): Promise<User> {
    if (user.username === 'admin' || user.uid === 'ADMIN-ID') {
      if (!user.isActive) {
        throw new Error("Không được phép vô hiệu hóa tài khoản quản trị hệ thống gốc (admin).");
      }
      if (user.username !== 'admin') {
        throw new Error("Không được phép thay đổi tên đăng nhập (username) của tài khoản quản trị hệ thống gốc (admin).");
      }
    }

    const dataToSave = {
      ...user,
      id: user.uid || user.username
    };

    // 1. Live Firestore save wrapper
    try {
      await DataService.save('users', dataToSave);
    } catch (err) {
      console.warn("Firestore save 'users' failed:", err);
    }

    // 2. Synchronous local state sync
    const list = ensureLocalSeeding();
    const existingIdx = list.findIndex(u => u.username === user.username);
    if (existingIdx >= 0) {
      list[existingIdx] = user;
    } else {
      list.push(user);
    }
    localStorage.setItem('local_users', JSON.stringify(list));

    // Also update current active session if it's the saved user
    const currentStored = localStorage.getItem('current_user');
    if (currentStored) {
      try {
        const cur = JSON.parse(currentStored);
        if (cur.username === user.username || cur.uid === user.uid) {
          localStorage.setItem('current_user', JSON.stringify(user));
        }
      } catch (err) {
        console.warn("Failed to update current_user in localStorage:", err);
      }
    }

    return user;
  },

  /**
   * Deletes a user by uid/id
   */
  async deleteUser(username: string): Promise<void> {
    if (username === 'admin') {
      throw new Error("Không được phép xóa tài khoản quản trị hệ thống gốc (admin).");
    }

    try {
      const users = await this.loadUsers();
      const targetUser = users.find(u => u.username === username);
      const docId = targetUser?.uid || username;
      await DataService.delete('users', docId);
    } catch (err) {
      console.warn("Firestore delete 'user' failed:", err);
    }

    const list = ensureLocalSeeding();
    const filtered = list.filter(u => u.username !== username);
    localStorage.setItem('local_users', JSON.stringify(filtered));
    
    try {
      const dataServiceList = JSON.parse(localStorage.getItem('local_users') || "[]");
      const dsFiltered = dataServiceList.filter((u: any) => u.username !== username);
      localStorage.setItem('local_users', JSON.stringify(dsFiltered));
    } catch (e) {}
  },

  /**
   * Performs user authentication
   */
  async authenticate(usernameInput: string, passwordInput: string): Promise<User> {
    const normalizedUsername = usernameInput.trim().toLowerCase();
    
    // Refresh user cache from both Firestore and LocalStorage
    const users = await this.loadUsers();
    const matchedUser = users.find(u => u.username.toLowerCase() === normalizedUsername);

    if (!matchedUser) {
      throw new Error("Tài khoản không tồn tại trên hệ thống");
    }

    // Check password (default is '123' if not specifically provided)
    const storedPassword = matchedUser.password || '123';
    if (storedPassword !== passwordInput) {
      throw new Error("Mật khẩu không chính xác");
    }

    // Check active status
    if (!matchedUser.isActive) {
      throw new Error("Tài khoản chưa được cấp quyền");
    }

    // Set active session in localStorage
    localStorage.setItem('current_user', JSON.stringify(matchedUser));
    return matchedUser;
  },

  /**
   * Retrieves active user session from LocalStorage
   */
  getCurrentUser(): User | null {
    const stored = localStorage.getItem('current_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  /**
   * Clears active session
   */
  logout(): void {
    localStorage.removeItem('current_user');
  }
};
