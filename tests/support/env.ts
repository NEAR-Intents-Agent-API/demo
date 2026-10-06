export function requireTestEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required; copy tests/integration/.env.example to tests/integration/.env`,
    );
  }
  return value;
}
