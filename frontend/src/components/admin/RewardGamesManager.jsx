import React, { useEffect, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_SETTINGS = {
spin_enabled: true,
scratch_enabled: true,
rewards: [
{ label: "5% OFF", type: "percent", value: 5, weight: 35 },
{ label: "10% OFF", type: "percent", value: 10, weight: 15 },
{ label: "₹50 OFF", type: "flat", value: 50, weight: 10 },
{ label: "Better luck next time", type: "none", value: 0, weight: 40 },
],
coupon_expiry_days: 7,
minimum_order: 0,
coupon_max_uses: 1,
};

export default function RewardGamesManager() {
const [settings, setSettings] = useState(DEFAULT_SETTINGS);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState("");
const [notice, setNotice] = useState("");

useEffect(() => {
let cancelled = false;

```
async function loadSettings() {
  try {
    const response = await axios.get(`${API}/admin/game-settings`, {
      withCredentials: true,
    });

    if (!cancelled) {
      setSettings({ ...DEFAULT_SETTINGS, ...response.data });
    }
  } catch (err) {
    if (!cancelled) {
      setError(
        err?.response?.status === 401
          ? "Your admin session could not be authenticated. Please sign in again."
          : err?.response?.data?.detail ||
              "Unable to load reward game settings."
      );
    }
  } finally {
    if (!cancelled) setLoading(false);
  }
}

loadSettings();
return () => {
  cancelled = true;
};
```

}, []);

const updateSetting = (key, value) => {
setSettings((previous) => ({ ...previous, [key]: value }));
setNotice("");
setError("");
};

const updateReward = (index, key, value) => {
setSettings((previous) => ({
...previous,
rewards: previous.rewards.map((reward, i) =>
i === index ? { ...reward, [key]: value } : reward
),
}));
setNotice("");
setError("");
};

const saveSettings = async () => {
setError("");
setNotice("");

const totalWeight = settings.rewards.reduce(
   (sum, reward) => sum + Number(reward.weight || 0),
   0
);

if (settings.rewards.length === 0 || totalWeight <= 0) {
  setError("Add at least one reward and make the total weight greater than zero.");
  return;
}

for (const reward of settings.rewards) {
  if (!reward.label.trim()) {
    setError("Every reward must have a label.");
    return;
  }

  if (!["percent", "flat", "none"].includes(reward.type)) {
    setError("Choose a valid type for every reward.");
    return;
  }

  if (!Number.isFinite(Number(reward.value)) || Number(reward.value) < 0) {
    setError("Reward values must be zero or greater.");
    return;
  }

  if (reward.type === "percent" && Number(reward.value) > 100) {
    setError("Percentage discounts cannot exceed 100.");
    return;
  }

  if (!Number.isFinite(Number(reward.weight)) || Number(reward.weight) < 0) {
    setError("Reward weights must be zero or greater.");
    return;
  }
}

  if (
      !Number.isInteger(Number(settings.coupon_expiry_days)) ||
      Number(settings.coupon_expiry_days) < 1
     ) {
         setError("Coupon expiry must be at least 1 whole day.");
         return;
}

if (
  !Number.isInteger(Number(settings.coupon_max_uses)) ||
  Number(settings.coupon_max_uses) < 1
) {
  setError("Maximum coupon uses must be at least 1.");
  return;
}

if (
  !Number.isFinite(Number(settings.minimum_order)) ||
  Number(settings.minimum_order) < 0
) {
  setError("Minimum order cannot be negative.");
  return;
}

const payload = {
  ...settings,
  coupon_expiry_days: Number(settings.coupon_expiry_days),
  minimum_order: Number(settings.minimum_order),
  coupon_max_uses: Number(settings.coupon_max_uses),
  rewards: settings.rewards.map((reward) => ({
    ...reward,
    value: Number(reward.value),
    weight: Number(reward.weight),
  })),
};

setSaving(true);

try {
  const response = await axios.put(`${API}/admin/game-settings`, payload, {
    withCredentials: true,
  });

  setSettings({ ...DEFAULT_SETTINGS, ...response.data.settings });
  setNotice("Reward game settings saved successfully.");
} catch (err) {
  setError(
    err?.response?.status === 401
      ? "Your admin session could not be authenticated. Please sign in again."
      : err?.response?.data?.detail ||
          "Unable to save settings. Please try again."
  );
} finally {
  setSaving(false);
}


};

if (loading) {
    return <div className="card-earth p-6">Loading reward game settings...</div>;
}

if (error && !settings) {
return <div className="card-earth p-6 text-red-700">{error}</div>;
}

return ( <div className="space-y-6"> <div> <div className="chip">Admin controlled</div> <h2 className="mt-2 font-serif text-3xl text-ink">
Reward Games Management </h2> <p className="mt-2 max-w-2xl text-muted2">
Configure game availability, rewards, probabilities, and coupon rules. </p> </div>

  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <section className="card-earth p-6">
      <h3 className="font-serif text-2xl text-ink">Lucky Spin</h3>
      <label className="mt-4 flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.spin_enabled}
          onChange={(e) => updateSetting("spin_enabled", e.target.checked)}
        />
        <span>{settings.spin_enabled ? "Enabled" : "Disabled"}</span>
      </label>
    </section>

    <section className="card-earth p-6">
      <h3 className="font-serif text-2xl text-ink">Scratch &amp; Win</h3>
      <label className="mt-4 flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.scratch_enabled}
          onChange={(e) => updateSetting("scratch_enabled", e.target.checked)}
        />
        <span>{settings.scratch_enabled ? "Enabled" : "Disabled"}</span>
      </label>
    </section>
  </div>

  <section className="card-earth p-6">
    <h3 className="font-serif text-2xl text-ink">Reward Configuration</h3>
    <p className="mt-2 text-sm text-muted2">
      Weights are relative chances. For example, weights 35, 15, 10, and 40
      represent 35%, 15%, 10%, and 40% when their total is 100.
    </p>

    <div className="mt-5 space-y-4">
      {settings.rewards.map((reward, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-3 rounded-xl border border-edge bg-white p-4 md:grid-cols-4"
        >
          <label className="text-sm text-muted2">
            Reward label
            <input
              className="mt-1 w-full rounded-lg border border-edge p-2 text-ink"
              value={reward.label}
              onChange={(e) => updateReward(index, "label", e.target.value)}
            />
          </label>

          <label className="text-sm text-muted2">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-edge p-2 text-ink"
              value={reward.type}
              onChange={(e) => updateReward(index, "type", e.target.value)}
            >
              <option value="percent">Percentage discount</option>
              <option value="flat">Flat discount</option>
              <option value="none">No reward</option>
            </select>
          </label>

          <label className="text-sm text-muted2">
            Value
            <input
              type="number"
              min="0"
              max={reward.type === "percent" ? 100 : undefined}
              disabled={reward.type === "none"}
              className="mt-1 w-full rounded-lg border border-edge p-2 text-ink disabled:bg-gray-100"
              value={reward.value}
              onChange={(e) => updateReward(index, "value", e.target.value)}
            />
          </label>

          <label className="text-sm text-muted2">
            Weight
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-lg border border-edge p-2 text-ink"
              value={reward.weight}
              onChange={(e) => updateReward(index, "weight", e.target.value)}
            />
          </label>
        </div>
      ))}
    </div>

    <p className="mt-3 text-sm text-muted2">
      Total reward weight:{" "}
      {settings.rewards.reduce(
        (sum, reward) => sum + (Number(reward.weight) || 0),
        0
      )}
    </p>
  </section>

  <section className="card-earth p-6">
    <h3 className="font-serif text-2xl text-ink">Coupon Rules</h3>

    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <label className="text-sm text-muted2">
        Expiry (days)
        <input
          type="number"
          min="1"
          className="mt-1 w-full rounded-lg border border-edge p-3 text-ink"
          value={settings.coupon_expiry_days}
          onChange={(e) => updateSetting("coupon_expiry_days", e.target.value)}
        />
      </label>

      <label className="text-sm text-muted2">
        Minimum order (₹)
        <input
          type="number"
          min="0"
          step="0.01"
          className="mt-1 w-full rounded-lg border border-edge p-3 text-ink"
          value={settings.minimum_order}
          onChange={(e) => updateSetting("minimum_order", e.target.value)}
        />
      </label>

      <label className="text-sm text-muted2">
        Maximum coupon uses
        <input
          type="number"
          min="1"
          className="mt-1 w-full rounded-lg border border-edge p-3 text-ink"
          value={settings.coupon_max_uses}
          onChange={(e) => updateSetting("coupon_max_uses", e.target.value)}
        />
      </label>
    </div>
  </section>

  {error && <p className="text-sm text-red-700">{error}</p>}
  {notice && <p className="text-sm text-green-700">{notice}</p>}

  <button
    type="button"
    disabled={saving}
    onClick={saveSettings}
    className="rounded-xl bg-ink px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
  >
    {saving ? "Saving..." : "Save Settings"}
  </button>

  <p className="text-sm text-muted2">
    Note: these settings are saved to the backend. The game-play endpoint
    still needs to be updated separately before all settings affect actual
    gameplay and generated coupons.
  </p>
</div>

);
}
