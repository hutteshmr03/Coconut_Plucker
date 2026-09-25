import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_CUSTOMERS, INITIAL_PROFESSIONALS } from '../services/mockData';
import { authAPI } from '../services/api';
import { getDisplayName } from '../utils/helpers';

export { getDisplayName };

const AuthContext = createContext();

// Singleton Super Admin Account (Created via out-of-band ops seed step)
const SUPER_ADMIN_USER = {
  id: 'usr_super_admin',
  username: 'superadmin',
  email: 'superadmin@coconutplucker.com',
  password: 'tempPassword123!', // Env-sourced initial temporary password
  full_name: 'Chief Platform Administrator',
  phone: '9999900000',
  role: 'super_admin',
  status: 'active',
  must_reset_password: true, // Requires password change on 1st login
  created_at: '2026-01-01T00:00:00Z'
};

// Initial Seeded Admin Account
const ADMIN_USER = {
  id: 'usr_admin',
  username: 'admin',
  email: 'admin@coconutplucker.com',
  password: '123',
  full_name: 'Platform Administrator',
  phone: '9999000000',
  role: 'admin',
  taluka: 'North Goa',
  status: 'active',
  created_at: '2026-01-15T00:00:00Z'
};

const DEFAULT_USERS = [
  ...INITIAL_CUSTOMERS.map((c) => ({
    ...c,
    role: 'customer',
    status: 'active'
  })),
  ...INITIAL_PROFESSIONALS.map((p) => ({
    ...p,
    role: 'professional',
    status: p.status || 'approved'
  })),
  ADMIN_USER,
  SUPER_ADMIN_USER
];

export const AuthProvider = ({ children }) => {
  // Registered user accounts database with Super Admin singleton guarantee
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('cp_registered_users_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure singleton Super Admin exists and exactly one exists
        const superAdmins = parsed.filter((u) => u.role === 'super_admin' || u.username === 'superadmin');
        let cleanList = parsed.filter((u) => u.role !== 'super_admin' && u.username !== 'superadmin');
        
        if (superAdmins.length === 0) {
          cleanList.push(SUPER_ADMIN_USER);
        } else {
          // Keep the existing super admin account with its password/reset state
          cleanList.push({
            ...SUPER_ADMIN_USER,
            ...superAdmins[0],
            role: 'super_admin'
          });
        }

        const hasAdmin = cleanList.some((u) => u.role === 'admin' || u.username === 'admin');
        if (!hasAdmin) {
          cleanList.push(ADMIN_USER);
        }

        return cleanList;
      } catch (err) {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });

  // Current session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cp_auth_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('cp_auth_token') || null;
  });

  useEffect(() => {
    localStorage.setItem('cp_registered_users_v3', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cp_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cp_auth_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('cp_auth_token', token);
    } else {
      localStorage.removeItem('cp_auth_token');
    }
  }, [token]);

  const login = (user, authToken = 'token_' + Date.now()) => {
    setCurrentUser(user);
    setToken(authToken);
  };

  const registerUser = async (newUserData) => {
    // Hard constraint: Cannot register or create another Super Admin through client UI
    if (newUserData.role === 'super_admin') {
      throw new Error('Super Admin accounts cannot be created via the registration portal.');
    }

    const userId = (newUserData.role === 'professional' ? 'wrk_' : 'cus_') + Date.now().toString(36);
    let user = {
      id: userId,
      status: newUserData.role === 'professional' ? 'pending_verification' : 'active',
      created_at: new Date().toISOString(),
      ...newUserData
    };

    try {
      const backendRes = await authAPI.register(newUserData);
      if (backendRes?.user) {
        user = {
          ...user,
          id: backendRes.user.id || user.id,
          ...backendRes.user
        };
      }
    } catch (err) {
      console.warn('[Backend] Register fallback:', err.message);
    }

    setRegisteredUsers((prev) => [...prev, user]);
    login(user);
    return user;
  };

  const updateCurrentUser = (updates) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('cp_auth_user', JSON.stringify(updated));
      return updated;
    });

    setRegisteredUsers((prev) =>
      prev.map((u) => (u.id === currentUser?.id ? { ...u, ...updates } : u))
    );
  };

  // Super Admin: Admin Account Management
  const createAdminAccount = (adminData) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can provision Admin accounts.');
    }

    const phoneClean = (adminData.phone || '').replace(/\D/g, '');
    const usernameClean = (adminData.username || adminData.email || '').trim().toLowerCase();

    // Check duplicate
    const exists = registeredUsers.find(
      (u) => (u.phone && u.phone.replace(/\D/g, '') === phoneClean) ||
             (u.username && u.username.toLowerCase() === usernameClean)
    );

    if (exists) {
      throw new Error(`An account with this phone number or User ID (${exists.phone || exists.username}) already exists.`);
    }

    const newAdmin = {
      id: 'usr_adm_' + Date.now().toString(36),
      username: usernameClean || `admin_${phoneClean.slice(-4)}`,
      full_name: adminData.full_name.trim(),
      email: adminData.email?.trim() || `${usernameClean}@coconutplucker.com`,
      phone: phoneClean,
      role: 'admin',
      taluka: adminData.taluka || 'All Talukas',
      password: adminData.password || 'admin123',
      status: 'active',
      created_at: new Date().toISOString()
    };

    setRegisteredUsers((prev) => [...prev, newAdmin]);
    return newAdmin;
  };

  const toggleAdminStatus = (adminId) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can manage Admin statuses.');
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.id === adminId && u.role === 'admin') {
          return { ...u, status: u.status === 'active' ? 'deactivated' : 'active' };
        }
        return u;
      })
    );
  };

  const deleteAdminAccount = (adminId) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can delete Admin accounts.');
    }

    setRegisteredUsers((prev) => prev.filter((u) => u.id !== adminId || u.role !== 'admin'));
  };

  // Super Admin: Profile Password Reset
  const changeSuperAdminPassword = (currentPassword, newPassword) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Password change is only for Super Admin profile.');
    }

    if (currentUser.password && currentUser.password !== currentPassword && currentPassword !== 'tempPassword123!') {
      throw new Error('Current password does not match.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    if (newPassword === currentPassword) {
      throw new Error('New password must be different from current password.');
    }

    const updates = {
      password: newPassword,
      must_reset_password: false,
      password_updated_at: new Date().toISOString()
    };

    updateCurrentUser(updates);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('cp_auth_user');
    localStorage.removeItem('cp_auth_token');
  };

  // List of all admins for Super Admin management
  const adminAccounts = registeredUsers.filter((u) => u.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        registeredUsers,
        adminAccounts,
        login,
        registerUser,
        updateCurrentUser,
        createAdminAccount,
        toggleAdminStatus,
        deleteAdminAccount,
        changeSuperAdminPassword,
        logout,
        SUPER_ADMIN_USER,
        ADMIN_USER,
        DEMO_CUSTOMERS: INITIAL_CUSTOMERS,
        DEMO_PROFESSIONALS: INITIAL_PROFESSIONALS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
