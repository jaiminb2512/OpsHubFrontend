import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Tooltip,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import MUICustomBtn from '../../Components/Common/MUICustomBtn';
import DataTable, { type Column } from '../../Components/Common/DataTable';
import DataCardGrid, { type CardField, type CardAction } from '../../Components/Common/DataCardGrid';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountCircle as AccountCircleIcon,
  Business as BusinessIcon,
  FilterList as FilterListIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  getUsersService,
  deleteUserService,
  getUserInfo,
  fillExternalUsersService,
  type UserResponse,
  type PaginationMeta,
  type FillExternalUsersResult,
} from '../../Services/ApiServices';
import { getCompaniesService, type CompanyListItem } from '../../Services/ApiServices/companyServices';
import { useToast } from '../../Utils/ToastContext';
import { usePagePermissions } from '../../hooks/usePagePermissions';
import { getRoleColor } from '../../Utils/roles';
import { USER_PATHS } from '../../Path';
import { getImageUrl } from '../../Utils/api';
import { formatDate } from '../../Utils/dateUtils';
import usePageTitle from '../../hooks/usePageTitle';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Import external users state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<FillExternalUsersResult | null>(null);
  const { showSuccess, showError } = useToast();

  const permissions = usePagePermissions([
    { key: 'create', endpointKey: 'register' },
    { key: 'view', endpointKey: 'getUserById', pathParams: { id: 'sample-id' } },
    { key: 'edit', endpointKey: 'updateUser', pathParams: { id: 'sample-id' } },
    { key: 'delete', endpointKey: 'deleteUser', pathParams: { id: 'sample-id' } },
  ]);
  const canCreate = permissions.create;
  const canView = permissions.view;
  const canEdit = permissions.edit;
  const canDelete = permissions.delete;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  const currentUser = getUserInfo();

  usePageTitle('Users',
    (
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Tooltip title={showFilter ? 'Hide Filter' : 'Show Filter'} arrow>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilter(!showFilter)}
            sx={{
              borderColor: showFilter ? '#667eea' : '#ccc',
              color: showFilter ? '#667eea' : '#666',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 1.5,
              minWidth: { xs: 0, md: 'auto' },
              px: { xs: 1.5, md: 2 },
              '& .MuiButton-startIcon': {
                mr: { xs: 0, md: 1 },
                ml: { xs: 0, md: -0.5 }
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              {showFilter ? 'Hide Filter' : 'Show Filter'}
            </Box>
          </Button>
        </Tooltip>
        <Tooltip title="Import Users from JSON" arrow>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setImportDialogOpen(true)}
            sx={{
              borderColor: '#43a047',
              color: '#43a047',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: 1.5,
              minWidth: { xs: 0, md: 'auto' },
              px: { xs: 1.5, md: 2 },
              '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: { xs: 0, md: -0.5 } },
              '&:hover': { borderColor: '#2e7d32', color: '#2e7d32', bgcolor: '#f1f8e9' },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Import Users</Box>
          </Button>
        </Tooltip>
        {canCreate && (
          <Tooltip title="Add New User" arrow>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate(USER_PATHS.CREATE)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: 1.5,
                whiteSpace: 'nowrap',
                minWidth: { xs: 0, md: 'auto' },
                px: { xs: 1.5, md: 2.5 },
                '& .MuiButton-startIcon': {
                  mr: { xs: 0, md: 1 },
                  ml: { xs: 0, md: -0.5 }
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Add New User
              </Box>
            </Button>
          </Tooltip>
        )}
      </Stack>
    ),
    false,
    [canCreate, showFilter]
  );

  const fetchUsers = async (page: number = 0) => {
    try {
      setLoading(true);
      const apiPage = page + 1;
      const response = await getUsersService(
        apiPage,
        pageSize,
        searchTerm.trim(),
        '',
        '',
        selectedCompanyId
      );
      if (response.success === 200 && response.data) {
        const { users: usersData, pagination } = response.data;
        setUsers(usersData);
        setPaginationMeta(pagination);
        setCurrentPage(page);
      }
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      showError('Failed to load users', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await getCompaniesService({ isActive: true });
        if (res.success === 200 && res.data) {
          setCompanies(res.data);
        }
      } catch {
        /* optional filter */
      }
    };
    void loadCompanies();
  }, []);

  useEffect(() => {
    fetchUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, selectedCompanyId]);



  const handleEditUser = (user: UserResponse) => {
    navigate(USER_PATHS.EDIT.replace(':userId', user.userId));
  };

  const handleCompanyRoles = (user: UserResponse) => {
    navigate(USER_PATHS.COMPANY_ROLES.replace(':userId', user.userId));
  };

  const handleViewProfile = (user: UserResponse) => {
    navigate(USER_PATHS.VIEW.replace(':userId', user.userId));
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleOpenDeleteModal = (user: UserResponse) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setFormLoading(true);

    try {
      const response = await deleteUserService(userToDelete.userId);

      if (response.success === 200) {
        showSuccess('User deleted successfully!', 'Success');
        await fetchUsers();
        setTimeout(() => {
          handleCloseDeleteModal();
        }, 1500);
      } else {
        showError(response.message || 'Failed to delete user', 'Delete Failed');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        showError(axiosError.response?.data?.message || 'Failed to delete user', 'Delete Failed');
      } else {
        showError('An unexpected error occurred', 'Error');
      }
    } finally {
      setFormLoading(false);
    }
  };



  const handleImportUsers = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const payload = JSON.parse(text) as object;
      const response = await fillExternalUsersService(payload);
      if (response.success === 200 && response.data) {
        setImportResult(response.data);
        void fetchUsers(0);
      } else {
        showError(response.message || 'Import failed', 'Error');
      }
    } catch {
      showError('Invalid JSON file', 'Error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
    setImportFile(null);
    setImportResult(null);
  };

  // Table columns configuration
  const columns: Column<UserResponse>[] = [
    {
      id: 'avatar',
      label: '',
      render: (user) => (
        <Avatar
          src={user.imageUrl ? getImageUrl(user.imageUrl) : undefined}
          alt={user.fullName}
          sx={{ width: 40, height: 40 }}
        >
          {user.fullName.charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      render: (user) => user.fullName,
    },
    {
      id: 'email',
      label: 'Email',
      render: (user) => user.emailId,
    },
    {
      id: 'role',
      label: 'Role',
      render: (user) => {
        const { bgcolor, color } = getRoleColor(user.role ?? '');
        return (
          <Chip
            label={user.role ?? '—'}
            size="small"
            sx={{
              bgcolor,
              color,
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      id: 'isGlobal',
      label: 'Type',
      render: (user) => (
        <Chip
          label={user.isGlobal ? 'Global' : 'Company'}
          size="small"
          color={user.isGlobal ? 'primary' : 'default'}
          variant={user.isGlobal ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      render: (user) => formatDate(user.createdAt),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (user) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canView && (
            <MUICustomBtn
              onClick={() => handleViewProfile(user)}
              tooltip="View Profile"
              variant="contained"
              sx={{
                bgcolor: '#f3e5f5',
                color: '#9c27b0',
                minWidth: 32,
                width: 32,
                height: 32,
                padding: 0,
                '&:hover': {
                  bgcolor: '#e1bee7',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(156, 39, 176, 0.2)',
                },
              }}
            >
              <AccountCircleIcon fontSize="small" />
            </MUICustomBtn>
          )}
          {canEdit && (
            <>
              {user.isGlobal && (
                <MUICustomBtn
                  onClick={() => handleCompanyRoles(user)}
                  tooltip="Assign companies & roles"
                  variant="contained"
                  sx={{
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    padding: 0,
                    '&:hover': {
                      bgcolor: '#c8e6c9',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(46, 125, 50, 0.2)',
                    },
                  }}
                >
                  <BusinessIcon fontSize="small" />
                </MUICustomBtn>
              )}
              <MUICustomBtn
                onClick={() => handleEditUser(user)}
                disabled={user.userId === currentUser?.userId}
                tooltip="Edit User"
                variant="contained"
                sx={{
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  minWidth: 32,
                  width: 32,
                  height: 32,
                  padding: 0,
                  '&:hover': {
                    bgcolor: '#bbdefb',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </MUICustomBtn>
            </>
          )}
          {canDelete && (
            <MUICustomBtn
              onClick={() => handleOpenDeleteModal(user)}
              disabled={user.userId === currentUser?.userId}
              tooltip="Delete User"
              variant="contained"
              sx={{
                bgcolor: '#ffebee',
                color: '#d32f2f',
                minWidth: 32,
                width: 32,
                height: 32,
                padding: 0,
                '&:hover': {
                  bgcolor: '#ffcdd2',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)',
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </MUICustomBtn>
          )}
        </Box>
      ),
    },
  ];

  // Card fields configuration
  const cardFields: CardField<UserResponse>[] = [
    {
      id: 'email',
      label: 'Email',
      render: (user) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={user.imageUrl ? getImageUrl(user.imageUrl) : undefined}
            alt={user.fullName}
            sx={{ width: 40, height: 40 }}
          >
            {user.fullName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {user.emailId}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      render: (user) => {
        const { bgcolor, color } = getRoleColor(user.role ?? '');
        return (
          <Chip
            label={user.role ?? '—'}
            size="small"
            sx={{
              bgcolor,
              color,
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      id: 'type',
      label: 'Type',
      render: (user) => (
        <Chip
          label={user.isGlobal ? 'Global' : 'Company'}
          size="small"
          color={user.isGlobal ? 'primary' : 'default'}
          variant={user.isGlobal ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      render: (user) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(user.createdAt)}
        </Typography>
      ),
    },
  ];

  // Card actions configuration
  const cardActions: CardAction<UserResponse>[] = [
    ...(canView
      ? [{
        id: 'view',
        render: (user: UserResponse) => (
          <MUICustomBtn
            onClick={() => handleViewProfile(user)}
            tooltip="View Profile"
            variant="contained"
            sx={{
              bgcolor: '#f3e5f5',
              color: '#9c27b0',
              minWidth: 32,
              width: 32,
              height: 32,
              padding: 0,
              '&:hover': {
                bgcolor: '#e1bee7',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(156, 39, 176, 0.2)',
              },
            }}
          >
            <AccountCircleIcon fontSize="small" />
          </MUICustomBtn>
        ),
      }]
      : []),
    ...(canEdit
      ? [{
        id: 'company-roles',
        render: (user: UserResponse) =>
          user.isGlobal ? (
            <MUICustomBtn
              onClick={() => handleCompanyRoles(user)}
              tooltip="Assign companies & roles"
              variant="contained"
              sx={{
                bgcolor: '#e8f5e9',
                color: '#2e7d32',
                minWidth: 32,
                width: 32,
                height: 32,
                padding: 0,
                '&:hover': {
                  bgcolor: '#c8e6c9',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(46, 125, 50, 0.2)',
                },
              }}
            >
              <BusinessIcon fontSize="small" />
            </MUICustomBtn>
          ) : null,
      }]
      : []),
    ...(canEdit
      ? [{
        id: 'edit',
        render: (user: UserResponse) => (
          <MUICustomBtn
            onClick={() => handleEditUser(user)}
            disabled={user.userId === currentUser?.userId}
            tooltip="Edit User"
            variant="contained"
            sx={{
              bgcolor: '#e3f2fd',
              color: '#1976d2',
              minWidth: 32,
              width: 32,
              height: 32,
              padding: 0,
              '&:hover': {
                bgcolor: '#bbdefb',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
              },
            }}
          >
            <EditIcon fontSize="small" />
          </MUICustomBtn>
        ),
      }]
      : []),
    ...(canDelete
      ? [{
        id: 'delete',
        render: (user: UserResponse) => (
          <MUICustomBtn
            onClick={() => handleOpenDeleteModal(user)}
            disabled={user.userId === currentUser?.userId}
            tooltip="Delete User"
            variant="contained"
            sx={{
              bgcolor: '#ffebee',
              color: '#d32f2f',
              minWidth: 32,
              width: 32,
              height: 32,
              padding: 0,
              '&:hover': {
                bgcolor: '#ffcdd2',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </MUICustomBtn>
        ),
      }]
      : []),
  ];

  return (
    <>


      {showFilter && (
        <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(0);
                void fetchUsers(0);
              }
            }}
            variant="outlined"
            size="small"
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 280px' },
              maxWidth: { sm: 360 },
            }}
          />
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <InputLabel id="users-company-filter-label">Company</InputLabel>
            <Select
              labelId="users-company-filter-label"
              label="Company"
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setCurrentPage(0);
              }}
            >
              <MenuItem value="">
                <em>All companies</em>
              </MenuItem>
              {companies.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => {
              setCurrentPage(0);
              void fetchUsers(0);
            }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Apply
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PeopleIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography variant="body1">
            {searchTerm || selectedCompanyId ? 'No users found matching your filters' : 'No users found'}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Desktop view - show table */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <DataTable
              columns={columns}
              data={users}
              getRowKey={(user) => user.userId}
              paginationMeta={paginationMeta}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={(_event, page) => setCurrentPage(page)}
              onRowsPerPageChange={(event) => {
                const newRowsPerPage = parseInt(event.target.value, 10);
                const actualRowsPerPage = newRowsPerPage === -1 ? 10000 : newRowsPerPage;
                setPageSize(actualRowsPerPage);
                setCurrentPage(0);
              }}
              searchTerm={searchTerm}
            />
          </Box>

          {/* Mobile/Tablet view - always show card view on screens < 1024px */}
          <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            <DataCardGrid
              data={users}
              getCardTitle={(user) => user.fullName}
              getCardSubtitle={(user) => user.emailId}
              fields={cardFields}
              actions={cardActions}
              getRowKey={(user) => user.userId}
              paginationMeta={paginationMeta}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={(_event, page) => setCurrentPage(page)}
              onRowsPerPageChange={(event) => {
                const newRowsPerPage = parseInt(event.target.value, 10);
                const actualRowsPerPage = newRowsPerPage === -1 ? 10000 : newRowsPerPage;
                setPageSize(actualRowsPerPage);
                setCurrentPage(0);
              }}
              searchTerm={searchTerm}
              columns={1}
            />
          </Box>
        </>
      )}

      {/* Import External Users Dialog */}
      <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon sx={{ color: '#43a047' }} />
          Import Users from JSON
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload the JSON file exported from TailorProject (<code>GET /api/export/users</code>).
            Existing shadow users will be updated; real RBAS users are never overwritten.
          </Typography>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadIcon />}
            sx={{ textTransform: 'none', fontWeight: 600, borderColor: '#43a047', color: '#43a047' }}
          >
            {importFile ? importFile.name : 'Choose JSON file'}
            <input
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                setImportFile(e.target.files?.[0] ?? null);
                setImportResult(null);
              }}
            />
          </Button>

          {importResult && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f9fbe7', borderRadius: 1, border: '1px solid #c5e1a5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#43a047', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>Import complete</Typography>
              </Box>
              <Typography variant="body2">Total: <strong>{importResult.total}</strong></Typography>
              <Typography variant="body2" color="success.main">Created: <strong>{importResult.created}</strong></Typography>
              <Typography variant="body2" color="primary">Updated: <strong>{importResult.updated}</strong></Typography>
              <Typography variant="body2" color="text.secondary">Skipped: <strong>{importResult.skipped}</strong></Typography>
              {importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <WarningIcon sx={{ color: '#f57c00', fontSize: 16 }} />
                    <Typography variant="caption" color="warning.main" fontWeight={600}>Skipped details:</Typography>
                  </Box>
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <Typography key={i} variant="caption" display="block" color="text.secondary">
                      • {e.userId}: {e.reason}
                    </Typography>
                  ))}
                  {importResult.errors.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      ...and {importResult.errors.length - 5} more
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseImportDialog} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult && (
            <Button
              onClick={() => void handleImportUsers()}
              disabled={!importFile || importLoading}
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#43a047', '&:hover': { bgcolor: '#2e7d32' } }}
            >
              {importLoading ? <CircularProgress size={20} color="inherit" /> : 'Import'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onClose={handleCloseDeleteModal} maxWidth="sm" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {userToDelete && (
            <Typography>
              Are you sure you want to delete user <strong>{userToDelete.fullName}</strong> (
              {userToDelete.emailId})? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteModal} variant="outlined" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={formLoading}
            variant="contained"
            color="error"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {formLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UsersPage;
