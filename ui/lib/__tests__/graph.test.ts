import _ from "lodash";
import { Core } from "../api/core/core.pb";
import { getChildren } from "../graph";
import { createMockClient } from "../test-utils";

describe("graph lib", () => {
  it("getChildren", async () => {
    const app = {
      name: "my-app",
      namespace: "my-namespace",
      reconciledObjectKinds: [
        { group: "apps", version: "v1", kind: "Deployment" },
      ],
    };
    const name = "stringly";
    const rsName = name + "-7d9b7454c7";
    const podName = rsName + "-mvz75";
    const client = createMockClient({
      GetReconciledObjects: () => {
        return {
          objects: [
            {
              groupVersionKind: {
                group: "apps",
                kind: "Deployment",
                version: "v1",
              },
              name,
              namespace: "default",
              status: "Failed",
              uid: "2f5b0538-919d-4700-8f41-31eb5e1d9a78",
            },
          ],
        };
      },
      GetChildObjects: (req) => {
        if (req.groupVersionKind.kind === "ReplicaSet") {
          return {
            objects: [
              {
                groupVersionKind: {
                  group: "apps",
                  kind: "ReplicaSet",
                  version: "v1",
                },
                name: rsName,
                namespace: "default",
                status: "InProgress",
                uid: "70c0f983-f9a4-4375-adfe-c2c018fc10bd",
              },
            ],
          };
        }

        if (req.groupVersionKind.kind === "Pod") {
          return {
            objects: [
              {
                groupVersionKind: {
                  group: "",
                  kind: "Pod",
                  version: "v1",
                },
                name: podName,
                namespace: "default",
                status: "InProgress",
                uid: "70c0f983-f9a4-4375-adfe-c2c018fc10bd",
              },
            ],
          };
        }
      },
    });

    const objects = await getChildren(
      // @ts-ignore
      client as typeof Core,
      app.name,
      app.namespace,
      [{ group: "apps", version: "v1", kind: "Deployment" }]
    );

    expect(objects.length).toEqual(3);
    const dep = _.find(
      objects,
      (o) => o.groupVersionKind.kind === "Deployment"
    );
    expect(dep).toBeTruthy();
    expect(dep.name).toEqual(name);

    const rs = _.find(objects, (o) => o.groupVersionKind.kind === "ReplicaSet");
    expect(rs).toBeTruthy();
    expect(rs.name).toEqual(rsName);

    const pod = _.find(objects, (o) => o.groupVersionKind.kind === "Pod");
    expect(pod).toBeTruthy();
    expect(pod.name).toEqual(podName);
  });
});
