import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import { configureK8sClient, configurePermissionsClient } from '@hybridsovereign/shared';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
  apiStyle: 'raw',
});

configurePermissionsClient('/api/kubernetes', {
  style: 'ssar',
  fetchFn: consoleFetch as unknown as typeof fetch,
});

export { default as AdminOverviewPage } from './components/AdminOverviewPage';
export { default as AdminEntitiesPage } from './components/AdminEntitiesPage';
export { default as AdminPersonasPage } from './components/AdminPersonasPage';
export { default as AdminServicesPage } from './components/AdminServicesPage';
export { default as AdminOperatorsPage } from './components/AdminOperatorsPage';
export { default as AdminEntityDetailPage } from './components/AdminEntityDetailPage';
export { default as AdminPersonaDetailPage } from './components/AdminPersonaDetailPage';
export { default as AdminServiceDetailPage } from './components/AdminServiceDetailPage';
export { default as AdminOperatorDetailPage } from './components/AdminOperatorDetailPage';
export { default as AdminCreatePage } from './components/AdminCreatePage';
export { default as PerspectiveIcon } from './PerspectiveIcon';
export { getLandingPageURL, getImportRedirectURL } from './perspective';
export { useSovereignAccessFlags } from './featureFlags';
