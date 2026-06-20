import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from inference import get_ayurvedic_assessment

print("Running evaluation on held-out test cases...")

df = pd.read_csv("dataset/kaggle_ayurveda/AyurGenixAI_Dataset.csv")
df = df.fillna("Not specified")

test_cases = df.tail(10)
results = []

for _, row in test_cases.iterrows():
    prediction = get_ayurvedic_assessment(
        disease=row["Disease"],
        symptoms=row["Symptoms"],
        age_group=row["Age Group"],
        gender=row["Gender"],
        medical_history=row["Medical History"],
        current_medications=row["Current Medications"],
        stress_levels=row["Stress Levels"],
        dietary_habits=row["Dietary Habits"]
    )

    expected_herbs = str(row["Ayurvedic Herbs"]).strip().lower()
    predicted_lower = prediction.lower()

    # If no specific herbs expected — always 100%
    if expected_herbs in ["none specific", "not specified", "none", "nan", ""]:
        herb_accuracy = 1.0
        herbs_found = "N/A"
        herb_list = []
    else:
        herb_list = [h.strip() for h in expected_herbs.split(",")]
        found = sum(1 for h in herb_list if h in predicted_lower)
        herb_accuracy = found / len(herb_list) if herb_list else 1.0
        herbs_found = f"{found}/{len(herb_list)}"

    results.append({
        "disease":       row["Disease"],
        "expected":      row["Ayurvedic Herbs"],
        "found":         herbs_found,
        "herb_accuracy": herb_accuracy,
    })

    print(f"Disease: {row['Disease']}")
    print(f"Expected herbs: {row['Ayurvedic Herbs']}")
    print(f"Herb accuracy: {herb_accuracy:.0%}")
    print("-" * 40)

avg = sum(r["herb_accuracy"] for r in results) / len(results)
specific = [r for r in results if r["found"] != "N/A"]
specific_avg = sum(r["herb_accuracy"] for r in specific) / len(specific) if specific else 0

print(f"\nOverall herb accuracy     : {avg:.0%}")
print(f"Specific herb accuracy    : {specific_avg:.0%} ({len(specific)} diseases with named herbs)")
print(f"Total test cases          : {len(results)}")
print("\nSave these numbers for your writeup!")
