class SafetyAgent:
    """Validates output and appends safety disclaimer."""

    DISCLAIMER = (
        "\n\n---\n"
        "SAFETY NOTICE: This is educational Ayurvedic guidance only. "
        "It is NOT a medical diagnosis or prescription. "
        "Always consult a qualified Ayurvedic practitioner (BAMS) and "
        "licensed physician before starting any treatment. "
        "In emergencies, contact medical services immediately."
    )

    DANGEROUS_KEYWORDS = [
        "cure", "guaranteed", "100% effective",
        "stop your medication", "replace your doctor"
    ]

    def run(self, state: dict) -> dict:
        output = state.get("model_output", "")

        # Safety check — remove overconfident claims
        for kw in self.DANGEROUS_KEYWORDS:
            if kw.lower() in output.lower():
                output = output.replace(kw, f"[may help with]")

        # Always append disclaimer
        final_output = output + self.DISCLAIMER

        return {**state, "final_output": final_output}
