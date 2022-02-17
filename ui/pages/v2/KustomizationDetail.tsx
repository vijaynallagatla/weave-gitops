import _ from "lodash";
import * as React from "react";
import styled from "styled-components";
import Flex from "../../components/Flex";
import KubeStatusIndicator from "../../components/KubeStatusIndicator";
import Link from "../../components/Link";
import Page from "../../components/Page";
import ReconciledObjectsTable from "../../components/ReconciledObjectsTable";
import Text from "../../components/Text";
import { useGetKustomizations } from "../../hooks/kustomizations";
import { AutomationType, V2Routes } from "../../lib/types";
import { formatURL } from "../../lib/utils";

type Props = {
  name: string;
  className?: string;
};

const Info = styled.div`
  padding-bottom: 32px;
`;

const InfoList = styled(
  ({
    items,
    className,
  }: {
    className?: string;
    items: { [key: string]: any };
  }) => {
    return (
      <table className={className}>
        <tbody>
          {_.map(items, (v, k) => (
            <tr key={k}>
              <td>
                <Text capitalize bold>
                  {k}:
                </Text>
              </td>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
)`
  tbody tr td:first-child {
    min-width: 100px;
  }

  tr {
    height: 16px;
  }
`;

function KustomizationDetail({ className, name }: Props) {
  const { data, isLoading, error } = useGetKustomizations();

  const k = _.find(data?.kustomizations, { name });

  return (
    <Page
      title={k?.name}
      loading={isLoading}
      error={error}
      className={className}
    >
      <Info>
        <h3>{k?.namespace}</h3>
        <InfoList
          items={{
            Source: (
              <Link
                to={formatURL(V2Routes.GitRepo, { name: k?.sourceRef.name })}
              >
                GitRepository/{k?.sourceRef.name}
              </Link>
            ),
            Status: (
              <Flex start>
                <KubeStatusIndicator conditions={k?.conditions} />
                <div>&nbsp; Applied revision {k?.lastAppliedRevision}</div>
              </Flex>
            ),
            Cluster: "",
            Path: k?.path,
          }}
        />
      </Info>

      <ReconciledObjectsTable
        kinds={k?.reconciledObjectKinds}
        automationName={k?.name}
        automationNamespace={k?.namespace}
        automationKind={AutomationType.Kustomization}
      />
    </Page>
  );
}

export default styled(KustomizationDetail).attrs({
  className: KustomizationDetail.name,
})`
  h3 {
    color: #737373;
    font-weight: 200;
    margin-top: 12px;
  }
`;
