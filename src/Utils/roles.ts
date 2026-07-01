export const getAvailableRoles = (role: string) => {
    if (role == 'superAdmin') {
        return [{ name: 'Admin', value: 'admin' }, { name: 'Sub Admin', value: 'subAdmin' }];
    } else if (role == 'admin') {
        return [{ name: 'Sub Admin', value: 'subAdmin' }, { name: 'Cutter', value: 'cutter' }, { name: 'Stitcher', value: 'stitcher' }, { name: 'Finisher', value: 'finisher' }, { name: 'Delivery Boy', value: 'deliveryBoy' }, { name: 'Accountant', value: 'accountant' }];
    } else if (role == 'subAdmin') {
        return [{ name: 'Cutter', value: 'cutter' }, { name: 'Stitcher', value: 'stitcher' }, { name: 'Finisher', value: 'finisher' }, { name: 'Delivery Boy', value: 'deliveryBoy' }, { name: 'Accountant', value: 'accountant' }];
    }
    return [];
}

export const getRoleColor = (role: string) => {
    switch (role) {
        case 'superAdmin':
            return { bgcolor: '#e3f2fd', color: '#1976d2' };
        case 'admin':
            return { bgcolor: '#f3e5f5', color: '#9c27b0' };
        case 'subAdmin':
            return { bgcolor: '#fff3e0', color: '#f57c00' };
        case 'cutter':
            return { bgcolor: '#e8f5e9', color: '#2e7d32' };
        case 'stitcher':
            return { bgcolor: '#fce4ec', color: '#c2185b' };
        case 'finisher':
            return { bgcolor: '#f3e5f5', color: '#7b1fa2' };
        case 'deliveryBoy':
            return { bgcolor: '#e1f5fe', color: '#0277bd' };
        case 'accountant':
            return { bgcolor: '#fff9c4', color: '#f57f17' };
        default:
            return { bgcolor: '#f5f5f5', color: '#757575' };
    }
};