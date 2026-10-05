/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Presente solo en /admin y /api/admin cuando la sesión es válida. */
    admin?: import('./lib/auth').AdminSession;
  }
}
