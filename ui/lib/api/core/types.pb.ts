/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

export enum AutomationKind {
  KustomizationAutomation = "KustomizationAutomation",
  HelmReleaseAutomation = "HelmReleaseAutomation",
}

export enum SourceRefSourceKind {
  GitRepository = "GitRepository",
  Bucket = "Bucket",
  HelmRepository = "HelmRepository",
  HelmChart = "HelmChart",
}

export enum BucketProvider {
  Generic = "Generic",
  AWS = "AWS",
  GCP = "GCP",
}

export type Interval = {
  hours?: string
  minutes?: string
  seconds?: string
}

export type SourceRef = {
  kind?: SourceRefSourceKind
  name?: string
}

export type Condition = {
  type?: string
  status?: string
  reason?: string
  message?: string
  timestamp?: string
}

export type GitRepositoryRef = {
  branch?: string
  tag?: string
  semver?: string
  commit?: string
}

export type GroupVersionKind = {
  group?: string
  kind?: string
  version?: string
}

export type Kustomization = {
  namespace?: string
  name?: string
  path?: string
  sourceRef?: SourceRef
  interval?: Interval
  conditions?: Condition[]
  lastAppliedRevision?: string
  lastAttemptedRevision?: string
  lastHandledReconciledAt?: string
  inventory?: GroupVersionKind[]
}

export type HelmChart = {
  namespace?: string
  name?: string
  sourceRef?: SourceRef
  chart?: string
  version?: string
  interval?: Interval
  conditions?: Condition[]
}

export type HelmRelease = {
  releaseName?: string
  namespace?: string
  name?: string
  interval?: Interval
  helmChart?: HelmChart
  conditions?: Condition[]
  inventory?: GroupVersionKind[]
}

export type GitRepository = {
  namespace?: string
  name?: string
  url?: string
  reference?: GitRepositoryRef
  secretRef?: string
  interval?: Interval
  conditions?: Condition[]
}

export type HelmRepository = {
  namespace?: string
  name?: string
  url?: string
  interval?: Interval
  conditions?: Condition[]
}

export type Bucket = {
  namespace?: string
  name?: string
  endpoint?: string
  insecure?: boolean
  interval?: Interval
  provider?: BucketProvider
  region?: string
  secretRefName?: string
  timeout?: number
  conditions?: Condition[]
  bucketName?: string
}

export type Deployment = {
  name?: string
  namespace?: string
  conditions?: Condition[]
  images?: string[]
}

export type UnstructuredObject = {
  groupVersionKind?: GroupVersionKind
  name?: string
  namespace?: string
  uid?: string
  status?: string
  conditions?: Condition[]
}