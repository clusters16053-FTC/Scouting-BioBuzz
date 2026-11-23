/**
 * Ícones do app, desenhados num grid de 24×24 com traço de 1,75.
 * Usam currentColor, então pegam a cor do texto onde estiverem.
 *
 * Uso: <Icon name="match" />
 */
const PATHS = {
  // Início: casa com porta
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />
    </>
  ),
  // Partida: cronômetro (os ciclos são medidos no tempo)
  match: (
    <>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V9.5M10 3h4M18.5 7l1.5-1.5" />
    </>
  ),
  // Pit: chave de boca, como no logo
  pit: (
    <>
      <path d="M14.5 4.2a4.5 4.5 0 0 0-5.3 5.9L4 15.3a2 2 0 0 0 2.8 2.8l5.2-5.2a4.5 4.5 0 0 0 5.9-5.3l-2.6 2.6-2.2-.6-.6-2.2z" />
    </>
  ),
  // Dashboard: barras
  dashboard: (
    <>
      <path d="M4 20h16M7 16v-5M12 16V6M17 16v-8" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="12.5" r="3.25" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7 5 11l4 4" />
      <path d="M5 11h9a5 5 0 0 1 0 10h-2" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  play: <path d="M8 5.5v13l10-6.5z" />,
  back: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  alert: (
    <>
      <path d="M12 4 3 19.5h18z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  swap: (
    <>
      <path d="M7 4 4 7l3 3M4 7h12M17 20l3-3-3-3M20 17H8" />
    </>
  ),
}

export default function Icon({ name, size = 24, className = '', title }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}
