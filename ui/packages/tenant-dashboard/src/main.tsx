import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@patternfly/react-core/dist/styles/base.css';
import '@hybridsovereign/shared/styles/openshift.css';
import { configureK8sClient } from '@hybridsovereign/shared';
import { App } from './App';

configureK8sClient({ apiStyle: 'dashboard', baseUrl: '/api/k8s' });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
