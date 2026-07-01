import { useEffect, type ReactNode } from 'react';
import { usePageTitleContext } from '../Context/PageTitleContext';

const usePageTitle = (title: string, actions?: ReactNode, showBack?: boolean, deps: any[] = []) => {
    const { setPageTitle, clearPageTitle, actionsRef } = usePageTitleContext();

    // Always keep the ref current so reactive actions (toggles, permission-gated
    // buttons) re-render in the title bar without triggering a setState loop.
    actionsRef.current = actions ?? null;

    useEffect(() => {
        // Re-renders the title bar (via setTitleState/actionsVersion) so it
        // picks up the latest actionsRef.current — closures inside `actions`
        // capture current state/props from this render.
        setPageTitle(title, actions, showBack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, showBack, ...deps]);

    useEffect(() => {
        return () => clearPageTitle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return setPageTitle;
};

export default usePageTitle;
