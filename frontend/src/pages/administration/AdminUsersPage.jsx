import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getUsersApi, createUserApi, getDepartmentsApi } from '../../api';

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">User & Role Administration</h4>
          <p className="text-muted text-sm mb-0">
            Manage organization members, assign roles, and configure department access.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
        >
          <i className="bi bi-person-plus"></i>
          <span>Add New Member</span>
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-custom mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Assigned Roles</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="fw-semibold text-dark">{u.full_name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {u.roles?.map((r, i) => (
                            <span
                              key={i}
                              className={`badge text-xs ${
                                r === 'ORG_ADMIN' || r === 'SYS_ADMIN'
                                  ? 'bg-danger-subtle text-danger'
                                  : r === 'AGENT' || r === 'LEAD'
                                  ? 'bg-primary-subtle text-primary'
                                  : 'bg-secondary-subtle text-secondary'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {u.is_active ? (
                          <span className="badge bg-success-subtle text-success">Active</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger">Deactivated</span>
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
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold">Add Organization User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Full Name</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Johnathan Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Email Address</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      placeholder="e.g. jvance@apex.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Initial Password</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="row g-3 mb-2">
                    <div className="col-sm-6">
                      <label className="form-label text-sm fw-semibold">Role</label>
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
                      <label className="form-label text-sm fw-semibold">Department</label>
                      <select
                        className="form-select"
                        value={deptId}
                        onChange={(e) => setDeptId(e.target.value)}
                      >
                        <option value="">None</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving ? 'Creating...' : 'Create Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
