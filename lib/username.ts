// Reglas del nombre de usuario, en un solo sitio.

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

/** Espera entre cambios de nombre. El primero (desde vacío) no cuenta. */
export const USERNAME_COOLDOWN_DAYS = 7;

/** Días que faltan para poder cambiarlo de nuevo (0 = ya puede). */
export function cooldownDaysLeft(changedAt: string | null | undefined): number {
  if (!changedAt) return 0;
  const elapsedMs = Date.now() - new Date(changedAt).getTime();
  const leftMs = USERNAME_COOLDOWN_DAYS * 86400_000 - elapsedMs;
  return leftMs <= 0 ? 0 : Math.ceil(leftMs / 86400_000);
}
