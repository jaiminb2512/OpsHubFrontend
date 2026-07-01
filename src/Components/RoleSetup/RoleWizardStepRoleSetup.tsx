import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Switch,
    FormControlLabel,
    Stack,
    Chip,
    InputAdornment,
    Button,
    CircularProgress,
    Paper,
} from '@mui/material';
import { AdminPanelSettings as RoleIcon, Add as AddIcon } from '@mui/icons-material';
import { isHierarchyApplyEnabled } from '../../Services/ApiServices/roleServices';
import type { RoleSetupListRole } from '../../Services/ApiServices/roleSetupWizardServices';
import { PRIMARY, fieldSx, wizardSwitchCheckedSx } from './roleSetupWizardConstants';
import WizardStepHeader from '../Common/Wizard/WizardStepHeader';
import { ProjectSelect } from '../Common/ProjectSelect';

export type RoleWizardRoleData = { id: string; name: string; description: string; hierarchy: string; isPublic: boolean; projectId: string };

export interface RoleWizardStepRoleSetupProps {
    roleMode: 'create' | 'select';
    onRoleModeChange: (mode: 'create' | 'select') => void;
    roleData: RoleWizardRoleData;
    onRoleDataChange: (updater: (p: RoleWizardRoleData) => RoleWizardRoleData) => void;
    rolesList: RoleSetupListRole[];
    rolesTotal: number;
    rolesInitialLoading: boolean;
    rolesLoadingMore: boolean;
    rolesHasMore: boolean;
    loadingRoleDetail: boolean;
    useApi: boolean;
    canRoleSetupList: boolean;
    onLoadMoreRoles: () => void;
}

const RoleWizardStepRoleSetup = ({
    roleMode,
    onRoleModeChange,
    roleData,
    onRoleDataChange,
    rolesList,
    rolesTotal,
    rolesInitialLoading,
    rolesLoadingMore,
    rolesHasMore,
    loadingRoleDetail,
    useApi,
    canRoleSetupList,
    onLoadMoreRoles,
}: RoleWizardStepRoleSetupProps) => (
    <Box>
        <WizardStepHeader
            icon={<RoleIcon />}
            title="Role Setup"
            description="Create a new role or select an existing one to assign module permissions."
        />

        <FormControlLabel
            control={
                <Switch
                    checked={roleMode === 'create'}
                    onChange={e => {
                        onRoleModeChange(e.target.checked ? 'create' : 'select');
                    }}
                    sx={wizardSwitchCheckedSx}
                />
            }
            label={<Typography fontWeight={600} fontSize="0.875rem">Create New Role</Typography>}
            sx={{ mb: 3 }}
        />

        {roleMode === 'create' ? (
            <Stack spacing={2.5}>
                <ProjectSelect
                    value={roleData.projectId}
                    onChange={val => onRoleDataChange(p => ({ ...p, projectId: val }))}
                    showGlobalOptions={false}
                    size="medium"
                    required
                />
                <TextField
                    fullWidth
                    label="Role Name"
                    value={roleData.name}
                    onChange={e => onRoleDataChange(p => ({ ...p, name: e.target.value }))}
                    required
                    placeholder="e.g., Store Manager"
                    sx={fieldSx}
                />
                <TextField
                    fullWidth
                    label="Description"
                    value={roleData.description}
                    onChange={e => onRoleDataChange(p => ({ ...p, description: e.target.value }))}
                    required
                    multiline
                    rows={3}
                    placeholder="e.g., Manages daily store operations"
                    sx={fieldSx}
                />
                {isHierarchyApplyEnabled() && (
                    <TextField
                        fullWidth
                        label="Hierarchy Level"
                        type="number"
                        value={roleData.hierarchy}
                        onChange={e => onRoleDataChange(p => ({ ...p, hierarchy: e.target.value }))}
                        placeholder="e.g., 2  (lower = higher authority)"
                        inputProps={{ min: 1 }}
                        sx={fieldSx}
                    />
                )}
            </Stack>
        ) : (
            <Stack spacing={2.5}>
                <Box>
                    <TextField
                        select
                        fullWidth
                        label="Select Existing Role"
                        value={roleData.id}
                        disabled={(rolesInitialLoading && rolesList.length === 0) || loadingRoleDetail}
                        onChange={e => {
                            const id = e.target.value;
                            const role = rolesList.find(r => r.id === id);
                            onRoleDataChange(p => ({
                                ...p,
                                id,
                                name: role?.name ?? '',
                                description: role?.description ?? '',
                                hierarchy: role != null ? String(role.hierarchy) : '',
                            }));
                        }}
                        required
                        sx={fieldSx}
                        InputProps={{
                            endAdornment: rolesInitialLoading && rolesList.length === 0 ? (
                                <InputAdornment position="end" sx={{ mr: 2 }}>
                                    <CircularProgress color="inherit" size={20} />
                                </InputAdornment>
                            ) : undefined,
                        }}
                    >
                        <MenuItem value=""><em>-- Select Role --</em></MenuItem>
                        {rolesList.map(r => (
                            <MenuItem key={r.id} value={r.id}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>{r.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {r.description ?? '—'}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    {useApi && rolesHasMore && (
                        <Button
                            type="button"
                            variant="text"
                            size="small"
                            startIcon={
                                rolesLoadingMore ? (
                                    <CircularProgress size={16} color="inherit" />
                                ) : (
                                    <AddIcon sx={{ fontSize: 18 }} />
                                )
                            }
                            onClick={onLoadMoreRoles}
                            disabled={rolesLoadingMore || rolesInitialLoading || !canRoleSetupList}
                            sx={{
                                mt: 1,
                                ml: 0.5,
                                color: PRIMARY,
                                fontWeight: 600,
                                textTransform: 'none',
                            }}
                        >
                            {rolesLoadingMore ? 'Loading…' : 'Load more roles'}
                        </Button>
                    )}
                </Box>

                {!rolesInitialLoading && rolesTotal === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No roles found. Use &quot;Create New Role&quot; to add one first.
                    </Typography>
                )}

                {roleData.id && (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9f9fb' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                            SELECTED ROLE
                        </Typography>
                        <Typography variant="body1" fontWeight={700}>{roleData.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{roleData.description}</Typography>
                        <Chip label={`Hierarchy: ${roleData.hierarchy}`} size="small" sx={{ mt: 1 }} variant="outlined" />
                    </Paper>
                )}
            </Stack>
        )}
    </Box>
);

export default RoleWizardStepRoleSetup;
