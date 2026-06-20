import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

os.makedirs("assets", exist_ok=True)

# ── EXACT values from your terminal output ──────────────────
step_losses = [
    # Epoch 1
    2.8909, 1.3253, 0.6359, 0.4793, 0.3541, 0.4603,
    0.3773, 0.2987, 0.3576, 0.3406, 0.4466,
    # Epoch 2
    0.3320, 0.4025, 0.3698, 0.3069, 0.3415, 0.2499,
    0.2774, 0.3136, 0.3340, 0.3616, 0.2373,
    # Epoch 3
    0.2910, 0.2946, 0.2498, 0.3180, 0.2474, 0.3120,
    0.2794, 0.3175, 0.2690, 0.2665, 0.2268,
]
steps = list(range(0, len(step_losses) * 10, 10))

epoch_data = [
    {"epoch": 1, "train": 0.6184, "eval": 0.3555},
    {"epoch": 2, "train": 0.3091, "eval": 0.3451},
    {"epoch": 3, "train": 0.2692, "eval": 0.3619},
]
epochs     = [d["epoch"] for d in epoch_data]
train_loss = [d["train"] for d in epoch_data]
eval_loss  = [d["eval"]  for d in epoch_data]

start = step_losses[0]   # 2.8909
end   = step_losses[-1]  # 0.2268

# ── 3-panel chart ─────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 5))
fig.suptitle("MedGemma Ayurveda Fine-Tuning Results",
             fontsize=14, fontweight="bold", y=1.02)

# Chart 1: Step-level loss
ax1 = axes[0]
colors = (["#2196F3"] * 11 + ["#4CAF50"] * 11 + ["#FF5722"] * 11)[:len(steps)]
ax1.plot(steps, step_losses, color="#546E7A", linewidth=1.5, alpha=0.4)
ax1.scatter(steps, step_losses, c=colors, s=30, zorder=5)
ax1.axhline(y=end, color="red", linestyle="--", alpha=0.5, linewidth=1)
ax1.set_xlabel("Training Step")
ax1.set_ylabel("Loss")
ax1.set_title("Step-Level Training Loss")
ax1.grid(True, alpha=0.3)
p1 = mpatches.Patch(color="#2196F3", label="Epoch 1")
p2 = mpatches.Patch(color="#4CAF50", label="Epoch 2")
p3 = mpatches.Patch(color="#FF5722", label="Epoch 3")
ax1.legend(handles=[p1, p2, p3], fontsize=8)
ax1.annotate(f"Start: {start:.2f}",
             xy=(steps[0], start),
             xytext=(20, -20), textcoords="offset points",
             fontsize=8, color="#2196F3",
             arrowprops=dict(arrowstyle="->", color="#2196F3"))
ax1.annotate(f"End: {end:.2f}",
             xy=(steps[-1], end),
             xytext=(-60, 10), textcoords="offset points",
             fontsize=8, color="#FF5722",
             arrowprops=dict(arrowstyle="->", color="#FF5722"))

# Chart 2: Train vs Eval per epoch
ax2 = axes[1]
ax2.plot(epochs, train_loss, "b-o", linewidth=2, markersize=8, label="Train Loss")
ax2.plot(epochs, eval_loss,  "r-s", linewidth=2, markersize=8, label="Eval Loss")
ax2.fill_between(epochs, train_loss, eval_loss, alpha=0.1, color="purple")
ax2.set_xlabel("Epoch")
ax2.set_ylabel("Loss")
ax2.set_title("Train vs Eval Loss per Epoch")
ax2.legend()
ax2.grid(True, alpha=0.3)
ax2.set_xticks([1, 2, 3])
for e, tl, el in zip(epochs, train_loss, eval_loss):
    ax2.annotate(f"{tl:.4f}", (e, tl), textcoords="offset points",
                 xytext=(-15, 8), fontsize=8, color="blue")
    ax2.annotate(f"{el:.4f}", (e, el), textcoords="offset points",
                 xytext=(-15, -14), fontsize=8, color="red")

# Chart 3: Key metrics bar
ax3 = axes[2]
metrics = {
    "Start Loss\n(Step 0)": start,
    "End Loss\n(Epoch 3)":  0.2692,
    "Eval Loss\n(Epoch 3)": 0.3619,
    "Herb Accuracy\n(x3)":  0.95 * 3,
}
bars = ax3.bar(metrics.keys(), metrics.values(),
               color=["#F44336","#4CAF50","#FF9800","#2196F3"],
               edgecolor="white", linewidth=1.5)
ax3.set_title("Key Metrics Summary")
ax3.set_ylabel("Value")
ax3.grid(True, alpha=0.3, axis="y")
for bar, (k, v) in zip(bars, metrics.items()):
    label = f"{v:.2f}" if "Accuracy" not in k else "95%"
    ax3.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.02,
             label, ha="center", va="bottom", fontweight="bold", fontsize=9)
ax3.tick_params(axis="x", labelsize=8)

plt.tight_layout()
plt.savefig("assets/training_curves.png", dpi=150, bbox_inches="tight")
print("Saved: assets/training_curves.png")

# ── Simple loss curve ─────────────────────────────────────────
fig2, ax = plt.subplots(figsize=(8, 5))
ax.plot(steps, step_losses, "b-o", markersize=4, linewidth=1.5)
ax.set_xlabel("Training Step")
ax.set_ylabel("Loss")
ax.set_title("MedGemma Ayurveda — Training Loss (2.89 → 0.27)")
ax.grid(True, alpha=0.3)
ax.fill_between(steps, step_losses, alpha=0.15, color="blue")
fig2.savefig("assets/loss_curve_simple.png", dpi=150, bbox_inches="tight")
print("Saved: assets/loss_curve_simple.png")
print(f"Title: Training Loss ({start:.2f} → {end:.2f})")
print("Done!")
