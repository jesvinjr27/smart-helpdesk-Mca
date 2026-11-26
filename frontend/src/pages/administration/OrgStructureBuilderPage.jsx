import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  getOrgTreeApi,
  getOrgUnitTypesApi,
  createOrgUnitTypeApi,
  getPositionsApi,
  createPositionApi,
  getOrgUnitsApi,
  createOrgUnitApi,
  updateOrgUnitApi,
  moveOrgUnitApi,
  deactivateOrgUnitApi,
  assignUnitMemberApi,
  removeUnitMemberApi,
  getUsersApi,
} from '../../api';
import { PageHeader } from '../../components/common/PageHeader';
import { ModernModal } from '../../components/common/ModernModal';

export const OrgStructureBuilderPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [treeData, setTreeData] = useState([]);
  const [flatUnits, setFlatUnits] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tree UI state
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [modalMode, setModalMode] = useState(null); // 'create_unit' | 'edit_unit' | 'move_unit' | 'assign_member' | 'manage_types' | 'delete_confirm'
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit_type_id: '',
    parent_id: '',
    description: '',
    email: '',
  });
  const [unitErrors, setUnitErrors] = useState({});
  const [unitTouched, setUnitTouched] = useState({});

  const validateUnitField = (name, value) => {
    const val = typeof value === 'string' ? value.trim() : value;
    switch (name) {
      case 'name':
        if (!val) return 'Unit name is required.';
        if (val.length < 2) return 'Unit name must be at least 2 characters.';
        if (val.length > 100) return 'Unit name cannot exceed 100 characters.';
        return null;

      case 'code':
        if (!val) return 'Unit code is required.';
        if (val.length < 2) return 'Unit code must be at least 2 characters.';
        if (val.length > 30) return 'Unit code cannot exceed 30 characters.';
        if (!/^[A-Z0-9_\-]+$/.test(val.toUpperCase())) {
          return 'Code can only contain letters, numbers, hyphens, and underscores.';
        }
        return null;

      case 'email':
        if (!val) return null;
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) {
          return 'Enter a valid contact email address (e.g. dept@organization.com).';
        }
        return null;

      case 'description':
        if (!val) return null;
        if (val.length > 500) return 'Description cannot exceed 500 characters.';
        return null;

      default:
        return null;
    }
  };

  const [moveParentId, setMoveParentId] = useState('');

  const [memberForm, setMemberForm] = useState({
    user_id: '',
    position_id: '',
    is_lead: false,
    is_primary: true,
  });

  const [newTypeForm, setNewTypeForm] = useState({
    name: '',
    code: '',
    icon: 'bi-diagram-3',
    level_hint: 1,
  });

  const [newPosForm, setNewPosForm] = useState({
    title: '',
    description: '',
  });

  // Load all initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, typesRes, posRes, unitsRes, usersRes] = await Promise.all([
        getOrgTreeApi(true),
        getOrgUnitTypesApi(),
        getPositionsApi(),
        getOrgUnitsApi({ active_only: true }),
        getUsersApi({ limit: 100 }),
      ]);

      const tree = treeRes.data || [];
      setTreeData(tree);
      setUnitTypes(typesRes.data || []);
      setPositions(posRes.data || []);
      setFlatUnits(unitsRes.data || []);
      setOrgUsers(usersRes.data || []);

      // Auto-expand root level nodes by default
      const initialExpanded = new Set();
      tree.forEach((node) => initialExpanded.add(node.id));
      setExpandedNodes(initialExpanded);

      // Select first node if nothing currently selected
      if (!selectedUnit && tree.length > 0) {
        setSelectedUnit(tree[0]);
      } else if (selectedUnit) {
        // Keep selected unit synchronized
        const findNode = (nodes) => {
          for (const n of nodes) {
            if (n.id === selectedUnit.id) return n;
            if (n.children && n.children.length > 0) {
              const found = findNode(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        const updated = findNode(tree);
        if (updated) setSelectedUnit(updated);
      }
    } catch (err) {
      console.error('Failed to load organization structure data:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to load organizational structure.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedUnit]);

  useEffect(() => {
    loadData();
  }, []);

  // Toggle node expansion
  const toggleNode = (nodeId, e) => {
    e?.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set();
    const collect = (nodes) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        if (n.children && n.children.length > 0) collect(n.children);
      });
    };
    collect(treeData);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    const q = searchQuery.toLowerCase().trim();

    const matches = (node) =>
      node.name.toLowerCase().includes(q) ||
      node.code.toLowerCase().includes(q) ||
      (node.unit_type_name && node.unit_type_name.toLowerCase().includes(q));

    const filterNodes = (nodes) => {
      return nodes
        .map((node) => {
          const hasMatchingChildren = node.children && node.children.length > 0;
          const filteredChildren = hasMatchingChildren ? filterNodes(node.children) : [];
          if (matches(node) || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
          return null;
        })
        .filter(Boolean);
    };

    return filterNodes(treeData);
  }, [treeData, searchQuery]);

  // Handler: Open Create Unit Modal
  const handleOpenCreateModal = (parentUnit = null) => {
    setFormData({
      name: '',
      code: '',
      unit_type_id: unitTypes[0]?.id || '',
      parent_id: parentUnit ? parentUnit.id : '',
      description: '',
      email: '',
    });
    setUnitErrors({});
    setUnitTouched({});
    setModalMode('create_unit');
  };

  // Handler: Open Edit Unit Modal
  const handleOpenEditModal = (unit) => {
    setFormData({
      name: unit.name,
      code: unit.code,
      unit_type_id: unit.unit_type_id,
      parent_id: unit.parent_id || '',
      description: unit.description || '',
      email: unit.email || '',
    });
    setUnitErrors({});
    setUnitTouched({});
    setModalMode('edit_unit');
  };

  const handleUnitInputChange = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (unitTouched[name]) {
        setUnitErrors((prevErrs) => ({
          ...prevErrs,
          [name]: validateUnitField(name, value),
        }));
      }
      return next;
    });
  };

  const handleUnitInputBlur = (name) => {
    setUnitTouched((prev) => ({ ...prev, [name]: true }));
    setUnitErrors((prev) => ({
      ...prev,
      [name]: validateUnitField(name, formData[name]),
    }));
  };

  // Handler: Open Move Unit Modal
  const handleOpenMoveModal = (unit) => {
    setMoveParentId(unit.parent_id || '');
    setModalMode('move_unit');
  };

  // Handler: Open Assign Member Modal
  const handleOpenAssignMemberModal = () => {
    setMemberForm({
      user_id: orgUsers[0]?.id || '',
      position_id: positions[0]?.id || '',
      is_lead: false,
      is_primary: true,
    });
    setModalMode('assign_member');
  };

  // Submit Unit Create / Edit
  const handleSubmitUnit = async (e) => {
    e.preventDefault();
    const errs = {
      name: validateUnitField('name', formData.name),
      code: validateUnitField('code', formData.code),
      email: validateUnitField('email', formData.email),
      description: validateUnitField('description', formData.description),
    };
    const activeErrors = Object.fromEntries(Object.entries(errs).filter(([_, v]) => Boolean(v)));
    setUnitTouched({ name: true, code: true, email: true, description: true });
    setUnitErrors(activeErrors);

    if (Object.keys(activeErrors).length > 0) {
      addToast({ message: 'Please correct the highlighted form errors before proceeding.', type: 'error' });
      return;
    }
    if (!formData.unit_type_id) {
      addToast({ message: 'Please select a unit type.', type: 'error' });
      return;
    }

    setModalSubmitting(true);
    try {
      if (modalMode === 'create_unit') {
        const payload = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          unit_type_id: formData.unit_type_id,
          parent_id: formData.parent_id || null,
          description: formData.description.trim() || null,
          email: formData.email.trim() || null,
        };
        const resp = await createOrgUnitApi(payload);
        addToast({ message: `Unit '${resp.data.name}' created successfully!`, type: 'success' });
        setSelectedUnit(resp.data);
      } else {
        const payload = {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          unit_type_id: formData.unit_type_id,
          description: formData.description.trim() || null,
          email: formData.email.trim() || null,
        };
        const resp = await updateOrgUnitApi(selectedUnit.id, payload);
        addToast({ message: `Unit '${resp.data.name}' updated successfully!`, type: 'success' });
        setSelectedUnit(resp.data);
      }
      setModalMode(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save unit:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to save organizational unit.',
        type: 'error',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit Move Unit (Reparenting)
  const handleSubmitMove = async (e) => {
    e.preventDefault();
    if (moveParentId === selectedUnit.id) {
      addToast({ message: 'A unit cannot be its own parent.', type: 'error' });
      return;
    }

    setModalSubmitting(true);
    try {
      const resp = await moveOrgUnitApi(selectedUnit.id, {
        new_parent_id: moveParentId || null,
      });
      addToast({ message: `Unit '${resp.data.name}' moved successfully!`, type: 'success' });
      setSelectedUnit(resp.data);
      setModalMode(null);
      await loadData();
    } catch (err) {
      console.error('Failed to move unit:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to move organizational unit.',
        type: 'error',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit Deactivate Unit
  const handleConfirmDeactivate = async () => {
    setModalSubmitting(true);
    try {
      await deactivateOrgUnitApi(selectedUnit.id);
      addToast({
        message: `Unit '${selectedUnit.name}' and its subtree deactivated.`,
        type: 'success',
      });
      setSelectedUnit(null);
      setModalMode(null);
      await loadData();
    } catch (err) {
      console.error('Failed to deactivate unit:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to deactivate organizational unit.',
        type: 'error',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit Assign Member
  const handleSubmitAssignMember = async (e) => {
    e.preventDefault();
    if (!memberForm.user_id) {
      addToast({ message: 'Please select a user to assign.', type: 'error' });
      return;
    }

    setModalSubmitting(true);
    try {
      const resp = await assignUnitMemberApi(selectedUnit.id, {
        user_id: memberForm.user_id,
        position_id: memberForm.position_id || null,
        is_lead: Boolean(memberForm.is_lead),
        is_primary: Boolean(memberForm.is_primary),
      });
      addToast({ message: 'Member assigned successfully!', type: 'success' });
      setSelectedUnit(resp.data);
      setModalMode(null);
      await loadData();
    } catch (err) {
      console.error('Failed to assign member:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to assign member to unit.',
        type: 'error',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this organizational unit?`)) return;
    try {
      await removeUnitMemberApi(selectedUnit.id, userId);
      addToast({ message: `${memberName} removed from unit.`, type: 'success' });
      // Refresh unit details
      setSelectedUnit((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.user_id !== userId),
        member_count: Math.max(0, prev.member_count - 1),
      }));
      await loadData();
    } catch (err) {
      console.error('Failed to remove member:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to remove member.',
        type: 'error',
      });
    }
  };

  // Submit Custom Unit Type
  const handleCreateUnitType = async (e) => {
    e.preventDefault();
    if (!newTypeForm.name.trim() || !newTypeForm.code.trim()) {
      addToast({ message: 'Type name and code are required.', type: 'error' });
      return;
    }
    setModalSubmitting(true);
    try {
      const resp = await createOrgUnitTypeApi({
        name: newTypeForm.name.trim(),
        code: newTypeForm.code.trim().toUpperCase(),
        icon: newTypeForm.icon || 'bi-diagram-3',
        level_hint: Number(newTypeForm.level_hint) || 1,
      });
      addToast({ message: `Unit Type '${resp.data.name}' created!`, type: 'success' });
      setNewTypeForm({ name: '', code: '', icon: 'bi-diagram-3', level_hint: 1 });
      const typesRes = await getOrgUnitTypesApi();
      setUnitTypes(typesRes.data || []);
    } catch (err) {
      console.error('Failed to create unit type:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to create unit type.',
        type: 'error',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Submit New Position
  const handleCreatePosition = async (e) => {
    e.preventDefault();
    if (!newPosForm.title.trim()) {
      addToast({ message: 'Position title is required.', type: 'error' });
      return;
    }
    setModalSubmitting(true);
    try {
      const resp = await createPositionApi({
        title: newPosForm.title.trim(),
        description: newPosForm.description.trim() || null,
      });
      addToast({ message: `Position '${resp.data.title}' created!`, type: 'success' });
      setNewPosForm({ title: '', description: '' });
      const posRes = await getPositionsApi();
      setPositions(posRes.data || []);
    } catch (err) {
      console.error('Failed to create position:', err);
      addToast({
        message: err.response?.data?.detail || 'Failed to create position.',
        type: 'error',
      });
    } finally {
      setModalSubmitting(false);
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedUnit?.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => setSelectedUnit(node)}
          className={`group flex items-center justify-between py-2 px-3 my-0.5 rounded-xl cursor-pointer transition-all border ${
            isSelected
              ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
              : 'hover:bg-brand-secondary/15 text-slate-800 border-transparent'
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 22 + 12)}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleNode(node.id, e)}
                className={`w-6 h-6 rounded flex items-center justify-center transition-transform ${
                  isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-brand-secondary/20 text-brand-primary'
                }`}
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              >
                <i
                  className={`bi bi-chevron-right text-xs transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="w-6 h-6 flex items-center justify-center text-slate-400">
                <i className="bi bi-dot text-lg" />
              </span>
            )}

            {/* Unit Type Icon */}
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 ${
                isSelected
                  ? 'bg-white/20 text-brand-accent'
                  : 'bg-brand-primary/10 text-brand-primary'
              }`}
            >
              <i className={`bi ${node.unit_type_icon || 'bi-diagram-3'}`} />
            </span>

            {/* Unit Name and Code */}
            <div className="truncate min-w-0">
              <span className="font-semibold text-sm truncate block">{node.name}</span>
              <span
                className={`text-[11px] font-mono tracking-tight ${
                  isSelected ? 'text-brand-accent' : 'text-slate-500'
                }`}
              >
                {node.code}
              </span>
            </div>
          </div>

          {/* Badges & Quick Action */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-brand-secondary/20 text-brand-primary'
              }`}
            >
              {node.unit_type_name}
            </span>

            <span
              className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isSelected
                  ? 'bg-brand-accent text-brand-primary font-bold'
                  : 'bg-slate-100 text-slate-600'
              }`}
              title={`${node.member_count} members`}
            >
              <i className="bi bi-people-fill text-[10px]" />
              {node.member_count}
            </span>
          </div>
        </div>

        {/* Render Children Recursively */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col border-l border-brand-primary/15 ml-4">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Organization Structure Builder"
        subtitle="Design and configure your dynamic organizational hierarchy, custom unit types, departments, teams, and member positions."
        breadcrumbs={[
          { label: 'Admin', link: '/admin/users' },
          { label: 'Organization Structure' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCreateModal(null)}
              className="flex items-center gap-2 px-3.5 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 shadow-sm transition-all"
            >
              <i className="bi bi-plus-lg" />
              <span>Add Root Unit</span>
            </button>
            <button
              type="button"
              onClick={() => setModalMode('manage_types')}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-brand-primary/20 text-brand-primary rounded-xl text-sm font-medium hover:bg-brand-secondary/10 transition-all shadow-xs"
            >
              <i className="bi bi-gear" />
              <span>Unit Types & Positions</span>
            </button>
          </div>
        }
      />

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Tree View (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 border border-brand-primary/10 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 min-w-[200px]">
              <i className="bi bi-search absolute left-3 top-2.5 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="Search units by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-sm"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Tree Display Area */}
          <div className="min-h-[400px] max-h-[650px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                <div className="w-8 h-8 border-3 border-brand-secondary/30 border-t-brand-primary rounded-full animate-spin" />
                <span className="text-sm font-medium">Building organizational hierarchy...</span>
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2 border-2 border-dashed border-slate-200 rounded-xl">
                <i className="bi bi-diagram-3 text-3xl text-slate-300" />
                <span className="text-sm font-medium">
                  {searchQuery ? 'No matching organizational units found.' : 'No units configured yet.'}
                </span>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal(null)}
                    className="mt-2 text-xs font-semibold text-brand-primary hover:underline"
                  >
                    + Create your first unit
                  </button>
                )}
              </div>
            ) : (
              filteredTree.map((node) => renderTreeNode(node, 0))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Total Units: <strong className="text-slate-700">{flatUnits.length}</strong>
            </span>
            <span>
              Hierarchy Types: <strong className="text-slate-700">{unitTypes.length}</strong>
            </span>
          </div>
        </div>

        {/* Right Column: Unit Details & Member Management (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-brand-primary/10 shadow-sm space-y-5">
          {selectedUnit ? (
            <>
              {/* Unit Header Card */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center text-lg flex-shrink-0">
                      <i className={`bi ${selectedUnit.unit_type_icon || 'bi-diagram-3'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-brand-primary">{selectedUnit.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {selectedUnit.code}
                        </span>
                        <span className="text-xs font-semibold text-brand-primary bg-brand-secondary/20 px-2 py-0.5 rounded-full">
                          {selectedUnit.unit_type_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      selectedUnit.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {selectedUnit.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {selectedUnit.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedUnit.description}</p>
                )}

                {selectedUnit.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <i className="bi bi-envelope text-slate-400" />
                    <a href={`mailto:${selectedUnit.email}`} className="hover:underline text-brand-primary">
                      {selectedUnit.email}
                    </a>
                  </div>
                )}

                {/* Hierarchy Path */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <i className="bi bi-bezier2 text-brand-primary" />
                    <span>Hierarchy Path:</span>
                  </div>
                  <div className="font-mono text-slate-500 break-all">{selectedUnit.hierarchy_path || 'Root Level'}</div>
                </div>

                {/* Unit Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal(selectedUnit)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary/90 transition-all shadow-xs"
                  >
                    <i className="bi bi-plus-circle" />
                    <span>Add Child Unit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedUnit)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-all"
                  >
                    <i className="bi bi-pencil" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenMoveModal(selectedUnit)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-secondary/20 text-brand-primary text-xs font-semibold rounded-lg hover:bg-brand-secondary/30 transition-all"
                  >
                    <i className="bi bi-arrows-move" />
                    <span>Move / Reparent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('delete_confirm')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-all ml-auto"
                  >
                    <i className="bi bi-trash" />
                    <span>Deactivate</span>
                  </button>
                </div>
              </div>

              {/* Members Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-brand-primary flex items-center gap-2">
                      <span>Assigned Members</span>
                      <span className="text-xs px-2 py-0.5 bg-brand-primary/10 rounded-full font-bold">
                        {selectedUnit.members?.length || 0}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Users assigned to this unit with designations and lead roles.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAssignMemberModal}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-brand-secondary/20 hover:bg-brand-secondary/30 text-brand-primary text-xs font-semibold rounded-lg transition-all"
                  >
                    <i className="bi bi-person-plus-fill" />
                    <span>Assign Member</span>
                  </button>
                </div>

                {/* Members List */}
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {!selectedUnit.members || selectedUnit.members.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      No members assigned to this unit yet.
                    </div>
                  ) : (
                    selectedUnit.members.map((m) => (
                      <div
                        key={m.membership_id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {m.avatar_url ? (
                            <img
                              src={m.avatar_url}
                              alt={m.full_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-secondary text-brand-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {m.full_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className="truncate min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-slate-800 truncate">
                                {m.full_name}
                              </span>
                              {m.is_lead && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5"
                                  title="Unit Lead / Head"
                                >
                                  <i className="bi bi-star-fill text-[9px]" /> Lead
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {m.position_title || 'Member'} • {m.email}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.user_id, m.full_name)}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors ml-2"
                          title="Remove from unit"
                        >
                          <i className="bi bi-x-lg text-xs" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-center text-slate-400 gap-3">
              <i className="bi bi-cursor text-3xl text-slate-300" />
              <div>
                <p className="font-semibold text-sm text-slate-600">No Unit Selected</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any organizational unit from the hierarchy tree to inspect its members and details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create or Edit Unit */}
      <ModernModal
        isOpen={modalMode === 'create_unit' || modalMode === 'edit_unit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create_unit' ? 'Create Organizational Unit' : 'Edit Organizational Unit'}
        subtitle={
          modalMode === 'create_unit'
            ? 'Define a new department, faculty, division, team, or custom structural unit.'
            : `Update configuration for '${selectedUnit?.name}'.`
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="unit-form"
              disabled={modalSubmitting}
              className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {modalSubmitting ? 'Saving...' : modalMode === 'create_unit' ? 'Create Unit' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <form id="unit-form" onSubmit={handleSubmitUnit} className="space-y-4 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Unit Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Information Technology"
                value={formData.name}
                onChange={(e) => handleUnitInputChange('name', e.target.value)}
                onBlur={() => handleUnitInputBlur('name')}
                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none transition-all ${
                  unitErrors.name && unitTouched.name
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : !unitErrors.name && unitTouched.name && formData.name
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : 'border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                }`}
              />
              {unitErrors.name && unitTouched.name && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[10px]" />
                  <span>{unitErrors.name}</span>
                </p>
              )}
            </div>

            {/* Unit Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. IT-OPS"
                value={formData.code}
                onChange={(e) => handleUnitInputChange('code', e.target.value.toUpperCase())}
                onBlur={() => handleUnitInputBlur('code')}
                className={`w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase focus:outline-none transition-all ${
                  unitErrors.code && unitTouched.code
                    ? 'border-rose-400 ring-2 ring-rose-200'
                    : !unitErrors.code && unitTouched.code && formData.code
                    ? 'border-emerald-400 ring-1 ring-emerald-200'
                    : 'border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
                }`}
              />
              {unitErrors.code && unitTouched.code && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <i className="bi bi-exclamation-circle-fill text-[10px]" />
                  <span>{unitErrors.code}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.unit_type_id}
                onChange={(e) => handleUnitInputChange('unit_type_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
              >
                {unitTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {modalMode === 'create_unit' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Unit</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => handleUnitInputChange('parent_id', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
                >
                  <option value="">None (Root Level)</option>
                  {flatUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              placeholder="e.g. it-support@organization.com"
              value={formData.email}
              onChange={(e) => handleUnitInputChange('email', e.target.value)}
              onBlur={() => handleUnitInputBlur('email')}
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none transition-all ${
                unitErrors.email && unitTouched.email
                  ? 'border-rose-400 ring-2 ring-rose-200'
                  : !unitErrors.email && unitTouched.email && formData.email
                  ? 'border-emerald-400 ring-1 ring-emerald-200'
                  : 'border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
              }`}
            />
            {unitErrors.email && unitTouched.email && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle-fill text-[10px]" />
                <span>{unitErrors.email}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Description</label>
              <span className="text-[10px] text-slate-400 font-mono">
                {(formData.description || '').length}/500
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="Brief description of responsibilities or academic programme scope..."
              value={formData.description}
              onChange={(e) => handleUnitInputChange('description', e.target.value)}
              onBlur={() => handleUnitInputBlur('description')}
              className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none transition-all resize-none ${
                unitErrors.description && unitTouched.description
                  ? 'border-rose-400 ring-2 ring-rose-200'
                  : 'border-slate-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'
              }`}
            />
            {unitErrors.description && unitTouched.description && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <i className="bi bi-exclamation-circle-fill text-[10px]" />
                <span>{unitErrors.description}</span>
              </p>
            )}
          </div>
        </form>
      </ModernModal>

      {/* MODAL 2: Move Unit (Reparenting) */}
      <ModernModal
        isOpen={modalMode === 'move_unit'}
        onClose={() => setModalMode(null)}
        title="Move Organizational Unit"
        subtitle={`Reparent '${selectedUnit?.name}' to a new parent in the hierarchy.`}
        size="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="move-form"
              disabled={modalSubmitting}
              className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {modalSubmitting ? 'Reparenting...' : 'Move Unit'}
            </button>
          </div>
        }
      >
        <form id="move-form" onSubmit={handleSubmitMove} className="space-y-4 p-1">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <i className="bi bi-shield-exclamation text-amber-600" />
              <span>Hierarchy Integrity Protection:</span>
            </div>
            <p>
              Moving a unit automatically updates its hierarchy path and all its child sub-trees. Circular loops
              (moving into self or any descendant) are strictly prohibited.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Parent Unit</label>
            <select
              value={moveParentId}
              onChange={(e) => setMoveParentId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
            >
              <option value="">Move to Root Level (No Parent)</option>
              {flatUnits
                .filter((u) => u.id !== selectedUnit?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code}) • {u.unit_type_name}
                  </option>
                ))}
            </select>
          </div>
        </form>
      </ModernModal>

      {/* MODAL 3: Assign Member */}
      <ModernModal
        isOpen={modalMode === 'assign_member'}
        onClose={() => setModalMode(null)}
        title="Assign Member to Unit"
        subtitle={`Assign a user to '${selectedUnit?.name}' with a designated position.`}
        size="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="member-form"
              disabled={modalSubmitting}
              className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {modalSubmitting ? 'Assigning...' : 'Assign Member'}
            </button>
          </div>
        }
      >
        <form id="member-form" onSubmit={handleSubmitAssignMember} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select User <span className="text-rose-500">*</span>
            </label>
            <select
              value={memberForm.user_id}
              onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
            >
              {orgUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Position / Designation</label>
            <select
              value={memberForm.position_id}
              onChange={(e) => setMemberForm({ ...memberForm, position_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
            >
              <option value="">None / Standard Member</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={memberForm.is_lead}
                onChange={(e) => setMemberForm({ ...memberForm, is_lead: e.target.checked })}
                className="w-4 h-4 rounded text-brand-primary border-slate-300 focus:ring-brand-primary"
              />
              <span>Unit Lead / Department Head (Highlighted in tree)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={memberForm.is_primary}
                onChange={(e) => setMemberForm({ ...memberForm, is_primary: e.target.checked })}
                className="w-4 h-4 rounded text-brand-primary border-slate-300 focus:ring-brand-primary"
              />
              <span>Set as user's primary organizational unit</span>
            </label>
          </div>
        </form>
      </ModernModal>

      {/* MODAL 4: Manage Unit Types & Positions */}
      <ModernModal
        isOpen={modalMode === 'manage_types'}
        onClose={() => setModalMode(null)}
        title="Unit Types & Positions"
        subtitle="Configure custom organizational levels (e.g. Division, Faculty, Lab) and designations."
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setModalMode(null)}
            className="px-5 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90"
          >
            Done
          </button>
        }
      >
        <div className="space-y-6 p-1">
          {/* Section A: Unit Types */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-brand-primary flex items-center justify-between">
              <span>Configured Unit Types</span>
              <span className="text-xs font-normal text-slate-500">{unitTypes.length} types registered</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {unitTypes.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs">
                    <i className={`bi ${t.icon || 'bi-diagram-3'}`} />
                  </span>
                  <div className="truncate">
                    <span className="font-semibold text-xs text-slate-800 block truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{t.code}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add Type Form */}
            <form onSubmit={handleCreateUnitType} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Add Custom Unit Type</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type Name (e.g. Lab)"
                  value={newTypeForm.name}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, name: e.target.value })}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Code (e.g. LAB)"
                  value={newTypeForm.code}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, code: e.target.value })}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase bg-white"
                />
                <select
                  value={newTypeForm.icon}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, icon: e.target.value })}
                  className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                >
                  <option value="bi-diagram-3">Diagram (Default)</option>
                  <option value="bi-building">Building</option>
                  <option value="bi-mortarboard">Mortarboard / Faculty</option>
                  <option value="bi-people">People / Team</option>
                  <option value="bi-cpu">CPU / Lab</option>
                  <option value="bi-lightning">Lightning / Squad</option>
                  <option value="bi-journal-bookmark">Bookmark / Programme</option>
                </select>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary/90"
                >
                  + Add Type
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Positions */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-sm text-brand-primary flex items-center justify-between">
              <span>Standard Positions & Designations</span>
              <span className="text-xs font-normal text-slate-500">{positions.length} designations</span>
            </h4>

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {positions.map((p) => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 bg-brand-secondary/15 text-brand-primary text-xs rounded-lg font-medium border border-brand-secondary/20"
                >
                  {p.title}
                </span>
              ))}
            </div>

            {/* Quick Add Position Form */}
            <form onSubmit={handleCreatePosition} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Add Position / Designation</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Title (e.g. HOD / Lab Head)"
                  value={newPosForm.title}
                  onChange={(e) => setNewPosForm({ ...newPosForm, title: e.target.value })}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white col-span-2"
                />
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary/90"
                >
                  + Add Position
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModernModal>

      {/* MODAL 5: Deactivate Confirmation */}
      <ModernModal
        isOpen={modalMode === 'delete_confirm'}
        onClose={() => setModalMode(null)}
        title="Deactivate Organizational Unit"
        size="sm"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDeactivate}
              disabled={modalSubmitting}
              className="px-5 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 disabled:opacity-50"
            >
              {modalSubmitting ? 'Deactivating...' : 'Yes, Deactivate'}
            </button>
          </div>
        }
      >
        <div className="p-1 space-y-3 text-slate-700 text-sm">
          <p>
            Are you sure you want to deactivate <strong className="text-slate-900">{selectedUnit?.name}</strong>?
          </p>
          <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            Warning: All sub-units in this hierarchy branch will also be deactivated. Existing ticket associations
            will be preserved for historical records.
          </p>
        </div>
      </ModernModal>
    </div>
  );
};
