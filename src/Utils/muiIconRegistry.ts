import type { SvgIconComponent } from '@mui/icons-material';
import AccountTree from '@mui/icons-material/AccountTree';
import AddBusiness from '@mui/icons-material/AddBusiness';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Api from '@mui/icons-material/Api';
import Archive from '@mui/icons-material/Archive';
import AutoAwesomeMosaic from '@mui/icons-material/AutoAwesomeMosaic';
import Assessment from '@mui/icons-material/Assessment';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Build from '@mui/icons-material/Build';
import Business from '@mui/icons-material/Business';
import Category from '@mui/icons-material/Category';
import Checkroom from '@mui/icons-material/Checkroom';
import Circle from '@mui/icons-material/Circle';
import Dashboard from '@mui/icons-material/Dashboard';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Extension from '@mui/icons-material/Extension';
import FeaturedPlayList from '@mui/icons-material/FeaturedPlayList';
import Group from '@mui/icons-material/Group';
import Inventory from '@mui/icons-material/Inventory';
import Inventory2 from '@mui/icons-material/Inventory2';
import Link from '@mui/icons-material/Link';
import List from '@mui/icons-material/List';
import LocalMall from '@mui/icons-material/LocalMall';
import Lock from '@mui/icons-material/Lock';
import Menu from '@mui/icons-material/Menu';
import Notifications from '@mui/icons-material/Notifications';
import People from '@mui/icons-material/People';
import Person from '@mui/icons-material/Person';
import PersonAddAlt1 from '@mui/icons-material/PersonAddAlt1';
import PhonelinkSetup from '@mui/icons-material/PhonelinkSetup';
import Receipt from '@mui/icons-material/Receipt';
import Schema from '@mui/icons-material/Schema';
import Security from '@mui/icons-material/Security';
import Settings from '@mui/icons-material/Settings';
import ShoppingBag from '@mui/icons-material/ShoppingBag';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Store from '@mui/icons-material/Store';
import Texture from '@mui/icons-material/Texture';
import Tune from '@mui/icons-material/Tune';
import ViewModule from '@mui/icons-material/ViewModule';
import Work from '@mui/icons-material/Work';

/** Icons referenced from DB menu `icon` strings — add names here as needed. */
const ICON_REGISTRY: Record<string, SvgIconComponent> = {
    AccountTree,
    AddBusiness,
    AdminPanelSettings,
    Api,
    Archive,
    AutoAwesomeMosaic,
    Assessment,
    AttachMoney,
    Build,
    Business,
    Category,
    Checkroom,
    Circle,
    Dashboard,
    Delete,
    Edit,
    Extension,
    FeaturedPlayList,
    Group,
    Inventory,
    Inventory2,
    Link,
    List,
    LocalMall,
    Lock,
    Menu,
    Notifications,
    People,
    Person,
    PersonAddAlt1,
    PhonelinkSetup,
    Receipt,
    Schema,
    Security,
    Settings,
    ShoppingBag,
    ShoppingCart,
    Store,
    Texture,
    Tune,
    ViewModule,
    Work,
    /** Common aliases / labels stored in DB */
    Product: Category,
    Products: Category,
    Prodcut: Category,
    Workflow: AccountTree,
    Setup: PhonelinkSetup,
    SetUp: PhonelinkSetup,
    Feature: AutoAwesomeMosaic,
    Features: Extension,
    FiberManualRecord: Circle,
};

const VARIANT_SUFFIXES = ['Outlined', 'Rounded', 'Sharp', 'TwoTone'] as const;

function toPascalCase(value: string): string {
    return value
        .replace(/[-_\s]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

function normalizeIconKey(iconName: string): string {
    let name = iconName.trim();
    if (!name) return '';

    if (name.length > 5 && name.toLowerCase().endsWith('icon')) {
        name = name.slice(0, -4);
    }

    for (const suffix of VARIANT_SUFFIXES) {
        if (name.endsWith(suffix)) {
            name = name.slice(0, -suffix.length);
            break;
        }
    }

    if (/[-_\s]/.test(name) || /^[a-z]/.test(name)) {
        name = toPascalCase(name);
    }

    return name;
}

const ICON_LOOKUP: Record<string, SvgIconComponent> = {};
for (const [key, icon] of Object.entries(ICON_REGISTRY)) {
    ICON_LOOKUP[key] = icon;
    ICON_LOOKUP[key.toLowerCase()] = icon;
}

export function hasMuiIcon(iconName?: string | null): boolean {
    if (!iconName?.trim()) return false;
    const key = normalizeIconKey(iconName);
    return key in ICON_LOOKUP;
}

/** Resolve a menu/module icon name to a MUI icon component (tree-shakeable). */
export function resolveMuiIcon(iconName?: string | null): SvgIconComponent {
    if (!iconName?.trim()) return Circle;
    const key = normalizeIconKey(iconName);
    return ICON_LOOKUP[key] ?? ICON_LOOKUP[key.toLowerCase()] ?? Circle;
}

/** Pick icon from menu row or first child that has an icon (for parent containers). */
export function resolveMenuIconName(
    menu: { icon?: string | null; label?: string | null; children?: { icon?: string | null }[] } | null | undefined
): string | null {
    if (!menu) return null;
    const own = menu.icon?.trim();
    if (own) return own;

    const childIcon = menu.children?.find((c) => c.icon?.trim())?.icon?.trim();
    if (childIcon) return childIcon;

    const label = (menu.label || '').trim().toLowerCase();
    const labelAliases: Record<string, string> = {
        prodcut: 'Product',
        product: 'Product',
        products: 'Product',
        inventory: 'Archive',
        workflow: 'AccountTree',
        setup: 'PhonelinkSetup',
        feature: 'AutoAwesomeMosaic',
        features: 'Extension',
        notification: 'Notifications',
        notifications: 'Notifications',
    };
    return labelAliases[label] ?? null;
}
