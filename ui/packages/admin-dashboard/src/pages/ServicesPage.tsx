import React from 'react';
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import { PageHeader,
  useTranslation,
} from '@hybridsovereign/shared';
import { ResourceListPage } from './ResourceListPage';

export function ServicesPage(): React.ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState<string | number>(0);

  return (
    <>
      <PageHeader
        title={t('nav.serviceUrls')}
        subtitle="Platform service resources and configuration health"
        breadcrumbs={[{ label: t('nav.sovereignCloud') }, { label: 'Platform' }, { label: 'Service URLs' }]}
      />
      <Tabs activeKey={activeTab} onSelect={(_e, key) => setActiveTab(key)} mountOnEnter unmountOnExit>
        <Tab eventKey={0} title={<TabTitleText>AAP</TabTitleText>}>
          <ResourceListPage
            kind="AAPOrg"
            title="AAP Organizations"
            secondaryKind="AAPConfig"
            listPath="/services/aaporgs"
            secondaryListPath="/services/aapconfigs"
            hideHeader
            enabled={activeTab === 0}
          />
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Quay</TabTitleText>}>
          <ResourceListPage
            kind="QuayOrg"
            title="Quay Organizations"
            secondaryKind="QuayConfig"
            listPath="/services/quayorgs"
            secondaryListPath="/services/quayconfigs"
            hideHeader
            enabled={activeTab === 1}
          />
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Vault</TabTitleText>}>
          <ResourceListPage
            kind="Vault"
            title="Vault Instances"
            secondaryKind="VaultKV"
            listPath="/services/vaults"
            secondaryListPath="/services/vaultkvs"
            hideHeader
            enabled={activeTab === 2}
          />
        </Tab>
      </Tabs>
    </>
  );
}
