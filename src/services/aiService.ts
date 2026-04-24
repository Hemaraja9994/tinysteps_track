import { GoogleGenAI } from "@google/genai";

// Vite replaces `process.env.GEMINI_API_KEY` at build time via the `define`
// block in vite.config.ts. We also fall back to `import.meta.env.GEMINI_API_KEY`
// so local developers using `.env` files without the define still work.
function resolveApiKey(): string | null {
  try {
    // Guard the typeof check so this does not ReferenceError in the browser if
    // the Vite `define` substitution ever disappears.
    const fromProcess = typeof process !== "undefined" ? (process as any)?.env?.GEMINI_API_KEY : undefined;
    if (fromProcess && typeof fromProcess === "string" && fromProcess.trim()) return fromProcess;
  } catch {
    /* swallow */
  }
  try {
    const fromImport = (import.meta as any)?.env?.GEMINI_API_KEY ?? (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
    if (fromImport && typeof fromImport === "string" && fromImport.trim()) return fromImport;
  } catch {
    /* swallow */
  }
  return null;
}

let genAI: GoogleGenAI | null = null;
let warnedMissingKey = false;

function getAI(): GoogleGenAI | null {
  if (genAI) return genAI;
  const apiKey = resolveApiKey();
  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        "[aiService] GEMINI_API_KEY is not configured. AI interpretation will be skipped. " +
          "Set GEMINI_API_KEY in your deployment environment (Cloud Run env var or .env) to enable it.",
      );
    }
    return null;
  }
  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

const FALLBACK_MESSAGE =
  "AI interpretation is not available in this environment. Set the `GEMINI_API_KEY` environment variable to enable automated clinical summaries, or review the clinical data in the modules above manually.";

const ERROR_MESSAGE =
  "Unable to generate AI interpretation at this time. The service returned an error — please retry in a moment or review the clinical data manually.";

// Common Gemini model names. `gemini-3-flash-preview` has been observed to 404
// in some API revisions, so we fall through on errors.
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export async function interpretClinicalData(
  baby: any,
  growthData: any[],
  hearingData: any[],
  eyeData: any[],
  milestoneData: any[],
  vaccinationData: any[],
) {
  const ai = getAI();
  if (!ai) return FALLBACK_MESSAGE;

  const highRisk = Array.isArray(baby?.highRiskFactors) ? baby.highRiskFactors.join(", ") : "None";

  const prompt = `
      You are an expert neonatologist and developmental specialist.
      Interpret the following comprehensive preterm baby recovery and development data.

      Baby Profile:
      - Name: ${baby?.name ?? "Unknown"}
      - DOB: ${baby?.dob ?? "Not recorded"}
      - Gestational Age at Birth: ${baby?.gestationalAgeAtBirth ?? "Unknown"} weeks
      - Birth Weight: ${baby?.birthWeight ?? "Unknown"}g
      - High Risk Factors: ${highRisk || "None"}

      Growth History (Intergrowth Parameters):
      ${(growthData ?? []).map((g) => `- Date: ${g.date}, Weight: ${g.weight}g, Length: ${g.length}cm, HC: ${g.headCircumference || "N/A"}cm`).join("\n")}

      Hearing Screening History:
      ${(hearingData ?? []).map((h) => `- Date: ${h.date}, Type: ${h.testType}, Result Left: ${h.resultLeft}, Result Right: ${h.resultRight}, Findings: ${h.entFindings}`).join("\n")}

      Ophthalmology (ROP Screening) History:
      ${(eyeData ?? []).map((e) => `- Date: ${e.date}, Stage: ${e.stage}, Zone: ${e.zone}, Plus Disease: ${e.plusDisease}, Findings: ${e.fundusFindings}`).join("\n")}

      Developmental Milestones:
      ${(milestoneData ?? []).map((m) => `- Date: ${m.dateObserved}, Module: ${m.module}, Category: ${m.category}, Skill: ${m.skill}, Status: ${m.status}`).join("\n")}

      Completed Vaccinations (IDs):
      ${(vaccinationData ?? []).map((v) => `- ${v.id} (status: completed)`).join("\n") || "None recorded"}

      Please provide a consolidated "Clinical Trajectory Analysis":
      1. Clinical Summary: Overall status considering GA and corrected age.
      2. Growth & Nutrition: Interpretation of growth trends compared to Intergrowth P50.
      3. Neuro-sensory Health: Consolidated view of Hearing and ROP status.
      4. Developmental Progress: Analysis of milestones (Gross Motor, Fine Motor, Language etc.) based on corrected age.
      5. Preventive Health: Status of vaccinations and upcoming needs.
      6. Potential Risks & Red Flags: Any concerns that require immediate attention (e.g. ROP zone progression, hearing refer, growth stalling).
      7. Action Plan & Next Steps: Specific next steps for the healthcare provider.
      8. Specialist Referrals: Targeted recommendations for consultations (ENT, Ophthalmology, Neuro, OT/PT).

      Format the response in clear, professional Markdown suitable for a medical record.
    `;

  for (const model of MODEL_CANDIDATES) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      if (response?.text) return response.text;
    } catch (error) {
      console.warn(`[aiService] Model ${model} failed, trying next fallback:`, error);
    }
  }

  console.error("[aiService] All model candidates failed.");
  return ERROR_MESSAGE;
}
