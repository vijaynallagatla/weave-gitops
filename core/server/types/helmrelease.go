package types

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"strings"
	"time"

	"github.com/fluxcd/helm-controller/api/v2beta1"
	"github.com/fluxcd/pkg/ssa"

	helmv2 "github.com/fluxcd/helm-controller/api/v2beta1"
	"github.com/fluxcd/source-controller/api/v1beta1"
	pb "github.com/weaveworks/weave-gitops/pkg/api/app"
	"github.com/weaveworks/weave-gitops/pkg/kube"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

func ProtoToHelmRelease(helmReleaseReq *pb.AddHelmReleaseReq) v2beta1.HelmRelease {
	return v2beta1.HelmRelease{
		TypeMeta: metav1.TypeMeta{
			Kind:       v2beta1.HelmReleaseKind,
			APIVersion: v1beta1.GroupVersion.Identifier(),
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      helmReleaseReq.HelmRelease.Name,
			Namespace: helmReleaseReq.Namespace,
			Labels:    getGitopsLabelMap(helmReleaseReq.AppName),
		},
		Spec: v2beta1.HelmReleaseSpec{
			Chart: v2beta1.HelmChartTemplate{
				Spec: v2beta1.HelmChartTemplateSpec{
					Chart:   helmReleaseReq.HelmRelease.HelmChart.Chart,
					Version: helmReleaseReq.HelmRelease.HelmChart.Version,
					SourceRef: v2beta1.CrossNamespaceObjectReference{
						Kind: helmReleaseReq.HelmRelease.HelmChart.SourceRef.Kind.String(),
						Name: helmReleaseReq.HelmRelease.HelmChart.SourceRef.Name,
					},
					Interval: &metav1.Duration{Duration: time.Minute * 1},
				},
			},
		},
		Status: v2beta1.HelmReleaseStatus{
			ObservedGeneration: -1,
		},
	}
}

func HelmReleaseToProto(helmrelease *v2beta1.HelmRelease) *pb.HelmRelease {
	return &pb.HelmRelease{
		Name:        helmrelease.Name,
		ReleaseName: helmrelease.Spec.ReleaseName,
		Namespace:   helmrelease.Namespace,
		Interval: &pb.Interval{
			Minutes: 1,
		},
		HelmChart: &pb.HelmChart{
			Chart:     helmrelease.Spec.Chart.Spec.Chart,
			Namespace: helmrelease.Spec.Chart.Spec.SourceRef.Namespace,
			Name:      helmrelease.Spec.Chart.Spec.SourceRef.Name,
			Version:   helmrelease.Spec.Chart.Spec.Version,
			Interval: &pb.Interval{
				Minutes: 1,
			},
			SourceRef: &pb.SourceRef{
				Kind: getSourceKind(helmrelease.Spec.Chart.Spec.SourceRef.Kind),
			},
		},
		Conditions: mapConditions(helmrelease.Status.Conditions),
	}
}

type hrStorage struct {
	Name     string `json:"name,omitempty"`
	Manifest string `json:"manifest,omitempty"`
}

func getHelmInventory(hr *helmv2.HelmRelease, kubeClient kube.Kube) ([]*pb.GroupVersionKind, error) {
	storageNamespace := hr.GetNamespace()
	if hr.Spec.StorageNamespace != "" {
		storageNamespace = hr.Spec.StorageNamespace
	}

	storageName := hr.GetName()
	if hr.Spec.ReleaseName != "" {
		storageName = hr.Spec.ReleaseName
	} else if hr.Spec.TargetNamespace != "" {
		storageName = strings.Join([]string{hr.Spec.TargetNamespace, hr.Name}, "-")
	}

	storageVersion := hr.Status.LastReleaseRevision
	// skip release if it failed to install
	if storageVersion < 1 {
		return nil, nil
	}

	storageSecret, err := kubeClient.GetSecret(context.TODO(), types.NamespacedName{
		Namespace: storageNamespace,
		Name:      fmt.Sprintf("sh.helm.release.v1.%s.v%v", storageName, storageVersion),
	})

	if err != nil {
		return nil, err
	}

	releaseData, releaseFound := storageSecret.Data["release"]
	if !releaseFound {
		return nil, fmt.Errorf("failed to decode the Helm storage object for HelmRelease '%s'", hr.Name)
	}

	// adapted from https://github.com/helm/helm/blob/02685e94bd3862afcb44f6cd7716dbeb69743567/pkg/storage/driver/util.go
	var b64 = base64.StdEncoding

	b, err := b64.DecodeString(string(releaseData))
	if err != nil {
		return nil, err
	}

	var magicGzip = []byte{0x1f, 0x8b, 0x08}
	if bytes.Equal(b[0:3], magicGzip) {
		r, err := gzip.NewReader(bytes.NewReader(b))
		if err != nil {
			return nil, err
		}
		defer r.Close()

		b2, err := ioutil.ReadAll(r)
		if err != nil {
			return nil, err
		}

		b = b2
	}

	var storage hrStorage
	if err := json.Unmarshal(b, &storage); err != nil {
		return nil, fmt.Errorf("failed to decode the Helm storage object for HelmRelease '%s': %w", hr.Name, err)
	}

	objects, err := ssa.ReadObjects(strings.NewReader(storage.Manifest))
	if err != nil {
		return nil, fmt.Errorf("failed to read the Helm storage object for HelmRelease '%s': %w", hr.Name, err)
	}

	var gvk []*pb.GroupVersionKind

	found := map[string]bool{}

	for _, entry := range objects {
		entry.GetAPIVersion()
		idstr := strings.Join([]string{entry.GetAPIVersion(), entry.GetKind()}, "_")

		if !found[idstr] {
			found[idstr] = true

			gvk = append(gvk, &pb.GroupVersionKind{
				Group:   entry.GroupVersionKind().Group,
				Version: entry.GroupVersionKind().Version,
				Kind:    entry.GroupVersionKind().Kind,
			})
		}
	}

	return gvk, nil
}
