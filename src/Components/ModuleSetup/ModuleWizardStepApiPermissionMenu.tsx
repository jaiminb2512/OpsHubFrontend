import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    Switch,
    MenuItem,
    Stack,
    Button,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    FormControlLabel,
} from '@mui/material';
import {
    Api as ApiIcon,
    InfoOutlined as InfoOutlinedIcon,
    Add as AddIcon,
    DeleteOutline as DeleteOutlineIcon,
    DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import type { WizardApiEndpointRow } from './moduleWizardShared';
import {
    PRIMARY,
    fieldSx,
    infoIconSx,
    HTTP_METHODS,
    formatKeyInput,
    wizardSwitchCheckedSx,
} from './moduleWizardShared';
import WizardStepHeader from '../Common/Wizard/WizardStepHeader';

export type WizardApiListItem = { id: string; method: string; path: string; key?: string; isPublic?: boolean; isLimitAllowed?: boolean };

export type WizardFeatureListItem = { id: string; name: string; key?: string };
export type WizardMenuListItem = { id: string; label: string };

export type ModuleWizardStepApiPermissionMenuProps = {
    moduleId: string;
    endpointRows: WizardApiEndpointRow[];
    patchEndpointRow: (clientId: string, patch: Partial<WizardApiEndpointRow>) => void;
    addEndpointRow: () => void;
    removeEndpointRow: (clientId: string) => void;
    apiList: WizardApiListItem[];
    menuList: WizardMenuListItem[];
    /** All menus (flat) for parent dropdown; defaults to `menuList` when omitted. */
    parentMenuList?: WizardMenuListItem[];
    readOnly?: boolean;
    /** When false, hide add row and per-row remove (e.g. enforced single row). Default true unless readOnly. */
    allowAddRemoveRows?: boolean;
    /** When set, rows with `persistedFromServer` and `apiId` can delete the saved API endpoint on the server. */
    onDeletePersistedSetup?: (apiEndpointId: string) => Promise<void>;
    persistedDeletePending?: boolean;
    featuresList?: WizardFeatureListItem[];
};

const STEP2_ROW_TOOLTIP = (
    <Box sx={{ maxWidth: 380, py: 0.25 }}>
        <Typography variant="body2" sx={{ mb: 1.25 }}>
            Add one or more API rows. Use <strong>Select Existing</strong> on each card to pick a registered endpoint,
            or turn it off to define method, path, and key. Feature is optional on each row. Use{' '}
            <strong>Add API endpoint</strong> for batch setup.
        </Typography>
        <Typography variant="body2" fontWeight={700} gutterBottom sx={{ mt: 0.75 }}>
            Field rules
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Feature key:</strong> Uppercase; spaces become underscores.
        </Typography>
        <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>Feature name:</strong> Underscores become spaces; each word is title-cased.
        </Typography>
        <Typography variant="body2">
            <strong>HTTP method / route / API key:</strong> Route like /api/orders. API key is uppercase with underscores.
        </Typography>
    </Box>
);

/**
 * Step 2 — API endpoints, permissions, features, menus (batch rows).
 * Reuse for wizard, module edit screen, or read-only module detail.
 */
export function ModuleWizardStepApiPermissionMenu({
    moduleId: _moduleId,
    endpointRows,
    patchEndpointRow,
    addEndpointRow,
    removeEndpointRow,
    apiList,
    menuList,
    parentMenuList,
    readOnly = false,
    allowAddRemoveRows = true,
    onDeletePersistedSetup,
    persistedDeletePending = false,
    featuresList: _featuresList,
}: ModuleWizardStepApiPermissionMenuProps) {
    const canMutateRows = allowAddRemoveRows && !readOnly;
    const roInput = readOnly ? ({ slotProps: { input: { readOnly: true } } } as const) : {};
    const parentOptions =
        parentMenuList && parentMenuList.length > 0 ? parentMenuList : menuList;

    const [deleteConfirm, setDeleteConfirm] = useState<{
        open: boolean;
        apiEndpointId: string | null;
        summary: string;
    }>({ open: false, apiEndpointId: null, summary: '' });

    const [apiSearchQuery, setApiSearchQuery] = useState('');
    const [apiSearchParam, setApiSearchParam] = useState('path');
    const [apiSearchType, setApiSearchType] = useState('like');

    const filteredEndpointRows = useMemo(() => {
        if (!apiSearchQuery) return endpointRows;
        return endpointRows.filter((row) => {
            const val = String(row[apiSearchParam as keyof WizardApiEndpointRow] || '').toLowerCase();
            const query = apiSearchQuery.toLowerCase();
            if (apiSearchType === 'exact') {
                return val === query;
            }
            return val.includes(query);
        });
    }, [endpointRows, apiSearchQuery, apiSearchParam, apiSearchType]);

    const closeDeleteDialog = () => {
        if (persistedDeletePending) return;
        setDeleteConfirm({ open: false, apiEndpointId: null, summary: '' });
    };

    const handleConfirmDeletePersisted = async () => {
        if (!deleteConfirm.apiEndpointId || !onDeletePersistedSetup) return;
        try {
            await onDeletePersistedSetup(deleteConfirm.apiEndpointId);
            setDeleteConfirm({ open: false, apiEndpointId: null, summary: '' });
        } catch {
            // Parent shows error; keep dialog open
        }
    };

    return (
        <Box>
            <WizardStepHeader
                icon={<ApiIcon />}
                title="API, Permission & Menu"
                showDescription={false}
                afterTitle={
                    !readOnly ? (
                        <Tooltip arrow placement="bottom-start" describeChild title={STEP2_ROW_TOOLTIP}>
                            <IconButton size="small" aria-label="API, permission and menu instructions" sx={infoIconSx}>
                                <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : undefined
                }
            />

            <Stack spacing={3}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <TextField
                        label="Search APIs"
                        size="small"
                        value={apiSearchQuery}
                        onChange={(e) => setApiSearchQuery(e.target.value)}
                        placeholder="Search existing API endpoints..."
                        sx={{ flex: 1, minWidth: 150 }}
                    />
                    <TextField
                        select
                        label="Parameter"
                        size="small"
                        value={apiSearchParam}
                        onChange={(e) => setApiSearchParam(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="path">API Route Path</MenuItem>
                        <MenuItem value="method">HTTP Method</MenuItem>
                        <MenuItem value="key">API Key</MenuItem>
                        <MenuItem value="permissionDescription">Permission</MenuItem>
                        <MenuItem value="menuLabel">Menu Label</MenuItem>
                    </TextField>
                    <TextField
                        select
                        label="Match Type"
                        size="small"
                        value={apiSearchType}
                        onChange={(e) => setApiSearchType(e.target.value)}
                        sx={{ minWidth: 100 }}
                    >
                        <MenuItem value="like">Like</MenuItem>
                        <MenuItem value="exact">Exact</MenuItem>
                    </TextField>
                </Box>
                {filteredEndpointRows.map((row, index) => (
                    <Box
                        key={row.clientId}
                        sx={{
                            border: '1px solid #ebebeb',
                            borderRadius: '12px',
                            p: 2.5,
                            bgcolor: '#fcfcfd',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                mb: 2,
                                flexWrap: 'wrap',
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                                API {index + 1}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography fontWeight={600} fontSize="0.875rem" color="text.secondary">
                                    Select Existing
                                </Typography>
                                <Switch
                                    checked={row.apiSourceMode === 'select'}
                                    disabled={readOnly}
                                    onChange={(e) => {
                                        const selectExisting = e.target.checked;
                                        patchEndpointRow(row.clientId, {
                                            apiSourceMode: selectExisting ? 'select' : 'create',
                                            persistedFromServer: false,
                                            apiId: '',
                                            method: 'POST',
                                            path: '',
                                            key: '',
                                        });
                                    }}
                                    sx={wizardSwitchCheckedSx}
                                />
                                {onDeletePersistedSetup &&
                                    row.persistedFromServer &&
                                    row.apiId &&
                                    !readOnly && (
                                    <Tooltip title="Delete this API endpoint from the server (removes all linked permissions, role access, and menus)">
                                        <span>
                                            <IconButton
                                                size="small"
                                                aria-label={`Delete saved API endpoint ${index + 1}`}
                                                onClick={() =>
                                                    setDeleteConfirm({
                                                        open: true,
                                                        apiEndpointId: row.apiId,
                                                        summary:
                                                            `${row.method} ${row.path}`.trim() ||
                                                            row.permissionDescription ||
                                                            row.apiId,
                                                    })
                                                }
                                                disabled={persistedDeletePending}
                                                sx={{ color: 'error.main', ml: 0.25 }}
                                            >
                                                <DeleteForeverIcon fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                )}
                                {canMutateRows && endpointRows.length > 1 && !row.persistedFromServer && (
                                    <IconButton
                                        size="small"
                                        aria-label={`Remove API ${index + 1}`}
                                        onClick={() => removeEndpointRow(row.clientId)}
                                        sx={{ color: '#9ca3af', ml: 0.5 }}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        {row.apiSourceMode === 'create' && (
                            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                                HTTP request
                            </Typography>
                        )}

                        {row.apiSourceMode === 'select' ? (
                            <TextField
                                select
                                fullWidth
                                label="Select API Endpoint"
                                value={row.apiId}
                                onChange={(e) => {
                                    const newApiId = e.target.value;
                                    const api = apiList.find((a) => a.id === newApiId);
                                    patchEndpointRow(row.clientId, {
                                        apiId: newApiId,
                                        persistedFromServer: false,
                                        isPublic: (api as any)?.isPublic ?? false,
                                        isLimitAllowed: api?.isLimitAllowed ?? true,
                                    });
                                }}
                                required
                                sx={fieldSx}
                                {...roInput}
                            >
                                <MenuItem value="">
                                    <em>-- Select API --</em>
                                </MenuItem>
                                {apiList.map((api) => (
                                    <MenuItem key={api.id} value={api.id}>
                                        {api.method} {api.path}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: 2,
                                    width: '100%',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <TextField
                                    select
                                    label="HTTP Method"
                                    value={row.method}
                                    onChange={(e) => patchEndpointRow(row.clientId, { method: e.target.value })}
                                    required
                                    sx={{
                                        ...fieldSx,
                                        flex: { md: '0 0 auto' },
                                        width: '100%',
                                        minWidth: { md: 132 },
                                        maxWidth: { md: 160 },
                                    }}
                                    {...roInput}
                                >
                                    {HTTP_METHODS.map((m) => (
                                        <MenuItem key={m} value={m}>
                                            {m}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    label="API Route Path"
                                    value={row.path}
                                    onChange={(e) => patchEndpointRow(row.clientId, { path: e.target.value })}
                                    required
                                    placeholder="e.g., /api/orders"
                                    sx={{
                                        ...fieldSx,
                                        flex: { md: '2 1 0' },
                                        width: '100%',
                                        minWidth: { md: 180 },
                                    }}
                                    {...roInput}
                                />
                                <TextField
                                    label="API Key (Unique)"
                                    value={row.key}
                                    onChange={(e) => {
                                        const k = formatKeyInput(e.target.value);
                                        patchEndpointRow(row.clientId, { key: k });
                                    }}
                                    required
                                    placeholder="e.g., CREATE_ORDER_API"
                                    sx={{
                                        ...fieldSx,
                                        flex: { md: '1 1 0' },
                                        width: '100%',
                                        minWidth: { md: 160 },
                                    }}
                                    {...roInput}
                                />
                            </Box>
                        )}

                        <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        disabled={readOnly}
                                        checked={row.isPublic === true}
                                        onChange={(e) =>
                                            patchEndpointRow(row.clientId, { isPublic: e.target.checked })
                                        }
                                        sx={wizardSwitchCheckedSx}
                                    />
                                }
                                label="Public"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        disabled={readOnly}
                                        checked={row.isLimitAllowed !== false}
                                        onChange={(e) =>
                                            patchEndpointRow(row.clientId, { isLimitAllowed: e.target.checked })
                                        }
                                        sx={wizardSwitchCheckedSx}
                                    />
                                }
                                label="Limit allowed"
                            />
                        </Stack>

                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mt: 2.5, mb: 0.75 }}>
                            Permission
                        </Typography>
                        <TextField
                            fullWidth
                            label="Permission Name"
                            value={row.permissionDescription}
                            onChange={(e) =>
                                patchEndpointRow(row.clientId, {
                                    permissionDescription: e.target.value,
                                })
                            }
                            required
                            multiline
                            rows={2}
                            placeholder="e.g., Allows user to create new orders in the system"
                            sx={fieldSx}
                            {...roInput}
                        />

                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mt: 2.5, mb: 0.75 }}>
                            Menu link (optional)
                        </Typography>
                        <TextField
                            select
                            fullWidth
                            label="Menu Action"
                            value={row.menuMode}
                            onChange={(e) =>
                                patchEndpointRow(row.clientId, {
                                    menuMode: e.target.value as WizardApiEndpointRow['menuMode'],
                                })
                            }
                            sx={{ ...fieldSx, mb: (row.menuMode === 'skip') ? 0 : 2 }}
                            {...roInput}
                        >
                            <MenuItem value="create">Create New Menu Item</MenuItem>
                            <MenuItem value="link">Link to Existing Menu</MenuItem>
                            {row.menuMode === 'linked' && (
                                <MenuItem value="linked">Linked Menu (server)</MenuItem>
                            )}
                            <MenuItem value="skip">Skip Menu Creation</MenuItem>
                        </TextField>

                        {row.menuMode === 'create' && (
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField
                                        fullWidth
                                        label="Menu Label"
                                        value={row.menuLabel}
                                        onChange={(e) =>
                                            patchEndpointRow(row.clientId, {
                                                menuLabel: e.target.value,
                                            })
                                        }
                                        required
                                        sx={fieldSx}
                                        {...roInput}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Route Path"
                                        value={row.menuRoute}
                                        onChange={(e) =>
                                            patchEndpointRow(row.clientId, {
                                                menuRoute: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., /dashboard/orders"
                                        sx={fieldSx}
                                        {...roInput}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <TextField
                                        fullWidth
                                        label="Icon Name"
                                        value={row.menuIcon}
                                        onChange={(e) =>
                                            patchEndpointRow(row.clientId, {
                                                menuIcon: e.target.value,
                                            })
                                        }
                                        sx={fieldSx}
                                        {...roInput}
                                    />
                                    <TextField
                                        select
                                        fullWidth
                                        label="Parent Menu (Optional)"
                                        value={row.menuParentId}
                                        onChange={(e) =>
                                            patchEndpointRow(row.clientId, {
                                                menuParentId: e.target.value,
                                            })
                                        }
                                        sx={fieldSx}
                                        {...roInput}
                                    >
                                        <MenuItem value="">
                                            <em>-- None --</em>
                                        </MenuItem>
                                        {parentOptions.map((m) => (
                                            <MenuItem key={m.id} value={m.id}>
                                                {m.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Box>
                            </Stack>
                        )}

                        {(row.menuMode === 'link' || row.menuMode === 'linked') && (
                            <TextField
                                select
                                fullWidth
                                label="Select Existing Menu"
                                value={row.menuId}
                                onChange={(e) => patchEndpointRow(row.clientId, { menuId: e.target.value })}
                                required
                                sx={fieldSx}
                                {...roInput}
                            >
                                <MenuItem value="">
                                    <em>-- Select Menu --</em>
                                </MenuItem>
                                {menuList.map((m) => (
                                    <MenuItem key={m.id} value={m.id}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                    </Box>
                ))}
            </Stack>

            {canMutateRows && (
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addEndpointRow}
                    disabled={persistedDeletePending}
                    sx={{
                        mt: 2,
                        borderRadius: '10px',
                        textTransform: 'none',
                        borderColor: '#ebebeb',
                        color: '#374151',
                        '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(102,126,234,0.06)' },
                    }}
                >
                    Add API endpoint
                </Button>
            )}

            <Dialog open={deleteConfirm.open} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Delete this API endpoint?</DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">
                        This permanently deletes the API endpoint and every linked permission, role grant, and menu
                        subtree for:
                        <Box component="span" sx={{ display: 'block', mt: 1.5, fontWeight: 700, color: 'text.primary' }}>
                            {deleteConfirm.summary}
                        </Box>
                        <Box sx={{ mt: 2 }}>This cannot be undone.</Box>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDeleteDialog} disabled={persistedDeletePending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleConfirmDeletePersisted()}
                        color="error"
                        variant="contained"
                        disabled={persistedDeletePending}
                    >
                        {persistedDeletePending ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
