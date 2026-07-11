"""Configuration from environment variables."""

from dataclasses import dataclass
import os


WATCHED_KINDS = [
    ("Entity", "entities"),
    ("Team", "teams"),
    ("Assignment", "assignments"),
    ("Project", "projects"),
    ("Persona", "personas"),
    ("PlatformOpenshift", "platformopenshifts"),
    ("CloudOSO", "cloudosos"),
    ("CloudAWS", "cloudawss"),
    ("OpenStackMigration", "openstackmigrations"),
    ("RbacConfig", "rbacconfigs"),
    ("Rbac", "rbacs"),
    ("AAPConfig", "aapconfigs"),
    ("AAPOrg", "aaporgs"),
    ("QuayConfig", "quayconfigs"),
    ("QuayOrg", "quayorgs"),
    ("Vault", "vaults"),
    ("VaultKV", "vaultkvs"),
    ("Iaac", "iaacs"),
]


@dataclass
class Settings:
    gitea_url: str
    gitea_token: str
    gitea_repo_owner: str
    gitea_repo_name: str
    git_clone_path: str
    reconcile_interval: int
    api_group: str = "hybridsovereign.redhat"
    api_version: str = "v1alpha1"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            gitea_url=os.environ.get("GITEA_URL", ""),
            gitea_token=os.environ.get("GITEA_TOKEN", ""),
            gitea_repo_owner=os.environ.get("GITEA_REPO_OWNER", "gitea_admin"),
            gitea_repo_name=os.environ.get("GITEA_REPO_NAME", "tenancy_repo"),
            git_clone_path=os.environ.get("GIT_CLONE_PATH", "/data/git/tenancy_repo"),
            reconcile_interval=int(os.environ.get("RECONCILE_INTERVAL", "300")),
        )
