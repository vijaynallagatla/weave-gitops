## gitops upgrade

Upgrade to Weave GitOps Enterprise

```
gitops upgrade [flags]
```

### Examples

```
  # Upgrade Weave GitOps in the wego-system namespace
  gitops upgrade --version 0.0.15 --app-config-url https://github.com/my-org/my-management-cluster.git
```

### Options

```
      --app-config-url string   URL of external repository that will hold automation manifests
      --base string             The base branch to open the pull request against (default "main")
      --branch string           The branch to create the pull request from (default "tier-upgrade-enterprise")
      --commit-message string   The commit message (default "Upgrade to WGE")
      --dry-run                 Output the generated profile without creating a pull request
  -h, --help                    help for upgrade
      --set stringArray         set values on the command line (can specify multiple or separate values with commas: key1=val1,key2=val2)
      --version string          Version of Weave GitOps Enterprise to be installed
```

### Options inherited from parent commands

```
  -e, --endpoint string    The Weave GitOps Enterprise HTTP API endpoint
      --namespace string   The namespace scope for this operation (default "wego-system")
  -v, --verbose            Enable verbose output
```

### SEE ALSO

* [gitops](gitops.md)	 - Weave GitOps

###### Auto generated by spf13/cobra on 2-Dec-2021