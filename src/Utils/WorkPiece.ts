export const getAvailableWorkPieceStatus = (role: string) => {
    if (role == 'superAdmin') {
        return ['pending', 'underCutting', 'redayToStich', 'underStitching', 'readyToFinishing', 'underFinishing', 'readyToDeliver'];
    } else if (role == 'admin') {
        return ['pending', 'underCutting', 'redayToStich', 'underStitching', 'readyToFinishing', 'underFinishing', 'readyToDeliver'];
    } else if (role == 'subAdmin') {
        return ['pending', 'underCutting', 'redayToStich', 'underStitching', 'readyToFinishing', 'underFinishing', 'readyToDeliver'];
    } else if (role == 'cutter') {
        return ['pending', 'underCutting'];
    } else if (role == 'stitcher') {
        return ['redayToStich', 'underStitching'];
    } else if (role == 'finisher') {
        return ['readyToFinishing', 'underFinishing'];
    } else if (role == 'deliveryBoy') {
        return ['readyToDeliver'];
    } else if (role == 'accountant') {
        return [];
    }
    return [];
}

export const formatStatus = (status: string): string => {
    if (!status) return "";
    return status
        .split(/(?=[A-Z])|[\s_-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Get allowed status transitions for a role
export const getAllowedStatusTransitions = (role: string): Record<string, string[]> => {
    if (role == 'superAdmin' || role == 'admin' || role == 'subAdmin') {
        return {
            'pending': ['underCutting'],
            'underCutting': ['redayToStich'],
            'redayToStich': ['underStitching'],
            'underStitching': ['readyToFinishing'],
            'readyToFinishing': ['underFinishing'],
            'underFinishing': ['readyToDeliver'],
            'readyToDeliver': []
        };
    } else if (role == 'cutter') {
        return {
            'pending': ['underCutting'],
            'underCutting': ['redayToStich']
        };
    } else if (role == 'stitcher') {
        return {
            'redayToStich': ['underStitching'],
            'underStitching': ['readyToFinishing']
        };
    } else if (role == 'finisher') {
        return {
            'readyToFinishing': ['underFinishing'],
            'underFinishing': ['readyToDeliver']
        };
    } else if (role == 'deliveryBoy') {
        return {
            'readyToDeliver': []
        };
    }
    return {};
}

// Check if a status transition is allowed for a role
export const canTransitionStatus = (role: string, currentStatus: string, newStatus: string): boolean => {
    const transitions = getAllowedStatusTransitions(role);
    return transitions[currentStatus]?.includes(newStatus) || false;
}

// Get the next allowed status for current status based on role
export const getNextAllowedStatus = (role: string, currentStatus: string): string | null => {
    const transitions = getAllowedStatusTransitions(role);
    const allowedTransitions = transitions[currentStatus] || [];
    return allowedTransitions.length > 0 ? allowedTransitions[0] : null;
}

export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'warning';
        case 'undercutting':
        case 'in_progress':
            return 'info';
        case 'redaytostich':
            return 'secondary';
        case 'understitching':
            return 'primary';
        case 'readytofinishing':
            return 'secondary';
        case 'underfinishing':
            return 'info';
        case 'readytodeliver':
        case 'completed':
            return 'success';
        default:
            return 'default';
    }
};