import { describe, expect, it } from "vitest";
import { caffeineLessonInteractions } from "../lib/lesson-interactions";

describe("caffeine lesson interactions", () => {
  it("include prediction, interpretation, and safe-failure moments", () => {
    const modes = Object.values(caffeineLessonInteractions).map(
      (interaction) => interaction.mode,
    );

    expect(modes).toContain("prediction");
    expect(modes).toContain("interpretation");
    expect(modes).toContain("safe-failure");
  });

  it("provide immediate feedback and one preferred reasoning path", () => {
    for (const interaction of Object.values(caffeineLessonInteractions)) {
      expect(interaction.options).toHaveLength(3);
      expect(interaction.options.filter((option) => option.preferred)).toHaveLength(1);
      expect(interaction.options.every((option) => option.feedback.length > 40)).toBe(true);
      expect(interaction.boundary.length).toBeGreaterThan(30);
    }
  });

  it("keeps scientific boundaries explicit", () => {
    const joinedBoundaries = Object.values(caffeineLessonInteractions)
      .map((interaction) => interaction.boundary)
      .join(" ");

    expect(joinedBoundaries).toContain("not a new calculation");
    expect(joinedBoundaries).toContain("not a binding");
    expect(joinedBoundaries).toContain("not calculated a modified caffeine analog");
  });
});
