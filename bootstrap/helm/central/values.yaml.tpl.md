# values.yaml lab parameterization

Committed `values.yaml` still carries lab FQDNs until ApplicationSet `helm.parameters`
(from `make sync-lab-helm-params`) and `values-lab.yaml` fully replace them.

Kill-switch overrides (ApplicationSet parameters):
- servicesCluster.server
- oci.registry / oci.repositoryBase
- lab.*

Local overlay: `make render-values-lab` → `values-lab.yaml` (gitignored).
Vault: `make upload-lab-config` → `central/data/lab-config`.
