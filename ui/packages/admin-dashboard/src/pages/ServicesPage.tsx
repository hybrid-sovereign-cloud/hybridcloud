import React from 'react';
import { Tabs, Tab, TabTitleText, Title } from '@patternfly/react-core';
import { ResourceListPage } from './ResourceListPage';

export function ServicesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<string | number>(0);

  return (
    <>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1rem' }}>
        Platform Services
      </Title>
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
