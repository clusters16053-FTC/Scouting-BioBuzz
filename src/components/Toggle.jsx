import Segmented from './Segmented.jsx'

const YES_NO = [
  { value: false, label: 'Não' },
  { value: true, label: 'Sim', tone: 'good' },
]

/** Pergunta de sim/não com dois botões grandes. */
export default function Toggle({ label, value, onChange }) {
  return <Segmented label={label} value={value} options={YES_NO} onChange={onChange} />
}
