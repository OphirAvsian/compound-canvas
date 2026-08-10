export type LessonDecisionOption = {
  id: string;
  label: string;
  feedback: string;
  preferred?: boolean;
};

export type LessonInteraction = {
  eyebrow: string;
  title: string;
  prompt: string;
  options: LessonDecisionOption[];
  boundary: string;
  mode: "prediction" | "interpretation" | "safe-failure";
};

export const caffeineLessonInteractions = {
  conformerPrediction: {
    mode: "prediction",
    eyebrow: "Predict before calculating",
    title: "What will Generate 3D change?",
    prompt:
      "Before you press the real calculation button, make a prediction. The 2D drawing already knows atoms and bonds. What does the 3D step add?",
    options: [
      {
        id: "identity",
        label: "It changes caffeine into a different molecule.",
        feedback:
          "Not quite. A conformer should preserve the molecule identity. If the formula changed, that would be a different chemical problem.",
      },
      {
        id: "coordinates",
        label: "It gives the same atoms x, y, and z positions in space.",
        preferred: true,
        feedback:
          "Exactly. RDKit keeps the atom-and-bond graph, then creates one plausible 3D arrangement and relaxes the geometry.",
      },
      {
        id: "protein",
        label: "It places caffeine into EGFR.",
        feedback:
          "That is the tempting leap, but it has not happened yet. Generate 3D creates ligand coordinates only; it does not test the molecule against a protein.",
      },
    ],
    boundary: "This is a prediction checkpoint, not a new calculation or docking result.",
  },
  conformerInterpretation: {
    mode: "interpretation",
    eyebrow: "Interpret the result",
    title: "Which readout helps you reason about flexibility?",
    prompt:
      "Look at the calculated properties below the viewer. If a molecule has many bonds that can spin, it can explore more shapes before docking.",
    options: [
      {
        id: "weight",
        label: "Molecular weight",
        feedback:
          "Mass matters for many drug-like properties, but it does not directly tell you how many internal bonds can rotate.",
      },
      {
        id: "rotatable",
        label: "Rotatable bonds",
        preferred: true,
        feedback:
          "Right. Rotatable bonds are a beginner-friendly clue for flexibility. More flexibility can help exploration, but it can also make the search harder.",
      },
      {
        id: "formula",
        label: "Formula",
        feedback:
          "The formula tells you atom counts. Two molecules with the same formula can still have different shapes and flexibility.",
      },
    ],
    boundary:
      "This helps you interpret a real RDKit result. It is not a binding or activity prediction.",
  },
  ligandTradeoff: {
    mode: "safe-failure",
    eyebrow: "Safe design failure",
    title: "A molecule change can help one goal and hurt another.",
    prompt:
      "Imagine you modify caffeine by adding a polar group because you want more possible hydrogen bonds. What is the most scientifically careful prediction?",
    options: [
      {
        id: "always-better",
        label: "More possible hydrogen bonds always makes the molecule better.",
        feedback:
          "This is the classic beginner trap. More interaction opportunities can help one goal, but they can also change shape, charge balance, solubility, or how the molecule fits.",
      },
      {
        id: "tradeoff",
        label: "It might help one interaction idea while creating a new tradeoff.",
        preferred: true,
        feedback:
          "Yes. Drug design is multi-objective: scientists balance shape, polarity, charge, flexibility, preparation assumptions, and experimental evidence.",
      },
      {
        id: "identity",
        label: "Preparation would prove whether that modified molecule binds EGFR.",
        feedback:
          "Preparation only defines input files. It still would not prove binding, activity, safety, or whether the modification was useful.",
      },
    ],
    boundary:
      "This is an educational design scenario. Compound Canvas has not calculated a modified caffeine analog here.",
  },
  egfrEvidenceChoice: {
    mode: "prediction",
    eyebrow: "Choose the evidence",
    title: "Which structure should guide the EGFR active-site story?",
    prompt:
      "You have two molecule stories on screen: caffeine was calculated by RDKit, and gefitinib was experimentally deposited inside EGFR in 2ITY. Which one is legitimate evidence for where the 2ITY active-site lesson begins?",
    options: [
      {
        id: "caffeine",
        label: "Use caffeine because it is the molecule I started with.",
        feedback:
          "Reasonable instinct, but not enough evidence. Caffeine has a calculated 3D shape, but Compound Canvas has not placed it inside EGFR.",
      },
      {
        id: "gefitinib",
        label: "Use deposited gefitinib because its position comes from the 2ITY experiment.",
        preferred: true,
        feedback:
          "Correct. Gefitinib is the experimentally deposited ligand in 2ITY, so it can anchor a curated active-site lesson. That still does not prove anything about caffeine.",
      },
      {
        id: "either",
        label: "Either molecule works because both have rings.",
        feedback:
          "Shared ring shapes can be interesting, but visual similarity is not evidence of protein placement or binding.",
      },
    ],
    boundary:
      "This decision separates calculated ligand geometry from experimental protein-ligand coordinates.",
  },
  dockingScoreInterpretation: {
    mode: "interpretation",
    eyebrow: "Interpret before concluding",
    title: "What is the safest conclusion from the Vina score?",
    prompt:
      "You now have five scored poses from one curated docking lesson. Which conclusion stays scientifically honest?",
    options: [
      {
        id: "drug",
        label: "The score proves caffeine is an EGFR drug candidate.",
        feedback:
          "That overclaims the result. A Vina score is a model estimate, not experimental evidence of binding, activity, safety, or efficacy.",
      },
      {
        id: "within-run",
        label: "The score helps compare poses inside this same controlled docking run.",
        preferred: true,
        feedback:
          "Exactly. Within one run, lower scores can help rank candidate poses for inspection. They do not transfer into proof that the molecule works in biology.",
      },
      {
        id: "ignore",
        label: "The score is meaningless and should always be ignored.",
        feedback:
          "Not quite. Docking scores can guide careful follow-up, but only when you remember the assumptions and limitations.",
      },
    ],
    boundary:
      "No new calculation happens here. This checkpoint teaches how to read the existing docking output.",
  },
} satisfies Record<string, LessonInteraction>;
