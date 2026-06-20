from graph.pipeline import run_ayurveda_pipeline

def get_ayurvedic_assessment(disease, symptoms, age_group="Adult (20-40)",
                              gender="Male", medical_history="None",
                              current_medications="None",
                              stress_levels="Moderate",
                              dietary_habits="Not specified") -> str:
    """
    Public API — routes through full 4-agent LangGraph pipeline:
      SymptomAgent → DoshaAgent → GuidanceAgent (MedGemma) → SafetyAgent
    """
    return run_ayurveda_pipeline(
        disease=disease, symptoms=symptoms,
        age_group=age_group, gender=gender,
        medical_history=medical_history,
        current_medications=current_medications,
        stress_levels=stress_levels,
        dietary_habits=dietary_habits
    )


if __name__ == "__main__":
    print("=" * 60)
    print("TEST 1: Diabetes — Full Agent Pipeline")
    print("=" * 60)
    r1 = get_ayurvedic_assessment(
        disease="Diabetes",
        symptoms="Frequent urination, fatigue, increased thirst",
        age_group="Middle-aged (40-60)", gender="Male",
        medical_history="Family history of diabetes",
        current_medications="Metformin",
        stress_levels="High",
        dietary_habits="High sugar, Low fiber"
    )
    print(r1)

    print("\n" + "=" * 60)
    print("TEST 2: Hypertension — Full Agent Pipeline")
    print("=" * 60)
    r2 = get_ayurvedic_assessment(
        disease="Hypertension",
        symptoms="High blood pressure, headaches, dizziness",
        age_group="Senior (60+)", gender="Female",
        medical_history="Heart disease",
        current_medications="Beta-blockers",
        stress_levels="Very High",
        dietary_habits="High salt, Low fiber"
    )
    print(r2)
