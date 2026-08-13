export function sparkColor(key) {
  const map = { depression: "#7c8cff", anxiety: "#F59E0B", stress: "#FB7185" };
  return map[key] || "#00BFA6";
}
