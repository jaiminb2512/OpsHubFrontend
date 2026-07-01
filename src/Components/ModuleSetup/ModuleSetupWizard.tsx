import { useEffect, useMemo, useState } from 'react';
import { Button } from '@mui/material';
import { useToast } from '../../Utils/ToastContext';
import { WizardLayout } from '../Common/Wizard';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { useWizardStepInUrl } from '../../hooks/useWizardStepInUrl';
import {
    fetchAllModulesWizardService,
    getApiEndpointsWizardService,
    getFeaturesWizardService,
    getMenusWizardService,
    getModuleWizardDetailsWizardService,
    createModuleWizardService,
    saveApiPermissionMenuWizardService,
} from '../../Services/ApiServices/moduleSetupWizardServices';
import {
    moduleWizardSteps,
    createEmptyEndpointRow,
    buildEndpointRowsFromWizardDetails,
    buildBatchPayload,
    formatKeyInput,
    validateWizardEndpointRows,
    type WizardApiEndpointRow,
} from './moduleWizardShared';
import { ModuleWizardStepModuleForm } from './ModuleWizardStepModuleForm';
import { ModuleWizardStepApiPermissionMenu } from './ModuleWizardStepApiPermissionMenu';
import {
    isWizardUseApiEnabled,
    loadModuleSetupWizardMock,
    useWizardMockData,
} from '../../mockData/wizardMockData';

type ModuleOption = { id: string; label?: string; name?: string };
type ApiEndpointOption = { id: string; method: string; path: string; key?: string };
type FeatureOption = { id: string; name: string; key?: string };
type MenuOption = { id: string; label: string };

const steps = [...moduleWizardSteps];

const ModuleSetupWizard = () => {
    const { showSuccess, showError } = useToast();

    const permissions = usePagePermissions([
        { key: 'createModule', endpointKey: 'createModuleOnly' },
        { key: 'saveApiPermissionMenu', endpointKey: 'saveFeatureApiPermissionMenuModuleSetUp' },
    ]);
    const canCreateModule = permissions.createModule;
    const canSaveApiPermissionMenu = permissions.saveApiPermissionMenu;

    const useApi = useMemo(() => isWizardUseApiEnabled(), []);

    const {
        data: moduleMock,
        loading: moduleMockLoading,
        error: moduleMockError,
    } = useWizardMockData(!useApi, loadModuleSetupWizardMock);

    const { activeStep, setActiveStep } = useWizardStepInUrl(steps.length);
    const [loading, setLoading] = useState(false);

    const [modulesList, setModulesList] = useState<ModuleOption[]>([]);
    const [apiList, setApiList] = useState<ApiEndpointOption[]>([]);
    const [menuList, setMenuList] = useState<MenuOption[]>([]);
    const [parentMenuList, setParentMenuList] = useState<MenuOption[]>([]);
    const [featuresList, setFeaturesList] = useState<FeatureOption[]>([]);

    useEffect(() => {
        if (!moduleMock) return;
        setModulesList([...moduleMock.modulesList]);
        setApiList([...moduleMock.apiList]);
        setMenuList([...moduleMock.menuList]);
        setFeaturesList([...moduleMock.featuresList]);
    }, [moduleMock]);

    useEffect(() => {
        if (moduleMockError) {
            showError('Failed to load module wizard mock data');
        }
    }, [moduleMockError, showError]);

    const [moduleMode, setModuleMode] = useState<'create' | 'select'>('create');
    const [moduleData, setModuleData] = useState({ id: '', name: '', description: '', isPublic: true, projectId: '' });

    const [endpointRows, setEndpointRows] = useState<WizardApiEndpointRow[]>(() => [createEmptyEndpointRow()]);

    useEffect(() => {
        if (!useApi || moduleMode !== 'select') return;
        fetchAllModulesWizardService()
            .then((rows) => setModulesList(rows))
            .catch(() => {});
    }, [useApi, moduleMode]);

    const loadWizardFeaturesList = () => {
        getFeaturesWizardService()
            .then((r) => setFeaturesList(r.data ?? []))
            .catch(() => {});
    };

    useEffect(() => {
        if (!useApi || activeStep !== 1) return;

        loadWizardFeaturesList();

        getMenusWizardService()
            .then((r) => setParentMenuList(r.data ?? []))
            .catch(() => {});

        if (!moduleData.id) {
            setEndpointRows([createEmptyEndpointRow()]);
            getApiEndpointsWizardService()
                .then((r) => setApiList(r.data ?? []))
                .catch(() => {});
            getMenusWizardService()
                .then((r) => setMenuList(r.data ?? []))
                .catch(() => {});
            return;
        }

        const requestedModuleId = moduleData.id;
        getModuleWizardDetailsWizardService(requestedModuleId)
            .then((res) => {
                const d = res.data;
                if (!d || d.module.id !== requestedModuleId) return;
                setApiList(d.apiEndpoints ?? []);
                setMenuList(d.menus ?? []);
                setModuleData((prev) =>
                    prev.id === requestedModuleId
                        ? {
                              ...prev,
                              name: d.module.name,
                              description: d.module.description ?? '',
                          }
                        : prev
                );
                setEndpointRows(buildEndpointRowsFromWizardDetails(d));
            })
            .catch(() => {
                getApiEndpointsWizardService()
                    .then((r) => setApiList(r.data ?? []))
                    .catch(() => {});
                getMenusWizardService()
                    .then((r) => {
                        setMenuList(r.data ?? []);
                    })
                    .catch(() => {});
                setEndpointRows([createEmptyEndpointRow()]);
            });
    }, [useApi, activeStep, moduleData.id]);

    const patchEndpointRow = (clientId: string, patch: Partial<WizardApiEndpointRow>) => {
        setEndpointRows((rows) =>
            rows.map((r) => {
                if (r.clientId !== clientId) return r;
                let next = { ...r, ...patch };
                if (
                    patch.key !== undefined &&
                    next.apiSourceMode === 'create' &&
                    next.featureMode === 'create' &&
                    !next.featureKeyUnlinked
                ) {
                    next = { ...next, featureKey: formatKeyInput(String(patch.key)) };
                }
                return next;
            })
        );
    };

    const addEndpointRow = () => {
        setEndpointRows((rows) => [...rows, createEmptyEndpointRow()]);
    };

    const removeEndpointRow = (clientId: string) => {
        setEndpointRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.clientId !== clientId)));
    };

    const handlesaveModuleStepSetUp = async (): Promise<string | null> => {
        if (moduleMode === 'select') {
            if (!moduleData.id) {
                showError('Please select a module');
                return null;
            }
            return moduleData.id;
        }

        if (!moduleData.name || !moduleData.description) {
            showError('Module Name and Description are required');
            return null;
        }

        setLoading(true);
        try {
            if (useApi) {
                const res = await createModuleWizardService({
                    name: moduleData.name,
                    description: moduleData.description,
                    isPublic: moduleData.isPublic ?? true,
                    projectId: moduleData.projectId || null,
                } as any);
                const created = res.data;
                setModuleData((prev) => ({ ...prev, id: created.id }));
                showSuccess('Module created successfully.');
                return created.id;
            } else {
                const tempId = 'temp-module-' + Date.now();
                setModuleData((prev) => ({ ...prev, id: tempId }));
                showSuccess('Module saved locally (simulation).');
                return tempId;
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            showError(e.response?.data?.message || 'Failed to save module');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const validateStep2ApiPermissionMenu = (): boolean => {
        const err = validateWizardEndpointRows(endpointRows);
        if (err) {
            showError(err);
            return false;
        }
        return true;
    };

    const clearStep2Form = () => {
        setEndpointRows([createEmptyEndpointRow()]);
    };

    const refreshStep2Dropdowns = (moduleId: string) => {
        if (!moduleId || !useApi) return;
        getModuleWizardDetailsWizardService(moduleId)
            .then((res) => {
                const d = res.data;
                if (!d || d.module.id !== moduleId) return;
                setApiList(d.apiEndpoints ?? []);
                setMenuList(d.menus ?? []);
                setModuleData((prev) =>
                    prev.id === moduleId
                        ? {
                              ...prev,
                              name: d.module.name,
                              description: d.module.description ?? '',
                          }
                        : prev
                );
                setEndpointRows(buildEndpointRowsFromWizardDetails(d));
            })
            .catch(() => {
                getApiEndpointsWizardService()
                    .then((r) => setApiList(r.data ?? []))
                    .catch(() => {});
                getMenusWizardService()
                    .then((r) => setMenuList(r.data ?? []))
                    .catch(() => {});
            });
    };

    const handleSaveApiPermissionMenu = async () => {
        if (!moduleData.id) {
            showError('Please save or select a module first');
            return;
        }
        if (!validateStep2ApiPermissionMenu()) return;

        if (!useApi) {
            const existingStr = localStorage.getItem('ModuleSetupWizardData');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            existing.push({
                id: 'setup-' + Date.now(),
                timestamp: new Date().toISOString(),
                moduleData: moduleMode === 'create' ? { ...moduleData, id: moduleData.id } : { id: moduleData.id },
                endpointRows,
            });
            localStorage.setItem('ModuleSetupWizardData', JSON.stringify(existing));
            showSuccess('API, permission and menu saved locally.');
            clearStep2Form();
            return;
        }

        if (!canSaveApiPermissionMenu) {
            showError('You do not have permission to save API, Permission & Menu setup');
            return;
        }

        setLoading(true);
        try {
            const payload = buildBatchPayload(endpointRows, moduleData.id);
            await saveApiPermissionMenuWizardService(payload);
            showSuccess(
                payload.length > 1
                    ? `Saved ${payload.length} API endpoints successfully.`
                    : 'API, permission and menu saved successfully.'
            );
            refreshStep2Dropdowns(moduleData.id);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } } };
            showError(e.response?.data?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            if (moduleMode === 'create' && (!moduleData.name || !moduleData.description)) {
                showError('Module Name and Description are required');
                return;
            }
            if (moduleMode === 'select' && !moduleData.id) {
                showError('Please select a module');
                return;
            }

            if (moduleMode === 'create') {
                if (!canCreateModule) {
                    showError('You do not have permission to create a module');
                    return;
                }
                const savedId = await handlesaveModuleStepSetUp();
                if (!savedId) return;
            }
        } else if (activeStep === 1) {
            if (!validateStep2ApiPermissionMenu()) return;
        }

        if (activeStep < steps.length - 1) {
            setActiveStep((prev) => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            let finalModuleId = moduleData.id;

            if (!finalModuleId) {
                const savedId = await handlesaveModuleStepSetUp();
                if (!savedId) throw new Error('Module is required to continue');
                finalModuleId = savedId;
            }

            if (useApi) {
                if (!canSaveApiPermissionMenu) {
                    showError('You do not have permission to save API, Permission & Menu setup');
                    setLoading(false);
                    return;
                }
                const payload = buildBatchPayload(endpointRows, finalModuleId);
                await saveApiPermissionMenuWizardService(payload);
                showSuccess(
                    payload.length > 1
                        ? `Module setup completed (${payload.length} APIs).`
                        : 'Module setup completed successfully.'
                );
                refreshStep2Dropdowns(finalModuleId);
            } else {
                const existingStr = localStorage.getItem('ModuleSetupWizardData');
                const existing = existingStr ? JSON.parse(existingStr) : [];
                existing.push({
                    id: 'setup-' + Date.now(),
                    timestamp: new Date().toISOString(),
                    moduleData: moduleMode === 'create' ? { ...moduleData, id: finalModuleId } : { id: moduleData.id },
                    endpointRows,
                });
                localStorage.setItem('ModuleSetupWizardData', JSON.stringify(existing));
                showSuccess('Module setup saved locally.');
                clearStep2Form();
            }
        } catch (error: unknown) {
            const e = error as { response?: { data?: { message?: string } }; message?: string };
            showError(e.response?.data?.message || e.message || 'Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <ModuleWizardStepModuleForm
                        moduleMode={moduleMode}
                        onModuleModeChange={setModuleMode}
                        moduleData={moduleData}
                        onModuleDataPatch={(patch) => setModuleData((prev) => ({ ...prev, ...patch }))}
                        modulesList={modulesList}
                    />
                );
            case 1:
                return (
                    <ModuleWizardStepApiPermissionMenu
                        moduleId={moduleData.id}
                        endpointRows={endpointRows}
                        patchEndpointRow={patchEndpointRow}
                        addEndpointRow={addEndpointRow}
                        removeEndpointRow={removeEndpointRow}
                        apiList={apiList}
                        featuresList={featuresList}
                        menuList={menuList}
                        parentMenuList={parentMenuList}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <WizardLayout
            title="Module Setup Wizard"
            steps={steps}
            activeStep={activeStep}
            onNext={handleNext}
            onBack={handleBack}
            onStepClick={(index) => setActiveStep(index)}
            loading={loading || (!useApi && moduleMockLoading)}
            extraActions={
                activeStep === 0 ? (
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handlesaveModuleStepSetUp}
                        disabled={loading || !canCreateModule}
                        sx={{ borderRadius: 2 }}
                    >
                        Save Module
                    </Button>
                ) : activeStep === 1 ? (
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleSaveApiPermissionMenu}
                        disabled={loading || (useApi && !canSaveApiPermissionMenu)}
                        sx={{ borderRadius: 2 }}
                    >
                        Save API
                    </Button>
                ) : undefined
            }
        >
            {renderStepContent(activeStep)}
        </WizardLayout>
    );
};

export default ModuleSetupWizard;
