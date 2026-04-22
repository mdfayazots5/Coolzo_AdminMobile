import { IS_MOCK } from "../../../src/core/config/api-config";

export { IS_MOCK };

export type ApiContractStatus = "mock" | "live" | "mixed";

export interface ApiContractEntry {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  request: string;
  response: string;
  status: ApiContractStatus;
}
