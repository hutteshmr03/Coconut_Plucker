import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, superAdminAPI } from '../services/api';
import { getDisplayName } from '../utils/helpers';

export { getDisplayName };

const AuthContext = createContext();

// Singleton Super Admin Account (Profile reference only; credentials authenticated server-side)
const SUPER_ADMIN_USER = {
  id: 'usr_super_admin',
  username: 'superadmin',
  email: 'superadmin@coconutplucker.com',
  full_name: 'Chief Platform Admin',
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
  // In-memory account list hydrated from backend for admin/super-admin views (no PII or credentials in localStorage)
  const [registeredUsers, setRegisteredUsers] = useState(DEFAULT_USERS);

  // Tab-isolated sessionStorage only (never persist tokens or personal data in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      localStorage.removeItem('cp_auth_user');
      localStorage.removeItem('cp_auth_token');
      localStorage.removeItem('cp_registered_users_v6');
      localStorage.removeItem('cp_razorpay_key_id');
      const saved = sessionStorage.getItem('cp_auth_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      if (parsed?.role === 'super_admin' && parsed?.full_name === 'Chief Platform Administrator') {
        parsed.full_name = 'Chief Platform Admin';
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('cp_auth_token') || null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem('cp_auth_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('cp_auth_user');
      }
    } catch (e) {
      console.warn('Could not save current user to sessionStorage:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (token) {
        sessionStorage.setItem('cp_auth_token', token);
      } else {
        sessionStorage.removeItem('cp_auth_token');
      }
    } catch (e) {
      console.warn('Could not save auth token to sessionStorage:', e);
    }
  }, [token]);

  // Sync Super Admin's adminAccounts list from live MySQL backend
  useEffect(() => {
    if (currentUser?.role === 'super_admin' && token) {
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

  const login = (user, authToken = null) => {
    try {
      sessionStorage.setItem('cp_auth_user', JSON.stringify(user));
      if (authToken) {
        sessionStorage.setItem('cp_auth_token', authToken);
      }
    } catch (e) {
      console.warn('Could not persist login session:', e);
    }
    setCurrentUser(user);
    if (authToken) {
      setToken(authToken);
    }
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
    // Hard constraint: Cannot register or create Admin / Super Admin through client UI
    if (newUserData.role === 'super_admin' || newUserData.role === 'admin') {
      throw new Error('Administrator accounts cannot be created via public registration.');
    }

    const backendRes = await authAPI.register(newUserData);
    if (!backendRes?.user || !backendRes?.access_token) {
      throw new Error('Registration did not return a valid server session.');
    }
    const user = backendRes.user;
    setRegisteredUsers((prev) => [...prev, user]);
    login(user, backendRes.access_token);
    return user;
  };

  const updateCurrentUser = (updates) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updatedUserObj = { ...prev, ...updates };
      try {
        sessionStorage.setItem('cp_auth_user', JSON.stringify(updatedUserObj));
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

      return prev.map((u) => {
        const uPhone = u.phone ? u.phone.replace(/\D/g, '') : '';
        const uUsername = u.username ? u.username.toLowerCase() : '';
        const isMatch = (targetId && u.id === targetId) ||
                        (targetPhone && uPhone && targetPhone === uPhone) ||
                        (targetUsername && uUsername && targetUsername === uUsername);
        return isMatch ? { ...u, ...updates } : u;
      });
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
    const passwordClean = (adminData.password || '').trim();

    if (!passwordClean || passwordClean.length < 6) {
      throw new Error('An initial password of at least 6 characters is required.');
    }

    const exists = registeredUsers.find(
      (u) => (u.phone && u.phone.replace(/\D/g, '') === phoneClean) ||
             (u.username && usernameClean && u.username.toLowerCase() === usernameClean)
    );

    if (exists) {
      throw new Error(`An account with this phone number or User ID (${exists.phone || exists.username}) already exists.`);
    }

    const created = await superAdminAPI.createAdmin({
      full_name: adminData.full_name.trim(),
      phone: phoneClean,
      username: usernameClean || phoneClean,
      taluka: adminData.taluka || 'All Talukas',
      password: passwordClean
    });

    const createdAdmin = {
      id: created?.id || ('usr_adm_' + Date.now().toString(36)),
      username: usernameClean || phoneClean,
      full_name: created?.full_name || adminData.full_name.trim(),
      phone: created?.phone || phoneClean,
      role: 'admin',
      taluka: created?.taluka || adminData.taluka || 'All Talukas',
      status: created?.status || 'active',
      created_at: created?.created_at || new Date().toISOString()
    };

    setRegisteredUsers((prev) => [...prev, createdAdmin]);
    return createdAdmin;
  };

  // Admin & Super Admin: Onboard / Provision Professional Climber Account
  const createProfessionalAccount = (proData) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Platform Administrators can create professional accounts.');
    }

    const phoneClean = (proData.phone || '').replace(/\D/g, '');
    if (phoneClean.length !== 10) {
      throw new Error('Mobile phone number must be exactly 10 digits.');
    }
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
      safety_cert: proData.safety_cert?.trim() || '',
      insurance_cover: Boolean(proData.insurance_cover),
      insurance_cover_img: proData.insurance_cover ? (proData.insurance_cover_img || null) : null,
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

  const deleteProfessionalAccount = (proId, proPhone) => {
    const cleanPhone = proPhone ? String(proPhone).replace(/\D/g, '') : '';
    setRegisteredUsers((prev) =>
      prev.filter((u) => {
        if (u.role !== 'professional') return true;
        if (proId && u.id === proId) return false;
        if (cleanPhone && u.phone && u.phone.replace(/\D/g, '') === cleanPhone) return false;
        return true;
      })
    );
  };

  // Admin & Super Admin: Profile Password Reset (verified strictly server-side)
  const changeAccountPassword = async (currentPassword, newPassword) => {
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

    await authAPI.changePassword(curClean, newClean);

    updateCurrentUser({
      must_reset_password: false,
      password_updated_at: new Date().toISOString()
    });
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
    localStorage.removeItem('cp_registered_users_v6');
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
        deleteProfessionalAccount,
        changeSuperAdminPassword,
        changeAccountPassword,
        logout,
        SUPER_ADMIN_USER,
        ADMIN_USER
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
