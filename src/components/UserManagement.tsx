import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { userService } from '../services/userService';
import { canViewModule, canEditModule } from '../services/permissionService';
import { 
  UserPlus, 
  Users, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Wrench, 
  ClipboardList, 
  UserSquare, 
  Calendar,
  Contact,
  Lock,
  ChevronRight,
  UserCheck2,
  Pencil
} from 'lucide-react';
import { logger } from '../utils/logger';
import { formatVNTime } from '../utils/time';

interface UserManagementProps {
  currentUser: User;
  onBack: () => void;
  onCurrentUserUpdate?: (user: User) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onBack, onCurrentUserUpdate }) => {
  const canView = canViewModule(currentUser.role, 'USER_MANAGEMENT');
  const canEdit = canEditModule(currentUser.role, 'USER_MANAGEMENT');
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [role, setRole] = useState<UserRole>('tro_ly_ky_thuat');
  const [isActive, setIsActive] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await userService.loadUsers();
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    setError(null);
    setSuccess(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setError('Tên đăng nhập không được trống.');
      return;
    }
    if (!editingUser && !password) {
      setError('Mật khẩu không được trống.');
      return;
    }
    if (!fullName.trim()) {
      setError('Họ và tên không được trống.');
      return;
    }

    if (!editingUser) {
      // Check if user already exists
      const duplicate = users.find(u => u.username.toLowerCase() === cleanUsername);
      if (duplicate) {
        setError(`Tài khoản "${cleanUsername}" đã tồn tại trên hệ thống.`);
        return;
      }
    }

    const targetUser: User = {
      uid: editingUser ? editingUser.uid : 'USR-' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      username: editingUser ? editingUser.username : cleanUsername,
      fullName: fullName.trim(),
      rank: rank.trim() || 'Hạ sĩ',
      unit: unit.trim() || 'Tiểu đoàn SCTH30',
      role,
      isActive,
      password: (editingUser && !password) ? editingUser.password : password,
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      createdBy: editingUser ? (editingUser.createdBy || 'unknown') : currentUser.username
    };

    if (editingUser && (editingUser.username === 'admin' || editingUser.uid === 'ADMIN-ID')) {
      if (!isActive) {
        setError('Không được phép vô hiệu hóa tài khoản quản trị hệ thống gốc (admin).');
        return;
      }
      if (targetUser.username !== 'admin') {
        setError('Không được phép thay đổi tên đăng nhập (username) của tài khoản quản trị hệ thống gốc (admin).');
        return;
      }
    }

    try {
      await userService.saveUser(targetUser);
      if (editingUser) {
        setSuccess(`Cập nhật thông tin tài khoản quân nhân "${fullName}" thành công.`);
        if (currentUser.username === targetUser.username && onCurrentUserUpdate) {
          onCurrentUserUpdate(targetUser);
        }
      } else {
        setSuccess(`Tạo tài khoản và cấp quyền cho quân nhân "${fullName}" thành công.`);
      }
      // Reset form
      setUsername('');
      setPassword('');
      setFullName('');
      setRank('');
      setUnit('');
      setRole('tro_ly_ky_thuat');
      setIsActive(true);
      setShowCreateForm(false);
      setEditingUser(null);
      
      // Refresh list
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi xử lý tài khoản.');
    }
  };

  const handleEditUserClick = (user: User) => {
    setError(null);
    setSuccess(null);
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setFullName(user.fullName);
    setRank(user.rank);
    setUnit(user.unit);
    setRole(user.role);
    setIsActive(user.isActive);
    setShowCreateForm(true);
  };

  const handleToggleStatus = async (userToToggle: User) => {
    if (!canEdit) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    if (userToToggle.username === 'admin') {
      setError("Không được phép vô hiệu hóa tài khoản quản trị hệ thống gốc (admin).");
      return;
    }

    if (userToToggle.username === currentUser.username) {
      logger.warn("Không được phép thao tác trên tài khoản của chính mình.");
      return;
    }

    const updatedUser: User = {
      ...userToToggle,
      isActive: !userToToggle.isActive
    };

    try {
      await userService.saveUser(updatedUser);
      setSuccess(`Đã thay đổi trạng thái hoạt động của tài khoản "${userToToggle.fullName}".`);
      await fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Fail to toggle user status:", err);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (!canEdit) {
      alert('Bạn chỉ có quyền xem dữ liệu.');
      return;
    }
    if (userToDelete.username === 'admin') {
      setError("Không được phép xóa tài khoản quản trị hệ thống gốc (admin).");
      return;
    }

    if (userToDelete.username === currentUser.username) {
      logger.warn("Bạn không thể xóa tài khoản của chính mình.");
      return;
    }

    if (!window.confirm(`Xác nhận xóa biên chế tài khoản "${userToDelete.fullName}" ra khỏi hệ thống quản lý?`)) {
      return;
    }

    try {
      await userService.deleteUser(userToDelete.username);
      setSuccess(`Xóa thành công tài khoản "${userToDelete.fullName}".`);
      await fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Fail to delete user:", err);
    }
  };

  const getRoleBadgeColor = (roleStr: UserRole) => {
    switch(roleStr) {
      case 'dai_doi_truong':
      case 'admin':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'pho_dai_doi_truong':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'trung_doi_truong':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'to_truong':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'kcs':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'tro_ly_ky_thuat':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-stone-50 text-stone-800 border-stone-200';
    }
  };

  const getRoleLabel = (roleStr: UserRole) => {
    switch(roleStr) {
      case 'dai_doi_truong':
        return 'Đại đội trưởng';
      case 'pho_dai_doi_truong':
        return 'Phó Đại đội trưởng';
      case 'trung_doi_truong':
        return 'Trung đội trưởng';
      case 'to_truong':
        return 'Tổ trưởng';
      case 'kcs':
        return 'Nhân viên KCS';
      case 'tro_ly_ky_thuat':
        return 'Trợ lý Kỹ thuật';
      case 'admin':
        return 'Quản trị hệ thống';
      default:
        return roleStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header with back command */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 ml-1 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-stone-900 font-sans tracking-tight">
              Quản lý cán bộ và phân quyền
            </h2>
            <p className="text-stone-500 text-xs mt-0.5">Quản lý tài khoản quân sự biên chế kiểm tra xe của Tiểu đoàn</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={onBack}
            className="flex-1 md:flex-initial py-2.5 px-1 sm:px-4 bg-stone-150 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition-all cursor-pointer text-center"
          >
            ← Quay lại trang chủ
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
                setEditingUser(null);
                setUsername('');
                setPassword('');
                setFullName('');
                setRank('');
                setUnit('');
                setRole('tro_ly_ky_thuat');
                setIsActive(true);
                setShowCreateForm(!showCreateForm);
              }}
              className="flex-1 md:flex-initial py-2.5 px-1 sm:px-4 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>{showCreateForm ? (editingUser ? 'Hủy sửa' : 'Hủy') : 'Thêm cán bộ mới'}</span>
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-xs font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-xs font-medium animate-fade-in flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Insert custom register form if clicked */}
      {showCreateForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-sm animate-fade-in space-y-5">
          <div className="border-b border-stone-150 pb-3 flex items-center gap-2">
            <UserSquare className="h-5 w-5 text-emerald-900" />
            <h3 className="font-bold text-stone-800 text-sm uppercase tracking-wide">
              {editingUser ? `Hiệu chỉnh thông tin cán bộ: ${editingUser.username}` : 'Đăng ký cán bộ quân sự mới'}
            </h3>
          </div>

          <form onSubmit={handleSubmitUser} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Tên đăng nhập (Username) *
              </label>
              <input
                type="text"
                required
                disabled={!!editingUser}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: tuấn.kt, minh.lh"
                className={`block w-full px-3.5 py-2.5 border border-stone-250 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none ${
                  editingUser ? 'bg-stone-200 cursor-not-allowed text-stone-500 font-semibold' : 'bg-stone-50'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Mật khẩu đăng nhập {editingUser ? '(Để trống để giữ nguyên)' : '*'}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? "Nhập mật khẩu mới hoặc để trống" : "Mật khẩu truy cập"}
                  className="block w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Họ và tên quân nhân *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Trần Minh Hoàng"
                className="block w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Cấp bậc quân hàm
              </label>
              <input
                type="text"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="Ví dụ: Thượng úy, Đại úy, Thiếu tá"
                className="block w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Đơn vị biên chế làm việc
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ví dụ: Đại đội sửa chữa 1, Tiểu đoàn 30"
                className="block w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider">
                Chức vụ
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-stone-800 text-xs focus:ring-1 focus:ring-emerald-800 focus:outline-none cursor-pointer"
              >
                <option value="dai_doi_truong">Đại đội trưởng</option>
                <option value="pho_dai_doi_truong">Phó Đại đội trưởng</option>
                <option value="trung_doi_truong">Trung đội trưởng</option>
                <option value="to_truong">Tổ trưởng</option>
                <option value="kcs">Nhân viên KCS</option>
                <option value="tro_ly_ky_thuat">Trợ lý Kỹ thuật</option>
                {role === 'admin' && <option value="admin">Quản trị hệ thống</option>}
              </select>
            </div>

            <div className={`md:col-span-2 flex items-center gap-3 py-1 px-1 sm:px-4 rounded-xl border ${
              editingUser?.username === 'admin' ? 'bg-stone-200 border-stone-250 text-stone-500 cursor-not-allowed' : 'bg-stone-50 border-stone-200'
            }`}>
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={isActive}
                disabled={editingUser?.username === 'admin'}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-emerald-800 focus:ring-emerald-800 border-stone-300 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
              <label htmlFor="isActiveCheckbox" className={`text-xs font-medium cursor-pointer selection:bg-transparent ${
                editingUser?.username === 'admin' ? 'text-stone-500 cursor-not-allowed' : 'text-stone-700'
              }`}>
                {editingUser?.username === 'admin' 
                  ? "Tài khoản quản trị gốc (admin) luôn ở chế độ kích hoạt hoạt động." 
                  : "Kích hoạt tài khoản làm việc ngay lập tức (Nếu bỏ chọn - Quân nhân sẽ không đăng nhập được)"}
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingUser(null);
                }}
                className="py-2.5 px-1 sm:px-4 bg-stone-150 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                {editingUser ? 'CẬP NHẬT THÔNG TIN' : 'CẤP QUYỀN TÀI KHOẢN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members Registry table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center gap-2 bg-stone-50/50">
          <Users className="h-4 w-4 text-emerald-950" />
          <h3 className="text-xs font-bold text-stone-800 uppercase tracking-widest">Danh sách biên chế cán bộ sử dụng hệ thống</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-7 w-7 text-emerald-800 mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-stone-500 text-xs mt-2 font-medium">Đang hệ thống lại danh bạ quân mạ...</p>
          </div>
        ) : (
          <div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                  <th className="py-2 sm:py-3 px-1 sm:px-4">Tên đăng nhập / Quân nhân</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-4">Đơn vị / Cấp bậc</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-4">Chức vụ</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-4">Trạng thái</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-4">Ngày tạo</th>
                  <th className="py-2 sm:py-3 px-1 sm:px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {users.map((user) => {
                  return (
                  <tr key={user.uid} className={`hover:bg-stone-50/70 transition-colors ${!user.isActive ? 'bg-stone-50/40 text-stone-400' : ''}`}>
                    <td className="py-2 sm:py-4 px-1 sm:px-4 font-sans">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>{user.username}</span>
                        {user.username === currentUser.username && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.25 rounded font-black max-w-sm">Tôi</span>
                        )}
                      </div>
                      <div className="text-stone-500 text-[11px] mt-0.5 flex items-center gap-1">
                        <Contact className="h-3 w-3 inline text-stone-400" />
                        <span>{user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2 sm:py-4 px-1 sm:px-4">
                      <div className="font-medium text-stone-800">{user.unit}</div>
                      <div className="text-stone-500 mt-0.5">{user.rank}</div>
                    </td>
                    <td className="py-2 sm:py-4 px-1 sm:px-4">
                      <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold border rounded-lg ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-2 sm:py-4 px-1 sm:px-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={!canEdit || user.username === currentUser.username || user.username === 'admin'}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                          user.isActive 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 cursor-pointer' 
                            : 'bg-red-50 text-red-800 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 cursor-pointer'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={user.username === 'admin' ? "Không được vô hiệu hóa tài khoản hệ thống gốc" : user.username === currentUser.username ? "Không được vô hiệu hóa chính mình" : !canEdit ? "Bạn không có quyền thực hiện" : "Click để thay đổi trạng thái hoạt động"}
                      >
                        {user.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-emerald-600" />
                            <span>Đăng kích hoạt</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span>Vô hiệu hóa</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2 sm:py-4 px-1 sm:px-4 text-stone-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{formatVNTime(user.createdAt) || "Không rõ"}</span>
                      </div>
                      <div className="text-[10px] mt-0.5 text-stone-400">Tạo bởi: {user.createdBy || 'hệ thống'}</div>
                    </td>
                    <td className="py-2 sm:py-4 px-1 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 align-middle">
                        {canEdit && (
                          <button
                            onClick={() => handleEditUserClick(user)}
                            className="p-2 bg-stone-100 hover:bg-amber-50 border border-stone-200 text-amber-800 rounded-lg transition-all cursor-pointer"
                            title="Sửa thông tin quân nhân"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={!canEdit || user.username === currentUser.username || user.username === 'admin'}
                          className="p-2 bg-stone-100 hover:bg-red-100 border border-stone-200 text-stone-600 hover:text-red-600 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-stone-100 disabled:hover:text-stone-600 disabled:cursor-not-allowed cursor-pointer"
                          title={user.username === 'admin' ? "Không được xóa tài khoản hệ thống gốc" : !canEdit ? "Bạn không có quyền thực hiện" : "Xóa vĩnh viễn cán bộ"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
