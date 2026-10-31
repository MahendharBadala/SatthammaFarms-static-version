import React, { useEffect, useState, useRef } from "react";
import {
  playRewardGame,
  getPreviousGameResult,
  getPublicGameSettings,
} from "../lib/productApi";

// Default rewards used if Admin Panel rewards are unavailable.
const DEFAULT_REWARDS = [
  { label: "5% OFF" },
  { label: "10% OFF" },
  { label: "Better Luck Next Time" },
  { label: "FREE DELIVERY" },
];

function getWheelRewards(rewards) {
  return rewards?.length ? rewards : DEFAULT_REWARDS;
}

// --------------------------------------------------
// LUCKY SPIN WHEEL
// --------------------------------------------------

function LuckySpinWheel({ rewards, spinning, rotation }) {
  const validRewards = getWheelRewards(rewards);

  const segmentAngle = 360 / validRewards.length;

  const colors = [
    "#14532d",
    "#d4a017",
    "#166534",
    "#b8860b",
    "#15803d",
    "#ca8a04",
  ];

  const gradient = validRewards
    .map((reward, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;

      return `${colors[index % colors.length]} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="relative mx-auto mt-8 h-72 w-72 sm:h-80 sm:w-80">

      {/* Pointer */}
      <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 text-4xl text-red-600">
        ▼
      </div>

      {/* Wheel */}
      <div
        className="relative h-full w-full rounded-full border-[8px] border-amber-400 shadow-xl"
        style={{
          background: `conic-gradient(${gradient})`,
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? "transform 5s cubic-bezier(0.12, 0.75, 0.15, 1)"
            : "none",
        }}
      >

        {/* Reward labels */}
        {validRewards.map((reward, index) => {
          const angle = index * segmentAngle + segmentAngle / 2;
          const radians = (angle * Math.PI) / 180;

          const left = 50 + 34 * Math.sin(radians);
          const top = 50 - 34 * Math.cos(radians);

          return (
            <div
              key={index}
              className="absolute w-24 text-center text-xs font-extrabold"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                transform: "translate(-50%, -50%)",
                color:
                  index % colors.length === 1 ||
                  index % colors.length === 3 ||
                  index % colors.length === 5
                    ? "#422006"
                    : "#ffffff",
              }}
            >
              {reward.label}
            </div>
          );
        })}

      </div>

      {/* Center logo */}
      <div className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-amber-400 bg-white text-2xl shadow-lg">
        🌾
      </div>

    </div>
  );
}

// --------------------------------------------------
// SCRATCH & WIN INTERACTIVE CARD
// --------------------------------------------------

function ScratchCard({ onReveal, result, disabled }) {
  const canvasRef = useRef(null);
  const isScratching = useRef(false);
  const hasRevealed = useRef(false);
  const scratchCount = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    canvas.width = 600;
    canvas.height = 300;

    ctx.fillStyle = "#b8b8b8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SATTHAMMA FARMS", 300, 125);

    ctx.font = "bold 30px Arial";
    ctx.fillText("SCRATCH HERE!", 300, 185);

    ctx.globalCompositeOperation = "destination-out";
  }, []);

  async function scratch(event) {
    if (disabled || hasRevealed.current || !isScratching.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();

    scratchCount.current += 1;

    // Check scratch progress periodically.
    if (scratchCount.current % 8 === 0) {
      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      let transparentPixels = 0;

      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 128) {
          transparentPixels++;
        }
      }

      const progress =
        transparentPixels / (canvas.width * canvas.height);

      if (progress >= 0.45 && !hasRevealed.current) {
        hasRevealed.current = true;
        const success = await onReveal();

        if (!success) {
          hasRevealed.current = false;
        }
      }
    }
  }

  function startScratch(event) {
    if (disabled || hasRevealed.current) return;

    isScratching.current = true;

    event.currentTarget.setPointerCapture(event.pointerId);

    scratch(event);
  }

  function stopScratch() {
    isScratching.current = false;
  }

  return (
    <div className="relative mx-auto mt-6 w-full max-w-sm overflow-hidden rounded-2xl border-4 border-amber-400 bg-gradient-to-br from-green-900 to-green-700 p-4 shadow-xl">

      {/* Reward area underneath the cover */}

      <div className="flex h-36 flex-col items-center justify-center text-center text-white">
        {result ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest">
              Your Reward
            </p>

            <p className="mt-3 text-3xl font-extrabold text-amber-300">
              {result.reward}
            </p>
          </>
        ) : (
          <>
            <span className="text-4xl">🎁</span>

            <p className="mt-3 font-bold">
              Your reward is waiting!
            </p>
          </>
        )}
      </div>

      {/* Scratchable cover */}

      {!result && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
          onPointerDown={startScratch}
          onPointerMove={scratch}
          onPointerUp={stopScratch}
          onPointerCancel={stopScratch}
          onLostPointerCapture={stopScratch}
        />
      )}

      {disabled && !result && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center font-bold text-white">
          Your game has already been played.
        </div>
      )}

    </div>
  );
}

// --------------------------------------------------
// GAME RESULT
// --------------------------------------------------

function GameResult({ result }) {
  if (!result) return null;

  const expiryDate = result.expires_at
    ? new Date(result.expires_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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
            {expiryDate
              ? `Use this code at checkout. Valid until ${expiryDate}.`
              : "Use this code at checkout."}
          </p>

        </div>
      )}

    </div>
  );
}

// --------------------------------------------------
// GAME CARD
// --------------------------------------------------

function GameCard({
  game,
  title,
  description,
  emoji,
  buttonText,
  result,
  error,
  loadingGame,
  onPlay,
  rewards,
  isSpinning,
  wheelRotation,
}) {
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

        {game === "spin" && (
          <LuckySpinWheel
            rewards={rewards}
            spinning={isSpinning}
            rotation={wheelRotation}
          />
        )}

      {game === "spin" ? (
        <button
          type="button"
          disabled={Boolean(loadingGame) || Boolean(result)}
          onClick={() => onPlay(game)}
          className="mt-6 w-full rounded-xl bg-green-800 px-5 py-3 font-bold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"
       >
         {isLoading
           ? "Spinning..."
           : result
             ? "Played"
             : buttonText}
       </button>
    ) : (
      <ScratchCard
        onReveal={() => onPlay(game)}
        result={result}
        disabled={Boolean(result)}
      />   
    )}

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

// --------------------------------------------------
// MAIN REWARD GAMES PAGE
// --------------------------------------------------

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

  const [gameSettings, setGameSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");

  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // ------------------------------------------------
  // LOAD PREVIOUS GAME RESULTS
  // ------------------------------------------------

  useEffect(() => {
    async function loadPreviousResults() {
      const games = ["spin", "scratch"];

      for (const game of games) {
        try {
          const data = await getPreviousGameResult(game);

          if (data.played && data.result) {
            setResults((previous) => ({
              ...previous,
              [game]: data.result,
            }));
          }
        } catch (error) {
          console.error(
            `Could not retrieve previous ${game} result:`,
            error
          );
        }
      }
    }

    loadPreviousResults();
  }, []);

  // ------------------------------------------------
  // LOAD ADMIN PANEL GAME SETTINGS
  // ------------------------------------------------

  useEffect(() => {
    async function loadGameSettings() {
      try {
        const data = await getPublicGameSettings();

        setGameSettings(data);
      } catch (error) {
        console.error("Failed to load game settings:", error);

        setSettingsError(
          "Unable to load reward games. Please refresh."
        );
      } finally {
        setSettingsLoading(false);
      }
    }

    loadGameSettings();
  }, []);

  // ------------------------------------------------
  // PLAY GAME
  // ------------------------------------------------

  async function handlePlay(game) {
    if (loadingGame) return;

    setLoadingGame(game);

    setErrors((previous) => ({
      ...previous,
      [game]: "",
    }));

    try {
      const result = await playRewardGame(game);

      // Lucky Spin animation
      if (game === "spin") {
        const rewards = getWheelRewards(gameSettings?.rewards);

        const rewardIndex = rewards.findIndex(
          (reward) => reward.label === result.reward
        );

        const selectedIndex = rewardIndex >= 0 ? rewardIndex : 0;

        const segmentAngle = 360 / rewards.length;

        const targetAngle =
          360 -
          (selectedIndex * segmentAngle + segmentAngle / 2);

        setIsSpinning(true);

        setWheelRotation(
          (previous) => previous + 360 * 5 + targetAngle
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 5200)
        );

        setIsSpinning(false);
      }

      // Save server result
      setResults((previous) => ({
        ...previous,
        [game]: result,
      }));
      return true;

    } catch (error) {
      const message =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      setErrors((previous) => ({
        ...previous,
        [game]: message,
      }));

      setIsSpinning(false);
      return false;

    } finally {
      setLoadingGame("");
    }
  }

  // ------------------------------------------------
  // PAGE UI
  // ------------------------------------------------

  return (
    <div className="min-h-screen bg-[#faf8f1] px-4 py-12">

      <div className="mx-auto max-w-5xl">

        {/* Page Heading */}
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

        {/* Game Settings and Cards */}

        {settingsLoading ? (

          <p className="mt-10 text-center text-gray-600">
            Loading reward games...
          </p>

        ) : settingsError ? (

          <p className="mt-10 text-center text-red-600">
            {settingsError}
          </p>

        ) : (

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Lucky Spin */}

            {gameSettings?.spin_enabled && (
              <GameCard
                game="spin"
                title="Lucky Spin"
                description="Give the wheel a try and discover which reward awaits you."
                emoji="🎡"
                buttonText="Try Lucky Spin"
                result={results.spin}
                error={errors.spin}
                loadingGame={loadingGame}
                onPlay={handlePlay}
                rewards={gameSettings?.rewards}
                isSpinning={isSpinning}
                wheelRotation={wheelRotation}
              />
            )}

            {/* Scratch & Win */}

            {gameSettings?.scratch_enabled && (
              <GameCard
                game="scratch"
                title="Scratch & Win"
                description="Reveal your reward and see whether you've won a discount coupon."
                emoji="🎁"
                buttonText="Reveal My Reward"
                result={results.scratch}
                error={errors.scratch}
                loadingGame={loadingGame}
                onPlay={handlePlay}
                rewards={gameSettings?.rewards}
                isSpinning={false}
                wheelRotation={0}
              />
            )}

            {/* Both games disabled */}

            {!gameSettings?.spin_enabled &&
              !gameSettings?.scratch_enabled && (
                <p className="col-span-full text-center text-gray-600">
                  Reward games are currently unavailable.
                  Please check back later.
                </p>
              )}

          </div>
        )}

        {/* Disclaimer */}

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
