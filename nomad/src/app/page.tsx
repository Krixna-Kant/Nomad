import { NomadFlow } from "@/components/NomadFlow";
import { StatusProbe } from "@/components/StatusProbe";

export default function Home() {
  return (
    <div className="page">
      <header className="topbar">
        <p className="wordmark">Nomad</p>
        <StatusProbe />
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">Taste transplant</p>
          <h1>
            First the old city.
            <em> Then the new one.</em>
          </h1>
          <p className="hero-copy">
            Tell Nomad what made home feel like home. We use Qloo&apos;s
            cultural graph to find the equivalent cafes, rooms, and rituals in
            the city you just landed in.
          </p>
        </section>

        <NomadFlow />
      </main>
    </div>
  );
}
