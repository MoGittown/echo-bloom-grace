import { Navigate, useLocation, useParams } from 'react-router-dom';

/** Alte URLs /s/{slug}/… → /{slug}/… (301-äquivalent clientseitig). */
export function LegacyStudioRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  if (!slug) return <Navigate to="/" replace />;

  const rest = location.pathname.replace(/^\/s\/([^/]+)/, '/$1');
  return <Navigate to={`${rest}${location.search}${location.hash}`} replace />;
}
