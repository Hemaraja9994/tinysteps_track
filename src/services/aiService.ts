import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function interpretClinicalData(
  baby: any, 
  growthData: any[], 
  hearingData: any[],
  eyeData: any[],
  milestoneData: any[],
  vaccinationData: any[]
) {
  try {
    const ai = getAI();
    const prompt = `
      You are an expert neonatologist and developmental specialist. 
      Interpret the following comprehensive preterm baby recovery and development data.
      
      Baby Profile:
      - Name: ${baby.name}
      - DOB: ${baby.dob}
      - Gestational Age at Birth: ${baby.gestationalAgeAtBirth} weeks
      - Birth Weight: ${baby.birthWeight}g
      - High Risk Factors: ${baby.highRiskFactors?.join(', ') || 'None'}

      Growth History (Intergrowth Parameters):
      ${growthData.map(g => `- Date: ${g.date}, Weight: ${g.weight}g, Length: ${g.length}cm, HC: ${g.headCircumference || 'N/A'}cm`).join('\n')}

      Hearing Screening History:
      ${hearingData.map(h => `- Date: ${h.date}, Type: ${h.testType}, Result Left: ${h.resultLeft}, Result Right: ${h.resultRight}, Findings: ${h.entFindings}`).join('\n')}

      Ophthalmology (ROP Screening) History:
      ${eyeData.map(e => `- Date: ${e.date}, Stage: ${e.stage}, Zone: ${e.zone}, Plus Disease: ${e.plusDisease}, Findings: ${e.fundusFindings}`).join('\n')}

      Developmental Milestones:
      ${milestoneData.map(m => `- Date: ${m.dateObserved}, Module: ${m.module}, Category: ${m.category}, Skill: ${m.skill}, Status: ${m.status}`).join('\n')}

      Completed Vaccinations (IDs):
      ${vaccinationData.map(v => `- ${v.id} (status: completed)`).join('\n') || 'None recorded'}

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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Interpretation Error:", error);
    return "Unable to generate AI interpretation at this time. Please review the clinical data manually.";
  }
}
