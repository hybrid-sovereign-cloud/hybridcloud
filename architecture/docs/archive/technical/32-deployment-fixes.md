# Deployment Fixes — Known Issues and Resolutions

This document tracks recurring issues discovered during phased deployment and how to resolve them.

---

## 1. Ansible Playbook Recursive Templating Error

**Symptom:** Job pod enters `CrashLoopBackOff` with error:
```
recursive loop detected in template string: {{ <variable_name> }}
```

**Cause:** Ansible play-scope variables with the same names as role defaults cause infinite self-referencing loops when explicitly passed to roles via the `roles:` block.

**Fix:** Remove explicit variable passing from the `roles:` section. Play-scope variables are automatically accessible inside role tasks without explicit passing.

```yaml
# WRONG — causes recursion:
roles:
  - role: my-role
    vars:
      keycloak_url: "{{ keycloak_url }}"

# CORRECT — role accesses play-scope vars directly:
roles:
  - role: my-role
```

**Affected files:** `vault-k8s-auth.yml`, `vault-oidc-auth.yml`, `keycloak-test-users.yml`

---

## 2. Admin Username Hardcoded as "admin" in Role Defaults

**Symptom:** Job fails with `401 Unauthorized` / "Invalid user credentials" when authenticating to Keycloak.

**Cause:** Role defaults for `keycloak_central_admin_user` and `keycloak_services_admin_user` default to `"admin"`, but the RHBK operator creates the initial admin with a different username (e.g., `temp-admin`). The playbook pre_tasks only read the `password` field from the secret but not `username`.

**Fix:** In the playbook `pre_tasks`, read both `username` AND `password` from the admin secret:

```yaml
- name: Set central admin credentials
  ansible.builtin.set_fact:
    keycloak_central_admin_password: "{{ kc_central_secret.resources[0].data.password | b64decode }}"
    keycloak_central_admin_user: >-
      {{ kc_central_secret.resources[0].data.username | b64decode
         if kc_central_secret.resources[0].data.username is defined
         else 'admin' }}
```

**Affected files:** `vault-oidc-auth.yml`, `keycloak-test-users.yml`

---

## 3. Vault OIDC Discovery URL TLS Error

**Symptom:** `vault-oidc-auth` job fails with:
```
{"errors": ["error checking oidc discovery URL"]}
```

**Cause:** Vault cannot validate the TLS certificate presented by Keycloak at the HTTPS discovery URL because the cluster ingress certificate is self-signed and not in Vault's trust store.

**Fix:** Fetch the cluster ingress CA PEM from the `default-ingress-cert` ConfigMap in `openshift-config-managed` and pass it as `oidc_discovery_ca_pem` to the Vault OIDC configuration:

```yaml
- name: Configure OIDC auth
  ansible.builtin.uri:
    url: "{{ vault_addr }}/v1/auth/oidc/config"
    body:
      oidc_discovery_url: "{{ keycloak_url }}/realms/{{ realm }}"
      oidc_discovery_ca_pem: "{{ ingress_ca_pem | default('') }}"
```

**Note:** Do NOT use an internal HTTP Keycloak URL to bypass TLS — Keycloak's OIDC discovery document reports the external HTTPS URL as the `issuer`, causing an issuer mismatch error in Vault.

---

## 4. `ansible.builtin.uri` Does Not Support `params:` Keyword

**Symptom:** Task fails with:
```
Unsupported parameters for (ansible.legacy.uri) module: params
```

**Cause:** `params:` for query string parameters is a `community.general.uri` feature, not supported by `ansible.builtin.uri`.

**Fix:** Embed query parameters directly in the URL:

```yaml
# WRONG:
url: "{{ keycloak_url }}/admin/realms/{{ realm }}/clients"
params:
  clientId: "vault"

# CORRECT:
url: "{{ keycloak_url }}/admin/realms/{{ realm }}/clients?clientId=vault"
```

---

## 5. Vault Identity Group Returns 204 on Idempotent POST

**Symptom:** `Create external group` task fails with "Status code was 204 and not [200]".

**Cause:** Vault's `/v1/identity/group` API returns 204 (No Content) when the group already exists — idempotent update. The task only accepted 200.

**Fix:** Accept both `[200, 204]` in `status_code`, then always GET the group by name to retrieve the canonical ID:

```yaml
- name: Create or update external group
  ansible.builtin.uri:
    url: "{{ vault_addr }}/v1/identity/group"
    status_code: [200, 204]

- name: Lookup group by name to get canonical ID
  ansible.builtin.uri:
    url: "{{ vault_addr }}/v1/identity/group/name/{{ vault_admin_group }}"
    method: GET
    status_code: [200]
  register: admin_group_result
```

---

## 6. ExternalSecrets Deployed After StatefulSets (Wrong Sync Wave Order)

**Symptom:** Pods fail with `secret "gitea-admin-credentials" not found` and `ImagePullBackOff` because pull secrets don't exist when the StatefulSets start.

**Cause:** ExternalSecret resources had positive sync-waves (1, 2) while the parent chart's StatefulSets default to wave 0. Wave 0 runs BEFORE wave 1 and 2.

**Fix:** Use NEGATIVE sync-waves for ExternalSecrets that must exist before the main workloads:

```yaml
annotations:
  argocd.argoproj.io/sync-wave: "-3"  # pull secret (earliest)

annotations:
  argocd.argoproj.io/sync-wave: "-2"  # admin credentials
```

**Note:** After deploying ExternalSecrets with negative waves, ESO reconciles them asynchronously. Pod restarts may be required after the Kubernetes Secrets are populated.

---

## 7. Gitea Route Is HTTP Only

**Symptom:** `GITEA_URL: https://...` in job env fails; Gitea API responds with HTML (OpenShift router 503).

**Cause:** The Gitea OpenShift Route is configured without TLS termination (HTTP only). The HTTPS wildcard router cert for `*.apps.services...` only handles edge termination when the route spec includes `tls:`.

**Fix:** Set `GITEA_URL` to `http://` in job environment variables. The OpenShift Route handles HTTP from external clients via the router's non-TLS listener on port 80.

**Long-term fix:** Add TLS edge termination to the gitea route:
```yaml
gitea:
  route:
    enabled: true
    tls:
      termination: edge
      insecureEdgeTerminationPolicy: Redirect
```

---

## 8. `until:` Condition Fails When `uri` Module Raises Python Exception

**Symptom:** Task fails immediately with:
```
'dict object' has no attribute 'status'
```

**Cause:** When `ansible.builtin.uri` raises a Python-level exception (connection error, SSL error, or module parameter error), the registered variable does not contain a `status` attribute. The `until:` condition then fails to evaluate.

**Fix:** Use `| default(0)` in all `until:` conditions that check `.status`:

```yaml
until: my_result.status | default(0) == 200
```

This returns `False` (0 != 200) instead of raising a Jinja2 AttributeError, allowing the retry loop to continue.

---

## 9. `vault-oidc-auth` Services Keycloak Auth — Stuck Sync

**Symptom:** ArgoCD `gitea` Application shows `OutOfSync` for several hours; `job-gitea-init` stays `Degraded` indefinitely.

**Cause:** The ArgoCD sync operation was stuck (started at first deploy time) and never re-triggered. The `{"operation": null}` patch does not always terminate a running sync; subsequent patches show "no change".

**Fix:**
1. Remove the operation field with `kubectl patch ... --type='json' -p='[{"op":"remove","path":"/operation"}]'`
2. Wait 5s, then re-apply with a fresh sync operation

If the sync remains stuck, use `argocd app terminate-op <name>` if ArgoCD CLI is available, or force-restart the ArgoCD application controller pod.

---

## 10. ArgoCD Sync-Wave Stuck Waiting for Unhealthy StatefulSet

**Symptom:** ArgoCD reports "waiting for healthy state of apps/StatefulSet/gitea-postgresql". ExternalSecrets in later waves are never deployed because ArgoCD is stuck waiting for the StatefulSet.

**Cause:** The StatefulSet (wave 0) was deployed in a previous sync but is unhealthy. ArgoCD's sync-wave mechanism waits for all resources in a wave to become `Healthy` before proceeding to the next wave. If the StatefulSet never becomes healthy (because the secrets it needs come from a later wave), a deadlock occurs.

**Resolution:** 
1. Ensure ExternalSecrets use NEGATIVE sync-waves (see Issue #6)
2. After ExternalSecrets are deployed and Kubernetes Secrets are populated, restart the StatefulSet pods manually: `oc rollout restart statefulset/<name>`
3. Alternatively, terminate the stuck sync operation and trigger a fresh sync

---

## 11. Entity Operator CRD Schema Field Case Mismatch (`billingId` vs `billingID`)

**Symptom:** `entity-operator` ArgoCD Application repeatedly fails with:
```
Entity.hybridsovereign.redhat "acme-corp" is invalid: spec.billingID: Required value
```
Even after adding `Validate=false` to syncOptions.

**Cause:** The entity-operator Helm chart's `samples.yaml` template uses `billingId` (lowercase `d`) from `values.yaml`. However, the CRD schema requires `billingID` (uppercase `D`) and marks it as a required field. Client-side apply still enforces the CRD's required field validation.

**Fix:**
1. Set `samples.enabled: false` in `entityOperator.values` in `central/values.yaml`
2. Create Entity CRs via the `operator-samples` Ansible job at wave 45 using the correct `billingID` field name
3. The Ansible job creates Entity, AAPOrg, and QuayOrg CRs with correct schemas

---

## 12. Plugin Operator Sample CRs Use Wrong Field Names

**Symptom:** `plugin-aap` and `plugin-quay` ArgoCD Applications fail with:
```
failed to create typed patch object: .spec.config: field not declared in schema
```

**Cause:** The plugin-aap chart generates `AAPOrg` with `spec.config` but the CRD requires `spec.aapConfig`. Similarly, plugin-quay generates `QuayOrg` with `spec.config` but the CRD requires `spec.quayConfig`. These are upstream chart bugs where field names were renamed in the CRD but not updated in the chart samples.

**Fix:**
1. Set `samples.enabled: false` in `pluginAap.values` and `pluginQuay.values`
2. Create AAPOrg and QuayOrg CRs with correct field names via the `operator-samples` Ansible job

---

## 13. ArgoCD Skips Auto-Sync After Failed Attempt at Same SHA

**Symptom:** After fixing the root cause of a sync failure, ArgoCD's `selfHeal` does not retry. Logs show: `Skipping auto-sync: failed previous sync attempt to [sha256:...]`

**Cause:** ArgoCD tracks the SHA of the last failed sync attempt. If the desired chart SHA hasn't changed (same OCI artifact), ArgoCD will not auto-retry even after `selfHeal: true`.

**Fix:**
1. Clear the stuck operation: `kubectl patch applications.argoproj.io <app> -n openshift-gitops --type='json' -p='[{"op":"remove","path":"/operation"}]'`
2. Force a manual sync:
   ```
   oc --context central-admin patch applications.argoproj.io <app> -n openshift-gitops \
     --type=merge -p '{"operation": {"initiatedBy": {"username": "admin"}, "sync": {"revision": "HEAD", "syncStrategy": {"hook": {}}}}}'
   ```

---

## 14. RbacConfig CR Stuck in Terminating (Finalizer Deadlock)

**Symptom:** `plugin-rbac` Application is `OutOfSync/Progressing` with "waiting for healthy state of RbacConfig". The RbacConfig has `deletionTimestamp` but a `keycloak` finalizer blocking deletion.

**Cause:** The finalizer runs an Ansible role to clean up the Keycloak client. If the Keycloak service is temporarily unreachable (DNS failure, pod restart), the finalizer fails and the CR is stuck terminating.

**Fix:**
1. Strip the finalizer: `oc patch rbacconfigs.hybridsovereign.redhat <name> -n sovereign-cloud-plugins --type='json' -p='[{"op":"remove","path":"/metadata/finalizers"}]'`
2. ArgoCD will recreate the CR on the next sync
3. If the CR is not auto-recreated, force a sync: `oc patch applications.argoproj.io plugin-rbac -n openshift-gitops --type=merge -p '{"operation": ...}'`

---

## 15. Persistent OutOfSync Due to ESO-Added Default Fields

**Symptom:** ExternalSecret resources show `OutOfSync` despite being `Healthy`. `spec.data[].remoteRef` in the live state has additional fields (`conversionStrategy: Default`, `decodingStrategy: None`, `metadataPolicy: None`) not present in the chart template.

**Cause:** The External Secrets Operator adds default values to `remoteRef` fields after creation. ArgoCD detects these as drift.

**Fix:** Add `/spec/data`, `/spec/target`, and `/metadata/annotations` to the Application's `ignoreDifferences` for `ExternalSecret` resources, alongside `RespectIgnoreDifferences=true` in syncOptions.

---

## 16. operator-samples Ansible Job: Playbook Not Found

**Symptom:** The `operator-samples` Kubernetes Job fails with: `ERROR! the playbook: operator-samples.yml could not be found`

**Cause:** The `operator-samples.yml` playbook was added to the git repo but the `ansible-runner` container image is built with playbooks baked in at build time. The new playbook isn't in the image.

**Fix:** Rebuild and push the ansible-runner image after adding new playbooks:
```bash
cd /path/to/bootstrap
podman build -t quay.example.com/hybrid-sovereign/ansible-runner:latest \
  -f ansible/imagebuild/ansiblerunner/Containerfile ansible/
podman push quay.example.com/hybrid-sovereign/ansible-runner:latest
```
Then delete the failed Kubernetes Job to allow ArgoCD to recreate it with the new image.

---

## 17. plugin-iaac Operator Missing `list`/`watch` for `events.k8s.io`

> **Superseded**: `pluginIaac` is disabled (`enabled: false`). CR-to-Gitea sync is handled by the Go-based `plugin-sdx` operator.

**Symptom:** The `plugin-iaac` operator pod emits a recurring controller-runtime cache error:
```
failed to list events.k8s.io/v1, Kind=Event: events.events.k8s.io is forbidden:
User "system:serviceaccount:sovereign-cloud-plugins:plugin-iaac"
cannot list resource "events" in API group "events.k8s.io" at the cluster scope
```

**Cause:** The upstream `plugin-iaac` Helm chart's `ClusterRole` grants only `create` and `patch` verbs for `events.k8s.io/events`. Controller-runtime's cache/informer machinery requires `list` and `watch` verbs to set up an event informer for the operator. This is an upstream chart bug.

**Impact:** Non-critical. The operator itself reconciles `IaaC` CRs correctly; the missing permission only prevents the event informer from starting, which results in log spam but no functional degradation.

**Fix:** Apply a supplemental `ClusterRole` and `ClusterRoleBinding` (not managed by the `plugin-iaac` ArgoCD Application, so ArgoCD will not prune it) that grants the missing permissions to the `plugin-iaac` ServiceAccount. Added to the `operator-samples` Ansible job:
```yaml
- name: Create supplemental plugin-iaac events RBAC
  kubernetes.core.k8s:
    host: "{{ services_server }}"
    api_key: "{{ services_bearer_token }}"
    state: present
    definition:
      apiVersion: rbac.authorization.k8s.io/v1
      kind: ClusterRole
      metadata:
        name: plugin-iaac-events-watch
      rules:
        - apiGroups: ["events.k8s.io"]
          resources: ["events"]
          verbs: ["list", "watch"]
```

**Upstream:** Upstream chart fix requires adding `list` and `watch` to the `events.k8s.io` events rule in `clusterrole.yaml`. Track upstream for chart version bump.

---

## 18. AAPOrg / QuayOrg CRs Not READY — Missing Backend Platform Services

**Symptom:** All `AAPOrg` and `QuayOrg` CRs remain in `READY: false` state indefinitely. The `plugin-aap` and `plugin-quay` operators log `failed=1` in their Ansible PLAY RECAP with controller-runtime `event runner on failed` errors.

**Cause:** The `plugin-aap` and `plugin-quay` operators require fully deployed backend platforms to reconcile their CRs:
- `AAPOrg` requires: An `AAPConfig` CR named `aap-sovereign-services` pointing to a live Ansible Automation Platform instance
- `QuayOrg` requires: A `QuayConfig` CR named `quay-sovereign-services` pointing to a live Quay registry instance

Neither AAP nor Quay have been deployed to the services cluster yet. The Vault secrets for both (`central/aap-admin` and `central/quay-admin`) contain placeholder credentials:
- `central/aap-admin.password`: `placeholder-update-after-aap-deploy`
- `central/quay-admin.token`: `placeholder-update-after-quay-deploy`

The `defaultAAPConfig.enabled: false` and `defaultQuayConfig.enabled: false` values in `central/values.yaml` intentionally prevent deploying config CRs until backends are live.

**Impact:** Expected failure state. All other operators (`Entity`, `Team`, `Project`, `Assignment`, `PlatformOpenshift`, `Plugin-RBAC`, `Plugin-Vault`, `Plugin-SDX`) are fully reconciled and `READY: true`. AAPOrg/QuayOrg will reconcile once platform services are deployed.

**Fix:** Deploy AAP and Quay backend platform services (pending task `ph-platform-svc`):
1. Deploy Quay operator + instance to services cluster → obtain OAuth token
2. Deploy AAP (Ansible Automation Platform) operator + controller to services cluster → obtain admin credentials
3. Update Vault secrets with real credentials:
   ```bash
   vault kv patch central/aap-admin password=<real_password>
   vault kv patch central/quay-admin token=<real_oauth_token>
   ```
4. Enable `defaultAAPConfig` and `defaultQuayConfig` in `central/values.yaml`
5. ArgoCD will create the `AAPConfig` and `QuayConfig` CRs → operators will reconcile

---

## 19. Duplicate ExternalSecret Ownership Conflict: plugin-rbac vs plugin-vault

**Symptom:** The `plugin-rbac` ArgoCD Application persistently shows `OutOfSync/Healthy` for the `rhbk-services-admin` ExternalSecret in `sovereign-cloud-plugins`. Despite `ignoreDifferences` for `/spec/data`, `/metadata/annotations`, the resource remains OutOfSync due to label drift.

**Cause:** Both the `plugin-rbac` and `plugin-vault` Helm charts define an identical `ExternalSecret` named `rhbk-services-admin` in the `sovereign-cloud-plugins` namespace. They each set their own `app.kubernetes.io/instance` label (`plugin-rbac` vs `plugin-vault`). When ArgoCD syncs one Application, the resource takes that Application's labels. The other Application then sees its labels missing and reports OutOfSync. The resulting label fight produces a permanent OutOfSync state that `ignoreDifferences` cannot resolve because it doesn't cover `/metadata/labels` on the shared resource.

**Root Cause in Charts:** Both operators need the RHBK admin credentials. Each chart independently defines the same ExternalSecret as part of its standard template set rather than expecting it to be provided externally. This creates a dual-ownership conflict.

**Fix:** Disable `externalSecret.enabled: false` in the `pluginRbac.values` section of `central/values.yaml`. The `plugin-vault` Application continues to manage the single `rhbk-services-admin` ExternalSecret as the sole owner, eliminating the label drift.

---

## 20. Gitea Route Missing TLS — SDX/IaaC Operator Gets 503

> **Superseded**: Applies to deprecated Ansible `plugin-iaac`. The Go `plugin-sdx` operator uses the same Gitea HTTPS URL pattern.

**Symptom:** The `Iaac` CR in `sovereign-cloud-plugins` shows `Failure: True` with `Status code was 503 and not [200]: HTTP Error 503: Service Unavailable`. Gitea reachability check fails.

**Cause:** The Gitea Helm chart deployed a plain-HTTP `Route` (no TLS termination). The operator deployment has `GITEA_URL=https://gitea-gitea.apps.central.lab.example.com`, so it contacts Gitea via HTTPS. The OpenShift router returns 503 because the route only handles HTTP traffic.

**Fix:** Add `route.tls.termination: edge` and `route.tls.insecureEdgeTerminationPolicy: Redirect` to the Gitea Helm values in `central/values.yaml`. This configures the OpenShift `Route` with TLS edge termination so HTTPS requests are handled properly.

---

## 21. AAP / Quay Operators Not Reconciling CRs After Restart

**Symptom:** After enabling `AAPConfig` / `QuayConfig`, the `AAPOrg` and `QuayOrg` CRs remain `status: {}` (not reconciled). The operator pods are running but reconciliation for entity-namespace CRs doesn't trigger.

**Cause:** The Ansible Operator SDK caches the list of CRs at startup. CRs in entity namespaces (`entity-acme-corp`, `entity-globex-industries`) were created before the operator connected to those namespaces. After the operator (re)starts, it needs to perform an initial list of all CRs across all namespaces. If the operator starts before the entity namespaces exist, the initial watch misses those CRs.

**Fix:** Restart the operator deployment (`oc rollout restart deployment plugin-aap-controller-manager`) after enabling the Config CR. This forces the operator to reload its informer cache and pick up existing CRs in all watched namespaces.

---

## 22. Quay App Deployment Stuck at 2 Replicas (Insufficient Memory)

**Symptom:** One of two `svc-sovereign-registry-quay-app` pods remains `Pending` indefinitely with `0/11 nodes are available: 8 Insufficient memory`. The Quay operator maintains `replicas: 2` in the deployment.

**Cause:** Quay app pods request `8Gi` of memory each. The cluster nodes have only `~15GB` allocatable memory, most of which is already consumed by other workloads. Running 2 × 8Gi replicas is not feasible.

**Fix:** Add `overrides.replicas: 1` to the `quay` component in the `QuayRegistry` spec. Updated the `quay` Helm chart template (`templates/registry.yaml`) to support per-component overrides via `.Values.registry.components.quay.overrides`, and set it in `central/values.yaml`. Rebuilt and repushed the Quay chart (`0.5.2`) to the OCI registry.
