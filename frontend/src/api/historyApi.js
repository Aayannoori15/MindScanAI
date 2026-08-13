export async function fetchHistory(token) {
  const res = await fetch("/api/history/sessions", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("history failed");
  return res.json();
}

export async function fetchSession(id) {
  const res = await fetch(`/api/history/sessions/${id}`);
  if (!res.ok) throw new Error("session failed");
  return res.json();
}
