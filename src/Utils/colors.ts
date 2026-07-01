/**
 * Color Palette - Centralized Color Management
 * All color codes used throughout the application
 */

export const colors = {
    // Primary Colors - Main brand colors
    primary: {
        main: '#667eea',
        dark: '#764ba2',
        light: '#8b9eff',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        rgba: {
            light: 'rgba(102, 126, 234, 0.1)',
            medium: 'rgba(102, 126, 234, 0.2)',
            dark: 'rgba(102, 126, 234, 0.3)',
            focus: 'rgba(102, 126, 234, 0.1)',
            shadow: 'rgba(102, 126, 234, 0.3)',
        },
    },

    // Secondary Colors
    secondary: {
        main: '#764ba2',
        light: '#9c7ab8',
        dark: '#5a3779',
    },

    // Status Colors
    success: {
        main: '#4caf50',
        light: '#81c784',
        dark: '#388e3c',
        background: '#efe',
        border: '#cfc',
        text: '#3c3',
    },

    error: {
        main: '#d32f2f',
        light: '#ffcdd2',
        dark: '#b71c1c',
        background: '#ffebee',
        border: '#fcc',
        text: '#c33',
        delete: '#dc3545',
        rgba: {
            shadow: 'rgba(211, 47, 47, 0.2)',
        },
    },

    warning: {
        main: '#ff9800',
        light: '#ffb74d',
        dark: '#f57c00',
        background: '#fff3e0',
        border: '#ffccbc',
        text: '#e65100',
    },

    info: {
        main: '#1976d2',
        light: '#64b5f6',
        dark: '#1565c0',
        background: '#e3f2fd',
        hover: '#bbdefb',
        rgba: {
            shadow: 'rgba(25, 118, 210, 0.2)',
        },
    },

    // Background Colors
    background: {
        primary: '#ffffff',
        secondary: '#f8f9fa',
        tertiary: '#f5f7fa',
        input: '#fafafa',
        inputDisabled: '#f5f5f5',
        hover: '#f0f0f0',
        sidebar: {
            main: '#1e293b',
            dark: '#0f172a',
        },
        modal: {
            overlay: 'rgba(0, 0, 0, 0.5)',
        },
        card: '#ffffff',
    },

    // Text Colors
    text: {
        primary: '#333333',
        secondary: '#666666',
        tertiary: '#999999',
        disabled: '#cccccc',
        white: '#ffffff',
        inverse: '#ffffff',
        placeholder: '#999999',
        label: '#333333',
    },

    // Border Colors
    border: {
        light: '#e0e0e0',
        medium: '#ccc',
        dark: '#999',
        primary: '#e0e0e0',
        secondary: '#ccc',
        focus: '#667eea',
        hover: '#999',
        disabled: '#e0e0e0',
        divider: '#f0f0f0',
    },

    // Shadow Colors
    shadow: {
        light: 'rgba(0, 0, 0, 0.1)',
        medium: 'rgba(0, 0, 0, 0.15)',
        dark: 'rgba(0, 0, 0, 0.3)',
        darker: 'rgba(0, 0, 0, 0.4)',
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
        cardHover: '0 8px 12px rgba(0, 0, 0, 0.15)',
        button: '0 10px 20px rgba(102, 126, 234, 0.3)',
        modal: '0 25px 80px rgba(0, 0, 0, 0.4)',
        modalSmall: '0 20px 60px rgba(0, 0, 0, 0.3)',
        buttonHover: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },

    // Icon Colors
    icon: {
        primary: '#667eea',
        secondary: '#666666',
        success: '#4caf50',
        error: '#d32f2f',
        warning: '#ff9800',
        info: '#1976d2',
        disabled: '#cccccc',
    },

    // Action Button Colors
    action: {
        edit: {
            background: '#e3f2fd',
            color: '#1976d2',
            hover: '#bbdefb',
            shadow: 'rgba(25, 118, 210, 0.2)',
        },
        delete: {
            background: '#ffebee',
            color: '#d32f2f',
            hover: '#ffcdd2',
            shadow: 'rgba(211, 47, 47, 0.2)',
        },
        default: {
            background: '#f5f5f5',
            color: '#666666',
            hover: '#e0e0e0',
        },
    },

    // Scrollbar Colors
    scrollbar: {
        track: '#f1f1f1',
        thumb: '#888888',
        thumbHover: '#555555',
    },

    // Overlay Colors
    overlay: {
        light: 'rgba(0, 0, 0, 0.5)',
        medium: 'rgba(0, 0, 0, 0.6)',
        dark: 'rgba(0, 0, 0, 0.7)',
    },
};

// Export individual color categories for convenience
export const primaryColors = colors.primary;
export const statusColors = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
};
export const backgroundColors = colors.background;
export const textColors = colors.text;
export const borderColors = colors.border;
export const shadowColors = colors.shadow;

export default colors;

