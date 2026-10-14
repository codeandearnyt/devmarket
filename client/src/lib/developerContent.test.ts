import { describe, expect, it } from "vitest";
import {
  FAQ_ITEMS,
  JOURNEY,
  PORTFOLIO_FILTERS,
  PRINCIPLES,
  PROJECTS,
  SERVICES,
  SKILL_CLUSTERS,
  TECH_STACK,
  filterProjects,
  type Project,
} from "@/lib/developerContent";

/**
 * These guard the content module rather than the rendering. The page is all
 * presentational, so if the data stops being internally consistent the bug shows
 * up as a broken grid or a filter that silently returns nothing — which is much
 * easier to catch here than by looking at the page.
 */
describe("developer content", () => {
  describe("filterProjects", () => {
    it("returns everything for ALL", () => {
      expect(filterProjects(PROJECTS, "ALL")).toHaveLength(PROJECTS.length);
    });

    it("returns only the requested kind", () => {
      const ai = filterProjects(PROJECTS, "AI");
      expect(ai.length).toBeGreaterThan(0);
      expect(ai.every(project => project.kind === "AI")).toBe(true);
    });

    it("returns an empty array for a kind nothing matches", () => {
      const nothing: Project[] = [];
      expect(filterProjects(nothing, "WEB")).toEqual([]);
    });

    it("never mutates the source list", () => {
      const snapshot = [...PROJECTS];
      filterProjects(PROJECTS, "WEB");
      expect(PROJECTS).toEqual(snapshot);
    });
  });

  it("gives every project a unique id, and the expected number of them", () => {
    expect(PROJECTS).toHaveLength(10);
  });

  it("gives every project a live https url and a cover image", () => {
    for (const project of PROJECTS) {
      expect(project.url).toMatch(/^https:\/\//);
      expect(project.cover).toMatch(/^\/projects\/[a-z0-9-]+\.jpg$/);
      expect(project.outcome.length).toBeGreaterThan(15);
    }
  });

  it("gives every project a unique id", () => {
    const ids = PROJECTS.map(project => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses project kinds the filter bar offers", () => {
    const offered = PORTFOLIO_FILTERS.map(filter => filter.id);
    expect(PROJECTS.every(project => offered.includes(project.kind))).toBe(true);
  });

  it("gives every skill a unique id and a known stage", () => {
    const skills = SKILL_CLUSTERS.flatMap(cluster => cluster.skills);
    const ids = skills.map(skill => skill.id);

    expect(skills).toHaveLength(16);
    expect(new Set(ids).size).toBe(ids.length);
    expect(skills.every(skill => ["Learning", "Building", "Shipping"].includes(skill.stage))).toBe(true);
  });

  it("gives every skill at least one tag and a description", () => {
    for (const cluster of SKILL_CLUSTERS) {
      for (const skill of cluster.skills) {
        expect(skill.tags.length).toBeGreaterThan(0);
        expect(skill.copy.length).toBeGreaterThan(20);
      }
    }
  });

  it("gives every principle a unique number", () => {
    const numbers = PRINCIPLES.map(principle => principle.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("gives every FAQ item a unique id", () => {
    const ids = FAQ_ITEMS.map(item => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a non-empty tech stack with unique slugs", () => {
    expect(TECH_STACK.length).toBeGreaterThan(10);
    const slugs = TECH_STACK.map(tool => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(TECH_STACK.every(tool => tool.name.length > 0 && tool.slug.length > 0)).toBe(true);
  });

  it("offers exactly fourteen services", () => {
    expect(SERVICES).toHaveLength(14);
  });

  it("gives every service a unique id, three points and an icon", () => {
    const ids = SERVICES.map(service => service.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const service of SERVICES) {
      expect(service.points).toHaveLength(3);
      expect(service.icon).toBeTruthy();
    }
  });

  it("orders the journey from earliest to latest", () => {
    expect(JOURNEY.length).toBeGreaterThanOrEqual(4);
    expect(JOURNEY[0].when).toBe("Started");
  });
});