package types

import (
	"path/filepath"
	"testing"
	"time"

	"github.com/fluxcd/kustomize-controller/api/v1beta2"
	"github.com/fluxcd/pkg/apis/meta"
	"github.com/fluxcd/source-controller/api/v1beta1"
	. "github.com/onsi/gomega"
	"github.com/weaveworks/weave-gitops/core/repository"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	testPath         = "./path/test/flux-system"
	syncFileContents = `
# This manifest was generated by flux. DO NOT EDIT.
---
apiVersion: source.toolkit.fluxcd.io/v1beta1
kind: GitRepository
metadata:
  name: flux-system
  namespace: flux-system
spec:
  interval: 1m0s
  ref:
    branch: main
  secretRef:
    name: flux-system
  url: ssh://git@github.com/jamwils/gitops-repo-000.git
---
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: flux-system
  namespace: flux-system
spec:
  interval: 10m0s
  path: ./dev-cluster
  prune: true
  sourceRef:
    kind: GitRepository
    name: flux-system
`
)

type toolkitFixture struct {
	*GomegaWithT
	committer repository.Committer
}

func setUpToolkitFixture(t *testing.T) toolkitFixture {
	return toolkitFixture{
		committer:   repository.NewGitCommitter(),
		GomegaWithT: NewGomegaWithT(t),
	}
}

func TestNewGitopsToolkit_NoFiles(t *testing.T) {
	f := setUpToolkitFixture(t)

	_, err := NewGitopsToolkit(nil)

	f.Expect(err).To(MatchError(ErrNoGitopsToolkitFiles))
}

func TestNewGitopsToolkit_SyncMarshals(t *testing.T) {
	f := setUpToolkitFixture(t)

	tk, err := NewGitopsToolkit([]repository.File{
		{Path: filepath.Join(testPath, gotkSyncFileName), Data: []byte(syncFileContents)},
	})

	f.Expect(err).To(BeNil())
	f.Expect(tk.SystemPath).To(Equal(filepath.Join("./dev-cluster", systemPath)))
	f.Expect(tk.syncRepo).To(Equal(v1beta1.GitRepository{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "source.toolkit.fluxcd.io/v1beta1",
			Kind:       "GitRepository",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "flux-system",
			Namespace: "flux-system",
		},
		Spec: v1beta1.GitRepositorySpec{
			Interval: metav1.Duration{Duration: time.Minute},
			Reference: &v1beta1.GitRepositoryRef{
				Branch: "main",
			},
			SecretRef: &meta.LocalObjectReference{Name: "flux-system"},
			URL:       "ssh://git@github.com/jamwils/gitops-repo-000.git",
		},
	}))

	f.Expect(tk.syncKustomization).To(Equal(v1beta2.Kustomization{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "kustomize.toolkit.fluxcd.io/v1beta2",
			Kind:       "Kustomization",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      "flux-system",
			Namespace: "flux-system",
		},
		Spec: v1beta2.KustomizationSpec{
			Interval: metav1.Duration{Duration: 10 * time.Minute},
			Path:     "./dev-cluster",
			Prune:    true,
			SourceRef: v1beta2.CrossNamespaceSourceReference{
				Kind: "GitRepository",
				Name: "flux-system",
			},
		},
	}))
}