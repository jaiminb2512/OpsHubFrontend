import { AUTH_PATHS, USER_PATHS } from '../Path';
import type { UserRoleContext } from './roleContextStorage';
import { needsRoleSelection } from './roleContextStorage';

export const resolvePostLoginPath = (
    contexts: UserRoleContext[],
    options?: { needToResetPassword?: boolean }
): string => {
    if (options?.needToResetPassword) {
        return USER_PATHS.LIST;
    }
    if (needsRoleSelection(contexts)) {
        return AUTH_PATHS.SELECT_ROLE;
    }
    return USER_PATHS.LIST;
};
