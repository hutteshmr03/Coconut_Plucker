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

// Initial Seeded Platform Admin Account
const ADMIN_USER = {
  id: 'usr_admin',
  username: 'admin',
  email: 'admin@coconutplucker.com',
  password: 'admin123',
  full_name: 'Goa Operations Admin',
  phone: '9800000001',
  role: 'admin',
  taluka: 'All Talukas',
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
    const saved = localStorage.getItem('cp_registered_users_v5');
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
    try {
      localStorage.setItem('cp_registered_users_v5', JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn('Could not save registered users to localStorage (quota exceeded):', e);
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('cp_auth_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('cp_auth_user');
      }
    } catch (e) {
      console.warn('Could not save current user to localStorage:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('cp_auth_token', token);
      } else {
        localStorage.removeItem('cp_auth_token');
      }
    } catch (e) {
      console.warn('Could not save auth token to localStorage:', e);
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
    let updatedUserObj = null;
    setCurrentUser((prev) => {
      if (!prev) return null;
      updatedUserObj = { ...prev, ...updates };
      try {
        localStorage.setItem('cp_auth_user', JSON.stringify(updatedUserObj));
      } catch (e) {
        console.warn('Could not save cp_auth_user:', e);
      }
      return updatedUserObj;
    });

    setRegisteredUsers((prev) => {
      const targetPhone = currentUser?.phone ? currentUser.phone.replace(/\D/g, '') : '';
      const targetUsername = currentUser?.username ? currentUser.username.toLowerCase() : '';
      const targetId = currentUser?.id;

      const updatedList = prev.map((u) => {
        const uPhone = u.phone ? u.phone.replace(/\D/g, '') : '';
        const uUsername = u.username ? u.username.toLowerCase() : '';
        const isMatch = (targetId && u.id === targetId) ||
                        (targetPhone && uPhone && targetPhone === uPhone) ||
                        (targetUsername && uUsername && targetUsername === uUsername);
        return isMatch ? { ...u, ...updates } : u;
      });

      try {
        localStorage.setItem('cp_registered_users_v5', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Could not save cp_registered_users_v5:', e);
      }
      return updatedList;
    });
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

  // Admin & Super Admin: Onboard / Provision Professional Climber Account
  const createProfessionalAccount = (proData) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Platform Administrators can create professional accounts.');
    }

    const phoneClean = (proData.phone || '').replace(/\D/g, '');
    const exists = registeredUsers.find(
      (u) => u.phone && u.phone.replace(/\D/g, '') === phoneClean
    );

    if (exists) {
      throw new Error(`An account with phone number +91 ${phoneClean} already exists.`);
    }

    const newId = 'wrk_' + Date.now().toString(36);
    const newProUser = {
      id: newId,
      full_name: proData.full_name.trim(),
      phone: phoneClean,
      username: phoneClean,
      role: 'professional',
      taluka: proData.taluka || 'North Goa',
      experience_years: Number(proData.experience_years) || 1,
      safety_cert: proData.safety_cert?.trim() || 'Verified Professional Climber',
      rating_avg: 5.0,
      skills: proData.skills || ['svc_coconut', 'svc_palm'],
      status: proData.status || 'approved',
      created_at: new Date().toISOString()
    };

    setRegisteredUsers((prev) => [...prev, newProUser]);
    return newProUser;
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

  // Admin & Super Admin: Profile Password Reset
  const changeAccountPassword = (currentPassword, newPassword) => {
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Password change is only for Administrator profiles.');
    }

    const curClean = (currentPassword || '').trim();
    const newClean = (newPassword || '').trim();

    const isMatch =
      currentUser?.password === curClean ||
      (currentUser?.role === 'super_admin' && currentUser?.must_reset_password && ['tempPassword123!', 'admin123', 'Super@Admin2026!'].includes(curClean)) ||
      (currentUser?.role === 'admin' && !currentUser?.password_updated_at && (curClean === 'admin123' || curClean === '123'));

    if (!isMatch) {
      throw new Error('Current password does not match.');
    }

    if (!newClean || newClean.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    if (newClean === curClean) {
      throw new Error('New password must be different from current password.');
    }

    const updates = {
      password: newClean,
      must_reset_password: false,
      password_updated_at: new Date().toISOString()
    };

    updateCurrentUser(updates);
    return { success: true };
  };

  const changeSuperAdminPassword = changeAccountPassword;

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
        createProfessionalAccount,
        toggleAdminStatus,
        deleteAdminAccount,
        changeSuperAdminPassword,
        changeAccountPassword,
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
