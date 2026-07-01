import { useState, useEffect } from 'react';
import {
  checkEndpointPermissionsService,
  type EndpointCheckResult,
} from '../Services/ApiServices/roleServices';

export interface PermissionEndpoint {
  key: string;
  endpointKey: string;
  pathParams?: Record<string, string>;
}

const CHECK_PERMISSION_ENABLED =
  String(import.meta.env.VITE_CHECK_PERMISSION ?? '').trim().toLowerCase() === 'true';

/**
 * Batch permission check for a page. Call once with all endpoints you care about;
 * returns a record of key -> allowed (defaults to false until loaded).
 * When VITE_CHECK_PERMISSION=false all keys resolve to true immediately.
 */
export function usePagePermissions(
  endpoints: PermissionEndpoint[]
): Record<string, boolean> {
  const allTrue = endpoints.reduce((acc, { key }) => ({ ...acc, [key]: true }), {});

  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    if (!CHECK_PERMISSION_ENABLED) return allTrue;
    return endpoints.length ? endpoints.reduce((acc, { key }) => ({ ...acc, [key]: false }), {}) : {};
  });

  const stableKeys = endpoints.map((e) => e.key).join(',');
  const stablePayload = endpoints.map((e) => e.endpointKey + JSON.stringify(e.pathParams || {})).join(',');

  useEffect(() => {
    if (!CHECK_PERMISSION_ENABLED || endpoints.length === 0) return;
    let cancelled = false;

    (async () => {
      try {
        const payload = endpoints.map(({ endpointKey, pathParams }) => ({
          endpointKey,
          pathParams,
        }));
        const resp = await checkEndpointPermissionsService(payload);
        if (cancelled) return;
        if (resp.success === 200 && resp.data?.results) {
          const results: EndpointCheckResult[] = resp.data.results;
          const next: Record<string, boolean> = {};
          endpoints.forEach(({ key }, i) => {
            next[key] = results[i]?.allowed === true;
          });
          setPermissions(next);
        }
      } catch {
        if (!cancelled) {
          setPermissions(
            endpoints.reduce((acc, { key }) => ({ ...acc, [key]: false }), {})
          );
        }
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKeys, stablePayload]);

  return permissions;
}
