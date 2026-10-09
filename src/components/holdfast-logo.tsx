// The Holdfast mark (a voice-note bubble) plus the wordmark. Shared by the
// landing page and the legal pages; styled by the parent's `.logo` class.
export function HoldfastLogo() {
  return (
    <>
      <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M4 4h20a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H10l-4 5 .4-5H4a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
          transform="translate(0,1)"
          fill="#B4552D"
        />
        <g stroke="#FBF7F2" strokeWidth="1.9" strokeLinecap="round">
          <path d="M6.5 13v0.2M10 11v4.4M13.5 8.6v9.2M17 10.4v5.6M20.5 12.4v1.6" />
        </g>
      </svg>
      Holdfast
    </>
  );
}
