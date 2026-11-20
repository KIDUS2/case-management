import { t } from '../i18n.js'

export const STAGES = ['Received', 'With the diocese', 'Being handled', 'Finished']

/** Four steps from "received" to "finished". Used on the public page and on the case page, so everyone sees the same story. */
export default function Journey({ stage, dark }) {
  return (
    <ol className={'tsteps' + (dark ? ' dark' : '')} aria-label={t('Progress')}>
      {STAGES.map((s, i) => <li key={s} className={i < stage ? 'past' : i === stage ? 'now' : ''} aria-current={i === stage ? 'step' : undefined}><i>{i < stage ? '✓' : i + 1}</i><span>{t(s)}</span></li>)}
    </ol>
  )
}

/** Which of the four steps a case is on. */
export const stageOf = (status, awaitingReview) => (awaitingReview ? 0 : status === 'OPEN' ? 1 : status === 'RESOLVED' ? 3 : 2)
