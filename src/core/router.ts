/** Minimal hash router: works offline without any server rewrites. */

import { useEffect, useState } from 'react';

export function useHashRoute(): string {
  const get = () => window.location.hash.slice(1) || '/';
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const onChange = () => setRoute(get());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(path: string): void {
  if (window.location.hash === `#${path}`) return;
  window.location.hash = path;
}

export interface RouteMatch {
  /** Module path segment, e.g. `fx`. Empty on home. */
  moduleId: string;
  /** In-module path after the slash, e.g. `json-format`. Empty if none. */
  toolId: string;
}

export function matchRoute(route: string): RouteMatch {
  const clean = route.replace(/^\/+|\/+$/g, '');
  if (!clean) return { moduleId: '', toolId: '' };
  const [moduleId = '', toolId = ''] = clean.split('/');
  return { moduleId, toolId };
}
