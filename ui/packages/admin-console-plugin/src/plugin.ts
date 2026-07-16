import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import { configureK8sClient } from '@hybridsovereign/shared';

configureK8sClient({
  baseUrl: '/api/kubernetes',
  fetchFn: consoleFetch as unknown as typeof fetch,
});

export { default as AdminOverviewPage } from './components/AdminOverviewPage';
export { default as AdminEntitiesPage } from './components/AdminEntitiesPage';
export { default as AdminPersonasPage } from './components/AdminPersonasPage';
export { default as AdminServicesPage } from './components/AdminServicesPage';
export { default as AdminOperatorsPage } from './components/AdminOperatorsPage';
export {
  perspectiveIcon,
  perspectiveLandingPage,
  perspectiveImportRedirect,
} from './perspective';
