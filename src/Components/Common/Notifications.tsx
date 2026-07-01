
import { useState, useEffect } from 'react';
import {
    Box,
    Badge,
    IconButton,
    Menu,
    Typography,
    List,
    ListItem,
    ListItemText,
    Button,
    Divider,
    CircularProgress
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    DoneAll as DoneAllIcon,
    Circle as CircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
    getMyNotificationsService,
    markNotificationAsReadService,
    markNotificationAsUnreadService,
    markAllNotificationsAsReadService
} from '../../Services/ApiServices/notificationServices'; // Adjust import path
import type { Notification } from '../../Services/ApiServices/notificationServices';
import { NOTIFICATION_PATHS } from '../../Path';
import { MarkEmailUnread as MarkEmailUnreadIcon } from '@mui/icons-material';


const Notifications = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const open = Boolean(anchorEl);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await getMyNotificationsService(1, 10, false) as any; // Using any to bypass TS for now if needed, or proper type
            if (response && response.success === 200) {
                const notifs = response.data.notifications;
                setNotifications(notifs);
                setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute or maybe use socket later
        const interval = setInterval(fetchNotifications, 60000000);
        return () => clearInterval(interval);
    }, []);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications(); // Refresh on open
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await markNotificationAsReadService(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark as read", error);
            }
        }

        if (notification.link) {
            navigate(notification.link);
            handleClose();
        }
    };

    const handleToggleRead = async (e: React.MouseEvent, notification: Notification) => {
        e.stopPropagation();
        try {
            if (notification.isRead) {
                await markNotificationAsUnreadService(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: false } : n));
                setUnreadCount(prev => prev + 1);
            } else {
                await markNotificationAsReadService(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to toggle read status", error);
        }
    };

    const handleMarkAllRead = async () => {

        try {
            await markAllNotificationsAsReadService();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleViewAll = () => {
        handleClose();
        navigate(NOTIFICATION_PATHS.LIST);
    };

    return (
        <>
            <IconButton
                onClick={handleClick}
                size="large"
                aria-label="show new notifications"
                color="inherit"
                sx={{
                    color: 'action.active', // Or specific color if needed
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                id="notification-menu"
                open={open}
                onClose={handleClose}
                onClick={undefined} // Don't close on click inside unless handled
                PaperProps={{
                    elevation: 0,
                    sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        width: 360,
                        maxHeight: 480,
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" component="div">
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllRead}
                            startIcon={<DoneAllIcon />}
                            sx={{ textTransform: 'none' }}
                        >
                            Mark all as read
                        </Button>
                    )}
                </Box>
                <Divider />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : (
                    <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <ListItem
                                    key={notification.id}
                                    alignItems="flex-start"
                                    onClick={() => handleNotificationClick(notification)}
                                    secondaryAction={
                                        <IconButton
                                            size="small"
                                            edge="end"
                                            onClick={(e) => handleToggleRead(e, notification)}
                                            color={notification.isRead ? "primary" : "success"}
                                        >
                                            {notification.isRead ? <MarkEmailUnreadIcon fontSize="small" /> : <DoneAllIcon fontSize="small" />}
                                        </IconButton>
                                    }
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: notification.isRead ? 'background.paper' : 'action.hover',
                                        '&:hover': { bgcolor: 'action.selected' },
                                        transition: 'background-color 0.2s',
                                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                                        pr: 7 // Add padding for secondary action
                                    }}
                                >

                                    <Box sx={{ mt: 1, mr: 1.5 }}>
                                        {!notification.isRead && (
                                            <CircleIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                                        )}
                                    </Box>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle2" sx={{ fontWeight: notification.isRead ? 400 : 600 }}>
                                                {notification.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                                                    {notification.message}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(notification.createdAt).toLocaleString()}
                                                </Typography>
                                            </>
                                        }
                                    />
                                </ListItem>
                            ))
                        ) : (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No notifications
                                </Typography>
                            </Box>
                        )}
                    </List>
                )}

                <Divider />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Button size="small" fullWidth onClick={handleViewAll}>
                        View All
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default Notifications;
