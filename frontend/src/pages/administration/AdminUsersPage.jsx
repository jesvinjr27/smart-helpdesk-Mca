import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUsersApi, createUserApi, getDepartmentsApi } from '../../api';
import { PageHeader } from '../../components/common/PageHeader';
import { ModernModal } from '../../components/common/ModernModal';
import { TableSkeleton } from '../../components/common/LoadingSkeleton';

export const AdminUsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New User Modal
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [deptId, setDeptId] = useState('');
  const [roleName, setRoleName] = useState('REQUESTER');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uResp, dResp] = await Promise.all([
        getUsersApi(),
        getDepartmentsApi(),
      ]);
      setUsers(uResp.data);
      setDepartments(dResp.data);
      if (dResp.data.length > 0 && !deptId) {
        setDeptId(dResp.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createUserApi({
        org_id: user.org_id,
        email,
        full_name: fullName,
        password,
        department_id: deptId || undefined,
        role_names: [roleName],
        is_active: true,
      });
      setShowModal(false);
      setEmail('');
      setFullName('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Role Administration"
        subtitle="Manage organization members, configure department memberships, and assign security roles."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/20 active:scale-[0.98]"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add Organization Member</span>
          </button>
        }
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <i className="bi bi-people text-lg"></i>
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 m-0">
              Registered Members
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {users.length} Total Users
          </span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Member
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Email Address
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Assigned Security Roles
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Account Status
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Joined Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-sm flex-shrink-0">
                            {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-sm block">
                              {u.full_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-sm">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles?.map((r, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide ${
                                r === 'ORG_ADMIN' || r === 'SYS_ADMIN'
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                                  : r === 'AGENT' || r === 'LEAD'
                                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <ModernModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Organization Member"
        subtitle="Provision credentials and assign system access permissions."
        footer={
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCreateUser}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? 'Creating Member...' : 'Create Member'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              placeholder="e.g. Jonathan Vance"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              placeholder="e.g. jvance@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Initial Password
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-slate-500 dark:text-slate-400 text-xs mt-1 block">
              Member will use this initial password on first sign-in.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                System Role
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              >
                <option value="REQUESTER">Requester (Employee / Student)</option>
                <option value="AGENT">Support Agent</option>
                <option value="LEAD">Department Manager / Team Lead</option>
                <option value="ORG_ADMIN">Organization Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Department
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
              >
                <option value="">None / Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ModernModal>
    </div>
  );
};
