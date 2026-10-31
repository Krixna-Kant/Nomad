import { LightField } from "@/components/LightField";
import { NomadFlow } from "@/components/NomadFlow";
import { PinWall } from "@/components/PinWall";
import { SiteNav } from "@/components/SiteNav";

export default function Home() {
  return (
    <div className="page" id="top">
      <div className="sky" aria-hidden="true">
        <LightField />
      </div>
      <SiteNav />
      <main className="container">
        <section className="hero" id="about">
          <figure className="hero-shot" data-slot="hero">
            <img
              src="/media/nomad-viewpoint.png"
              alt="A traveler on a hill looking toward a red bridge and a new city"
              width={1600}
              height={1067}
            />
          </figure>
          <div className="hero-copy">
            <h1>Your taste travels.</h1>
            <p>Nomad finds the next-city version of what you already love.</p>
            <a className="btn" href="#try">
              Try yours
            </a>
          </div>
        </section>

        <section className="story" id="why">
          <div className="story-lead">
            <h2>Why I built this</h2>
            <p>
              A move keeps the job, the lease, the flight. It does not keep the Tuesday table, the
              bookstore that stays open late, or the room where the band is close enough to talk to.
              The new city has a thousand places and no memory of you.
            </p>
          </div>
          <ol className="story-pains">
            <li>
              <strong>The routine stays behind</strong>
              <p>
                Students, remote workers, and anyone changing cities lose the small loop that made a
                week feel like theirs. Maps cannot pack a cafe.
              </p>
            </li>
            <li>
              <strong>Popular is a bad guide</strong>
              <p>
                Top lists are written for visitors. They do not know you wanted a quiet room for work,
                or a small crowd, or a place that is still open after the office.
              </p>
            </li>
            <li>
              <strong>A list is not a life</strong>
              <p>
                Ten pins with no regard for your evenings, what you can spend, or whether you came to
                meet people or to be left alone, is not a landing. It is homework.
              </p>
            </li>
          </ol>
          <p className="story-close">
            Nomad starts from the places that already felt like home, then asks Qloo what else shares
            that taste in the city you are actually moving to.
          </p>
        </section>

        <section className="how" id="how">
          <h2>How Qloo does the work</h2>
          <p className="how-lead">
            You talk about your life. Nomad stores that as structured answers. Qloo only receives the
            real places it can recognize.
          </p>
          <ol>
            <li>
              <strong>Places, not checkboxes</strong>
              <p>
                Search a cafe, a venue, a bookstore. A match becomes a Qloo entity, with an id and the
                culture already attached to it. A sentence alone is not sent off to be guessed.
              </p>
            </li>
            <li>
              <strong>The taste graph</strong>
              <p>
                Qloo connects that entity to neighboring signals: the music, the crowd, the kind of
                room. Liking one cafe is not a request for every cafe in the new city.
              </p>
            </li>
            <li>
              <strong>A transplant</strong>
              <p>
                Those entity ids are what we ask with. Qloo returns places in the destination that
                share the affinity. Hotels and pure tourist hits are dropped.
              </p>
            </li>
            <li>
              <strong>You check the reading</strong>
              <p>
                Before any map, you see the signals we caught. If they are wrong, edit them. The week
                after that only uses days you said you are free.
              </p>
            </li>
          </ol>
        </section>

        <section className="try" id="try">
          <h2>Try yours</h2>
          <NomadFlow />
        </section>

        <PinWall />

        <footer className="site-foot">
          <div>
            <p className="wordmark">Nomad</p>
            <p>Taste transplant. No account. Powered by Qloo.</p>
          </div>
          <ul className="foot-links">
            <li>
              <a href="#why">Why</a>
            </li>
            <li>
              <a href="#how">How it works</a>
            </li>
            <li>
              <a href="#try">Try yours</a>
            </li>
            <li>
              <a href="#wall">Pins</a>
            </li>
          </ul>
        </footer>
      </main>
    </div>
  );
}
