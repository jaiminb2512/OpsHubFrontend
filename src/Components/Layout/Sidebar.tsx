import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HEADER_HEIGHT } from './DashboardLayout';
import { AUTH_PATHS } from '../../Path';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Button,
  Collapse,
  Avatar,
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { DASHBOARD_PATHS } from '../../Path';
import { resolveMuiIcon, resolveMenuIconName } from '../../Utils/muiIconRegistry';
import { getUserInfo, type LoginResponse } from '../../Services/ApiServices';
import { useAuth } from '../../Context/AuthContext';
import { getMyMenusService, getMenuChildrenService } from '../../Services/ApiServices/menuServices';

import { useTranslation } from '../../hooks/useTranslation';
import { useState, useEffect, useRef } from 'react';
import type { ComponentType } from "react";
// import Notifications from '../Common/Notifications';

const APP_BRAND =
  (typeof import.meta.env.VITE_APP_BRAND_NAME === 'string' && import.meta.env.VITE_APP_BRAND_NAME.trim()) ||
  'Jaimin Project';

export interface MenuItem {
  label: string;
  icon?: ComponentType;
  path?: string;
  children?: MenuItem[];
  hasChildren?: boolean;
  id?: string; // Menu ID for fetching children dynamically
}


interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const Sidebar = ({ isOpen, toggleSidebar, isMobile }: SidebarProps) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout, roleContexts, activeContext } = useAuth();
  const userInfo: LoginResponse | null = getUserInfo();
  const roleLabel = activeContext
    ? activeContext.type === 'company' && activeContext.companyName
      ? `${activeContext.roleName} · ${activeContext.companyName}`
      : activeContext.roleName
    : userInfo?.role;
  const userInitial =
    userInfo?.fullName?.trim()?.charAt(0)?.toUpperCase() ||
    userInfo?.emailId?.charAt(0)?.toUpperCase() ||
    '?';
  // const userRole = userInfo?.role?.toLowerCase() || ''; // Not needed if fetching from API
  const [openSubmenus, setOpenSubmenus] = useState<{ [menuId: string]: boolean }>({});
  const [dynamicMenuItems, setDynamicMenuItems] = useState<MenuItem[]>([]);
  const [loadingChildren, setLoadingChildren] = useState<{ [key: string]: boolean }>({});
  const [menuLoadError, setMenuLoadError] = useState(false);
  const menuChildrenCacheRef = useRef<{ [menuId: string]: MenuItem[] }>({});

  const getIcon = (iconName: string | null | undefined) => resolveMuiIcon(iconName);

  // Convert DB Menu to Sidebar MenuItem
  const mapToMenuItem = (dbMenu: any): MenuItem => {
    return {
      label: dbMenu.label,
      path: dbMenu.route || undefined,
      icon: getIcon(resolveMenuIconName(dbMenu)),
      children: dbMenu.children && dbMenu.children.length > 0 ? dbMenu.children.map(mapToMenuItem) : undefined,
      hasChildren: dbMenu.hasChildren, // Map hasChildren from DB response
      id: dbMenu.id // Store the menu ID for fetching children
    };
  };

  const [menuRetryKey, setMenuRetryKey] = useState(0);

  useEffect(() => {
    if (!userInfo) return;
    let cancelled = false;
    menuChildrenCacheRef.current = {};
    setOpenSubmenus({});
    setMenuLoadError(false);

    const fetchMenus = async () => {
      try {
        const response = await getMyMenusService();
        if (!cancelled && response && response.success === 200 && Array.isArray(response.data)) {
          const mappedMenus = response.data.map(mapToMenuItem);
          setDynamicMenuItems(mappedMenus);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar menus", error);
        if (!cancelled) setMenuLoadError(true);
      }
    };

    fetchMenus();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext?.key, menuRetryKey]);

  const menuItems = dynamicMenuItems; // Use dynamic menus

  const isPathActive = (path?: string, hasChildren: boolean = false): boolean => {
    if (!path) return false;

    // For items without children (like Dashboard), only match exact path
    // For items with children, they should only be highlighted if a child is active
    if (!hasChildren && path === DASHBOARD_PATHS.HOME) {
      // Dashboard should only be highlighted when exactly on HOME
      return location.pathname === DASHBOARD_PATHS.HOME || location.pathname === DASHBOARD_PATHS.HOME + '/';
    }

    // For all other paths, use exact match or startsWith for sub-routes
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Helper to update a menu item by id anywhere in the tree (for nested children)
  const updateMenuItemById = (items: MenuItem[], targetId: string, updater: (item: MenuItem) => MenuItem): MenuItem[] => {
    return items.map((item) => {
      if (item.id === targetId) return updater(item);
      if (item.children) {
        return { ...item, children: updateMenuItemById(item.children, targetId, updater) };
      }
      return item;
    });
  };

  // Check if any descendant has active path (for recursive hasActiveChild)
  const hasActiveDescendant = (item: MenuItem): boolean => {
    if (item.path && isPathActive(item.path)) return true;
    return (item.children ?? []).some(hasActiveDescendant);
  };

  // Auto-open parent menu if any of its descendants is active
  useEffect(() => {
    const findAndOpenActiveParent = (items: MenuItem[]): boolean => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          if (item.children.some(hasActiveDescendant)) {
            const menuId = item.id;
            if (menuId) setOpenSubmenus((prev) => ({ ...prev, [menuId]: true }));
            return true;
          }
          if (findAndOpenActiveParent(item.children)) {
            const menuId = item.id;
            if (menuId) setOpenSubmenus((prev) => ({ ...prev, [menuId]: true }));
            return true;
          }
        }
      }
      return false;
    };
    findAndOpenActiveParent(menuItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleSubmenuToggle = async (menuId: string | undefined, hasChildren?: boolean) => {
    if (!menuId) return;
    const isCurrentlyOpen = openSubmenus[menuId];

    if (isCurrentlyOpen) {
      setOpenSubmenus((prev) => ({ ...prev, [menuId]: false }));
    } else {
      setOpenSubmenus((prev) => ({ ...prev, [menuId]: true }));

      if (hasChildren && !menuChildrenCacheRef.current[menuId]) {
        setLoadingChildren((prev) => ({ ...prev, [menuId]: true }));
        try {
          const response = await getMenuChildrenService(menuId);
          if (response && response.success === 200 && Array.isArray(response.data)) {
            const mappedChildren = response.data.map(mapToMenuItem);
            menuChildrenCacheRef.current = { ...menuChildrenCacheRef.current, [menuId]: mappedChildren };
            setDynamicMenuItems((prevItems) =>
              updateMenuItemById(prevItems, menuId, (item) => ({ ...item, children: mappedChildren }))
            );
          }
        } catch (error) {
          console.error("Failed to fetch menu children", error);
        } finally {
          setLoadingChildren((prev) => ({ ...prev, [menuId]: false }));
        }
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate(AUTH_PATHS.LOGIN);
  };

  const handleSwitchRole = () => {
    navigate(AUTH_PATHS.SELECT_ROLE);
  };

  // Recursively render menu items - children treated same as menus; only hasChildren:false are routes
  // depth: 0 = direct child of main, 1 = nested child, etc.
  const renderMenuItem = (item: MenuItem, index: number, depth: number = 0) => {
    const childHasChildren = item.hasChildren || (item.children && item.children.length > 0) || false;
    const isActive = item.path ? isPathActive(item.path, childHasChildren) : false;
    const hasActiveChild = (item.children && item.children.length > 0)
      ? item.children.some(hasActiveDescendant)
      : false;
    const isSubmenuOpen = item.id ? openSubmenus[item.id] : false;
    const isLoadingChildren = item.id ? loadingChildren[item.id] : false;
    const IconComponent = item.icon;
    const selectedChild = isActive || hasActiveChild;

    // Hierarchy: 20px base + 20px per nested level for indentation (child indented under parent)
    const indent = 20 + depth * 20;
    // Child items 20% narrower than parent per level (80% at depth 0, 64% at depth 1, etc.)
    const widthPercent = Math.pow(0.8, depth + 1) * 100;

    return (
      <Box
        key={`${item.id ?? item.label}-${index}`}
        sx={{
          width: `${widthPercent}%`,
          marginLeft: `${indent}%`,
        }}
      >
        <ListItem
          disablePadding
          sx={{
            width: '100%',
            margin: '2px 0',
            paddingLeft: '12px',
            paddingRight: '12px',
            boxSizing: 'border-box',
            ...(depth > 0 && {
              borderLeft: '2px solid',
              borderColor: 'divider',
              marginLeft: '4px',
            }),
          }}
        >
          <ListItemButton
            component={childHasChildren ? 'div' : Link}
            to={childHasChildren ? undefined : item.path}
            selected={selectedChild}
            onClick={childHasChildren ? () => handleSubmenuToggle(item.id, item.hasChildren) : handleMenuItemClick}
            sx={{
              width: '100%',
              borderRadius: 2,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minHeight: 44,
              color: 'text.secondary',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'common.white',
                '&:hover': { backgroundColor: 'primary.dark' },
                '& .MuiListItemIcon-root': { color: 'common.white' },
                '& .MuiListItemText-primary': { color: 'common.white' },
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.06),
              },
              '&:not(.Mui-selected):hover': {
                color: 'text.primary',
              },
            }}
          >
            {IconComponent && (
              <ListItemIcon
                sx={{
                  color: selectedChild ? 'inherit' : 'text.secondary',
                  minWidth: depth === 0 ? 32 : 28,
                  justifyContent: 'center',
                  '& svg': { fontSize: depth === 0 ? 20 : 18 },
                }}
              >
                <IconComponent />
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.label}
              sx={{
                flex: 1,
                minWidth: 0,
                '& .MuiListItemText-primary': {
                  fontSize: depth === 0 ? '13px' : '12px',
                  fontWeight: selectedChild ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  opacity: (isMobile || isOpen) ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                  color: 'inherit',
                },
              }}
            />
            {childHasChildren && (
              <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                {isLoadingChildren ? (
                  <Box
                    component="span"
                    sx={{
                      width: 16,
                      height: 16,
                      border: '2px solid',
                      borderColor: 'divider',
                      borderTopColor: 'primary.main',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                ) : (
                  isSubmenuOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />
                )}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
        {childHasChildren && (
          <Collapse in={isSubmenuOpen && (isMobile || isOpen)} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ width: '100%' }}>
              {item.children?.map((child, childIndex) =>
                renderMenuItem(child, childIndex, depth + 1)
              )}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const handleMenuItemClick = () => {
    // Close sidebar on mobile after clicking a menu item
    if (isMobile) {
      toggleSidebar();
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? isOpen : true}
      onClose={isMobile ? toggleSidebar : undefined}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        width: isOpen ? 260 : 80,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? 260 : isOpen ? 260 : 80,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          overflowY: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          boxShadow: 'none',
        },
      }}
    >
      {/* Brand row — height matches TitleBarRow in DashboardLayout */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: !isMobile && !isOpen ? 'center' : 'space-between',
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: 'primary.main',
            letterSpacing: '-0.02em',
            fontSize: '1.1rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
            display: isMobile || isOpen ? 'block' : 'none',
          }}
        >
          {APP_BRAND}
        </Typography>
        {!isMobile && (
          <IconButton
            onClick={toggleSidebar}
            size="small"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            {isOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        )}
      </Box>

      {/* User profile section */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        {userInfo && (isMobile || isOpen) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
                fontSize: '1rem',
              }}
              src={userInfo.imageUrl || undefined}
              alt=""
            >
              {!userInfo.imageUrl ? userInitial : null}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
                {userInfo.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {roleLabel}
              </Typography>
            </Box>
          </Box>
        )}

        {userInfo && !isMobile && !isOpen && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              }}
              src={userInfo.imageUrl || undefined}
            >
              {!userInfo.imageUrl ? userInitial : null}
            </Avatar>
          </Box>
        )}
      </Box>

      <List
        sx={{
          py: 1.5,
          px: 1,
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {menuLoadError && dynamicMenuItems.length === 0 && (isMobile || isOpen) && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="error.main" display="block" sx={{ mb: 0.5 }}>
              Menu failed to load.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => setMenuRetryKey((k) => k + 1)}
              sx={{ textTransform: 'none', fontSize: 12 }}
            >
              Retry
            </Button>
          </Box>
        )}
        {menuItems.map((item, index) => {
          const hasChildren = item.hasChildren || (item.children && item.children.length > 0) || false;
          const isActive = item.path ? isPathActive(item.path, hasChildren) : false;
          const IconComponent = item.icon;

          const hasActiveChild =
            item.children && item.children.length > 0 ? item.children.some(hasActiveDescendant) : false;

          const isSubmenuOpen = (item.id && openSubmenus[item.id]) || false;
          const isLoadingChildren = item.id ? loadingChildren[item.id] : false;

          const selectedTop = isActive || hasActiveChild;

          return (
            <Box key={`${item.id ?? item.label}-${index}`}>
              <ListItem disablePadding sx={{ margin: '1px' }}>
                <ListItemButton
                  component={hasChildren ? 'div' : Link}
                  to={hasChildren ? undefined : item.path}
                  selected={selectedTop}
                  onClick={hasChildren ? () => handleSubmenuToggle(item.id, item.hasChildren) : handleMenuItemClick}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    px: isOpen || isMobile ? 2 : 1,
                    gap: 1.5,
                    minHeight: 48,
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'common.white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'common.white',
                      },
                      '& .MuiListItemText-primary': {
                        color: 'common.white',
                      },
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    },
                    '&:not(.Mui-selected):hover': {
                      color: 'text.primary',
                    },
                  }}
                >
                  {IconComponent && (
                    <ListItemIcon
                      sx={{
                        color: selectedTop ? 'inherit' : 'text.secondary',
                        minWidth: 36,
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent />
                    </ListItemIcon>
                  )}
                  <ListItemText
                    primary={item.label}
                    sx={{
                      '& .MuiListItemText-primary': {
                        fontSize: '0.9375rem',
                        fontWeight: selectedTop ? 600 : 500,
                        whiteSpace: 'nowrap',
                        opacity: isMobile || isOpen ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                      },
                      flex: 1,
                    }}
                  />
                  {hasChildren && (isMobile || isOpen) && (
                    <Box sx={{ color: 'inherit', opacity: isMobile || isOpen ? 1 : 0 }}>
                      {isLoadingChildren ? (
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            component="span"
                            sx={{
                              width: 16,
                              height: 16,
                              border: '2px solid',
                              borderColor: 'divider',
                              borderTopColor: 'primary.main',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              },
                            }}
                          />
                        </Box>
                      ) : isSubmenuOpen ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </Box>
                  )}
                </ListItemButton>
              </ListItem>

              {hasChildren && (
                <Collapse in={isSubmenuOpen && (isMobile || isOpen)} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ width: '100%' }}>
                    {item.children?.map((child, childIndex) => renderMenuItem(child, childIndex, 0))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      <Box
        sx={{
          mt: 'auto',
          flexShrink: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          px: 1.5,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          bgcolor: 'grey.50',
        }}
      >
        {/* {(isMobile || isOpen) && (
          <Box sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
            <LanguageToggle />
          </Box>
        )}
        */}
        {roleContexts.length > 1 && (isMobile || isOpen) && (
          <Button
            onClick={handleSwitchRole}
            startIcon={<SwapHorizIcon sx={{ color: 'primary.main' }} />}
            sx={{
              width: '100%',
              py: 1,
              px: 1.5,
              justifyContent: 'flex-start',
              color: 'primary.main',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            Switch role
          </Button>
        )}
        <Button
          onClick={handleLogout}
          startIcon={<LogoutIcon sx={{ color: 'error.main' }} />}
          sx={{
            width: '100%',
            py: 1,
            px: 1.5,
            justifyContent: isMobile || isOpen ? 'flex-start' : 'center',
            color: 'error.main',
            bgcolor: 'transparent',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              bgcolor: alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          {(isMobile || isOpen) && (t('common.logout') || 'Logout')}
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;

