import React from 'react';
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import { PageHeader } from '@hybridsovereign/shared';
import { ResourceListPage } from './ResourceListPage';

export function ServicesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<string | number>(0);

  return (
    <>
      <PageHeader
        title="Service URLs"
        subtitle="Platform service resources and configuration health"
        breadcrumbs={[{ label: 'Sovereign Cloud' }, { label: 'Platform' }, { label: 'Service URLs' }]}
      />
      <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(key)}>
        <Tab eventKey={0} title={<TabTitleText>AAP</TabTitleText>}>
          <ResourceListPage kind="AAPOrg" title="AAP Organizations" secondaryKind="AAPConfig" />
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Quay</TabTitleText>}>
          <ResourceListPage kind="QuayOrg" title="Quay Organizations" secondaryKind="QuayConfig" />
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Vault</TabTitleText>}>
          <ResourceListPage kind="Vault" title="Vault Instances" secondaryKind="VaultKV" />
        </Tab>
      </Tabs>
    </>
  );
}
