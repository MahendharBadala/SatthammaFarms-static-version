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
const [error, setError] = useState("");

useEffect(() => {
let cancelled = false;
async function loadSettings() {
  try {
    const response = await axios.get(`${API}/admin/game-settings`, {
      withCredentials: true,
    });

    if (!cancelled) {
      setSettings({ ...DEFAULT_SETTINGS, ...response.data });
      setError("");
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
    if (!cancelled) {
      setLoading(false);
    }
  }
}

loadSettings();

return () => {
  cancelled = true;
};


}, []);

if (loading) {
return ( <div className="card-earth p-6">
Loading reward game settings... </div>
);
}

if (error) {
return ( <div className="card-earth p-6"> <h2 className="font-serif text-2xl text-ink">
Reward Games Management </h2> <p className="mt-3 text-red-700">{error}</p> <p className="mt-2 text-sm text-muted2">
Your existing admin authentication has not been changed. </p> </div>
);
}

return ( <div className="space-y-6"> <div> <div className="chip">Admin controlled</div> <h2 className="mt-2 font-serif text-3xl text-ink">
Reward Games Management </h2> <p className="mt-2 max-w-2xl text-muted2">
Review the settings currently stored for Lucky Spin and Scratch & Win. </p> </div>

```
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <section className="card-earth p-6">
      <h3 className="font-serif text-2xl text-ink">Lucky Spin</h3>
      <p className="mt-2 text-muted2">
        Status: {settings.spin_enabled ? "Enabled" : "Disabled"}
      </p>
    </section>

    <section className="card-earth p-6">
      <h3 className="font-serif text-2xl text-ink">Scratch &amp; Win</h3>
      <p className="mt-2 text-muted2">
        Status: {settings.scratch_enabled ? "Enabled" : "Disabled"}
      </p>
    </section>
  </div>

  <section className="card-earth p-6">
    <h3 className="font-serif text-2xl text-ink">
      Reward Configuration
    </h3>

    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="p-2">Reward</th>
            <th className="p-2">Type</th>
            <th className="p-2">Value</th>
            <th className="p-2">Weight</th>
          </tr>
        </thead>
        <tbody>
          {settings.rewards.map((reward, index) => (
            <tr key={`${reward.label}-${index}`}>
              <td className="border-t border-edge p-2">
                {reward.label}
              </td>
              <td className="border-t border-edge p-2">
                {reward.type}
              </td>
              <td className="border-t border-edge p-2">
                {reward.value}
              </td>
              <td className="border-t border-edge p-2">
                {reward.weight}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-edge bg-white p-4">
        <p className="text-sm text-muted2">Coupon expiry</p>
        <p className="mt-1 font-semibold text-ink">
          {settings.coupon_expiry_days} days
        </p>
      </div>

      <div className="rounded-xl border border-edge bg-white p-4">
        <p className="text-sm text-muted2">Minimum order</p>
        <p className="mt-1 font-semibold text-ink">
          ₹{settings.minimum_order}
        </p>
      </div>

      <div className="rounded-xl border border-edge bg-white p-4">
        <p className="text-sm text-muted2">Maximum coupon uses</p>
        <p className="mt-1 font-semibold text-ink">
          {settings.coupon_max_uses}
        </p>
      </div>
    </div>
  </section>
</div>

);
}
