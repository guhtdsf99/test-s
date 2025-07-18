import os
from google import genai
from google.genai import types


def generate_analysis(prompt: str, thinking: bool = False, images=None):
    """Generate AI analysis using Google Gemini"""
    if thinking:
        think = -1
    else:
        think = 0
    model_ = "gemini-2.5-flash"
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    parts_ = []
    if images is not None:
        for image in images:
            parts_.append(
                types.Part.from_bytes(
                    mime_type="image/png",
                    data=image,
                )
            )
    parts_.append(types.Part.from_text(text=prompt))
    contents = [types.Content(role="user", parts=parts_,)]
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig() if thinking else None,
        response_mime_type="text/plain",
    )
    response = client.models.generate_content(
        model=model_,
        contents=contents,
        config=generate_content_config,
    )
    return response


def get_kpi_analysis_prompt(kpi_results, target_company_name):
    return f"""
    You are a senior cybersecurity analyst interpreting phishing campaign KPIs for an executive report. Your analysis must be concise, impactful, and focused on business risk.
    Analyze the following KPI data and generate a summary in markdown bullet points.
    **Guidelines for your analysis:**
    1.  **Lead with the Core Conflict:** Start by analyzing the relationship between the `Average Click Rate` and `Average Reporting Rate`. Frame this as the primary measure of the organization's overall risk posture. Do not just state the numbers; explain the tension or story they tell (e.g., "High reporting is undermined by high vulnerability").
    2.  **Identify the Primary Risk Area:** Clearly state who the `Most Vulnerable Group` is and what their specific `Click Rate` signifies. Frame this as a priority for intervention.
    3.  **Highlight the Paradox/Key Insight:** Analyze the relationship between the `Most Vulnerable Group` and the `Most Effective Group`. If they are the same, explicitly call out this paradox. Explain what this contradiction implies about their awareness versus their actual behavior.
    4.  **Maintain an Executive Tone:** Use strong, direct language. Focus on the "so what?" for leadership, translating data into operational risk.
    5.  **Respond with the markdown directly with no introductions and don't include the title for this section
    6.  **Refere to our organization as {target_company_name}. 
    **KPI Data to Analyze:**
    {kpi_results}
    **Your Analysis:**
    """


def get_department_analysis_prompt(department_stats, target_company_name):
    return f"""
    You are a senior cybersecurity analyst providing a detailed departmental breakdown for an executive report on a recent phishing campaign. Your goal is to translate raw departmental data into actionable business risk intelligence.
    Analyze the following departmental performance data and generate a summary in markdown bullet points.

    **Guidelines for your analysis:**
    1.  **Pinpoint the Outliers:** Immediately identify the single `Highest-Risk Department` (highest click rate) and the `Top-Performing Department` (lowest click rate). State their specific click and report rates.
    2.  **Diagnose the Highest-Risk Group:** For the highest-risk department, analyze the relationship between their `Click Rate` and their `Report Rate`. Explain what this combination signifies (e.g., "This indicates a critical awareness gap, as high vulnerability is paired with low reporting vigilance.").
    3.  **Identify Silent Risks:** Scan the data for departments that appear safe on the surface (low-to-moderate click rates) but have dangerously low `Report Rates`. Frame these as "Complacent" or "High-Potential-Impact" groups who may not report a more sophisticated future attack.
    4.  **Contextualize with Volume:** Where relevant, especially for high-risk departments, use the `Emails Sent` metric to quantify the scale of exposure. A high click rate in a large department is a more severe incident than one in a small department.
    5.  **Maintain an Executive Tone:** Use direct, data-driven language. Focus on which departments require immediate attention and why.
    6.  **Respond with the markdown directly** with no introductions and don't include the title for this section.
    7.  **Refere to our organization as {target_company_name}. 

    **Departmental Data to Analyze:**
    {department_stats}

    **Your Departmental Breakdown:**
    """


def get_trend_analysis_prompt(target_company_name):
    return f"""
    You are a senior cybersecurity analyst presenting a trend analysis to leadership. Your goal is to interpret the provided "Phishing Awareness Trend" chart and explain the story it tells about our organization's risk evolution.
    Analyze the chart and generate a summary in markdown bullet points.
    **Guidelines for your analysis:**
    1.  **Lead with the Headline Story:** Start with a single, powerful headline sentence that summarizes the core conflict or narrative of the chart. This should be the main takeaway.
    2.  **Explain the "Positive" Narrative First:** Briefly analyze the `Reporting Rate` (green line). Describe its overall positive trajectory and what it indicates about the success of our awareness training in terms of employee diligence. Highlight peak performance moments (like W23 and W26).
    3.  **Explain the "Alarming" Counter-Narrative:** Analyze the `Click Rate` (red line). Describe its volatility and the extreme danger it represents. **Specifically address the catastrophic spike at the end of the period.** Frame this not just as a number, but as a measure of behavioral failure and direct risk to the organization.
    4.  **Synthesize the Core Conflict:** This is the most critical step. Explain what it means for both trends to rise together, especially culminating in a peak. Articulate the key insight: that our program is successfully teaching *identification* but failing to teach *avoidance*. The result is a workforce that can spot a phish and report it, but only after they have already clicked the link and potentially triggered a breach.
    5.  **Respond with the markdown directly with no introductions and don't include the title for this section
    6.  **Refere to our organization as {target_company_name}. 
    **Your Analysis:**
    """


def get_group_analysis_prompt(target_company_name):
    return f"""
    You are a senior cybersecurity analyst reporting on departmental phishing risk to an executive audience. Your analysis must be clear, comparative, and lead to actionable conclusions.
    Analyze the provided "Group Risk Assessment" bar chart and generate a summary in markdown bullet points.
    **Guidelines for your analysis:**
    1.  **Identify the Highest-Risk Group:** Start by clearly stating which department has the highest `Click Rate` and is therefore the most vulnerable. Quantify the difference between the groups to emphasize the severity (e.g., "X% more likely to click"). Frame this as the primary area of concern.
    2.  **Compare Effectiveness:** Analyze the `Report Rate` for both departments. Acknowledge any positive performance (e.g., "both departments demonstrate strong reporting diligence"), but clearly state which group is more effective and by how much, even if the margin is small.
    3.  **Synthesize the Findings and Propose a Hypothesis:** Combine the click and report rate findings into a single, cohesive statement for each group. For the higher-risk group (IT in this case), propose a brief, plausible hypothesis for *why* they might be more vulnerable despite their technical role (e.g., high email volume, desensitization to alerts, overconfidence).
    4.  **Imply the Next Step:** Conclude by framing the findings in terms of action. Clearly state that the higher-risk group requires targeted intervention, directly linking the data to the need for a specific response.
    5.  **Respond with the markdown directly with no introductions and don't include the title for this section
    6.  **Refere to our organization as {target_company_name}. 
    **Your Analysis:**
    """


def get_conclusion_prompt(kpi_analysis_text, trend_analysis_text, group_analysis_text, target_company_name):
    return f"""
    You are a senior cybersecurity analyst writing the concluding section of a phishing awareness report for executive leadership. Your task is to synthesize all the preceding analyses into a final, impactful conclusion.
    You have already analyzed the KPIs, the time-series trend chart, and the departmental risk assessment. Now, weave these separate findings into a single, cohesive narrative.
    **Guidelines for your conclusion:**
    1.  **State the Overarching Narrative in a Single Sentence:** Begin with a powerful, one-sentence summary that captures the core story of the entire report. This should encapsulate the central conflict (e.g., "Our security awareness is growing, but our behavioral risk is growing faster").
    2.  **Summarize the Supporting Evidence (The "Why We Believe This"):** Briefly connect the key data points from the previous sections to support your main narrative.
        *   Start with the overall KPI conflict (`Average Click Rate` vs. `Average Report Rate`).
        *   Reference the trend analysis, specifically the alarming final data point where both rates peaked, as definitive proof of the behavioral gap.
        *   Incorporate the group assessment, highlighting the high-risk department (IT) as a real-world example of this dangerous paradox.
    3.  **Define the Core Problem Clearly:** Move from summarizing data to defining the problem. State explicitly that the issue is not a lack of *knowledge* but a failure of *behavior*. Use phrases like "disconnect between awareness and action" or "knowledge-action gap."
    4.  **Articulate the Business Impact:** Conclude by explaining what this core problem means for the organization in terms of risk. Frame it as an unacceptable vulnerability that negates investment in training and exposes the company to significant harm. This sets the stage perfectly for the recommendations that will follow.
    5.  **Respond with the markdown directly with no introductions and don't include the title for this section
    6.  **Refere to our organization as {target_company_name}. 
    **Do not introduce any new data. Synthesize only what has already been presented.**
    **Report Data for Synthesis:**
    - **KPI Summary:** {kpi_analysis_text}
    - **Trend Analysis:** {trend_analysis_text}
    - **Group Risk Analysis:** {group_analysis_text}
    **Your "Key Findings & Conclusion" Section:**
    """


def get_recommendation_prompt(conclusion_text, kpi_analysis_text, trend_analysis_text, group_analysis_text, target_company_name):
    return f"""
    You are a senior cybersecurity analyst proposing clear, prioritized, and justified solutions to leadership. Your task is to generate a set of actionable recommendations based on the report's conclusive findings.
    The conclusion has identified the core problems. Now, you must provide the solutions.
    **Guidelines for your recommendations:**
    1.  **Prioritize Your Recommendations:** Present the recommendations as a numbered list, starting with the most urgent and impactful action.
    2.  **Use numerical bullet points.
    3.  **Use a Clear Structure for Each Recommendation:** For each item, provide:
        *   **A Bolded, Action-Oriented Title:** (e.g., **Implement Advanced Training for IT**).
        *   **The Specific Action ("What"):** Clearly describe the specific action to be taken. Avoid vague suggestions like "improve training."
        *   **The Justification ("Why"):** Explicitly state which finding from the report justifies this action. This links the problem directly to the solution.
    4.  **Ensure Recommendations Address the Key Findings:** Your recommendations must directly solve the core problems identified in the conclusion:
        *   **The High-Risk Group Problem:** Propose a specific, targeted intervention for the most vulnerable department (IT).
        *   **The General Behavioral Gap:** Propose a broader, organization-wide initiative to fix the "click first, report later" behavior.
        *   **The Potential Technical Failure:** Given the 100% click rate, propose a review of technical defenses as a necessary safety net.
    5.  **Respond with the markdown directly with no introductions and don't include the title for this section
    6.  **Refere to our organization as {target_company_name}. 
    **Use the following report summary to inform your recommendations:**
    - **Conclusion:** {conclusion_text}
    - **Key Findings:** {kpi_analysis_text}, {trend_analysis_text}, {group_analysis_text}
    **Your "Actionable Recommendations" Section:**
    """


def get_how_csword_helps_prompt(recommendation_text, target_company_name):
    return f"""
You are a sales and solutions consultant for CSword, an AI-powered cybersecurity-awareness and culture platform that also delivers expert-led assessments and offensive-security services. Your goal is to bridge the gap between the report's recommendations and the solutions your company offers.

**Guidelines for your response:**
1. **Acknowledge the Challenge** - Open by recognising that implementing security recommendations at scale can be complex and resource-intensive.
2. **Connect to CSword's Capabilities** - For each recommendation, show how the CSword portfolio directly addresses it, drawing from the offerings below:
   * **AI-Powered Training Platform** - personalised learning paths, adaptive content, "Just-in-Time" micro-lessons after failed phishing simulations, rich analytics to prove behavioural change.
   * **Risk & Security Assessments** - baseline and gap analyses that quantify current posture and feed data into remediation plans.
   * **Penetration Testing & Threat Simulation** - expert-led testing that identifies exploitable weaknesses before attackers do.
   * **Digital Awareness Deliverables** - customised videos, infographics, and collateral that reinforce key messages organisation-wide.
   * **Interactive Awareness Sessions** - live, scenario-based workshops (virtual or on-site) that deepen engagement for high-risk groups.
   * **Data-Driven Control Reviews** - dashboard and report outputs that justify technical-control investment and guide tuning efforts.
3. **Map Specific Needs** -  
   * For **targeted training** recommendations, reference custom learning paths and role-based module assignment.  
   * For closing the **behavioural gap**, highlight "Just-in-Time" feedback after simulations.  
   * For **reviewing technical controls**, frame CSword's assessment data and analytics as the evidence base to prioritise improvements.  
4. **End with a Call to Action** - Conclude by positioning CSword as a long-term partner and invite the reader to book a tailored demo or combined assessment-training engagement.
5. **Professional Tone** - Act as a trusted advisor who focuses on customer outcomes, not hard-sell tactics.
6. **Response Format** - Reply in concise markdown bullet points, without a title.
7. **Organisation Name** - Always refer to our organisation as **{target_company_name}**.

**Actionable Recommendations to Address:**  
{recommendation_text}
"""


def get_intro_prompt(conclusion_text, recommendation_text, how_csword_helps_text, kpi_analysis_text, trend_analysis_text, group_analysis_text, target_company_name):
    return f"""
You are a senior cybersecurity analyst writing the Executive Summary for a completed phishing awareness report. This is the first and possibly only section leadership will read. It must be concise, impactful, and action-oriented.
Based on the entire report's findings and recommendations, generate a brief executive summary.
**Guidelines for your Executive Summary:**
1.  **Lead with the Main Conclusion:** Start with the single most important takeaway from the report—the conflict between high awareness and high-risk behavior.
2.  **Present Key Findings as Bullet Points:** Summarize the 2-3 most critical findings that support the main conclusion. These should be data-backed but presented as insights.
    *   Highlight the dangerous overall click rate.
    *   Call out the "IT Paradox" (most vulnerable and most effective).
    *   Mention the catastrophic 100% click rate from the trend analysis as undeniable proof of the problem.
3.  **State the Recommended Actions Clearly:** Conclude by summarizing the top 1-2 recommended actions. This shows that you have not just identified a problem, but have a plan to fix it.
4.  **Keep it Brief:** The entire summary should be no more than 4-5 sentences or a short paragraph plus bullet points. It must be easily digestible in 30 seconds.
5.  **Respond with the markdown directly with no introductions and don't include the title for this section
6.  **Refere to our organization as {target_company_name}. 
**Do not introduce yourself or the report's purpose (e.g., "This report will analyze..."). Get straight to the findings.**
**Source Information (The Complete Report):**
- **Conclusion:** {conclusion_text}
- **Recommendations:** {recommendation_text}
- ** How CSword can help:**{how_csword_helps_text}
- **Key Data Points:** {kpi_analysis_text}, {trend_analysis_text}, {group_analysis_text}
**Your "Executive Summary" Section:**
"""