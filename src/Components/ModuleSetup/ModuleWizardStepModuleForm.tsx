import {
    Box,
    Typography,
    TextField,
    Switch,
    MenuItem,
    Stack,
    Tooltip,
    IconButton,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import { ViewModule as ModuleIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import WizardStepHeader from '../Common/Wizard/WizardStepHeader';
import {
    fieldSx,
    infoIconSx,
    wizardSwitchCheckedSx,
} from './moduleWizardShared';
import { ProjectSelect } from '../Common/ProjectSelect';

export type WizardModuleListItem = { id: string; label?: string; name?: string };

export type ModuleWizardModuleData = { id: string; name: string; description: string; isPublic?: boolean; projectId: string };

export type ModuleWizardStepModuleFormProps = {
    moduleMode: 'create' | 'select';
    onModuleModeChange: (mode: 'create' | 'select') => void;
    moduleData: ModuleWizardModuleData;
    onModuleDataPatch: (patch: Partial<ModuleWizardModuleData>) => void;
    modulesList: WizardModuleListItem[];
    /**
     * Full wizard: toggle create vs select existing module.
     * Set false for update/view on a fixed module — use `lockModuleMode`.
     */
    showModeToggle?: boolean;
    /** Used when `showModeToggle` is false. Defaults to `moduleMode`. */
    lockModuleMode?: 'create' | 'select';
    /** View-only: no edits */
    readOnly?: boolean;
};

const STEP0_TOOLTIP = (
    <Box sx={{ maxWidth: 360, py: 0.25 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
            Module Setup
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
            A module groups features for your app (e.g. Orders, Inventory). Turn <strong>Create New</strong> off to
            attach this wizard to an existing module from the list.
        </Typography>
    </Box>
);

/**
 * Step 1 — module identity: create new (name + description) or pick existing module.
 * Reuse for wizard, dedicated create/update screens, or read-only module view.
 */
export function ModuleWizardStepModuleForm({
    moduleMode,
    onModuleModeChange,
    moduleData,
    onModuleDataPatch,
    modulesList,
    showModeToggle = true,
    lockModuleMode,
    readOnly = false,
}: ModuleWizardStepModuleFormProps) {
    const effectiveMode = showModeToggle ? moduleMode : (lockModuleMode ?? moduleMode);

    return (
        <Box>
            <WizardStepHeader
                icon={<ModuleIcon />}
                title="Module Setup"
                description="A Module represents a logical grouping of features (e.g., &quot;Orders&quot;, &quot;Users&quot;)."
                afterTitle={
                    !readOnly ? (
                        <Tooltip arrow placement="bottom-start" describeChild title={STEP0_TOOLTIP}>
                            <IconButton size="small" aria-label="Module setup instructions" sx={infoIconSx}>
                                <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    ) : undefined
                }
                endSlot={
                    showModeToggle && !readOnly ? (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                flexShrink: 0,
                                ml: { xs: '44px', sm: 0 },
                            }}
                        >
                            <Typography fontWeight={600} fontSize="0.875rem" color="text.secondary">
                                Create New Module
                            </Typography>
                            <Switch
                                checked={moduleMode === 'create'}
                                onChange={(e) => onModuleModeChange(e.target.checked ? 'create' : 'select')}
                                sx={wizardSwitchCheckedSx}
                            />
                        </Box>
                    ) : undefined
                }
            />

            {effectiveMode === 'create' ? (
                <Stack spacing={2.5}>
                    <ProjectSelect
                        value={moduleData.projectId}
                        onChange={(val) => onModuleDataPatch({ projectId: val })}
                        showGlobalOptions={false}
                        size="medium"
                        required
                        disabled={readOnly}
                    />
                    <TextField
                        fullWidth
                        label="Module Name"
                        value={moduleData.name}
                        onChange={(e) => onModuleDataPatch({ name: e.target.value })}
                        required
                        placeholder="e.g., Inventory Management"
                        sx={fieldSx}
                        {...(readOnly ? { slotProps: { input: { readOnly: true } } } : {})}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        value={moduleData.description}
                        onChange={(e) => onModuleDataPatch({ description: e.target.value })}
                        required
                        multiline
                        rows={3}
                        sx={fieldSx}
                        {...(readOnly ? { slotProps: { input: { readOnly: true } } } : {})}
                    />
                    {!readOnly && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={moduleData.isPublic ?? true}
                                    onChange={(e) => onModuleDataPatch({ isPublic: e.target.checked })}
                                    size="small"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    Public Module
                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                        — visible to all plans and roles
                                    </Typography>
                                </Typography>
                            }
                        />
                    )}
                </Stack>
            ) : readOnly && moduleData.id ? (
                <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Selected module
                    </Typography>
                    <Typography variant="body1">
                        {modulesList.find((m) => m.id === moduleData.id)?.label ||
                            modulesList.find((m) => m.id === moduleData.id)?.name ||
                            moduleData.name ||
                            moduleData.id}
                    </Typography>
                </Stack>
            ) : (
                <TextField
                    select
                    fullWidth
                    label="Select Existing Module"
                    value={moduleData.id}
                    onChange={(e) => onModuleDataPatch({ id: e.target.value })}
                    required
                    sx={fieldSx}
                >
                    <MenuItem value="">
                        <em>-- Select Module --</em>
                    </MenuItem>
                    {modulesList.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                            {m.label || m.name}
                        </MenuItem>
                    ))}
                </TextField>
            )}
        </Box>
    );
}
