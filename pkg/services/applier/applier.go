package applier

import (
	"bytes"
	"context"
	"fmt"
	"github.com/weaveworks/weave-gitops/pkg/kube"
	"github.com/weaveworks/weave-gitops/pkg/logger"
	"github.com/weaveworks/weave-gitops/pkg/models"
	"github.com/weaveworks/weave-gitops/pkg/services/automation"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type ClusterApplier interface {
	ApplyManifests(ctx context.Context, cluster models.Cluster, namespace string, manifests []automation.AutomationManifest) error
}

type ClusterApplySvc struct {
	Kube   kube.Kube
	Client client.Client
	Logger logger.Logger
}

var _ ClusterApplier = &ClusterApplySvc{}

func NewClusterApplier(kubeClient kube.Kube, rawClient client.Client, logger logger.Logger) ClusterApplier {
	return &ClusterApplySvc{
		Kube:   kubeClient,
		Client: rawClient,
		Logger: logger,
	}
}

func (a *ClusterApplySvc) ApplyManifests(ctx context.Context, cluster models.Cluster, namespace string, manifests []automation.AutomationManifest) error {
	for _, manifest := range manifests {
		ms := bytes.Split(manifest.Content, []byte("---\n"))

		for _, m := range ms {
			if len(bytes.Trim(m, " \t\n")) == 0 {
				continue
			}

			if err := a.Kube.Apply(ctx, m, namespace); err != nil {
				return fmt.Errorf("could not apply manifest: %w", err)
			}
		}
	}

	return nil
}