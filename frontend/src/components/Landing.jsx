import Prefs from './Prefs.jsx'

const FEATURES = [
  ['📝', 'Register a case in minutes', 'Record who came, who it is about and what happened. A short code is created so anyone at the desk can find the case again.'],
  ['🏢', 'Send issues to the right department', 'Each issue goes to HR, Finance, Management or Legal, with a return date. The department sees it in its own inbox.'],
  ['🔔', 'Everyone is told at once', 'When a department resolves an issue, the person who registered it and the administrator are notified in the app.'],
  ['🪪', 'Employee directory and ID cards', 'A 12-digit employee ID, photo, spiritual and secular education, service history and a printable card with a QR code.'],
  ['🔒', 'Each person sees only their cases', 'Cases open only to the people who registered them, the departments they were sent to, and anyone the administrator adds.'],
  ['📊', 'Reports for the diocese', 'Cases per day, by status, by department and by church, so the diocese can see where help is needed.'],
]

/** The first page people see: what the platform is for, and one clear way in. */
export default function Landing({ onLogin }) {
  return (
    <div className="landing">
      <header className="lhead">
        <div className="lbrand"><img src="/logo.png" alt="" /><span>Addis Ababa Diocese</span></div>
        <div className="lright"><Prefs /><button className="btn sm lbtn" onClick={onLogin}>Login</button></div>
      </header>

      <section className="lhero">
        <div className="seal-wrap"><img className="lseal" src="/logo.png" alt="Ethiopian Orthodox Tewahedo Church – Addis Ababa Diocese" /></div>
        <p className="lkicker">Ethiopian Orthodox Tewahedo Church</p>
        <h1>Addis Ababa Diocese Case Desk</h1>
        <p className="lam">የአዲስ አበባ ሀገረ ስብከት የጉዳይ አስተዳደር</p>
        <p className="llead">One place to receive, follow and close the cases that reach the diocese from its churches.</p>
        <div className="lcta">
          <button className="btn lbtn big" onClick={onLogin}>Login to the platform</button>
          <a className="btn ghost lbtn" href="#offers">What the platform offers</a>
        </div>
      </section>

      <section className="loffers" id="offers">
        <h2>What the platform offers</h2>
        <div className="lgrid">
          {FEATURES.map(([icon, title, text]) => (
            <article className="lcard" key={title}>
              <span className="licon">{icon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lband">
        <div>
          <h2>Ready to continue?</h2>
          <p>Sign in with the account the administrator gave you.</p>
        </div>
        <button className="btn gold big" onClick={onLogin}>Login to the platform</button>
      </section>

      <footer className="lfoot">© {new Date().getFullYear()} Addis Ababa Diocese · የአዲስ አበባ ሀገረ ስብከት</footer>
    </div>
  )
}
