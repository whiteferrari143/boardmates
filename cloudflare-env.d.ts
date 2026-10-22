declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    /** Group code that unlocks private games (set as a Worker secret). Unset means private games stay locked. */
    PRIVATE_GAME_CODE?: string;
  }
}
