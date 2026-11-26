import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_CUSTOMERS, INITIAL_PROFESSIONALS } from '../services/mockData';
import { authAPI, superAdminAPI } from '../services/api';
import { getDisplayName } from '../utils/helpers';

export { getDisplayName };

const AuthContext = createContext();

// Singleton Super Admin Account (Profile reference only; credentials authenticated server-side)
const SUPER_ADMIN_USER = {
  id: 'usr_super_admin',
  username: 'superadmin',
  email: 'superadmin@coconutplucker.com',
  full_name: 'Chief Platform Administrator',
  phone: '9999900000',
  role: 'super_admin',
  status: 'active',
  created_at: '2026-01-01T00:00:00Z'
};

// Initial Seeded Platform Admin Account (Profile reference only; credentials authenticated server-side)
const ADMIN_USER = {
  id: 'usr_admin',
  username: 'admin',
  full_name: 'Goa Operations Admin',
  phone: '9800000001',
  role: 'admin',
  taluka: 'All Talukas',
  status: 'active',
  created_at: '2026-01-15T00:00:00Z'
};

const DEFAULT_USERS = [
  ADMIN_USER,
  SUPER_ADMIN_USER
];

export const AuthProvider = ({ children }) => {
  // Registered user accounts database with Super Admin singleton guarantee
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('cp_registered_users_v6');
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

        cleanList = cleanList.map((u) => {
          if (u.role === 'admin' && u.email) {
            const { email, ...rest } = u;
            return rest;
          }
          return u;
        });

        return cleanList;
      } catch (err) {
        return DEFAULT_USERS;
      }
    }
    return DEFAULT_USERS;
  });

  // Current session (prefer tab-isolated sessionStorage so multi-tab roles don't overwrite each other)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('cp_auth_user') || localStorage.getItem('cp_auth_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      // Clean up legacy mock sessions
      if (parsed?.id === 'cus_001' || parsed?.id === 'wrk_001' || parsed?.phone?.startsWith('98221') || parsed?.phone?.startsWith('98222')) {
        sessionStorage.removeItem('cp_auth_user');
        sessionStorage.removeItem('cp_auth_token');
        localStorage.removeItem('cp_auth_user');
        localStorage.removeItem('cp_auth_token');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('cp_auth_token') || localStorage.getItem('cp_auth_token') || null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cp_registered_users_v6', JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn('Could not save registered users to localStorage (quota exceeded):', e);
    }
  }, [registeredUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        const serialized = JSON.stringify(currentUser);
        sessionStorage.setItem('cp_auth_user', serialized);
        localStorage.setItem('cp_auth_user', serialized);
      } else {
        sessionStorage.removeItem('cp_auth_user');
        localStorage.removeItem('cp_auth_user');
      }
    } catch (e) {
      console.warn('Could not save current user to storage:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (token) {
        sessionStorage.setItem('cp_auth_token', token);
        localStorage.setItem('cp_auth_token', token);
      } else {
        sessionStorage.removeItem('cp_auth_token');
        localStorage.removeItem('cp_auth_token');
      }
    } catch (e) {
      console.warn('Could not save auth token to storage:', e);
    }
  }, [token]);

  // Sync Super Admin's adminAccounts list from live MySQL backend
  useEffect(() => {
    if (currentUser?.role === 'super_admin' && token && !String(token).startsWith('token_')) {
      superAdminAPI
        .getAdmins()
        .then((remoteAdmins) => {
          if (Array.isArray(remoteAdmins)) {
            setRegisteredUsers((prev) => {
              const nonAdmins = prev.filter((u) => u.role !== 'admin');
              return [...nonAdmins, ...remoteAdmins];
            });
          }
        })
        .catch((err) => console.warn('[Backend] Admin list sync skipped:', err.message));
    }
  }, [currentUser?.role, currentUser?.id, token]);

  const login = (user, authToken = 'token_' + Date.now()) => {
    const finalToken = authToken || ('token_' + Date.now());
    try {
      const serialized = JSON.stringify(user);
      sessionStorage.setItem('cp_auth_user', serialized);
      sessionStorage.setItem('cp_auth_token', finalToken);
      localStorage.setItem('cp_auth_user', serialized);
      localStorage.setItem('cp_auth_token', finalToken);
    } catch (e) {
      console.warn('Could not persist login session:', e);
    }
    setCurrentUser(user);
    setToken(finalToken);
    if (user?.id) {
      setRegisteredUsers((prev) => {
        const exists = prev.some(
          (u) => u.id === user.id || (u.phone && user.phone && u.phone.slice(-10) === user.phone.slice(-10))
        );
        if (exists) {
          return prev.map((u) =>
            u.id === user.id || (u.phone && user.phone && u.phone.slice(-10) === user.phone.slice(-10))
              ? { ...u, ...user }
              : u
          );
        }
        return [...prev, user];
      });
    }
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
    let authToken = null;

    try {
      const backendRes = await authAPI.register(newUserData);
      if (backendRes?.user) {
        user = {
          ...user,
          id: backendRes.user.id || user.id,
          ...backendRes.user
        };
      }
      if (backendRes?.access_token) {
        authToken = backendRes.access_token;
      }
    } catch (err) {
      console.warn('[Backend] Register fallback:', err.message);
    }

    setRegisteredUsers((prev) => [...prev, user]);
    login(user, authToken || undefined);
    return user;
  };

  const updateCurrentUser = (updates) => {
    let updatedUserObj = null;
    setCurrentUser((prev) => {
      if (!prev) return null;
      updatedUserObj = { ...prev, ...updates };
      try {
        const serialized = JSON.stringify(updatedUserObj);
        sessionStorage.setItem('cp_auth_user', serialized);
        localStorage.setItem('cp_auth_user', serialized);
      } catch (e) {
        console.warn('Could not save cp_auth_user:', e);
      }
      return updatedUserObj;
    });

    if ((currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (updates.full_name || updates.phone)) {
      authAPI
        .updateProfile({
          full_name: updates.full_name,
          phone: updates.phone
        })
        .catch((err) => console.warn('[Backend] Admin profile sync warning:', err.message));
    }

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
        localStorage.setItem('cp_registered_users_v6', JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Could not save cp_registered_users_v6:', e);
      }
      return updatedList;
    });
  };

  // Super Admin: Admin Account Management
  const createAdminAccount = async (adminData) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can provision Admin accounts.');
    }

    const rawDigits = (adminData.phone || '').replace(/\D/g, '');
    const phoneClean = (rawDigits.length === 12 && rawDigits.startsWith('91')) ? rawDigits.slice(-10) : rawDigits;
    const usernameClean = (adminData.username || adminData.email || '').trim().toLowerCase();

    // Check duplicate
    const exists = registeredUsers.find(
      (u) => (u.phone && u.phone.replace(/\D/g, '') === phoneClean) ||
             (u.username && u.username.toLowerCase() === usernameClean)
    );

    if (exists) {
      throw new Error(`An account with this phone number or User ID (${exists.phone || exists.username}) already exists.`);
    }

    let createdAdmin = {
      id: 'usr_adm_' + Date.now().toString(36),
      username: usernameClean || phoneClean,
      full_name: adminData.full_name.trim(),
      phone: phoneClean,
      role: 'admin',
      taluka: adminData.taluka || 'All Talukas',
      password: adminData.password || 'admin123',
      status: 'active',
      created_at: new Date().toISOString()
    };

    // Persist new Admin to live MySQL backend before returning so admin can log in immediately
    if (token && !String(token).startsWith('token_')) {
      const created = await superAdminAPI.createAdmin({
        full_name: createdAdmin.full_name,
        phone: createdAdmin.phone,
        username: createdAdmin.username,
        taluka: createdAdmin.taluka,
        password: createdAdmin.password
      });
      if (created?.id) {
        createdAdmin = { ...createdAdmin, ...created };
      }
    }

    setRegisteredUsers((prev) => {
      const updated = [...prev, createdAdmin];
      try {
        localStorage.setItem('cp_registered_users_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist new admin to localStorage:', e);
      }
      return updated;
    });

    return createdAdmin;
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

    setRegisteredUsers((prev) => {
      const updated = [...prev, newProUser];
      try {
        localStorage.setItem('cp_registered_users_v6', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist new professional to localStorage:', e);
      }
      return updated;
    });
    return newProUser;
  };

  const toggleAdminStatus = (adminId) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can manage Admin statuses.');
    }

    const target = registeredUsers.find((u) => u.id === adminId && u.role === 'admin');
    const nextStatus = target?.status === 'active' ? 'deactivated' : 'active';

    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.id === adminId && u.role === 'admin') {
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );

    if (adminId && !String(adminId).startsWith('usr_')) {
      superAdminAPI
        .updateAdminStatus(adminId, nextStatus)
        .catch((err) => console.warn('[Backend] Admin status sync warning:', err.message));
    }
  };

  const deleteAdminAccount = (adminId) => {
    if (currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can delete Admin accounts.');
    }

    setRegisteredUsers((prev) => prev.filter((u) => u.id !== adminId || u.role !== 'admin'));

    if (adminId && !String(adminId).startsWith('usr_')) {
      superAdminAPI
        .deleteAdmin(adminId)
        .catch((err) => console.warn('[Backend] Delete admin sync warning:', err.message));
    }
  };

  // Admin & Super Admin: Profile Password Reset
  const changeAccountPassword = (currentPassword, newPassword) => {
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'admin') {
      throw new Error('Unauthorized: Password change is only for Administrator profiles.');
    }

    const curClean = (currentPassword || '').trim();
    const newClean = (newPassword || '').trim();

    if (!newClean || newClean.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    if (newClean === curClean) {
      throw new Error('New password must be different from current password.');
    }

    const isMatch =
      currentUser?.password === curClean ||
      (currentUser?.role === 'super_admin' && (!currentUser?.password || currentUser?.must_reset_password) && ['tempPassword123!', 'Super@Admin2026!'].includes(curClean)) ||
      (currentUser?.role === 'admin' && !currentUser?.password && !currentUser?.password_updated_at && curClean === 'admin123');

    // If local state didn't cache plaintext password (e.g., logged in via live server JWT), let server verify & update
    if (!isMatch && (!token || String(token).startsWith('token_'))) {
      throw new Error('Current password does not match.');
    }

    if (token && !String(token).startsWith('token_')) {
      authAPI
        .changePassword(curClean, newClean)
        .catch((err) => console.warn('[Backend] Password sync warning:', err.message));
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
    sessionStorage.removeItem('cp_auth_user');
    sessionStorage.removeItem('cp_auth_token');
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
