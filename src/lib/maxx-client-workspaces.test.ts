import { describe, expect, it } from "vitest";
import {
  MAXX_CLIENT_CATALOG,
  canSendClientTask,
  catalogItem,
  type VerifiedClientWorkspace,
} from "./maxx-client-workspaces";

const authorized: VerifiedClientWorkspace = {
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  organizationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  slug: "bunna-restaurant", name: "BUNNA RESTAURANT",
  role: "operator", status: "active", pendingApprovalCount: null,
};
describe("MAXX proposed client catalog is not an authorization grant", () => {
  it("includes exactly the seven user-confirmed companies", () => {
    expect(MAXX_CLIENT_CATALOG.map(x=>x.name)).toEqual([
      "CROWN AND CORE", "THP FLOORING", "BUNNA RESTAURANT",
      "MACS DIGITAL MEDIA", "ASC3ND", "3X PLUMBERS", "TANGLES AND LOCS",
    ]);
  });
  it("switching company changes available task suggestions", () => {
    const thp = catalogItem("thp-flooring");
    const bunna = catalogItem("bunna-restaurant");
    expect(thp?.suggestedTasks).toHaveLength(4);
    expect(bunna?.suggestedTasks).toHaveLength(4);
    expect(thp?.suggestedTasks).not.toEqual(bunna?.suggestedTasks);
    expect(thp?.suggestedTasks.join(" ")).toMatch(/flooring/i);
    expect(bunna?.suggestedTasks.join(" ")).toMatch(/cash|ordering/i);
  });
  it("never permits client tasks solely because a slug is listed", () => {
    expect(canSendClientTask()).toBe(false);
    expect(canSendClientTask({...authorized,role:"viewer"})).toBe(false);
    expect(canSendClientTask({...authorized,role:"reviewer"})).toBe(false);
    expect(canSendClientTask({...authorized,status:"archived"})).toBe(false);
    expect(canSendClientTask({...authorized,status:"paused"})).toBe(false);
    expect(canSendClientTask(authorized)).toBe(true);
  });
  it("marks pending approvals unknown unless a real join is available", () => {
    expect(authorized.pendingApprovalCount).toBeNull();
  });
});
