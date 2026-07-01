import { useEffect, useState } from 'react';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { getMeService, type UserResponse } from '../../Services/ApiServices/userServices';

const ProfilePage = () => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMeService().then(res => {
            if (res.success) setUser(res.data);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
    );

    if (!user) return (
        <div className="text-center text-gray-500 mt-16">Failed to load profile.</div>
    );

    const initials = user.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    const formattedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })
        : '—';

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header strip */}
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />

                {/* Avatar + name */}
                <div className="px-8 pb-6">
                    <div className="flex items-end gap-5 -mt-10 mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow">
                            {initials}
                        </div>
                        <div className="pb-1">
                            <h1 className="text-xl font-semibold text-gray-900">{user.fullName}</h1>
                            {user.role && (
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {user.role}
                                </span>
                            )}
                        </div>
                    </div>

                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Profile Information
                    </h2>

                    <div className="space-y-4">
                        <InfoRow
                            icon={<PersonIcon sx={{ fontSize: 16, color: '#6366f1' }} />}
                            label="User ID"
                            value={user.userId}
                            mono
                        />
                        <InfoRow
                            icon={<EmailIcon sx={{ fontSize: 16, color: '#a855f7' }} />}
                            label="Email Address"
                            value={user.emailId}
                        />
                        <InfoRow
                            icon={<ShieldIcon sx={{ fontSize: 16, color: '#22c55e' }} />}
                            label="Role"
                            value={user.role ?? '—'}
                            bold
                        />
                        <InfoRow
                            icon={<CalendarMonthIcon sx={{ fontSize: 16, color: '#fb923c' }} />}
                            label="Member Since"
                            value={formattedDate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

interface InfoRowProps {
    icon: React.ReactElement;
    label: string;
    value: string;
    mono?: boolean;
    bold?: boolean;
}

const InfoRow = ({ icon, label, value, mono, bold }: InfoRowProps) => (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400 leading-none mb-1">{label}</p>
            <p className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''} ${bold ? 'font-semibold' : ''}`}>
                {value}
            </p>
        </div>
    </div>
);

export default ProfilePage;
