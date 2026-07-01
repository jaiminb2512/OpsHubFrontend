import { useState, useEffect, useMemo } from 'react';
import { WizardLayout } from '../Common/Wizard';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { useWizardStepInUrl } from '../../hooks/useWizardStepInUrl';
import { useToast } from '../../Utils/ToastContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ROLE_PATHS } from '../../Path';
import {
    createRoleRoleSetupService,
    getRolesRoleSetupService,
    getModuleDetailByNameRoleSetupService,
    getRoleWizardModuleGroupsService,
    getRoleWizardModulesService,
    type RoleSetupListRole,
    type RoleSetupModuleSummary,
    type RoleSetupPermissionRow,
    type RoleSetupModulePermissionRow,
} from '../../Services/ApiServices/roleSetupWizardServices';
import { fetchAllCompanyPlanModulesService } from '../../Services/ApiServices/companyServices';
import { getRoleByIdService, updateRoleService, isHierarchyApplyEnabled } from '../../Services/ApiServices/roleServices';
import {
    MODULE_NAME_PERMISSION_PROBE,
    ROLE_ID_PERMISSION_PROBE,
    ROLES_FETCH_LIMIT,
    steps,
    editRoleSteps,
} from './roleSetupWizardConstants';
import type { WizardModule, WizardModuleGroup } from './roleSetupWizardTypes';
import {
    isWizardUseApiEnabled,
    loadRoleSetupWizardMock,
    useWizardMockData,
} from '../../mockData/wizardMockData';
import RoleWizardStepRoleSetup from './RoleWizardStepRoleSetup';
import RoleWizardStepEditDetails from './RoleWizardStepEditDetails';
import RoleWizardStepSelectModuleGroups from './RoleWizardStepSelectModuleGroups';
import RoleWizardStepSelectModules from './RoleWizardStepSelectModules';
import RoleWizardStepAssignPermissions from './RoleWizardStepAssignPermissions';

type RoleSetupWizardProps = {
    inlineRoleId?: string;
    onInlineClose?: () => void;
    /** Company wizard: load modules from plan features for this company */
    companyId?: string | null;
    /** @deprecated use companyId + plan-modules API */
    planModuleIds?: string[] | null;
};

const RoleSetupWizard = ({ inlineRoleId, onInlineClose, companyId, planModuleIds }: RoleSetupWizardProps = {}) => {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const { id: editRoleId } = useParams<{ id?: string }>();
    const actualEditRoleId = inlineRoleId || editRoleId;
    const isEditFlow = Boolean(actualEditRoleId);

    const useApi = useMemo(() => isWizardUseApiEnabled(), []);

    const wizardSteps = isEditFlow ? editRoleSteps : steps;
    // Step indices
    const moduleGroupsStepIndex = 1;
    const modulesStepIndex = 2;
    const permissionsStepIndex = 3;

    const { activeStep, setActiveStep } = useWizardStepInUrl(wizardSteps.length, !inlineRoleId);

    const {
        data: roleMock,
        loading: roleMockLoading,
        error: roleMockError,
    } = useWizardMockData(!useApi, loadRoleSetupWizardMock);

    const permissions = usePagePermissions(
        useApi
            ? [
                { key: 'roleSetupCreate', endpointKey: 'createRole' },
                { key: 'roleSetupList', endpointKey: 'getRoles' },
                { key: 'roleSetupGetModules', endpointKey: 'roleSetupGetModules' },
                {
                    key: 'roleSetupModuleDetailByName',
                    endpointKey: 'roleSetupModuleDetailByName',
                    pathParams: { name: MODULE_NAME_PERMISSION_PROBE },
                },
                {
                    key: 'roleGetById',
                    endpointKey: 'getRoleById',
                    pathParams: { id: ROLE_ID_PERMISSION_PROBE },
                },
                {
                    key: 'roleUpdate',
                    endpointKey: 'updateRole',
                    pathParams: { id: ROLE_ID_PERMISSION_PROBE },
                },
            ]
            : []
    );

    const canRoleSetupCreate = !useApi || permissions.roleSetupCreate === true;
    const canRoleSetupList = !useApi || permissions.roleSetupList === true;
    const canRoleGetById = !useApi || permissions.roleGetById === true;
    const canRoleUpdate = !useApi || permissions.roleUpdate === true;
    const canRoleSetupGetModules = !useApi || permissions.roleSetupGetModules === true;
    const canRoleSetupModuleDetailByName = !useApi || permissions.roleSetupModuleDetailByName === true;

    const [loading, setLoading] = useState(false);

    const [roleMode, setRoleMode] = useState<'create' | 'select'>(isEditFlow ? 'select' : 'create');
    const [roleData, setRoleData] = useState({
        id: actualEditRoleId ?? '',
        name: '',
        description: '',
        hierarchy: '',
        isPublic: true,
        projectId: '',
    });
    const [baselineRoleDetails, setBaselineRoleDetails] = useState({
        name: '',
        description: '',
        hierarchy: '',
        isPublic: true,
        projectId: '',
    });

    // ── Module groups (step 2) ───────────────────────────────────────────────
    const [moduleGroups, setModuleGroups] = useState<WizardModuleGroup[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groupSearch, setGroupSearch] = useState('');
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

    // ── Modules (step 3) ────────────────────────────────────────────────────
    const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());
    const [moduleSearch, setModuleSearch] = useState('');
    const [moduleSummaries, setModuleSummaries] = useState<RoleSetupModuleSummary[]>([]);
    const [modulesLoading, setModulesLoading] = useState(false);
    const [, setCompanyPlanFeatureIds] = useState<string[] | null>(null);
    const [modulePermissionsById, setModulePermissionsById] = useState<Record<string, RoleSetupPermissionRow[]>>({});

    const [activeModuleId, setActiveModuleId] = useState<string>('');
    const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Set<string>>>({});
    const [permSearch, setPermSearch] = useState('');

    const [rolesList, setRolesList] = useState<RoleSetupListRole[]>([]);
    const [rolesTotal, setRolesTotal] = useState(0);
    const [rolesInitialLoading, setRolesInitialLoading] = useState(false);
    const [rolesLoadingMore, setRolesLoadingMore] = useState(false);
    const [baselinePermissionIds, setBaselinePermissionIds] = useState<Set<string>>(() => new Set());
    const [baselineModuleIds, setBaselineModuleIds] = useState<Set<string>>(() => new Set());
    const [baselinePermsByModule, setBaselinePermsByModule] = useState<Record<string, Set<string>>>({});
    const [loadingRoleDetail, setLoadingRoleDetail] = useState(false);

    const rolesHasMore = rolesTotal > 0 && rolesList.length < rolesTotal;

    useEffect(() => {
        if (roleMockError) showError('Failed to load role wizard mock data');
    }, [roleMockError, showError]);

    useEffect(() => {
        if (!isEditFlow || !actualEditRoleId) return;
        setRoleMode('select');
        setRoleData((prev) => (prev.id === actualEditRoleId ? prev : { ...prev, id: actualEditRoleId }));
    }, [isEditFlow, actualEditRoleId]);

    // Load roles list for select mode
    useEffect(() => {
        if (roleMode !== 'select') return;
        if (!useApi) {
            if (!roleMock) { setRolesInitialLoading(roleMockLoading); return; }
            setRolesList(roleMock.rolesSelect);
            setRolesTotal(roleMock.rolesSelect.length);
            setRolesInitialLoading(false);
            return;
        }
        let cancelled = false;
        setRolesList([]);
        setRolesTotal(0);
        setRolesInitialLoading(true);
        (async () => {
            try {
                const res = await getRolesRoleSetupService({ page: 1, limit: ROLES_FETCH_LIMIT });
                if (cancelled) return;
                if (res.success === 200 && res.data) {
                    setRolesList(res.data.data);
                    setRolesTotal(res.data.total);
                } else {
                    showError(res.message || 'Failed to load roles');
                }
            } catch { if (!cancelled) showError('Failed to load roles'); }
            finally { if (!cancelled) setRolesInitialLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [roleMode, useApi, roleMock, roleMockLoading]);

    const handleLoadMoreRoles = async () => {
        if (!useApi || !rolesHasMore || rolesLoadingMore || rolesInitialLoading) return;
        const nextPage = Math.floor(rolesList.length / ROLES_FETCH_LIMIT) + 1;
        setRolesLoadingMore(true);
        try {
            const res = await getRolesRoleSetupService({ page: nextPage, limit: ROLES_FETCH_LIMIT });
            if (res.success === 200 && res.data) {
                const pageData = res.data;
                setRolesTotal(pageData.total);
                setRolesList(prev => {
                    const seen = new Set(prev.map(r => r.id));
                    const merged = [...prev];
                    for (const r of pageData.data) {
                        if (!seen.has(r.id)) { seen.add(r.id); merged.push(r); }
                    }
                    return merged;
                });
            } else { showError(res.message || 'Failed to load roles'); }
        } catch { showError('Failed to load roles'); }
        finally { setRolesLoadingMore(false); }
    };

    // Load role details for edit flow
    useEffect(() => {
        if (!useApi) {
            setBaselinePermissionIds(new Set());
            setBaselineModuleIds(new Set());
            setBaselinePermsByModule({});
            setLoadingRoleDetail(false);
            return;
        }
        if (roleMode !== 'select' || !roleData.id) {
            setBaselinePermissionIds(new Set());
            setBaselineModuleIds(new Set());
            setBaselinePermsByModule({});
            return;
        }
        let cancelled = false;
        (async () => {
            setLoadingRoleDetail(true);
            try {
                const res = await getRoleByIdService(roleData.id);
                if (cancelled || res.success !== 200 || !res.data) return;
                const role = res.data;
                const permIds = new Set<string>();
                const modIds = new Set<string>();
                const permsByModule: Record<string, Set<string>> = {};

                for (const rp of role.permissions ?? []) {
                    const p = rp.permission;
                    if (!p?.id) continue;
                    permIds.add(p.id);
                    const mid = p.moduleId;
                    if (mid) {
                        modIds.add(mid);
                        if (!permsByModule[mid]) permsByModule[mid] = new Set();
                        permsByModule[mid].add(p.id);
                    }
                }
                for (const rm of role.modules ?? []) {
                    const m = rm.module;
                    if (m?.id) modIds.add(m.id);
                }

                const resolvedIsPublic = role.isPublic ?? true;
                setRoleData({
                    id: role.id,
                    name: role.name ?? '',
                    description: role.description ?? '',
                    hierarchy: role.hierarchy != null ? String(role.hierarchy) : '',
                    isPublic: resolvedIsPublic,
                    projectId: (role as any).projectId ?? '',
                });
                setBaselineRoleDetails({
                    name: role.name ?? '',
                    description: role.description ?? '',
                    hierarchy: role.hierarchy != null ? String(role.hierarchy) : '',
                    isPublic: resolvedIsPublic,
                    projectId: (role as any).projectId ?? '',
                });
                setBaselinePermissionIds(permIds);
                setBaselineModuleIds(modIds);
                setBaselinePermsByModule(permsByModule);
                setSelectedModuleIds(modIds);
                setSelectedPermissions(Object.fromEntries(Object.entries(permsByModule).map(([k, v]) => [k, new Set(v)])));
                setActiveModuleId(modIds.size ? [...modIds][0] : '');
            } catch { if (!cancelled) showError('Failed to load role details'); }
            finally { if (!cancelled) setLoadingRoleDetail(false); }
        })();
        return () => { cancelled = true; };
    }, [roleMode, roleData.id, useApi]);

    // Load module groups when entering step 2
    useEffect(() => {
        if (!useApi) return;
        if (activeStep !== moduleGroupsStepIndex) return;
        if (moduleGroups.length > 0) return; // already loaded

        let cancelled = false;
        setGroupsLoading(true);
        (async () => {
            try {
                const res = await getRoleWizardModuleGroupsService();
                if (cancelled) return;
                if (res.success === 200 && Array.isArray(res.data)) {
                    setModuleGroups(res.data as WizardModuleGroup[]);
                } else {
                    showError(res.message || 'Failed to load module groups');
                }
            } catch { if (!cancelled) showError('Failed to load module groups'); }
            finally { if (!cancelled) setGroupsLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [useApi, activeStep, moduleGroups.length]);

    // Load modules when entering step 3 (or when selected groups change after entering step 3)
    useEffect(() => {
        if (!useApi) {
            setModuleSummaries([]);
            setModulesLoading(false);
            return;
        }
        if (activeStep !== modulesStepIndex) return;
        if (!canRoleSetupGetModules) return;

        let cancelled = false;
        setModulesLoading(true);
        setModuleSummaries([]);

        (async () => {
            try {
                if (companyId) {
                    const { modules, enabledFeatureIds } = await fetchAllCompanyPlanModulesService(companyId);
                    if (cancelled) return;
                    setModuleSummaries(modules as RoleSetupModuleSummary[]);
                    setCompanyPlanFeatureIds(enabledFeatureIds);
                } else {
                    const groupIds = [...selectedGroupIds];
                    const res = await getRoleWizardModulesService(groupIds);
                    if (cancelled) return;
                    if (res.success === 200 && Array.isArray(res.data)) {
                        setModuleSummaries(res.data);
                    } else {
                        showError(res.message || 'Failed to load modules');
                    }
                    setCompanyPlanFeatureIds(null);
                }
            } catch { if (!cancelled) showError('Failed to load modules'); }
            finally { if (!cancelled) setModulesLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [useApi, activeStep, modulesStepIndex, canRoleSetupGetModules, companyId, selectedGroupIds, showError]);

    const flattenPermissionsFromModuleDetail = (
        moduleId: string,
        rows: RoleSetupModulePermissionRow[]
    ): RoleSetupPermissionRow[] =>
        rows
            .filter((r) => r.permission?.id && r.method && r.route)
            .map((r) => ({
                id: r.permission.id,
                description: r.permission.description || '',
                apiMethod: r.method,
                apiRoute: r.route,
                moduleId,
            }));

    // Load permissions for active module when on permissions step
    useEffect(() => {
        if (!useApi) return;
        if (activeStep !== permissionsStepIndex) return;
        if (!activeModuleId) return;
        if (modulePermissionsById[activeModuleId]) return;
        if (!canRoleSetupModuleDetailByName) return;

        const summary = moduleSummaries.find(m => m.id === activeModuleId);
        const name = summary?.key || summary?.name;
        if (!name) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await getModuleDetailByNameRoleSetupService(name);
                if (cancelled) return;
                if (res.success === 200 && Array.isArray(res.data)) {
                    const perms = flattenPermissionsFromModuleDetail(activeModuleId, res.data);
                    setModulePermissionsById(prev => ({ ...prev, [activeModuleId]: perms }));
                } else {
                    showError(res.message || 'Failed to load module details');
                }
            } catch { if (!cancelled) showError('Failed to load module details'); }
        })();
        return () => { cancelled = true; };
    }, [useApi, activeStep, permissionsStepIndex, activeModuleId, moduleSummaries, modulePermissionsById, canRoleSetupModuleDetailByName]);

    const baseModulesForWizard: WizardModule[] = useApi
        ? moduleSummaries.map(m => ({
            id: m.id,
            name: m.label || m.name || m.key || '',
            description: m.key || m.name || '',
            moduleGroups: m.moduleGroups ?? [],
            moduleGroupLabel: m.moduleGroups?.[0]?.label ?? null,
            totalPermission: m.totalPermissions ?? m.totalPermission ?? 0,
            permissions: (modulePermissionsById[m.id] ?? []).map(p => ({
                id: p.id,
                description: p.description,
                apiMethod: p.apiMethod,
                apiRoute: p.apiRoute,
            })),
        }))
        : (roleMock?.modules ?? []);

    const modulesForWizard = useMemo(() => {
        if (companyId) return baseModulesForWizard;
        if (!planModuleIds) return baseModulesForWizard;
        return baseModulesForWizard.filter(m => planModuleIds.includes(m.id));
    }, [baseModulesForWizard, planModuleIds, companyId]);

    const filteredModules = modulesForWizard.filter((m) => {
        const q = moduleSearch.toLowerCase();
        return (
            m.name.toLowerCase().includes(q) ||
            (m.description || '').toLowerCase().includes(q) ||
            (m.moduleGroups ?? []).some(g => g.label.toLowerCase().includes(q))
        );
    });

    const toggleModule = (id: string) => {
        const isDeselecting = selectedModuleIds.has(id);
        setSelectedModuleIds((prev) => {
            const next = new Set(prev);
            if (isDeselecting) next.delete(id);
            else next.add(id);
            return next;
        });
        if (isDeselecting) {
            setSelectedPermissions((p) => { const np = { ...p }; delete np[id]; return np; });
            if (activeModuleId === id) setActiveModuleId('');
        } else {
            setSelectedPermissions((p) => {
                const np = { ...p };
                const baselineForModule = baselinePermsByModule[id];
                if (baselineForModule?.size) np[id] = new Set(baselineForModule);
                return np;
            });
        }
    };

    const toggleAllModules = () => {
        if (selectedModuleIds.size === filteredModules.length) {
            setSelectedModuleIds(new Set());
            setSelectedPermissions({});
            setActiveModuleId('');
        } else {
            setSelectedModuleIds(new Set(filteredModules.map(m => m.id)));
        }
    };

    const clearModules = () => {
        setSelectedModuleIds(new Set());
        setSelectedPermissions({});
        setActiveModuleId('');
    };

    // Module group toggle handlers
    const toggleGroup = (id: string) => {
        setSelectedGroupIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllGroups = () => {
        if (selectedGroupIds.size === moduleGroups.length) {
            setSelectedGroupIds(new Set());
        } else {
            setSelectedGroupIds(new Set(moduleGroups.map(g => g.id)));
        }
    };

    const clearGroups = () => {
        setSelectedGroupIds(new Set());
        // Also clear modules since they depend on group selection
        clearModules();
    };

    const selectedModules = modulesForWizard.filter(m => selectedModuleIds.has(m.id));
    const activeModule = modulesForWizard.find(m => m.id === activeModuleId);

    const filteredPermissions =
        activeModule?.permissions.filter(
            p =>
                (p.description || '').toLowerCase().includes(permSearch.toLowerCase()) ||
                (p.apiRoute || '').toLowerCase().includes(permSearch.toLowerCase())
        ) ?? [];

    const isPermSelected = (moduleId: string, permId: string) =>
        selectedPermissions[moduleId]?.has(permId) ?? false;

    const togglePerm = (moduleId: string, permId: string) => {
        setSelectedPermissions(prev => {
            const next = { ...prev };
            const set = new Set(next[moduleId] ?? []);
            if (set.has(permId)) set.delete(permId);
            else set.add(permId);
            next[moduleId] = set;
            return next;
        });
    };

    const toggleAllInModule = (moduleId: string, permIds: string[]) => {
        setSelectedPermissions(prev => {
            const next = { ...prev };
            const set = new Set(next[moduleId] ?? []);
            const allSelected = permIds.every(id => set.has(id));
            if (allSelected) permIds.forEach(id => set.delete(id));
            else permIds.forEach(id => set.add(id));
            next[moduleId] = set;
            return next;
        });
    };

    const getModuleSelectedCount = (moduleId: string) => selectedPermissions[moduleId]?.size ?? 0;
    const totalSelected = Object.values(selectedPermissions).reduce((sum, s) => sum + s.size, 0);

    const handleNext = () => {
        if (isEditFlow && useApi && loadingRoleDetail) {
            showError('Role details are still loading');
            return;
        }

        // Step 0: role details validation
        if (activeStep === 0) {
            if (isEditFlow) {
                if (!roleData.name.trim()) { showError('Role name is required'); return; }
                if (!roleData.description.trim()) { showError('Description is required'); return; }
                if (isHierarchyApplyEnabled()) {
                    const h = Number(roleData.hierarchy);
                    if (!String(roleData.hierarchy).trim() || Number.isNaN(h) || h < 1) { showError('Valid hierarchy level is required'); return; }
                }
            } else {
                if (roleMode === 'create') {
                    if (!canRoleSetupCreate) { showError('You do not have permission to create a role'); return; }
                    if (!roleData.name.trim()) { showError('Role name is required'); return; }
                    if (!roleData.description.trim()) { showError('Description is required'); return; }
                    if (isHierarchyApplyEnabled()) {
                        const h = Number(roleData.hierarchy);
                        if (!String(roleData.hierarchy).trim() || Number.isNaN(h) || h < 1) { showError('Valid hierarchy level is required'); return; }
                    }
                } else {
                    if (!canRoleSetupList) { showError('You do not have permission to list roles'); return; }
                    if (useApi && roleData.id && !canRoleGetById) { showError('You do not have permission to view role details'); return; }
                    if (!roleData.id) { showError('Please select a role'); return; }
                    if (useApi && loadingRoleDetail) { showError('Role details are still loading'); return; }
                }
            }
        }

        // Step 1: module group selection validation
        if (activeStep === moduleGroupsStepIndex) {
            if (useApi && !canRoleSetupGetModules) { showError('You do not have permission to access modules'); return; }
            // Groups are optional — user can skip if no groups are set up; modules step will load all
        }

        // Step 2: module selection validation
        if (activeStep === modulesStepIndex) {
            if (selectedModuleIds.size === 0) { showError('Please select at least one module'); return; }
            if (useApi && !canRoleSetupModuleDetailByName) { showError('You do not have permission to view module permissions'); return; }
            if (!activeModuleId) setActiveModuleId([...selectedModuleIds][0]);
        }

        if (activeStep < wizardSteps.length - 1) {
            setActiveStep(p => p + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (activeStep > 0) setActiveStep(p => p - 1);
    };

    const collectPermissionIds = () => Object.values(selectedPermissions).flatMap(s => [...s]);
    const collectModuleIds = () => [...selectedModuleIds];

    const resolveHierarchyForSubmit = (): number => {
        if (isHierarchyApplyEnabled()) return Number(roleData.hierarchy);
        const fallback = Number(roleData.hierarchy);
        return Number.isFinite(fallback) && fallback >= 1 ? fallback : 100;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!useApi) {
                showSuccess(roleMode === 'create'
                    ? 'Role setup completed locally (simulation — VITE_USE_API is false).'
                    : 'Role changes saved locally (simulation — VITE_USE_API is false).');
                navigate(ROLE_PATHS.LIST);
                return;
            }

            if (!isEditFlow && roleMode === 'create' && !canRoleSetupCreate) {
                showError('You do not have permission to create a role'); return;
            }
            if ((isEditFlow || roleMode === 'select') && !canRoleUpdate) {
                showError('You do not have permission to update this role'); return;
            }

            const permissionIds = collectPermissionIds();
            const moduleIds = collectModuleIds();

            if (!isEditFlow && roleMode === 'create') {
                const res = await createRoleRoleSetupService({
                    name: roleData.name.trim(),
                    description: roleData.description.trim(),
                    hierarchy: resolveHierarchyForSubmit(),
                    permissionIds,
                    moduleIds,
                    projectId: roleData.projectId || null,
                    ...(companyId ? { companyId } : {}),
                } as any);
                if (res.success === 201) {
                    showSuccess(res.message || 'Role created successfully.');
                    if (onInlineClose) onInlineClose();
                    else navigate(ROLE_PATHS.LIST);
                } else {
                    showError(res.message || 'Failed to create role');
                }
                return;
            }

            const desiredPerm = new Set(permissionIds);
            const desiredMod = new Set(moduleIds);
            const addPermissionIds = [...desiredPerm].filter(id => !baselinePermissionIds.has(id));
            const removePermissionIds = [...baselinePermissionIds].filter(id => !desiredPerm.has(id));
            const addModuleIds = [...desiredMod].filter(id => !baselineModuleIds.has(id));
            const removeModuleIds = [...baselineModuleIds].filter(id => !desiredMod.has(id));

            const detailsChanged =
                roleData.name.trim() !== baselineRoleDetails.name ||
                roleData.description.trim() !== baselineRoleDetails.description ||
                (isHierarchyApplyEnabled() && roleData.hierarchy !== baselineRoleDetails.hierarchy) ||
                roleData.isPublic !== baselineRoleDetails.isPublic ||
                roleData.projectId !== baselineRoleDetails.projectId;

            const hasChanges = addPermissionIds.length > 0 || removePermissionIds.length > 0 ||
                addModuleIds.length > 0 || removeModuleIds.length > 0 || detailsChanged;

            if (!hasChanges) {
                showSuccess('No changes to save.');
                if (onInlineClose) onInlineClose();
                else navigate(ROLE_PATHS.LIST);
                return;
            }

            const res = await updateRoleService(roleData.id, {
                ...(detailsChanged ? {
                    name: roleData.name.trim(),
                    description: roleData.description.trim(),
                    ...(isHierarchyApplyEnabled() ? { hierarchy: Number(roleData.hierarchy) } : {}),
                    isPublic: roleData.isPublic,
                    projectId: roleData.projectId || null,
                } as any : {}),
                addPermissionIds,
                removePermissionIds,
                addModuleIds,
                removeModuleIds,
            });
            if (res.success === 200) {
                showSuccess(res.message || 'Role updated successfully.');
                if (onInlineClose) onInlineClose();
                else navigate(ROLE_PATHS.LIST);
            } else {
                showError(res.message || 'Failed to update role');
            }
        } catch {
            showError('Failed to complete role setup');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        // Step 0: role info
        if (step === 0) {
            if (isEditFlow) {
                return (
                    <RoleWizardStepEditDetails
                        roleData={roleData}
                        onRoleDataChange={updater => setRoleData(prev => updater(prev))}
                    />
                );
            }
            return (
                <RoleWizardStepRoleSetup
                    roleMode={roleMode}
                    onRoleModeChange={setRoleMode}
                    roleData={roleData}
                    onRoleDataChange={updater => setRoleData(prev => updater(prev))}
                    rolesList={rolesList}
                    rolesTotal={rolesTotal}
                    rolesInitialLoading={rolesInitialLoading}
                    rolesLoadingMore={rolesLoadingMore}
                    rolesHasMore={rolesHasMore}
                    loadingRoleDetail={loadingRoleDetail}
                    useApi={useApi}
                    canRoleSetupList={canRoleSetupList}
                    onLoadMoreRoles={handleLoadMoreRoles}
                />
            );
        }

        // Step 1: select module groups
        if (step === moduleGroupsStepIndex) {
            return (
                <RoleWizardStepSelectModuleGroups
                    groupsLoading={useApi ? groupsLoading : roleMockLoading}
                    groupSearch={groupSearch}
                    onGroupSearchChange={setGroupSearch}
                    selectedGroupIds={selectedGroupIds}
                    onClearGroups={clearGroups}
                    moduleGroups={useApi ? moduleGroups : []}
                    onToggleGroup={toggleGroup}
                    onToggleAllGroups={toggleAllGroups}
                />
            );
        }

        // Step 2: select modules
        if (step === modulesStepIndex) {
            return (
                <RoleWizardStepSelectModules
                    useApi={useApi}
                    modulesLoading={useApi ? modulesLoading : roleMockLoading}
                    moduleSearch={moduleSearch}
                    onModuleSearchChange={setModuleSearch}
                    selectedModuleIds={selectedModuleIds}
                    onClearModules={clearModules}
                    filteredModules={filteredModules}
                    onToggleModule={toggleModule}
                    onToggleAllModules={toggleAllModules}
                />
            );
        }

        // Step 3: assign permissions
        if (step === permissionsStepIndex) {
            return (
                <RoleWizardStepAssignPermissions
                    useApi={useApi}
                    selectedModules={selectedModules}
                    activeModuleId={activeModuleId}
                    onActiveModuleChange={setActiveModuleId}
                    activeModule={activeModule}
                    filteredPermissions={filteredPermissions}
                    permSearch={permSearch}
                    onPermSearchChange={setPermSearch}
                    totalSelected={totalSelected}
                    getModuleSelectedCount={getModuleSelectedCount}
                    isPermSelected={isPermSelected}
                    onTogglePerm={togglePerm}
                    onToggleAllInModule={toggleAllInModule}
                />
            );
        }

        return null;
    };

    const wizardTitle = isEditFlow
        ? roleData.name ? `Edit Role: ${roleData.name}` : 'Edit Role'
        : 'Role Setup Wizard';

    return (
        <WizardLayout
            title={wizardTitle}
            steps={inlineRoleId ? [] : wizardSteps}
            activeStep={activeStep}
            onNext={handleNext}
            onBack={handleBack}
            onStepClick={index => index < activeStep && setActiveStep(index)}
            loading={loading || (!useApi && roleMockLoading) || (isEditFlow && useApi && loadingRoleDetail)}
            finishButtonText={isEditFlow ? 'Save Role' : 'Save Role Setup'}
            disableHeaderSync={!!inlineRoleId}
            parentBackLabel={inlineRoleId ? "Back to Company Roles" : "Back"}
            onParentBack={inlineRoleId ? onInlineClose : undefined}
        >
            {renderStepContent(activeStep)}
        </WizardLayout>
    );
};

export default RoleSetupWizard;
