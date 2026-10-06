export function requireTestEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required; copy tests/.env.example to tests/.env`);
  }
  return value;
}
