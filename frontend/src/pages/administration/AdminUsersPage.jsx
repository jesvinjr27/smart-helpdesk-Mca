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
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-subtle transition-all focus:outline-none focus:ring-2 focus:ring-brand-accent/40 active:scale-[0.98]"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add Organization Member</span>
          </button>
        }
      />

      <div className="card-glow rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center">
              <i className="bi bi-people text-lg"></i>
            </div>
            <h2 className="text-base font-semibold text-brand-primary m-0">
              Registered Members
            </h2>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
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
                  <tr className="border-b border-brand-primary/10 bg-brand-secondary/15">
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Member
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Email Address
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Assigned Security Roles
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Account Status
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                      Joined Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-primary/10">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-brand-accent/15 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-brand-primary shadow-subtle flex-shrink-0">
                            {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-medium text-brand-primary text-sm block">
                              {u.full_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-brand-secondary text-sm">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles?.map((r, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide ${r === 'ORG_ADMIN' || r === 'SYS_ADMIN'
                                ? 'bg-brand-primary text-white border border-brand-primary'
                                : r === 'AGENT' || r === 'LEAD'
                                  ? 'bg-brand-secondary/25 text-brand-primary border border-brand-secondary/40'
                                  : 'bg-brand-accent/25 text-brand-primary border border-brand-accent/40'
                                }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-brand-secondary whitespace-nowrap">
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
              className="px-4 py-2 text-sm font-medium rounded-xl border border-brand-secondary/40 text-brand-primary bg-app-background hover:bg-brand-secondary/15 transition-colors"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCreateUser}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-subtle disabled:opacity-50"
            >
              {saving ? 'Creating Member...' : 'Create Member'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              placeholder="e.g. Jonathan Vance"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              placeholder="e.g. jvance@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Initial Password
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-sm rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="text-brand-secondary text-xs mt-1 block">
              Member will use this initial password on first sign-in.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                System Role
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Department
              </label>
              <select
                className="w-full px-3 py-2 text-sm rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
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
