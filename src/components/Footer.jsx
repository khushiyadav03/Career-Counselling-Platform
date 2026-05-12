export default function Footer() {
  return (
    <footer className="site-footer">
      <p>
        © {new Date().getFullYear()} Career Compass — React · Vite · Express · JSON persistence · optional
        Gemini.
      </p>
      <p className="footer-sub">Open source portfolio piece: learning paths, job search deep-links, and CareerBot.</p>
    </footer>
  );
}
