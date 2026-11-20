/** Grey placeholder rows shown while a list loads, so the page keeps its shape instead of jumping. */
export default function Skeleton({ rows = 4, tall }) {
  return (
    <div className="skel" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div className={'skelrow' + (tall ? ' tall' : '')} key={i}>
          <span className="skelav" />
          <span className="skelln"><i style={{ width: 55 + ((i * 17) % 30) + '%' }} /><i style={{ width: 30 + ((i * 23) % 25) + '%' }} /></span>
        </div>
      ))}
    </div>
  )
}

/** How long a case has been waiting: calm for the first days, yellow after a week, red after two. */
export function Waiting({ since }) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86400000))
  const cls = days >= 14 ? 'late' : days >= 7 ? 'slow' : 'fresh'
  const label = days === 0 ? 'Today' : days === 1 ? '1 day' : days + ' days'
  return <span className={'waiting ' + cls} title="Time since this case was registered">⏳ {label}</span>
}
