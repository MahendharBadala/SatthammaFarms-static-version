import React, { useState } from "react";
import { playRewardGame } from "../lib/productApi";

export default function RewardGames() {
  const [loadingGame, setLoadingGame] = useState("");
  const [results, setResults] = useState({
    spin: null,
    scratch: null,
  });
  const [errors, setErrors] = useState({
    spin: "",
    scratch: "",
  });

  async function handlePlay(game) {
    if (loadingGame) return;

    setLoadingGame(game);

    setErrors((previous) => ({
      ...previous,
      [game]: "",
    }));

    try {
      const result = await playRewardGame(game);

      setResults((previous) => ({
        ...previous,
        [game]: result,
      }));
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      if (status === 429) {
        setErrors((previous) => ({
          ...previous,
          [game]: message,
        }));
      } else {
        setErrors((previous) => ({
          ...previous,
          [game]: message,
        }));
      }
    } finally {
      setLoadingGame("");
    }
  }

  function GameResult({ result }) {
    if (!result) return null;

    return (
      <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-lg font-bold text-green-800">
          {result.reward}
        </p>

        <p className="mt-2 text-sm text-green-900">
          {result.message}
        </p>

        {result.coupon_code && (
          <div className="mt-4 rounded-lg border border-dashed border-green-600 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Your coupon code
            </p>

            <p className="mt-1 break-all text-xl font-extrabold tracking-widest text-green-800">
              {result.coupon_code}
            </p>

            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(result.coupon_code)
              }
              className="mt-3 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
            >
              Copy Coupon
            </button>

            <p className="mt-2 text-xs text-gray-600">
              Use this code at checkout. It expires in 7 days.
            </p>
          </div>
        )}
      </div>
    );
  }

  function GameCard({
    game,
    title,
    description,
    emoji,
    buttonText,
  }) {
    const result = results[game];
    const error = errors[game];
    const isLoading = loadingGame === game;

    return (
      <section className="rounded-2xl border border-amber-100 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-amber-50 text-5xl">
            {emoji}
          </div>

          <h2 className="mt-5 text-2xl font-bold text-green-900">
            {title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {description}
          </p>

          <button
            type="button"
            disabled={Boolean(loadingGame) || Boolean(result)}
            onClick={() => handlePlay(game)}
            className="mt-6 w-full rounded-xl bg-green-800 px-5 py-3 font-bold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Revealing your result..."
              : result
                ? "Played"
                : buttonText}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <GameResult result={result} />
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f1] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            SATTHAMMA FARMS
          </p>

          <h1 className="mt-4 text-3xl font-extrabold text-green-950 sm:text-5xl">
            Play & Win Rewards
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            Try your luck and discover special discount coupons
            for your next Satthamma Farms order.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <GameCard
            game="spin"
            title="Lucky Spin"
            description="Give the wheel a try and discover which reward awaits you."
            emoji="🎡"
            buttonText="Try Lucky Spin"
          />

          <GameCard
            game="scratch"
            title="Scratch & Win"
            description="Reveal your reward and see whether you've won a discount coupon."
            emoji="🎁"
            buttonText="Reveal My Reward"
          />
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-gray-500">
          Rewards are determined by the server. Each game can be
          played once per browser per day. Browser-based restrictions
          are not foolproof and may be bypassed by clearing browser
          data or using another device.
        </p>
      </div>
    </div>
  );
}
