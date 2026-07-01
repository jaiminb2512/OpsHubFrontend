import {
    Box,
    TextField,
    Switch,
    FormControlLabel,
    Stack,
    Typography,
} from '@mui/material';
import { AdminPanelSettings as RoleIcon } from '@mui/icons-material';
import { isHierarchyApplyEnabled } from '../../Services/ApiServices/roleServices';
import { fieldSx, wizardSwitchCheckedSx } from './roleSetupWizardConstants';
import WizardStepHeader from '../Common/Wizard/WizardStepHeader';
import { ProjectSelect } from '../Common/ProjectSelect';

export type RoleWizardEditDetailsData = {
    id: string;
    name: string;
    description: string;
    hierarchy: string;
    isPublic: boolean;
    projectId: string;
};

export interface RoleWizardStepEditDetailsProps {
    roleData: RoleWizardEditDetailsData;
    onRoleDataChange: (updater: (p: RoleWizardEditDetailsData) => RoleWizardEditDetailsData) => void;
}

const RoleWizardStepEditDetails = ({ roleData, onRoleDataChange }: RoleWizardStepEditDetailsProps) => (
    <Box>
        <WizardStepHeader
            icon={<RoleIcon />}
            title="Role Details"
            description="Update the role's name, description, hierarchy and visibility."
        />

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
            <FormControlLabel
                control={
                    <Switch
                        checked={roleData.isPublic}
                        onChange={e => onRoleDataChange(p => ({ ...p, isPublic: e.target.checked }))}
                        sx={wizardSwitchCheckedSx}
                    />
                }
                label={
                    <Box>
                        <Typography fontWeight={600} fontSize="0.875rem">Public</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Visible to all companies by default
                        </Typography>
                    </Box>
                }
            />
        </Stack>
    </Box>
);

export default RoleWizardStepEditDetails;
