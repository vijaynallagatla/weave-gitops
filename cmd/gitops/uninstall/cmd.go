package uninstall

// Provides support for adding a repository of manifests to a wego cluster. If the cluster does not have
// wego installed, the user will be prompted to install wego and then the repository will be added.

import (
	"bufio"
	"fmt"
	"io"
	"os"

	"github.com/weaveworks/weave-gitops/pkg/flux"
	"github.com/weaveworks/weave-gitops/pkg/kube"
	"github.com/weaveworks/weave-gitops/pkg/osys"
	"github.com/weaveworks/weave-gitops/pkg/runner"

	"github.com/spf13/cobra"
	wego "github.com/weaveworks/weave-gitops/api/v1alpha1"
	"github.com/weaveworks/weave-gitops/cmd/gitops/version"
	"github.com/weaveworks/weave-gitops/cmd/internal"
	"github.com/weaveworks/weave-gitops/pkg/services/gitops"
)

type params struct {
	DryRun bool
}

var (
	uninstallParams params
	forceUninstall  bool
)

var Cmd = &cobra.Command{
	Use:   "uninstall",
	Short: "Uninstall GitOps",
	Long:  `The uninstall command removes GitOps components from the cluster.`,
	Example: fmt.Sprintf(`  # Uninstall GitOps from the %s namespace
  gitops uninstall`, wego.DefaultNamespace),
	RunE:          uninstallRunCmd,
	SilenceErrors: true,
	SilenceUsage:  true,
	PostRun: func(cmd *cobra.Command, args []string) {
		version.CheckVersion(version.CheckpointParamsWithFlags(version.CheckpointParams(), cmd))
	},
}

func init() {
	Cmd.Flags().BoolVar(&forceUninstall, "force", false, "If set, 'gitops uninstall' will not ask for confirmation")
	Cmd.Flags().BoolVar(&uninstallParams.DryRun, "dry-run", false, "Outputs all the manifests that would be uninstalled")
}

func uninstallRunCmd(cmd *cobra.Command, args []string) error {
	if !forceUninstall {
		fmt.Print("Uninstall will remove all your Applications and any related cluster resources. Are you sure you want to uninstall? [y/N] ")

		reader := bufio.NewReader(os.Stdin)

		userInput, err := reader.ReadString('\n')
		if err != nil && err != io.EOF {
			return fmt.Errorf("error reading from stdin %w", err)
		}

		if userInput != "y\n" {
			return nil
		}
	}

	namespace, _ := cmd.Parent().Flags().GetString("namespace")

	log := internal.NewCLILogger(os.Stdout)
	fluxClient := flux.New(osys.New(), &runner.CLIRunner{})

	k, _, err := kube.NewKubeHTTPClient()
	if err != nil {
		return fmt.Errorf("error creating k8s http client: %w", err)
	}

	gitopsService := gitops.New(log, fluxClient, k)

	return gitopsService.Uninstall(gitops.UninstallParams{
		Namespace: namespace,
		DryRun:    uninstallParams.DryRun,
	})
}
