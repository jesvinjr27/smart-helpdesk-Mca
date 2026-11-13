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
    <div>
      <PageHeader
        title="User & Role Administration"
        subtitle="Manage organization members, configure department memberships, and assign security roles."
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add Organization Member</span>
          </button>
        }
      />

      <div className="card shadow-sm border-default">
        <div className="card-header py-3 d-flex align-items-center justify-content-between border-subtle">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-people text-primary fs-5"></i>
            <h6 className="fw-bold mb-0 text-primary-emphasis">Registered Members</h6>
          </div>
          <span className="badge bg-surface-subtle text-muted border border-default">
            {users.length} Total Users
          </span>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email Address</th>
                    <th>Assigned Security Roles</th>
                    <th>Account Status</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white text-xs fw-bold shadow-sm"
                            style={{
                              width: '32px',
                              height: '32px',
                              background: 'var(--primary-gradient)',
                            }}
                          >
                            {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="fw-semibold text-primary-emphasis text-sm d-block">
                              {u.full_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-secondary text-sm">{u.email}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {u.roles?.map((r, i) => (
                            <span
                              key={i}
                              className={`badge text-xs ${
                                r === 'ORG_ADMIN' || r === 'SYS_ADMIN'
                                  ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                  : r === 'AGENT' || r === 'LEAD'
                                  ? 'bg-primary-subtle text-primary border border-primary-border'
                                  : 'bg-secondary-subtle text-secondary border border-default'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {u.is_active ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            <span className="badge-dot bg-success me-1"></span>Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-muted border border-default">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="text-xs text-muted">
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
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCreateUser}
              className="btn btn-primary btn-sm px-3"
            >
              {saving ? 'Creating Member...' : 'Create Member'}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="e.g. Jonathan Vance"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            required
            className="form-control"
            placeholder="e.g. jvance@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Initial Password</label>
          <input
            type="text"
            required
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-muted text-xs mt-1 d-block">
            Member will use this initial password on first sign-in.
          </span>
        </div>

        <div className="row g-3 mb-2">
          <div className="col-sm-6">
            <label className="form-label">System Role</label>
            <select
              className="form-select"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            >
              <option value="REQUESTER">Requester (Employee / Student)</option>
              <option value="AGENT">Support Agent</option>
              <option value="LEAD">Department Manager / Team Lead</option>
              <option value="ORG_ADMIN">Organization Admin</option>
            </select>
          </div>

          <div className="col-sm-6">
            <label className="form-label">Department</label>
            <select
              className="form-select"
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
      </ModernModal>
    </div>
  );
};
