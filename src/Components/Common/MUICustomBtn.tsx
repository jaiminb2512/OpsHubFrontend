import { Button, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

interface MUICustomBtnProps {
    children: React.ReactNode;
    variant?: 'contained' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    size?: "small" | "medium" | "large";
    onClick?: () => void;
    disabled?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    tooltip?: string;
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';
    type?: 'button' | 'submit' | 'reset';
    sx?: SxProps<Theme>;

}

const MUICustomBtn = ({
    children,
    variant = 'contained',
    color = 'primary',
    size = 'medium',
    onClick,
    disabled = false,
    startIcon,
    endIcon,
    fullWidth = false,
    tooltip,
    tooltipPlacement = 'top',
    type = 'button',
    sx,
    ...props
}: MUICustomBtnProps) => {
    const buttonElement = (
        <Button
            size={size}
            variant={variant}
            color={color}
            onClick={onClick}
            disabled={disabled}
            startIcon={startIcon}
            endIcon={endIcon}
            fullWidth={fullWidth}
            type={type}
            sx={sx}
            {...props}
        >
            {children}
        </Button>
    );

    if (tooltip) {
        return (
            <Tooltip title={tooltip} placement={tooltipPlacement} arrow>
                {buttonElement}
            </Tooltip>
        );
    }

    return buttonElement;
};

export default MUICustomBtn;

/*
USAGE EXAMPLES:

import { Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';

// Form submit button
<MUICustomBtn
    type="submit"
    variant="contained"
    tooltip="Submit form"
>
    Submit
</MUICustomBtn>

// Regular button
<MUICustomBtn
    type="button"
    onClick={handleClick}
    variant="outlined"
>
    Click Me
</MUICustomBtn>

// Reset button
<MUICustomBtn
    type="reset"
    variant="text"
    color="secondary"
>
    Reset
</MUICustomBtn>
*/