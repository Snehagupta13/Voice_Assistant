class DoshaAgent:
    """Maps dosha imbalance to Ayurvedic treatment principles."""

    DOSHA_TREATMENTS = {
        "Vata": {
            "principle":  "Warm, oily, grounding therapies",
            "avoid":      "Cold, dry, raw foods; excessive travel",
            "recommend":  "Warm sesame oil massage, warm foods, regular routine",
            "herbs":      "Ashwagandha, Shatavari, Triphala",
            "yoga":       "Gentle yoga, Pranayama, Yoga Nidra",
        },
        "Pitta": {
            "principle":  "Cooling, calming, anti-inflammatory therapies",
            "avoid":      "Spicy, oily, fermented foods; excessive heat",
            "recommend":  "Coconut oil, cooling herbs, meditation",
            "herbs":      "Brahmi, Guduchi, Neem, Amalaki",
            "yoga":       "Cooling Pranayama, Moon salutation, Sitali breath",
        },
        "Kapha": {
            "principle":  "Light, warm, stimulating therapies",
            "avoid":      "Heavy, cold, sweet foods; daytime sleep",
            "recommend":  "Dry brushing, vigorous exercise, light diet",
            "herbs":      "Trikatu, Guggul, Punarnava, Ginger",
            "yoga":       "Sun salutation, Kapalbhati, vigorous Vinyasa",
        },
    }

    def run(self, state: dict) -> dict:
        primary = state.get("primary_dosha", "Vata")
        treatment = self.DOSHA_TREATMENTS.get(primary,
                    self.DOSHA_TREATMENTS["Vata"])
        return {
            **state,
            "dosha_treatment": treatment,
            "constitution":    f"{primary}-dominant",
        }
