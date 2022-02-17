import _ from "lodash";
import * as React from "react";
import styled from "styled-components";
import { AppContext } from "../contexts/AppContext";
import { GroupVersionKind, UnstructuredObject } from "../lib/api/app/flux.pb";
import { AutomationKind } from "../lib/api/applications/applications.pb";
import { getChildren } from "../lib/graph";
import { AutomationType } from "../lib/types";
import DataTable from "./DataTable";
import KubeStatusIndicator from "./KubeStatusIndicator";

type Props = {
  className?: string;
  automationName: string;
  automationNamespace: string;
  automationKind: AutomationType;
  kinds: GroupVersionKind[];
};

function ReconciledObjectsTable({
  className,
  automationName,
  automationNamespace,
  automationKind,
  kinds,
}: Props) {
  const [c, setChildren] = React.useState([]);
  const { applicationsClient: legacyApps } = React.useContext(AppContext);

  React.useEffect(() => {
    if (!automationName) {
      return;
    }

    (async () => {
      const { objects } = await legacyApps.GetReconciledObjects({
        automationName,
        automationKind: AutomationKind[automationKind],
        automationNamespace,
        kinds,
      });

      const ks = _.map(objects, "groupVersionKind");

      const uniqKinds = _.uniqBy(ks, "kind");
      if (uniqKinds.length === 0) {
        return;
      }

      const children = await getChildren(
        legacyApps,
        {
          name: automationName,
          namespace: automationNamespace,
        },
        uniqKinds
      );

      setChildren(children);
    })();
  }, [automationName, automationNamespace, automationKind]);

  return (
    <div className={className}>
      <DataTable
        sortFields={["name", "type", "namespace", "status"]}
        fields={[
          { value: "name", label: "Name" },
          {
            label: "Type",
            value: (u: UnstructuredObject) => `${u.groupVersionKind.kind}`,
          },
          {
            label: "Namespace",
            value: "namespace",
          },
          {
            label: "Status",
            value: (u: UnstructuredObject) =>
              u.conditions.length > 0 ? (
                <KubeStatusIndicator conditions={u.conditions} />
              ) : null,
          },
          {
            label: "Message",
            value: (u: UnstructuredObject) => _.first(u.conditions)?.message,
          },
        ]}
        rows={c}
      />
    </div>
  );
}

export default styled(ReconciledObjectsTable).attrs({
  className: ReconciledObjectsTable.name,
})``;
