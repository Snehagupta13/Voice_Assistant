import re

class SymptomAgent:
    """Parses and structures raw patient input."""

    DOSHA_KEYWORDS = {
        "vata":  ["dry", "cold", "anxiety", "pain", "constipation", "insomnia",
                  "joint pain", "irregular", "fatigue", "thin"],
        "pitta": ["inflammation", "fever", "acidity", "anger", "rash", "burning",
                  "infection", "hypertension", "ulcer", "hot"],
        "kapha": ["obesity", "mucus", "congestion", "lethargy", "swelling",
                  "diabetes", "cough", "cold", "weight gain", "slow"],
    }

    def run(self, patient_data: dict) -> dict:
        symptoms_text = (patient_data.get("symptoms", "") + " " +
                         patient_data.get("disease", "")).lower()

        dosha_scores = {d: 0 for d in self.DOSHA_KEYWORDS}
        for dosha, keywords in self.DOSHA_KEYWORDS.items():
            for kw in keywords:
                if kw in symptoms_text:
                    dosha_scores[dosha] += 1

        primary_dosha = max(dosha_scores, key=dosha_scores.get)
        secondary = [d for d, s in sorted(dosha_scores.items(),
                     key=lambda x: -x[1]) if d != primary_dosha and s > 0]

        return {
            **patient_data,
            "dosha_scores":   dosha_scores,
            "primary_dosha":  primary_dosha.capitalize(),
            "secondary_dosha": secondary[0].capitalize() if secondary else "None",
            "symptom_analysis": f"Primary imbalance: {primary_dosha.capitalize()}"
                                 f" (score: {dosha_scores[primary_dosha]})"
        }
