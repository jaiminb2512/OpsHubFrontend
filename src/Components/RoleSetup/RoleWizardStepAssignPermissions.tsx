import {
    Box,
    Typography,
    TextField,
    Chip,
    Stack,
    Divider,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
} from '@mui/material';
import { LockOpen as PermissionIcon, Search as SearchIcon } from '@mui/icons-material';
import type { WizardModule } from './roleSetupWizardTypes';
import MethodChip from './MethodChip';
import { PRIMARY, fieldSx } from './roleSetupWizardConstants';
import WizardStepHeader from '../Common/Wizard/WizardStepHeader';

export interface RoleWizardStepAssignPermissionsProps {
    useApi: boolean;
    selectedModules: WizardModule[];
    activeModuleId: string;
    onActiveModuleChange: (moduleId: string) => void;
    activeModule: WizardModule | undefined;
    filteredPermissions: WizardModule['permissions'];
    permSearch: string;
    onPermSearchChange: (v: string) => void;
    totalSelected: number;
    getModuleSelectedCount: (moduleId: string) => number;
    isPermSelected: (moduleId: string, permId: string) => boolean;
    onTogglePerm: (moduleId: string, permId: string) => void;
    onToggleAllInModule: (moduleId: string, permIds: string[]) => void;
}

const RoleWizardStepAssignPermissions = ({
    useApi,
    selectedModules,
    activeModuleId,
    onActiveModuleChange,
    activeModule,
    filteredPermissions,
    permSearch,
    onPermSearchChange,
    totalSelected,
    getModuleSelectedCount,
    isPermSelected,
    onTogglePerm,
    onToggleAllInModule,
}: RoleWizardStepAssignPermissionsProps) => (
    <Box>
        <WizardStepHeader icon={<PermissionIcon />} title="Assign Permissions" showDescription={false} />

        {totalSelected > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedModules
                    .filter(m => getModuleSelectedCount(m.id) > 0)
                    .map(m => (
                        <Chip
                            key={m.id}
                            label={`${m.name}: ${getModuleSelectedCount(m.id)}/${useApi ? (m.totalPermission ?? 0) : m.permissions.length}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.72rem' }}
                        />
                    ))}
            </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ width: { xs: '100%', md: 200 }, flexShrink: 0 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                    SELECTED MODULES
                </Typography>
                <Stack spacing={0.5}>
                    {selectedModules.map(m => {
                        const count = getModuleSelectedCount(m.id);
                        const isActive = activeModuleId === m.id;
                        const total = useApi ? (m.totalPermission ?? 0) : m.permissions.length;
                        return (
                            <Box
                                key={m.id}
                                onClick={() => {
                                    onActiveModuleChange(m.id);
                                    onPermSearchChange('');
                                }}
                                sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.15s',
                                    bgcolor: isActive ? 'rgba(102,126,234,0.10)' : 'transparent',
                                    borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                                    '&:hover': { bgcolor: 'rgba(102,126,234,0.07)' },
                                }}
                            >
                                <Box>
                                    <Typography variant="body2" fontWeight={isActive ? 700 : 500} color={isActive ? PRIMARY : 'text.primary'}>
                                        {m.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                                        {count}/{total} assigned
                                    </Typography>
                                </Box>
                                {count > 0 && (
                                    <Chip
                                        label={count === total ? '✓' : count}
                                        size="small"
                                        color={count === total ? 'success' : 'primary'}
                                        sx={{ height: 18, fontSize: '0.65rem', minWidth: 22 }}
                                    />
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                {!activeModuleId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'text.disabled' }}>
                        <Typography variant="body2">← Select a module to assign permissions</Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 2, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                {activeModule?.name} Permissions
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Search permissions…"
                                value={permSearch}
                                onChange={e => onPermSearchChange(e.target.value)}
                                sx={{ width: 220, ...fieldSx }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                indeterminate={
                                                    getModuleSelectedCount(activeModuleId) > 0 &&
                                                    getModuleSelectedCount(activeModuleId) <
                                                        (activeModule?.permissions.length ?? 0)
                                                }
                                                checked={
                                                    (activeModule?.permissions.length ?? 0) > 0 &&
                                                    getModuleSelectedCount(activeModuleId) === activeModule?.permissions.length
                                                }
                                                onChange={() =>
                                                    onToggleAllInModule(activeModuleId, activeModule?.permissions.map(p => p.id) ?? [])
                                                }
                                                sx={{ '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: PRIMARY } }}
                                            />
                                        </TableCell>
                                        <TableCell><strong>Permission</strong></TableCell>
                                        <TableCell><strong>Method</strong></TableCell>
                                        <TableCell><strong>Route</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredPermissions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ color: 'text.disabled', py: 3 }}>
                                                No permissions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPermissions.map(perm => (
                                            <TableRow
                                                key={perm.id}
                                                hover
                                                onClick={() => onTogglePerm(activeModuleId, perm.id)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={isPermSelected(activeModuleId, perm.id)}
                                                        onChange={() => onTogglePerm(activeModuleId, perm.id)}
                                                        onClick={e => e.stopPropagation()}
                                                        sx={{ '&.Mui-checked': { color: PRIMARY } }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{perm.description}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <MethodChip method={perm.apiMethod} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                                                        {perm.apiRoute}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {getModuleSelectedCount(activeModuleId)} of {activeModule?.permissions.length} selected in this module
                            {totalSelected > 0 && ` · ${totalSelected} total across all modules`}
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    </Box>
);

export default RoleWizardStepAssignPermissions;
