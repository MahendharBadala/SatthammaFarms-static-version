import React from "react";

export default function RewardGamesManager() {
    return ( <div className="space-y-6"> <div> <div className="chip">Admin controlled</div>

    <h2 className="mt-2 font-serif text-3xl text-ink">
      Reward Games Management
    </h2>

    <p className="mt-2 max-w-2xl text-muted2">
      Manage Lucky Spin and Scratch &amp; Win settings, rewards,
      winning probabilities, and daily play limits.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    <section className="card-earth p-6">
      <h3 className="font-serif text-2xl text-ink">
        Lucky Spin
      </h3>

      <p className="mt-2 text-sm text-muted2">
        Configure the Lucky Spin game and its rewards.
      </p>

      <div className="mt-5 rounded-xl border border-edge bg-white p-4">
        <p className="font-semibold text-ink">
          Game configuration
        </p>

        <p className="mt-2 text-sm text-muted2">
          Backend settings will be connected in the next steps.
        </p>
      </div>
    </section>

    <section className="card-earth p-6">
      <h3 className="font-serif text-2xl text-ink">
        Scratch &amp; Win
      </h3>

      <p className="mt-2 text-sm text-muted2">
        Configure the Scratch &amp; Win game and its rewards.
      </p>

      <div className="mt-5 rounded-xl border border-edge bg-white p-4">
        <p className="font-semibold text-ink">
          Game configuration
        </p>

        <p className="mt-2 text-sm text-muted2">
          Backend settings will be connected in the next steps.
        </p>
      </div>
    </section>
  </div>

  <section className="card-earth p-6">
    <h3 className="font-serif text-2xl text-ink">
      Reward Configuration
    </h3>

    <p className="mt-2 text-sm text-muted2">
      Reward management will include discount types, reward values,
      winning probabilities, coupon expiry, minimum order values,
      and usage limits.
    </p>

    <div className="mt-5 rounded-xl border border-edge bg-white p-4">
      <p className="font-semibold text-ink">
        Configuration status
      </p>

      <p className="mt-2 text-sm text-muted2">
        The management controls are not active yet. They will be
        connected to the backend after the deployment is verified.
      </p>
    </div>
  </section>
</div>

);
}
