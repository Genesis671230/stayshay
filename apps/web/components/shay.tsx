/**
 * Shay — the Stayshay assistant and brand character: a soft, breathing green blob (no tail, not a circle)
 * with two glowing capsule eyes. States:
 *   idle      blinks, glances around, the outline slowly morphs, the glow pulses
 *   talking   eyes bounce in rhythm
 *   thinking  eyes look up and to the side, the blob morphs faster
 *   happy     eyes squint into smiles (used for greetings)
 * Pure CSS (keyframes in globals.css), so it renders anywhere without images.
 */
export type ShayMood = "idle" | "talking" | "thinking" | "happy";

export function Shay({ size = 64, mood = "idle", glow = true, className = "" }: { size?: number; mood?: ShayMood; glow?: boolean; className?: string }) {
  return (
    <span className={`shay2 shay2-${mood} ${className}`} style={{ width: size, height: size, ["--s" as string]: `${size}px` }} role="img" aria-label="Shay, the Stayshay assistant">
      {glow && <span className="shay2-glow" aria-hidden />}
      <span className="shay2-body" aria-hidden>
        <span className="shay2-shine" />
        <span className="shay2-eyes">
          <span className="shay2-eye" />
          <span className="shay2-eye" />
        </span>
      </span>
    </span>
  );
}
