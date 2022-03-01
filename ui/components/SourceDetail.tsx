import _ from "lodash";
import * as React from "react";
import styled from "styled-components";
import { useListAutomations } from "../hooks/automations";
import { useListSources } from "../hooks/sources";
import { SourceRefSourceKind } from "../lib/api/core/types.pb";
import Alert from "./Alert";
import AutomationsTable from "./AutomationsTable";
import Flex from "./Flex";
import Heading from "./Heading";
import Icon, { IconType } from "./Icon";
import InfoList, { InfoField } from "./InfoList";
import { computeMessage, computeReady } from "./KubeStatusIndicator";
import LoadingPage from "./LoadingPage";
import Text from "./Text";

type Props = {
  className?: string;
  type: SourceRefSourceKind;
  name: string;
  namespace: string;
  children?: JSX.Element;
  info: <T>(s: T) => InfoField[];
};

function SourceDetail({ className, name, info }: Props) {
  const { data: sources, isLoading, error } = useListSources();
  const { data: automations } = useListAutomations();

  if (isLoading) {
    return <LoadingPage />;
  }

  const s = _.find(sources, { name });

  const items = info(s);

  const relevantAutomations = _.filter(automations, (a) => {
    if (!s) {
      return false;
    }

    if (a?.sourceRef?.kind == s.type && a.sourceRef.name == name) {
      return true;
    }

    return false;
  });

  const ok = computeReady(s.conditions);
  const msg = computeMessage(s.conditions);

  return (
    <div className={className}>
      <Flex align wide between>
        <div>
          <Heading level={2}>{s.name}</Heading>
        </div>
        <div className="page-status">
          {ok ? (
            <Icon
              color="success"
              size="medium"
              type={IconType.CheckMark}
              text={msg}
            />
          ) : (
            <Icon
              color="alert"
              size="medium"
              type={IconType.ErrorIcon}
              text={`Error: ${msg}`}
            />
          )}
        </div>
      </Flex>
      {error && (
        <Alert severity="error" title="Error" message={error.message} />
      )}
      <div>
        <Heading level={3}>{s.type}</Heading>
      </div>
      <div>
        <InfoList items={items} />
      </div>
      <div>
        <AutomationsTable automations={relevantAutomations} />
      </div>
    </div>
  );
}

export default styled(SourceDetail).attrs({ className: SourceDetail.name })`
  h2 {
    font-size: 20px;
    margin-bottom: 12px;
  }

  h3 {
    font-size: 20px;
    margin-top: 0;
    margin-bottom: 24px;
    font-weight: 400;
    color: #737373;
  }

  ${InfoList} {
    margin-bottom: 60px;
  }

  .page-status ${Icon} ${Text} {
    color: ${(props) => props.theme.colors.black};
    font-weight: normal;
  }
`;
