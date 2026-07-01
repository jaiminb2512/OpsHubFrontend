import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Business as BusinessIcon,
    Store as StoreIcon,
    Warehouse as WarehouseIcon,
    Person as PersonIcon,
    AccountTree as MappingIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    WizardLayout,
    WizardStepHeader,
    PRIMARY,
    ICON_BG,
    fieldSx,
    wizardSectionPaperSx,
    wizardItemCardSx,
    WIZARD_BORDER_SUBTLE,
} from '../Common/Wizard';
import { useToast } from '../../Utils/ToastContext';
import { useWizardStepInUrl } from '../../hooks/useWizardStepInUrl';
import { COMPANY_PATHS } from '../../Path/companyPaths';
import { MOCK_COMPANIES, SEED_PLAN_CATALOG } from '../../mockData/planCatalog.mock';
import { isWizardUseApiEnabled } from '../../mockData/wizardMockData';
import { filterPlansForCompany, loadPlanCatalog, planVisibilityLabel } from '../../Utils/planVisibility';
import { getPlansService } from '../../Services/ApiServices/planServices';
import {
    createCompanyService,
    updateCompanyService,
    getCompaniesService,
    getCompanyByIdService,
    getCompanyStoresWarehousesService,
    createCompanyUserService,
    getCompanyUsersService,
    updateCompanyUserService,
    getCompanyUserRolesService,
    saveUserAccessMappingService,
    getUserAccessMappingService,
    createCompanyStoreService,
    updateCompanyStoreService,
    deleteCompanyStoreService,
    createCompanyWarehouseService,
    updateCompanyWarehouseService,
    deleteCompanyWarehouseService,
    importCompanyRolesService,
    fetchAllCompanyPlanModulesService,
    type CompanyListItem,
    type CompanyUserItem,
    type StoreItem,
    type WarehouseItem,
    type AddressRecord,
} from '../../Services/ApiServices/companyServices';
import {
    createRoleService,
    updateRoleService,
    deleteRoleService,
    getRolesPermissionsService,
} from '../../Services/ApiServices/roleServices';
import { getPlanWizardForEditService } from '../../Services/ApiServices/planWizardServices';
import RoleSetupWizard from '../RoleSetup/RoleSetupWizard';

type PlanOption = { id: string; name: string; description?: string; isPublic: boolean };

type CompanyDraft = {
    name: string;
    description: string;
    planId: string;
};

type AddressDraft = {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone: string;
};

const emptyAddress = (): AddressDraft => ({
    addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India', phone: '',
});

const addressFromRecord = (addr?: AddressRecord | null): AddressDraft => ({
    addressLine1: addr?.addressLine1 ?? '',
    addressLine2: addr?.addressLine2 ?? '',
    city: addr?.city ?? '',
    state: addr?.state ?? '',
    pincode: addr?.pincode ?? '',
    country: addr?.country ?? 'India',
    phone: addr?.phone ?? '',
});

const storeItemToDraft = (store: StoreItem): StoreDraft => ({
    id: store.id,
    name: store.name,
    address: addressFromRecord(store.address),
});

const warehouseItemToDraft = (warehouse: WarehouseItem): WarehouseDraft => ({
    id: warehouse.id,
    name: warehouse.name,
    address: addressFromRecord(warehouse.address),
});

const buildAddressPayload = (addr: AddressDraft) => {
    const hasAddr = addr.addressLine1 || addr.city || addr.state || addr.pincode;
    if (!hasAddr) return undefined;
    return {
        addressLine1: addr.addressLine1 || undefined,
        addressLine2: addr.addressLine2 || undefined,
        city: addr.city || undefined,
        state: addr.state || undefined,
        pincode: addr.pincode || undefined,
        country: addr.country || 'India',
        phone: addr.phone || undefined,
    };
};

type StoreDraft = {
    id: string;
    name: string;
    address: AddressDraft;
};

type WarehouseDraft = {
    id: string;
    name: string;
    address: AddressDraft;
};

type RoleDraft = {
    id: string;
    name: string;
    description: string;
};

type UserDraft = {
    id: string;
    fullName: string;
    emailId: string;
    password: string;
    roleId: string;
};

const steps = [
    'Company',
    'Stores & Warehouses',
    'Company Roles',
    'User',
    'User Mapping',
];

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sectionHeaderSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2,
};

const itemCardSx = wizardItemCardSx;

const addBtnSx = {
    borderRadius: '10px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.82rem',
    borderColor: WIZARD_BORDER_SUBTLE,
    color: PRIMARY,
    alignSelf: 'flex-start',
    '&:hover': {
        borderColor: PRIMARY,
        bgcolor: ICON_BG,
    },
};

const removeBtnSx = {
    borderRadius: '8px',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.75rem',
    minWidth: 'auto',
    px: 1.5,
    py: 0.5,
    borderColor: '#fecaca',
    color: '#ef4444',
    '&:hover': { borderColor: '#ef4444', bgcolor: '#fff5f5' },
};

type CompanyEditLocationState = {
    company?: CompanyListItem;
};

const CompanySetupWizard = () => {
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const { companyId: editCompanyId } = useParams<{ companyId?: string }>();
    const isEditMode = Boolean(editCompanyId?.trim());
    const openedEditRef = useRef(false);

    const { activeStep, setActiveStep } = useWizardStepInUrl(steps.length);
    const [loading, setLoading] = useState(false);

    const useApi = useMemo(() => isWizardUseApiEnabled(), []);

    const [plansList, setPlansList] = useState<PlanOption[]>([]);

    const companyIdForPlans = isEditMode ? (editCompanyId?.trim() ?? null) : null;

    const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(
        isEditMode ? editCompanyId!.trim() : null
    );
    const [company, setCompany] = useState<CompanyDraft>({ name: '', description: '', planId: '' });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
    const [stores, setStores] = useState<StoreDraft[]>([{ id: uid('store'), name: '', address: emptyAddress() }]);
    const [warehouses, setWarehouses] = useState<WarehouseDraft[]>([{ id: uid('warehouse'), name: '', address: emptyAddress() }]);
    const [persistedStoreIds, setPersistedStoreIds] = useState<Set<string>>(new Set());
    const [persistedWarehouseIds, setPersistedWarehouseIds] = useState<Set<string>>(new Set());
    const [createdStores, setCreatedStores] = useState<StoreItem[]>([]);
    const [createdWarehouses, setCreatedWarehouses] = useState<WarehouseItem[]>([]);
    const [rolesList, setRolesList] = useState<RoleDraft[]>([]);
    const [companyRoles, setCompanyRoles] = useState<any[]>([]);
    const [permissionsCatalog, setPermissionsCatalog] = useState<Record<string, any[]>>({});
    const [planModuleIds, setPlanModuleIds] = useState<string[] | null>(null);
    const [planFeatureIds, setPlanFeatureIds] = useState<string[] | null>(null);

    const [globalRolesForImport, setGlobalRolesForImport] = useState<any[]>([]);
    const [showGlobalRolesList, setShowGlobalRolesList] = useState(false);


    // Dialog form state
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [roleDialogMode, setRoleDialogMode] = useState<'create' | 'edit'>('create');
    const [currentEditingRole, setCurrentEditingRole] = useState<any | null>(null);
    const [inlineEditingRoleId, setInlineEditingRoleId] = useState<string | null>(null);
    const [roleForm, setRoleForm] = useState<{
        name: string;
        description: string;
        hierarchy: number;
        selectedPermissionIds: string[];
    }>({
        name: '',
        description: '',
        hierarchy: 10,
        selectedPermissionIds: [],
    });

    const [users, setUsers] = useState<UserDraft[]>([
        { id: uid('user'), fullName: '', emailId: '', password: '', roleId: '' },
    ]);
    const [createdUsers, setCreatedUsers] = useState<CompanyUserItem[]>([]);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ fullName: string; roleId: string }>({ fullName: '', roleId: '' });

    const [selectedUserId, setSelectedUserId] = useState('');
    const [mappedStoreIds, setMappedStoreIds] = useState<string[]>([]);
    const [mappedWarehouseIds, setMappedWarehouseIds] = useState<string[]>([]);

    useEffect(() => {
        if (!useApi) {
            const catalog = loadPlanCatalog(SEED_PLAN_CATALOG);
            setPlansList(
                filterPlansForCompany(catalog, companyIdForPlans).map((p) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description ?? planVisibilityLabel(p),
                    isPublic: p.isPublic,
                }))
            );
            return;
        }

        void (async () => {
            try {
                const res = await getPlansService({ isActive: true });
                if (res.success === 200 && res.data) {
                    setPlansList(
                        filterPlansForCompany(res.data, companyIdForPlans).map((p) => ({
                            id: p.id,
                            name: p.name,
                            description: p.description ?? planVisibilityLabel(p),
                            isPublic: p.isPublic,
                        }))
                    );
                }
            } catch {
                showError('Failed to load plans');
            }
        })();
    }, [useApi, showError, companyIdForPlans]);



    // Load company roles for Step 2
    useEffect(() => {
        if (!createdCompanyId) return;
        if (activeStep !== 2) return;

        if (!useApi) {
            const stored = localStorage.getItem(`CompanySetupRoles_${createdCompanyId}`);
            if (stored) {
                setCompanyRoles(JSON.parse(stored));
            }
            return;
        }

        void (async () => {
            setLoading(true);
            try {
                const res = await getCompanyUserRolesService({ companyId: createdCompanyId, limit: 100 });
                if (res.data) {
                    setCompanyRoles(res.data);
                }
            } catch {
                showError('Failed to load company roles');
            } finally {
                setLoading(false);
            }
        })();
    }, [useApi, activeStep, createdCompanyId, showError]);

    // Load active plan modules and features
    useEffect(() => {
        if (!company.planId) {
            setPlanModuleIds(null);
            setPlanFeatureIds(null);
            return;
        }

        if (!useApi) {
            if (company.planId === 'plan-basic') {
                setPlanModuleIds(['mod-1', 'mod-2', 'mod-3']);
                setPlanFeatureIds(['feature-order-1', 'feature-order-2', 'feature-cust-1', 'feature-cust-2', 'feature-inv-1']);
            } else {
                setPlanModuleIds(['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6']);
                setPlanFeatureIds([
                    'feature-order-1', 'feature-order-2', 'feature-order-3', 'feature-order-4',
                    'feature-cust-1', 'feature-cust-2', 'feature-cust-3',
                    'feature-inv-1', 'feature-inv-2',
                    'feature-rep-1', 'feature-rep-2',
                    'feature-prod-1', 'feature-prod-2', 'feature-prod-3', 'feature-prod-4',
                    'feature-supp-1', 'feature-supp-2'
                ]);
            }
            return;
        }

        void (async () => {
            try {
                const res = await getPlanWizardForEditService(company.planId);
                if (res.success === 200 && res.data?.payload) {
                    setPlanModuleIds(res.data.payload.selectedModuleIds || []);
                    setPlanFeatureIds(res.data.payload.selectedFeatureIds || []);
                }
            } catch {
                showError('Failed to load plan details');
            }
        })();
    }, [useApi, company.planId, showError]);

    // After company exists, resolve modules from plan/company features (shared catalog feature, etc.)
    useEffect(() => {
        const companyId = createdCompanyId ?? editCompanyId?.trim() ?? null;
        if (!companyId || !useApi) return;

        void (async () => {
            try {
                const { modules, enabledFeatureIds } = await fetchAllCompanyPlanModulesService(companyId);
                setPlanModuleIds(modules.map((m) => m.id));
                if (enabledFeatureIds.length > 0) {
                    setPlanFeatureIds(enabledFeatureIds);
                }
            } catch {
                showError('Failed to load company plan modules');
            }
        })();
    }, [useApi, createdCompanyId, editCompanyId, showError]);

    // Load permissions catalog
    useEffect(() => {
        if (!useApi) {
            const mockCatalog: Record<string, any[]> = {
                'Orders': [
                    { id: 'perm-1', description: 'View Orders', apiMethod: 'GET', apiRoute: '/api/orders', moduleId: 'mod-1', featureId: 'feature-order-1' },
                    { id: 'perm-2', description: 'Create Order', apiMethod: 'POST', apiRoute: '/api/orders', moduleId: 'mod-1', featureId: 'feature-order-2' },
                    { id: 'perm-3', description: 'Update Order', apiMethod: 'PUT', apiRoute: '/api/orders/:id', moduleId: 'mod-1', featureId: 'feature-order-3' },
                    { id: 'perm-4', description: 'Delete Order', apiMethod: 'DELETE', apiRoute: '/api/orders/:id', moduleId: 'mod-1', featureId: 'feature-order-4' }
                ],
                'Customers': [
                    { id: 'perm-5', description: 'View Customers', apiMethod: 'GET', apiRoute: '/api/customers', moduleId: 'mod-2', featureId: 'feature-cust-1' },
                    { id: 'perm-6', description: 'Create Customer', apiMethod: 'POST', apiRoute: '/api/customers', moduleId: 'mod-2', featureId: 'feature-cust-2' },
                    { id: 'perm-7', description: 'Update Customer', apiMethod: 'PUT', apiRoute: '/api/customers/:id', moduleId: 'mod-2', featureId: 'feature-cust-3' }
                ],
                'Inventory': [
                    { id: 'perm-8', description: 'View Inventory', apiMethod: 'GET', apiRoute: '/api/inventory', moduleId: 'mod-3', featureId: 'feature-inv-1' },
                    { id: 'perm-9', description: 'Add Stock', apiMethod: 'POST', apiRoute: '/api/inventory', moduleId: 'mod-3', featureId: 'feature-inv-2' }
                ],
                'Reports': [
                    { id: 'perm-10', description: 'View Reports', apiMethod: 'GET', apiRoute: '/api/reports', moduleId: 'mod-4', featureId: 'feature-rep-1' },
                    { id: 'perm-11', description: 'Export Reports', apiMethod: 'POST', apiRoute: '/api/reports/export', moduleId: 'mod-4', featureId: 'feature-rep-2' }
                ],
                'Products': [
                    { id: 'perm-12', description: 'View Products', apiMethod: 'GET', apiRoute: '/api/products', moduleId: 'mod-5', featureId: 'feature-prod-1' },
                    { id: 'perm-13', description: 'Create Product', apiMethod: 'POST', apiRoute: '/api/products', moduleId: 'mod-5', featureId: 'feature-prod-2' },
                    { id: 'perm-14', description: 'Update Product', apiMethod: 'PUT', apiRoute: '/api/products/:id', moduleId: 'mod-5', featureId: 'feature-prod-3' },
                    { id: 'perm-15', description: 'Delete Product', apiMethod: 'DELETE', apiRoute: '/api/products/:id', moduleId: 'mod-5', featureId: 'feature-prod-4' }
                ],
                'Suppliers': [
                    { id: 'perm-16', description: 'View Suppliers', apiMethod: 'GET', apiRoute: '/api/suppliers', moduleId: 'mod-6', featureId: 'feature-supp-1' },
                    { id: 'perm-17', description: 'Create Supplier', apiMethod: 'POST', apiRoute: '/api/suppliers', moduleId: 'mod-6', featureId: 'feature-supp-2' }
                ]
            };
            setPermissionsCatalog(mockCatalog);
            return;
        }

        void (async () => {
            try {
                const res = await getRolesPermissionsService();
                if (res.data) {
                    setPermissionsCatalog(res.data);
                }
            } catch {
                showError('Failed to load permissions catalog');
            }
        })();
    }, [useApi, showError]);

    // Load roles dropdown options for step 3 (User assignment)
    useEffect(() => {
        if (!createdCompanyId) return;

        if (!useApi) {
            setRolesList(
                companyRoles.map((r) => ({
                    id: r.id,
                    name: r.name,
                    description: r.description ?? '',
                }))
            );
            return;
        }

        void (async () => {
            try {
                const res = await getCompanyUserRolesService({ companyId: createdCompanyId, limit: 100 });
                if (res.data) {
                    setRolesList(
                        res.data.map((r) => ({
                            id: r.id,
                            name: r.name,
                            description: r.description ?? '',
                        }))
                    );
                }
            } catch {
                showError('Failed to load roles for assignment');
            }
        })();
    }, [useApi, activeStep, createdCompanyId, companyRoles, showError]);

    const handleFetchGlobalRoles = async () => {
        if (!createdCompanyId) {
            showError('Company must be created first');
            return;
        }
        setLoading(true);
        try {
            if (!useApi) {
                const mockGlobalRoles = [
                    { id: 'role-admin', name: 'Admin', description: 'Full system access', hierarchy: 1 },
                    { id: 'role-manager', name: 'Manager', description: 'Manage daily operations', hierarchy: 2 },
                    { id: 'role-staff', name: 'Staff', description: 'Basic operational access', hierarchy: 3 }
                ];
                setGlobalRolesForImport(mockGlobalRoles);
                setShowGlobalRolesList(true);
                return;
            }

            const res = await getCompanyUserRolesService({ isPublic: true, companyId: 'null' });
            if (res.success === 200) {
                setGlobalRolesForImport(res.data);
                setShowGlobalRolesList(true);
                showSuccess('Global roles fetched');
            } else {
                showError(res.message || 'Failed to fetch global roles');
            }
        } catch {
            showError('Failed to fetch global roles');
        } finally {
            setLoading(false);
        }
    };

    const handleImportSingleRole = async (gRole: any) => {
        if (!createdCompanyId) return;
        setLoading(true);
        try {
            if (!useApi) {
                const companyRoleName = gRole.name;
                const conflict = companyRoles.some((r) => r.name.toLowerCase() === companyRoleName.toLowerCase());
                if (conflict) {
                    showError('Role already imported');
                    setLoading(false);
                    return;
                }
                const allowedModules = planModuleIds ? planModuleIds : ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6'];
                let assignedPermissions: string[] = [];
                // Filter permissions based on company plan for the mock
                Object.values(permissionsCatalog).forEach((perms) => {
                    perms.forEach((p) => {
                        const mId = p.moduleId;
                        const fId = p.featureId;
                        if (!planModuleIds || planModuleIds.includes(mId)) {
                            if (!planFeatureIds || !fId || planFeatureIds.includes(fId)) {
                                assignedPermissions.push(p.id);
                            }
                        }
                    });
                });

                const newRole = {
                    id: uid('company-role'),
                    name: companyRoleName,
                    description: gRole.description,
                    hierarchy: gRole.hierarchy,
                    companyId: createdCompanyId,
                    modules: allowedModules.map((mId: string) => ({ module: { id: mId } })),
                    permissions: assignedPermissions.map(pId => ({ permission: { id: pId } }))
                };
                setCompanyRoles((prev) => [...prev, newRole]);
                showSuccess('Global role imported successfully (simulated)');
                return;
            }

            const res = await importCompanyRolesService(createdCompanyId, gRole.id);
            if (res.success === 200) {
                const newlyImported = Array.isArray(res.data) ? res.data : [res.data];
                setCompanyRoles((prev) => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const uniqueNew = newlyImported.filter(r => r && !existingIds.has(r.id));
                    return [...prev, ...uniqueNew];
                });
                showSuccess('Role imported successfully');
            } else {
                showError(res.message || 'Failed to import role');
            }
        } catch {
            showError('Failed to import role');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRole = async () => {
        if (!createdCompanyId) return;
        const { name, description, hierarchy, selectedPermissionIds } = roleForm;
        if (!name.trim()) {
            showError('Role name is required');
            return;
        }

        setLoading(true);
        try {
            if (!useApi) {
                if (roleDialogMode === 'create') {
                    const conflict = companyRoles.some((r) => r.name.toLowerCase() === name.trim().toLowerCase());
                    if (conflict) {
                        showError('Role with this name already exists');
                        return;
                    }
                    const newRole = {
                        id: uid('company-role'),
                        name: name.trim(),
                        description: description.trim(),
                        hierarchy,
                        companyId: createdCompanyId,
                        permissions: selectedPermissionIds.map((pId) => ({ permission: { id: pId } })),
                        modules: []
                    };
                    const updated = [...companyRoles, newRole];
                    setCompanyRoles(updated);
                    localStorage.setItem(`CompanySetupRoles_${createdCompanyId}`, JSON.stringify(updated));
                    showSuccess('Role created successfully (simulated)');
                } else if (roleDialogMode === 'edit' && currentEditingRole) {
                    const updated = companyRoles.map((r) => {
                        if (r.id === currentEditingRole.id) {
                            return {
                                ...r,
                                name: name.trim(),
                                description: description.trim(),
                                hierarchy,
                                permissions: selectedPermissionIds.map((pId) => ({ permission: { id: pId } }))
                            };
                        }
                        return r;
                    });
                    setCompanyRoles(updated);
                    localStorage.setItem(`CompanySetupRoles_${createdCompanyId}`, JSON.stringify(updated));
                    showSuccess('Role updated successfully (simulated)');
                }
                setIsRoleDialogOpen(false);
                return;
            }

            if (roleDialogMode === 'create') {
                const res = await createRoleService({
                    name: name.trim(),
                    description: description.trim(),
                    hierarchy,
                    permissionIds: selectedPermissionIds,
                });
                if (res.success === 201 || res.success === 200) {
                    setCompanyRoles((prev) => [...prev, res.data]);
                    showSuccess('Role created successfully');
                    setIsRoleDialogOpen(false);
                } else {
                    showError(res.message || 'Failed to create role');
                }
            } else if (roleDialogMode === 'edit' && currentEditingRole) {
                const currentPermissionIds = currentEditingRole.permissions?.map((p: any) => p.permission.id || p.permissionId) || [];
                const addPermissionIds = selectedPermissionIds.filter((id) => !currentPermissionIds.includes(id));
                const removePermissionIds = currentPermissionIds.filter((id: string) => !selectedPermissionIds.includes(id));

                const res = await updateRoleService(currentEditingRole.id, {
                    name: name.trim(),
                    description: description.trim(),
                    hierarchy,
                    addPermissionIds,
                    removePermissionIds
                });

                if (res.success === 200) {
                    setCompanyRoles((prev) => prev.map((r) => r.id === currentEditingRole.id ? res.data : r));
                    showSuccess('Role updated successfully');
                    setIsRoleDialogOpen(false);
                } else {
                    showError(res.message || 'Failed to update role');
                }
            }
        } catch (err: any) {
            showError(err.response?.data?.message || 'Failed to save role');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!createdCompanyId) return;
        setLoading(true);
        try {
            if (!useApi) {
                const updated = companyRoles.filter((r) => r.id !== roleId);
                setCompanyRoles(updated);
                localStorage.setItem(`CompanySetupRoles_${createdCompanyId}`, JSON.stringify(updated));
                showSuccess('Role deleted successfully (simulated)');
                return;
            }

            const res = await deleteRoleService(roleId);
            if (res.success === 200) {
                setCompanyRoles((prev) => prev.filter((r) => r.id !== roleId));
                showSuccess('Role deleted successfully');
            } else {
                showError(res.message || 'Failed to delete role');
            }
        } catch {
            showError('Failed to delete role');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRoleDialog = (mode: 'create' | 'edit', role?: any) => {
        setRoleDialogMode(mode);
        if (mode === 'edit' && role) {
            setCurrentEditingRole(role);
            setRoleForm({
                name: role.name,
                description: role.description || '',
                hierarchy: role.hierarchy ?? 10,
                selectedPermissionIds: role.permissions?.map((p: any) => p.permission.id || p.permissionId) || [],
            });
        } else {
            setCurrentEditingRole(null);
            setRoleForm({
                name: '',
                description: '',
                hierarchy: 10,
                selectedPermissionIds: [],
            });
        }
        setIsRoleDialogOpen(true);
    };


    const loadedStoresRef = useRef(false);
    const loadedUsersRef = useRef(false);

    useEffect(() => {
        if (!useApi || activeStep !== 1 || !createdCompanyId || loadedStoresRef.current) return;
        loadedStoresRef.current = true;

        void (async () => {
            try {
                const res = await getCompanyStoresWarehousesService(createdCompanyId);
                if (res.success === 200 && res.data) {
                    const loadedStores = res.data.stores ?? [];
                    const loadedWarehouses = res.data.warehouses ?? [];
                    if (loadedStores.length) {
                        setStores(loadedStores.map(storeItemToDraft));
                        setCreatedStores(loadedStores);
                        setPersistedStoreIds(new Set(loadedStores.map((s) => s.id)));
                    }
                    if (loadedWarehouses.length) {
                        setWarehouses(loadedWarehouses.map(warehouseItemToDraft));
                        setCreatedWarehouses(loadedWarehouses);
                        setPersistedWarehouseIds(new Set(loadedWarehouses.map((w) => w.id)));
                    }
                }
            } catch { /* first time — none yet */ }
        })();
    }, [useApi, activeStep, createdCompanyId]);

    useEffect(() => {
        if (!useApi || activeStep !== 3 || !createdCompanyId || loadedUsersRef.current) return;
        loadedUsersRef.current = true;

        void (async () => {
            try {
                const res = await getCompanyUsersService(createdCompanyId);
                if (res.success === 200 && res.data?.length) {
                    setCreatedUsers(res.data);
                }
            } catch { /* first time — no users yet */ }
        })();
    }, [useApi, activeStep, createdCompanyId]);

    useEffect(() => {
        if (!isEditMode || openedEditRef.current) return;
        openedEditRef.current = true;

        const applyCompanyRow = (row: CompanyListItem) => {
            setCompany({
                name: row.name ?? '',
                description: row.description ?? '',
                planId: row.planId ?? row.plan?.id ?? '',
            });
            setCreatedCompanyId(row.id);
            setExistingLogoUrl(row.logo?.imageUrl ?? null);
            setLogoPreview(row.logo?.imageUrl ?? null);
        };

        const hydrateStoresWarehouses = (loadedStores: StoreItem[], loadedWarehouses: WarehouseItem[]) => {
            if (loadedStores.length) {
                setStores(loadedStores.map(storeItemToDraft));
                setCreatedStores(loadedStores);
                setPersistedStoreIds(new Set(loadedStores.map((s) => s.id)));
            }
            if (loadedWarehouses.length) {
                setWarehouses(loadedWarehouses.map(warehouseItemToDraft));
                setCreatedWarehouses(loadedWarehouses);
                setPersistedWarehouseIds(new Set(loadedWarehouses.map((w) => w.id)));
            }
        };

        const loadStoresWarehouses = async (companyId: string) => {
            try {
                const sw = await getCompanyStoresWarehousesService(companyId);
                if (sw.success === 200 && sw.data) {
                    hydrateStoresWarehouses(sw.data.stores ?? [], sw.data.warehouses ?? []);
                }
            } catch { /* keep defaults */ }
        };

        const loadCompanyDetails = async (companyId: string) => {
            try {
                const res = await getCompanyByIdService(companyId);
                if (res.success === 200 && res.data) {
                    applyCompanyRow(res.data);
                }
            } catch { /* list row fallback */ }
        };

        const fromState = (location.state as CompanyEditLocationState | null)?.company;
        if (fromState) {
            applyCompanyRow(fromState);
            if (useApi) {
                void loadCompanyDetails(fromState.id);
                void loadStoresWarehouses(fromState.id);
            }
            return;
        }

        void (async () => {
            if (useApi) {
                try {
                    const res = await getCompaniesService();
                    const row = res.data?.find((c) => c.id === editCompanyId);
                    if (row) {
                        applyCompanyRow(row);
                        await loadCompanyDetails(row.id);
                        await loadStoresWarehouses(row.id);
                        return;
                    }
                } catch {
                    showError('Failed to load company');
                    navigate(COMPANY_PATHS.LIST);
                    return;
                }
            } else {
                const mockRow = MOCK_COMPANIES.find((c) => c.id === editCompanyId);
                if (mockRow) {
                    applyCompanyRow({ id: mockRow.id, name: mockRow.name, isActive: true, createdAt: '' });
                    return;
                }
            }

            showError('Company not found');
            navigate(COMPANY_PATHS.LIST);
        })();
    }, [isEditMode, editCompanyId, location.state, navigate, showError, useApi]);

    const canProceedStep = () => {
        if (activeStep === 2) {
            if (companyRoles.length === 0) {
                return { ok: false as const, message: 'Please import or create at least one company role before proceeding' };
            }
            return { ok: true as const };
        }
        if (activeStep === 3) {
            if (useApi) {
                if (createdUsers.length === 0) {
                    return { ok: false as const, message: 'Create at least one user before proceeding' };
                }
                return { ok: true as const };
            }
            const firstUser = users[0];
            if (!firstUser?.fullName.trim()) return { ok: false as const, message: 'User full name is required' };
            if (!firstUser?.emailId.trim()) return { ok: false as const, message: 'User email is required' };
            if (!firstUser?.password.trim()) return { ok: false as const, message: 'Password is required' };
            if (!firstUser?.roleId.trim()) {
                return { ok: false as const, message: 'Select a role for the user' };
            }
            return { ok: true as const };
        }
        if (activeStep === 4) {
            if (useApi) {
                if (!selectedUserId) {
                    return { ok: false as const, message: 'Select a user first' };
                }
            }
            if (mappedStoreIds.length === 0) {
                return { ok: false as const, message: 'Map user to at least one store' };
            }
            if (mappedWarehouseIds.length === 0) {
                return { ok: false as const, message: 'Map user to at least one warehouse' };
            }
            return { ok: true as const };
        }
        return { ok: true as const };
    };

    const handleBack = () => { if (activeStep > 0) setActiveStep((p) => p - 1); };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showError('Logo must be 5MB or smaller');
            return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const persistCompanyStep = async (): Promise<boolean> => {
        const companyPayload = {
            name: company.name.trim(),
            description: company.description.trim() || undefined,
            planId: company.planId.trim() || undefined,
        };

        if (isEditMode) {
            const companyId = createdCompanyId ?? editCompanyId?.trim();
            if (!companyId) {
                showError('Company id is missing');
                return false;
            }

            const res = await updateCompanyService(companyId, companyPayload, logoFile);

            if (res.success !== 200) {
                showError(res.message || 'Failed to update company');
                return false;
            }

            if (res.data?.plan?.id) {
                setCompany((prev) => ({ ...prev, planId: res.data!.plan!.id }));
            }
            if (res.data?.logo?.imageUrl) {
                setExistingLogoUrl(res.data.logo.imageUrl);
                setLogoPreview(res.data.logo.imageUrl);
            }
            setLogoFile(null);
            showSuccess(res.message || 'Company updated');
            return true;
        }

        if (createdCompanyId) {
            return true;
        }

        const res = await createCompanyService(companyPayload, logoFile);

        if (res.success !== 201 && res.success !== 200) {
            showError(res.message || 'Failed to create company');
            return false;
        }

        const id = res.data?.id;
        if (id) {
            setCreatedCompanyId(id);
            if (res.data?.logo?.imageUrl) {
                setExistingLogoUrl(res.data.logo.imageUrl);
                setLogoPreview(res.data.logo.imageUrl);
            }
            setLogoFile(null);
        }
        showSuccess('Company saved');
        return true;
    };

    const handleCreateStore = async (draft: StoreDraft) => {
        const companyId = createdCompanyId;
        if (!companyId) { showError('Company must be created first'); return; }
        if (!draft.name.trim()) { showError('Store name is required'); return; }

        setLoading(true);
        try {
            const res = await createCompanyStoreService(companyId, {
                name: draft.name.trim(),
                address: buildAddressPayload(draft.address),
            });
            if (res.success === 201 || res.success === 200) {
                const created = res.data!;
                setCreatedStores((prev) => [...prev, created]);
                setStores((prev) => prev.map((s) => (s.id === draft.id ? storeItemToDraft(created) : s)));
                setPersistedStoreIds((prev) => new Set([...prev, created.id]));
                showSuccess(`Store "${created.name}" created`);
            } else {
                showError(res.message || 'Failed to create store');
            }
        } catch {
            showError('Failed to create store');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStore = async (draft: StoreDraft) => {
        const companyId = createdCompanyId;
        if (!companyId) { showError('Company must be created first'); return; }
        if (!draft.name.trim()) { showError('Store name is required'); return; }

        setLoading(true);
        try {
            const res = await updateCompanyStoreService(companyId, draft.id, {
                name: draft.name.trim(),
                address: buildAddressPayload(draft.address),
            });
            if (res.success === 200 && res.data) {
                const updated = res.data;
                setCreatedStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                setStores((prev) => prev.map((s) => (s.id === updated.id ? storeItemToDraft(updated) : s)));
                showSuccess(`Store "${updated.name}" updated`);
            } else {
                showError(res.message || 'Failed to update store');
            }
        } catch {
            showError('Failed to update store');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        const companyId = createdCompanyId;
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await deleteCompanyStoreService(companyId, storeId);
            if (res.success === 200) {
                setCreatedStores((prev) => prev.filter((s) => s.id !== storeId));
                setStores((prev) => {
                    const next = prev.filter((s) => s.id !== storeId);
                    return next.length ? next : [{ id: uid('store'), name: '', address: emptyAddress() }];
                });
                setPersistedStoreIds((prev) => {
                    const next = new Set(prev);
                    next.delete(storeId);
                    return next;
                });
                setMappedStoreIds((prev) => prev.filter((id) => id !== storeId));
                showSuccess('Store deleted');
            } else {
                showError(res.message || 'Failed to delete store');
            }
        } catch {
            showError('Failed to delete store');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWarehouse = async (draft: WarehouseDraft) => {
        const companyId = createdCompanyId;
        if (!companyId) { showError('Company must be created first'); return; }
        if (!draft.name.trim()) { showError('Warehouse name is required'); return; }

        setLoading(true);
        try {
            const res = await createCompanyWarehouseService(companyId, {
                name: draft.name.trim(),
                address: buildAddressPayload(draft.address),
            });
            if (res.success === 201 || res.success === 200) {
                const created = res.data!;
                setCreatedWarehouses((prev) => [...prev, created]);
                setWarehouses((prev) => prev.map((w) => (w.id === draft.id ? warehouseItemToDraft(created) : w)));
                setPersistedWarehouseIds((prev) => new Set([...prev, created.id]));
                showSuccess(`Warehouse "${created.name}" created`);
            } else {
                showError(res.message || 'Failed to create warehouse');
            }
        } catch {
            showError('Failed to create warehouse');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateWarehouse = async (draft: WarehouseDraft) => {
        const companyId = createdCompanyId;
        if (!companyId) { showError('Company must be created first'); return; }
        if (!draft.name.trim()) { showError('Warehouse name is required'); return; }

        setLoading(true);
        try {
            const res = await updateCompanyWarehouseService(companyId, draft.id, {
                name: draft.name.trim(),
                address: buildAddressPayload(draft.address),
            });
            if (res.success === 200 && res.data) {
                const updated = res.data;
                setCreatedWarehouses((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
                setWarehouses((prev) => prev.map((w) => (w.id === updated.id ? warehouseItemToDraft(updated) : w)));
                showSuccess(`Warehouse "${updated.name}" updated`);
            } else {
                showError(res.message || 'Failed to update warehouse');
            }
        } catch {
            showError('Failed to update warehouse');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWarehouse = async (warehouseId: string) => {
        const companyId = createdCompanyId;
        if (!companyId) return;
        setLoading(true);
        try {
            const res = await deleteCompanyWarehouseService(companyId, warehouseId);
            if (res.success === 200) {
                setCreatedWarehouses((prev) => prev.filter((w) => w.id !== warehouseId));
                setWarehouses((prev) => {
                    const next = prev.filter((w) => w.id !== warehouseId);
                    return next.length ? next : [{ id: uid('warehouse'), name: '', address: emptyAddress() }];
                });
                setPersistedWarehouseIds((prev) => {
                    const next = new Set(prev);
                    next.delete(warehouseId);
                    return next;
                });
                setMappedWarehouseIds((prev) => prev.filter((id) => id !== warehouseId));
                showSuccess('Warehouse deleted');
            } else {
                showError(res.message || 'Failed to delete warehouse');
            }
        } catch {
            showError('Failed to delete warehouse');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (draft: UserDraft) => {
        const companyId = createdCompanyId;
        if (!companyId) {
            showError('Company must be created first');
            return;
        }
        if (!draft.fullName.trim() || !draft.emailId.trim() || !draft.password.trim() || !draft.roleId.trim()) {
            showError('All user fields are required');
            return;
        }

        setLoading(true);
        try {
            const res = await createCompanyUserService(companyId, {
                fullName: draft.fullName.trim(),
                emailId: draft.emailId.trim(),
                password: draft.password.trim(),
                roleId: draft.roleId,
            });

            if (res.success === 201 || res.success === 200) {
                const created = res.data!;
                setCreatedUsers((prev) => [
                    ...prev,
                    {
                        userId: created.userId,
                        fullName: created.fullName,
                        emailId: created.emailId,
                        roleId: created.role.id,
                        roleName: created.role.name,
                    },
                ]);
                setUsers((prev) => prev.filter((u) => u.id !== draft.id));
                showSuccess(`User "${created.fullName}" created`);
            } else {
                showError(res.message || 'Failed to create user');
            }
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } }).response?.data
                        ?.message
                    : undefined;
            showError(message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const handleStartEditUser = (u: CompanyUserItem) => {
        setEditingUserId(u.userId);
        setEditForm({ fullName: u.fullName, roleId: u.roleId });
    };

    const handleCancelEditUser = () => {
        setEditingUserId(null);
        setEditForm({ fullName: '', roleId: '' });
    };

    const handleSaveEditUser = async () => {
        if (!editingUserId || !createdCompanyId) return;
        const target = createdUsers.find((u) => u.userId === editingUserId);
        if (!target) return;

        const changes: { fullName?: string; roleId?: string } = {};
        if (editForm.fullName.trim() && editForm.fullName.trim() !== target.fullName) {
            changes.fullName = editForm.fullName.trim();
        }
        if (editForm.roleId && editForm.roleId !== target.roleId) {
            changes.roleId = editForm.roleId;
        }
        if (!Object.keys(changes).length) {
            handleCancelEditUser();
            return;
        }

        setLoading(true);
        try {
            const res = await updateCompanyUserService(createdCompanyId, editingUserId, changes);
            if (res.success === 200 && res.data) {
                const updated = res.data;
                setCreatedUsers((prev) =>
                    prev.map((u) =>
                        u.userId === editingUserId
                            ? { ...u, fullName: updated.fullName, roleId: updated.role.id, roleName: updated.role.name }
                            : u
                    )
                );
                showSuccess('User updated');
            } else {
                showError(res.message || 'Failed to update user');
            }
        } catch {
            showError('Failed to update user');
        } finally {
            setLoading(false);
            handleCancelEditUser();
        }
    };

    const persistUserAccessStep = async (): Promise<boolean> => {
        const companyId = createdCompanyId;
        if (!companyId || !selectedUserId) return false;

        const res = await saveUserAccessMappingService(companyId, selectedUserId, {
            storeIds: mappedStoreIds,
            warehouseIds: mappedWarehouseIds,
        });

        if (res.success !== 200 && res.success !== 201) {
            showError(res.message || 'Failed to save user access mapping');
            return false;
        }

        showSuccess('User access mapping saved');
        return true;
    };

    const handleSelectUserForMapping = async (userId: string) => {
        setSelectedUserId(userId);
        setMappedStoreIds([]);
        setMappedWarehouseIds([]);

        if (!createdCompanyId || !userId) return;

        try {
            const res = await getUserAccessMappingService(createdCompanyId, userId);
            if (res.success === 200 && res.data) {
                setMappedStoreIds(res.data.stores.map((s) => s.id));
                setMappedWarehouseIds(res.data.warehouses.map((w) => w.id));
            }
        } catch { /* fresh mapping */ }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            if (useApi) {
                const ok = await persistCompanyStep();
                if (!ok) {
                    return;
                }
                showSuccess(
                    isEditMode ? 'Company updated (API wiring coming soon)' : 'Company setup complete'
                );
                navigate(COMPANY_PATHS.LIST);
                return;
            }

            const companyId = uid('company');
            const payload = {
                id: uid('companyWizard'),
                timestamp: new Date().toISOString(),
                useApi,
                companyId,
                company,
                stores,
                warehouses,
                users,
                mapping: { storeIds: mappedStoreIds, warehouseIds: mappedWarehouseIds },
            };
            const existingStr = localStorage.getItem('CompanySetupWizardData');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            existing.push(payload);
            localStorage.setItem('CompanySetupWizardData', JSON.stringify(existing));
            showSuccess('Company wizard saved locally.');
            navigate(COMPANY_PATHS.LIST);
        } catch {
            showError(useApi ? 'Failed to create company' : 'Failed to save wizard data locally');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        const check = canProceedStep();
        if (!check.ok) {
            showError(check.message);
            return;
        }

        if (useApi && activeStep === 0) {
            setLoading(true);
            try {
                const ok = await persistCompanyStep();
                if (ok) {
                    setActiveStep(1);
                }
            } catch {
                showError(isEditMode ? 'Failed to update company' : 'Failed to create company');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (useApi && activeStep === 1) {
            setActiveStep(2);
            return;
        }

        if (useApi && activeStep === 2) {
            setActiveStep(3);
            return;
        }

        if (useApi && activeStep === 3) {
            setActiveStep(4);
            return;
        }

        if (useApi && activeStep === 4) {
            setLoading(true);
            try {
                const ok = await persistUserAccessStep();
                if (ok) {
                    await handleFinish();
                }
            } catch {
                showError('Failed to save user access mapping');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (activeStep < steps.length - 1) {
            setActiveStep((p) => p + 1);
            return;
        }

        await handleFinish();
    };

    const renderStepContent = () => {

        /* ── Step 0: Company & Plan ─────────────────────────────── */
        if (activeStep === 0) return (
            <Box>
                <WizardStepHeader
                    icon={<BusinessIcon />}
                    title="Company"
                    description={
                        useApi
                            ? isEditMode
                                ? 'Update company name, description, and plan. Save & Next calls the update API.'
                                : 'Company name is required. Plan and description are optional.'
                            : 'Add company basics and choose a subscription plan.'
                    }
                />

                <Stack spacing={2.5}>
                    <TextField
                        fullWidth
                        label="Company Name"
                        value={company.name}
                        onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))}
                        required
                        placeholder="e.g., Tailor Studio"
                        sx={fieldSx}
                    />
                    <TextField
                        fullWidth
                        label="Description (optional)"
                        value={company.description}
                        onChange={(e) => setCompany((p) => ({ ...p, description: e.target.value }))}
                        multiline
                        rows={3}
                        sx={fieldSx}
                    />
                    <Box>
                        <Typography fontWeight={600} fontSize="0.85rem" color="#555" sx={{ mb: 1 }}>
                            Company Logo (optional)
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                            {(logoPreview || existingLogoUrl) && (
                                <Box
                                    component="img"
                                    src={logoPreview || existingLogoUrl || undefined}
                                    alt="Company logo preview"
                                    sx={{
                                        width: 72,
                                        height: 72,
                                        objectFit: 'cover',
                                        borderRadius: '12px',
                                        border: `1px solid ${WIZARD_BORDER_SUBTLE}`,
                                    }}
                                />
                            )}
                            <Button variant="outlined" component="label" sx={addBtnSx}>
                                {logoPreview || existingLogoUrl ? 'Change Logo' : 'Upload Logo'}
                                <input hidden accept="image/*" type="file" onChange={handleLogoChange} />
                            </Button>
                        </Stack>
                    </Box>
                    <TextField
                        select
                        fullWidth
                        label="Plan (optional)"
                        value={company.planId}
                        onChange={(e) => setCompany((p) => ({ ...p, planId: e.target.value }))}
                        sx={fieldSx}
                        helperText={
                            useApi
                                ? isEditMode
                                    ? 'Public plans and private plans owned by this company are listed. Leave empty to clear the plan.'
                                    : 'Only public plans are listed. Leave empty to create the company without a plan.'
                                : 'Only public plans are listed here. Company-specific plans are assigned after the company is created.'
                        }
                    >
                        <MenuItem value="">
                            <em>-- Select Plan --</em>
                        </MenuItem>
                        {plansList.map((pl) => (
                            <MenuItem key={pl.id} value={pl.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        label={pl.name}
                                        size="small"
                                        sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                                    />
                                    <Chip label="Public" size="small" variant="outlined" color="primary" />
                                    {pl.description ? (
                                        <Typography variant="caption" color="text.secondary">
                                            {pl.description}
                                        </Typography>
                                    ) : null}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>
            </Box>
        );

        /* ── Step 1: Stores & Warehouses ────────────────────────── */
        if (activeStep === 1) return (
            <Box>
                <WizardStepHeader
                    icon={<StoreIcon />}
                    title="Stores & Warehouses"
                    description="Add one or more stores and warehouses for this company."
                />

                <Stack spacing={2.5}>
                    {/* ── Stores ── */}
                    <Paper elevation={0} sx={wizardSectionPaperSx}>
                        <Box sx={sectionHeaderSx}>
                            <StoreIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                            <Typography fontWeight={700} fontSize="0.9rem" color="#333">Stores</Typography>
                            <Chip label={stores.length} size="small"
                                sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.7rem', ml: 'auto' }}
                            />
                        </Box>
                        <Stack spacing={1.5}>
                            {stores.map((s, idx) => {
                                const isPersisted = persistedStoreIds.has(s.id);
                                return (
                                <Paper key={s.id} elevation={0} sx={itemCardSx}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography fontWeight={700} fontSize="0.82rem" color="#555">
                                            Store {idx + 1}{isPersisted ? ' (saved)' : ''}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {useApi && (
                                                <Button
                                                    variant="outlined" size="small"
                                                    onClick={() => isPersisted ? handleUpdateStore(s) : handleCreateStore(s)}
                                                    disabled={loading || !s.name.trim()}
                                                    sx={{
                                                        ...addBtnSx, fontSize: '0.75rem', px: 1.5, py: 0.5,
                                                        borderColor: PRIMARY, color: PRIMARY,
                                                    }}
                                                >
                                                    {isPersisted ? 'Save' : 'Create'}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outlined" color="error" size="small"
                                                startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                                                onClick={() => {
                                                    if (useApi && isPersisted) {
                                                        void handleDeleteStore(s.id);
                                                        return;
                                                    }
                                                    setStores((prev) => prev.filter((x) => x.id !== s.id));
                                                    setMappedStoreIds((prev) => prev.filter((id) => id !== s.id));
                                                }}
                                                disabled={stores.length === 1 && persistedStoreIds.size === 0}
                                                sx={removeBtnSx}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Stack spacing={1.5}>
                                        <TextField fullWidth label="Store Name" value={s.name} required size="small"
                                            onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))}
                                            sx={fieldSx}
                                        />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                            <TextField fullWidth label="Address Line 1" value={s.address.addressLine1} size="small"
                                                onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, address: { ...x.address, addressLine1: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="Address Line 2" value={s.address.addressLine2} size="small"
                                                onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, address: { ...x.address, addressLine2: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="City" value={s.address.city} size="small"
                                                onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, address: { ...x.address, city: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="State" value={s.address.state} size="small"
                                                onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, address: { ...x.address, state: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="Pincode" value={s.address.pincode} size="small"
                                                onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, address: { ...x.address, pincode: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="Phone" value={s.address.phone} size="small"
                                                onChange={(e) => setStores((prev) => prev.map((x) => x.id === s.id ? { ...x, address: { ...x.address, phone: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                        </Box>
                                    </Stack>
                                </Paper>
                            );
                            })}
                            <Button variant="outlined" startIcon={<AddIcon />} sx={addBtnSx}
                                onClick={() => setStores((prev) => [...prev, { id: uid('store'), name: '', address: emptyAddress() }])}
                            >
                                Add Store
                            </Button>
                        </Stack>
                    </Paper>

                    {/* ── Warehouses ── */}
                    <Paper elevation={0} sx={wizardSectionPaperSx}>
                        <Box sx={sectionHeaderSx}>
                            <WarehouseIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                            <Typography fontWeight={700} fontSize="0.9rem" color="#333">Warehouses</Typography>
                            <Chip label={warehouses.length} size="small"
                                sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.7rem', ml: 'auto' }}
                            />
                        </Box>
                        <Stack spacing={1.5}>
                            {warehouses.map((w, idx) => {
                                const isPersisted = persistedWarehouseIds.has(w.id);
                                return (
                                <Paper key={w.id} elevation={0} sx={itemCardSx}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography fontWeight={700} fontSize="0.82rem" color="#555">
                                            Warehouse {idx + 1}{isPersisted ? ' (saved)' : ''}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {useApi && (
                                                <Button
                                                    variant="outlined" size="small"
                                                    onClick={() => isPersisted ? handleUpdateWarehouse(w) : handleCreateWarehouse(w)}
                                                    disabled={loading || !w.name.trim()}
                                                    sx={{
                                                        ...addBtnSx, fontSize: '0.75rem', px: 1.5, py: 0.5,
                                                        borderColor: PRIMARY, color: PRIMARY,
                                                    }}
                                                >
                                                    {isPersisted ? 'Save' : 'Create'}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outlined" color="error" size="small"
                                                startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                                                onClick={() => {
                                                    if (useApi && isPersisted) {
                                                        void handleDeleteWarehouse(w.id);
                                                        return;
                                                    }
                                                    setWarehouses((prev) => prev.filter((x) => x.id !== w.id));
                                                    setMappedWarehouseIds((prev) => prev.filter((id) => id !== w.id));
                                                }}
                                                disabled={warehouses.length === 1 && persistedWarehouseIds.size === 0}
                                                sx={removeBtnSx}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Stack spacing={1.5}>
                                        <TextField fullWidth label="Warehouse Name" value={w.name} required size="small"
                                            onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, name: e.target.value } : x))}
                                            sx={fieldSx}
                                        />
                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                            <TextField fullWidth label="Address Line 1" value={w.address.addressLine1} size="small"
                                                onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, address: { ...x.address, addressLine1: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="Address Line 2" value={w.address.addressLine2} size="small"
                                                onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, address: { ...x.address, addressLine2: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="City" value={w.address.city} size="small"
                                                onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, address: { ...x.address, city: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="State" value={w.address.state} size="small"
                                                onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, address: { ...x.address, state: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="Pincode" value={w.address.pincode} size="small"
                                                onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, address: { ...x.address, pincode: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                            <TextField fullWidth label="Phone" value={w.address.phone} size="small"
                                                onChange={(e) => setWarehouses((prev) => prev.map((x) => x.id === w.id ? { ...x, address: { ...x.address, phone: e.target.value } } : x))}
                                                sx={fieldSx}
                                            />
                                        </Box>
                                    </Stack>
                                </Paper>
                            );
                            })}
                            <Button variant="outlined" startIcon={<AddIcon />} sx={addBtnSx}
                                onClick={() => setWarehouses((prev) => [...prev, { id: uid('warehouse'), name: '', address: emptyAddress() }])}
                            >
                                Add Warehouse
                            </Button>
                        </Stack>
                    </Paper>
                </Stack>
            </Box>
        );

        /* ── Step 2: Company Roles ────────────────────────────── */
        if (activeStep === 2) {
            if (inlineEditingRoleId) {
                return (
                    <RoleSetupWizard
                        inlineRoleId={inlineEditingRoleId}
                        onInlineClose={() => setInlineEditingRoleId(null)}
                        companyId={createdCompanyId ?? editCompanyId ?? null}
                    />
                );
            }

            const selectedPlan = plansList.find((p) => p.id === company.planId);
            const planText = selectedPlan ? `${selectedPlan.name} Plan` : 'No plan selected';

            return (
                <Box>
                    <WizardStepHeader
                        icon={<StoreIcon />}
                        title="Company Roles"
                        description={`Manage roles specifically for this company. Selected subscription: ${planText}.`}
                    />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'flex-start' }}>
                        <Paper elevation={0} sx={{ ...wizardSectionPaperSx, flex: 1, width: '100%' }}>
                            <Box sx={sectionHeaderSx}>
                                <Typography fontWeight={700} fontSize="0.9rem" color="#333">
                                    Global Roles Import
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleFetchGlobalRoles}
                                    disabled={loading}
                                    sx={{ ml: 'auto', borderRadius: '8px', textTransform: 'none' }}
                                >
                                    Fetch Global Roles
                                </Button>
                            </Box>
                            {showGlobalRolesList && globalRolesForImport.length > 0 && (
                                <Stack spacing={1} sx={{ mt: 2 }}>
                                    {globalRolesForImport.map((gRole) => (
                                        <Paper key={gRole.id} elevation={0} sx={{ ...itemCardSx, bgcolor: 'rgba(102,126,234,0.04)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography fontWeight={600} fontSize="0.85rem">{gRole.name}</Typography>
                                                <Typography fontSize="0.75rem" color="text.secondary">
                                                    {gRole.description}
                                                </Typography>

                                                <Chip
                                                    label={`Hierarchy: ${gRole.hierarchy}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.72rem', height: 20 }}
                                                />
                                                <Chip
                                                    label={`${gRole._count?.permissions || gRole.permissions?.length || 0} permissions`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.72rem', height: 20 }}
                                                />
                                                <Button
                                                    variant="contained" color="secondary" size="small"
                                                    onClick={() => handleImportSingleRole(gRole)}
                                                    disabled={loading}
                                                    sx={{ ml: 'auto', borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}
                                                >
                                                    Save to Company
                                                </Button>
                                            </Box>
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                            {showGlobalRolesList && globalRolesForImport.length === 0 && (
                                <Typography fontSize="0.8rem" color="text.secondary" sx={{ mt: 2 }}>
                                    No public global roles available to import.
                                </Typography>
                            )}
                        </Paper>

                        <Paper elevation={0} sx={{ ...wizardSectionPaperSx, flex: 1, width: '100%' }}>
                            <Box sx={sectionHeaderSx}>
                                <Typography fontWeight={700} fontSize="0.9rem" color="#333">
                                    Company Roles
                                </Typography>
                                <Chip label={companyRoles.length} size="small"
                                    sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.7rem', ml: 1 }}
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenRoleDialog('create')}
                                    disabled={loading}
                                    sx={{ ...addBtnSx, ml: 'auto' }}
                                >
                                    Add Custom Role
                                </Button>
                            </Box>

                            {companyRoles.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No roles configured for this company yet. Click "Fetch Global Roles" or "Add Custom Role" to get started.
                                    </Typography>
                                </Box>
                            ) : (
                                <Stack spacing={1.5}>
                                    {companyRoles.map((role) => {
                                        const permCount = role._count?.permissions || role.permissions?.length || 0;
                                        return (
                                            <Paper key={role.id} elevation={0} sx={{ ...itemCardSx, bgcolor: 'rgba(102,126,234,0.04)' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography fontWeight={600} fontSize="0.875rem">{role.name}</Typography>
                                                        {role.description && (
                                                            <Typography fontSize="0.75rem" color="text.secondary">{role.description}</Typography>
                                                        )}
                                                    </Box>
                                                    <Chip
                                                        label={`Hierarchy: ${role.hierarchy}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.72rem', height: 20 }}
                                                    />
                                                    <Chip
                                                        label={`${permCount} permissions`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.72rem', height: 20 }}
                                                    />
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setInlineEditingRoleId(role.id)}
                                                            disabled={loading}
                                                            sx={{ color: PRIMARY }}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteRole(role.id)}
                                                            disabled={loading}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Paper>
                    </Box>
                </Box>
            );
        }

        /* ── Step 3: Users ───────────────────────────────────────── */
        if (activeStep === 3) return (
            <Box>
                <WizardStepHeader
                    icon={<PersonIcon />}
                    title="Create Users"
                    description="Add one or more users to this company. Each user gets a role via UserRole mapping."
                />

                <Stack spacing={2.5}>
                    {/* New user drafts */}
                    <Paper elevation={0} sx={wizardSectionPaperSx}>
                        <Box sx={sectionHeaderSx}>
                            <PersonIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                            <Typography fontWeight={700} fontSize="0.9rem" color="#333">New Users</Typography>
                            <Chip label={users.length} size="small"
                                sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.7rem', ml: 'auto' }}
                            />
                        </Box>
                        <Stack spacing={1.5}>
                            {users.map((u, idx) => (
                                <Paper key={u.id} elevation={0} sx={itemCardSx}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography fontWeight={700} fontSize="0.82rem" color="#555">
                                            User {createdUsers.length + idx + 1}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {useApi && (
                                                <Button
                                                    variant="outlined" size="small"
                                                    onClick={() => handleCreateUser(u)}
                                                    disabled={loading || !u.fullName.trim() || !u.emailId.trim() || !u.password.trim() || !u.roleId}
                                                    sx={{
                                                        ...addBtnSx, fontSize: '0.75rem', px: 1.5, py: 0.5,
                                                        borderColor: PRIMARY, color: PRIMARY,
                                                    }}
                                                >
                                                    Create
                                                </Button>
                                            )}
                                            <Button
                                                variant="outlined" color="error" size="small"
                                                startIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                                                onClick={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}
                                                disabled={users.length === 1 && createdUsers.length === 0}
                                                sx={removeBtnSx}
                                            >
                                                Remove
                                            </Button>
                                        </Box>
                                    </Box>
                                    <Stack spacing={1.5}>
                                        <TextField fullWidth label="Full Name" value={u.fullName} required size="small"
                                            onChange={(e) => setUsers((prev) =>
                                                prev.map((x) => x.id === u.id ? { ...x, fullName: e.target.value } : x)
                                            )}
                                            sx={fieldSx}
                                        />
                                        <TextField fullWidth label="Email" value={u.emailId} required size="small"
                                            onChange={(e) => setUsers((prev) =>
                                                prev.map((x) => x.id === u.id ? { ...x, emailId: e.target.value } : x)
                                            )}
                                            autoComplete="off"
                                            inputProps={{ autoComplete: 'new-password' }}
                                            sx={fieldSx}
                                        />
                                        <TextField fullWidth
                                            type={showPasswords[u.id] ? 'text' : 'password'}
                                            label="Password" value={u.password} required size="small"
                                            onChange={(e) => setUsers((prev) =>
                                                prev.map((x) => x.id === u.id ? { ...x, password: e.target.value } : x)
                                            )}
                                            autoComplete="off"
                                            inputProps={{ autoComplete: 'new-password' }}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setShowPasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                                                            edge="end"
                                                        >
                                                            {showPasswords[u.id] ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={fieldSx}
                                        />
                                        <TextField
                                            select fullWidth label="Role" value={u.roleId} required size="small"
                                            onChange={(e) => setUsers((prev) =>
                                                prev.map((x) => x.id === u.id ? { ...x, roleId: e.target.value } : x)
                                            )}
                                            sx={fieldSx}
                                        >
                                            <MenuItem value=""><em>-- Select Role --</em></MenuItem>
                                            {rolesList.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                        </TextField>
                                    </Stack>
                                </Paper>
                            ))}
                            <Button variant="outlined" startIcon={<AddIcon />} sx={addBtnSx}
                                onClick={() => setUsers((prev) => [
                                    ...prev,
                                    { id: uid('user'), fullName: '', emailId: '', password: '', roleId: '' },
                                ])}
                            >
                                Add User
                            </Button>
                        </Stack>
                    </Paper>

                    {/* Created users (below new users) with edit */}
                    {createdUsers.length > 0 && (
                        <Paper elevation={0} sx={wizardSectionPaperSx}>
                            <Box sx={sectionHeaderSx}>
                                <PersonIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                                <Typography fontWeight={700} fontSize="0.9rem" color="#333">Created Users</Typography>
                                <Chip label={createdUsers.length} size="small"
                                    sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 700, height: 20, fontSize: '0.7rem', ml: 'auto' }}
                                />
                            </Box>
                            <Stack spacing={1}>
                                {createdUsers.map((u) => {
                                    const isEditing = editingUserId === u.userId;

                                    if (isEditing) {
                                        return (
                                            <Paper key={u.userId} elevation={0} sx={{ ...itemCardSx, border: `1.5px solid ${PRIMARY}` }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                                    <Typography fontWeight={700} fontSize="0.82rem" color={PRIMARY}>
                                                        Editing · {u.emailId}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Button
                                                            variant="outlined" size="small"
                                                            startIcon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                                                            onClick={handleSaveEditUser}
                                                            disabled={loading || !editForm.fullName.trim() || !editForm.roleId}
                                                            sx={{
                                                                ...addBtnSx, fontSize: '0.75rem', px: 1.5, py: 0.5,
                                                                borderColor: PRIMARY, color: PRIMARY,
                                                            }}
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            variant="outlined" size="small"
                                                            startIcon={<CloseIcon sx={{ fontSize: '14px !important' }} />}
                                                            onClick={handleCancelEditUser}
                                                            disabled={loading}
                                                            sx={removeBtnSx}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Box>
                                                </Box>
                                                <Stack spacing={1.5}>
                                                    <TextField fullWidth label="Full Name" value={editForm.fullName} required size="small"
                                                        onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))}
                                                        sx={fieldSx}
                                                    />
                                                    <TextField fullWidth label="Email" value={u.emailId} size="small" disabled sx={fieldSx} />
                                                    <TextField
                                                        select fullWidth label="Role" value={editForm.roleId} required size="small"
                                                        onChange={(e) => setEditForm((p) => ({ ...p, roleId: e.target.value }))}
                                                        sx={fieldSx}
                                                    >
                                                        <MenuItem value=""><em>-- Select Role --</em></MenuItem>
                                                        {rolesList.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                                    </TextField>
                                                </Stack>
                                            </Paper>
                                        );
                                    }

                                    return (
                                        <Paper key={u.userId} elevation={0}
                                            sx={{ ...itemCardSx, bgcolor: 'rgba(102,126,234,0.04)' }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography fontWeight={600} fontSize="0.85rem">{u.fullName}</Typography>
                                                <Typography fontSize="0.78rem" color="text.secondary">{u.emailId}</Typography>
                                                <Chip label={u.roleName} size="small" variant="outlined" color="primary"
                                                    sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                                                />
                                                {useApi && (
                                                    <Button
                                                        variant="outlined" size="small"
                                                        startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
                                                        onClick={() => handleStartEditUser(u)}
                                                        disabled={loading || editingUserId !== null}
                                                        sx={{
                                                            ...addBtnSx, ml: 'auto', fontSize: '0.75rem', px: 1.5, py: 0.5,
                                                            borderColor: PRIMARY, color: PRIMARY,
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                            </Box>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Box>
        );

        /* ── Step 4: User Mapping ────────────────────────────────── */
        if (activeStep === 4) {
            const userOptions = useApi
                ? createdUsers
                : users.filter((u) => u.fullName.trim());

            const storeOptions = useApi ? createdStores.map((s) => ({ id: s.id, name: s.name })) : stores;
            const warehouseOptions = useApi ? createdWarehouses.map((w) => ({ id: w.id, name: w.name })) : warehouses;

            return (
                <Box>
                    <WizardStepHeader
                        icon={<MappingIcon />}
                        title="User Mapping"
                        description="Select a user, then choose which stores and warehouses they can access."
                    />

                    <Stack spacing={2.5}>
                        {/* User selector */}
                        <TextField
                            select fullWidth label="Select User"
                            value={useApi ? selectedUserId : (selectedUserId || users[0]?.id || '')}
                            onChange={(e) => {
                                if (useApi) {
                                    void handleSelectUserForMapping(e.target.value);
                                } else {
                                    setSelectedUserId(e.target.value);
                                    setMappedStoreIds([]);
                                    setMappedWarehouseIds([]);
                                }
                            }}
                            sx={fieldSx}
                        >
                            <MenuItem value=""><em>-- Select User --</em></MenuItem>
                            {userOptions.map((u) => {
                                const id = 'userId' in u ? u.userId : u.id;
                                const label = `${u.fullName} (${u.emailId})`;
                                return <MenuItem key={id} value={id}>{label}</MenuItem>;
                            })}
                        </TextField>

                        {/* Store mapping */}
                        <Paper elevation={0} sx={wizardSectionPaperSx}>
                            <Box sx={sectionHeaderSx}>
                                <StoreIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                                <Typography fontWeight={700} fontSize="0.9rem" color="#333">Stores</Typography>
                                {mappedStoreIds.length > 0 && (
                                    <Chip label={`${mappedStoreIds.length} selected`} size="small"
                                        sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 600, height: 20, fontSize: '0.7rem', ml: 'auto' }}
                                    />
                                )}
                            </Box>
                            <FormControl component="fieldset" fullWidth>
                                <FormGroup>
                                    {storeOptions.map((s) => (
                                        <FormControlLabel
                                            key={s.id}
                                            control={
                                                <Checkbox
                                                    checked={mappedStoreIds.includes(s.id)}
                                                    onChange={(e) => setMappedStoreIds((prev) =>
                                                        e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                                                    )}
                                                    sx={{ color: PRIMARY, '&.Mui-checked': { color: PRIMARY } }}
                                                />
                                            }
                                            label={
                                                <Typography fontSize="0.875rem" fontWeight={mappedStoreIds.includes(s.id) ? 600 : 400}>
                                                    {s.name?.trim() ? s.name : s.id}
                                                </Typography>
                                            }
                                            sx={{
                                                p: 1, borderRadius: '8px', mx: 0,
                                                bgcolor: mappedStoreIds.includes(s.id) ? 'rgba(102,126,234,0.06)' : 'transparent',
                                                transition: 'background 0.2s',
                                            }}
                                        />
                                    ))}
                                </FormGroup>
                            </FormControl>
                        </Paper>

                        {/* Warehouse mapping */}
                        <Paper elevation={0} sx={wizardSectionPaperSx}>
                            <Box sx={sectionHeaderSx}>
                                <WarehouseIcon sx={{ color: PRIMARY, fontSize: 18 }} />
                                <Typography fontWeight={700} fontSize="0.9rem" color="#333">Warehouses</Typography>
                                {mappedWarehouseIds.length > 0 && (
                                    <Chip label={`${mappedWarehouseIds.length} selected`} size="small"
                                        sx={{ bgcolor: PRIMARY, color: '#fff', fontWeight: 600, height: 20, fontSize: '0.7rem', ml: 'auto' }}
                                    />
                                )}
                            </Box>
                            <FormControl component="fieldset" fullWidth>
                                <FormGroup>
                                    {warehouseOptions.map((w) => (
                                        <FormControlLabel
                                            key={w.id}
                                            control={
                                                <Checkbox
                                                    checked={mappedWarehouseIds.includes(w.id)}
                                                    onChange={(e) => setMappedWarehouseIds((prev) =>
                                                        e.target.checked ? [...prev, w.id] : prev.filter((id) => id !== w.id)
                                                    )}
                                                    sx={{ color: PRIMARY, '&.Mui-checked': { color: PRIMARY } }}
                                                />
                                            }
                                            label={
                                                <Typography fontSize="0.875rem" fontWeight={mappedWarehouseIds.includes(w.id) ? 600 : 400}>
                                                    {w.name?.trim() ? w.name : w.id}
                                                </Typography>
                                            }
                                            sx={{
                                                p: 1, borderRadius: '8px', mx: 0,
                                                bgcolor: mappedWarehouseIds.includes(w.id) ? 'rgba(102,126,234,0.06)' : 'transparent',
                                                transition: 'background 0.2s',
                                            }}
                                        />
                                    ))}
                                </FormGroup>
                            </FormControl>
                        </Paper>

                        {/* Save button for current user (API mode) */}
                        {useApi && selectedUserId && (
                            <Button
                                variant="outlined"
                                onClick={async () => {
                                    setLoading(true);
                                    try {
                                        await persistUserAccessStep();
                                    } catch {
                                        showError('Failed to save user access');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading || (mappedStoreIds.length === 0 && mappedWarehouseIds.length === 0)}
                                sx={{
                                    ...addBtnSx,
                                    borderColor: PRIMARY,
                                    alignSelf: 'flex-end',
                                }}
                            >
                                Save Access for This User
                            </Button>
                        )}
                    </Stack>
                </Box>
            );
        }

        return null;
    };

    return (
        <WizardLayout
            title={isEditMode ? 'Edit Company Wizard' : 'Company Setup Wizard'}
            steps={steps}
            activeStep={activeStep}
            onNext={handleNext}
            onBack={handleBack}
            onStepClick={(i) => setActiveStep(i)}
            parentBackLabel="Companies"
            onParentBack={() => navigate(COMPANY_PATHS.LIST)}
            loading={loading}
            nextButtonText={useApi ? 'Save & Next' : 'Next'}
            finishButtonText={
                useApi ? (isEditMode ? 'Update company' : 'Finish setup') : 'Finish (Save Local)'
            }
            extraActions={
                !useApi ? (
                    <Button
                        variant="outlined" disabled={loading}
                        onClick={() => {
                            const snapshot = {
                                id: uid('companyWizardDraft'),
                                timestamp: new Date().toISOString(),
                                company, stores, warehouses, rolesList, users,
                                mapping: { mappedStoreIds, mappedWarehouseIds },
                            };
                            localStorage.setItem('CompanySetupWizardDraft', JSON.stringify(snapshot));
                            showSuccess('Draft saved locally');
                        }}
                        sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                            fontSize: '0.875rem', borderColor: 'rgba(102,126,234,0.4)', color: PRIMARY,
                            '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(102,126,234,0.06)' },
                        }}
                    >
                        Save Draft
                    </Button>
                ) : undefined
            }
        >
            {renderStepContent()}
            <Dialog
                open={isRoleDialogOpen}
                onClose={() => setIsRoleDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '12px' }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f0f0f0', pb: 1.5 }}>
                    {roleDialogMode === 'create' ? 'Create Custom Role' : 'Edit Company Role'}
                </DialogTitle>
                <DialogContent sx={{ mt: 2, pb: 1 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Role Name"
                            size="small"
                            value={roleForm.name}
                            onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                            required
                            sx={fieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            size="small"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                            multiline
                            rows={2}
                            sx={fieldSx}
                        />
                        <TextField
                            fullWidth
                            label="Hierarchy Level (Lower = Stronger authority)"
                            type="number"
                            size="small"
                            value={roleForm.hierarchy}
                            onChange={(e) => setRoleForm((p) => ({ ...p, hierarchy: Number(e.target.value) }))}
                            required
                            helperText="Hierarchy must be greater than your own hierarchy level."
                            sx={fieldSx}
                        />

                        <Divider sx={{ my: 1 }} />
                        <Typography fontWeight={700} fontSize="0.875rem" color="#333">
                            Assign Module Permissions (Filtered by plan)
                        </Typography>

                        <Stack spacing={2} sx={{ maxHeight: '350px', overflowY: 'auto', pr: 1 }}>
                            {Object.keys(permissionsCatalog)
                                .filter((moduleName) => {
                                    if (!planModuleIds) return true;
                                    const perms = permissionsCatalog[moduleName] || [];
                                    const moduleId = perms[0]?.moduleId;
                                    return !moduleId || planModuleIds.includes(moduleId);
                                })
                                .map((moduleName) => {
                                    const perms = permissionsCatalog[moduleName] || [];
                                    const visiblePerms = perms.filter((p) => {
                                        if (!planFeatureIds || !p.featureId) return true;
                                        return planFeatureIds.includes(p.featureId);
                                    });

                                    if (visiblePerms.length === 0) return null;

                                    return (
                                        <Box key={moduleName} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <Typography fontWeight={600} fontSize="0.82rem" color={PRIMARY} sx={{ mb: 1 }}>
                                                {moduleName} Module
                                            </Typography>
                                            <FormGroup row>
                                                {visiblePerms.map((perm) => {
                                                    const isChecked = roleForm.selectedPermissionIds.includes(perm.id);
                                                    return (
                                                        <FormControlLabel
                                                            key={perm.id}
                                                            control={
                                                                <Checkbox
                                                                    checked={isChecked}
                                                                    size="small"
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setRoleForm((p) => ({
                                                                            ...p,
                                                                            selectedPermissionIds: checked
                                                                                ? [...p.selectedPermissionIds, perm.id]
                                                                                : p.selectedPermissionIds.filter((id) => id !== perm.id)
                                                                        }));
                                                                    }}
                                                                    sx={{ color: PRIMARY, '&.Mui-checked': { color: PRIMARY } }}
                                                                />
                                                            }
                                                            label={
                                                                <Typography fontSize="0.78rem">
                                                                    {perm.description || `${perm.apiMethod} ${perm.apiRoute}`}
                                                                </Typography>
                                                            }
                                                            sx={{ width: '48%', mr: '2%', my: 0.2 }}
                                                        />
                                                    );
                                                })}
                                            </FormGroup>
                                        </Box>
                                    );
                                })}
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
                    <Button
                        variant="outlined"
                        onClick={() => setIsRoleDialogOpen(false)}
                        disabled={loading}
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveRole}
                        disabled={loading || !roleForm.name.trim()}
                        sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: PRIMARY, color: '#fff', '&:hover': { bgcolor: PRIMARY } }}
                    >
                        Save Role
                    </Button>
                </DialogActions>
            </Dialog>
            <Divider sx={{ mt: 3, opacity: 0 }} />
        </WizardLayout>
    );
};

export default CompanySetupWizard;
